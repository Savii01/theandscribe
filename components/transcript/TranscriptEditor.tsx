'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { FaSave, FaHistory, FaArrowLeft, FaSpinner, FaUndo, FaCheck } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

interface Version {
  id: string;
  version_number: number;
  content: string;
  created_at: string;
}

interface TranscriptEditorProps {
  transcriptId: string;
  initialTitle: string;
  initialContent: string;
}

export function TranscriptEditor({ transcriptId, initialTitle, initialContent }: TranscriptEditorProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [loadingVersions, setLoadingVersions] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Fetch all versions of this transcript
  const fetchVersions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const { data, error } = await supabase
        .from('transcript_versions')
        .select('id, version_number, content, created_at')
        .eq('transcript_id', transcriptId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (err: any) {
      console.error('Failed to fetch versions:', err);
      toast.error('Failed to load version history');
    } finally {
      setLoadingVersions(false);
    }
  }, [supabase, transcriptId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // Debounced auto-save function
  const handleSave = useCallback(
    async (currentContent: string, currentTitle: string) => {
      setSaving(true);
      setSaveStatus('saving');

      try {
        // 1. Update title in transcripts table if changed
        if (currentTitle !== initialTitle) {
          const { error: titleErr } = await supabase
            .from('transcripts')
            .update({ title: currentTitle, updated_at: new Date().toISOString() })
            .eq('id', transcriptId);
          if (titleErr) throw titleErr;
        }

        // 2. Fetch current versions to compute new version number
        const { data: currentVersions, error: verErr } = await supabase
          .from('transcript_versions')
          .select('version_number')
          .eq('transcript_id', transcriptId)
          .order('version_number', { ascending: false });

        if (verErr) throw verErr;

        const latestVersionNum = currentVersions?.[0]?.version_number ?? 0;
        const newVersionNum = latestVersionNum + 1;

        // 3. Save new version
        const { error: insErr } = await supabase
          .from('transcript_versions')
          .insert({
            transcript_id: transcriptId,
            version_number: newVersionNum,
            content: currentContent,
          });

        if (insErr) throw insErr;

        // 4. Update word count in transcripts table
        const wordCount = currentContent.trim().split(/\s+/).filter(Boolean).length;
        await supabase
          .from('transcripts')
          .update({ word_count: wordCount, updated_at: new Date().toISOString() })
          .eq('id', transcriptId);

        // 5. Enforce keeping only 5 latest versions
        const { data: updatedVersions } = await supabase
          .from('transcript_versions')
          .select('id, version_number')
          .eq('transcript_id', transcriptId)
          .order('version_number', { ascending: false });

        if (updatedVersions && updatedVersions.length > 5) {
          const toDelete = updatedVersions.slice(5).map((v) => v.id);
          await supabase
            .from('transcript_versions')
            .delete()
            .in('id', toDelete);
        }

        setSaveStatus('saved');
        fetchVersions();
      } catch (err: any) {
        console.error('Failed to save changes:', err);
        setSaveStatus('dirty');
        toast.error('Failed to save changes automatically');
      } finally {
        setSaving(false);
      }
    },
    [supabase, transcriptId, initialTitle, fetchVersions]
  );

  // Trigger auto-save when content or title changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('dirty');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      handleSave(content, title);
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, title, handleSave]);

  // Restore a specific version
  const handleRestoreVersion = async (versionNum: number) => {
    const versionToRestore = versions.find((v) => v.version_number === versionNum);
    if (!versionToRestore) return;

    if (!confirm(`Are you sure you want to restore Version ${versionNum}? Unsaved changes will be lost.`)) {
      return;
    }

    setContent(versionToRestore.content);
    setSelectedVersion(null);
    toast.success(`Restored to Version ${versionNum}`);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/transcripts/${transcriptId}`)}
            className="h-9 w-9 p-0 rounded-xl"
          >
            <FaArrowLeft className="text-muted-foreground hover:text-foreground" size={14} />
          </Button>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-heading font-bold tracking-tight text-foreground bg-transparent border-none focus:outline-none focus:ring-0 w-full truncate placeholder:text-muted-foreground"
              placeholder="Transcript Title"
            />
            <p className="text-xs text-muted-foreground mt-0.5">
              {wordCount.toLocaleString()} words &middot; Autosaving changes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold text-muted-foreground mr-2">
            {saveStatus === 'saving' && (
              <>
                <FaSpinner className="animate-spin text-primary" size={11} />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <FaCheck className="text-green-500" size={10} />
                <span>All saved</span>
              </>
            )}
            {saveStatus === 'dirty' && (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <span>Unsaved changes</span>
              </>
            )}
          </div>

          {/* Versions Dropdown */}
          <div className="relative">
            <select
              value={selectedVersion ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleRestoreVersion(Number(val));
              }}
              disabled={loadingVersions || versions.length <= 1}
              className="h-9 px-3 pr-8 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="">Version History ({versions.length})</option>
              {versions.map((v, index) => (
                <option key={v.id} value={v.version_number}>
                  V{v.version_number} &middot; {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {index === 0 ? '(Current)' : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <FaHistory size={11} />
            </div>
          </div>
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col min-h-[500px]">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full bg-transparent resize-none border-none focus:outline-none text-foreground placeholder:text-muted-foreground leading-relaxed text-sm min-h-[450px]"
          placeholder="Start typing your transcript here..."
        />
      </div>
    </div>
  );
}
export default TranscriptEditor;
