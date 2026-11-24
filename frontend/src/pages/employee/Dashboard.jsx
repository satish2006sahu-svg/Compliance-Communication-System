import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { 
  BookOpen, 
  Calendar, 
  Globe, 
  ExternalLink, 
  MessageSquare, 
  Sparkles, 
  CheckCircle, 
  HelpCircle, 
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function EmployeeDashboard({ onOpenChatbot }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        const res = await api.getEmployeeDashboard();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load employee compliance dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const latest = data?.latest_announcement;
  const updates = data?.all_announcements || [];
  const faqs = data?.faqs || [];

  return (
    <div className="space-y-8 fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-dark via-navy-secondary to-navy-dark text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-accent/20 text-teal-accent text-xs font-bold uppercase tracking-wider mb-3 border border-teal-accent/30">
            <ShieldCheck className="w-4 h-4 text-teal-accent" />
            Official Compliance Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Employee'}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Stay aligned with all approved regulatory directives, compliance updates, and policies issued by our Regulatory Affairs office.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenChatbot}
              className="px-5 py-2.5 rounded-xl bg-teal-accent hover:bg-teal-hover text-navy-dark font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-navy-dark" />
              <span>Ask AI Compliance Chatbot</span>
            </button>
            <span className="text-xs text-slate-400">
              🧠 Remembers your past questions with Memento
            </span>
          </div>
        </div>

        {/* Subtle decorative shield glow */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <ShieldCheck className="w-72 h-72 text-teal-accent" />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200/80 shadow-card flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-teal-accent/30 border-t-teal-accent rounded-full animate-spin" />
          <p className="text-xs text-text-secondary">Loading latest compliance directives...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-status-error font-medium">
          {error}
        </div>
      ) : (
        <>
          {/* Latest Compliance Announcement Card */}
          {latest ? (
            <div className="bg-white rounded-2xl p-6 border border-teal-accent/30 shadow-card relative overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-accent bg-teal-light/40 px-2.5 py-0.5 rounded-full border border-teal-accent/30">
                  Latest Approved Regulatory Directive
                </span>
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {latest.published_at ? new Date(latest.published_at).toLocaleDateString() : 'Recently Published'}
                </span>
              </div>

              <h2 className="text-xl font-bold text-navy-dark mb-2">{latest.title}</h2>

              <div className="text-xs text-text-primary max-h-56 overflow-y-auto leading-relaxed bg-gray-50/70 p-4 rounded-xl border border-gray-200/70 mb-4">
                <MarkdownRenderer content={latest.content} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                {latest.document && (
                  <a
                    href={latest.document.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-text-secondary hover:text-teal-accent flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5 text-teal-accent" />
                    <span>View Official Regulatory Circular</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  onClick={() => setSelectedAnnouncement(latest)}
                  className="px-4 py-2 rounded-xl bg-navy-dark hover:bg-navy-secondary text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Read Full Announcement</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-accent" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-card text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-navy-dark">No Published Directives Yet</h3>
              <p className="text-xs text-text-secondary mt-1">
                Your compliance officer has not published any announcements yet.
              </p>
            </div>
          )}

          {/* Grid: All Published Updates + Key FAQs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* All Published Circulars */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-accent" />
                  <h3 className="text-base font-bold text-navy-dark">All Approved Regulatory Updates ({updates.length})</h3>
                </div>
              </div>

              <div className="space-y-3">
                {updates.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl bg-gray-50/70 border border-gray-200 hover:border-teal-accent/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-navy-dark">{ann.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {ann.published_at ? new Date(ann.published_at).toLocaleDateString() : 'Approved'}
                        </span>
                        {ann.document && (
                          <a
                            href={ann.document.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-teal-accent flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3" /> Source Link
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAnnouncement(ann)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-teal-light/20 text-navy-dark text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
                    >
                      Read Notice
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Compliance FAQs Spotlight */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-teal-accent" />
                  <h3 className="text-base font-bold text-navy-dark">Common FAQs</h3>
                </div>
              </div>

              <div className="space-y-3">
                {faqs.slice(0, 4).map((f) => (
                  <div key={f.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                    <span className="font-bold text-navy-dark block">Q: {f.question}</span>
                    <p className="text-text-secondary leading-relaxed">{f.answer}</p>
                  </div>
                ))}
                {faqs.length === 0 && (
                  <p className="text-xs text-text-secondary italic">No FAQs available.</p>
                )}
              </div>

              <button
                onClick={onOpenChatbot}
                className="w-full mt-2 py-2.5 px-3 rounded-xl bg-teal-light/30 border border-teal-accent/40 text-navy-dark font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-teal-light/50 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-navy-dark" />
                <span>Ask Question to AI Assistant</span>
              </button>
            </div>

          </div>
        </>
      )}

      {/* Full Directive Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-accent">Official Internal Compliance Circular</span>
                <h3 className="text-lg font-bold text-navy-dark mt-0.5">{selectedAnnouncement.title}</h3>
                <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                  <span>Published: {new Date(selectedAnnouncement.published_at || selectedAnnouncement.created_at).toLocaleDateString()}</span>
                  {selectedAnnouncement.document && (
                    <a
                      href={selectedAnnouncement.document.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-accent font-semibold hover:underline flex items-center gap-1"
                    >
                      Official Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-text-primary leading-relaxed bg-gray-50/70 p-4 rounded-xl border border-gray-200 max-h-96 overflow-y-auto">
              <MarkdownRenderer content={selectedAnnouncement.content} />
            </div>

            {selectedAnnouncement.faqs && selectedAnnouncement.faqs.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-navy-dark mb-2">Related Employee FAQs</h4>
                <div className="space-y-2">
                  {selectedAnnouncement.faqs.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                      <span className="font-bold text-navy-dark block">Q: {f.question}</span>
                      <span className="text-text-secondary block mt-1">A: {f.answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-navy-dark text-white font-semibold text-xs"
              >
                Close Directive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
