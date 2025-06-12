import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import { prisma } from '../prisma/client.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { PLAN_FEATURES } from '../utils/planFeatures.js';

const router = express.Router();

// Multer setup for resume uploads
const resumeStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(process.cwd(), 'uploads', 'resumes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage: resumeStorage,
  fileFilter(req, file, cb) {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf, .doc, .docx allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.get('/features', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        subscription: true,
      },
    });

    if (!user || !user.subscription?.type) {
      return res.status(403).json({ message: 'No active subscription' });
    }

    const planType = user.subscription.type;
    const features = PLAN_FEATURES[planType] || {};

    // console.log(features);

    const formattedFeatures = Object.entries(features).map(([key, val]) => ({
      feature: key,
      level: val.level,
      quota: val.quota,
    }));

    return res.json({ plan: planType, features: formattedFeatures });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        name: true,
        email: true,
        mobile: true,
        bio: true,
        designation: true,
        subscription: {
          select: {
            type: true,
          },
        },
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { fileUrl: true },
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      ...user,
      resumeUrl: user.resumes[0]?.fileUrl || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, bio, designation } = req.body;
    if (!name || !mobile || !bio || !designation) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, mobile, bio, designation },
      select: {
        name: true,
        email: true,
        mobile: true,
        bio: true,
        designation: true,
        subscription: {
          select: {
            type: true,
          },
        },
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { fileUrl: true },
        },
      },
    });

    return res.json({
      ...updated,
      resumeUrl: updated.resumes[0]?.fileUrl || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const userId = req.user.id;
    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    const oldResume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (oldResume) {
      const oldPath = path.join(process.cwd(), oldResume.fileUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

      await prisma.resume.delete({ where: { id: oldResume.id } });
    }

    await prisma.resume.create({
      data: {
        userId,
        fileUrl: resumeUrl,
      },
    });

    return res.json({ resumeUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to upload resume' });
  }
});

router.delete('/resume', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const resume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!resume) return res.status(404).json({ message: 'No resume to delete' });

    const filePath = path.join(process.cwd(), resume.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.resume.delete({ where: { id: resume.id } });

    return res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to delete resume' });
  }
});

router.get('/plans', authenticateToken, async (req, res) => {
 const plans = PLAN_FEATURES;
  const formattedPlans = Object.entries(plans).map(([key, val]) => ({
    plan: key,
    features: Object.keys(val).map(feature => ({
      feature,
      level: val[feature].level,
      quota: val[feature].quota,
    })),
  }));

  return res.json(formattedPlans);
});

router.put('/subscription', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ['FREE', 'PRO', 'ENTERPRISE'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }

    const sub = await prisma.subscription.findUnique({
      where: { type: plan },
    });

    if (!sub) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { subscriptionId: sub.id },
    });

    return res.json({ plan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update subscription plan' });
  }
});

router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        interviewId: true,
        insights: true,
        createdAt: true,
        interview: {
          select: {
            type: true,
            createdAt: true,
          },
        },
      },
    });

    const formatted = reports.map(report => ({
      id: report.id,
      interviewId: report.interviewId,
      type: report.interview?.type || 'N/A',
      date: report.createdAt,
      insights: (() => {
        try {
          return JSON.parse(report.insights);
        } catch {
          return { summary: report.insights };
        }
      })()
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Error fetching reports:', err);
    return res.status(500).json({ message: 'Failed to fetch reports' });
  }
});


export default router;
