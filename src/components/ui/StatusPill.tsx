import React from 'react';
import { FileStatus } from '../../types';
import { cn } from '../../lib/utils';

type StatusPillProps = {
  status: FileStatus;
  label?: string;
};

export default function StatusPill({ status, label }: StatusPillProps) {
  const config: Record<FileStatus, { bg: string; text: string; label: string }> = {
    queued: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Warteschlange' },
    validating: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Validierung...' },
    ready: { bg: 'bg-[#e6fcfc]', text: 'text-[#00cfcc]', label: 'Bereit' },
    transcribing: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Transkription...' },
    transcribed: { bg: 'bg-teal-50', text: 'text-teal-600', label: 'Transkribiert' },
    needs_review: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Review nötig' },
    error: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Hoppla/Fehler' },
  };

  const item = config[status] || { bg: 'bg-gray-50', text: 'text-gray-600', label: status };

  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide border border-transparent shadow-sm",
      item.bg,
      item.text
    )}>
      <span className="w-1.5 h-1.5 rounded-full mr-2 bg-current animate-pulse" />
      {label || item.label}
    </span>
  );
}
