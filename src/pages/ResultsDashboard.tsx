import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts'

interface AnalysisData {
  readiness_score: number
  score_explanation?: string
  executive_summary?: string
  candidate_profile_internal?: {
    education_level: string
    experience_level: string
    top_skills: string[]
    target_role: string
    notable_achievements: string[]
  }
  section_scores?: {
    layout: number
    contact_info: number
    education: number
    skills: number
    projects: number
    experience: number
    ats_compatibility: number
    target_role_alignment: number
  }
  strengths: { point: string; confidence: string }[] | string[]
  weaknesses: { point: string; confidence: string }[] | string[]
  recommendations?: {
    high_impact: string[]
    medium_impact: string[]
    low_impact: string[]
  }
  resume_specific_observations?: string[]
  recruiter_summary?: {
    standout_factor: string
    biggest_improvement_area: string
    interview_readiness: string
    overall_assessment: string
  }
  target_role_comparison?: {
    role_expectations: string
    candidate_alignment: string
  }
  validation?: {
    is_resume: boolean
    confidence: number
    missing_sections?: string[]
  }
  // Fallbacks for older data
  summary?: string
  improvement_roadmap?: string[]
  simple_review?: any
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

  const getColor = () => {
    if (score >= 80) return { from: '#10b981', to: '#059669' } // green
    if (score >= 60) return { from: '#f59e0b', to: '#d97706' } // amber
    return { from: '#ef4444', to: '#dc2626' } // red
  }
  const color = getColor()

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg className="absolute -rotate-90" width="192" height="192">
        <circle cx="96" cy="96" r={radius} strokeWidth="12" stroke="rgba(255,255,255,0.1)" fill="none" />
        <circle cx="96" cy="96" r={radius} strokeWidth="12" stroke={`url(#scoreGrad${score})`} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
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

function ConfidenceBadge({ level }: { level: string }) {
  if (level === 'High') return <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/30">High Confidence</span>
  if (level === 'Medium') return <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-widest border border-amber-500/30">Medium Confidence</span>
  return <span className="shrink-0 rounded-full bg-slate-500/20 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-500/30">Low Confidence</span>
}

export default function ResultsDashboard() {
  const location = useLocation()
  const state = location.state as LocationState

  const mockData: AnalysisData = {
    readiness_score: 72,
    score_explanation: "This score is driven by a solid foundation in core skills, but penalized for missing metrics in the experience section and an absence of deployed project links.",
    executive_summary: "Strong candidate with good foundational skills, but the resume reads like a list of responsibilities rather than a track record of achievements.",
    section_scores: { layout: 85, contact_info: 100, education: 90, skills: 75, projects: 60, experience: 50, ats_compatibility: 80, target_role_alignment: 72 },
    strengths: [
      { point: "Education section is clear and highlights a relevant degree from a well-known university.", confidence: "High" },
      { point: "Core tech stack (React, Node) aligns perfectly with the target role.", confidence: "High" }
    ],
    weaknesses: [
      { point: "Experience bullets at 'TechCorp' lack quantifiable metrics (e.g. 'Improved performance' instead of 'Improved performance by X%').", confidence: "High" },
      { point: "Projects are listed but lack GitHub links, making it impossible for technical reviewers to verify code quality.", confidence: "Medium" }
    ],
    recommendations: {
      high_impact: ["Rewrite the 3 experience bullets under 'TechCorp' using the STAR method, ensuring each ends with a measurable business outcome."],
      medium_impact: ["Add direct GitHub links to the 2 listed projects."],
      low_impact: ["Move the Skills section to the top to immediately satisfy ATS checks."]
    },
    recruiter_summary: {
      standout_factor: "Clean layout and solid educational pedigree.",
      biggest_improvement_area: "Quantifying impact in the experience section.",
      interview_readiness: "Not quite ready. Needs polish to pass a senior screening.",
      overall_assessment: "A capable developer whose resume currently undersells their actual impact."
    },
    target_role_comparison: {
      role_expectations: "Expects strong evidence of full-stack deployment, system design, and measurable impact on business KPIs.",
      candidate_alignment: "Meets technical requirements, but lacks evidence of deployment and measurable impact."
    }
  }

  const analysis = state?.analysis || mockData
  const filename = state?.filename || 'sample-resume.pdf'
  const targetRole = state?.targetRole || 'Software Engineer'
  const email = state?.email || null

  const [viewMode, setViewMode] = useState<'detailed' | 'simplified'>('detailed')
  const isSimple = viewMode === 'simplified' && analysis.simple_review
  const displaySummary = isSimple ? analysis.simple_review!.summary : (analysis.executive_summary || analysis.summary)

  const scoreColor = analysis.readiness_score >= 80 ? 'text-emerald-400' : analysis.readiness_score >= 60 ? 'text-amber-400' : 'text-red-400'

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!analysis.section_scores) return []
    return [
      { subject: 'Layout', A: analysis.section_scores.layout },
      { subject: 'Contact Info', A: analysis.section_scores.contact_info },
      { subject: 'Education', A: analysis.section_scores.education },
      { subject: 'Skills', A: analysis.section_scores.skills },
      { subject: 'Projects', A: analysis.section_scores.projects },
      { subject: 'Experience', A: analysis.section_scores.experience },
      { subject: 'ATS Fit', A: analysis.section_scores.ats_compatibility },
      { subject: 'Role Align', A: analysis.section_scores.target_role_alignment },
    ]
  }, [analysis.section_scores])

  // Normalize strengths and weaknesses
  const renderList = (items: any[], isStrength: boolean) => {
    return items.map((item, i) => {
      const isObj = typeof item === 'object' && item !== null
      const point = isObj ? item.point : item
      const confidence = isObj ? item.confidence : null
      return (
        <li key={i} className="flex gap-3 text-slate-200">
          <span className={`shrink-0 ${isStrength ? 'text-emerald-500' : 'text-amber-500'}`}>•</span>
          <div className="flex flex-col gap-1.5">
            <span className="leading-relaxed text-sm">{point}</span>
            {confidence && <div className="mt-0.5"><ConfidenceBadge level={confidence} /></div>}
          </div>
        </li>
      )
    })
  }

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
        <div className="flex flex-col sm:flex-row gap-3">
          {analysis.simple_review && (
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'detailed' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Detailed Review
              </button>
              <button
                onClick={() => setViewMode('simplified')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'simplified' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Simplified Review
              </button>
            </div>
          )}
          <Link to="/upload" className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10 flex items-center">
            ↑ Upload New
          </Link>
        </div>
      </div>

      {/* Recruiter Summary (Top Highlight) */}
      {!isSimple && analysis.recruiter_summary && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-900/40 to-indigo-900/40 shadow-2xl shadow-violet-500/10">
          <div className="border-b border-white/10 bg-white/5 px-6 py-4 flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <h2 className="text-lg font-bold text-violet-100">Recruiter's Desk Summary</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10">
            <div className="bg-slate-900/80 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">The Standout Factor</p>
              <p className="text-slate-200 text-sm leading-relaxed">{analysis.recruiter_summary.standout_factor}</p>
            </div>
            <div className="bg-slate-900/80 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Biggest Improvement Area</p>
              <p className="text-slate-200 text-sm leading-relaxed">{analysis.recruiter_summary.biggest_improvement_area}</p>
            </div>
            <div className="bg-slate-900/80 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Interview Readiness</p>
              <p className="text-slate-200 text-sm leading-relaxed">{analysis.recruiter_summary.interview_readiness}</p>
            </div>
            <div className="bg-slate-900/80 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Overall Assessment</p>
              <p className="text-slate-200 text-sm leading-relaxed">{analysis.recruiter_summary.overall_assessment}</p>
            </div>
          </div>
        </div>
      )}

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
                {isSimple ? 'Simplified Summary' : 'Executive Summary'}
              </span>
            </div>
            <p className={`text-xl font-bold leading-relaxed ${scoreColor}`}>
              "{displaySummary}"
            </p>
            {!isSimple && analysis.score_explanation && (
              <div className="mt-6 rounded-xl bg-black/20 p-4 border border-white/5">
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-white">Score Explanation:</span> {analysis.score_explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Radar Chart for Section Scores */}
      {!isSimple && radarData.length > 0 && (
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-6 text-xl font-bold">🎯 Section-by-Section Breakdown</h2>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="h-72 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
              {radarData.map((d, i) => (
                <div key={i} className="flex flex-col rounded-xl bg-black/20 p-4 border border-white/5">
                  <span className="text-xs text-slate-400 font-semibold uppercase">{d.subject}</span>
                  <span className={`text-xl font-bold ${d.A >= 80 ? 'text-emerald-400' : d.A >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{d.A}/100</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <h2 className="mb-5 text-xl font-bold text-emerald-400">✅ {isSimple ? 'What You Did Well' : 'Strengths'}</h2>
          <ul className="space-y-4">
            {renderList(isSimple ? analysis.simple_review!.strengths : analysis.strengths, true)}
          </ul>
        </section>
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h2 className="mb-5 text-xl font-bold text-amber-400">⚠️ {isSimple ? 'What Needs Fixing' : 'Weaknesses'}</h2>
          <ul className="space-y-4">
            {renderList(isSimple ? analysis.simple_review!.weaknesses : analysis.weaknesses, false)}
          </ul>
        </section>
      </div>

      {/* Target Role Comparison */}
      {!isSimple && analysis.target_role_comparison && (
        <section className="mb-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <h2 className="mb-4 text-xl font-bold text-blue-400">⚖️ Target Role Alignment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-black/20 p-5 border border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Industry Expectations</h3>
              <p className="text-sm text-slate-200 leading-relaxed">{analysis.target_role_comparison.role_expectations}</p>
            </div>
            <div className="rounded-xl bg-black/20 p-5 border border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Your Alignment</h3>
              <p className="text-sm text-slate-200 leading-relaxed">{analysis.target_role_comparison.candidate_alignment}</p>
            </div>
          </div>
        </section>
      )}

      {/* Ranked Recommendations Roadmap */}
      <section className="mb-12">
        <h2 className="mb-5 text-xl font-bold">🛣️ {isSimple ? 'Step-by-Step Fixes' : 'Prioritized Improvement Roadmap'}</h2>
        
        {isSimple && analysis.simple_review ? (
          <div className="space-y-4">
            {analysis.simple_review.improvement_roadmap.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold">{i + 1}</div>
                <p className="leading-relaxed text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        ) : analysis.recommendations ? (
          <div className="space-y-8">
            {analysis.recommendations.high_impact.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-bold text-red-400 mb-3"><span className="text-xl">🚨</span> High Impact (Do these first)</h3>
                <div className="space-y-3">
                  {analysis.recommendations.high_impact.map((rec, i) => (
                    <div key={i} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-slate-200">{rec}</div>
                  ))}
                </div>
              </div>
            )}
            {analysis.recommendations.medium_impact.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-bold text-amber-400 mb-3"><span className="text-xl">⚡</span> Medium Impact</h3>
                <div className="space-y-3">
                  {analysis.recommendations.medium_impact.map((rec, i) => (
                    <div key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-slate-200">{rec}</div>
                  ))}
                </div>
              </div>
            )}
            {analysis.recommendations.low_impact.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-bold text-slate-300 mb-3"><span className="text-xl">💡</span> Low Impact (Quick Polish)</h3>
                <div className="space-y-3">
                  {analysis.recommendations.low_impact.map((rec, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">{rec}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {analysis.improvement_roadmap?.map((item: string, i: number) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">{item}</div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600/25 to-indigo-600/25 p-8 text-center ring-1 ring-white/10">
        <h3 className="mb-2 text-xl font-bold">Ready to analyze again?</h3>
        <p className="mb-6 text-slate-400">Upload your updated resume anytime to see your progress and get fresh feedback.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/upload" className="inline-block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 font-semibold shadow-lg shadow-violet-500/20 transition hover:opacity-90">
            Upload Updated Resume
          </Link>
          <Link to={email ? `/tracker?email=${encodeURIComponent(email)}` : '/tracker'} className="inline-block rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-8 py-3 font-semibold text-emerald-400 transition hover:bg-emerald-500/20">
            📈 View Growth Tracker
          </Link>
        </div>
      </div>
    </main>
  )
}
