export interface GenerateRequest {
  resume: string;
  question: string;
  jobDescription: string;
  companyUrl: string;
  tone: string;
  length: string;
}

export interface GenerateResponse {
  answer: string;
}
