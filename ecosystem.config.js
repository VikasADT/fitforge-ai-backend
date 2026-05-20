module.exports = {
  apps: [
    {
      name: 'fitforge-ai-backend',
      script: 'dist/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      restart_delay: 5000,
      autorestart: true,
      watch: false,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      max_restarts: 20,
      min_uptime: '10s',
      max_memory_restart: '512M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
