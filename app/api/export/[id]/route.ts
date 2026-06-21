import { NextRequest, NextResponse } from 'next/server';
import { createUserClient, createServiceClient } from '@/lib/supabase/server';
import { generateTxt } from '@/lib/exporters/txt';
import { generateSrt } from '@/lib/exporters/srt';
import { generateVtt } from '@/lib/exporters/vtt';
import { generatePdf } from '@/lib/exporters/pdf';
import { generateDocx } from '@/lib/exporters/docx';
import { TranscriptSegment } from '@/lib/supabase/types';

type ExportFormat = 'txt' | 'srt' | 'vtt' | 'pdf' | 'docx';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth: cookie-aware client to resolve session
  const authClient = await createUserClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // DB: service client for all data fetching
  const supabase = await createServiceClient();

  const format = (req.nextUrl.searchParams.get('format') ?? 'txt') as ExportFormat;
  const includeTimestamps = req.nextUrl.searchParams.get('timestamps') !== 'false';

  const validFormats: ExportFormat[] = ['txt', 'srt', 'vtt', 'pdf', 'docx'];
  if (!validFormats.includes(format)) {
    return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
  }

  // Fetch transcript (verify ownership)
  const { data: transcript, error: tError } = await supabase
    .from('transcripts')
    .select('id, title, language_detected, duration_seconds, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (tError || !transcript) return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });

  // Fetch latest version
  const { data: version, error: vError } = await supabase
    .from('transcript_versions')
    .select('content, segments')
    .eq('transcript_id', id)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (vError || !version) return NextResponse.json({ error: 'Transcript content not found' }, { status: 404 });

  const segments = (version.segments as TranscriptSegment[]) ?? [];
  const safeTitle = transcript.title.replace(/[^a-z0-9_\- ]/gi, '_').slice(0, 60);

  try {
    let fileBuffer: Uint8Array;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'txt': {
        const txt = generateTxt({ title: transcript.title, content: version.content, segments, includeTimestamps });
        fileBuffer = Buffer.from(txt, 'utf-8');
        contentType = 'text/plain; charset=utf-8';
        filename = `${safeTitle}.txt`;
        break;
      }
      case 'srt': {
        const srt = generateSrt(segments, version.content);
        fileBuffer = Buffer.from(srt, 'utf-8');
        contentType = 'text/srt; charset=utf-8';
        filename = `${safeTitle}.srt`;
        break;
      }
      case 'vtt': {
        const vtt = generateVtt(segments, version.content);
        fileBuffer = Buffer.from(vtt, 'utf-8');
        contentType = 'text/vtt; charset=utf-8';
        filename = `${safeTitle}.vtt`;
        break;
      }
      case 'pdf': {
        fileBuffer = generatePdf({
          title: transcript.title,
          content: version.content,
          segments,
          includeTimestamps,
          language: transcript.language_detected ?? undefined,
          duration: transcript.duration_seconds ?? undefined,
          createdAt: transcript.created_at,
        });
        contentType = 'application/pdf';
        filename = `${safeTitle}.pdf`;
        break;
      }
      case 'docx': {
        fileBuffer = await generateDocx({
          title: transcript.title,
          content: version.content,
          segments,
          includeTimestamps,
          language: transcript.language_detected ?? undefined,
          duration: transcript.duration_seconds ?? undefined,
          createdAt: transcript.created_at,
        });
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${safeTitle}.docx`;
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(fileBuffer.length),
      },
    });

  } catch (err: any) {
    console.error(`Export failed (${format}):`, err);
    return NextResponse.json({ error: 'Export failed. Please try again.' }, { status: 500 });
  }
}
