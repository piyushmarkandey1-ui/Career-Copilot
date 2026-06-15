/**
 * api.ts
 *
 * Central API client for Career Copilot frontend.
 * All fetch calls go through these helpers so the base URL is
 * always picked up from VITE_API_URL (set per environment).
 *
 * Local dev  → .env.local  → VITE_API_URL=http://localhost:5000
 * Production → Vercel env  → VITE_API_URL=https://your-app.up.railway.app
 */

// Always use relative paths — Vite dev proxy forwards to backend, Vercel rewrites handle production
const BASE_URL = ''

// ── Generic request helper ────────────────────────────────────────────────────
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || `Request failed: ${res.status}`)
  return json as T
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface UploadResult {
  file: { name: string; sizeBytes: number; pages: number }
  text: string
  wordCount: number
  preview: string
}

export interface AnalysisResult {
  targetRole: string
  wordCount: number
  readiness_score: number
  strengths: string[]
  weaknesses: string[]
  resume_structure_feedback: string
  project_feedback: string
  skills_feedback: string
  target_role_fit: string
  improvement_roadmap: string[]
  summary: string
  resume_specific_observations?: string[]
  generic_feedback_detected?: boolean
}

export interface SaveResultPayload {
  email?: string | null
  role: string
  score: number
  ai_result: Omit<AnalysisResult, 'targetRole' | 'wordCount'>
}

export interface SavedResult {
  id: string
  email: string | null
  role: string
  score: number
  created_at: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * POST /api/upload
 * Sends a PDF file and returns extracted text + metadata.
 */
export async function uploadResume(file: File): Promise<{ success: boolean; data: UploadResult }> {
  const form = new FormData()
  form.append('resume', file)
  const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: form })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Upload failed')
  return json
}

/**
 * POST /api/analyze
 * Sends resume text + target role to Claude and returns the roast analysis.
 */
export async function analyzeResume(
  resumeText: string,
  targetRole: string
): Promise<{ success: boolean; data: AnalysisResult }> {
  return request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ resumeText, targetRole }),
  })
}

/**
 * POST /api/save-result
 * Persists a completed analysis to Supabase.
 */
export async function saveResult(
  payload: SaveResultPayload
): Promise<{ success: boolean; data: SavedResult }> {
  return request('/api/save-result', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * GET /api/health
 * Liveness check — useful for confirming the backend is reachable.
 */
export async function checkHealth(): Promise<{ success: boolean; status: string }> {
  return request('/api/health')
}

export { BASE_URL }
