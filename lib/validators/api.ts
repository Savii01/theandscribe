import { z } from 'zod';
import { AIOutputType } from '@/lib/supabase/types';

/**
 * Validator schema for POST /api/transcribe (file uploads)
 */
export const transcribeApiSchema = z.object({
  storageKey: z.string().min(1, 'storageKey is required'),
  jobId: z.string().uuid('jobId must be a valid UUID'),
  language: z.string().optional(),
  model: z.string().optional(),
});

/**
 * Validator schema for POST /api/transcribe/url (URL uploads)
 */
export const transcribeUrlApiSchema = z.object({
  url: z.string().url('Invalid URL format'),
  jobId: z.string().uuid('jobId must be a valid UUID'),
  language: z.string().optional(),
  model: z.string().optional(),
});

/**
 * Validator schema for POST /api/ai/generate (AI request)
 */
export const aiGenerateApiSchema = z.object({
  transcript_id: z.string().uuid('transcript_id must be a valid UUID'),
  output_type: z.custom<AIOutputType>((val) => {
    const validTypes: AIOutputType[] = [
      'summary_short', 'summary_detailed', 'summary_executive',
      'key_insights', 'action_items', 'chapters',
      'blog_post', 'seo_article',
      'linkedin_post', 'twitter_thread',
      'instagram_caption', 'facebook_post',
      'study_notes', 'meeting_notes', 'research_notes'
    ];
    return typeof val === 'string' && validTypes.includes(val as AIOutputType);
  }, {
    message: 'Invalid output_type value',
  }),
});
