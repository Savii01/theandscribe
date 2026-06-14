'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  FaClock,
  FaLanguage,
  FaFileAlt,
  FaEdit,
  FaTrash,
  FaMagic,
  FaFileDownload,
  FaYoutube,
  FaUpload,
  FaLink,
  FaArrowLeft,
  FaClipboard,
  FaSpinner
} from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExportMenu } from '@/components/transcript/ExportMenu';
import { TranscriptViewer } from '@/components/transcript/TranscriptViewer';
import { Transcript, TranscriptSegment, AIOutputType } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface TranscriptDetailsProps {
  transcript: Transcript;
  initialContent: string;
  initialSegments: TranscriptSegment[];
  initialAiOutputs: { output_type: string; content: string; model_used: string }[];
}

type Tab = 'transcript' | 'ai' | 'repurpose';

const AI_INSIGHT_TOOLS = [
  { type: 'summary_short', label: 'Short Summary', icon: '📝', desc: 'A single concise paragraph' },
  { type: 'summary_detailed', label: 'Detailed Summary', icon: '📋', desc: 'Comprehensive structured summary' },
  { type: 'summary_executive', label: 'Executive Summary', icon: '👔', desc: 'High-level business brief' },
  { type: 'key_insights', label: 'Key Insights', icon: '💡', desc: 'Main take-aways and notable quotes' },
  { type: 'action_items', label: 'Action Items', icon: '✅', desc: 'Tasks, next steps and milestones' },
  { type: 'chapters', label: 'Chapters', icon: '🔖', desc: 'Timestamped index of topics' },
];

const REPURPOSE_TOOLS = [
  { type: 'blog_post', label: 'Blog Post', icon: '✍️', desc: 'Readable narrative article' },
  { type: 'seo_article', label: 'SEO Article', icon: '🔍', desc: 'Keyword optimized content' },
  { type: 'linkedin_post', label: 'LinkedIn Post', icon: '💼', desc: 'Professional social update' },
  { type: 'twitter_thread', label: 'Twitter Thread', icon: '🐦', desc: 'Chronological thread format' },
  { type: 'instagram_caption', label: 'Instagram Caption', icon: '📸', desc: 'Engaging, hashtagged caption' },
  { type: 'facebook_post', label: 'Facebook Post', icon: '👥', desc: 'Conversational community update' },
  { type: 'study_notes', label: 'Study Notes', icon: '🎓', desc: 'Academic study guide layout' },
  { type: 'meeting_notes', label: 'Meeting Notes', icon: '🤝', desc: 'Minutes and action items template' },
  { type: 'research_notes', label: 'Research Notes', icon: '🔬', desc: 'Structured analytical summary' },
];

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function TranscriptDetails({
  transcript,
  initialContent,
  initialSegments,
  initialAiOutputs
}: TranscriptDetailsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('transcript');
  const [deleting, setDeleting] = useState(false);

  // Cache of AI outputs in local state
  const [aiOutputs, setAiOutputs] = useState<Record<string, { content: string; model: string }>>(() => {
    const cache: Record<string, { content: string; model: string }> = {};
    initialAiOutputs.forEach((out) => {
      cache[out.output_type] = { content: out.content, model: out.model_used };
    });
    return cache;
  });

  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [selectedAiTool, setSelectedAiTool] = useState<string>(AI_INSIGHT_TOOLS[0].type);
  const [selectedRepurposeTool, setSelectedRepurposeTool] = useState<string>(REPURPOSE_TOOLS[0].type);

  // Generate AI output
  const handleGenerateAI = useCallback(async (type: string) => {
    if (aiOutputs[type]) return; // already in cache

    setGeneratingType(type);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript_id: transcript.id, output_type: type }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Generation failed');
      }

      const data = await res.json();
      setAiOutputs((prev) => ({
        ...prev,
        [type]: { content: data.content, model: data.model },
      }));
      toast.success('Generated successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Generation failed');
    } finally {
      setGeneratingType(null);
    }
  }, [transcript.id, aiOutputs]);

  // Delete transcript
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transcript? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('transcripts')
        .delete()
        .eq('id', transcript.id);

      if (error) throw error;
      toast.success('Transcript deleted');
      router.push('/transcripts');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete transcript');
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const activeAiContent = aiOutputs[selectedAiTool];
  const activeRepurposeContent = aiOutputs[selectedRepurposeTool];

  const sourceIcon = () => {
    if (transcript.source_type === 'youtube') return <FaYoutube className="text-red-500" />;
    if (transcript.source_type === 'url') return <FaLink className="text-blue-400" />;
    return <FaUpload className="text-cyan-400" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top navbar links */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/transcripts')}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <FaArrowLeft size={10} /> Back to Transcripts
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/transcripts/${transcript.id}/edit`)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border-border text-xs cursor-pointer font-semibold"
          >
            <FaEdit size={10} /> Edit Transcript
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl hover:bg-red-500/10 text-red-500 hover:text-red-400 text-xs cursor-pointer font-semibold"
          >
            {deleting ? <FaSpinner className="animate-spin" size={10} /> : <FaTrash size={10} />}
            Delete
          </Button>
        </div>
      </div>

      {/* Main header information */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-sm">
                {sourceIcon()}
              </span>
              <h2 className="text-xl font-heading font-bold tracking-tight text-foreground">
                {transcript.title}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FaClock size={10} /> {formatDuration(transcript.duration_seconds)}
              </span>
              <span className="flex items-center gap-1">
                <FaLanguage size={11} /> {transcript.language_detected?.toUpperCase() || 'AUTO'}
              </span>
              <span className="flex items-center gap-1">
                <FaFileAlt size={10} /> {transcript.word_count?.toLocaleString() || '0'} words
              </span>
              <span>Created: {new Date(transcript.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div>
            <Badge variant={transcript.status as any}>{transcript.status}</Badge>
          </div>
        </div>
      </div>

      {/* Page layout: content tabs left, export right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Interactive tabs */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs header bar */}
          <div className="flex p-1 bg-muted rounded-xl border border-border w-fit gap-1">
            {(
              [
                ['transcript', 'Transcript'],
                ['ai', 'AI Insights'],
                ['repurpose', 'Repurpose'],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 h-9 rounded-lg text-xs font-bold transition cursor-pointer',
                  activeTab === tab
                    ? 'bg-primary text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'transcript' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <TranscriptViewer content={initialContent} segments={initialSegments} />
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {/* Left Selector column */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2.5 mb-2">
                  Insights Tools
                </p>
                {AI_INSIGHT_TOOLS.map((tool) => (
                  <button
                    key={tool.type}
                    onClick={() => {
                      setSelectedAiTool(tool.type);
                      handleGenerateAI(tool.type);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition text-left cursor-pointer group border border-transparent',
                      selectedAiTool === tool.type && 'bg-card border-border shadow-sm'
                    )}
                  >
                    <span className="text-base flex-shrink-0">{tool.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs font-semibold text-foreground group-hover:text-primary transition',
                        selectedAiTool === tool.type && 'text-primary'
                      )}>
                        {tool.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{tool.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Right content column */}
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm min-h-[350px] flex flex-col">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    {AI_INSIGHT_TOOLS.find((t) => t.type === selectedAiTool)?.label}
                  </h3>
                  {activeAiContent && (
                    <button
                      onClick={() => copyToClipboard(activeAiContent.content)}
                      className="text-xs flex items-center gap-1.5 text-primary hover:text-accent-hover transition font-medium cursor-pointer"
                    >
                      <FaClipboard size={10} /> Copy
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  {generatingType === selectedAiTool ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <FaSpinner className="animate-spin text-primary text-xl" />
                      <p className="text-xs text-muted-foreground">Generating summary with LLaMA 3.3...</p>
                    </div>
                  ) : activeAiContent ? (
                    <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap select-text">
                      {activeAiContent.content}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-xs text-muted-foreground mb-4">Click below to generate this analysis.</p>
                      <Button
                        onClick={() => handleGenerateAI(selectedAiTool)}
                        className="bg-primary text-black font-semibold text-xs h-9 px-4 rounded-xl cursor-pointer"
                      >
                        <FaMagic size={10} className="mr-1.5" /> Generate
                      </Button>
                    </div>
                  )}
                </div>

                {activeAiContent && (
                  <div className="border-t border-border pt-3 mt-4 text-[10px] text-muted-foreground flex items-center gap-2">
                    <span>Model: {activeAiContent.model}</span>
                    <span>&bull;</span>
                    <span className="text-green-500 font-medium">Cached locally</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'repurpose' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {/* Left Selector column */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2.5 mb-2">
                  Repurposing Formats
                </p>
                {REPURPOSE_TOOLS.map((tool) => (
                  <button
                    key={tool.type}
                    onClick={() => {
                      setSelectedRepurposeTool(tool.type);
                      handleGenerateAI(tool.type);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition text-left cursor-pointer group border border-transparent',
                      selectedRepurposeTool === tool.type && 'bg-card border-border shadow-sm'
                    )}
                  >
                    <span className="text-base flex-shrink-0">{tool.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs font-semibold text-foreground group-hover:text-primary transition',
                        selectedRepurposeTool === tool.type && 'text-primary'
                      )}>
                        {tool.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{tool.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Right content column */}
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm min-h-[350px] flex flex-col">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    {REPURPOSE_TOOLS.find((t) => t.type === selectedRepurposeTool)?.label}
                  </h3>
                  {activeRepurposeContent && (
                    <button
                      onClick={() => copyToClipboard(activeRepurposeContent.content)}
                      className="text-xs flex items-center gap-1.5 text-primary hover:text-accent-hover transition font-medium cursor-pointer"
                    >
                      <FaClipboard size={10} /> Copy
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  {generatingType === selectedRepurposeTool ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <FaSpinner className="animate-spin text-primary text-xl" />
                      <p className="text-xs text-muted-foreground">Repurposing content with LLaMA 3.3...</p>
                    </div>
                  ) : activeRepurposeContent ? (
                    <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap select-text">
                      {activeRepurposeContent.content}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-xs text-muted-foreground mb-4">Click below to repurpose this transcript.</p>
                      <Button
                        onClick={() => handleGenerateAI(selectedRepurposeTool)}
                        className="bg-primary text-black font-semibold text-xs h-9 px-4 rounded-xl cursor-pointer"
                      >
                        <FaMagic size={10} className="mr-1.5" /> Repurpose Content
                      </Button>
                    </div>
                  )}
                </div>

                {activeRepurposeContent && (
                  <div className="border-t border-border pt-3 mt-4 text-[10px] text-muted-foreground flex items-center gap-2">
                    <span>Model: {activeRepurposeContent.model}</span>
                    <span>&bull;</span>
                    <span className="text-green-500 font-medium">Cached locally</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Export panel */}
        <div className="space-y-4">
          <ExportMenu transcriptId={transcript.id} title={transcript.title} />
        </div>
      </div>
    </div>
  );
}
export default TranscriptDetails;
