import type { MediaExtractor, ExtractorResult } from './types';
import { YouTubeExtractor } from './youtube';
import { DirectURLExtractor } from './direct-url';

const extractors: MediaExtractor[] = [
  new YouTubeExtractor(),
  new DirectURLExtractor(),
];

/**
 * Routes the URL to the first matching extractor in the registry.
 * Downloads the media, extracts the audio track if necessary, and returns a buffer.
 */
export async function extractAudio(url: string, jobId: string): Promise<ExtractorResult> {
  const extractor = extractors.find((e) => e.canHandle(url));
  
  if (!extractor) {
    throw new Error('Unsupported URL format or media platform. Currently supported: YouTube and direct media URLs.');
  }

  return extractor.extract(url, jobId);
}
export type { ExtractorResult };
