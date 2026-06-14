import { TranscriptionSegment } from './types';

export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('429') ||
           msg.includes('rate limit') ||
           msg.includes('quota') ||
           msg.includes('too many requests') ||
           msg.includes('capacity');
  }
  return false;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export function secondsToMinutes(seconds: number): number {
  return Math.round((seconds / 60) * 100) / 100;
}

export function estimateDurationFromFileSize(
  fileSizeBytes: number,
  format: string
): number {
  // Rough estimates in minutes when metadata unavailable
  const bitsPerSecond: Record<string, number> = {
    mp3: 128000,
    mp4: 256000,
    wav: 1411000,
    m4a: 128000,
    aac: 128000,
    webm: 128000,
    mkv: 256000,
    mov: 256000,
  };
  const bps = bitsPerSecond[format.toLowerCase()] ?? 128000;
  return (fileSizeBytes * 8) / bps / 60;
}

export function formatSegments(segments: TranscriptionSegment[]): string {
  if (!segments || segments.length === 0) return '';
  
  return segments
    .map((seg) => {
      const minutes = Math.floor(seg.start / 60);
      const seconds = Math.floor(seg.start % 60);
      
      const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      return `[${timeStr}] ${seg.text.trim()}`;
    })
    .join('\n');
}

export function formatSegmentsToSRT(
  segments: TranscriptionSegment[]
): string {
  return segments.map((seg, i) => {
    const start = secondsToSRTTime(seg.start);
    const end = secondsToSRTTime(seg.end);
    return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
  }).join('\n');
}

export function formatSegmentsToVTT(
  segments: TranscriptionSegment[]
): string {
  const lines = ['WEBVTT', ''];
  segments.forEach((seg, i) => {
    const start = secondsToVTTTime(seg.start);
    const end = secondsToVTTTime(seg.end);
    lines.push(`${i + 1}`);
    lines.push(`${start} --> ${end}`);
    lines.push(seg.text);
    lines.push('');
  });
  return lines.join('\n');
}

function secondsToSRTTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(sec)},${ms.toString().padStart(3, '0')}`;
}

function secondsToVTTTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(sec)}.${ms.toString().padStart(3, '0')}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
