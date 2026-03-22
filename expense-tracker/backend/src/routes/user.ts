import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/error';
import { upload } from '../middleware/upload';
import { uploadToCloudinary } from '../lib/cloudinary';

const router = express.Router();

// GET /api/user/profile
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatar_url: true, currency: true, monthly_income: true, created_at: true },
  });

  if (!user) throw createError('User not found', 404);
  res.json({ ...user, monthly_income: user.monthly_income ? Number(user.monthly_income) : null });
});

// PUT /api/user/profile
router.put('/profile', authenticate, upload.single('avatar'), async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { name, email, password, currency, monthly_income } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError('User not found', 404);

  // Check email uniqueness if changed
  if (email && email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw createError('Email already in use', 409);
  }

  let hashedPassword: string | undefined;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 12);
  }

  let avatar_url = user.avatar_url ?? undefined;
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'smartxpense/avatars', `avatar-${userId}`);
    avatar_url = result.url;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(hashedPassword && { password: hashedPassword }),
      ...(currency && { currency }),
      ...(monthly_income !== undefined && { monthly_income }),
      avatar_url,
    },
    select: { id: true, name: true, email: true, avatar_url: true, currency: true, monthly_income: true, created_at: true },
  });

  res.json({ ...updated, monthly_income: updated.monthly_income ? Number(updated.monthly_income) : null });
});

export default router;
