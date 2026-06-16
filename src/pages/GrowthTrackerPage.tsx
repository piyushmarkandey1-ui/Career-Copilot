/**
 * GrowthTrackerPage.tsx
 *
 * Fully personalized growth tracker — every chart and insight is derived
 * exclusively from the user's real saved resume_history records.
 * No hardcoded or mock data is used anywhere in this component.
 */

import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

// Use relative paths — Vite proxy forwards /api/* to the backend (no CORS, works in prod too)
const API_URL = ''

// ── Types ─────────────────────────────────────────────────────────────────────
interface HistoryRecord {
  id: string
  email: string
  target_role: string
  resume_version: number
  readiness_score: number
  ats_score: number | null
  skills_score: number | null
  project_score: number | null
  layout_score: number | null
  strengths: string[]
  weaknesses: string[]
  improvement_roadmap: string[]
  analysis_date: string
  full_analysis_json: Record<string, unknown>
}

interface ChartPoint {
  label: string        // "Version 1 - Jun 15"
  version: string      // "V1"
  overallScore: number
  atsScore: number | null
  skillsScore: number | null
  projectScore: number | null
  layoutScore: number | null
  strengths: number
  weaknesses: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function fmtDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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

function deltaColor(d: number) {
  if (d > 0) return 'text-emerald-400'
  if (d < 0) return 'text-red-400'
  return 'text-slate-400'
}

function deltaSign(d: number) {
  return d > 0 ? `+${d}` : String(d)
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; color: string; name: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-3 text-sm shadow-xl min-w-[140px]">
      <p className="mb-2 font-semibold text-slate-300 text-xs">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {p.name}: {p.value ?? '—'}
        </p>
      ))}
    </div>
  )
}

// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
      style={{ background: `${scoreColor(score)}22`, color: scoreColor(score) }}
    >
      {score} — {scoreLabel(score)}
    </span>
  )
}

// ── Trend badge ───────────────────────────────────────────────────────────────
function TrendBadge({ delta }: { delta: number }) {
  if (delta > 0) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
      ↑ Improved +{delta} pts
    </span>
  )
  if (delta < 0) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-400">
      ↓ Declined {delta} pts
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-3 py-1 text-xs font-bold text-slate-400">
      → No change
    </span>
  )
}

// ── Insight generator (pure — based only on real record data) ─────────────────
function buildInsights(records: HistoryRecord[]): string[] {
  if (records.length < 2) return []

  const insights: string[] = []
  const first = records[0]
  const prev = records[records.length - 2]
  const last = records[records.length - 1]

  // Overall score trend
  const overallDelta = last.readiness_score - first.readiness_score
  const recentDelta = last.readiness_score - prev.readiness_score
  const daysDiff = Math.round(
    (new Date(last.analysis_date).getTime() - new Date(first.analysis_date).getTime()) /
    86_400_000
  )

  if (overallDelta > 0) {
    insights.push(`🚀 Your overall readiness score improved by ${overallDelta} point${overallDelta !== 1 ? 's' : ''} from Version 1 to Version ${records.length}${daysDiff > 0 ? ` over ${daysDiff} day${daysDiff !== 1 ? 's' : ''}` : ''}.`)
  } else if (overallDelta < 0) {
    insights.push(`⚠️ Your readiness score declined by ${Math.abs(overallDelta)} points from Version 1 to Version ${records.length}. Review the weaknesses in the latest version.`)
  } else {
    insights.push(`📊 Your score held steady at ${last.readiness_score} from Version 1 to Version ${records.length}. Target the specific gaps listed to make a measurable jump.`)
  }

  // Recent version change
  if (records.length >= 3 && recentDelta !== overallDelta) {
    if (recentDelta > 0) {
      insights.push(`📈 Version ${records.length} improved by ${recentDelta} points over Version ${records.length - 1}.`)
    } else if (recentDelta < 0) {
      insights.push(`📉 Version ${records.length} dropped by ${Math.abs(recentDelta)} points compared to Version ${records.length - 1}. This means changes in the latest upload weakened the overall score.`)
    }
  }

  // Best version
  const bestScore = Math.max(...records.map(r => r.readiness_score))
  const bestVersion = records.findIndex(r => r.readiness_score === bestScore) + 1
  if (bestVersion !== records.length) {
    insights.push(`🏆 Your best score was ${bestScore} in Version ${bestVersion}, not your latest. Try to restore what made that version stronger.`)
  } else {
    insights.push(`🏆 Your latest resume (Version ${records.length}) is your strongest version yet with a score of ${bestScore}.`)
  }

  // Weakness resolution
  const firstWeakSet = new Set(first.weaknesses.map(w => w.slice(0, 30).toLowerCase()))
  const lastWeakSet = new Set(last.weaknesses.map(w => w.slice(0, 30).toLowerCase()))
  const resolved = [...firstWeakSet].filter(w => ![...lastWeakSet].some(lw => lw.startsWith(w.slice(0, 20))))
  const newWeaknesses = [...lastWeakSet].filter(w => ![...firstWeakSet].some(fw => fw.startsWith(w.slice(0, 20))))
  if (resolved.length > 0) {
    insights.push(`✅ ${resolved.length} weakness${resolved.length !== 1 ? 'es' : ''} from Version 1 no longer appear in Version ${records.length}.`)
  }
  if (newWeaknesses.length > 0) {
    insights.push(`⚠️ ${newWeaknesses.length} new weakness${newWeaknesses.length !== 1 ? 'es' : ''} appeared in Version ${records.length} that weren't present in Version 1.`)
  }

  // Strength count change
  const strengthDelta = last.strengths.length - first.strengths.length
  if (strengthDelta > 0) {
    insights.push(`💪 You gained ${strengthDelta} additional strength${strengthDelta !== 1 ? 's' : ''} from Version 1 to Version ${records.length}.`)
  } else if (strengthDelta < 0) {
    insights.push(`📌 The number of identified strengths decreased by ${Math.abs(strengthDelta)} from Version 1 to Version ${records.length}.`)
  }

  return insights
}

// ── Role filter pills ─────────────────────────────────────────────────────────
function RolePills({ roles, selected, onSelect }: {
  roles: string[]
  selected: string
  onSelect: (r: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect('')}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
          selected === ''
            ? 'bg-violet-600 text-white'
            : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'
        }`}
      >
        All Roles
      </button>
      {roles.map(r => (
        <button
          key={r}
          onClick={() => onSelect(r)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            selected === r
              ? 'bg-violet-600 text-white'
              : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GrowthTrackerPage() {
  const [searchParams] = useSearchParams()
  const [emailInput, setEmailInput] = useState(searchParams.get('email') ?? '')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [allRecords, setAllRecords] = useState<HistoryRecord[]>([])
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isPersisted, setIsPersisted] = useState(true)

  // ── Fetch history ───────────────────────────────────────────────────────────
  async function fetchHistory(email: string) {
    const trimmed = email.trim()
    if (!trimmed) { setError('Please enter your email address.'); return }
    setLoading(true)
    setError('')
    try {
      const url = `${API_URL}/api/history?email=${encodeURIComponent(trimmed)}`
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to fetch history.')
      setAllRecords(json.data ?? [])
      setAvailableRoles(json.available_roles ?? [])
      setIsPersisted(json.persisted ?? true)
      setSubmittedEmail(trimmed)
      setSelectedRole('')
      setFetched(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // ── Clear history ───────────────────────────────────────────────────────────
  async function clearHistory() {
    if (!submittedEmail) return
    if (!window.confirm('Are you sure you want to permanently delete all history for this email? This will give you a fresh start.')) return

    setIsClearing(true)
    setError('')
    try {
      const url = `${API_URL}/api/history?email=${encodeURIComponent(submittedEmail)}`
      const res = await fetch(url, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to clear history.')
      
      // Reset state for a fresh start
      setAllRecords([])
      setAvailableRoles([])
      setSelectedRole('')
      alert('History cleared successfully. You now have a fresh start!')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong while clearing history.')
    } finally {
      setIsClearing(false)
    }
  }

  // Auto-fetch from URL param
  useEffect(() => {
    const emailFromUrl = searchParams.get('email')
    if (emailFromUrl) {
      setEmailInput(emailFromUrl)
      fetchHistory(emailFromUrl)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtered records (by selected role) ─────────────────────────────────────
  const records = useMemo<HistoryRecord[]>(() => {
    if (!selectedRole) return allRecords
    return allRecords.filter(r => r.target_role === selectedRole)
  }, [allRecords, selectedRole])

  // ── Chart data — derived purely from real records ────────────────────────────
  const chartData = useMemo<ChartPoint[]>(() => {
    if (records.length === 0) return []
    return records.map((item, index) => ({
      label: `Version ${index + 1} – ${fmtDate(item.analysis_date)}`,
      version: `V${index + 1}`,
      overallScore: item.readiness_score,
      atsScore: item.ats_score,
      skillsScore: item.skills_score,
      projectScore: item.project_score,
      layoutScore: item.layout_score,
      strengths: item.strengths.length,
      weaknesses: item.weaknesses.length,
    }))
  }, [records])

  // Guard: all chart values identical → no real trend to show
  const chartIsFlat = chartData.length >= 2 &&
    chartData.every(p => p.overallScore === chartData[0].overallScore)

  const insights = useMemo(() => buildInsights(records), [records])

  const first = records[0]
  const last = records[records.length - 1]
  const overallDelta = records.length >= 2 ? last.readiness_score - first.readiness_score : null
  const bestScore = records.length > 0 ? Math.max(...records.map(r => r.readiness_score)) : null

  // Sub-scores chart shows whenever there are 2+ data points (scores are always calculated)
  const hasSubScores = chartData.length >= 2

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">

      {/* Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold">📈 Resume Growth Tracker</h1>
          <p className="mt-1 text-slate-400">
            Personalized charts generated from your actual resume history.
          </p>
        </div>
        <Link
          to="/upload"
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
        >
          ↑ Analyze New Resume
        </Link>
      </div>

      {/* Email lookup */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
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
          {allRecords.length > 0 && (
            <button
              onClick={clearHistory}
              disabled={isClearing}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3 font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-40"
            >
              {isClearing ? 'Clearing…' : 'Clear History'}
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">⚠️ {error}</p>}
        {fetched && !isPersisted && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            ⚠️ Running in session memory mode — history will reset when the server restarts. Configure Supabase to persist data permanently.
          </div>
        )}
      </div>




      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {fetched && (
        <>
          {/* No records at all */}
          {allRecords.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-xl font-semibold text-slate-300">No history found</p>
              <p className="mt-2 text-slate-500">
                No analyses were found for <strong>{submittedEmail}</strong>.<br />
                Make sure you enter your email on the upload page before analyzing.
              </p>
              <Link
                to="/upload"
                className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-3 font-semibold transition hover:opacity-90"
              >
                Analyze Your First Resume
              </Link>
            </div>
          ) : (
            <>
              {/* Role filter */}
              {availableRoles.length > 1 && (
                <div className="mb-8">
                  <p className="mb-3 text-sm font-medium text-slate-400">Filter by target role:</p>
                  <RolePills
                    roles={availableRoles}
                    selected={selectedRole}
                    onSelect={setSelectedRole}
                  />
                </div>
              )}

              {/* No records after role filter */}
              {records.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                  <p className="text-slate-300">No history for <strong>{selectedRole}</strong>.</p>
                  <button onClick={() => setSelectedRole('')} className="mt-4 text-sm text-violet-400 underline">
                    Show all roles
                  </button>
                </div>
              ) : (
                <>
                  {/* Summary stats */}
                  <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                      <p className="text-3xl font-extrabold text-violet-400">{records.length}</p>
                      <p className="mt-1 text-xs text-slate-400">Distinct Resumes Uploaded</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                      <p className="text-3xl font-extrabold" style={{ color: scoreColor(last.readiness_score) }}>
                        {last.readiness_score}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Latest Score</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                      {overallDelta !== null ? (
                        <>
                          <p className={`text-3xl font-extrabold ${deltaColor(overallDelta)}`}>
                            {deltaSign(overallDelta)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">Total Change</p>
                        </>
                      ) : (
                        <>
                          <p className="text-3xl font-extrabold text-slate-500">—</p>
                          <p className="mt-1 text-xs text-slate-400">Total Change</p>
                        </>
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                      <p className="text-3xl font-extrabold text-emerald-400">{bestScore}</p>
                      <p className="mt-1 text-xs text-slate-400">Best Score</p>
                    </div>
                  </div>

                  {/* ── Single record: no trend yet ─────────────────────── */}
                  {records.length === 1 ? (
                    <div className="mb-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8 text-center">
                      <p className="text-4xl mb-3">🌱</p>
                      <p className="text-lg font-bold text-slate-200">This is your first analysis</p>
                      <p className="mt-2 text-slate-400">
                        Upload another version of your resume using the same email to unlock growth charts, trend lines, and comparison insights.
                      </p>
                      <Link
                        to="/upload"
                        className="mt-5 inline-block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold transition hover:opacity-90"
                      >
                        Upload Updated Resume
                      </Link>
                    </div>
                  ) : chartIsFlat ? (
                    /* Chart data is identical — nothing meaningful to plot */
                    <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                      <p className="text-amber-300 font-semibold">No personalized growth data found.</p>
                      <p className="mt-1 text-sm text-slate-400">
                        All versions returned the same score ({chartData[0].overallScore}). Update your resume with meaningful changes to see a trend.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* ── AI Insights ─────────────────────────────────── */}
                      {insights.length > 0 && (
                        <section className="mb-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
                          <h2 className="mb-4 text-lg font-bold text-violet-300">💡 Personalized Insights</h2>
                          <ul className="space-y-2">
                            {insights.map((insight, i) => (
                              <li key={i} className="text-sm text-slate-200">{insight}</li>
                            ))}
                          </ul>
                        </section>
                      )}

                      {/* ── Charts ──────────────────────────────────────── */}
                      <section className="mb-8 space-y-6">
                        <h2 className="text-xl font-bold">📊 Your Progress Charts</h2>
                        <p className="text-xs text-slate-500">
                          Generated from {records.length} saved analysis{records.length !== 1 ? 'es' : ''} for <strong>{submittedEmail}</strong>
                          {selectedRole ? ` — ${selectedRole}` : ''}.
                        </p>

                        {/* Overall score */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-300">Overall Readiness Score</h3>
                            {overallDelta !== null && <TrendBadge delta={overallDelta} />}
                          </div>
                          <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="gradOverall" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-10} />
                              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="overallScore" name="Overall Score"
                                stroke="#8b5cf6" fill="url(#gradOverall)" strokeWidth={3}
                                dot={{ fill: '#8b5cf6', r: 5 }} activeDot={{ r: 7 }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Sub-scores (only if stored) */}
                        {hasSubScores && chartData.length >= 2 && (
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h3 className="mb-4 font-semibold text-slate-300">Score Breakdown Over Time</h3>
                            <ResponsiveContainer width="100%" height={260}>
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-10} />
                                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                                {chartData.some(p => p.atsScore !== null) && (
                                  <Line type="monotone" dataKey="atsScore" name="ATS Score"
                                    stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} activeDot={{ r: 6 }} />
                                )}
                                {chartData.some(p => p.skillsScore !== null) && (
                                  <Line type="monotone" dataKey="skillsScore" name="Skills Score"
                                    stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                                )}
                                {chartData.some(p => p.projectScore !== null) && (
                                  <Line type="monotone" dataKey="projectScore" name="Project Score"
                                    stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 3" />
                                )}
                                {chartData.some(p => p.layoutScore !== null) && (
                                  <Line type="monotone" dataKey="layoutScore" name="Layout Score"
                                    stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 4 }} activeDot={{ r: 6 }} strokeDasharray="3 2" />
                                )}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* Strengths vs Weaknesses */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                          <h3 className="mb-4 font-semibold text-slate-300">Strengths vs Weaknesses Count</h3>
                          <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-10} />
                              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                              <Line type="monotone" dataKey="strengths" name="Strengths"
                                stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 5 }} activeDot={{ r: 7 }} />
                              <Line type="monotone" dataKey="weaknesses" name="Weaknesses"
                                stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 5 }} activeDot={{ r: 7 }} strokeDasharray="5 3" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </section>
                    </>
                  )}

                  {/* ── Version-by-Version History ───────────────────────── */}
                  <section className="mb-8">
                    <h2 className="mb-5 text-xl font-bold">🗂️ Version History</h2>
                    <div className="space-y-4">
                      {[...records].reverse().map((record, i) => {
                        const versionNumber = records.length - i
                        const isLatest = i === 0
                        const prevRecord = records[records.length - 1 - i - 1]
                        const scoreDeltaVsPrev = prevRecord
                          ? record.readiness_score - prevRecord.readiness_score
                          : null

                        // Resolved weaknesses vs previous version
                        const resolvedWeaknesses = prevRecord
                          ? record.weaknesses.filter(
                              w => !prevRecord.weaknesses.some(
                                pw => pw.toLowerCase().slice(0, 25) === w.toLowerCase().slice(0, 25)
                              )
                            )
                          : []
                        // New weaknesses vs previous version
                        const newWeaknessesVsPrev = prevRecord
                          ? prevRecord.weaknesses.filter(
                              pw => !record.weaknesses.some(
                                w => w.toLowerCase().slice(0, 25) === pw.toLowerCase().slice(0, 25)
                              )
                            )
                          : []
                        // New strengths vs previous
                        const newStrengths = prevRecord
                          ? record.strengths.filter(
                              s => !prevRecord.strengths.some(
                                ps => ps.toLowerCase().slice(0, 25) === s.toLowerCase().slice(0, 25)
                              )
                            )
                          : []

                        return (
                          <div
                            key={record.id}
                            className={`rounded-2xl border p-6 transition-all ${
                              isLatest
                                ? 'border-violet-500/40 bg-violet-500/5'
                                : 'border-white/10 bg-white/5'
                            }`}
                          >
                            {/* Header row */}
                            <div className="mb-4 flex flex-wrap items-center gap-3">
                              <span className="text-sm font-bold text-slate-300">
                                Version {versionNumber} — {fmtDateLong(record.analysis_date)}
                              </span>
                              <ScoreBadge score={record.readiness_score} />
                              {scoreDeltaVsPrev !== null && <TrendBadge delta={scoreDeltaVsPrev} />}
                              {isLatest && (
                                <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-bold text-violet-300">
                                  Latest
                                </span>
                              )}
                              <span className="ml-auto text-xs text-slate-500">{record.target_role}</span>
                            </div>

                            {/* Version comparison callouts */}
                            {prevRecord && (
                              <div className="mb-4 space-y-1 text-xs">
                                {resolvedWeaknesses.length > 0 && (
                                  <p className="text-emerald-400">✅ {resolvedWeaknesses.length} weakness{resolvedWeaknesses.length !== 1 ? 'es' : ''} resolved compared to Version {versionNumber - 1}</p>
                                )}
                                {newWeaknessesVsPrev.length > 0 && (
                                  <p className="text-red-400">⚠️ {newWeaknessesVsPrev.length} new issue{newWeaknessesVsPrev.length !== 1 ? 's' : ''} appeared compared to Version {versionNumber - 1}</p>
                                )}
                                {newStrengths.length > 0 && (
                                  <p className="text-cyan-400">💪 {newStrengths.length} new strength{newStrengths.length !== 1 ? 's' : ''} detected</p>
                                )}
                              </div>
                            )}

                            {/* Strengths + Weaknesses */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                                  Strengths ({record.strengths.length})
                                </p>
                                <ul className="space-y-1">
                                  {record.strengths.map((s, j) => (
                                    <li key={j} className="flex items-start gap-2 text-sm text-slate-200">
                                      <span className="mt-0.5 shrink-0 text-emerald-500">•</span>
                                      <span>{s}</span>
                                      {newStrengths.includes(s) && (
                                        <span className="ml-1 shrink-0 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">NEW</span>
                                      )}
                                    </li>
                                  ))}
                                  {record.strengths.length === 0 && (
                                    <li className="text-sm text-slate-500">No strengths recorded.</li>
                                  )}
                                </ul>
                              </div>
                              <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                                  Weaknesses ({record.weaknesses.length})
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
                    <h3 className="mb-2 text-xl font-bold">Keep building on your progress!</h3>
                    <p className="mb-6 text-slate-400">
                      Upload your updated resume with the same email to add a new version to your tracker.
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
        </>
      )}

      {/* Pre-search empty state */}
      {!fetched && !loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-14 text-center">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-xl font-semibold text-slate-300">Enter your email to view history</p>
          <p className="mt-2 text-sm text-slate-500">
            Your analyses are stored by email. Use the same email across sessions to track growth over time.
          </p>
        </div>
      )}
    </main>
  )
}
