import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { BASE_URL } from '../config/api'

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

export default function UploadResumePage() {
  const [state, setState] = useState<UploadState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  function handleFile(f: File) {
    if (f.type !== 'application/pdf') {
      setState('error')
      toast.error('Only PDF resumes are supported.')
      return
    }
    setFile(f)
    setState('idle')
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setState('idle')
    setErrorMessage('')
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
    setErrorMessage('')
    setProgress(0)

    pendo.track('resume_analysis_submitted', {
      targetRole,
      hasEmail: !!email.trim(),
      fileName: file.name,
      fileSize: file.size,
    })

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
      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (data.success) {
        toast.success('Analysis complete!')
        setState('done')

        pendo.track('resume_analysis_completed', {
          targetRole,
          readinessScore: data.data.readiness_score,
          hasEmail: !!email.trim(),
          resumeDetectionConfidence: data.data.resume_detection?.confidence ?? null,
        })

        if (email.trim()) {
          pendo.identify({
            visitor: {
              id: email.trim(),
              email: email.trim(),
              role: targetRole,
              score: data.data.readiness_score,
              createdAt: new Date().toISOString(),
              targetRole: targetRole,
              readinessScore: data.data.readiness_score,
              analysisDate: new Date().toISOString(),
            },
            account: {
              id: 'career-copilot-public',
            }
          });
        }

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
        toast.error(data.message || 'Failed to analyze resume')
        pendo.track('resume_analysis_failed', {
          targetRole,
          reason: data.message || 'server_error',
          hasEmail: !!email.trim(),
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setState('error')
      setErrorMessage('Failed to connect to server. Make sure the backend is running.')
      toast.error('Failed to connect to server. Make sure the backend is running.')
      pendo.track('resume_analysis_failed', {
        targetRole,
        reason: 'network_error',
        hasEmail: !!email.trim(),
      })
    }
  }



  const canSubmit = file && targetRole && state !== 'uploading' && state !== 'done'

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20 relative min-h-screen">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* Header */}
      <div className="mb-10 sm:mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 sm:mb-6">
          Step 1: Upload
        </div>
        <h1 className="mb-4 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight px-4 sm:px-0">
          Upload Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Resume</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto px-4 sm:px-0">
          Drop your PDF below. Our AI will analyze it against your target role and give you a brutal, actionable breakdown.
        </p>
      </div>

      {/* Drop zone */}
      <div className="relative group mb-6 sm:mb-8">
        {/* Animated border gradient */}
        <div className={`absolute -inset-1 rounded-3xl blur-md transition-all duration-500 ${state === 'dragging' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 opacity-70' : 'bg-gradient-to-r from-white/5 to-white/5 opacity-0 group-hover:opacity-100 group-hover:from-violet-600/30 group-hover:to-indigo-600/30'}`}></div>
        
        {/* Hidden file input with accessible label */}
        <label htmlFor="resume-file-input" className="sr-only">
          Upload resume PDF
        </label>
        <input
          id="resume-file-input"
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="sr-only"
          onChange={onInputChange}
          aria-describedby="resume-file-hint"
        />

        <div
          className={`
            relative flex flex-col items-center justify-center rounded-2xl
            p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm min-h-[200px] sm:min-h-[240px]
            premium-dropzone
            ${state === 'dragging' ? 'dragging' : ''}
            ${file ? 'has-file' : ''}
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

          {file ? (
            <div className="flex flex-col items-center animate-fade-in-up w-full">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg mb-3 sm:mb-4">
                <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-white flex-shrink-0" />
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-200 break-all px-2">{file.name}</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                {(file.size / 1024).toFixed(1)} KB · Click to replace
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-600">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-indigo-500/20 transition-colors duration-300">
                <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400 transition-transform duration-300 group-hover:-translate-y-1 flex-shrink-0" />
              </div>
              <p className="mb-2 text-base sm:text-lg font-semibold text-slate-200">
                Drag & drop your resume here
              </p>
              <p className="text-sm text-slate-400">or click to browse from your computer</p>
              <p className="mt-3 sm:mt-4 text-xs text-slate-400" id="resume-file-hint">PDF only (Max 10MB)</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Fields - Responsive */}
      <div className="mt-8 sm:mt-10 space-y-5 sm:space-y-6 premium-card p-6 sm:p-8">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
            Email <span className="text-slate-400 text-xs font-normal">(optional — for Growth Tracker)</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="premium-input w-full"
          />
        </div>

        {/* Target Role Dropdown */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="targetRole">
            Target Role <span className="text-red-600">*</span>
          </label>
          <select
            id="targetRole"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            className="premium-input w-full"
          >
            <option value="" disabled>
              Select your target role…
            </option>
            {roles.map(role => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message Display */}
      {state === 'error' && errorMessage && (
        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-6 py-4 animate-fade-in-up">
          <div className="mt-0.5 rounded-full bg-red-500/20 p-1">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-red-400 font-medium text-sm leading-relaxed">
            {errorMessage}
          </p>
        </div>
      )}

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
              ref={el => { if (el) el.style.width = `${progress}%` }}
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
