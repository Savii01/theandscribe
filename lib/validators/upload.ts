import { z } from 'zod';

export const SUPPORTED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'];
export const SUPPORTED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'mkv'];
export const SUPPORTED_EXTENSIONS = [...SUPPORTED_AUDIO_EXTENSIONS, ...SUPPORTED_VIDEO_EXTENSIONS];

export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

/**
 * Validation schema for media file upload parameters (metadata checked on client).
 */
export const fileUploadValidationSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().max(MAX_FILE_SIZE_BYTES, 'File size exceeds 500MB limit'),
  type: z.string().refine(
    (mime) => {
      // Allow standard mime types or resolve by extension
      const audioMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/flac'];
      const videoMimes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
      return [...audioMimes, ...videoMimes].includes(mime.toLowerCase());
    },
    {
      message: 'Unsupported file format. Please upload MP3, WAV, M4A, AAC, FLAC, MP4, MOV, WEBM, or MKV.',
    }
  ),
});

/**
 * Validation schema for paste-URL inputs.
 * Validates format to ensure it is either a YouTube link or a direct media resource.
 */
export const urlValidationSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .url('Please enter a valid HTTP/HTTPS URL')
    .refine(
      (urlVal) => {
        const isYoutube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/./i.test(urlVal);
        const isDirectMedia = /\.(mp3|wav|m4a|aac|ogg|flac|mp4|mov|webm|mkv)(\?.*)?$/i.test(urlVal);
        return isYoutube || isDirectMedia;
      },
      {
        message: 'Enter a valid YouTube URL or direct link to a supported media file.',
      }
    ),
});
