import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuotaWidget } from '@/components/dashboard/QuotaWidget';
import { QuickUploadWidget } from '@/components/dashboard/QuickUploadWidget';
import { TranscriptCard } from '@/components/transcript/TranscriptCard';
import { FaFileAlt, FaClock, FaBolt, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch stats
  const [
    { count: totalCount },
    { count: todayCount },
    { data: recentTranscripts },
    { data: durationData },
  ] = await Promise.all([
    supabase.from('transcripts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
    supabase.from('transcripts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
    supabase.from('transcripts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
    supabase.from('transcripts').select('duration_seconds').eq('user_id', user.id).eq('status', 'completed'),
  ]);

  const totalMinutes = Math.round(
    ((durationData as any[]) ?? []).reduce((sum, t) => sum + (t.duration_seconds ?? 0), 0) / 60
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="animate-fade-up delay-0">
        <h2 className="text-2xl font-heading font-bold tracking-tight text-foreground mb-0.5">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Your transcription workspace</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-up delay-75"><StatsCard
          label="Total Transcripts"
          value={totalCount ?? 0}
          icon={<FaFileAlt />}
          description="All completed"
          accent
        /></div>
        <div className="animate-fade-up delay-150"><StatsCard
          label="Today"
          value={todayCount ?? 0}
          icon={<FaCalendarAlt />}
          description="Transcripts today"
          progress={((todayCount ?? 0) / 10) * 100}
        /></div>
        <div className="animate-fade-up delay-200"><StatsCard
          label="Total Minutes"
          value={totalMinutes}
          icon={<FaClock />}
          description="Audio processed"
        /></div>
        <div className="animate-fade-up delay-250"><StatsCard
          label="Daily Quota"
          value={`${Math.round(((todayCount ?? 0) / 10) * 100)}%`}
          icon={<FaBolt />}
          description="Daily limit used"
          progress={((todayCount ?? 0) / 10) * 100}
        /></div>
      </div>

      {/* Quota Widget */}
      <div className="animate-fade-up delay-300">
        <QuotaWidget />
      </div>

      {/* Quick Upload */}
      <div className="animate-fade-up delay-400">
        <h3 className="text-sm font-heading font-bold tracking-tight text-foreground uppercase tracking-wider mb-3">
          Quick Upload
        </h3>
        <QuickUploadWidget />
      </div>

      {/* Recent Transcripts */}
      <div className="animate-fade-up delay-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-heading font-bold tracking-tight text-foreground uppercase tracking-wider">
            Recent Transcripts
          </h3>
          {(totalCount ?? 0) > 8 && (
            <Link
              href="/transcripts"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-accent-hover transition"
            >
              View all <FaArrowRight size={10} />
            </Link>
          )}
        </div>

        {!recentTranscripts || recentTranscripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-card">
            <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
              <FaFileAlt className="text-muted-foreground" size={24} />
            </div>
            <p className="font-semibold text-foreground mb-1">No transcripts yet</p>
            <p className="text-sm text-muted-foreground mb-5">Upload your first audio or video file to get started</p>
            <Link
              href="/upload"
              className="flex items-center gap-2 h-9 px-5 bg-primary hover:bg-accent-hover text-black font-semibold text-sm rounded-xl transition"
            >
              <FaBolt size={12} /> New Transcript
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {((recentTranscripts as any[]) ?? []).map((t) => (
              <TranscriptCard key={t.id} transcript={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
