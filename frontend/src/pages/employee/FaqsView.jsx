import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { HelpCircle, Search, ChevronDown, ChevronUp, MessageSquare, Sparkles } from 'lucide-react';

export default function FaqsView({ onAskInChatbot }) {
  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    async function loadFaqs() {
      setLoading(true);
      try {
        const res = await api.getEmployeeDashboard();
        setFaqs(res.faqs || []);
      } catch {
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      (f.announcement_title && f.announcement_title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy-dark tracking-tight">Compliance FAQs & Employee Guidance</h1>
        <p className="text-sm text-text-secondary mt-1">
          Frequently asked compliance questions compiled strictly from published regulatory circulars and policies.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search compliance requirements, keywords, or regulations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-accent focus:border-teal-accent outline-none shadow-sm"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-xs text-text-secondary">
          Loading FAQs...
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
          <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-navy-dark">No FAQs Match Your Query</h3>
          <p className="text-xs text-text-secondary mt-1">
            Try searching for another compliance term or ask our AI chatbot directly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isExp = expanded[faq.id];
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition-all hover:border-teal-accent/40"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full p-4 text-left flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div>
                    {faq.announcement_title && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-accent block mb-1">
                        {faq.announcement_title}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-navy-dark">{faq.question}</h3>
                  </div>
                  <div className="text-gray-400 p-1 flex-shrink-0">
                    {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExp && (
                  <div className="px-4 pb-4 pt-1 text-xs text-text-primary border-t border-gray-100 bg-gray-50/50 leading-relaxed">
                    <p className="mt-2">{faq.answer}</p>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => onAskInChatbot(faq.question)}
                        className="inline-flex items-center gap-1.5 text-xs text-teal-accent hover:text-navy-dark font-semibold transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Ask follow-up in AI Chatbot
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
