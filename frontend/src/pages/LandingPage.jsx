import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Globe, 
  Brain, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  Lock, 
  Server, 
  Building2, 
  User, 
  ChevronRight, 
  Play, 
  ExternalLink,
  Cpu,
  Layers,
  Database,
  Eye,
  Check
} from 'lucide-react';

export default function LandingPage({ onSelectLogin }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      id: 'ingestion',
      tag: 'Step 1 • Live Ingestion',
      title: 'Automated Scraping of Official Regulatory Circulars',
      subtitle: 'Bypass messy HTML and anti-bot obstacles. Firecrawl converts 80-page government circulars into pristine, LLM-ready markdown in seconds.',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      accentGlow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      stats: [
        { label: 'Scrape Speed', value: '< 4.2s' },
        { label: 'Token Reduction', value: '70%' },
        { label: 'Table Fidelity', value: '100%' }
      ],
      previewType: 'scraper',
      urlPreview: 'https://www.rbi.org.in/scripts/BS_CircularIndexDisplay.aspx?Id=12345',
      highlights: [
        'Automatic DOM hydration for dynamic banking portals',
        'Built-in SSRF defense blocking loopback and private IPs',
        'Direct extraction of complex interest and penalty tables'
      ]
    },
    {
      id: 'llm',
      tag: 'Step 2 • AI Intelligence',
      title: 'Gemini 2.5 Flash Structured Legal Distillation',
      subtitle: 'Ingest massive master directions in a single 1M-token prompt. Extract deadlines, statutory penalties, and affected departments without chunk fragmentation.',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      accentGlow: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      stats: [
        { label: 'Context Window', value: '1M+ Tokens' },
        { label: 'Extraction', value: 'JSON Schema' },
        { label: 'Hallucination', value: 'Zero-Tolerance' }
      ],
      previewType: 'analysis',
      urlPreview: 'AI Legal Extractor • Google Gemini 2.5 Flash',
      highlights: [
        'Translates complex statutory legalese into plain English',
        'Categorizes action items by department (IT, Operations, Risk)',
        'Automatically drafts anticipated departmental FAQs'
      ]
    },
    {
      id: 'review',
      tag: 'Step 3 • Human-in-the-Loop',
      title: 'Executive Review & Dual-Mode Markdown Studio',
      subtitle: 'Chief Compliance Officers review and refine AI drafts in real time. Toggle between raw text editing and live executive preview before publishing.',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      accentGlow: 'from-amber-500/20 via-orange-500/10 to-transparent',
      stats: [
        { label: 'Draft Isolation', value: 'Strict RBAC' },
        { label: 'Renderer', value: 'Zero Dependency' },
        { label: 'Approval Speed', value: '1 Click' }
      ],
      previewType: 'editor',
      urlPreview: 'Compliance Officer Review Console • ReguComply AI',
      highlights: [
        'Employees can never access unapproved preliminary drafts',
        'Zero-dependency MarkdownRenderer eliminates XSS attack vectors',
        'Audited publication timestamps and approver tracking'
      ]
    },
    {
      id: 'memento',
      tag: 'Step 4 • Grounded Memory',
      title: 'Memento Bitemporal Memory with Tenant Isolation',
      subtitle: 'An intelligent compliance chatbot that remembers context across sessions while keeping each employee’s chat memory physically isolated on disk.',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      accentGlow: 'from-purple-500/20 via-pink-500/10 to-transparent',
      stats: [
        { label: 'Memory Partition', value: 'Per-User DB' },
        { label: 'Graph Model', value: 'Bitemporal' },
        { label: 'Cross-Talk Leak', value: '0.00%' }
      ],
      previewType: 'chatbot',
      urlPreview: 'Employee AI Assistant • memento_employee_1.db',
      highlights: [
        'Alice in Operations cannot recall Bob in Audit\'s confidential chats',
        'Fine-grained thread locks prevent SQLite database locking',
        'Answers strictly grounded in approved corporate circulars'
      ]
    }
  ];

  // Auto-slide effect every 6 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Background Ambient Glow Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-teal-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ReguComply <span className="text-teal-400">AI</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Enterprise v1.0</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#showcase" className="hover:text-teal-300 transition-colors">Showcase</a>
            <a href="#features" className="hover:text-teal-300 transition-colors">Capabilities</a>
            <a href="#architecture" className="hover:text-teal-300 transition-colors">Architecture</a>
            <a href="#security" className="hover:text-teal-300 transition-colors">Security</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectLogin('employee')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Employee Portal</span>
            </button>
            <button
              onClick={() => onSelectLogin('admin')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Admin Sign In</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner">
            <Sparkles className="w-4 h-4 text-teal-400 animate-spin-slow" />
            <span className="text-xs font-semibold text-slate-300">
              Transforming Banking & Corporate Regulatory Compliance
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">New</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.12]">
            Turn 80-Page Regulatory Circulars into{' '}
            <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              Actionable Directives
            </span>{' '}
            in Seconds.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Automated scraping with <strong>Firecrawl</strong>, deep statutory distillation with <strong>Google Gemini</strong>, human-in-the-loop executive governance, and an employee compliance assistant backed by <strong>Memento bitemporal memory</strong>.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onSelectLogin('admin')}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/25 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Live Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#showcase"
              className="px-6 py-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-teal-400 fill-teal-400" />
              <span>Explore Interactive Showcase</span>
            </a>
          </div>

          {/* Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-slate-900 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-left">
              <div className="text-2xl font-black text-white tracking-tight">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Physical Tenant Isolation</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-left">
              <div className="text-2xl font-black text-teal-400 tracking-tight">&lt; 15s</div>
              <div className="text-xs text-slate-400 mt-0.5">Scrape &amp; AI Analysis</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-left">
              <div className="text-2xl font-black text-emerald-400 tracking-tight">Zero</div>
              <div className="text-xs text-slate-400 mt-0.5">Hallucination Risk (RBAC)</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-left">
              <div className="text-2xl font-black text-indigo-400 tracking-tight">WAL Mode</div>
              <div className="text-xs text-slate-400 mt-0.5">High-Concurrency SQLite</div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Showcase with Realistic Image Transitions */}
      <section 
        id="showcase" 
        className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <h2 className="text-xs uppercase tracking-widest font-extrabold text-teal-400">
            Interactive Product Walkthrough
          </h2>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            See the 4-Stage Regulatory Pipeline in Action
          </h3>
          <p className="text-sm text-slate-400">
            Click through the workflow steps below or let the carousel cycle to see realistic interface transitions.
          </p>
        </div>

        {/* Tab Steppers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {slides.map((slide, idx) => {
            const isActive = idx === activeSlide;
            return (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(idx)}
                className={`p-4 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? 'bg-slate-900 border-teal-500 shadow-xl shadow-teal-500/10'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                {/* Active Progress Bar */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-400 animate-pulse" />
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${slide.badgeColor}`}>
                    {slide.tag}
                  </span>
                  {isActive && <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />}
                </div>
                <div className={`text-xs font-bold line-clamp-1 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {slide.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Realistic Interactive Showcase Card with Transition */}
        <div className="relative rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-6 lg:p-8 shadow-2xl overflow-hidden transition-all duration-700">
          
          {/* Dynamic Background Glow for Active Slide */}
          <div className={`absolute -right-20 -bottom-20 w-96 h-96 bg-gradient-to-tl ${slides[activeSlide].accentGlow} rounded-full blur-3xl transition-all duration-700 pointer-events-none`} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Descriptive Content */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border mb-3 ${slides[activeSlide].badgeColor}`}>
                  {slides[activeSlide].tag}
                </span>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {slides[activeSlide].title}
                </h3>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  {slides[activeSlide].subtitle}
                </p>
              </div>

              {/* Highlights List */}
              <div className="space-y-2.5">
                {slides[activeSlide].highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Stat Chips */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {slides[activeSlide].stats.map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-sm font-bold text-white">{s.value}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onSelectLogin('admin')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-2"
                >
                  <span>Test this feature live in demo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Column: Realistic Realistic Screen Mockup with Transitions */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-slate-800/90 bg-slate-950 shadow-2xl overflow-hidden transition-all duration-500 transform hover:scale-[1.01]">
                
                {/* Browser/Window Header */}
                <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-slate-950 text-[11px] font-mono text-slate-400 border border-slate-800 flex items-center gap-2 truncate max-w-sm">
                    <Lock className="w-3 h-3 text-teal-400 flex-shrink-0" />
                    <span className="truncate">{slides[activeSlide].urlPreview}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                  </div>
                </div>

                {/* Mockup Canvas */}
                <div className="p-6 bg-gradient-to-b from-slate-950 to-slate-900/90 min-h-[380px] flex flex-col justify-between">

                  {/* SLIDE 1 PREVIEW: INGESTION / FIRECRAWL */}
                  {activeSlide === 0 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                        <Globe className="w-5 h-5 text-teal-400" />
                        <div className="flex-1 text-xs font-mono text-slate-300 truncate">
                          https://www.rbi.org.in/scripts/BS_CircularIndexDisplay.aspx?Id=12345
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-bold text-[10px]">
                          Scraped via Firecrawl
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                          <span>DOCUMENT: RBI/2026-27/04 Master Direction - IT Governance</span>
                          <span className="text-emerald-400 font-bold">45,777 chars extracted</span>
                        </div>
                        <div className="text-slate-400 text-[11px] leading-relaxed">
                          # 1. Applicability &amp; Effective Cutoff<br />
                          The provisions of this Direction shall apply to all Scheduled Commercial Banks (SCBs), NBFCs-Upper Layer, and Payment Service Operators.<br />
                          <br />
                          # 2. Critical Incident Escalation (Clause 14.2)<br />
                          - Cyber incidents exceeding Tier-2 severity must be notified to CSITE within 6 hours.<br />
                          - Failure to report invokes penalties under Section 47A of the Banking Regulation Act.
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> SSRF Verification: Passed (Public Host)
                        </span>
                        <span className="font-mono text-[11px]">Format: Markdown / Tables Intact</span>
                      </div>
                    </div>
                  )}

                  {/* SLIDE 2 PREVIEW: LLM EXTRACTION */}
                  {activeSlide === 1 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/50">
                        <div className="flex items-center gap-2.5">
                          <Cpu className="w-5 h-5 text-blue-400" />
                          <span className="text-xs font-bold text-white">Google Gemini 2.5 Flash Structured Synthesis</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                          1,048,576 Token Context
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Target Departments</span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold text-[10px]">Information Security</span>
                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">Operations</span>
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">Audit</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Statutory Deadline</span>
                          <div className="text-sm font-bold text-amber-400 pt-0.5">December 15, 2026</div>
                          <div className="text-[10px] text-slate-400">Strict regulatory cutoff</div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Automated Employee Q&amp;A Generated</span>
                        <div className="text-xs text-slate-300 font-medium">Q: Does the 6-hour reporting window apply on national holidays?</div>
                        <div className="text-xs text-slate-400 pl-3 border-l border-teal-500/40">
                          A: Yes. CSITE reporting operates on a 24x7x365 mandatory timeline without weekend exemptions.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SLIDE 3 PREVIEW: HUMAN REVIEW */}
                  {activeSlide === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                        <span className="font-bold text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          Chief Compliance Officer Editorial Console
                        </span>
                        <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-800 text-slate-400">Raw Text</span>
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded bg-teal-500 text-slate-950">Formatted Preview</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm">Regulatory Announcement #2026-04</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Status: Awaiting Approval
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-teal-500/10 border-l-2 border-teal-400 text-slate-300 text-xs leading-relaxed">
                          <strong>Directive:</strong> Immediate mandatory upgrade of multi-factor authentication across customer-facing banking portals.
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-400 text-xs">
                          <li>Phase 1 rollout complete by October 30.</li>
                          <li>Quarterly board certification signed by Head of IT.</li>
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-slate-500">Employees see nothing until published</span>
                        <button className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md">
                          ✓ Approve &amp; Publish to Employees
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SLIDE 4 PREVIEW: MEMENTO CHATBOT */}
                  {activeSlide === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-400" />
                          <span className="font-bold text-white">Memento Context Memory • Alice (Operations)</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          memento_employee_1.db
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex gap-2.5 justify-end">
                          <div className="p-3 rounded-2xl bg-teal-600/30 text-teal-100 max-w-xs border border-teal-500/30">
                            Can we request an extension for the IT incident filing deadline?
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            AI
                          </div>
                          <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 space-y-2 max-w-md">
                            <div className="text-[10px] font-mono text-purple-400 flex items-center gap-1.5">
                              <Brain className="w-3 h-3" />
                              Recalled previous turn: "Discussed Section 14.2 on Monday"
                            </div>
                            <p className="text-xs leading-relaxed">
                              No. As stated in <strong>Clause 14.2</strong> of the IT Governance Master Direction, the 6-hour incident window cannot be extended under any operational circumstance.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Physical SQLite isolation enforced</span>
                        <span className="text-emerald-400">0% risk of data leak to other staff</span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs uppercase tracking-widest font-extrabold text-teal-400">
            Enterprise Architecture
          </h2>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            Built for Zero-Ops, Maximum Security, and High Concurrency
          </h3>
          <p className="text-sm text-slate-400">
            Engineered from ground up with production standards: Write-Ahead Logging, strict RBAC, and zero client-side credential exposure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-teal-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
              <Globe className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Firecrawl Cloud Ingestion</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scrapes dynamic banking sites and PDF circulars, strips ads and headers, and preserves clean tables. Reduces LLM token usage by up to 70%.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Google Gemini 2.5 Flash</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Massive 1,000,000+ token context window swallows entire 80-page master circulars in one prompt. Zero chunk fragmentation or lost cross-references.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <Brain className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Memento Bitemporal Memory</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintains an episodic knowledge graph with distinct physical SQLite databases per employee. Prevents cross-department context pollution.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Database className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">SQLite WAL Concurrency</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Write-Ahead Logging ensures that writers never block readers and readers never block writers. Zero database lock crashes under simultaneous queries.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">SSRF Defense &amp; Strict RBAC</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              DNS validation blocks loopback (127.0.0.1) and AWS metadata IPs. Employees are strictly prohibited from viewing preliminary AI draft circulars.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Single-Port Unified Serving</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              FastAPI serves the compiled React Single Page Application and the REST API together on port 8000. Zero CORS friction in production.
            </p>
          </div>

        </div>
      </section>

      {/* Live Demo Quick Launch Banner */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-950/60 via-slate-900 to-emerald-950/60 p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Experience It Right Now</span>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              Ready to test compliance automation?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Log in with our pre-seeded enterprise demo accounts to experience the Administrator approval workflow or test the Employee Compliance Assistant.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3.5 w-full md:w-auto">
            <button
              onClick={() => onSelectLogin('admin')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Building2 className="w-4 h-4" />
              <span>Launch Admin Portal</span>
            </button>
            <button
              onClick={() => onSelectLogin('employee')}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Launch Employee Portal</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-slate-300">ReguComply AI System</span>
            <span>•</span>
            <span>Automated Regulatory Intelligence</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> System Status: Operational
            </span>
            <span>FastAPI + React 18 + Memento Engine</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
