import { createClient } from '@deepgram/sdk';
import { TranscriptionResult } from './types';

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

export async function transcribeWithDeepgram(
  audioBuffer: Buffer,
  filename: string,
  language?: string
): Promise<TranscriptionResult> {

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioBuffer,
    {
      model: 'nova-2',
      language: language ?? 'en',
      punctuate: true,
      utterances: true,
      smart_format: true,
    }
  );

  if (error) {
    throw new Error(`Deepgram error: ${error.message}`);
  }

  const channel = result?.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];

  if (!alternative) {
    throw new Error('Deepgram returned no transcription');
  }

  // Convert Deepgram words to segments
  const segments = alternative.words?.reduce((acc, word, i) => {
    const segIndex = Math.floor(i / 10);
    if (!acc[segIndex]) {
      acc[segIndex] = {
        start: word.start,
        end: word.end,
        text: '',
      };
    }
    acc[segIndex].text += word.punctuated_word + ' ';
    acc[segIndex].end = word.end;
    return acc;
  }, [] as { start: number; end: number; text: string }[]) ?? [];

  const duration = result?.metadata?.duration ?? 0;

  return {
    text: alternative.transcript,
    segments: segments.map(s => ({
      ...s,
      text: s.text.trim(),
    })),
    language: language ?? 'en',
    duration,
    provider: 'deepgram',
  };
}

export function isDeepgramRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('429') ||
           error.message.includes('rate limit') ||
           error.message.toLowerCase().includes('quota exceeded');
  }
  return false;
}
