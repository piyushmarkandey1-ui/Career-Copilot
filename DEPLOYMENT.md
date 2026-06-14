# Deployment Guide

## Setup

### Backend (Railway)

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set Root Directory: `backend`
4. Add environment variables:

```
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.vercel.app
ANTHROPIC_API_KEY=sk-ant-api03-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

5. Generate Domain → Copy backend URL

### Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Add environment variable:

```
VITE_API_URL=https://your-backend.up.railway.app
```

3. Deploy → Copy frontend URL
4. Update Railway `CORS_ORIGIN` with this URL

### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run SQL from `backend/database/schema.sql` in SQL Editor
3. Get credentials from Project Settings → API

## Environment Variables

### Frontend
```env
VITE_API_URL=<railway-backend-url>
```

### Backend
```env
PORT=5000
NODE_ENV=production
CORS_ORIGIN=<vercel-frontend-url>
ANTHROPIC_API_KEY=<from-console.anthropic.com>
SUPABASE_URL=<from-supabase-project-settings>
SUPABASE_ANON_KEY=<from-supabase-project-settings>
```

## Test

```bash
curl https://your-backend.up.railway.app/api/resume/health
```

Visit your Vercel URL and upload a resume.
