import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart,
} from 'recharts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface HistoryRecord {
  id: string
  email: string
  target_role: string
  resume_version: number
  readiness_score: number
  strengths: string[]
  weaknesses: string[]
  improvement_roadmap: string[]
  analysis_date: string
  full_analysis_json: Record<string, unknown>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function scoreColor(score: number) {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(score: number) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Work'
}

// ── Custom tooltip for recharts ───────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; color: string; name: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-3 text-sm shadow-xl">
      <p className="mb-1 text-slate-400">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold"
      style={{ background: `${color}22`, color }}
    >
      {score} — {scoreLabel(score)}
    </span>
  )
}

// ── Insight generator ─────────────────────────────────────────────────────────
function generateInsights(records: HistoryRecord[]): string[] {
  if (records.length < 2) return ['Analyze your resume at least twice to unlock insights.']

  const insights: string[] = []
  const first = records[0]
  const last = records[records.length - 1]
  const diff = last.readiness_score - first.readiness_score
  const daysDiff = Math.round(
    (new Date(last.analysis_date).getTime() - new Date(first.analysis_date).getTime()) /
    (1000 * 60 * 60 * 24)
  )

  if (diff > 0) {
    insights.push(
      `🚀 Your readiness score improved by ${diff} points${daysDiff > 0 ? ` in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}` : ''}.`
    )
  } else if (diff < 0) {
    insights.push(`⚠️ Your readiness score dropped by ${Math.abs(diff)} points. Review the weaknesses identified.`)
  } else {
    insights.push('📊 Your readiness score has remained stable across attempts.')
  }

  // Resolved weaknesses
  const firstWeaknesses = new Set(first.weaknesses.map(w => w.toLowerCase()))
  const lastWeaknesses = new Set(last.weaknesses.map(w => w.toLowerCase()))
  const resolved = [...firstWeaknesses].filter(w => ![...lastWeaknesses].some(lw => lw.includes(w.slice(0, 20))))
  if (resolved.length > 0) {
    insights.push(`✅ You resolved ${resolved.length} weakness${resolved.length !== 1 ? 'es' : ''} from your first attempt.`)
  }

  // New strengths
  const firstStrengths = new Set(first.strengths.map(s => s.toLowerCase()))
  const newStrengths = last.strengths.filter(
    s => ![...firstStrengths].some(fs => fs.includes(s.toLowerCase().slice(0, 20)))
  )
  if (newStrengths.length > 0) {
    insights.push(`💪 You added ${newStrengths.length} new strength${newStrengths.length !== 1 ? 's' : ''} to your resume.`)
  }

  // Best score
  const best = Math.max(...records.map(r => r.readiness_score))
  if (best === last.readiness_score) {
    insights.push('🏆 Your latest resume is your strongest version yet.')
  }

  return insights
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GrowthTrackerPage() {
  const [searchParams] = useSearchParams()
  const [emailInput, setEmailInput] = useState(searchParams.get('email') ?? '')
  const [submittedEmail, setSubmittedEmail] = useState(searchParams.get('email') ?? '')
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)

  async function fetchHistory(email: string) {
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/history?email=${encodeURIComponent(email.trim())}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to fetch history')
      setRecords(json.data ?? [])
      setSubmittedEmail(email.trim())
      setFetched(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch if email comes from URL
  useEffect(() => {
    const emailFromUrl = searchParams.get('email')
    if (emailFromUrl) fetchHistory(emailFromUrl)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Chart data
  const chartData = records.map((r, i) => ({
    name: `v${i + 1}\n${formatDate(r.analysis_date)}`,
    label: formatDate(r.analysis_date),
    version: `v${r.resume_version}`,
    score: r.readiness_score,
    strengths: r.strengths.length,
    weaknesses: r.weaknesses.length,
    role: r.target_role,
  }))

  const insights = generateInsights(records)
  const first = records[0]
  const last = records[records.length - 1]
  const scoreDelta = records.length >= 2 ? last.readiness_score - first.readiness_score : null

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold">📈 Resume Growth Tracker</h1>
          <p className="mt-1 text-slate-400">Track your resume improvement over time.</p>
        </div>
        <Link
          to="/upload"
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
        >
          ↑ Analyze New Resume
        </Link>
      </div>

      {/* Email lookup */}
      <div className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold">🔍 Look Up Your History</h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchHistory(emailInput)}
            placeholder="Enter the email you used during analysis…"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
          <button
            onClick={() => fetchHistory(emailInput)}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? 'Loading…' : 'Fetch'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">⚠️ {error}</p>}
      </div>

      {/* Results */}
      {fetched && (
        <>
          {records.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              <p className="text-xl font-semibold text-slate-300">No history found</p>
              <p className="mt-2 text-slate-500">
                No analyses were found for <strong>{submittedEmail}</strong>.<br />
                Make sure you enter your email on the upload page before analyzing.
              </p>
              <Link
                to="/upload"
                className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-3 font-semibold transition hover:opacity-90"
              >
                Analyze Your Resume
              </Link>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <p className="text-3xl font-extrabold text-violet-400">{records.length}</p>
                  <p className="mt-1 text-sm text-slate-400">Total Attempts</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <p className="text-3xl font-extrabold" style={{ color: scoreColor(last.readiness_score) }}>
                    {last.readiness_score}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Latest Score</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <p className={`text-3xl font-extrabold ${scoreDelta !== null && scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {scoreDelta !== null ? (scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta) : '—'}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Score Change</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <p className="text-3xl font-extrabold text-emerald-400">{last.strengths.length}</p>
                  <p className="mt-1 text-sm text-slate-400">Current Strengths</p>
                </div>
              </div>

              {/* AI Insights */}
              <section className="mb-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
                <h2 className="mb-4 text-lg font-bold text-violet-300">💡 AI Insights</h2>
                <ul className="space-y-2">
                  {insights.map((insight, i) => (
                    <li key={i} className="text-slate-200">{insight}</li>
                  ))}
                </ul>
              </section>

              {/* Charts */}
              <section className="mb-8 space-y-6">
                <h2 className="text-xl font-bold">📊 Visual Progress</h2>

                {/* Readiness Score over time */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 font-semibold text-slate-300">Readiness Score Over Time</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        name="Readiness Score"
                        stroke="#8b5cf6"
                        fill="url(#scoreGrad)"
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Strengths vs Weaknesses over time */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 font-semibold text-slate-300">Strengths vs Weaknesses Over Time</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
                      <Line
                        type="monotone"
                        dataKey="strengths"
                        name="Strengths"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ fill: '#10b981', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weaknesses"
                        name="Weaknesses"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ fill: '#f59e0b', r: 5 }}
                        activeDot={{ r: 7 }}
                        strokeDasharray="5 3"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Chronological History */}
              <section className="mb-8">
                <h2 className="mb-5 text-xl font-bold">🗂️ Analysis History</h2>
                <div className="space-y-4">
                  {[...records].reverse().map((record, i) => {
                    const isLatest = i === 0
                    const prevRecord = records[records.length - 1 - i - 1]
                    const resolvedWeaknesses = prevRecord
                      ? record.weaknesses.filter(
                          w => !prevRecord.weaknesses.some(pw => pw.toLowerCase().includes(w.toLowerCase().slice(0, 20)))
                        )
                      : []
                    const newStrengths = prevRecord
                      ? record.strengths.filter(
                          s => !prevRecord.strengths.some(ps => ps.toLowerCase().includes(s.toLowerCase().slice(0, 20)))
                        )
                      : []

                    return (
                      <div
                        key={record.id}
                        className={`rounded-2xl border p-6 transition ${
                          isLatest
                            ? 'border-violet-500/40 bg-violet-500/5'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                          <span className="text-sm font-semibold text-slate-400">
                            v{record.resume_version} · {formatDate(record.analysis_date)}
                          </span>
                          <ScoreBadge score={record.readiness_score} />
                          {isLatest && (
                            <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                              Latest
                            </span>
                          )}
                          <span className="ml-auto text-xs text-slate-500">{record.target_role}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {/* Strengths */}
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                              Strengths
                            </p>
                            <ul className="space-y-1">
                              {record.strengths.map((s, j) => {
                                const isNew = newStrengths.includes(s)
                                return (
                                  <li key={j} className="flex items-start gap-2 text-sm text-slate-200">
                                    <span className="mt-0.5 shrink-0 text-emerald-500">•</span>
                                    <span>{s}</span>
                                    {isNew && (
                                      <span className="ml-1 shrink-0 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                        NEW
                                      </span>
                                    )}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>

                          {/* Weaknesses */}
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                              Weaknesses
                            </p>
                            <ul className="space-y-1">
                              {record.weaknesses.map((w, j) => {
                                const isResolved = resolvedWeaknesses.includes(w)
                                return (
                                  <li key={j} className={`flex items-start gap-2 text-sm ${isResolved ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                    <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                                    {w}
                                  </li>
                                )
                              })}
                              {record.weaknesses.length === 0 && (
                                <li className="text-sm text-emerald-400">No weaknesses identified 🎉</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* CTA */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 p-8 text-center ring-1 ring-white/10">
                <h3 className="mb-2 text-xl font-bold">Keep improving!</h3>
                <p className="mb-6 text-slate-400">
                  Upload your updated resume and enter the same email to track your progress here.
                </p>
                <Link
                  to="/upload"
                  className="inline-block rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3 font-semibold shadow-lg shadow-emerald-500/20 transition hover:opacity-90"
                >
                  Analyze Updated Resume
                </Link>
              </div>
            </>
          )}
        </>
      )}

      {/* Empty state (before any search) */}
      {!fetched && !loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-xl font-semibold text-slate-300">Enter your email to view history</p>
          <p className="mt-2 text-slate-500">
            Your analyses are stored by email. Use the same email across sessions to track growth.
          </p>
        </div>
      )}
    </main>
  )
}
