# 🚀 Career Copilot

**Find out why you won't get hired. Then fix it.**

Career Copilot is an AI-powered resume analysis platform designed to act as a tough but fair career coach. It helps students, freshers, and job seekers audit their resumes, detect structural gaps, and track their improvement over time with visual analytics.

---

## ✨ Key Features

- 🎯 **Advanced Resume Detection & Validation**:
  - **MIME Restriction**: Only accepts standard PDF format (`.pdf`).
  - **Structural Verification**: Evaluates layout, name, contacts, and major sections to assign a **Resume Confidence Score** (0-100%).
  - **Early Abortion**: Files with a confidence score under `70%` (such as research abstracts, articles, or random files) are rejected with a clear message to prevent database pollution.
  - **Missing Section Detector**: Flags missing sections (e.g. *Skills*, *Education*, *Contact info*) to warn the candidate, while still permitting analysis if the document is clearly a resume.
- 🔄 **Double Review Engine**:
  - **Detailed Review**: A deep-dive critique analyzing formatting, SDE metrics, project details, and ATS keywords.
  - **"Simplify This Review" Toggle**: Instantly translates technical recruiter jargon into plain, student-friendly language (e.g. converting *"lacks quantifiable metrics"* into *"your project explains what it does but doesn't explain the results you achieved"*).
- 📈 **Growth Tracker**:
  - Save analysis results by email to track progress across revisions.
  - Generates charts showing score improvements (ATS, Skills, Projects, Layout, and Readiness) over time.
  - Operates using permanent Supabase storage, with a seamless fallback to session memory if credentials are not configured.
- 🎨 **Premium Glassmorphism UI**:
  - Beautiful responsive dark-theme design featuring subtle animations, custom gradient score rings, and interactive filters.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite (build server), Tailwind CSS v4, TypeScript, Lucide Icons, Recharts (visualizations).
- **Backend API**: Node.js, Express.js.
- **PDF Engine**: `pdfjs-dist` (extracts text directly from binary buffers on-the-fly, avoiding local disk writes).
- **AI Core**: Anthropic Claude API (`claude-3-5-sonnet` for validation and audits) with a fully functional local rule-based heuristic fallback if API keys are missing.

---

## 💻 How to Run Locally

Follow these quick steps to get the application running on `localhost`:

### 1. Configure Environments

Create your environment configuration files:

- **Frontend (`.env.local`)**:
  *(VITE_API_URL is omitted by default so all requests proxy through Vite to avoid CORS issues).*
  
- **Backend Server (`server/.env`)**:
  Create a `.env` file inside the `server/` directory:
  ```env
  PORT=5000
  NODE_ENV=development
  CLIENT_ORIGIN=http://localhost:5173
  
  # Optional: For AI Resume analysis (falls back to local rules if not provided)
  ANTHROPIC_API_KEY=sk-ant-your-key-here
  
  # Optional: For persistent growth tracking (falls back to session memory if not configured)
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
  ```

### 2. Run the Servers

Start the backend and frontend dev servers concurrently from the root directory:

```bash
# Install root dependencies
npm install

# Start both servers (Vite on port 5173, Express on port 5000)
npm run dev:all
```

Visit **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🧪 Testing

Test the local resume validation and analyzer heuristics using the built-in test suite:

```bash
node server/test-analyzer.js
```
The test verifies validation confidence, missing section extraction, and SDE score results across 4 unique resume profiles (Strong SDE, Average SDE, Weak/Fresher, and a Non-Resume Document).

---

## 📂 Repository Structure

```text
Career-Copilot/
├── src/                    # React Frontend
│   ├── components/         # Reusable UI elements (Navbar, Pills)
│   ├── pages/              # Upload, Results, Growth Tracker, About
│   ├── config/             # API client configurations and Types
│   ├── App.tsx             # Route registry
│   └── main.tsx            # App bootstrap
├── server/                 # Express Backend
│   ├── src/
│   │   ├── controllers/    # API endpoints (Upload, Analyze, History)
│   │   ├── middleware/     # Multer file handlers and error handlers
│   │   ├── routes/         # Express Router paths
│   │   └── services/       # Claude service, local analyzer, pdf extractor
│   ├── migrations/         # Supabase SQL table schemas
│   ├── index.js            # Node entry point
│   └── test-analyzer.js    # Local test suite
├── package.json            # Monorepo scripts and dependencies
├── vite.config.ts          # Vite asset building and backend API proxies
└── tsconfig.json           # TypeScript configuration
```
