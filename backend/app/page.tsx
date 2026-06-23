import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-teal-500/20">
      
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header */}
      <header className="max-w-5xl mx-auto w-full px-6 py-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Image src="/LOGO.png" alt="Job Copilot Logo" width={80} height={80} className="object-contain -mx-4 -my-4" />
          <span className="text-lg font-bold text-slate-100 tracking-tight">
            Job Copilot
          </span>
        </div>
        <Link 
          href="/reset-password" 
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider"
        >
          Password Reset
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto w-full px-6 py-16 flex-1 flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* Left Column: Utility Focus */}
        <div className="flex-1 space-y-6 max-w-lg text-left">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Fill out job forms <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-400">without the copy-paste.</span>
          </h1>
          
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Applying to jobs shouldn't feel like data entry. This browser extension scans job descriptions, identifies application questions, and automatically drafts answers tailored to your resume—right inside your browser.
          </p>

          <div className="pt-2">
            <a 
              href="/job-copilot.crx" 
              download
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg font-medium shadow-md shadow-teal-600/10 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Get Extension for Chrome
            </a>
          </div>
        </div>

        {/* Right Column: Setup Card */}
        <div className="w-full md:w-[380px] shrink-0">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            
            <div className="relative bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-5 shadow-xl">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Installation Guide
              </h2>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold text-teal-400">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold text-slate-200">Download Extension</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Click the button to download <code className="text-slate-300 font-mono bg-slate-950 px-1 py-0.5 rounded text-[10px]">job-copilot.crx</code>.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold text-teal-400">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold text-slate-200">Open Extension Page</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Open Chrome and navigate to <code className="text-teal-300 font-mono text-[10px]">chrome://extensions/</code>.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold text-teal-400">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold text-slate-200">Enable Developer Mode</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Toggle the switch in the top-right corner to active.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold text-teal-400">
                    4
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold text-slate-200">Drag to Install</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Drag the downloaded file directly onto the Chrome extension window.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full px-6 py-6 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
        <span>© {new Date().getFullYear()} Job Copilot.</span>
        <span>Self-hosted on Vercel</span>
      </footer>

    </div>
  );
}
