import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';
import { supabase } from '../../../lib/supabase';

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

function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1 as any);

    pdfParser.on('pdfParser_dataError', (err: any) => {
      reject(new Error(err.parserError));
    });

    pdfParser.on('pdfParser_dataReady', () => {
      // getRawTextContent() is available when we pass 1 as the second parameter
      const text = (pdfParser as any).getRawTextContent();
      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text = '';

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      text = await extractTextFromPDF(buffer);
    } else {
      text = new TextDecoder().decode(bytes);
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text — is the PDF scanned/image-based?' },
        { status: 422, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Upload PDF to Supabase Storage
    const fileName = `${user.id}/${Date.now()}_resume.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      throw new Error('Failed to upload resume to cloud storage');
    }

    const { data: publicUrlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    // Save to profiles table
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        resume_text: text,
        resume_pdf_url: publicUrlData.publicUrl,
        email: user.email || null
      });

    if (dbError) {
      console.error('Database Upsert Error:', dbError);
      throw new Error('Failed to save resume to database');
    }

    return NextResponse.json(
      { text },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (error: any) {
    console.error('Extraction/Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}