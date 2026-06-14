import { TranscriptSegment } from '@/lib/supabase/types';
import { formatSegments } from '@/lib/transcription/helpers';

interface ExportOptions {
  includeTimestamps?: boolean;
  title?: string;
  segments?: TranscriptSegment[];
  content: string;
}

/**
 * Generate a plain text export of a transcript.
 */
export function generateTxt({ content, title, segments, includeTimestamps = true }: ExportOptions): string {
  const lines: string[] = [];

  if (title) {
    lines.push(title.toUpperCase());
    lines.push('='.repeat(Math.min(title.length, 60)));
    lines.push('');
  }

  if (includeTimestamps && segments && segments.length > 0) {
    lines.push(formatSegments(segments));
  } else {
    lines.push(content);
  }

  return lines.join('\n');
}
