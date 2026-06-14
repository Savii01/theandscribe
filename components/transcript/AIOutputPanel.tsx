'use client';

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FaMagic, FaSpinner, FaChevronDown, FaChevronUp, FaClipboard } from 'react-icons/fa';
import { AIOutputType } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface AIOutputPanelProps {
  transcriptId: string;
}

const AI_TOOLS: { type: AIOutputType; label: string; icon: string; description: string }[] = [
  { type: 'summary_short',    label: 'Summary',       icon: '📝', description: 'A concise one-paragraph summary of the key points' },
  { type: 'meeting_notes',    label: 'Meeting Notes', icon: '📋', description: 'Structured notes with decisions and action items' },
  { type: 'action_items',     label: 'Action Items',  icon: '✅', description: 'Tasks, owners, and next steps extracted' },
  { type: 'key_insights',     label: 'Key Insights',  icon: '🔍', description: 'Major lessons and breakthrough ideas' },
  { type: 'linkedin_post',    label: 'LinkedIn Post', icon: '📣', description: 'Professional post ready to share' },
  { type: 'blog_post',        label: 'Blog Post',     icon: '✍️', description: 'Full blog article draft' },
];

interface OutputState {
  content: string;
  model: string;
  cached: boolean;
}

export function AIOutputPanel({ transcriptId }: AIOutputPanelProps) {
  const [loading, setLoading] = useState<AIOutputType | null>(null);
  const [outputs, setOutputs] = useState<Partial<Record<AIOutputType, OutputState>>>({});
  const [expanded, setExpanded] = useState<AIOutputType | null>(null);

  const generate = useCallback(async (type: AIOutputType) => {
    if (outputs[type]) {
      setExpanded(exp => exp === type ? null : type);
      return;
    }

    setLoading(type);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript_id: transcriptId, output_type: type }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Generation failed');
      }

      const data = await res.json();
      setOutputs(prev => ({ ...prev, [type]: { content: data.content, model: data.model, cached: data.cached } }));
      setExpanded(type);
      toast.success(data.cached ? 'Loaded from cache' : 'Generated successfully');
    } catch (err: any) {
      toast.error(err.message || 'AI generation failed');
    } finally {
      setLoading(null);
    }
  }, [transcriptId, outputs]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FaMagic className="text-primary" size={13} />
          <h3 className="font-heading font-bold text-sm tracking-tight">AI Tools</h3>
          <span className="ml-auto text-xs text-muted-foreground font-medium">Powered by Groq</span>
        </div>
      </div>
      <div className="p-2 space-y-1">
        {AI_TOOLS.map(({ type, label, icon, description }) => {
          const output = outputs[type];
          const isExpanded = expanded === type;
          const isLoading = loading === type;

          return (
            <div key={type} className="rounded-xl overflow-hidden">
              <button
                onClick={() => generate(type)}
                disabled={!!loading}
                className={cn(
                  'w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left cursor-pointer disabled:opacity-50 group',
                  isExpanded && 'bg-muted'
                )}
              >
                <span className="text-base w-7 text-center flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {isLoading ? (
                    <FaSpinner className="animate-spin text-primary" size={12} />
                  ) : output ? (
                    isExpanded ? <FaChevronUp size={10} className="text-muted-foreground" /> : <FaChevronDown size={10} className="text-muted-foreground" />
                  ) : (
                    <FaMagic size={10} className="text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                  )}
                </div>
              </button>

              {/* Output content */}
              {isExpanded && output && (
                <div className="px-3 pb-3 border-t border-border bg-muted/30">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">{output.model} {output.cached ? '· cached' : ''}</span>
                    <button
                      onClick={() => copyToClipboard(output.content)}
                      className="text-xs flex items-center gap-1 text-primary hover:text-accent-hover transition font-medium cursor-pointer"
                    >
                      <FaClipboard size={9} /> Copy
                    </button>
                  </div>
                  <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap bg-card rounded-lg p-3 border border-border max-h-60 overflow-y-auto">
                    {output.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default AIOutputPanel;
