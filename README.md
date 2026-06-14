# 🚀 Career Copilot

**Find out why you won't get hired. Then fix it.**

An AI-powered resume analysis application that acts as a tough but fair career coach. It helps job seekers identify weaknesses in their resumes, get actionable feedback, and align their experience with target roles.

---

## 🔗 Quick Links for Judges

To test the application locally, use the following links (ensure both servers are running):

- **Frontend Application (UI):** [http://localhost:5173](http://localhost:5173)
- **Backend API Server:** [http://localhost:5000](http://localhost:5000)
- **GitHub Repository:** [https://github.com/piyushmarkandey1-ui/Career-Copilot](https://github.com/piyushmarkandey1-ui/Career-Copilot)

---

## ✨ Key Features

- 🎯 **Targeted Analysis** - Upload your PDF resume and select your target role.
- 🤖 **AI-Powered Insights** - Powered by Anthropic's Claude to provide detailed, objective feedback.
- 📊 **Readiness Score** - Get an instant 0-100 score on how ready your resume is for the selected role.
- ✅ **Strengths & Weaknesses** - Honest, direct feedback highlighting what works and what doesn't.
- 📈 **Improvement Roadmap** - Step-by-step actionable advice to improve formatting, metrics, and content.
- 🎨 **Modern & Responsive UI** - Premium dark theme interface built with Tailwind CSS v4.

---

## 🛠️ Technology Stack

Our application is built using a modern, scalable, and systematic architecture:

### Frontend Layer
- **Framework:** React 18
- **Build Tool:** Vite (for extremely fast HMR and optimized builds)
- **Language:** TypeScript (for type safety and robust code)
- **Styling:** Tailwind CSS v4 (Utility-first CSS framework for rapid, responsive UI development)
- **Routing:** React Router v6
- **Icons:** Lucide React

### Backend Layer
- **Runtime:** Node.js
- **Framework:** Express.js
- **PDF Processing:** `pdf-parse` (v2 API) for extracting text directly from uploaded buffers without saving to disk.
- **File Uploads:** `multer` (configured with in-memory storage for security and speed)

### AI Integration
- **LLM Provider:** Anthropic Claude API
- **Prompt Engineering:** Custom system prompts engineered to act as a 10+ year Senior Tech Recruiter.
- **Graceful Fallbacks:** Built-in mock data generation if API keys are missing or rate-limited to ensure an uninterrupted evaluation experience.

---

## 💻 How to Run Locally

If the servers are not already running, you can start them with:

**1. Start the Backend API (Terminal 1)**
```bash
cd server
npm install
npm run dev
```

**2. Start the Frontend UI (Terminal 2)**
```bash
npm install
npm run dev
```

*(Note: The application includes a fallback mock analysis mode, so it will work perfectly even without configuring an `ANTHROPIC_API_KEY` in the `.env` file!)*

---

## 📂 Project Architecture

```text
Career-Copilot/
├── src/                    # React Frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Main application views
│   ├── config/             # API configuration and types
│   └── App.tsx             # Routing setup
├── server/                 # Express Backend
│   ├── src/
│   │   ├── controllers/    # API endpoint handlers
│   │   ├── middleware/     # Multer and error handlers
│   │   ├── routes/         # API routing definitions
│   │   └── services/       # Claude AI integration
│   └── index.js            # Server entry point
```
