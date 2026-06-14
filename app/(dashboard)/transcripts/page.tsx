import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TranscriptCard } from '@/components/transcript/TranscriptCard';
import { FaFileAlt, FaBolt, FaSearch } from 'react-icons/fa';

export default async function TranscriptsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const hasTranscripts = transcripts && transcripts.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight text-foreground mb-0.5">Transcripts</h2>
          <p className="text-sm text-muted-foreground">
            {hasTranscripts ? `${transcripts.length} transcript${transcripts.length !== 1 ? 's' : ''}` : 'No transcripts yet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="flex items-center gap-2 h-9 px-3 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition font-medium bg-muted"
          >
            <FaSearch size={11} /> Search
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-2 h-9 px-3.5 bg-primary hover:bg-accent-hover text-black font-semibold text-sm rounded-xl transition"
          >
            <FaBolt size={12} /> New
          </Link>
        </div>
      </div>

      {!hasTranscripts ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl bg-card">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
            <FaFileAlt className="text-muted-foreground" size={28} />
          </div>
          <p className="font-heading font-bold text-lg text-foreground mb-2">No transcripts yet</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Upload your first audio or video file, or paste a YouTube URL to get started.
          </p>
          <Link
            href="/upload"
            className="flex items-center gap-2 h-10 px-6 bg-primary hover:bg-accent-hover text-black font-semibold text-sm rounded-xl transition"
          >
            <FaBolt size={12} /> New Transcript
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {(transcripts as any[]).map((t) => (
            <TranscriptCard key={t.id} transcript={t} />
          ))}
        </div>
      )}
    </div>
  );
}
