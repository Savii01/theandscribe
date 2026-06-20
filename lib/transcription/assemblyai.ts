import { AssemblyAI } from 'assemblyai';
import { TranscriptionResult } from './types';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY || process.env.ASSEMBLYAI_API_KEY || '',
});

export async function transcribeWithAssemblyAI(
  audioBuffer: Buffer,
  filename: string,
  language?: string
): Promise<TranscriptionResult> {
  // AssemblyAI requires a URL — upload buffer first
  const uploadResponse = await client.files.upload(audioBuffer);
  const audioUrl = uploadResponse;

  const transcript = await client.transcripts.transcribe({
    audio_url: audioUrl,
    language_code: language ?? 'en',
    speech_models: ['universal-3-pro', 'universal-2'],
    speaker_labels: false,
  });

  if (transcript.status === 'error') {
    throw new Error(`AssemblyAI error: ${transcript.error}`);
  }

  // Convert AssemblyAI words to segments format
  const segments = transcript.words?.reduce((acc, word, i) => {
    const segIndex = Math.floor(i / 10);
    if (!acc[segIndex]) {
      acc[segIndex] = {
        start: word.start / 1000,
        end: word.end / 1000,
        text: '',
      };
    }
    acc[segIndex].text += word.text + ' ';
    acc[segIndex].end = word.end / 1000;
    return acc;
  }, [] as { start: number; end: number; text: string }[]) ?? [];

  return {
    text: transcript.text ?? '',
    segments: segments.map(s => ({
      ...s,
      text: s.text.trim(),
    })),
    language: transcript.language_code ?? language ?? 'en',
    duration: transcript.audio_duration ?? 0,
    provider: 'assemblyai',
  };
}

export function isAssemblyAIRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('429') ||
           error.message.includes('rate limit') ||
           error.message.includes('quota');
  }
  return false;
}
