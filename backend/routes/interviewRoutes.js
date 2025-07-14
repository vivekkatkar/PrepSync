import express from 'express';
import { prisma } from '../prisma/client.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { PLAN_FEATURES } from '../utils/planFeatures.js';
import { redis, redisPub } from '../utils/redisClient.js';
import dotenv from 'dotenv';
dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const router = express.Router();

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
    let secondUser;

    // if (type === "ai") {
    //   // AI interview doesn't require another user
    //   scheduledWithUser = null;
    // } else {
    //   // 1-on-1 interview
    //   let availableUsers = [];

    //   if (planType === "FREE") {
    //     availableUsers = await prisma.user.findMany({
    //       where: {
    //         isOnline: true,
    //         id: { not: userId },
    //       },
    //     });
    //   } else {
    //     availableUsers = await prisma.user.findMany({
    //       where: {
    //         isOnline: true,
    //         role: "EXPERT",
    //       },
    //     });
    //   }

    //   if (availableUsers.length === 0) {
    //     console.log("Peer not found");
    //     return res.status(400).json({ message: "No one is currently available for an interview. Please try again later." });
    //   }

    //   const randomIndex = Math.floor(Math.random() * availableUsers.length);
    //   scheduledWithUser = availableUsers[randomIndex].id;
    // }

    if (type !== "ai") {
      const keys = await redis.keys('online:*');
      const onlineUserIds = keys.map(key => key.split(':')[1]).filter(id => id !== userId); // Exclude current user

      if (onlineUserIds.length === 0) {
        return res.status(400).json({ message: "No one is currently available for an interview. Please try again later." });
      }

      console.log(keys);
      console.log(onlineUserIds);
      let candidateUsers = [];

      if (planType === "FREE") {
        candidateUsers = await prisma.user.findMany({
          where: {
            id: { in: onlineUserIds },
            id: { not: userId },
          },
        });
      } else {
        candidateUsers = await prisma.user.findMany({
          where: {
            id: { in: onlineUserIds },
            role: "EXPERT",
          },
        });
      }

      if (candidateUsers.length === 0) {
        return res.status(400).json({ message: "No one is currently available for an interview. Please try again later." });
      }

      const randomIndex = Math.floor(Math.random() * candidateUsers.length);
      scheduledWithUser = candidateUsers[randomIndex].id;
      secondUser = candidateUsers[randomIndex];
    }

    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const meetLink = `${frontendUrl}/interview/${roomId}`;

    const EXPIRY_DURATION_MINUTES = 2; // or 24*60 for 1 day

      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + EXPIRY_DURATION_MINUTES);

      const interview = await prisma.interview.create({
        data: {
          userId,
          scheduledWithId: scheduledWithUser,
          type,
          aiBased: type === "ai",
          roomId,
          meetLink,
          expiryDate,  // ⬅️ Add expiry date
        },
      });

    // const interview = await prisma.interview.create({
    //   data: {
    //     userId,
    //     scheduledWithId: scheduledWithUser,
    //     type,
    //     aiBased: type === "ai",
    //     roomId,
    //     meetLink,
    //   },
    // });

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

     // send notifications to another user 
     await redisPub.publish('interview_notifications', JSON.stringify({
          toUserId: scheduledWithUser,
          fromUser: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          meetLink,
          roomId,
          type,
          message: `📣 A new interview has been scheduled with you.`,
      }));

    // send whatsapp notifications 

    console.log(secondUser);

    await redisPub.publish('whatsapp_notifications', JSON.stringify({
      to: secondUser.mobile,  
      message: `Hi ${secondUser.name}, you have interview request from ${user.name} at ${meetLink}`,
    }));

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

    // const interviews = await prisma.interview.findMany({
    //   where: {
    //     AND: [
    //       {
    //         OR: [
    //           { userId },
    //           { scheduledWithId: userId }
    //         ]
    //       },
    //       {
    //         aiBased: false  // Exclude those where aiBased is true
    //       }
    //     ]
    //   },
    //   orderBy: { createdAt: 'desc' },
    //   include: {
    //     user: {
    //       select: { id: true, name: true, email: true }
    //     },
    //     scheduledWith: {
    //       select: { id: true, name: true, email: true }
    //     }
    //   }
    // });

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
        aiBased: false
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

    if (interview.expiryDate && new Date(interview.expiryDate) < new Date()) {
      return res.status(403).json({ error: 'This interview link has expired.' });
    }

    res.json({ success: true, interview });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

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