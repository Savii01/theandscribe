import fs from 'fs';
import path from 'path';
import os from 'os';
import YTDlpWrap from 'yt-dlp-wrap';
import { getOrDownloadYtdlp } from './download-helper';
import { MediaExtractor, ExtractorResult } from './types';

/**
 * Pluggable media extractor for YouTube URLs.
 * Uses yt-dlp to download the audio stream directly.
 */
export class YouTubeExtractor implements MediaExtractor {
  canHandle(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/./;
    return youtubeRegex.test(url);
  }

  async extract(url: string, jobId: string): Promise<ExtractorResult> {
    const binaryPath = await getOrDownloadYtdlp();
    const ytDlpWrap = new YTDlpWrap(binaryPath);

    const tempDir = os.tmpdir();
    // We use %(ext)s so yt-dlp uses the natural format (m4a, webm, mp3)
    const outputTemplate = path.join(tempDir, `${jobId}.%(ext)s`);

    console.log(`Starting yt-dlp extraction: ${url} -> ${outputTemplate}`);

    return new Promise<ExtractorResult>((resolve, reject) => {
      // Run yt-dlp in audio extraction mode (best audio quality) without force transcoding to mp3
      // because transcode requires ffmpeg which might not be installed on Vercel.
      const args = [
        url,
        '-f',
        'bestaudio/best',
        '-o',
        outputTemplate,
        '--no-playlist',
        '--no-warnings',
      ];

      ytDlpWrap
        .exec(args)
        .on('error', (err) => {
          console.error('yt-dlp process error:', err);
          // Attempt clean up of any file matching the jobId
          try {
            const files = fs.readdirSync(tempDir);
            for (const file of files) {
              if (file.startsWith(jobId)) {
                fs.unlinkSync(path.join(tempDir, file));
              }
            }
          } catch (cleanupErr) {
            console.error('Error during cleanup:', cleanupErr);
          }
          reject(err);
        })
        .on('close', () => {
          try {
            // Find the downloaded file
            const files = fs.readdirSync(tempDir);
            const outputFile = files.find((file) => file.startsWith(jobId));

            if (!outputFile) {
              return reject(
                new Error(`yt-dlp execution closed but output file with prefix ${jobId} was not found in ${tempDir}`)
              );
            }

            const fullPath = path.join(tempDir, outputFile);
            const ext = outputFile.split('.').pop() || 'm4a';
            const buffer = fs.readFileSync(fullPath);

            // Clean up the temporary file
            fs.unlinkSync(fullPath);
            console.log(`Successfully extracted audio and cleaned up temporary file: ${outputFile}`);

            resolve({ buffer, ext });
          } catch (readErr) {
            reject(readErr);
          }
        });
    });
  }
}
