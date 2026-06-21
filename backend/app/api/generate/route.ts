import { NextResponse } from 'next/server';
import { generateJobAnswer } from '../../../lib/gemini';
import { supabase } from '../../../lib/supabase';
import { GenerateRequest } from '../../../lib/types';

// Simple scraper without external libraries
async function fetchCompanySummary(url: string): Promise<string> {
  if (!url) return '';
  try {
    const validUrl = url.startsWith('http') ? url : `https://${url}`;
    const response = await fetch(validUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) return 'No company information available.';
    
    const html = await response.text();
    
    // Strip scripts and styles
    const noScripts = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    const noStyles = noScripts.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    
    // Strip all remaining HTML tags
    const text = noStyles.replace(/<[^>]+>/g, ' ');
    
    // Condense whitespace
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Return a chunk of text as the summary
    return cleanText.slice(0, 2000);
  } catch (err) {
    console.error('Scraping error:', err);
    return 'No company information available.';
  }
}

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
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const data = (await req.json()) as GenerateRequest;
    
    if (!data.question) {
      return NextResponse.json({ error: 'Application Question is required.' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('resume_text')
      .eq('id', user.id)
      .single();

    if (!profile?.resume_text) {
      return NextResponse.json({ error: 'No resume found in your account. Please upload one first.' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Override the resume data sent from client with the verified one from DB
    data.resume = profile.resume_text;

    const companySummary = await fetchCompanySummary(data.companyUrl);
    const answer = await generateJobAnswer(data, companySummary);
    
    return NextResponse.json({ answer }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}
