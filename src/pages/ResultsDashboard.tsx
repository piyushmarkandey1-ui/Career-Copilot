import { Link, useLocation } from 'react-router-dom'

interface RoadmapItem {
  week: string
  action: string
  why: string
}

interface AnalysisData {
  readiness_score: number
  one_liner: string
  brutal_gaps: string[]
  fix_it_roadmap: RoadmapItem[]
}

interface LocationState {
  analysis?: AnalysisData
  filename?: string
  targetRole?: string
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
    readiness_score: 45,
    one_liner: "Your resume screams 'junior' when you're applying for senior roles. Fix the stack, add metrics, show architecture.",
    brutal_gaps: [
      "No quantifiable achievements. \"Worked on projects\" tells me nothing about impact.",
      "Missing modern stack. React 16 was 6 years ago. Where's Next.js? TypeScript? Tailwind?",
      "Zero evidence of system design. Senior roles need architecture thinking, not just code.",
    ],
    fix_it_roadmap: [
      {
        week: 'Week 1-2',
        action: 'Rewrite every bullet point with metrics. Convert "improved performance" to "reduced load time from 3s to 800ms (73% faster)"',
        why: 'Recruiters skim for numbers. No metrics = invisible resume.',
      },
      {
        week: 'Week 3-4',
        action: 'Build a Next.js 14 portfolio with App Router, Server Components, and Tailwind. Deploy to Vercel.',
        why: 'Proves you\'re current. One modern project beats five outdated ones.',
      },
      {
        week: 'Month 2',
        action: 'Add a "System Design" section. Document how you architected something complex (microservices, state management, caching strategy).',
        why: 'Senior developers design systems, not just implement features.',
      },
    ],
  }

  const analysis = state?.analysis || mockData
  const filename = state?.filename || 'sample-resume.pdf'
  const targetRole = state?.targetRole || 'Frontend Developer'

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
          <h1 className="text-3xl font-extrabold">Your Roast Results</h1>
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
                The Truth
              </span>
            </div>
            <p className={`text-2xl font-bold leading-relaxed ${scoreColor}`}>
              "{analysis.one_liner}"
            </p>
            <div className="mt-6">
              {analysis.readiness_score >= 80 ? (
                <p className="text-slate-400">
                  🌟 <strong>Excellent!</strong> Your resume is competitive. A few tweaks and
                  you're golden.
                </p>
              ) : analysis.readiness_score >= 60 ? (
                <p className="text-slate-400">
                  💪 <strong>Good foundation.</strong> You're on the right track, but there's work
                  to do.
                </p>
              ) : (
                <p className="text-slate-400">
                  🔥 <strong>Needs serious work.</strong> Follow the roadmap below to transform your
                  resume.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Brutal Gaps */}
      <section className="mb-8">
        <h2 className="mb-5 text-xl font-bold">🔴 Top 3 Brutal Gaps</h2>
        <div className="flex flex-col gap-4">
          {analysis.brutal_gaps.slice(0, 3).map((gap, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 font-bold text-red-300">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="leading-relaxed text-slate-200">{gap}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fix It Roadmap */}
      <section className="mb-12">
        <h2 className="mb-5 text-xl font-bold">🛣️ Fix-It Roadmap</h2>
        <div className="space-y-6">
          {analysis.fix_it_roadmap.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-violet-500/30 hover:bg-white/[0.07]"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                    {item.week}
                  </p>
                </div>
              </div>
              <div className="ml-13 space-y-3">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Action
                  </p>
                  <p className="leading-relaxed text-slate-200">{item.action}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Why It Matters
                  </p>
                  <p className="text-sm leading-relaxed text-slate-400">{item.why}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Progress Tracker */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 font-semibold">Your Progress</h3>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">Roadmap completion</span>
          <span className="font-medium">0 / {analysis.fix_it_roadmap.length} steps</span>
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
        <h3 className="mb-2 text-xl font-bold">Ready to fix it?</h3>
        <p className="mb-6 text-slate-400">
          Upload your updated resume anytime to see your progress and get fresh feedback.
        </p>
        <Link
          to="/upload"
          className="inline-block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 font-semibold shadow-lg shadow-violet-500/20 transition hover:opacity-90"
        >
          Upload Updated Resume
        </Link>
      </div>
    </main>
  )
}
