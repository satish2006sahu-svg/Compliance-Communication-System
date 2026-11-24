import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function Notification({ type = 'info', message, onClose }) {
  if (!message) return null;

  const styles = {
    success: 'bg-emerald-50 border-emerald-300 text-status-success',
    error: 'bg-red-50 border-red-300 text-status-error',
    warning: 'bg-amber-50 border-amber-300 text-amber-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 flex-shrink-0 text-status-success" />,
    error: <AlertCircle className="w-5 h-5 flex-shrink-0 text-status-error" />,
    warning: <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />,
    info: <Info className="w-5 h-5 flex-shrink-0 text-blue-600" />,
  };

  return (
    <div className={`p-4 rounded-xl border shadow-sm flex items-start justify-between gap-3 ${styles[type] || styles.info} transition-all`}>
      <div className="flex items-start gap-3">
        {icons[type] || icons.info}
        <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
