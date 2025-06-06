import express from 'express';
import { prisma } from '../prisma/client.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { PLAN_FEATURES } from '../utils/planFeatures.js';
import dotenv from 'dotenv';
dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const router = express.Router();

// router.post("/create", authenticateToken, async (req, res) => {
//   try {
//     const { type } = req.body;
//     const userId = req.user.id;

//     if (!type) return res.status(400).json({ error: "Interview type is required" });

//     const aiFeature = type === "ai" ? "AI_INTERVIEW" : "ONE_TO_ONE_INTERVIEW";

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: { subscription: true, featureUsages: true },
//     });

//     if (!user || !user.subscription?.type) {
//       return res.status(403).json({ error: "Subscription not found" });
//     }

//     const planType = user.subscription.type; // FREE, PRO, ENTERPRISE
//     const planFeatures = PLAN_FEATURES[planType];
//     const featureData = planFeatures[aiFeature];

//     if (!featureData) {
//       return res.status(403).json({ error: `Your plan does not allow ${aiFeature.replaceAll("_", " ").toLowerCase()}` });
//     }

//     const quota = featureData.quota;
//     const usage = user.featureUsages.find(f => f.feature === aiFeature);
//     const usedCount = usage?.usedCount ?? 0;

//     if (quota !== null && usedCount >= quota) {
//       return res.status(403).json({ error: "Quota exceeded. Upgrade plan to access more interviews." });
//     }

//     let scheduledWithUser = null;

//     if (planType === "FREE") {
//       const others = await prisma.user.findMany({
//         where: {
//           isOnline: true,
//           id: { not: userId },
//         },
//         take: 1,
//       });

//       console.log(others);
//       scheduledWithUser = others[0]?.id ?? null;

//     } else {
//       const experts = await prisma.user.findMany({
//         where: {
//           isOnline: true,
//           role: "EXPERT",
//         },
//         take: 1,
//       });
//       scheduledWithUser = experts[0]?.id ?? null;
//     }

//     // 3. Create Interview
//     const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
//     // const meetLink = `http://localhost:5173/interview/${roomId}`;
//     const meetLink = `${frontendUrl}/interview/${roomId}`;


//     const interview = await prisma.interview.create({
//       data: {
//         userId,
//         scheduledWithId: scheduledWithUser,
//         type,
//         aiBased: type === "ai",
//         roomId,
//         meetLink,
//       },
//     });

//     // 4. Update usage
//     if (usage) {
//       await prisma.userFeatureUsage.update({
//         where: { userId_feature: { userId, feature: aiFeature } },
//         data: { usedCount: { increment: 1 }, lastUsedAt: new Date() },
//       });
//     } else {
//       await prisma.userFeatureUsage.create({
//         data: { userId, feature: aiFeature, usedCount: 1, lastUsedAt: new Date() },
//       });
//     }

//     res.status(200).json({
//       ...interview,
//       planType,
//       allowed: {
//         level: featureData.level,
//         quota: quota,
//         used: usedCount + 1,
//       },
//     });
//   } catch (err) {
//     console.error("Interview creation error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

router.post("/create", authenticateToken, async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user.id;

    if (!type) return res.status(400).json({ error: "Interview type is required" });

    const aiFeature = type === "ai" ? "AI_INTERVIEW" : "ONE_TO_ONE_INTERVIEW";

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, featureUsages: true },
    });

    if (!user || !user.subscription?.type) {
      return res.status(403).json({ error: "Subscription not found" });
    }

    const planType = user.subscription.type;
    const planFeatures = PLAN_FEATURES[planType];
    const featureData = planFeatures[aiFeature];

    if (!featureData) {
      return res.status(403).json({ error: `Your plan does not allow ${aiFeature.replaceAll("_", " ").toLowerCase()}` });
    }

    const quota = featureData.quota;
    const usage = user.featureUsages.find(f => f.feature === aiFeature);
    const usedCount = usage?.usedCount ?? 0;

    if (quota !== null && usedCount >= quota) {
      return res.status(403).json({ error: "Quota exceeded. Upgrade plan to access more interviews." });
    }

    let scheduledWithUser = null;

    if (type === "ai") {
      // AI interview doesn't require another user
      scheduledWithUser = null;
    } else {
      // 1-on-1 interview
      let availableUsers = [];

      if (planType === "FREE") {
        availableUsers = await prisma.user.findMany({
          where: {
            isOnline: true,
            id: { not: userId },
          },
        });
      } else {
        availableUsers = await prisma.user.findMany({
          where: {
            isOnline: true,
            role: "EXPERT",
          },
        });
      }

      if (availableUsers.length === 0) {
        console.log("Peer not found");
        return res.status(400).json({ message: "No one is currently available for an interview. Please try again later." });
      }

      const randomIndex = Math.floor(Math.random() * availableUsers.length);
      scheduledWithUser = availableUsers[randomIndex].id;
    }

    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const meetLink = `${frontendUrl}/interview/${roomId}`;

    const interview = await prisma.interview.create({
      data: {
        userId,
        scheduledWithId: scheduledWithUser,
        type,
        aiBased: type === "ai",
        roomId,
        meetLink,
      },
    });

    if (usage) {
      await prisma.userFeatureUsage.update({
        where: { userId_feature: { userId, feature: aiFeature } },
        data: { usedCount: { increment: 1 }, lastUsedAt: new Date() },
      });
    } else {
      await prisma.userFeatureUsage.create({
        data: { userId, feature: aiFeature, usedCount: 1, lastUsedAt: new Date() },
      });
    }

    res.status(200).json({
      ...interview,
      planType,
      allowed: {
        level: featureData.level,
        quota: quota,
        used: usedCount + 1,
      },
    });
  } catch (err) {
    console.error("Interview creation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const interviews = await prisma.interview.findMany({
      where: {
        AND: [
          {
            OR: [
              { userId },
              { scheduledWithId: userId }
            ]
          },
          {
            aiBased: false  // Exclude those where aiBased is true
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        scheduledWith: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(200).json(interviews);
  } catch (err) {
    console.error('Error fetching interviews:', err);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Join an interview room
router.get('/join/:roomId', authenticateToken, async (req, res) => {
  const { roomId } = req.params;

  try {
    const interview = await prisma.interview.findUnique({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!interview) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ success: true, interview });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update recording URL after upload
router.patch('/recording/:roomId', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const { recordingUrl } = req.body;

  try {
    const interview = await prisma.interview.update({
      where: { roomId },
      data: { recordingUrl },
    });

    res.json({ success: true, interview });
  } catch (error) {
    console.error('Error updating recording URL:', error);
    res.status(500).json({ error: 'Failed to update recording URL' });
  }
});

export default router;