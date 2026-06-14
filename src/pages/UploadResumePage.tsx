import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

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

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function UploadResumePage() {
  const [state, setState] = useState<UploadState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
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

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 15, 90))
      }, 300)

      // Upload to backend
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (data.success) {
        setState('done')
        // Navigate to results with analysis data
        setTimeout(() => {
          navigate('/results', {
            state: {
              analysis: data.data,
              filename: file.name,
              targetRole: targetRole,
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
    <main className="mx-auto max-w-2xl px-6 py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-extrabold">Upload Your Resume</h1>
        <p className="text-slate-400">
          Upload your PDF resume and select your target role. We'll analyze it and tell you exactly what's wrong.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={dropzoneClass}
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
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/20 text-3xl">
              📄
            </div>
            <p className="mb-1 font-semibold text-violet-300">{file.name}</p>
            <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              📤
            </div>
            <p className="mb-1 font-semibold">Drag & drop your resume here</p>
            <p className="text-sm text-slate-400">or click to browse · PDF only</p>
          </>
        )}
      </div>

      {/* Error state */}
      {state === 'error' && errorMessage && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Target Role Dropdown */}
      <div className="mt-8">
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

      {/* Progress bar */}
      {state === 'uploading' && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-400">Analyzing your resume…</span>
            <span className="font-medium text-violet-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={uploadAndAnalyze}
        disabled={!canSubmit}
        className="mt-8 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 font-semibold shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {state === 'uploading'
          ? '🔍 Analyzing…'
          : state === 'done'
          ? '✓ Done! Redirecting…'
          : 'Analyze My Resume'}
      </button>

      {/* Privacy note */}
      <p className="mt-4 text-center text-xs text-slate-500">
        🔒 Your resume is processed securely and never shared with third parties.
      </p>
    </main>
  )
}
