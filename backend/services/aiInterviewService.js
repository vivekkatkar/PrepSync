import { prisma } from '../prisma/client.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PLAN_FEATURES } from '../utils/planFeatures.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const checkEligibility = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user || !user.subscription) throw new Error('Subscription not found');

  const plan = user.subscription.type;
  const feature = PLAN_FEATURES[plan]?.AI_INTERVIEW;
  const quota = feature?.quota;

  const usage = await prisma.userFeatureUsage.findFirst({
    where: { userId, feature: 'AI_INTERVIEW' },
  });

  if (quota !== null && (usage?.usedCount || 0) >= quota) {
    throw new Error('Interview quota exhausted');
  }

  return { plan, level: feature.level };
};

// Generate initial AI message for interview start
export const startInterview = async ({ userId, type = 'General', domain, company, jobDesc }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  const plan = user.subscription.type;
  const level = PLAN_FEATURES[plan].AI_INTERVIEW.level;
  const prompt = buildPrompt({ level, type, domain, company, jobDesc });

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const aiMessage = await result.response.text();

  const interview = await prisma.interview.create({
    data: {
      userId,
      type,
      aiBased: true,
    },
  });

  return { aiMessage, interviewId: interview.id };
};

function buildPrompt({ level, type, domain, company, jobDesc }) {
  let prompt = `Conduct a ${level.toLowerCase()} level mock interview.`;
  if (type) prompt += ` Focus on interview type: ${type}.`;
  if (domain) prompt += ` Domain: ${domain}.`;
  if (company) prompt += ` Target company: ${company}.`;
  if (jobDesc) prompt += ` Based on this job description: ${jobDesc}.`;
  return prompt;
}
