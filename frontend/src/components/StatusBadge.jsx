import React from 'react';
import { CheckCircle2, Clock, FileEdit } from 'lucide-react';

export default function StatusBadge({ status }) {
  const norm = (status || 'draft').toLowerCase();
  
  if (norm === 'published') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-status-success border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Published
      </span>
    );
  } else if (norm === 'pending' || norm === 'pending_approval') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3.5 h-3.5" />
        Pending Approval
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-status-warning border border-amber-200">
        <FileEdit className="w-3.5 h-3.5" />
        Draft
      </span>
    );
  }
}
