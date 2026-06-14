'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FaSearch, FaTimes, FaRegCopy, FaCheck } from 'react-icons/fa';
import { toast } from 'sonner';
import { TranscriptSegment } from '@/lib/supabase/types';

interface TranscriptViewerProps {
  content: string;
  segments?: TranscriptSegment[] | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TranscriptViewer({ content, segments }: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied segment text');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const hasSegments = segments && segments.length > 0;

  // Search filter and highlight logic
  const highlightedSegments = useMemo(() => {
    if (!hasSegments) return [];
    if (!searchQuery.trim()) return segments;

    const lowerQuery = searchQuery.toLowerCase();
    return segments.map((seg) => {
      const matchIndex = seg.text.toLowerCase().indexOf(lowerQuery);
      return {
        ...seg,
        isMatched: matchIndex !== -1,
      };
    });
  }, [segments, searchQuery, hasSegments]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <FaSearch size={12} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search within transcript..."
          className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-muted/20 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <FaTimes size={10} />
          </button>
        )}
      </div>

      {/* Segments list or plain text */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm max-h-[600px] overflow-y-auto space-y-4 custom-scrollbar">
        {hasSegments ? (
          highlightedSegments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No matching segments found</p>
          ) : (
            <div className="space-y-4">
              {highlightedSegments.map((seg, index) => {
                const isMatched = (seg as any).isMatched;
                return (
                  <div
                    key={index}
                    className={cn(
                      'group flex items-start gap-4 p-2 rounded-xl transition duration-150',
                      isMatched ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/10'
                    )}
                  >
                    {/* Timestamp */}
                    <span className="text-xs font-semibold text-primary font-mono select-none mt-0.5 flex-shrink-0">
                      [{formatTime(seg.start)}]
                    </span>

                    {/* Text content */}
                    <p className="flex-1 text-xs text-foreground leading-relaxed whitespace-pre-wrap select-text">
                      {highlightText(seg.text, searchQuery)}
                    </p>

                    {/* Actions */}
                    <button
                      onClick={() => handleCopyText(seg.text, index)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-foreground p-1 rounded transition flex-shrink-0 cursor-pointer"
                      title="Copy segment text"
                    >
                      {copiedIndex === index ? <FaCheck className="text-green-500" size={10} /> : <FaRegCopy size={10} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Fallback plain text representation */
          <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap select-text">
            {searchQuery ? highlightText(content, searchQuery) : content}
          </div>
        )}
      </div>
    </div>
  );
}
export default TranscriptViewer;
