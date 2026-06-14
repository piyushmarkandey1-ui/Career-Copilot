import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-32 text-center">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute left-1/4 top-40 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Find out why you{' '}
            <span className="bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 bg-clip-text text-transparent">
              won't get hired.
            </span>
            <br />
            Then fix it.
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-400 sm:text-xl">
            Our AI analyzes your resume in seconds, identifies what's holding you back, and gives you actionable steps to land more interviews.
          </p>

          <Link
            to="/upload"
            className="inline-block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-10 py-4 text-lg font-semibold shadow-lg shadow-violet-500/25 transition hover:opacity-90 active:scale-95"
          >
            Upload My Resume
          </Link>
        </div>
      </section>
    </main>
  )
}
