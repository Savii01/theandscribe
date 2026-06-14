import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TranscriptDetails } from '@/components/transcript/TranscriptDetails';
import { TranscriptSegment } from '@/lib/supabase/types';

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TranscriptDetailPage({ params }: DetailPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch transcript (verify ownership)
  const { data: transcript, error: tErr } = await supabase
    .from('transcripts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (tErr || !transcript) {
    notFound();
  }

  // Fetch latest version content & segments
  const { data: version } = await supabase
    .from('transcript_versions')
    .select('content, segments')
    .eq('transcript_id', id)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const initialContent = (version as any)?.content ?? '';
  const initialSegments = ((version as any)?.segments as TranscriptSegment[]) ?? [];

  // Fetch all cached AI outputs
  const { data: aiOutputsRaw } = await supabase
    .from('ai_outputs')
    .select('output_type, content, model_used')
    .eq('transcript_id', id);
  const aiOutputs = (aiOutputsRaw as any[]) ?? [];

  return (
    <div className="py-6">
      <TranscriptDetails
        transcript={transcript as any}
        initialContent={initialContent}
        initialSegments={initialSegments}
        initialAiOutputs={aiOutputs}
      />
    </div>
  );
}
