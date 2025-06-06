import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; 

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Find or create FREE subscription plan
    let freePlan = await prisma.subscription.findUnique({ where: { type: 'FREE' } });

    if (!freePlan) {
      freePlan = await prisma.subscription.create({
        data: {
          type: 'FREE',
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year validity
        },
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'USER',
        subscriptionId: freePlan.id,
      },
    });

    // Get all features of the free plan
    const planFeatures = await prisma.planFeature.findMany({
      where: { subscriptionId: freePlan.id },
    });

    // Initialize user feature usage for each plan feature
    const usageCreateData = planFeatures.map((pf) => ({
      userId: user.id,
      feature: pf.feature,
      usedCount: 0,
      // lastUsedAt: null by default
    }));

    if (usageCreateData.length > 0) {
      await prisma.userFeatureUsage.createMany({
        data: usageCreateData,
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        subscriptionId: user.subscriptionId,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

  await prisma.user.update({
    where: { id: user.id },
    data: { isOnline: true },
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ message: 'Login successful', token });
});

router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Invalid token format' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { isOnline: false },
    });

    res.json({ message: 'Logout successful' });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});


router.post('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    res.status(401).json({ message: 'Token verification failed' });
  }
});

export default router;