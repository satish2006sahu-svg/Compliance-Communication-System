import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Key, Sparkles, Globe, CheckCircle2, AlertCircle, X, ExternalLink, ShieldCheck } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, onConfigSaved }) {
  const [firecrawlKey, setFirecrawlKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenAIKey] = useState('');
  const [llmProvider, setLlmProvider] = useState('gemini');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrentStatus();
    }
  }, [isOpen]);

  const loadCurrentStatus = async () => {
    setFetching(true);
    setMessage(null);
    try {
      const data = await api.getSystemStatus();
      if (data.firecrawl?.masked_key) {
        setFirecrawlKey('');
      }
      if (data.llm?.active_provider) {
        setLlmProvider(data.llm.active_provider);
      }
    } catch {
      // Ignore
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {};
    if (firecrawlKey.trim()) payload.firecrawl_api_key = firecrawlKey.trim();
    if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();
    if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();
    if (llmProvider) payload.llm_provider = llmProvider;

    try {
      const res = await api.updateSystemConfig(payload);
      setMessage({ type: 'success', text: '✅ API keys successfully saved and applied to the backend!' });
      if (onConfigSaved) onConfigSaved(res.status);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update configuration.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-navy-dark text-teal-accent flex items-center justify-center">
              <Key className="w-5 h-5 text-teal-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-dark">Configure API Integrations</h3>
              <p className="text-xs text-text-secondary">Credentials are applied live without restarting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-status-success border border-emerald-200' : 'bg-red-50 text-status-error border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Firecrawl API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-orange-500" />
                Firecrawl API Key (for Web Scraping)
              </label>
              <a
                href="https://firecrawl.dev"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-teal-accent hover:underline flex items-center gap-1 font-semibold"
              >
                Get Free Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="fc-xxxxxxxxxxxxxxxxxxxxxxxx"
              value={firecrawlKey}
              onChange={(e) => setFirecrawlKey(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-text-primary focus:ring-2 focus:ring-teal-accent outline-none"
            />
            <p className="text-[10px] text-text-secondary mt-1">
              Used to extract clean markdown from official circulars (RBI, SEBI, etc.)
            </p>
          </div>

          {/* Google Gemini API Key */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-accent" />
                Google Gemini API Key (gemini-3.8-flash)
              </label>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-teal-accent hover:underline flex items-center gap-1 font-semibold"
              >
                Free Key in AI Studio <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AQ.xxxxxxxxxxxxxxxxxxxxxxxx or AIzaSyxxxxxxxxxxxxxxxxxxxxxxxx"
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value);
                setLlmProvider('gemini');
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-text-primary focus:ring-2 focus:ring-teal-accent outline-none"
            />
            <p className="text-[10px] text-text-secondary mt-1">
              Configured with Google's recommended <span className="font-semibold text-navy-dark">gemini-3.8-flash</span> for regulatory analysis, announcements, FAQs, and chatbot QA.
            </p>
          </div>

          {/* OpenAI API Key (Alternative) */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-500" />
                OpenAI API Key (Alternative)
              </label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-text-secondary hover:underline flex items-center gap-1"
              >
                OpenAI Keys <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              value={openaiKey}
              onChange={(e) => {
                setOpenAIKey(e.target.value);
                if (!geminiKey) setLlmProvider('openai');
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-text-primary focus:ring-2 focus:ring-teal-accent outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-[11px] text-text-secondary flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
              Encrypted & stored in backend/.env
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl text-text-secondary hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-teal-accent hover:bg-teal-hover text-navy-dark font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save & Apply Credentials'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
