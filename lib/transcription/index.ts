import { transcribeWithGroq, WhisperModel } from '../groq/transcription';
import { transcribeWithGladia } from '../gladia/transcription';
import { transcribeWithAssemblyAI, isAssemblyAIRateLimitError } from './assemblyai';
import { transcribeWithDeepgram, isDeepgramRateLimitError } from './deepgram';
import { isRateLimitError } from './helpers';
import { TranscriptionResult } from './types';

/**
 * High-level transcription function executing the provider waterfall:
 * 1. Groq Whisper (Primary)
 * 2. Gladia (First Fallback)
 * 3. AssemblyAI (Second Fallback)
 * 4. Deepgram (Third Fallback)
 * Throws an error if all providers rate limit or fail.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  language?: string,
  model?: string
): Promise<TranscriptionResult> {
  // Step 1 — Try Groq
  try {
    const groqResult = await transcribeWithGroq(
      audioBuffer,
      filename,
      language,
      model as WhisperModel
    );
    return {
      ...groqResult,
      provider: 'groq',
    };
  } catch (err: any) {
    if (!isRateLimitError(err)) {
      console.error('Groq transcription failed with critical error:', err);
      throw err;
    }
    console.warn('Groq rate limit hit, falling back to Gladia...', err);
  }

  // Step 2 — Try Gladia Fallback
  try {
    const gladiaResult = await transcribeWithGladia(audioBuffer, filename);
    return {
      ...gladiaResult,
      language: gladiaResult.language ?? language ?? 'unknown',
      provider: 'gladia',
    };
  } catch (err: any) {
    if (!isRateLimitError(err)) {
      console.error('Gladia transcription failed with critical error:', err);
      throw err;
    }
    console.warn('Gladia rate limit hit, falling back to AssemblyAI...', err);
  }

  // Step 3 — Try AssemblyAI
  try {
    return await transcribeWithAssemblyAI(audioBuffer, filename, language);
  } catch (err: any) {
    if (!isAssemblyAIRateLimitError(err) && !isRateLimitError(err)) {
      console.error('AssemblyAI transcription failed with critical error:', err);
      throw err;
    }
    console.warn('AssemblyAI rate limit hit, falling back to Deepgram...', err);
  }

  // Step 4 — Try Deepgram
  try {
    return await transcribeWithDeepgram(audioBuffer, filename, language);
  } catch (err: any) {
    console.error('Deepgram transcription fallback failed:', err);
    throw new Error('RATE_LIMIT_ALL_PROVIDERS');
  }
}
