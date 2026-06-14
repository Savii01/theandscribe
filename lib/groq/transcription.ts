import Groq from 'groq-sdk';
import { TranscriptSegment } from '@/lib/supabase/types';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export type GroqTranscriptionResult = {
  text: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;
};

export type WhisperModel = 'whisper-large-v3' | 'whisper-large-v3-turbo';

/**
 * Transcribe an audio buffer using Groq Whisper API.
 * Returns text, timestamped segments, detected language, and duration.
 */
export async function transcribeWithGroq(
  audioBuffer: Buffer,
  filename: string,
  language?: string,
  model: WhisperModel = 'whisper-large-v3'
): Promise<GroqTranscriptionResult> {
  const file = new File([audioBuffer], filename, { type: getMimeType(filename) });

  const response = await groq.audio.transcriptions.create({
    file,
    model,
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
    ...(language && language !== 'auto' ? { language } : {}),
  });

  const segments: TranscriptSegment[] = (response.segments ?? []).map((seg, idx) => ({
    id: idx,
    start: seg.start,
    end: seg.end,
    text: seg.text.trim(),
  }));

  return {
    text: response.text,
    segments,
    language: response.language ?? 'unknown',
    duration: response.duration ?? 0,
  };
}

/**
 * Determine the MIME type from a filename extension.
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    flac: 'audio/flac',
  };
  return mimeTypes[ext ?? ''] ?? 'audio/mpeg';
}
