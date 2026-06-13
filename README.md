<div align="center">
  <img src="extension/public/icons.svg" alt="Job Copilot Logo" width="120" />
  
  # 🚀 Job Copilot

  **Your AI-Powered Ex-FAANG Recruiter in a Chrome Extension.**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Gemini API](https://img.shields.io/badge/Powered%20by-Gemini%20API-blue?style=flat&logo=google)](https://deepmind.google/technologies/gemini/)

  Stop struggling with generic, long-winded job application answers. Job Copilot instantly crafts highly-targeted, concise responses based on your actual resume and the specific job description—all without leaving the application page.
</div>

---

## 🎯 What is it?

Job Copilot is a powerful two-part system (Chrome Extension + Next.js Backend) designed to help you breeze through tedious job applications. It uses the Google Gemini API to analyze your resume and the job description, acting as a world-class career coach to write answers that get you shortlisted.

No fluff. No "passionate about synergy" buzzwords. Just hard-hitting, 80-word maximum answers that recruiters actually want to read.

## ✨ Features

- **📄 Native PDF Resume Support:** Upload your resume directly into the extension. We display the actual PDF and securely store it so you don't have to upload it every time.
- **🧠 Ex-FAANG Recruiter Brain:** The AI is strictly prompted to avoid buzzwords, invent zero experience, and match the company's specific mission.
- **💾 Auto-Save Magic:** Accidentally closed the extension popup? Don't worry. Your application question, JD, company URL, and even the generated answer are saved to local storage instantly.
- **🎛️ Customizable Output:** Tweak the tone (Conversational, Technical, Confident) and length to match the vibe of the company you're applying to.
- **⚡ Lightning Fast Iteration:** Don't like the answer? Hit "Regenerate" to try again, or "Finish" to clear the slate for your next application.

## 🏗️ Architecture

The project is split into two main directories:

1. **/extension**: A React + Vite Chrome extension using Tailwind CSS for a beautiful, glassmorphic UI.
2. **/backend**: A Next.js API server that handles PDF parsing and communicates with the Google Gemini API.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key

### 1. Setting up the Backend
```bash
cd backend
yarn install

# Create your environment file
cp .env.local.bak .env.local
# Edit .env.local and add your actual GEMINI_API_KEY
```

Start the development server:
```bash
yarn dev
```
*The backend must be running on `localhost:3000` for the extension to work.*

### 2. Setting up the Extension
```bash
cd extension
yarn install
yarn build
```

**To install the extension in Chrome:**
1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** in the top right corner.
3. Click **"Load unpacked"** and select the `extension/dist` folder.
4. Pin Job Copilot to your toolbar!

## 💡 How to Use
1. Open the extension and upload your PDF resume via the "Resume" tab.
2. Navigate to the "Generate" tab.
3. Paste the specific application question (e.g., "Why do you want to work for our startup?").
4. (Optional) Paste the Job Description and Company URL.
5. Click **Generate Answer** and copy your tailored response!

## 📜 The "Rules" (Our AI Prompting Philosophy)
Job Copilot is strictly programmed to:
- Answer the actual question (no generic intros).
- Keep it under 80 words (recruiters only spend 7 seconds per answer).
- Never use words like *leverage*, *synergy*, or *spearheaded*.
- Use *only* real experience from your uploaded resume.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is licensed under the MIT License.
