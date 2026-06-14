import { TranscriptSegment } from '@/lib/supabase/types';

export interface GladiaTranscriptionResult {
  text: string;
  segments: TranscriptSegment[];
  duration: number;
  language?: string;
}

/**
 * Fallback transcription using Gladia's free tier.
 * Uploads media file to Gladia, triggers transcription, and polls for result.
 */
export async function transcribeWithGladia(
  audioBuffer: Buffer,
  filename: string
): Promise<GladiaTranscriptionResult> {
  const apiKey = process.env.GLADIA_API_KEY;
  if (!apiKey) {
    throw new Error('GLADIA_API_KEY is not defined in environment variables');
  }

  // Step 1: Upload the file
  const uploadFormData = new FormData();
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  uploadFormData.append('audio', blob, filename);

  const uploadResponse = await fetch('https://api.gladia.io/v2/upload', {
    method: 'POST',
    headers: {
      'x-gladia-key': apiKey,
    },
    body: uploadFormData,
  });

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`Gladia file upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errText}`);
  }

  const uploadResult = await uploadResponse.json();
  const audioUrl = uploadResult.audio_url;

  if (!audioUrl) {
    throw new Error('Gladia file upload did not return an audio_url');
  }

  // Step 2: Start transcription
  const transcribeResponse = await fetch('https://api.gladia.io/v2/pre-recorded', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gladia-key': apiKey,
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      diarization: false,
    }),
  });

  if (!transcribeResponse.ok) {
    const errText = await transcribeResponse.text();
    throw new Error(`Gladia transcription trigger failed: ${transcribeResponse.status} ${transcribeResponse.statusText} - ${errText}`);
  }

  const transcribeData = await transcribeResponse.json();
  const jobId = transcribeData.id;

  if (!jobId) {
    throw new Error('Gladia transcription trigger did not return a job ID');
  }

  // Step 3: Poll for completion
  let status = 'queued';
  let attempts = 0;
  const maxAttempts = 120; // 2 minutes max (polling every 1 second)
  let resultData: any = null;

  while (status !== 'done' && status !== 'error' && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;

    const pollResponse = await fetch(`https://api.gladia.io/v2/pre-recorded/${jobId}`, {
      method: 'GET',
      headers: {
        'x-gladia-key': apiKey,
      },
    });

    if (!pollResponse.ok) {
      const errText = await pollResponse.text();
      throw new Error(`Gladia polling failed: ${pollResponse.status} ${pollResponse.statusText} - ${errText}`);
    }

    resultData = await pollResponse.json();
    status = resultData.status;
  }

  if (status !== 'done') {
    throw new Error(`Gladia transcription failed, timed out, or returned status: ${status}`);
  }

  const transcription = resultData.result?.transcription;
  const fullText = transcription?.full_transcript ?? '';
  const utterances = transcription?.utterances ?? [];

  const segments: TranscriptSegment[] = utterances.map((u: any, idx: number) => ({
    id: idx,
    start: u.start,
    end: u.end,
    text: u.text,
  }));

  const duration = resultData.file?.audio_duration ?? 0;
  const language = resultData.result?.language ?? undefined;

  return {
    text: fullText,
    segments,
    duration,
    language,
  };
}
