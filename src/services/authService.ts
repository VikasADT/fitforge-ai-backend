import prisma from '../prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export const registerUser = async ({
  name,
  email,
  password
}: {
  name: string;
  email: string;
  password: string;
}) => {
  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    return null;
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hash
    }
  });

  const { password: _password, ...safeUser } = user;

  return safeUser;
};

export const generateToken = (user: { id: string; email: string }) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email
    },
    config.jwtSecret as jwt.Secret,
    {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn']
    }
  );
};

export const loginUser = async ({
  email,
  password
}: {
  email: string;
  password: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return null;
  }

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) {
    return null;
  }

  return generateToken({ id: user.id, email: user.email });
};