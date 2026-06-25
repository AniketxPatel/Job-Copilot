import { GoogleGenAI } from '@google/genai';
import { GenerateRequest } from './types';

// Initialize the Gemini client
// Note: We expect GEMINI_API_KEY to be set in the environment (.env.local)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateJobAnswer(data: GenerateRequest, companySummary: string): Promise<string> {
  const wordLimit = data.length === 'short' ? 50 : data.length === 'long' ? 300 : 150;

  let prompt = '';
  if (data.customPrompt && data.customPrompt.trim()) {
    prompt = `You are an AI career assistant. Write a job application response by following the candidate's custom instructions/template below.

CONTEXT:
- RESUME:
${data.resume}

- JOB DESCRIPTION:
${data.jobDescription || 'Not provided'}

- COMPANY SUMMARY:
${companySummary || 'Not provided'}

- QUESTION:
${data.question}

CUSTOM INSTRUCTIONS / TEMPLATE:
${data.customPrompt}

Write the answer following the custom instructions/template exactly. Do not output any notes, introductions, or tags. Just the final answer.`;
  } else {
    prompt = `You are a world-class career coach and ex-FAANG recruiter who has reviewed 
over 50,000 job applications. Your job is to write application answers that 
get candidates shortlisted.

You will be given:
- A candidate's resume
- A job description  
- A company summary
- The specific application question

YOUR RULES (never break these):

1. ANSWER THE ACTUAL QUESTION ASKED. Do not write a general intro. 
   If they ask about a challenge, talk about a challenge. 
   If they ask why this company, talk about this specific company.

2. MAX ${wordLimit} WORDS. Count them. If you exceed ${wordLimit}, rewrite. 
   Shorter is always better. Recruiters spend 7 seconds per answer.

3. HUMAN VOICE ONLY. Never use these words:
   passionate, leverage, synergy, spearheaded, dynamic, results-driven,
   collaborative, innovative, impactful, excited to join, thrilled,
   hard-working, detail-oriented, fast-paced environment.
   If you catch yourself writing any of these, stop and rewrite.

4. FOCUS ON 1-2 RELEVANT HIGHLIGHTS.
   Do not dump or summarize everything from the resume. Pick only the single
   most relevant project or skill that answers the question. Keep the rest of the
   answer generic, clean, and conversational.

5. BE BALANCED AND NATURAL.
   Avoid listing too many achievements, numbers, or technologies in a single sentence.
   It must sound like a normal, common-sense human replying to a question, not an AI
   stuffing a resume into a paragraph.


7. FIRST PERSON, PRESENT CONFIDENCE. 
   Not "I would love to..." — say "I bring..." or "My work on X..."

8. NO FILLER OPENING. Never start with:
   "I am writing to express..." 
   "I have always been interested in..."
   "As a passionate professional..."
   Start with the most interesting thing immediately and the screener must hing yes we shoulld hire this cause he seems to be intersting.

FORMAT:
- Plain text only
- No bullet points
- No headers
- No quotation marks around the answer
- Just the answer, nothing else

---

RESUME:
${data.resume}

JOB DESCRIPTION:
${data.jobDescription || 'Not provided'}

COMPANY SUMMARY:
${companySummary || 'Not provided'}

QUESTION:
${data.question}

Write the answer now. Remember: ${wordLimit} words max, human voice, answer the 
actual question, use only real experience from the resume.`;
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
        }
    });

    return response.text || 'Unable to generate response.';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to communicate with AI service.');
  }
}
