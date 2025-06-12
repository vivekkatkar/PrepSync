export const PLAN_FEATURES = {
  FREE: {
    AI_INTERVIEW: { level: 'BASIC', quota: 1 },
    ONE_TO_ONE_INTERVIEW: { level: 'BASIC', quota: 100 },
    RESUME_ANALYZER: { level: 'BASIC', quota: 1 },
    INTERVIEW_RECORDING: { level: 'BASIC', quota: 5 },
  },
  PRO: {
    AI_INTERVIEW: { level: 'ADVANCED', quota: 10 },
    ONE_TO_ONE_INTERVIEW: { level: 'ADVANCED', quota: 10 },
    RESUME_ANALYZER: { level: 'ADVANCED', quota: 5 },
    INTERVIEW_RECORDING: { level: 'BASIC', quota: null },
    RESUME_INTEGRATION: { level: 'FULL', quota: null },
  },
  ENTERPRISE: {
    AI_INTERVIEW: { level: 'UNLIMITED', quota: null },
    ONE_TO_ONE_INTERVIEW: { level: 'ADVANCED', quota: 10 },
    AI_INTERVIEW_ANALYSIS: { level: 'FULL', quota: null },
    INTERVIEW_RECORDING: { level: 'FULL', quota: null },
    RESUME_ANALYZER: { level: 'FULL', quota: null },
    INTERVIEW_SCHEDULING: { level: 'FULL', quota: null },
    RESUME_INTEGRATION: { level: 'FULL', quota: null },
  },
};
