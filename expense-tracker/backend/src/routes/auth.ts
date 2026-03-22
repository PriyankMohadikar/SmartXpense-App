import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { redis, SESSION_TTL, getSessionKey } from '../lib/redis';
import { createError } from '../middleware/error';
import { upload } from '../middleware/upload';
import { uploadToCloudinary } from '../lib/cloudinary';

const router = express.Router();

// POST /api/auth/register
router.post('/register', upload.single('avatar'), async (req, res) => {
  const { name, email, password, currency } = req.body;

  if (!name || !email || !password) {
    throw createError('Name, email, and password are required', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw createError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  let avatar_url: string | undefined;
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'smartxpense/avatars');
    avatar_url = result.url;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      avatar_url,
      currency: currency || 'INR',
    },
    select: { id: true, name: true, email: true, avatar_url: true, currency: true, created_at: true },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  // Store session in Redis
  await redis.setex(getSessionKey(token), SESSION_TTL, JSON.stringify({ userId: user.id }));

  // Send Welcome Email
  try {
    const nodemailer = require('nodemailer');
    const { WelcomeEmail } = require('../emails/WelcomeEmail');
    const ReactDOMServer = require('react-dom/server');
    const React = require('react');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(WelcomeEmail, { userName: user.name })
    );

    const info = await transporter.sendMail({
      from: `"SmartXpense" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Welcome to SmartXpense! 🎉',
      html,
    });

    console.log(`[Auth] Welcome email sent to ${user.email} (ID: ${info.messageId})`);
  } catch (err) {
    console.error(`[Auth] Failed to send welcome email to ${user.email}:`, err);
  }

  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw createError('Invalid credentials', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createError('Invalid credentials', 401);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  await redis.setex(getSessionKey(token), SESSION_TTL, JSON.stringify({ userId: user.id }));

  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    await redis.del(getSessionKey(token));
  }
  res.json({ message: 'Logged out successfully' });
});

export default router;
