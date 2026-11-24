import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Globe, 
  FileText, 
  MessageSquare, 
  Settings, 
  BookOpen, 
  HelpCircle,
  Brain,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { isAdmin } = useAuth();

  const adminNav = [
    { id: 'dashboard', label: 'Add Regulatory Update', icon: Globe, desc: 'URL Input & Firecrawl' },
    { id: 'history', label: 'Processed Updates', icon: FileText, desc: 'Review & Publish' },
    { id: 'system', label: 'System & Integrations', icon: Settings, desc: 'API Keys & Diagnostics' },
  ];

  const employeeNav = [
    { id: 'dashboard', label: 'Compliance Dashboard', icon: BookOpen, desc: 'Approved Circulars' },
    { id: 'faqs', label: 'Compliance FAQs', icon: HelpCircle, desc: 'Common Questions' },
    { id: 'chatbot', label: 'AI Compliance Chatbot', icon: MessageSquare, desc: 'Memento Memory AI', badge: 'Memento' },
  ];

  const navItems = isAdmin ? adminNav : employeeNav;

  return (
    <aside className="w-64 bg-navy-dark text-white flex-shrink-0 flex flex-col justify-between min-h-[calc(100vh-65px)] p-4 shadow-xl select-none">
      <div>
        <div className="px-3 py-2 mb-4">
          <span className="text-[11px] font-bold tracking-wider text-teal-accent uppercase">
            {isAdmin ? 'Administration' : 'Employee Services'}
          </span>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-navy-secondary text-white border-l-4 border-teal-accent shadow-md'
                    : 'text-slate-300 hover:bg-navy-secondary/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-teal-accent' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-teal-accent/20 text-teal-accent font-bold px-2 py-0.5 rounded-full border border-teal-accent/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Persistent Memory Status Card in Sidebar */}
      <div className="mt-8 p-3.5 bg-navy-secondary/70 rounded-xl border border-white/10">
        <div className="flex items-center gap-2 mb-1.5">
          <Brain className="w-4 h-4 text-teal-accent" />
          <span className="text-xs font-bold text-white">Memento Memory</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Bitemporal knowledge graph active. Employee conversations persist across sessions.
        </p>
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-teal-accent font-semibold">
          <CheckCircle2 className="w-3 h-3 text-teal-accent" />
          <span>Strict Tenant Isolation</span>
        </div>
      </div>
    </aside>
  );
}
