import { TranscriptSegment } from '@/lib/supabase/types';

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Generate SRT subtitle format from transcript segments.
 */
export function generateSrt(segments: TranscriptSegment[], content?: string): string {
  if (!segments || segments.length === 0) {
    // Fallback: single block
    return `1\n00:00:00,000 --> 00:00:30,000\n${content ?? ''}\n`;
  }

  return segments
    .map((seg, index) => {
      const startTime = formatSrtTime(seg.start);
      const endTime = formatSrtTime(seg.end);
      return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text.trim()}\n`;
    })
    .join('\n');
}
