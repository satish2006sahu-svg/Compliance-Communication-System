import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { CheckCircle2, AlertTriangle, RefreshCw, Key, Brain, Sparkles, Database, Shield } from 'lucide-react';

export default function SystemStatus({ onOpenApiKeyModal }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getSystemStatus();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-dark tracking-tight">System Integrations & Diagnostics</h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time status of Firecrawl scraping, LLM API engine, and Memento persistent memory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenApiKeyModal && (
            <button
              onClick={onOpenApiKeyModal}
              className="px-3.5 py-2 rounded-xl bg-teal-accent hover:bg-teal-hover text-navy-dark font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure API Keys</span>
            </button>
          )}
          <button
            onClick={fetchStatus}
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-text-secondary hover:text-navy-dark hover:bg-gray-50 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Firecrawl Scraper Status */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            {status?.firecrawl?.configured ? (
              <span className="flex items-center gap-1 text-xs font-bold text-status-success bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-status-warning bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" /> Key Required
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-dark">Firecrawl Scraper</h3>
            <p className="text-xs text-text-secondary mt-1">
              Extracts high-fidelity readable markdown and metadata from live regulatory circulars and banking websites.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 text-[11px] text-text-primary space-y-1 font-mono">
            <div>Base: {status?.firecrawl?.base_url || 'https://api.firecrawl.dev'}</div>
            <div>Key Status: {status?.firecrawl?.configured ? 'Configured (Active)' : 'Missing in backend/.env'}</div>
          </div>
          {!status?.firecrawl?.configured && (
            <p className="text-[11px] text-text-secondary">
              Obtain a free key at <a href="https://firecrawl.dev" target="_blank" rel="noreferrer" className="text-teal-accent font-semibold underline">firecrawl.dev</a> and add <code className="bg-gray-100 px-1 py-0.5 rounded">FIRECRAWL_API_KEY</code> to <code className="bg-gray-100 px-1 py-0.5 rounded">backend/.env</code>.
            </p>
          )}
        </div>

        {/* LLM Engine Status */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-light text-navy-dark flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-navy-dark" />
            </div>
            {status?.llm?.configured ? (
              <span className="flex items-center gap-1 text-xs font-bold text-status-success bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-status-warning bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" /> Key Required
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-dark">LLM AI Engine</h3>
            <p className="text-xs text-text-secondary mt-1">
              Powers regulatory analysis, compliance announcements, automated FAQs, and grounded chatbot answers.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 text-[11px] text-text-primary space-y-1 font-mono">
            <div>Active: {status?.llm?.active_provider?.toUpperCase() || 'NONE'}</div>
            <div>Gemini: {status?.llm?.gemini_configured ? `Configured (${status?.llm?.gemini_model || 'gemini-3.8-flash'})` : 'Not Set'}</div>
            <div>OpenAI: {status?.llm?.openai_configured ? 'Configured' : 'Not Set'}</div>
          </div>
          {!status?.llm?.configured && (
            <p className="text-[11px] text-text-secondary">
              Set <code className="bg-gray-100 px-1 py-0.5 rounded">GEMINI_API_KEY</code> (Google AI Studio) or <code className="bg-gray-100 px-1 py-0.5 rounded">OPENAI_API_KEY</code> in <code className="bg-gray-100 px-1 py-0.5 rounded">backend/.env</code>.
            </p>
          )}
        </div>

        {/* Memento Persistent Memory */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-status-success bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active & Isolated
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-dark">Memento Memory Layer</h3>
            <p className="text-xs text-text-secondary mt-1">
              Bitemporal knowledge graph and verbatim store. Isolates memory per employee across login sessions.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 text-[11px] text-text-primary space-y-1 font-mono">
            <div>Engine: memento-memory (Python)</div>
            <div>Embedder: {status?.memento?.embedding_provider || 'deterministic-384'}</div>
            <div className="truncate">Store: {status?.memento?.storage_directory || './data/memento'}</div>
          </div>
          <p className="text-[11px] text-text-secondary">
            Employee memories are physically partitioned by employee ID (e.g. <code className="bg-gray-100 px-1 py-0.5 rounded">memento_employee_1.db</code>) to enforce tenant privacy.
          </p>
        </div>

      </div>

      {/* Setup Guide Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card">
        <h3 className="text-sm font-bold text-navy-dark flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-teal-accent" />
          Environment Configuration Checklist
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          All service credentials are kept securely in <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">backend/.env</code> and are never transmitted to the browser:
        </p>
        <div className="bg-navy-dark text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
          <div># Firecrawl Website Scraping</div>
          <div>FIRECRAWL_API_KEY="fc-your-actual-api-key"</div>
          <br />
          <div># LLM Service (Recommended: Google Gemini or OpenAI)</div>
          <div>LLM_PROVIDER="gemini"</div>
          <div>GEMINI_API_KEY="your-google-gemini-key"</div>
          <br />
          <div># Memento Memory Configuration</div>
          <div>MEMENTO_STORAGE_DIR="./data/memento"</div>
          <div>MEMENTO_EMBEDDING_PROVIDER="deterministic"</div>
        </div>
      </div>
    </div>
  );
}
