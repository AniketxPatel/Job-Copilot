import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: Request) {
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

    // Fetch from profiles table (bypasses client RLS via service role client on backend)
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('resume_text, resume_pdf_url')
      .eq('id', user.id)
      .single();

    if (dbError) {
      console.error('Database Fetch Error:', dbError);
      return NextResponse.json({ resume_text: '', resume_pdf_url: '' }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    return NextResponse.json(
      { 
        resume_text: profile?.resume_text || '', 
        resume_pdf_url: profile?.resume_pdf_url || '' 
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (error: any) {
    console.error('Get Resume Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resume' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
