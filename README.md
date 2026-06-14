# Career Copilot

**Find out why you won't get hired. Then fix it.**

An AI-powered resume analysis application that helps job seekers identify weaknesses in their resumes and get actionable feedback.

## Features

- 🎯 **Landing Page** - Bold, direct messaging
- 📤 **Resume Upload** - PDF upload with target role selection
- 📊 **Results Dashboard** - Comprehensive analysis with scores and suggestions
- 🔥 **Roast Mode** - Honest, direct feedback on resume quality
- 🎨 **Modern UI** - Dark theme with Tailwind CSS
- ⚡ **Fast** - Built with React + Vite

## Tech Stack

### Frontend
- React 18
- React Router
- Tailwind CSS v4
- Vite
- TypeScript

### Backend
- Node.js
- Express
- CORS
- dotenv

## Project Structure

```
Career-Copilot/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── App.tsx             # Main app with routing
│   └── main.tsx            # Entry point
├── backend/                # Backend API
│   └── src/
│       ├── config/         # Configuration
│       ├── controllers/    # Request handlers
│       ├── routes/         # API routes
│       ├── app.js          # Express app
│       └── server.js       # Server entry
├── public/                 # Static assets
└── index.html              # HTML entry point
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Clone the repository**
```bash
cd "d:\elevate hackathon\Career-Copilot"
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
cd ..
```

4. **Configure environment variables**
```bash
cd backend
copy .env.example .env
# Edit .env if needed
cd ..
```

### Running the Application

**Option 1: Run both servers (recommended)**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
cd backend
npm run dev
```

**Option 2: Run separately**

Frontend only (on http://localhost:5173):
```bash
npm run dev
```

Backend only (on http://localhost:5000):
```bash
cd backend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/resume/health

## API Endpoints

### Health Check
```
GET /api/resume/health
```

### Analyze Resume
```
POST /api/resume/analyze
Content-Type: application/json

{
  "targetRole": "Frontend Developer"
}
```

## Target Roles

- Software Developer (SDE)
- Frontend Developer
- Backend Developer
- Full Stack Developer
- Data Scientist / ML Engineer
- Product Manager
- DevOps / Cloud Engineer
- Blockchain Developer
- Cybersecurity Analyst
- UI/UX Designer

## Development

### Frontend Scripts
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend Scripts
```bash
npm run dev      # Start with auto-reload (nodemon)
npm start        # Start production server
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment to Vercel (frontend) and Railway (backend).

## Environment Variables

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000
```

### Backend (backend/.env)
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
ANTHROPIC_API_KEY=your_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## License

ISC
