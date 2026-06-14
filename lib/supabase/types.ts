export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin';
          theme_preference: 'dark' | 'light';
          onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          theme_preference?: 'dark' | 'light';
          onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          theme_preference?: 'dark' | 'light';
          onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transcripts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          source_type: 'upload' | 'youtube' | 'url';
          source_url: string | null;
          original_filename: string | null;
          duration_seconds: number | null;
          language_detected: string | null;
          whisper_model: string | null;
          transcription_provider: 'groq' | 'gladia';
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          word_count: number | null;
          search_vector: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          source_type: 'upload' | 'youtube' | 'url';
          source_url?: string | null;
          original_filename?: string | null;
          duration_seconds?: number | null;
          language_detected?: string | null;
          whisper_model?: string | null;
          transcription_provider?: 'groq' | 'gladia';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          word_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          source_type?: 'upload' | 'youtube' | 'url';
          source_url?: string | null;
          original_filename?: string | null;
          duration_seconds?: number | null;
          language_detected?: string | null;
          whisper_model?: string | null;
          transcription_provider?: 'groq' | 'gladia';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          word_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transcript_versions: {
        Row: {
          id: string;
          transcript_id: string;
          version_number: number;
          content: string;
          segments: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          transcript_id: string;
          version_number: number;
          content: string;
          segments?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          transcript_id?: string;
          version_number?: number;
          content?: string;
          segments?: Json | null;
          created_at?: string;
        };
      };
      ai_outputs: {
        Row: {
          id: string;
          transcript_id: string;
          output_type: AIOutputType;
          content: string;
          model_used: string;
          provider: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          transcript_id: string;
          output_type: AIOutputType;
          content: string;
          model_used?: string;
          provider?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          transcript_id?: string;
          output_type?: AIOutputType;
          content?: string;
          model_used?: string;
          provider?: string;
          created_at?: string;
        };
      };
      processing_jobs: {
        Row: {
          id: string;
          transcript_id: string;
          user_id: string;
          status: 'queued' | 'running' | 'completed' | 'failed';
          provider_used: string | null;
          attempts: number;
          error: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          transcript_id: string;
          user_id: string;
          status?: 'queued' | 'running' | 'completed' | 'failed';
          provider_used?: string | null;
          attempts?: number;
          error?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          transcript_id?: string;
          user_id?: string;
          status?: 'queued' | 'running' | 'completed' | 'failed';
          provider_used?: string | null;
          attempts?: number;
          error?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
    };
  };
}

export type AIOutputType =
  | 'summary_short'
  | 'summary_detailed'
  | 'summary_executive'
  | 'key_insights'
  | 'action_items'
  | 'chapters'
  | 'blog_post'
  | 'seo_article'
  | 'linkedin_post'
  | 'twitter_thread'
  | 'instagram_caption'
  | 'facebook_post'
  | 'study_notes'
  | 'meeting_notes'
  | 'research_notes';

export type TranscriptSegment = {
  id?: number;
  start: number;
  end: number;
  text: string;
};

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Transcript = Database['public']['Tables']['transcripts']['Row'];
export type TranscriptVersion = Database['public']['Tables']['transcript_versions']['Row'];
export type AIOutput = Database['public']['Tables']['ai_outputs']['Row'];
export type ProcessingJob = Database['public']['Tables']['processing_jobs']['Row'];
