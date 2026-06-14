# Career Copilot API Documentation

Base URL: `http://localhost:5000`

## Endpoints

### 1. Health Check

Check if the API server is running.

**Endpoint:** `GET /api/resume/health`

**Response:**
```json
{
  "success": true,
  "message": "Career Copilot API is running",
  "timestamp": "2026-06-14T17:00:00.000Z"
}
```

---

### 2. Upload Resume

Upload a PDF resume and extract its text content.

**Endpoint:** `POST /api/resume/upload`

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resume` | File | Yes | PDF file (max 5MB) |
| `targetRole` | String | Yes | Target job role |

**Target Roles:**
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

**Success Response (200):**
```json
{
  "success": true,
  "message": "Resume uploaded and processed successfully",
  "data": {
    "filename": "john-doe-resume.pdf",
    "targetRole": "Frontend Developer",
    "extractedText": "JOHN DOE\nSoftware Engineer\n\nEXPERIENCE\n...",
    "metadata": {
      "numPages": 2,
      "info": {
        "PDFFormatVersion": "1.4",
        "IsAcroFormPresent": false,
        "IsXFAPresent": false,
        "Creator": "Microsoft Word",
        "Producer": "macOS Version 10.15.7",
        "CreationDate": "D:20240115120000Z"
      },
      "textLength": 3450
    },
    "timestamp": "2026-06-14T17:00:00.000Z"
  }
}
```

**Error Responses:**

*No file uploaded (400):*
```json
{
  "success": false,
  "message": "No file uploaded. Please upload a PDF file."
}
```

*Missing target role (400):*
```json
{
  "success": false,
  "message": "Target role is required"
}
```

*Invalid file type (400):*
```json
{
  "success": false,
  "message": "Only PDF files are allowed"
}
```

*File too large (413):*
```json
{
  "success": false,
  "message": "File too large. Maximum size is 5MB."
}
```

*Processing error (500):*
```json
{
  "success": false,
  "message": "Error processing resume",
  "error": "Detailed error message"
}
```

---

### 3. Analyze Resume

Analyze resume data (placeholder for future AI integration).

**Endpoint:** `POST /api/resume/analyze`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "targetRole": "Frontend Developer"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Resume analyzed successfully",
  "data": {
    "targetRole": "Frontend Developer",
    "overallScore": 78,
    "timestamp": "2026-06-14T17:00:00.000Z"
  }
}
```

---

## Testing with cURL

### Health Check
```bash
curl http://localhost:5000/api/resume/health
```

### Upload Resume
```bash
curl -X POST http://localhost:5000/api/resume/upload \
  -F "resume=@/path/to/resume.pdf" \
  -F "targetRole=Frontend Developer"
```

### Analyze Resume
```bash
curl -X POST http://localhost:5000/api/resume/analyze \
  -H "Content-Type: application/json" \
  -d '{"targetRole":"Frontend Developer"}'
```

---

## Testing with JavaScript (Frontend)

```javascript
const formData = new FormData();
formData.append('resume', pdfFile); // File object from input
formData.append('targetRole', 'Frontend Developer');

const response = await fetch('http://localhost:5000/api/resume/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log(data);
```

---

## Rate Limits

Currently no rate limits are implemented. Consider adding rate limiting for production.

## CORS

The API accepts requests from: `http://localhost:5173` (configurable via `CORS_ORIGIN` env variable)

## File Storage

- Uploaded files are temporarily stored in `uploads/` directory
- Files are automatically deleted after text extraction
- No permanent storage of uploaded resumes
