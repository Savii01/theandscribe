import { transcribeWithGroq, WhisperModel } from '../groq/transcription';
import { transcribeWithGladia } from '../gladia/transcription';
import { transcribeWithAssemblyAI } from './assemblyai';
import { transcribeWithDeepgram } from './deepgram';
import { TranscriptionResult } from './types';
import { getAvailableProviders, ProviderName } from './quota';

// Provider file size limits (in bytes)
const PROVIDER_SIZE_LIMITS: Record<ProviderName, number> = {
  groq: 25 * 1024 * 1024,        // 25 MB
  gladia: 20 * 1024 * 1024,      // 20 MB (conservative)
  assemblyai: 500 * 1024 * 1024, // ~500 MB (very generous)
  deepgram: 500 * 1024 * 1024,   // ~500 MB (very generous)
};

/**
 * High-level transcription function executing multiple transcription APIs simultaneously
 * using Promise.any. Only runs APIs that have remaining monthly quota AND support the file size.
 */
export async function transcribeAudio(
  userId: string,
  audioBuffer: Buffer,
  filename: string,
  language?: string,
  model?: string
): Promise<TranscriptionResult> {
  const fileSizeBytes = audioBuffer.length;
  const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(1);

  const availableProviders = await getAvailableProviders(userId);

  // Filter out providers that can't handle this file size
  const sizeFilteredProviders = availableProviders.filter((provider) => {
    const limit = PROVIDER_SIZE_LIMITS[provider];
    if (fileSizeBytes > limit) {
      console.log(`Skipping ${provider}: file ${fileSizeMB}MB exceeds limit ${(limit / (1024 * 1024)).toFixed(0)}MB`);
      return false;
    }
    return true;
  });

  console.log(`File: ${fileSizeMB}MB | Available providers (quota+size): [${sizeFilteredProviders.join(', ')}]`);

  const promises: Promise<TranscriptionResult>[] = [];

  if (sizeFilteredProviders.includes('groq')) {
    promises.push(
      transcribeWithGroq(audioBuffer, filename, language, model as WhisperModel).then((res) => ({
        ...res,
        provider: 'groq' as ProviderName,
      }))
    );
  }

  if (sizeFilteredProviders.includes('gladia')) {
    promises.push(
      transcribeWithGladia(audioBuffer, filename).then((res) => ({
        ...res,
        language: res.language ?? language ?? 'unknown',
        provider: 'gladia' as ProviderName,
      }))
    );
  }

  if (sizeFilteredProviders.includes('assemblyai')) {
    promises.push(
      transcribeWithAssemblyAI(audioBuffer, filename, language)
    );
  }

  if (sizeFilteredProviders.includes('deepgram')) {
    promises.push(
      transcribeWithDeepgram(audioBuffer, filename, language)
    );
  }

  if (promises.length === 0) {
    const allExceedSize = availableProviders.length > 0 && sizeFilteredProviders.length === 0;
    if (allExceedSize) {
      throw new Error(`FILE_TOO_LARGE: ${fileSizeMB}MB exceeds all provider limits. Try a smaller file or compress before uploading.`);
    }
    throw new Error('NO_AVAILABLE_PROVIDERS_WITH_QUOTA');
  }

  try {
    // Run simultaneously and return the first successful result
    const fastestResult = await Promise.any(promises);
    console.log(`Transcription completed via ${fastestResult.provider} (${fileSizeMB}MB file)`);
    return fastestResult;
  } catch (err: any) {
    console.error('All simultaneous transcription providers failed:', err);
    // Surface the actual errors for debugging
    if (err instanceof AggregateError) {
      err.errors.forEach((e: any, i: number) => {
        console.error(`  Provider ${i} error:`, e.message);
      });
    }
    throw new Error('ALL_PROVIDERS_FAILED: ' + (err.errors?.map((e: any) => e.message).join(' | ') ?? err.message));
  }
}
