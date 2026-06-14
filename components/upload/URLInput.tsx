'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { FaLink, FaYoutube, FaSpinner, FaTimes } from 'react-icons/fa';

interface URLInputProps {
  onURLSubmit: (url: string) => void;
  disabled?: boolean;
}

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
const DIRECT_MEDIA_REGEX = /\.(mp3|wav|m4a|aac|ogg|flac|mp4|mov|webm|mkv)(\?.*)?$/i;

export function URLInput({ onURLSubmit, disabled }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const detectPlatform = (val: string): 'youtube' | 'direct' | null => {
    if (YOUTUBE_REGEX.test(val)) return 'youtube';
    if (DIRECT_MEDIA_REGEX.test(val)) return 'direct';
    return null;
  };

  const platform = detectPlatform(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }
    if (!platform) {
      setError('Enter a valid YouTube URL or direct link to a media file (MP3, MP4, WAV, etc.)');
      return;
    }
    onURLSubmit(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Media URL
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {platform === 'youtube' ? (
              <FaYoutube className="text-red-500 text-lg" />
            ) : (
              <FaLink className="text-sm" />
            )}
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            placeholder="https://youtube.com/watch?v=... or https://example.com/audio.mp3"
            disabled={disabled}
            className={cn(
              'w-full h-12 pl-11 pr-10 rounded-xl border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition duration-150',
              error ? 'border-red-500' : 'border-border'
            )}
          />
          {url && (
            <button
              type="button"
              onClick={() => { setUrl(''); setError(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
      </div>

      {/* Platform badges */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-medium">Supported sources:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'YouTube', icon: '▶', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
            { label: 'MP3', icon: '♪', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
            { label: 'MP4', icon: '▶', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            { label: 'WAV', icon: '♪', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            { label: 'M4A', icon: '♪', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
          ].map(({ label, icon, color }) => (
            <span
              key={label}
              className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border', color)}
            >
              <span>{icon}</span> {label}
            </span>
          ))}
        </div>
      </div>

      {/* URL preview card */}
      {platform && url && (
        <div className="p-3 rounded-xl bg-muted/30 border border-border text-sm flex items-start gap-3">
          {platform === 'youtube' ? (
            <FaYoutube className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
          ) : (
            <FaLink className="text-primary mt-0.5 flex-shrink-0" size={14} />
          )}
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-muted-foreground mb-0.5">
              {platform === 'youtube' ? 'YouTube video detected' : 'Direct media URL detected'}
            </p>
            <p className="text-xs text-foreground truncate">{url}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || !url.trim()}
        className="w-full h-11 bg-primary hover:bg-accent-hover text-black font-semibold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? <FaSpinner className="animate-spin" size={14} /> : null}
        {disabled ? 'Processing...' : 'Fetch & Transcribe'}
      </button>
    </form>
  );
}
export default URLInput;
