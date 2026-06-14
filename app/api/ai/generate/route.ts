import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateWithGroq } from '@/lib/groq/ai-generate';
import { aiGenerateApiSchema } from '@/lib/validators/api';
import { AIOutputType } from '@/lib/supabase/types';

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = aiGenerateApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 422 });
  }

  const { transcript_id, output_type } = parsed.data;

  // Verify transcript belongs to user
  const { data: transcript, error: tError } = await supabase
    .from('transcripts')
    .select('id, status')
    .eq('id', transcript_id)
    .eq('user_id', user.id)
    .single();

  if (tError || !transcript) return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
  if (transcript.status !== 'completed') return NextResponse.json({ error: 'Transcript not yet completed' }, { status: 400 });

  // Check cache first — never regenerate if already exists
  const { data: cached } = await supabase
    .from('ai_outputs')
    .select('content, model_used, created_at')
    .eq('transcript_id', transcript_id)
    .eq('output_type', output_type as AIOutputType)
    .single();

  if (cached) {
    return NextResponse.json({ content: cached.content, model: cached.model_used, cached: true });
  }

  // Fetch latest transcript text
  const { data: version, error: vError } = await supabase
    .from('transcript_versions')
    .select('content')
    .eq('transcript_id', transcript_id)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (vError || !version) return NextResponse.json({ error: 'Transcript text not found' }, { status: 404 });

  // Generate via Groq LLaMA
  try {
    const result = await generateWithGroq(version.content, output_type as AIOutputType);

    // Save to cache
    await supabase.from('ai_outputs').insert({
      transcript_id,
      output_type: output_type as AIOutputType,
      content: result.content,
      model_used: result.model,
      provider: 'groq',
    });

    return NextResponse.json({ content: result.content, model: result.model, cached: false, tokensUsed: result.tokensUsed });
  } catch (err: any) {
    console.error('AI generation failed:', err);
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 });
  }
}
