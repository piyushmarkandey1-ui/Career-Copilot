import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

type UploadState = 'idle' | 'dragging' | 'uploading' | 'done' | 'error'

const roles = [
  'Software Developer (SDE)',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist / ML Engineer',
  'Product Manager',
  'DevOps / Cloud Engineer',
  'Blockchain Developer',
  'Cybersecurity Analyst',
  'UI/UX Designer',
]

// Always use a relative URL so requests go through the Vite dev proxy (no CORS)
const API_URL = ''

export default function UploadResumePage() {
  const [state, setState] = useState<UploadState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
  const [email, setEmail] = useState('')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  function handleFile(f: File) {
    if (f.type !== 'application/pdf') {
      setState('error')
      setErrorMessage('Only PDF files are supported.')
      return
    }
    setFile(f)
    setState('idle')
    setErrorMessage('')
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setState('idle')
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setState('dragging')
  }

  function onDragLeave() {
    setState('idle')
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  async function uploadAndAnalyze() {
    if (!file || !targetRole) return

    setState('uploading')
    setProgress(0)
    setErrorMessage('')

    try {
      // Create form data
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('targetRole', targetRole)
      if (email.trim()) formData.append('email', email.trim())

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 15, 90))
      }, 300)

      // Upload to backend
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (data.success) {
        setState('done')
        setTimeout(() => {
          navigate('/results', {
            state: {
              analysis: data.data,
              filename: file.name,
              targetRole: data.data.targetRole,
              email: email.trim() || null,
            },
          })
        }, 500)
      } else {
        setState('error')
        setErrorMessage(data.message || 'Failed to analyze resume')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setState('error')
      setErrorMessage('Failed to connect to server. Make sure the backend is running.')
    }
  }

  const dropzoneClass = `
    relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
    p-12 text-center cursor-pointer transition-all
    ${state === 'dragging'
      ? 'border-violet-400 bg-violet-500/10'
      : file
      ? 'border-violet-500/60 bg-violet-500/5'
      : 'border-white/20 bg-white/5 hover:border-violet-500/50 hover:bg-white/[0.07]'}
  `

  const canSubmit = file && targetRole && state !== 'uploading' && state !== 'done'

  return (
    <main className="mx-auto max-w-3xl px-6 py-20 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse-slow"></div>

      {/* Header */}
      <div className="mb-12 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300 text-xs font-bold uppercase tracking-wider mb-6">
          Step 1: Upload
        </div>
        <h1 className="mb-4 text-4xl md:text-5xl font-extrabold tracking-tight">
          Upload Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Resume</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto font-light">
          Drop your PDF below. Our AI will analyze it against your target role and give you a brutal, actionable breakdown.
        </p>
      </div>

      {/* Drop zone */}
      <div className="relative group">
        {/* Animated border gradient */}
        <div className={`absolute -inset-1 rounded-3xl blur-md transition-all duration-500 ${state === 'dragging' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 opacity-70' : 'bg-gradient-to-r from-white/5 to-white/5 opacity-0 group-hover:opacity-100 group-hover:from-violet-600/30 group-hover:to-indigo-600/30'}`}></div>
        
        <div
          className={`
            relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
            p-14 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm
            ${state === 'dragging'
              ? 'border-violet-400 bg-violet-500/10 shadow-[0_0_30px_rgba(139,92,246,0.15)] scale-[1.02]'
              : file
              ? 'border-violet-500/40 bg-violet-500/5'
              : 'border-white/10 bg-slate-900/50 hover:border-violet-500/40 hover:bg-white/5'}
          `}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          role="button"
          aria-label="Upload resume file"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={onInputChange}
          />

          {file ? (
            <div className="flex flex-col items-center animate-fade-in-up">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <p className="text-lg font-bold text-white">{file.name}</p>
              <p className="mt-1 text-sm text-slate-400">
                {(file.size / 1024).toFixed(1)} KB · Click to replace
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 group-hover:text-violet-300 transition-colors duration-300 border border-white/5 group-hover:border-violet-500/30">
                <UploadCloud className="w-8 h-8 transition-transform duration-300 group-hover:-translate-y-1" />
              </div>
              <p className="mb-2 text-lg font-semibold text-slate-200">
                Drag & drop your resume here
              </p>
              <p className="text-sm">or click to browse from your computer</p>
              <p className="mt-4 text-xs text-slate-500">PDF only (Max 10MB)</p>
            </div>
          )}
        </div>
      </div>

      {state === 'error' && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-6 py-4 text-red-400 animate-fade-in-up">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Form Fields */}
      <div className="mt-10 space-y-6 glass-panel p-8 rounded-3xl">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
            Email <span className="text-slate-500 text-xs font-normal">(optional — required to use Growth Tracker)</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* Target Role Dropdown */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="targetRole">
            Target Role <span className="text-red-400">*</span>
          </label>
          <select
            id="targetRole"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          >
            <option value="" disabled className="bg-slate-900">
              Select your target role…
            </option>
            {roles.map(role => (
              <option key={role} value={role} className="bg-slate-900">
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-10 text-center">
        <button
          onClick={uploadAndAnalyze}
          disabled={!canSubmit}
          className={`
            relative group overflow-hidden w-full sm:w-auto rounded-2xl px-12 py-4 text-lg font-bold transition-all duration-300
            ${canSubmit
              ? 'bg-white text-slate-900 hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(255,255,255,0.2)]'
              : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'}
          `}
        >
          <span className={`relative z-10 flex items-center justify-center gap-2 ${state === 'uploading' ? 'opacity-0' : 'opacity-100'}`}>
            {state === 'done' ? <CheckCircle2 className="w-5 h-5" /> : null}
            {state === 'done' ? 'Analysis Complete' : 'Analyze My Resume'}
          </span>

          {state === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center gap-3 z-20 text-slate-900">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing ({progress}%)</span>
            </div>
          )}

          {/* Progress bar background fill */}
          {state === 'uploading' && (
            <div
              className="absolute left-0 top-0 bottom-0 bg-violet-400 transition-all duration-300 ease-out z-10"
              style={{ width: `${progress}%` }}
            />
          )}
        </button>
        <p className="mt-4 text-xs text-slate-500 flex items-center justify-center gap-1">
          <span>Protected by AES-256 encryption. We never share your data.</span>
        </p>
      </div>
    </main>
  )
}
