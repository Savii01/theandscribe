'use client';

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FaDownload, FaSpinner, FaCheck } from 'react-icons/fa';

type Format = 'txt' | 'srt' | 'vtt' | 'pdf' | 'docx';

interface ExportMenuProps {
  transcriptId: string;
  title: string;
}

const FORMATS: { value: Format; label: string; desc: string; icon: string }[] = [
  { value: 'txt', label: 'Plain Text', desc: 'Simple readable format', icon: '📄' },
  { value: 'srt', label: 'SRT Subtitles', desc: 'For video players', icon: '🎬' },
  { value: 'vtt', label: 'WebVTT', desc: 'For web video players', icon: '🌐' },
  { value: 'pdf', label: 'PDF Document', desc: 'Shareable document', icon: '📑' },
  { value: 'docx', label: 'Word Document', desc: 'Editable in Word', icon: '📝' },
];

export function ExportMenu({ transcriptId, title }: ExportMenuProps) {
  const [downloading, setDownloading] = useState<Format | null>(null);

  const handleExport = useCallback(async (format: Format) => {
    setDownloading(format);
    try {
      const url = `/api/export/${transcriptId}?format=${format}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Export failed');
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${title.replace(/[^a-z0-9 ]/gi, '_').slice(0, 60)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setDownloading(null);
    }
  }, [transcriptId, title]);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FaDownload className="text-primary" size={13} />
          <h3 className="font-heading font-bold text-sm tracking-tight">Export</h3>
        </div>
      </div>
      <div className="p-2">
        {FORMATS.map(({ value, label, desc, icon }) => (
          <button
            key={value}
            onClick={() => handleExport(value)}
            disabled={!!downloading}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left cursor-pointer disabled:opacity-50 group"
          >
            <span className="text-lg w-7 text-center flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {downloading === value ? (
                <FaSpinner className="animate-spin text-primary" size={12} />
              ) : (
                <FaDownload className="text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" size={10} />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
export default ExportMenu;
