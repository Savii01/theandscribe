'use client';

import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { FaCloudUploadAlt, FaFile, FaTimes, FaCheckCircle } from 'react-icons/fa';

interface FileDropZoneProps {
  onFileSelected: (file: File) => void;
  onFileRemoved?: () => void;
  selectedFile?: File | null;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a',
  'audio/aac', 'audio/ogg', 'audio/flac',
  'video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska',
];
const ACCEPTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.mp4', '.mov', '.webm', '.mkv'];

export function FileDropZone({ onFileSelected, onFileRemoved, selectedFile, disabled }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
      return 'Unsupported format. Use MP3, WAV, M4A, AAC, FLAC, MP4, MOV, WEBM, or MKV.';
    }
    if (file.size > 500 * 1024 * 1024) {
      return 'File size exceeds 500MB limit.';
    }
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const error = validateFile(file);
    if (error) { alert(error); return; }
    onFileSelected(file);
  }, [disabled, onFileSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateFile(file);
    if (error) { alert(error); return; }
    onFileSelected(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getExt = (name: string) => name.split('.').pop()?.toUpperCase() ?? 'FILE';

  return (
    <div>
      {selectedFile ? (
        <div className="flex items-center gap-4 p-5 rounded-xl border border-primary/40 bg-primary/5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <FaFile size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{selectedFile.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-primary/15 text-primary font-semibold px-2 py-0.5 rounded-full">
                {getExt(selectedFile.name)}
              </span>
              <span className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</span>
              {selectedFile.size > 25 * 1024 * 1024 && (
                <span className="text-xs bg-amber-500/15 text-amber-500 font-semibold px-2 py-0.5 rounded-full">
                  Large file — some engines skipped
                </span>
              )}
            </div>
          </div>
          <FaCheckCircle className="text-green-500 flex-shrink-0" size={20} />
          {!disabled && (
            <button
              onClick={() => { onFileRemoved?.(); if (inputRef.current) inputRef.current.value = ''; }}
              className="text-muted-foreground hover:text-red-500 transition p-1 rounded-lg hover:bg-muted cursor-pointer flex-shrink-0"
              aria-label="Remove file"
            >
              <FaTimes size={14} />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center min-h-[240px] rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
            isDragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-muted/30',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
        >
          <div className={cn(
            'w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 transition-colors',
            isDragOver ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-muted border-border text-muted-foreground'
          )}>
            <FaCloudUploadAlt size={28} />
          </div>
          <p className="font-semibold text-foreground mb-1">
            {isDragOver ? 'Release to upload' : 'Drop your file here'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {['MP3', 'WAV', 'M4A', 'MP4', 'MOV', 'WEBM'].map(ext => (
              <span key={ext} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                {ext}
              </span>
            ))}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">+more</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Max 500MB per file</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
export default FileDropZone;
