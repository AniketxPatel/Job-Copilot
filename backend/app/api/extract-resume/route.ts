import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';
import { supabase } from '../../../lib/supabase';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS_HEADERS });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data payload.' }, { status: 400, headers: CORS_HEADERS });
    }

    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Limit file size to 10MB to protect the serverless instance from memory overflow
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit.' },
        { status: 400, headers: CORS_HEADERS }
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
        { status: 422, headers: CORS_HEADERS }
      );
    }

    // Upload PDF to Supabase Storage
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${user.id}/${Date.now()}_${sanitizedName}`;
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
      { text, resume_pdf_url: publicUrlData.publicUrl },
      { headers: CORS_HEADERS }
    );

  } catch (error: any) {
    console.error('Extraction/Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}