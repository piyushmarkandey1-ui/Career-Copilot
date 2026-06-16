import { Target, FileCheck, Search, TrendingUp, Sparkles, Code2, Users, Database } from 'lucide-react'

export default function AboutPage() {
  const features = [
    {
      icon: <Search className="w-6 h-6 text-indigo-400" />,
      title: "AI Resume Analysis",
      description: "Upload your resume and receive a detailed review evaluating structure, skills, projects, experience, ATS compatibility, and target role fit."
    },
    {
      icon: <Target className="w-6 h-6 text-emerald-400" />,
      title: "Personalized Feedback",
      description: "Reviews are based on the actual content of the uploaded resume. We avoid generic feedback and focus on resume-specific observations."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
      title: "Strengths & Improvement Areas",
      description: "Highlights what is already working well and identifies critical areas that can be improved."
    },
    {
      icon: <Code2 className="w-6 h-6 text-blue-400" />,
      title: "Skill Gap Analysis",
      description: "Shows missing skills and qualifications specifically tailored for your selected target role."
    },
    {
      icon: <FileCheck className="w-6 h-6 text-rose-400" />,
      title: "ATS Compatibility Check",
      description: "Reviews whether your resume is optimized and readable for Applicant Tracking Systems."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
      title: "Resume Growth Tracker",
      description: "Stores previous resume analyses to track your progress over time, showing honest score improvements or declines."
    },
    {
      icon: <Users className="w-6 h-6 text-cyan-400" />,
      title: "Simplified Review Mode",
      description: "Converts detailed recruiter feedback into easy-to-understand language. Perfect for students and beginners."
    },
    {
      icon: <Database className="w-6 h-6 text-orange-400" />,
      title: "Resume Version Comparison",
      description: "Compare multiple resume versions side-by-side to view added skills, projects, and structural improvements."
    }
  ]

  const roles = [
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Data Scientist", "Product Manager", "DevOps Engineer",
    "Cybersecurity Analyst", "UI/UX Designer"
  ]

  const stack = ["React.js", "Node.js", "Express.js", "Supabase", "AI-powered analysis", "PDF parsing"]

  return (
    <main className="min-h-screen relative overflow-hidden pb-20">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 pt-32">
        
        {/* Hero Section */}
        <section className="text-center mb-24 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-white">
            About Career Copilot
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Career Copilot is an AI-powered resume analysis platform designed to help students, freshers, and job seekers understand their resume strengths, identify improvement areas, and track their growth over time.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-24 relative">
          <div className="glass-panel p-10 md:p-14 rounded-[2rem] border border-white/10 text-center shadow-[0_0_50px_rgba(99,102,241,0.1)]">
            <h2 className="text-3xl font-bold mb-6 text-white flex items-center justify-center gap-3">
              <Target className="w-8 h-8 text-indigo-400" />
              Our Mission
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed max-w-4xl mx-auto">
              Our goal is to provide honest, balanced, and personalized resume feedback that helps users improve their chances of securing interviews and career opportunities. We believe everyone deserves access to high-quality career guidance.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-24">
          <h2 className="text-4xl font-bold mb-12 text-center">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="glass-panel p-8 rounded-3xl hover:scale-105 transition-all duration-300 group border border-white/5 hover:border-white/20"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles & Tech Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-24">
          <section className="glass-panel p-10 rounded-[2rem] border border-white/10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-emerald-400" />
              Target Role Evaluation
            </h2>
            <p className="text-slate-300 mb-6 text-sm">Analyze your resume against specific career roles to get tailored feedback.</p>
            <div className="flex flex-wrap gap-3">
              {roles.map(role => (
                <span key={role} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">
                  {role}
                </span>
              ))}
            </div>
          </section>

          <section className="glass-panel p-10 rounded-[2rem] border border-white/10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Code2 className="w-6 h-6 text-blue-400" />
              Technology Stack
            </h2>
            <p className="text-slate-300 mb-6 text-sm">Built with modern, scalable, and powerful technologies.</p>
            <div className="flex flex-wrap gap-3">
              {stack.map(tech => (
                <span key={tech} className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300">
                  {tech}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* How It Works */}
        <section className="mb-24">
          <h2 className="text-4xl font-bold mb-16 text-center">How It Works</h2>
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 hidden md:block" />
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {[
                { step: '01', title: 'Upload', desc: 'Upload your resume PDF.' },
                { step: '02', title: 'Target', desc: 'Select your target role.' },
                { step: '03', title: 'Analyze', desc: 'AI processes your resume.' },
                { step: '04', title: 'Review', desc: 'Get personalized feedback.' },
                { step: '05', title: 'Grow', desc: 'Track improvements over time.' }
              ].map((item, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-indigo-500/50 flex items-center justify-center text-xl font-bold text-indigo-400 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-sm text-slate-500 bg-white/5 px-6 py-3 rounded-full border border-white/10">
            <span className="font-bold text-slate-400">Disclaimer:</span> 
            Career Copilot provides AI-assisted career guidance and resume analysis. Results should be used as recommendations and not as a guarantee of hiring outcomes.
          </div>
        </section>

      </div>
    </main>
  )
}
