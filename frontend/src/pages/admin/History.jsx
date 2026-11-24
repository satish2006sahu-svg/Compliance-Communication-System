import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { FileText, Globe, ExternalLink, Calendar, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export default function History() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err.message || 'Failed to load regulatory documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleViewDetail = async (docId) => {
    setDetailLoading(true);
    try {
      const detail = await api.getDocumentDetail(docId);
      setSelectedDoc(detail);
    } catch (err) {
      alert(`Could not load document details: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-dark tracking-tight">Processed Regulatory Documents</h1>
          <p className="text-sm text-text-secondary mt-1">
            Complete audit trail of scraped regulatory circulars, announcements, and their publication statuses.
          </p>
        </div>
        <button
          onClick={fetchDocuments}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-text-secondary hover:text-navy-dark hover:bg-gray-50 flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-status-error font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200/80 shadow-card flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-teal-accent/30 border-t-teal-accent rounded-full animate-spin" />
          <p className="text-xs text-text-secondary">Loading regulatory archives...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200/80 shadow-card text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-navy-dark">No Regulatory Documents Found</h3>
          <p className="text-xs text-text-secondary mt-1">
            Start by entering a regulatory URL in the "Add Regulatory Update" section.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-text-secondary font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Document Title</th>
                  <th className="py-3.5 px-4">Source URL</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Scraped On</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-text-primary">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs font-semibold text-navy-dark truncate">
                      {doc.title}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-text-secondary">
                      <a
                        href={doc.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-teal-accent flex items-center gap-1"
                      >
                        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{doc.source_url}</span>
                      </a>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-text-secondary">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetail(doc.id)}
                        className="px-3 py-1.5 rounded-lg bg-navy-secondary text-white hover:bg-navy-dark text-xs font-semibold transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-accent">Regulatory Record</span>
                <h3 className="text-lg font-bold text-navy-dark mt-0.5">{selectedDoc.document.title}</h3>
                <a
                  href={selectedDoc.document.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-text-secondary hover:text-teal-accent flex items-center gap-1 mt-1 break-all"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{selectedDoc.document.source_url}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Announcements */}
            {selectedDoc.announcements && selectedDoc.announcements.length > 0 ? (
              <div className="space-y-4">
                {selectedDoc.announcements.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-navy-dark">{ann.title}</h4>
                      <StatusBadge status={ann.status} />
                    </div>
                    <div className="text-xs text-text-primary bg-white p-3.5 rounded-lg border border-gray-200/80 max-h-64 overflow-y-auto leading-relaxed">
                      <MarkdownRenderer content={ann.content} />
                    </div>

                    {ann.faqs && ann.faqs.length > 0 && (
                      <div className="pt-2">
                        <span className="text-xs font-bold text-navy-secondary block mb-1.5">Attached FAQs ({ann.faqs.length})</span>
                        <div className="space-y-2">
                          {ann.faqs.map((f, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-white border border-gray-200 text-xs">
                              <span className="font-bold text-navy-dark block">Q: {f.question}</span>
                              <span className="text-text-secondary block mt-0.5">A: {f.answer}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-secondary italic">No announcement generated yet for this document.</p>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-text-primary font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
