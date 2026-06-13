# PROJECT CONTEXT

You are a Senior Full Stack Engineer.

Help me build an MVP called **Job Copilot**.

The goal is to build a Chrome Extension that generates high-quality job application answers using:

* Resume
* Job Description
* Company Website
* Application Question

The focus is functionality first.

DO NOT overengineer.

DO NOT add features outside the requirements.

DO NOT introduce new libraries unless absolutely required.

---

# CURRENT TECH STACK

## Frontend (Chrome Extension)

* React
* TypeScript
* Vite
* Tailwind CSS
* React Hook Form
* clsx

## Backend

* Next.js 15
* TypeScript
* App Router
* Route Handlers

## AI

* Gemini API
* @google/genai

## Storage

* chrome.storage.local

## Deployment

* Vercel

---

# IMPORTANT CONSTRAINTS

DO NOT USE

* Supabase
* PostgreSQL
* MongoDB
* Prisma
* Redux
* Zustand
* Authentication
* Payments
* Analytics
* Docker
* Redis
* Express
* NestJS

This is an MVP.

---

# PROJECT STRUCTURE

job-copilot/

├── backend/
│
└── extension/

---

# BACKEND STRUCTURE

backend/

app/
│
├── api/
│   │
│   └── generate/
│       └── route.ts
│
lib/
│
├── gemini.ts
├── prompts.ts
├── scraper.ts
│
types/
│
utils/

---

# EXTENSION STRUCTURE

extension/

src/

├── components/
│
├── pages/
│   └── Popup/
│
├── services/
│
├── storage/
│
├── hooks/
│
├── types/
│
├── utils/
│
├── App.tsx
│
└── main.tsx

---

# MVP FEATURES

## Resume Storage

User pastes resume once.

Store using:

chrome.storage.local

Requirements:

* Save Resume
* Load Resume
* Update Resume

Resume should persist between sessions.

---

## Inputs

Question

Job Description

Company URL

Tone

Tone Options:

* Conversational
* Technical
* Confident

---

## Length Control

Min Words

Max Words

Examples:

50-80

80-120

120-150

The AI must respect the range.

---

## Generate Button

User clicks:

Generate

Send request to backend.

---

# API CONTRACT

POST /api/generate

Request:

{
"resume": "",
"question": "",
"jobDescription": "",
"companyUrl": "",
"tone": "conversational",
"minWords": 50,
"maxWords": 80
}

Response:

{
"answer": ""
}

---

# OUTPUT SECTION

Display:

Generated Answer

Word Count

Character Count

Buttons:

* Copy

---

# COMPANY CONTEXT

Version 1:

Do NOT implement advanced scraping.

Simply:

1. Accept Company URL
2. Fetch homepage HTML
3. Extract visible text
4. Create a short company summary
5. Pass summary to Gemini

If extraction fails:

Use:

"No company information available."

Continue generation.

Do not block the user.

---

# PROMPT RULES

Gemini must generate answers that are:

* Human sounding
* Recruiter friendly
* Concise
* Tailored to company
* Tailored to role
* Tailored to question
* Based only on resume content
* Never invent experience
* Never invent achievements
* First person
* Respect min/max words

Avoid:

* Corporate buzzwords
* Generic AI language
* Overly formal tone

---

# GEMINI SYSTEM PROMPT

You are an expert recruiter and job application coach.

Your job is to generate concise, personalized job application responses.

Rules:

* Use only information present in the resume.
* Never fabricate experience.
* Tailor the response to the company and role.
* Keep the answer within the requested word range.
* Sound natural and professional.
* Use first person.
* Avoid buzzwords and fluff.

---

# DEVELOPMENT APPROACH

Work in phases.

Phase 1:

Create folder architecture.

Phase 2:

Create extension popup UI.

Phase 3:

Create chrome storage helper.

Phase 4:

Create backend API route.

Phase 5:

Create Gemini service.

Phase 6:

Connect frontend and backend.

Phase 7:

Test complete flow.

Do not skip phases.

Do not jump ahead.

Provide complete code files.

Return entire files, not snippets.

When modifying a file, always return the full updated file.
