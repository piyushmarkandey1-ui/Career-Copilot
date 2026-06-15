import { Link } from 'react-router-dom'
import { ArrowRight, FileCheck, Target, TrendingUp, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 -translate-y-12 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/30 blur-[120px] rounded-full mix-blend-screen animate-blob"></div>
        <div className="absolute top-40 -translate-x-12 left-1/4 w-[600px] h-[600px] bg-fuchsia-600/20 blur-[120px] rounded-full mix-blend-screen animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 translate-x-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-24 sm:pt-40 sm:pb-32 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-8 backdrop-blur-md animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Career Companion</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Stop guessing why you <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-400 animate-shine bg-[length:200%_auto]">
              aren't getting interviews.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Upload your resume and get an instant, brutally honest AI analysis. Discover missing keywords, optimize your layout, and land your dream role faster.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/upload"
              className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-900 transition-all hover:bg-slate-200 hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(255,255,255,0.3)] active:scale-95"
            >
              Analyze My Resume Now
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/tracker"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-md px-8 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:border-slate-600 active:scale-95"
            >
              View Growth Tracker
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10 h-32 bottom-0 top-auto"></div>
          
          <div className="glass-panel p-8 rounded-3xl animate-float" style={{ animationDelay: '0s' }}>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/30">
              <Target className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Role-Specific Matching</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We don't just give generic advice. Select your target role (Frontend, DevOps, PM, etc.) and we evaluate your resume against real-world ATS algorithms for that specific job.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl animate-float" style={{ animationDelay: '1s' }}>
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center mb-6 border border-fuchsia-500/30">
              <FileCheck className="w-6 h-6 text-fuchsia-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Brutal Honesty</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Get actionable feedback on missing keywords, weak bullet points, and bad formatting. We tell you exactly what recruiters will hate before they even see it.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl animate-float" style={{ animationDelay: '2s' }}>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Track Your Growth</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Don't just fix it once. Track your ATS score and readiness over time with beautiful charts. See exactly how your revisions are improving your chances.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
