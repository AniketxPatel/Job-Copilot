import type { GenerateRequest, GenerateResponse } from './types';

const API_URL = 'http://localhost:3000/api/generate';
const EXTRACT_URL = 'http://localhost:3000/api/extract-resume';

export const extractResume = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(EXTRACT_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.error || 'Failed to extract resume text');
  }

  const data = await response.json();
  return data.text;
};

export const generateAnswer = async (data: GenerateRequest): Promise<GenerateResponse> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to generate answer');
  }

  return response.json();
};