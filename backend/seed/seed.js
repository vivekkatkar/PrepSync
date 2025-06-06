// seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      type: 'FREE',
      features: [
        { feature: 'AI_INTERVIEW', level: 'BASIC', quota: 5 },
        { feature: 'RESUME_ANALYZER', level: 'LIMITED', quota: 10 },
        { feature: 'INTERVIEW_SCHEDULING', level: 'NONE' },
        // Add others as needed...
      ],
    },
    {
      type: 'PRO',
      features: [
        { feature: 'AI_INTERVIEW', level: 'ADVANCED', quota: 50 },
        { feature: 'RESUME_ANALYZER', level: 'FULL' },
        { feature: 'INTERVIEW_SCHEDULING', level: 'FULL' },
        // Add all PRO features...
      ],
    },
    {
      type: 'ENTERPRISE',
      features: [
        { feature: 'AI_INTERVIEW', level: 'UNLIMITED' },
        { feature: 'RESUME_ANALYZER', level: 'UNLIMITED' },
        { feature: 'INTERVIEW_SCHEDULING', level: 'UNLIMITED' },
        { feature: 'DISCUSSION_FORUM', level: 'UNLIMITED' },
        // Add all ENTERPRISE features...
      ],
    },
  ];

  // For each plan, create or find subscription and insert features
  for (const plan of plans) {
    let subscription = await prisma.subscription.findUnique({
      where: { type: plan.type },
    });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          type: plan.type,
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        },
      });
      console.log(`Created subscription plan: ${plan.type}`);
    }

    // Clean existing features for this subscription (optional)
    await prisma.planFeature.deleteMany({ where: { subscriptionId: subscription.id } });

    // Create plan features
    for (const feat of plan.features) {
      await prisma.planFeature.create({
        data: {
          subscriptionId: subscription.id,
          feature: feat.feature,
          level: feat.level,
          quota: feat.quota || null,
        },
      });
      console.log(`Added feature ${feat.feature} to plan ${plan.type}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
