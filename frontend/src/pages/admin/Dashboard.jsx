import React, { useState } from 'react';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import Notification from '../../components/Notification';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { 
  Globe, 
  Sparkles, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  ArrowRight,
  Save,
  Send,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function AdminDashboard({ onNavigateToHistory }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [notification, setNotification] = useState(null);
  const [isSampleSeed, setIsSampleSeed] = useState(false);

  // Scraped & Analyzed State
  const [scrapedDoc, setScrapedDoc] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [showRawContent, setShowRawContent] = useState(false);

  // Announcement Generation State
  const [announcement, setAnnouncement] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementViewMode, setAnnouncementViewMode] = useState('edit'); // 'edit' or 'preview'
  const [isGeneratingAnn, setIsGeneratingAnn] = useState(false);

  // FAQs State
  const [faqs, setFaqs] = useState([]);
  const [isGeneratingFaqs, setIsGeneratingFaqs] = useState(false);

  // Save/Publish State
  const [isSaving, setIsSaving] = useState(false);

  const sampleUrls = [
    { label: 'RBI Master Direction - IT Governance', url: 'https://www.rbi.org.in/scripts/BS_CircularIndexDisplay.aspx?Id=12345' },
    { label: 'SEBI Circular - ESG Disclosure Framework', url: 'https://www.sebi.gov.in/legal/circulars/jul-2023/brsr-core-framework_73854.html' },
  ];

  const handleFetchUpdate = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setNotification({ type: 'warning', message: 'Please enter a regulatory website URL.' });
      return;
    }

    setNotification(null);
    setLoading(true);
    setScrapedDoc(null);
    setAnalysis(null);
    setAnnouncement(null);
    setFaqs([]);

    try {
      setLoadingStep('Connecting to Firecrawl scraping service...');
      const result = await api.scrapeUrl(url.trim());
      setIsSampleSeed(false);
      setScrapedDoc(result.document);
      setAnalysis(result.analysis);
      setNotification({
        type: 'success',
        message: 'Regulatory content successfully scraped via Firecrawl and analyzed using the LLM!'
      });
    } catch (err) {
      const isMissingKey = err.message && err.message.includes('Firecrawl API Key is missing');
      setNotification({
        type: 'error',
        message: `Failed to fetch regulatory update: ${err.message}`,
        isKeyMissing: isMissingKey
      });
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleLoadSampleSeed = async () => {
    setNotification(null);
    setLoading(true);
    setScrapedDoc(null);
    setAnalysis(null);
    setAnnouncement(null);
    setFaqs([]);
    setIsSampleSeed(true);

    try {
      setLoadingStep('Loading sample seeded circular for offline UI evaluation...');
      const result = await api.loadSampleSeed();
      setScrapedDoc(result.document);
      setAnalysis(result.analysis);
      setNotification({
        type: 'info',
        message: 'Loaded sample regulatory record (RBI Master Direction on IT Governance). You can now generate compliance announcements, draft FAQs, edit, and publish to employees.'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Failed to load sample: ${err.message}`
      });
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleGenerateAnnouncement = async () => {
    if (!scrapedDoc) return;
    setIsGeneratingAnn(true);
    setNotification(null);
    try {
      const res = await api.generateAnnouncement(scrapedDoc.id);
      setAnnouncement(res.announcement);
      setAnnouncementTitle(res.announcement.title);
      setAnnouncementContent(res.announcement.content);
      setNotification({
        type: 'success',
        message: 'Compliance announcement generated. You can now review, edit, and publish it.'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Error generating announcement: ${err.message}`
      });
    } finally {
      setIsGeneratingAnn(false);
    }
  };

  const handleGenerateFaqs = async () => {
    if (!announcement) {
      setNotification({ type: 'warning', message: 'Please generate or save the announcement first before generating FAQs.' });
      return;
    }
    setIsGeneratingFaqs(true);
    setNotification(null);
    try {
      const res = await api.generateFaqs(announcement.id);
      setFaqs(res.faqs);
      setNotification({
        type: 'success',
        message: `Generated ${res.faqs.length} employee compliance FAQs.`
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Error generating FAQs: ${err.message}`
      });
    } finally {
      setIsGeneratingFaqs(false);
    }
  };

  const handleFaqChange = (index, field, value) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const handleAddFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!announcement) return;
    setIsSaving(true);
    try {
      const res = await api.updateAnnouncement(announcement.id, {
        title: announcementTitle,
        content: announcementContent,
        status: 'draft',
        faqs: faqs
      });
      setAnnouncement(res.announcement);
      setNotification({
        type: 'success',
        message: 'Announcement and FAQs saved as Draft. Only administrators can view drafts.'
      });
    } catch (err) {
      setNotification({ type: 'error', message: `Save failed: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveAndPublish = async () => {
    if (!announcement) return;
    setIsSaving(true);
    try {
      // First save content updates
      await api.updateAnnouncement(announcement.id, {
        title: announcementTitle,
        content: announcementContent,
        faqs: faqs
      });
      // Then publish
      const res = await api.publishAnnouncement(announcement.id);
      setAnnouncement(res.announcement);
      setNotification({
        type: 'success',
        message: '🎉 Regulatory Announcement Approved & Published! It is now live on the Employee Portal and accessible by the AI Compliance Chatbot.'
      });
    } catch (err) {
      setNotification({ type: 'error', message: `Publishing failed: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCurrentAnnouncement = async () => {
    if (!announcement) return;
    const isPublished = announcement.status === 'published';
    const confirmed = window.confirm(
      isPublished 
        ? `Are you sure you want to delete this published announcement?\n\nIt will be immediately removed from the Employee Portal and AI Chatbot.`
        : `Are you sure you want to delete this draft announcement?`
    );
    if (!confirmed) return;

    try {
      if (announcement.id) {
        await api.deleteAnnouncement(announcement.id);
      }
      setAnnouncement(null);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setFaqs([]);
      setNotification({
        type: 'info',
        message: `Announcement #${announcement.id || ''} was successfully deleted.`
      });
    } catch (err) {
      setNotification({ type: 'error', message: `Delete failed: ${err.message}` });
    }
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-dark tracking-tight">Add Regulatory Update</h1>
        <p className="text-sm text-text-secondary mt-1">
          Scrape official regulatory circulars via Firecrawl, generate AI compliance announcements and FAQs, and publish to employees.
        </p>
      </div>

      {notification && (
        <div className="space-y-2">
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
          {notification.isKeyMissing && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
              <span>Firecrawl or LLM API keys are missing. Configure <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">FIRECRAWL_API_KEY</code> and <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">GEMINI_API_KEY</code> directly in <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">backend/.env</code>.</span>
            </div>
          )}
        </div>
      )}

      {/* URL Input Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-teal-accent" />
          <h2 className="text-base font-bold text-navy-dark">Enter Regulatory Website URL</h2>
        </div>

        <form onSubmit={handleFetchUpdate} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              required
              placeholder="https://www.rbi.org.in/"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50/50 border border-gray-300 rounded-xl text-sm text-text-primary focus:ring-2 focus:ring-teal-accent focus:border-teal-accent outline-none transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-navy-dark hover:bg-navy-secondary text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scraping...</span>
                </>
              ) : (
                <>
                  <span>Fetch Regulatory Update</span>
                  <ArrowRight className="w-4 h-4 text-teal-accent" />
                </>
              )}
            </button>
          </div>

          {/* Quick Test Samples */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-text-secondary">Example URLs:</span>
            {sampleUrls.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setUrl(s.url)}
                className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-teal-light hover:text-navy-dark text-text-secondary transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Quick Offline UI Testing Option */}
          <div className="mt-4 p-4 rounded-xl bg-teal-light/20 border border-teal-accent/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy-dark">
                <Sparkles className="w-4 h-4 text-teal-accent" />
                <span>Evaluate Full System Workflow Instantly (UI Testing Mode)</span>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Don't have a Firecrawl API key right now? Click to load the pre-seeded official RBI circular to test the 11-point analysis, announcement generator, FAQ editor, publishing, and Memento chatbot memory.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadSampleSeed}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-navy-dark hover:bg-navy-secondary text-white text-xs font-bold shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-teal-accent" />
              <span>Load Seeded Circular</span>
            </button>
          </div>
        </form>

        {loading && (
          <div className="mt-5 p-4 rounded-xl bg-teal-light/20 border border-teal-accent/30 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-teal-accent/30 border-t-teal-accent rounded-full animate-spin flex-shrink-0" />
            <div className="text-xs font-semibold text-navy-dark">
              {loadingStep || 'Processing regulatory webpage through Firecrawl and analyzing content...'}
            </div>
          </div>
        )}
      </div>

      {/* Extracted Document & AI Analysis Section */}
      {scrapedDoc && analysis && (
        <div className="space-y-6">
          {/* Document Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">Scraped Source Document</span>
                  <StatusBadge status={announcement ? announcement.status : 'draft'} />
                  {isSampleSeed && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                      Sample Seed Circular (UI Testing)
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-navy-dark">{scrapedDoc.title}</h3>
                <a
                  href={scrapedDoc.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-text-secondary hover:text-teal-accent flex items-center gap-1 mt-1 break-all"
                >
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{scrapedDoc.source_url}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRawContent(!showRawContent)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 flex items-center gap-1.5"
                >
                  {showRawContent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>{showRawContent ? 'Hide Extracted Markdown' : 'View Extracted Markdown'}</span>
                </button>
              </div>
            </div>

            {/* Expandable Scraped Text */}
            {showRawContent && (
              <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono text-text-primary max-h-64 overflow-y-auto whitespace-pre-wrap">
                {scrapedDoc.extracted_content}
              </div>
            )}

            {/* AI Regulatory Analysis Breakdown */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-teal-accent" />
                <h4 className="text-sm font-bold text-navy-dark">AI Regulatory Analysis Breakdown</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/80">
                  <h5 className="text-xs font-bold text-navy-secondary uppercase tracking-wider mb-2">Main Regulatory Changes</h5>
                  <ul className="space-y-1.5 text-xs text-text-primary">
                    {analysis.main_regulatory_changes?.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-teal-accent font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/80">
                  <h5 className="text-xs font-bold text-navy-secondary uppercase tracking-wider mb-2">Important Compliance Requirements</h5>
                  <ul className="space-y-1.5 text-xs text-text-primary">
                    {analysis.important_compliance_requirements?.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-status-warning font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/80">
                  <h5 className="text-xs font-bold text-navy-secondary uppercase tracking-wider mb-2">Affected Departments</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.affected_departments?.map((dept, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-semibold text-navy-dark">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/80">
                  <h5 className="text-xs font-bold text-navy-secondary uppercase tracking-wider mb-2">Important Dates & Deadlines</h5>
                  <ul className="space-y-1.5 text-xs text-text-primary">
                    {analysis.important_dates_and_deadlines?.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-teal-accent flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 md:col-span-2">
                  <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Penalties & Risks
                  </h5>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {analysis.penalties_and_risks || 'Not specified in source'}
                  </p>
                </div>
              </div>

              {/* Action: Generate Announcement Button */}
              {!announcement && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleGenerateAnnouncement}
                    disabled={isGeneratingAnn}
                    className="px-5 py-2.5 bg-teal-accent hover:bg-teal-hover text-navy-dark font-bold text-sm rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isGeneratingAnn ? (
                      <>
                        <div className="w-4 h-4 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                        <span>Generating Announcement...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-navy-dark" />
                        <span>Generate Compliance Announcement</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Generated Announcement Editor */}
          {announcement && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-accent" />
                  <h3 className="text-base font-bold text-navy-dark">Review & Edit Compliance Announcement</h3>
                </div>
                <StatusBadge status={announcement.status} />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-secondary uppercase tracking-wider mb-1.5">
                  Announcement Title
                </label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-text-primary focus:ring-2 focus:ring-teal-accent outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-navy-secondary uppercase tracking-wider">
                    Announcement Body
                  </label>
                  <div className="flex rounded-lg bg-gray-100 p-0.5 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setAnnouncementViewMode('edit')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        announcementViewMode === 'edit'
                          ? 'bg-white text-navy-dark shadow-xs'
                          : 'text-text-secondary hover:text-navy-dark'
                      }`}
                    >
                      Raw Markdown
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnouncementViewMode('preview')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        announcementViewMode === 'preview'
                          ? 'bg-teal-accent text-navy-dark shadow-xs'
                          : 'text-text-secondary hover:text-navy-dark'
                      }`}
                    >
                      Formatted Preview
                    </button>
                  </div>
                </div>

                {announcementViewMode === 'edit' ? (
                  <textarea
                    rows={14}
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm text-text-primary font-mono focus:ring-2 focus:ring-teal-accent outline-none leading-relaxed"
                  />
                ) : (
                  <div className="w-full min-h-[300px] max-h-[500px] overflow-y-auto px-5 py-4 bg-gray-50/70 border border-gray-300 rounded-xl">
                    <MarkdownRenderer content={announcementContent} />
                  </div>
                )}
              </div>

              {/* FAQs Section */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-teal-accent" />
                    <h4 className="text-sm font-bold text-navy-dark">Employee FAQs ({faqs.length})</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddFaq}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-navy-dark hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add FAQ
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateFaqs}
                      disabled={isGeneratingFaqs}
                      className="px-3 py-1.5 rounded-lg bg-navy-secondary hover:bg-navy-dark text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      {isGeneratingFaqs ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-teal-accent" />
                      )}
                      <span>Generate FAQs</span>
                    </button>
                  </div>
                </div>

                {faqs.length === 0 ? (
                  <p className="text-xs text-text-secondary italic">No FAQs attached yet. Click "Generate FAQs" to create 5-10 automated Q&As.</p>
                ) : (
                  <div className="space-y-3">
                    {faqs.map((f, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-50/70 border border-gray-200 relative group">
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(i)}
                          className="absolute top-3 right-3 text-gray-400 hover:text-status-error p-1 rounded-md"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="space-y-2 pr-6">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-teal-accent block mb-0.5">Question {i + 1}</span>
                            <input
                              type="text"
                              value={f.question}
                              onChange={(e) => handleFaqChange(i, 'question', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-text-primary"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-navy-secondary block mb-0.5">Answer</span>
                            <textarea
                              rows={2}
                              value={f.answer}
                              onChange={(e) => handleFaqChange(i, 'answer', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-text-primary"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approval & Publishing Actions */}
              <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-text-secondary">
                  Current Status: <span className="font-bold text-navy-dark uppercase">{announcement.status}</span>
                  {announcement.status === 'published' && ' (Live on Employee Portal)'}
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDeleteCurrentAnnouncement}
                    disabled={isSaving}
                    className="px-4 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    title="Delete this announcement / draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete {announcement.status === 'published' ? 'Published Update' : 'Draft'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-navy-dark font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4 text-gray-500" />
                    <span>Save as Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveAndPublish}
                    disabled={isSaving}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-teal-accent hover:bg-teal-hover text-navy-dark font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-navy-dark" />
                    <span>Approve & Publish</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
