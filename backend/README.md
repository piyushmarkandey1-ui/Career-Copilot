# Career Copilot Backend

Express.js API for resume analysis with Claude AI and Supabase storage.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Add your API keys to .env
npm run dev
```

## Environment Variables

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
ANTHROPIC_API_KEY=sk-ant-api03-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

## API Endpoints

- `GET /api/resume/health` - Health check
- `POST /api/resume/upload` - Upload & analyze PDF
- `POST /api/resume/save-result` - Save result
- `GET /api/resume/results/:email` - Get user results
- `GET /api/resume/result/:id` - Get single result

## Testing

```bash
# Health check
curl http://localhost:5000/api/resume/health

# Upload resume
curl -X POST http://localhost:5000/api/resume/upload \
  -F "resume=@resume.pdf" \
  -F "targetRole=Frontend Developer"
```

See [API.md](./API.md) for detailed API documentation.
