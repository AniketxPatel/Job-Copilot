import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  try {
    const { companyName } = await req.json();
    if (!companyName) {
      return NextResponse.json({ websiteUrl: '' }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Call Gemini with search grounding to find the official website URL of the company
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the official, primary website URL (homepage) for the company: "${companyName}". 
Respond ONLY with a JSON object in this format, with no markdown code blocks or extra text:
{
  "websiteUrl": "https://example.com"
}
Ensure the websiteUrl is a valid HTTPS/HTTP URL of the actual company and not a job board or social profile (like Wellfound, LinkedIn, Twitter, etc.).`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = (response.text || '').trim();
    let websiteUrl = '';

    // Extract JSON or URL using regex in case response format varies
    try {
      const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && typeof parsed.websiteUrl === 'string') {
        websiteUrl = parsed.websiteUrl.trim();
      }
    } catch (e) {
      // Fallback: extract the first url from the response text
      const urlRegex = /(https?:\/\/[^\s"'`>]+)/gi;
      const match = text.match(urlRegex);
      if (match) {
        websiteUrl = match[0];
      }
    }

    // Final sanitization to remove trailing punctuation
    if (websiteUrl) {
      websiteUrl = websiteUrl.replace(/[.,;:)\]'"]$/, '');
    }

    return NextResponse.json({ websiteUrl }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error: any) {
    console.error('Company details resolution error:', error);
    return NextResponse.json({ websiteUrl: '' }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}
