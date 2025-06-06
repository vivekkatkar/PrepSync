// services/aiInterviewWebsocket.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../prisma/client.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const sessions = new Map();

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function startSession(ws, userId, params) {
  const { type, domain, company, jobDesc } = params;

  let usage = await prisma.userFeatureUsage.findFirst({
    where: {
      userId: userId,
      feature: 'AI_INTERVIEW',
    },
  });

  if (usage) {
    usage = await prisma.userFeatureUsage.update({
      where: {
        id: usage.id,
      },
      data: {
        usedCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  } else {
    usage = await prisma.userFeatureUsage.create({
      data: {
        userId: userId,
        feature: 'AI_INTERVIEW',
        usedCount: 1,
        lastUsedAt: new Date(),
      },
    });
  }

  const contextPrompt = `You are a professional technical interviewer. Start with a friendly greeting and ask the candidate to introduce themselves. Wait for their response.`;

  let roleInfo = `Interview type: ${type || 'General'}`;
  if (domain) roleInfo += `\nDomain: ${domain}`;
  if (company) roleInfo += `\nCompany: ${company}`;
  if (jobDesc) roleInfo += `\nJob Description: ${jobDesc}`;

  const fullPrompt = `${contextPrompt}\n\n${roleInfo}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(fullPrompt);
  const aiMessage = await result.response.text();

  const interview = await prisma.interview.create({
    data: {
      userId,
      type: type || 'General',
      aiBased: true,
    },
  });

  sessions.set(ws, {
    userId,
    interviewId: interview.id,
    history: [{ role: 'ai', content: aiMessage }],
    fullConversation: [{ question: aiMessage, answer: null }]
  });

  ws.send(JSON.stringify({ type: 'question', content: aiMessage }));
}

export async function handleAnswer(ws, userAnswer) {
  const session = sessions.get(ws);
  if (!session) {
    ws.send(JSON.stringify({ type: 'error', message: 'Session not found.' }));
    return;
  }

  const { userId, interviewId, history, fullConversation } = session;
  const lastQuestion = history.at(-1)?.content || '';

  history.push({ role: 'user', content: userAnswer });

  const prompt = `You're conducting a technical interview.\n\nRespond in this format:\nFeedback: <feedback>\nQuestion: <next question>`;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(
    `${prompt}\n\nPrevious Question: "${lastQuestion}"\nCandidate's Answer: "${userAnswer}"`
  );

  const aiReply = await result.response.text();
  const feedbackMatch = aiReply.match(/Feedback:(.*)\nQuestion:/s);
  const questionMatch = aiReply.match(/Question:(.*)/s);

  const feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
  const nextQuestion = questionMatch ? questionMatch[1].trim() : aiReply.trim();

  fullConversation[fullConversation.length - 1].answer = userAnswer;
  fullConversation.push({ question: nextQuestion, answer: null });

  // NOTE: We are intentionally NOT saving feedback for each turn to the Report here.
  // The full, summarized report will be generated at finalizeInterview.
  // This avoids cluttering the reports table with intermediate feedbacks.

  history.push({ role: 'ai', content: nextQuestion });
  sessions.set(ws, { userId, interviewId, history, fullConversation });

  ws.send(JSON.stringify({ type: 'question', content: nextQuestion }));
}

// --- START OF MODIFIED FINALIZE INTERVIEW ---
export async function finalizeInterview(ws) {
  const session = sessions.get(ws);
  if (!session) return;

  const { userId, interviewId, fullConversation } = session;

  // Prepare the conversation for AI analysis
  const conversationText = fullConversation
    .map((entry) => {
      let text = `Q: ${entry.question}`;
      if (entry.answer !== null) {
        text += `\nA: ${entry.answer}`;
      }
      return text;
    })
    .join('\n\n');

  const reportPrompt = `Based on the following interview conversation, provide a detailed interview report in JSON format.
  
  Conversation:
  """
  ${conversationText}
  """

  The JSON structure should be:
  {
    "overall_feedback": "A summary of the candidate's overall performance.",
    "rating": "An integer rating out of 5, where 5 is excellent.",
    "strengths": ["List of strengths identified in the interview."],
    "areas_for_improvement": ["List of specific areas where the candidate can improve."],
    "technical_feedback": {
      "data_structures_algorithms": "Feedback on DSA concepts, if covered.",
      "system_design": "Feedback on system design concepts, if covered.",
      "programming_language_proficiency": "Feedback on specific language use, if applicable."
    },
    "communication_and_soft_skills": "Feedback on communication, problem-solving approach, clarity, etc.",
    "topics_covered": ["List of key technical topics discussed."],
    "sample_questions_to_revisit": [
      {
        "question": "Original question that needs revisiting.",
        "reason": "Why it needs revisiting (e.g., incomplete answer, incorrect approach)."
      }
    ]
  }

  Ensure the output is valid JSON and only the JSON object. Do not include any preambles or explanations outside the JSON.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Use a capable model
    const result = await model.generateContent(reportPrompt);
    let aiReportText = await result.response.text();

    // Attempt to clean and parse the JSON
    let parsedReport;
    try {
      // Remove any leading/trailing backticks or "json" labels if the AI adds them
      aiReportText = aiReportText.replace(/```json\s*|```/g, '').trim();
      parsedReport = JSON.parse(aiReportText);
    } catch (jsonError) {
      console.error('Failed to parse AI report JSON:', jsonError);
      // Fallback if AI doesn't return perfect JSON
      parsedReport = {
        overall_feedback: "AI failed to generate a structured report. Raw output: " + aiReportText.substring(0, 200) + "...",
        rating: 3, // Default rating
        strengths: [],
        areas_for_improvement: [],
        technical_feedback: {},
        communication_and_soft_skills: "Could not parse detailed communication feedback.",
        topics_covered: [],
        sample_questions_to_revisit: []
      };
    }

    await prisma.report.create({
      data: {
        userId,
        interviewId,
        insights: JSON.stringify(parsedReport), // Store the structured AI report
      },
    });

  } catch (err) {
    console.error('Error generating AI report:', err);
    // Fallback if AI generation fails entirely
    const fallbackReport = {
      overall_feedback: "An error occurred while generating the AI report. Please review the conversation.",
      rating: null,
      strengths: [],
      areas_for_improvement: [],
      technical_feedback: {},
      communication_and_soft_skills: null,
      topics_covered: [],
      sample_questions_to_revisit: [],
      conversation: fullConversation, // Still include conversation
    };
    await prisma.report.create({
      data: {
        userId,
        interviewId,
        insights: JSON.stringify(fallbackReport),
      },
    });
  }

  sessions.delete(ws);
}
// --- END OF MODIFIED FINALIZE INTERVIEW ---

export function endSession(ws) {
  sessions.delete(ws);
}