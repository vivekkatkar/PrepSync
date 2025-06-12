// seed.js
import { PrismaClient } from '@prisma/client';
import { PLAN_FEATURES } from '../utils/planFeatures.js';
const prisma = new PrismaClient();

const convertPlanFeaturesToArray = (planFeaturesObj) => {
  return Object.entries(planFeaturesObj).map(([planType, features]) => ({
    type: planType,
    features: Object.entries(features).map(([featureName, { level, quota }]) => {
      const featureObj = { feature: featureName, level };
      if (quota !== null && quota !== undefined) {
        featureObj.quota = quota;
      }
      return featureObj;
    }),
  }));
};


async function main() {
  const plans = convertPlanFeaturesToArray(PLAN_FEATURES);

  for (const plan of plans) {
    console.log(`Processing plan: ${plan.type}`);
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

    await prisma.planFeature.deleteMany({ where: { subscriptionId: subscription.id } });

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
