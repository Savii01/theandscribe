'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FileDropZone } from '@/components/upload/FileDropZone';
import { URLInput } from '@/components/upload/URLInput';
import { ProgressBar } from '@/components/upload/ProgressBar';
import { toast } from 'sonner';
import { FaUpload, FaLink, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaBolt } from 'react-icons/fa';
import { cn } from '@/lib/utils';

type Tab = 'file' | 'url';
type Stage = 'idle' | 'uploading' | 'transcribing' | 'done' | 'error';

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
];

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('auto');
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  const isProcessing = stage === 'uploading' || stage === 'transcribing';

  const runTranscription = async (jobId: string, transcriptId: string, payload: object, endpoint: string) => {
    setStage('transcribing');
    setProgress(50);
    setStatusMsg('Transcribing across multiple engines...');

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, jobId, language: language === 'auto' ? undefined : language }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || 'Transcription failed');
    }

    setProgress(100);
    setStage('done');
    setStatusMsg('Transcription complete!');
    toast.success('Transcription complete!');
    router.push(`/transcripts/${transcriptId}`);
  };

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile) return;

    setStage('uploading');
    setProgress(10);
    setStatusMsg('Getting ready...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create transcript record first
      setStatusMsg('Creating transcript record...');
      setProgress(20);

      const { data: transcript, error: tErr } = await supabase.from('transcripts').insert({
        user_id: user.id,
        title: selectedFile.name.replace(/\.[^.]+$/, ''),
        source_type: 'upload',
        original_filename: selectedFile.name,
        status: 'pending',
      }).select('id').single();

      if (tErr || !transcript) throw new Error('Failed to create transcript record');

      // Create processing job
      const { data: job, error: jErr } = await supabase.from('processing_jobs').insert({
        transcript_id: transcript.id,
        user_id: user.id,
        status: 'queued',
      }).select('id').single();

      if (jErr || !job) throw new Error('Failed to create processing job');

      // Upload to Supabase Storage
      setStatusMsg('Uploading file...');
      setProgress(35);

      const storageKey = `${user.id}/${job.id}.${selectedFile.name.split('.').pop()}`;
      const { error: uploadErr } = await supabase.storage
        .from('media-uploads')
        .upload(storageKey, selectedFile, { upsert: true });

      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

      setProgress(45);
      await runTranscription(job.id, transcript.id, { storageKey }, '/api/transcribe');

    } catch (err: any) {
      setStage('error');
      setStatusMsg(err.message || 'An error occurred');
      toast.error(err.message || 'Upload failed');
    }
  }, [selectedFile, language, supabase]);

  const handleURLTranscribe = useCallback(async (url: string) => {
    setStage('uploading');
    setProgress(10);
    setStatusMsg('Getting ready...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isYoutube = /youtube\.com|youtu\.be/i.test(url);
      const sourceType = isYoutube ? 'youtube' : 'url';
      const title = isYoutube ? 'YouTube Transcript' : new URL(url).pathname.split('/').pop() || 'URL Transcript';

      setStatusMsg('Creating transcript record...');
      setProgress(20);

      const { data: transcript, error: tErr } = await supabase.from('transcripts').insert({
        user_id: user.id,
        title: title.replace(/\.[^.]+$/, ''),
        source_type: sourceType,
        source_url: url,
        status: 'pending',
      }).select('id').single();

      if (tErr || !transcript) throw new Error('Failed to create transcript record');

      const { data: job, error: jErr } = await supabase.from('processing_jobs').insert({
        transcript_id: transcript.id,
        user_id: user.id,
        status: 'queued',
      }).select('id').single();

      if (jErr || !job) throw new Error('Failed to create processing job');

      setProgress(35);
      setStatusMsg('Fetching media from URL...');

      await runTranscription(job.id, transcript.id, { url }, '/api/transcribe/url');

    } catch (err: any) {
      setStage('error');
      setStatusMsg(err.message || 'An error occurred');
      toast.error(err.message || 'URL transcription failed');
    }
  }, [language, supabase]);

  const reset = () => {
    setStage('idle');
    setProgress(0);
    setStatusMsg('');
    setSelectedFile(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-heading font-bold tracking-tight text-foreground mb-1">New Transcript</h2>
        <p className="text-sm text-muted-foreground">Upload a media file or paste a URL to get started. Transcription takes 5–30 seconds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Upload Area (col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-muted rounded-xl border border-border w-fit gap-1">
            {([['file', FaUpload, 'Upload File'], ['url', FaLink, 'Paste URL']] as const).map(([tab, Icon, label]) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); reset(); }}
                disabled={isProcessing}
                className={cn(
                  'flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-semibold transition-all cursor-pointer',
                  activeTab === tab
                    ? 'bg-primary text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="bg-card border border-border rounded-2xl p-6">
            {activeTab === 'file' ? (
              <FileDropZone
                onFileSelected={setSelectedFile}
                onFileRemoved={reset}
                selectedFile={selectedFile}
                disabled={isProcessing}
              />
            ) : (
              <URLInput onURLSubmit={handleURLTranscribe} disabled={isProcessing} />
            )}
          </div>

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="bg-card border border-primary/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <FaSpinner className="animate-spin text-primary" size={16} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Processing your media</p>
                  <p className="text-xs text-muted-foreground">{statusMsg}</p>
                </div>
              </div>
              <ProgressBar value={progress} label="Progress" />
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { label: 'Upload', done: progress >= 45 },
                  { label: 'Transcribe', done: progress >= 90 },
                  { label: 'Complete', done: progress >= 100 },
                ].map(({ label, done }) => (
                  <div key={label} className={cn('flex items-center gap-1.5 font-medium', done ? 'text-green-500' : 'text-muted-foreground')}>
                    {done ? <FaCheckCircle size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-current" />}
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {stage === 'error' && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
              <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-400">{statusMsg}</p>
                <button onClick={reset} className="text-xs text-primary underline mt-1 cursor-pointer">Try again</button>
              </div>
            </div>
          )}

          {/* Submit button for file upload */}
          {activeTab === 'file' && selectedFile && !isProcessing && stage !== 'error' && (
            <button
              onClick={handleFileUpload}
              className="w-full h-12 bg-primary hover:bg-accent-hover text-black font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <FaBolt size={14} />
              Start Transcription
            </button>
          )}
        </div>

        {/* Right: Settings Panel (col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading font-bold text-sm tracking-tight mb-4">Transcription Settings</h3>

            {/* Language */}
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isProcessing}
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
              >
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Engine info */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Strategy</span>
                <span className="text-xs font-bold text-primary">Multi-Engine</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Engines</span>
                <span className="text-xs font-bold text-foreground">Groq · Deepgram · AssemblyAI</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Method</span>
                <span className="text-xs text-muted-foreground">Fastest result wins</span>
              </div>
            </div>
          </div>

          {/* Info card */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FaBolt className="text-primary" size={14} />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Multi-Engine Transcription</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your file is sent to multiple transcription engines simultaneously. The <strong className="text-foreground">fastest result wins</strong> — typically completing in 5–30 seconds. Media files are automatically deleted after processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
