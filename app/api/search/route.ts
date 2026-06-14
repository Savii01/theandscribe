import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const language = req.nextUrl.searchParams.get('language');
  const source = req.nextUrl.searchParams.get('source');
  const dateFrom = req.nextUrl.searchParams.get('dateFrom');
  const dateTo = req.nextUrl.searchParams.get('dateTo');

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], query: q });
  }

  // Build query using PostgreSQL full-text search
  let query = supabase
    .from('transcripts')
    .select(`
      id, title, status, source_type, language_detected, duration_seconds,
      word_count, created_at,
      transcript_versions!inner(content)
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .or(`title.ilike.%${q}%,search_vector.fts.${q}`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (language) query = query.eq('language_detected', language);
  if (source) query = query.eq('source_type', source);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo);

  const { data: transcripts, error } = await query;

  if (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  // Extract highlighted excerpts from content
  const results = (transcripts ?? []).map((t: any) => {
    const content: string = t.transcript_versions?.[0]?.content ?? '';
    const lowerContent = content.toLowerCase();
    const lowerQ = q.toLowerCase();
    const idx = lowerContent.indexOf(lowerQ);

    let excerpt = '';
    if (idx !== -1) {
      const start = Math.max(0, idx - 80);
      const end = Math.min(content.length, idx + q.length + 80);
      const raw = content.slice(start, end);
      excerpt = (start > 0 ? '...' : '') + raw + (end < content.length ? '...' : '');
    } else {
      excerpt = content.slice(0, 160) + (content.length > 160 ? '...' : '');
    }

    return {
      id: t.id,
      title: t.title,
      status: t.status,
      sourceType: t.source_type,
      language: t.language_detected,
      durationSeconds: t.duration_seconds,
      wordCount: t.word_count,
      createdAt: t.created_at,
      excerpt,
    };
  });

  return NextResponse.json({ results, query: q, count: results.length });
}
