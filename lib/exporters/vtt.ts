import { TranscriptSegment } from '@/lib/supabase/types';

function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/**
 * Generate WebVTT subtitle format from transcript segments.
 */
export function generateVtt(segments: TranscriptSegment[], content?: string): string {
  const lines: string[] = ['WEBVTT', ''];

  if (!segments || segments.length === 0) {
    lines.push(`00:00:00.000 --> 00:00:30.000\n${content ?? ''}`);
    return lines.join('\n');
  }

  segments.forEach((seg, index) => {
    const startTime = formatVttTime(seg.start);
    const endTime = formatVttTime(seg.end);
    lines.push(`${index + 1}`);
    lines.push(`${startTime} --> ${endTime}`);
    lines.push(seg.text.trim());
    lines.push('');
  });

  return lines.join('\n');
}
