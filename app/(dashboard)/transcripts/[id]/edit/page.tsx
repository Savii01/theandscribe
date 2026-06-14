import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TranscriptEditor } from '@/components/transcript/TranscriptEditor';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTranscriptPage({ params }: EditPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch transcript (verify ownership)
  const { data: transcript, error: tErr } = await supabase
    .from('transcripts')
    .select('id, title, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (tErr || !transcript) {
    notFound();
  }

  // Fetch latest version content
  const { data: version, error: vErr } = await supabase
    .from('transcript_versions')
    .select('content')
    .eq('transcript_id', id)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const initialContent = (version as any)?.content ?? '';

  return (
    <div className="py-6">
      <TranscriptEditor
        transcriptId={id}
        initialTitle={(transcript as any).title}
        initialContent={initialContent}
      />
    </div>
  );
}
