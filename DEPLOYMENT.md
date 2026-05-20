# FitForge AI Backend Production Deployment

This document describes how to deploy the FitForge AI backend to Ubuntu 24.04 on AWS EC2 using Node.js, Prisma, PostgreSQL, PM2, and Nginx with TLS.

## Overview

- Application: `fitforge-ai-backend`
- Domain: `api.fitforgeai.in`
- Stack: Node.js + Express + TypeScript + Prisma + PostgreSQL + PM2 + Nginx
- Cloud: AWS EC2 Ubuntu 24.04
- SSL: Let's Encrypt / Certbot

---

## 1. EC2 Setup

### 1.1 Launch Ubuntu 24.04 Instance

1. Open the AWS EC2 console.
2. Launch a new instance with `Ubuntu Server 24.04 LTS`.
3. Choose instance type: `t3.small` or `t3.medium` for production.
4. Use at least 20 GB storage and enable EBS encryption if required.
5. Configure a security group with inbound rules:
   - `SSH 22` from your IP only
   - `HTTP 80` from anywhere
   - `HTTPS 443` from anywhere
   - `Custom TCP 5000` from `127.0.0.1/32` or no public access if only Nginx proxies to it
6. Attach a public IP or Elastic IP.
7. Create or attach an SSH key pair.

### 1.2 Connect to EC2

```bash
ssh -i ~/path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

If your key is not readable, run:

```bash
chmod 400 ~/path/to/your-key.pem
```

---

## 2. Ubuntu System Preparation

### 2.1 Update packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install required packages

```bash
sudo apt install -y curl gnupg2 ca-certificates lsb-release software-properties-common
```

### 2.3 Add NodeSource for Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2.4 Install build tools

```bash
sudo apt install -y git build-essential
```

### 2.5 Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

---

## 3. PostgreSQL Setup

### 3.1 Create the database user and database

```bash
sudo -u postgres createuser --interactive
# choose a username like fitforge_user

sudo -u postgres createdb fitforge_db
```

### 3.2 Set a strong password

```bash
sudo -u postgres psql
ALTER USER fitforge_user WITH PASSWORD 'YourStrongDatabasePassword';
GRANT ALL PRIVILEGES ON DATABASE fitforge_db TO fitforge_user;
\q
```

### 3.3 Optional: adjust PostgreSQL listen address

If you only need local access, keep default `listen_addresses = 'localhost'`.

If remote access is required, edit `/etc/postgresql/15/main/postgresql.conf` and set:

```ini
listen_addresses = 'localhost'
```

Then restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

## 4. Deploy Application Code

### 4.1 Clone repository

```bash
cd /opt
sudo git clone <YOUR_REPO_URL> fitforge-ai-backend
cd fitforge-ai-backend
```

### 4.2 Install Node modules

```bash
npm install
```

### 4.3 Build TypeScript

```bash
npm run build
```

### 4.4 Generate Prisma client

```bash
npx prisma generate
```

---

## 5. Environment Variables

Create a `.env` file at the repo root with these production values:

```bash
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://fitforge_user:YourStrongDatabasePassword@localhost:5432/fitforge_db?schema=public
JWT_SECRET=ReplaceWithStrongJwtSecret
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-...
FRONTEND_URL=https://your-frontend-domain.com
UPLOAD_DIR=uploads
```

### 5.1 Permissions

Ensure the upload folder exists and is writable:

```bash
mkdir -p uploads
sudo chown -R ubuntu:ubuntu uploads
chmod 750 uploads
```

---

## 6. PM2 Setup

### 6.1 Install PM2 globally

```bash
sudo npm install -g pm2@latest
```

### 6.2 Start application with PM2

```bash
pm run build
pm2 start ecosystem.config.js --env production
```

### 6.3 Persist PM2 on reboot

```bash
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

### 6.4 Check PM2 status

```bash
pm2 ls
pm2 describe fitforge-ai-backend
```

---

## 7. Nginx Setup

### 7.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 7.2 Enable proxy headers

Create or update `/etc/nginx/sites-available/fitforgeai` with the Nginx config below.

### 7.3 Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/fitforgeai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL Setup (Let's Encrypt)

### 8.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Generate certificate for your domain

```bash
sudo certbot --nginx -d api.fitforgeai.in
```

### 8.3 Automatic renewal test

```bash
sudo certbot renew --dry-run
```

### 8.4 Renewal cron job

Certbot installs a systemd timer automatically on Ubuntu.
Verify with:

```bash
systemctl list-timers | grep certbot
```

If you want a fallback cron job:

```bash
sudo crontab -e
```

Add:

```cron
0 3 * * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
```
```

---

## 9. Nginx Configuration File

Put this configuration in `/etc/nginx/sites-available/fitforgeai`:

```nginx
map $http_upgrade $connection_upgrade {
  default upgrade;
  '' close;
}

server {
  listen 80;
  server_name api.fitforgeai.in;

  location /.well-known/acme-challenge/ {
    root /var/www/html;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl http2;
  server_name api.fitforgeai.in;

  ssl_certificate /etc/letsencrypt/live/api.fitforgeai.in/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.fitforgeai.in/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;
  ssl_ciphers "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256";
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_stapling on;
  ssl_stapling_verify on;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
  add_header X-Content-Type-Options nosniff always;
  add_header X-Frame-Options SAMEORIGIN always;
  add_header Referrer-Policy same-origin always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Content-Security-Policy "default-src 'none'; frame-ancestors 'none'; base-uri 'none';" always;
  add_header X-Download-Options noopen always;
  add_header X-Permitted-Cross-Domain-Policies none always;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript application/xml application/rss+xml image/svg+xml;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_proxied any;

  client_max_body_size 20m;
  proxy_buffering off;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection $connection_upgrade;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Port $server_port;
  proxy_set_header X-Forwarded-Server $host;
  proxy_read_timeout 120s;
  proxy_connect_timeout 60s;
  proxy_send_timeout 120s;
  proxy_cache_bypass $http_upgrade;

  location / {
    proxy_pass http://127.0.0.1:5000;
  }
}
```

---

## 10. Domain Configuration

Set a DNS A record for `api.fitforgeai.in` pointing to the public IPv4 address of your EC2 instance.

- Type: `A`
- Name: `api`
- Value: `<EC2_PUBLIC_IP>`
- TTL: `300`

Wait for DNS propagation before requesting TLS.

---

## 11. Restart / Maintenance Commands

```bash
# Reload PM2 app with latest code
cd /opt/fitforge-ai-backend
git pull origin main
npm install
npm run build
npx prisma generate
pm2 restart fitforge-ai-backend

# Reload Nginx after config changes
sudo nginx -t
sudo systemctl reload nginx

# Restart PM2 service after reboot changes
sudo systemctl restart pm2-ubuntu
```

---

## 12. Troubleshooting

### 12.1 Check PM2 logs

```bash
pm2 logs fitforge-ai-backend --lines 200
pm2 monit
```

### 12.2 Check Nginx status

```bash
sudo systemctl status nginx
sudo nginx -t
sudo tail -n 100 /var/log/nginx/fitforgeai.error.log
```

### 12.3 Verify SSL

```bash
sudo certbot certificates
curl -I https://api.fitforgeai.in/health
```

### 12.4 Check environment and process

```bash
cat .env
pm2 describe fitforge-ai-backend
```

### 12.5 Prisma / database

```bash
docker ps -a  # if using Docker for other services
sudo -u postgres psql -c '\l'
```

---

## 13. Backup Strategy

### 13.1 Backup folder structure

Use a dedicated backup location:

```text
/var/backups/fitforgeai/
├── daily/
├── weekly/
└── archive/
```

### 13.2 Manual backup command

```bash
sudo -u postgres pg_dump -Fc fitforge_db -f /var/backups/fitforgeai/daily/fitforge_db_$(date +%F).dump
```

### 13.3 Restore command

```bash
sudo -u postgres pg_restore -d fitforge_db /var/backups/fitforgeai/daily/fitforge_db_2026-05-20.dump
```

### 13.4 Automate backups with cron

```bash
sudo crontab -e
```

Add this example:

```cron
0 2 * * * /usr/bin/pg_dump -Fc fitforge_db -f /var/backups/fitforgeai/daily/fitforge_db_$(date +\%F).dump
0 3 * * 0 /usr/bin/pg_dump -Fc fitforge_db -f /var/backups/fitforgeai/weekly/fitforge_db_$(date +\%F).dump
30 3 1 * * /usr/bin/pg_dump -Fc fitforge_db -f /var/backups/fitforgeai/archive/fitforge_db_$(date +\%F).dump
```

### 13.5 Retention cleanup script

```bash
sudo find /var/backups/fitforgeai/daily -type f -mtime +14 -delete
sudo find /var/backups/fitforgeai/weekly -type f -mtime +60 -delete
sudo find /var/backups/fitforgeai/archive -type f -mtime +365 -delete
```

---

## 14. Production Monitoring Checklist

- [ ] PM2 app status is `online`
- [ ] `/health` returns `status: ok`
- [ ] Nginx is active and `nginx -t` passes
- [ ] Certbot certificate is valid and auto-renewal works
- [ ] PostgreSQL is accepting local connections
- [ ] Backup files exist under `/var/backups/fitforgeai`
- [ ] Logs are writing to `logs/pm2-out.log`, `logs/pm2-error.log`, and `/var/log/nginx/fitforgeai.*.log`

---

## 15. Health Check Endpoint

The backend exposes a health endpoint at:

```bash
GET https://api.fitforgeai.in/health
```

Expected response:

```json
{
  "status": "ok",
  "uptime": 123.456,
  "environment": "production",
  "timestamp": "2026-05-20T12:34:56.789Z",
  "version": "1.0.0"
}
```
