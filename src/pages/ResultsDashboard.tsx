import { Link, useLocation } from 'react-router-dom'

interface AnalysisData {
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

interface LocationState {
  analysis?: AnalysisData
  filename?: string
  targetRole?: string
  email?: string | null
}

function ScoreRing({ score }: { score: number }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  // Color based on score
  const getColor = () => {
    if (score >= 80) return { from: '#10b981', to: '#059669' } // green
    if (score >= 60) return { from: '#f59e0b', to: '#d97706' } // amber
    return { from: '#ef4444', to: '#dc2626' } // red
  }

  const color = getColor()

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg className="absolute -rotate-90" width="192" height="192">
        <circle
          cx="96"
          cy="96"
          r={radius}
          strokeWidth="12"
          stroke="rgba(255,255,255,0.1)"
          fill="none"
        />
        <circle
          cx="96"
          cy="96"
          r={radius}
          strokeWidth="12"
          stroke={`url(#scoreGrad${score})`}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s ease' }}
        />
        <defs>
          <linearGradient id={`scoreGrad${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color.from} />
            <stop offset="100%" stopColor={color.to} />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <div className="text-5xl font-extrabold">{score}</div>
        <div className="text-sm text-slate-400">/ 100</div>
      </div>
    </div>
  )
}

export default function ResultsDashboard() {
  const location = useLocation()
  const state = location.state as LocationState

  // Mock data for when no state is passed (sample view)
  const mockData: AnalysisData = {
    readiness_score: 75,
    summary: "Strong foundation with good project experience, but needs better metrics and tailored skills formatting to stand out for senior roles.",
    strengths: [
      "Demonstrates solid experience with modern frontend frameworks.",
      "Projects show full-stack capability and deployment experience.",
      "Clear progression in responsibilities over time."
    ],
    weaknesses: [
      "Lacks quantifiable achievements and metrics.",
      "System design and architecture skills are underrepresented.",
      "Some older technologies are taking up valuable space."
    ],
    resume_structure_feedback: "The structure is generally clean, but the skills section could be categorized better. Use bullet points more effectively to highlight impact rather than just listing tasks.",
    project_feedback: "Your projects are good, but they need live links and GitHub repository links. Focus on explaining the 'why' behind technical decisions rather than just what you built.",
    skills_feedback: "You have a great foundation in React and Node.js. Consider removing older skills like jQuery and adding more emphasis on Next.js, TypeScript, and testing frameworks.",
    target_role_fit: "You are well-suited for mid-level frontend roles. To hit senior level, you need to show more architectural ownership and mentorship.",
    improvement_roadmap: [
      "Rewrite bullet points to include specific metrics (e.g., 'Reduced load time by 30%').",
      "Add links to live deployments and GitHub repos for all listed projects.",
      "Create a dedicated 'System Architecture' bullet for your most recent role.",
      "Categorize the skills section into 'Languages', 'Frameworks', 'Tools', etc."
    ],
  }

  const analysis = state?.analysis || mockData
  const filename = state?.filename || 'sample-resume.pdf'
  const targetRole = state?.targetRole || 'Frontend Developer'
  const email = state?.email || null

  const scoreColor =
    analysis.readiness_score >= 80
      ? 'text-emerald-400'
      : analysis.readiness_score >= 60
      ? 'text-amber-400'
      : 'text-red-400'

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold">Analysis Results</h1>
          <p className="mt-1 text-slate-400">
            <span className="font-medium text-white">{filename}</span> · Target:{' '}
            <span className="font-medium text-violet-400">{targetRole}</span>
          </p>
        </div>
        <Link
          to="/upload"
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
        >
          ↑ Upload New Resume
        </Link>
      </div>

      {/* Readiness Score */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
          <div className="flex flex-col items-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-slate-400">
              Readiness Score
            </p>
            <ScoreRing score={analysis.readiness_score} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="mb-4">
              <span className="text-sm font-medium uppercase tracking-widest text-slate-400">
                Summary
              </span>
            </div>
            <p className={`text-2xl font-bold leading-relaxed ${scoreColor}`}>
              "{analysis.summary}"
            </p>
            <div className="mt-6">
              {analysis.readiness_score >= 80 ? (
                <p className="text-slate-400">
                  🌟 <strong>Excellent!</strong> Your resume is highly competitive. A few tweaks and
                  you're ready to apply.
                </p>
              ) : analysis.readiness_score >= 60 ? (
                <p className="text-slate-400">
                  💪 <strong>Good foundation.</strong> You're on the right track, but there's room for improvement to stand out.
                </p>
              ) : (
                <p className="text-slate-400">
                  🔧 <strong>Needs some work.</strong> Follow the roadmap below to better align your resume with your target role.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Strengths */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-5 text-xl font-bold text-emerald-400">✅ Strengths</h2>
          <ul className="space-y-3">
            {analysis.strengths.map((strength, i) => (
              <li key={i} className="flex gap-3 text-slate-200">
                <span className="shrink-0 text-emerald-500">•</span>
                <span className="leading-relaxed">{strength}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Weaknesses */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-5 text-xl font-bold text-amber-400">⚠️ Weaknesses</h2>
          <ul className="space-y-3">
            {analysis.weaknesses.map((weakness, i) => (
              <li key={i} className="flex gap-3 text-slate-200">
                <span className="shrink-0 text-amber-500">•</span>
                <span className="leading-relaxed">{weakness}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Detailed Feedback Sections */}
      <section className="mb-8 space-y-6">
        <h2 className="text-xl font-bold">Detailed Feedback</h2>
        
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-2 text-lg font-semibold text-violet-400">Resume Structure</h3>
          <p className="leading-relaxed text-slate-200">{analysis.resume_structure_feedback}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-2 text-lg font-semibold text-violet-400">Projects & Experience</h3>
          <p className="leading-relaxed text-slate-200">{analysis.project_feedback}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-2 text-lg font-semibold text-violet-400">Skills Alignment</h3>
          <p className="leading-relaxed text-slate-200">{analysis.skills_feedback}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-2 text-lg font-semibold text-violet-400">Target Role Fit</h3>
          <p className="leading-relaxed text-slate-200">{analysis.target_role_fit}</p>
        </div>
      </section>

      {/* Resume-Specific Observations */}
      {analysis.resume_specific_observations && analysis.resume_specific_observations.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-5 text-xl font-bold">🔍 Resume-Specific Observations</h2>
          <div className="space-y-3">
            {analysis.resume_specific_observations.map((obs, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4"
              >
                <span className="mt-0.5 shrink-0 text-blue-400 text-lg">💡</span>
                <p className="leading-relaxed text-slate-200 text-sm">{obs}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Fix It Roadmap */}
      <section className="mb-12">
        <h2 className="mb-5 text-xl font-bold">🛣️ Improvement Roadmap</h2>
        <div className="space-y-4">
          {analysis.improvement_roadmap.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-violet-500/30 hover:bg-white/[0.07]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold">
                {i + 1}
              </div>
              <p className="leading-relaxed text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Progress Tracker */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 font-semibold">Your Progress</h3>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">Roadmap completion</span>
          <span className="font-medium">0 / {analysis.improvement_roadmap.length} steps</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500" />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          💡 Come back after making changes to track your improvement
        </p>
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600/25 to-indigo-600/25 p-8 text-center ring-1 ring-white/10">
        <h3 className="mb-2 text-xl font-bold">Ready to analyze again?</h3>
        <p className="mb-6 text-slate-400">
          Upload your updated resume anytime to see your progress and get fresh feedback.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/upload"
            className="inline-block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 font-semibold shadow-lg shadow-violet-500/20 transition hover:opacity-90"
          >
            Upload Updated Resume
          </Link>
          <Link
            to={email ? `/tracker?email=${encodeURIComponent(email)}` : '/tracker'}
            className="inline-block rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-8 py-3 font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
          >
            📈 View Growth Tracker
          </Link>
        </div>
      </div>
    </main>
  )
}
