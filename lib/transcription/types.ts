export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
  provider: 'groq' | 'gladia' | 'assemblyai' | 'deepgram';
}

export interface TranscriptionOptions {
  language?: string;
  model?: 'whisper-large-v3' | 'whisper-large-v3-turbo';
  enableSpeakerLabels?: boolean;
}
