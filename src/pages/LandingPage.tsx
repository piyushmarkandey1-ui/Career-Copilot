import { Link } from 'react-router-dom'
import { ArrowRight, FileCheck, Target, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Simplified Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/[0.08] blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/[0.06] blur-[80px] rounded-full"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-40 pb-16 sm:pb-24 lg:pb-32">
        
        {/* Hero Section - Enhanced with better hierarchy */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge with pulse effect */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm sm:text-sm font-semibold mb-6 sm:mb-8 border border-indigo-200 shadow-sm">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">AI-Powered Career Companion</span>
          </div>
          
          {/* Main headline with improved readability */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight px-4 sm:px-0">
            Stop guessing why you <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-fuchsia-600 to-indigo-600">
              aren't getting interviews
            </span>
          </h1>
          
          {/* Subheadline with better spacing */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            Upload your resume and get an instant, brutally honest AI analysis. Discover missing keywords, optimize your layout, and land your dream role faster.
          </p>
          
          {/* Social proof - Trust building - Responsive */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-10 text-xs sm:text-sm text-slate-600 px-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="whitespace-nowrap">Free analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="whitespace-nowrap">Instant results</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="whitespace-nowrap">No signup required</span>
            </div>
          </div>
          
          {/* CTA buttons with enhanced hierarchy - Full width on mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Link
              to="/upload"
              className="btn-primary-premium group w-full sm:w-auto justify-center min-h-[48px]"
            >
              <span>Analyze My Resume Now</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/tracker"
              className="btn-secondary-premium w-full sm:w-auto justify-center min-h-[48px]"
            >
              View Growth Tracker
            </Link>
          </div>
        </div>

        {/* Feature Cards - Responsive grid */}
        <div className="mt-16 sm:mt-24 lg:mt-32 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
          <div className="premium-card p-6 sm:p-8 group cursor-pointer">
            <div className="icon-box-indigo w-12 h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <Target className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-2 sm:mb-3">Role-Specific Matching</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              We don't just give generic advice. Select your target role (Frontend, DevOps, PM, etc.) and we evaluate your resume against real-world ATS algorithms for that specific job.
            </p>
          </div>

          <div className="premium-card p-6 sm:p-8 group cursor-pointer">
            <div className="icon-box-fuchsia w-12 h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <FileCheck className="w-6 h-6 text-fuchsia-600 flex-shrink-0" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-2 sm:mb-3">Brutal Honesty</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Get actionable feedback on missing keywords, weak bullet points, and bad formatting. We tell you exactly what recruiters will hate before they even see it.
            </p>
          </div>

          <div className="premium-card p-6 sm:p-8 group cursor-pointer sm:col-span-2 lg:col-span-1">
            <div className="icon-box-emerald w-12 h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-2 sm:mb-3">Track Your Growth</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Don't just fix it once. Track your ATS score and readiness over time with beautiful charts. See exactly how your revisions are improving your chances.
            </p>
          </div>
        </div>

        {/* How It Works Section - Responsive */}
        <div className="mt-16 sm:mt-20 lg:mt-24 text-center px-4 sm:px-0">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-slate-100">How it works</h2>
          <p className="text-slate-600 mb-8 sm:mb-12 text-sm sm:text-base">Three simple steps to a better resume</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-lg sm:text-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">1</div>
              <h3 className="font-semibold text-slate-100 mb-2 text-base sm:text-lg">Upload Resume</h3>
              <p className="text-sm text-slate-600">Drop your PDF and select your target role</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-lg sm:text-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">2</div>
              <h3 className="font-semibold text-slate-100 mb-2 text-base sm:text-lg">AI Analysis</h3>
              <p className="text-sm text-slate-600">Our AI evaluates every aspect in seconds</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-lg sm:text-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">3</div>
              <h3 className="font-semibold text-slate-100 mb-2 text-base sm:text-lg">Get Feedback</h3>
              <p className="text-sm text-slate-600">Review detailed insights and improve</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
