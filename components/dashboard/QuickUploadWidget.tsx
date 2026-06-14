'use client';

import React, { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FaCloudUploadAlt, FaLink } from 'react-icons/fa';

export function QuickUploadWidget() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Navigate to upload page — actual upload happens there
    router.push('/upload');
  }, [router]);

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:bg-muted/20 group bg-card"
    >
      <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
        <FaCloudUploadAlt className="text-muted-foreground group-hover:text-primary transition-colors" size={24} />
      </div>
      <p className="font-semibold text-foreground mb-1">Drop a file here, or</p>
      <p className="text-sm text-muted-foreground mb-5">Drag audio or video files to start transcribing immediately</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/upload')}
          className="flex items-center gap-2 h-9 px-4 bg-primary hover:bg-accent-hover text-black font-semibold text-sm rounded-xl transition cursor-pointer"
        >
          <FaCloudUploadAlt size={12} /> Browse Files
        </button>
        <button
          onClick={() => router.push('/upload?tab=url')}
          className="flex items-center gap-2 h-9 px-4 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-semibold text-sm rounded-xl transition cursor-pointer bg-muted"
        >
          <FaLink size={10} /> Paste URL
        </button>
      </div>
      <input ref={inputRef} type="file" className="hidden" />
    </div>
  );
}
export default QuickUploadWidget;
