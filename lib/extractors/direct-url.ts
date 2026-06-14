import { MediaExtractor, ExtractorResult } from './types';

/**
 * Extractor for direct media links (e.g. static MP3, WAV, MP4 URLs).
 * Fetches the URL directly into a Buffer and extracts the file extension.
 */
export class DirectURLExtractor implements MediaExtractor {
  canHandle(url: string): boolean {
    try {
      const parsed = new URL(url);
      
      // Pluggable check: if it matches youtube, let the YoutubeExtractor handle it
      const isYoutube = /(youtube\.com|youtu\.be)/.test(parsed.hostname);
      if (isYoutube) return false;

      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async extract(url: string, jobId: string): Promise<ExtractorResult> {
    console.log(`Fetching direct media URL for job ${jobId}: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch media from URL: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse filename extension
    const urlPath = new URL(url).pathname;
    const ext = urlPath.split('.').pop()?.toLowerCase() || 'mp3';

    // Verify it is a valid format, fallback to mp3 if ambiguous
    const supportedExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mov', 'webm', 'mkv'];
    const finalExt = supportedExtensions.includes(ext) ? ext : 'mp3';

    return {
      buffer,
      ext: finalExt,
    };
  }
}
