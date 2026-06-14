import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Transcript } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import { FaYoutube, FaUpload, FaLink, FaEllipsisV, FaClock, FaFileAlt } from 'react-icons/fa';

interface TranscriptCardProps {
  transcript: Transcript;
  onDelete?: (id: string) => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const sourceIcons = {
  upload: { icon: FaUpload, color: 'text-cyan-400' },
  youtube: { icon: FaYoutube, color: 'text-red-500' },
  url: { icon: FaLink, color: 'text-indigo-400' },
};

export function TranscriptCard({ transcript, onDelete }: TranscriptCardProps) {
  const { icon: SourceIcon, color: iconColor } = sourceIcons[transcript.source_type as keyof typeof sourceIcons] || sourceIcons.upload;

  return (
    <Link
      href={`/transcripts/${transcript.id}`}
      className="group flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 bg-card hover:bg-muted/20 transition-all duration-200"
    >
      {/* Source icon */}
      <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
        <SourceIcon className={cn('text-lg', iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {transcript.title}
          </p>
          <Badge variant={transcript.status as any} className="flex-shrink-0 text-[10px]">
            {transcript.status}
          </Badge>
        </div>

        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {transcript.language_detected && (
            <span className="font-medium uppercase tracking-wide">{transcript.language_detected}</span>
          )}
          {transcript.duration_seconds && (
            <span className="flex items-center gap-1">
              <FaClock size={9} /> {formatDuration(transcript.duration_seconds)}
            </span>
          )}
          {transcript.word_count && (
            <span className="flex items-center gap-1">
              <FaFileAlt size={9} /> {transcript.word_count.toLocaleString()} words
            </span>
          )}
          <span>{formatDate(transcript.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
export default TranscriptCard;
