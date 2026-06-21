# VoiceScribe — Complete Project Blueprint v2.0
### AI-Powered Audio & Video Transcription Platform
**Version 2.0 | June 2026 | Final Confirmed Architecture**

> **Architecture Summary:** One app. Next.js on Vercel + Supabase + Groq API.
> No VPS. No paid APIs. No Claude AI. Genuinely $0/month forever.

---

# DOCUMENT 1 — PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1.1 Product Overview

VoiceScribe is a personal-use, web-based AI transcription platform for 1–4 trusted users.
It processes audio and video content (10 files/day, averaging ~3 minutes each, max 30 mins
total daily) into structured, editable, and exportable transcripts — and applies AI
post-processing to generate summaries, key insights, action items, chapters, blog posts,
and social media content.

**Core principle:** Everything runs on free tiers. No credit card. No VPS. No paid API.

**Transcription engine:** Groq Whisper large-v3 (free API)
**AI processing engine:** Groq LLaMA 3.3 70b (free API, same key)
**Fallback transcription:** Gladia free tier (10hrs/month backup)

---

## 1.2 Problem Statement

Content creators, consultants, researchers, and educators work with short-form spoken media
— clips, interviews, meetings, tutorials — and need fast transcription plus content
repurposing. Existing tools are expensive or require self-hosted infrastructure. VoiceScribe
solves this with a zero-cost, single-app workspace that handles the full pipeline from raw
media to repurposed content using only free cloud services.

---

## 1.3 Target Users

| User Type | Use Case |
|---|---|
| Primary user (you) | Daily transcription of 10 short videos/audio clips |
| Friends (up to 3) | Occasional transcription and content repurposing |

**Maximum users:** 4
**Daily usage:** ~10 files, ~3 mins average, ~30 mins total audio
**Monthly usage:** ~15 hours of audio

---

## 1.4 User Personas

### Persona 1 — You (Primary User)
- Transcribes 10 short videos/audio clips daily
- Needs summaries, blog posts, social content fast
- Wants dark/light mode, clean UI, keyboard shortcuts

### Persona 2 — Friend/Collaborator
- Occasional use, 2–3 times per week
- Needs transcripts and key points
- Values simplicity over features

---

## 1.5 Goals & Objectives

**Primary Goals:**
1. Zero cost — every service on free tier
2. Fast transcription via Groq Whisper API (no server spin-up time)
3. AI post-processing via Groq LLaMA (same free API)
4. Clean, usable UI with dark/light mode (Satoshi font, black & yellow)
5. All exports available without third-party services
6. Architecture extensible for Instagram, TikTok, Facebook URLs in future

**Measurable Objectives:**
- Transcription of a 3-min video in under 30 seconds (Groq is extremely fast)
- Support 10 files/day comfortably within Groq free limits (using only 6% of daily quota)
- All 5 export formats (TXT, PDF, DOCX, SRT, VTT) working
- Media files auto-deleted after transcription (storage stays near zero)
- $0 monthly cost indefinitely

---

## 1.6 Groq Free Tier — Why It's Enough

| Metric | Groq Free Limit | Your Daily Need | Headroom |
|---|---|---|---|
| Audio seconds/day | 28,800 secs (8hrs) | 1,800 secs (30mins) | 16x surplus |
| Transcription requests/day | 2,000 | ~10 files | 200x surplus |
| LLaMA requests/day | 14,400 | ~50 AI calls | 288x surplus |
| LLaMA tokens/day | 500,000 | ~20,000 | 25x surplus |

**You are using 6% of Groq's free transcription quota daily. This is permanent.**

---

## 1.7 Core Features

### Authentication
- Google OAuth 2.0 + email/password via Supabase Auth
- Protected routes — no unauthenticated access

### Dashboard
- Recent transcripts grid, processing status, search bar, quick upload

### Media Upload
- **Audio:** MP3, WAV, M4A, AAC
- **Video:** MP4, MOV, WEBM, MKV
- Max file size: 500MB per upload
- Upload progress indicator
- **Media auto-deleted after transcription** (keeps storage free)

### URL Transcription
- YouTube URLs (via yt-dlp on Vercel serverless — lightweight audio extraction)
- Direct MP4 / audio URLs
- **Future:** Instagram, TikTok, Facebook (pluggable extractor architecture)

### Transcription Engine
- **Primary:** Groq Whisper large-v3 API
- **Fallback:** Gladia free tier (10hrs/month backup)
- Timestamps per segment
- Auto language detection (99 languages)
- Response typically in 5–15 seconds for a 3-min file

### Transcript Editor
- Inline text editing with autosave
- Version history (last 5 versions)

### Export Formats
- TXT, PDF, DOCX, SRT, VTT — all generated server-side, no third-party service

### AI Processing — Groq LLaMA 3.3 70b (Free)
- Short / Detailed / Executive summary
- Key insights and important quotes
- Action items with deadlines
- Timestamped chapter generation

### Content Repurposing — Groq LLaMA 3.3 70b (Free)
- Blog article / SEO article
- LinkedIn post, Twitter/X thread, Instagram caption, Facebook post
- Study notes, Meeting notes, Research notes

### Search
- Full-text search across transcript titles, content, and summaries

### Dark/Light Mode
- Toggle saved per user, CSS variables, next-themes

---

## 1.8 User Stories

| # | As a... | I want to... | So that... |
|---|---|---|---|
| 1 | User | Upload 10 short video/audio files | I get all transcripts quickly |
| 2 | User | Paste a YouTube URL | I don't download the file myself |
| 3 | User | Edit my transcript | I can fix errors |
| 4 | User | Export as DOCX or PDF | I can share professionally |
| 5 | User | Generate a blog post | I can repurpose content |
| 6 | User | Extract action items | I don't miss tasks |
| 7 | User | Search all transcripts | I can find any quote |
| 8 | User | See processing status | I know when transcript is ready |
| 9 | User | Toggle dark/light mode | I can work comfortably |
| 10 | User | Files auto-delete after transcription | Storage stays free forever |

---

## 1.9 Success Metrics

| Metric | Target |
|---|---|
| Transcription time (3-min audio) | < 30 seconds via Groq |
| Monthly infrastructure cost | $0 |
| Groq daily quota used | < 10% |
| Export success rate | 100% |
| Storage used | < 50MB (text only, media deleted) |

---

## 1.10 Future Opportunities

- Instagram / TikTok / Facebook URL support (pluggable extractor, ready to add)
- Speaker diarisation
- Real-time microphone transcription
- Mobile app (React Native)
- Webhook integrations (Zapier/Make)

---

---

# DOCUMENT 2 — TECHNICAL REQUIREMENTS DOCUMENT (TRD)

## 2.1 System Architecture Overview

VoiceScribe is a **single Next.js application** deployed on Vercel, using Supabase for
database/auth/storage, and Groq API for both transcription and AI processing.
No VPS. No microservice. No Docker. No self-hosted anything.

```
[Browser]
    |
[Next.js App on Vercel]
    |-- /api/upload         → Supabase Storage (temp) → Groq Whisper
    |-- /api/transcribe/url → yt-dlp (Vercel serverless) → Groq Whisper
    |-- /api/ai/generate    → Groq LLaMA 3.3 70b
    |-- /api/export/[id]    → Generate TXT/PDF/DOCX/SRT/VTT
    |
[Supabase]
    |-- PostgreSQL (transcripts, jobs, users, ai_outputs)
    |-- Auth (Google OAuth + email/password)
    |-- Storage (temp media — deleted after transcription)
    |
[Groq API — Free Tier]
    |-- Whisper large-v3 (transcription)
    |-- LLaMA 3.3 70b (all AI features)
    |
[Gladia API — Free Tier Fallback]
    |-- Whisper-based transcription (10hrs/month backup)
```

---

## 2.2 Tech Stack — Final Confirmed

| Layer | Technology | Cost | Why |
|---|---|---|---|
| Framework | Next.js 14 (App Router) | $0 | SSR + API routes in one |
| Language | TypeScript | $0 | Type safety |
| Styling | Tailwind CSS | $0 | Utility-first |
| Components | Shadcn UI | $0 | Accessible, customisable |
| Icons | React Icons (Font Awesome) | $0 | Tree-shakeable |
| Font | Satoshi | $0 | @fontsource/satoshi |
| State (client) | Zustand | $0 | Lightweight |
| State (server) | SWR | $0 | Polling + caching |
| Forms | React Hook Form + Zod | $0 | Performance + validation |
| Database | Supabase PostgreSQL | $0 | Free 500MB |
| Auth | Supabase Auth | $0 | Google OAuth + email |
| Storage | Supabase Storage | $0 | Free 1GB (media deleted after use) |
| Transcription | Groq Whisper large-v3 | $0 | 28,800 secs/day free |
| AI Processing | Groq LLaMA 3.3 70b | $0 | 14,400 requests/day free |
| Fallback STT | Gladia | $0 | 10hrs/month free backup |
| Deployment | Vercel Free Tier | $0 | Auto-deploy from GitHub |
| Version Control | GitHub | $0 | Free |
| Error Tracking | Sentry Free | $0 | 5K errors/month |
| Uptime Monitor | UptimeRobot Free | $0 | 50 monitors |
| **TOTAL** | | **$0/month** | |

---

## 2.3 Frontend Architecture

**Directory Structure:**
```
/app
  /(auth)
    /login
    /register
    /reset-password
  /(dashboard)
    /dashboard
    /transcripts
    /transcripts/[id]
    /transcripts/[id]/edit
    /upload
    /search
    /settings
  /api
    /upload
    /transcribe
    /transcribe/url
    /ai/generate
    /export/[id]
    /webhooks/transcription
/components
  /ui              — Shadcn primitives
  /layout          — Sidebar, Header, ThemeToggle
  /transcript      — TranscriptCard, Editor, Viewer
  /upload          — DropZone, URLInput, ProgressBar
  /ai              — SummaryPanel, ActionItemsList, ChapterList
  /export          — ExportModal, FormatSelector
/lib
  /supabase        — client, server, middleware
  /groq            — transcription, ai-generate
  /gladia          — fallback transcription
  /extractors      — YouTube, DirectURL (pluggable for future platforms)
  /exporters       — txt, pdf, docx, srt, vtt generators
  /validators      — Zod schemas
/types
/hooks
```

---

## 2.4 Groq Integration

### Transcription
```typescript
// /lib/groq/transcription.ts
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribeWithGroq(audioBuffer: Buffer, filename: string) {
  const file = new File([audioBuffer], filename, { type: 'audio/mpeg' });

  const response = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'verbose_json', // includes timestamps
    timestamp_granularities: ['segment'],
  });

  return {
    text: response.text,
    segments: response.segments, // [{start, end, text}]
    language: response.language,
    duration: response.duration,
  };
}
```

### AI Processing
```typescript
// /lib/groq/ai-generate.ts
export async function generateWithGroq(
  transcript: string,
  outputType: string
) {
  const prompts: Record<string, string> = {
    summary_short: `Summarise this transcript in one paragraph:\n\n${transcript}`,
    summary_detailed: `Write a detailed structured summary:\n\n${transcript}`,
    action_items: `Extract all action items, tasks and deadlines:\n\n${transcript}`,
    blog_post: `Write an SEO blog article based on this transcript:\n\n${transcript}`,
    linkedin_post: `Write a LinkedIn post based on this transcript:\n\n${transcript}`,
    key_insights: `Extract the key insights and important quotes:\n\n${transcript}`,
    chapters: `Generate timestamped chapter titles for this transcript:\n\n${transcript}`,
    // ... all output types
  };

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompts[outputType] }],
    max_tokens: 1024,
  });

  return response.choices[0].message.content;
}
```

---

## 2.5 Transcription Waterfall

```typescript
// /lib/transcription/index.ts
export async function transcribeAudio(audioBuffer: Buffer, filename: string) {
  // Step 1 — Try Groq (primary, fastest, free)
  try {
    return await transcribeWithGroq(audioBuffer, filename);
  } catch (err) {
    if (!isRateLimitError(err)) throw err;
    console.warn('Groq rate limit hit, trying Gladia...');
  }

  // Step 2 — Fallback to Gladia (free 10hrs/month)
  try {
    return await transcribeWithGladia(audioBuffer, filename);
  } catch (err) {
    if (!isRateLimitError(err)) throw err;
    console.warn('Gladia rate limit hit, queuing job...');
  }

  // Step 3 — Queue for retry (extremely unlikely at your usage level)
  throw new Error('RATE_LIMIT_ALL_PROVIDERS');
}
```

**Note:** At your usage level (6% of Groq's daily quota), you will virtually never hit
Step 2 or 3. Gladia is purely a safety net.

---

## 2.6 URL Transcription (yt-dlp on Vercel)

For YouTube and direct URLs, yt-dlp runs as a lightweight Vercel serverless function:

```typescript
// /api/transcribe/url/route.ts
import { exec } from 'child_process';

export async function POST(req: Request) {
  const { url } = await req.json();

  // Download audio only (not video) — much smaller file
  const audioPath = `/tmp/${jobId}.mp3`;
  await execAsync(`yt-dlp -x --audio-format mp3 -o ${audioPath} "${url}"`);

  const audioBuffer = fs.readFileSync(audioPath);
  fs.unlinkSync(audioPath); // delete immediately

  return transcribeAudio(audioBuffer, 'audio.mp3');
}
```

**Vercel function timeout:** 60 seconds (Pro) / 10 seconds (Hobby).
For YouTube videos up to 30 mins, use Vercel's background functions or
stream progress via Server-Sent Events.

---

## 2.7 Pluggable Extractor Architecture (Future Platforms)

```typescript
// /lib/extractors/index.ts
interface MediaExtractor {
  canHandle(url: string): boolean;
  extract(url: string): Promise<Buffer>;
}

const extractors: MediaExtractor[] = [
  new YouTubeExtractor(),    // yt-dlp — works now
  new DirectURLExtractor(),  // fetch + ffmpeg — works now
  // Future additions (just uncomment when ready):
  // new InstagramExtractor(),
  // new TikTokExtractor(),
  // new FacebookExtractor(),
];

export async function extractAudio(url: string): Promise<Buffer> {
  const extractor = extractors.find(e => e.canHandle(url));
  if (!extractor) throw new Error('URL not supported');
  return extractor.extract(url);
}
```

Adding Instagram/TikTok/Facebook support in future = create new class + add to array.
Zero changes to core logic.

---

## 2.8 Storage Strategy

| File Type | Storage | Retention |
|---|---|---|
| Uploaded media (MP3, MP4 etc) | Supabase Storage | **Deleted immediately after transcription** |
| Extracted audio (from URL/video) | Vercel /tmp | **Deleted in same function execution** |
| Transcript text | Supabase PostgreSQL | Permanent (text is tiny ~5-10KB each) |
| AI outputs | Supabase PostgreSQL | Permanent |
| Export files (PDF, DOCX) | Generated on-demand | **Never stored — streamed to browser** |

**Storage used after 1 year of daily use:**
- 300 transcripts/month × 12 = 3,600 transcripts
- ~10KB each = ~36MB total
- Supabase free limit = 500MB
- **You use 7% of free DB storage after a full year**

---

## 2.9 Export Strategy

All exports generated on-demand in the Vercel function — never stored:

```
GET /api/export/[id]?format=pdf
  → Fetch transcript from Supabase
  → Generate file in memory (jsPDF / docx / plain text)
  → Stream directly to browser as download
  → Nothing stored anywhere
```

This means export files never consume Supabase storage.

---

## 2.10 Security

- All routes protected by Supabase JWT middleware
- Row Level Security (RLS) — users see only their own data
- Groq API key stored in Vercel environment variables (never client-side)
- Signed URLs for Supabase Storage
- Zod validation on all API inputs
- yt-dlp args passed as array (no shell injection)
- HTTPS enforced on all services

---

## 2.11 Vercel Function Timeout Handling

Vercel Hobby (free) has a 10-second function timeout. Groq transcription of a 3-min
audio file typically takes 3–8 seconds — within the limit. For longer files:

| File Length | Groq Response Time | Within 10s Vercel Limit? |
|---|---|---|
| 1 min | ~2 seconds | ✅ Yes |
| 3 mins | ~4 seconds | ✅ Yes |
| 10 mins | ~8 seconds | ✅ Likely |
| 30 mins | ~20 seconds | ⚠️ May timeout |

**Solution for 30-min files:** Use Supabase Edge Functions (no timeout limit) to call
Groq for longer files, with the Next.js API polling for completion.

---

---

# DOCUMENT 3 — APPLICATION FLOW

## 3.1 Visitor Flow
```
Visit voicescribe.app
  → Middleware: no valid JWT → redirect to /login
  → Options: Sign in with Google  |  Email + Password
  → Authenticated → /dashboard
```

## 3.2 New User Onboarding
```
First login (profiles.onboarded = false)
  → Welcome modal (3 steps):
      Step 1: "Upload a file or paste a URL"
      Step 2: "Watch your transcript appear in seconds"
      Step 3: "Generate summaries, blog posts, and more — free"
  → Dismiss → profiles.onboarded = true
  → /dashboard
```

## 3.3 Returning User Flow
```
Visit voicescribe.app
  → Valid JWT cookie → /dashboard
  → See: recent transcripts, search bar, "New Transcript" button
  → Click transcript → /transcripts/[id]
  → Click "New Transcript" → /upload
```

## 3.4 File Upload Flow
```
/upload → "Upload File" tab
  → Drag & drop OR click to browse
  → Client validates: file type, size (< 500MB)
  → Invalid → toast error
  → Valid → show: filename, size, duration estimate
  → Options: language (auto-detect), model (whisper-large-v3)
  → Click "Transcribe"
      → Upload file to Supabase Storage (/tmp bucket)
      → INSERT transcripts (status: pending)
      → POST /api/transcribe with signed storage URL
          → Download file from Supabase Storage
          → Send to Groq Whisper API
          → Receive segments + text
          → INSERT transcript_versions (content + segments JSONB)
          → UPDATE transcripts (status: completed)
          → DELETE file from Supabase Storage
  → Redirect to /transcripts/[id]
  → SWR polls every 2 seconds until status = completed
  → Transcript renders
```

## 3.5 URL Transcription Flow
```
/upload → "URL" tab
  → Paste YouTube URL or direct media URL
  → Client validates URL format (regex)
  → Click "Fetch & Transcribe"
      → POST /api/transcribe/url { url }
          → yt-dlp downloads audio only to /tmp
          → Send audio buffer to Groq Whisper API
          → Delete /tmp file immediately
          → Save transcript to DB
  → Same redirect + polling flow as file upload
```

## 3.6 Transcript Page Flow
```
/transcripts/[id]

Header:
  → Title (inline editable), language badge, duration, date

Tab 1 — Transcript:
  → Timestamps on left, text on right
  → In-page search (highlight matches)
  → "Edit" button → /transcripts/[id]/edit

Tab 2 — AI Insights:
  → Generate: Short Summary | Detailed Summary | Executive Summary
  → Generate: Key Insights | Action Items | Chapters
  → Each generates via Groq LLaMA (cached after first generation)

Tab 3 — Repurpose:
  → Blog Post | SEO Article
  → LinkedIn | Twitter/X Thread | Instagram | Facebook
  → Study Notes | Meeting Notes | Research Notes

Sidebar:
  → Export: TXT | PDF | DOCX | SRT | VTT
```

## 3.7 Editor Flow
```
/transcripts/[id]/edit
  → Full transcript in textarea
  → Autosave (debounced 2 seconds)
      → INSERT transcript_versions (new version)
      → Keep last 5 versions only
  → Version history dropdown → restore → confirmation → restore
  → Back → /transcripts/[id]
```

## 3.8 Export Flow
```
Click export format in sidebar
  → POST /api/export/[id]?format=docx
      → Fetch transcript from DB
      → Generate file in memory
      → Stream to browser as download
      → Toast: "Downloading..."
  → File saved to user's device
  → Nothing stored in Supabase
```

## 3.9 Search Flow
```
Type in search bar (min 2 characters, 300ms debounce)
  → GET /api/search?q=query
      → PostgreSQL full-text search (GIN index)
      → Search: titles + transcript content + AI outputs
  → Results: title, date, duration, highlighted excerpt
  → Click → /transcripts/[id]
```

## 3.10 Error States

| Error | Location | Message |
|---|---|---|
| File too large | Toast | "File exceeds 500MB limit" |
| Unsupported format | Toast | "Use MP3, MP4, WAV, MOV, M4A..." |
| Invalid URL | Inline | "Enter a valid YouTube or media URL" |
| Groq rate limit | Toast | "Processing queued — you'll be notified" |
| Transcription failed | Job status | "Failed — Retry" button |
| Export failed | Toast | "Export failed. Try again." |
| Session expired | Redirect | "Session expired. Sign in again." |
| URL download failed | Job status | "Could not download URL. Try uploading the file directly." |

---

---

# DOCUMENT 4 — UI/UX DESIGN BRIEF

## 4.1 Brand Personality

| Attribute | Expression |
|---|---|
| Professional | Clean layouts, purposeful whitespace, no clutter |
| Intelligent | Data-rich where needed, never overwhelming |
| Calm | Low-saturation base + yellow accent, smooth transitions |
| Modern | Sharp Satoshi typography, tight tracking, minimal ornamentation |

---

## 4.2 Color System

### Dark Mode (Default)

| Token | HEX | Usage |
|---|---|---|
| `--bg-primary` | `#0A0A0A` | Main page background |
| `--bg-secondary` | `#111111` | Card backgrounds |
| `--bg-tertiary` | `#1A1A1A` | Input backgrounds, hover |
| `--bg-elevated` | `#222222` | Modals, dropdowns |
| `--accent-primary` | `#F5C518` | CTAs, active states, highlights |
| `--accent-hover` | `#FFD740` | Hover on yellow elements |
| `--accent-muted` | `#2A2200` | Subtle yellow tinted backgrounds |
| `--text-primary` | `#FFFFFF` | Primary text |
| `--text-secondary` | `#A0A0A0` | Labels, meta info |
| `--text-muted` | `#555555` | Placeholders, disabled |
| `--border` | `#2A2A2A` | Default borders |
| `--border-active` | `#F5C518` | Focused/active borders |
| `--success` | `#22C55E` | Success states |
| `--error` | `#EF4444` | Error states |
| `--warning` | `#F59E0B` | Warning states |

### Light Mode

| Token | HEX | Usage |
|---|---|---|
| `--bg-primary` | `#FFFFFF` | Main background |
| `--bg-secondary` | `#F5F5F5` | Cards |
| `--bg-tertiary` | `#EBEBEB` | Inputs |
| `--accent-primary` | `#D4A017` | Darker yellow for contrast |
| `--accent-hover` | `#B8860B` | Hover |
| `--accent-muted` | `#FFF8E1` | Subtle yellow tint |
| `--text-primary` | `#0A0A0A` | Primary text |
| `--text-secondary` | `#555555` | Secondary |
| `--border` | `#E0E0E0` | Default borders |

---

## 4.3 Typography

**Font:** Satoshi (primary) / Inter (fallback) / system-ui
**Install:** `npm install @fontsource/satoshi`

| Role | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| Display H1 | 48px | 700 Bold | 1.1 | -0.04em |
| Heading H2 | 36px | 700 Bold | 1.2 | -0.03em |
| Heading H3 | 24px | 600 SemiBold | 1.3 | -0.02em |
| Heading H4 | 18px | 600 SemiBold | 1.4 | -0.01em |
| Body Large | 16px | 400 Regular | 1.6 | -0.01em |
| Body Default | 14px | 400 Regular | 1.6 | 0em |
| Label | 12px | 500 Medium | 1.4 | +0.05em |
| Mono / Code | 13px | 400 Regular | 1.5 | 0em |

**Tailwind config:**
```js
fontFamily: { sans: ['Satoshi', 'Inter', 'system-ui'] },
letterSpacing: { tightest: '-0.04em', tighter: '-0.02em', tight: '-0.01em' },
```

---

## 4.4 Spacing System (Base: 4px)

| Token | Value | Tailwind |
|---|---|---|
| xs | 4px | p-1 |
| sm | 8px | p-2 |
| md | 16px | p-4 |
| lg | 24px | p-6 |
| xl | 32px | p-8 |
| 2xl | 48px | p-12 |
| 3xl | 64px | p-16 |

---

## 4.5 Border Radius

| Token | Value | Usage |
|---|---|---|
| --radius-sm | 6px | Badges, tags |
| --radius-md | 10px | Buttons, inputs |
| --radius-lg | 14px | Cards |
| --radius-xl | 20px | Modals |
| --radius-full | 9999px | Pills, avatars |

---

## 4.6 Shadows

### Dark Mode
```css
--shadow-sm:     0 1px 3px rgba(0,0,0,0.4);
--shadow-md:     0 4px 12px rgba(0,0,0,0.5);
--shadow-lg:     0 8px 32px rgba(0,0,0,0.6);
--shadow-accent: 0 0 0 2px rgba(245,197,24,0.4);  /* yellow focus ring */
```

### Light Mode
```css
--shadow-sm:     0 1px 3px rgba(0,0,0,0.08);
--shadow-md:     0 4px 12px rgba(0,0,0,0.12);
--shadow-lg:     0 8px 32px rgba(0,0,0,0.16);
--shadow-accent: 0 0 0 2px rgba(212,160,23,0.35);
```

---

## 4.7 Button System

| Variant | Background | Text | Use Case |
|---|---|---|---|
| Primary | #F5C518 | #0A0A0A | Transcribe, Generate, Export |
| Secondary | #1A1A1A | #FFFFFF | Cancel, secondary actions |
| Ghost | transparent | #A0A0A0 | Toolbar, icon buttons |
| Danger | #EF4444 | #FFFFFF | Delete, destructive |
| Outline | transparent | #F5C518 | Alternative CTA |

**Sizes:** sm (h-8 px-3 text-xs) | md (h-10 px-4 text-sm) | lg (h-12 px-6 text-base)

---

## 4.8 Dark/Light Mode Toggle

- Toggle in top-right nav bar
- Icon: `FaSun` (light) / `FaMoon` (dark) from react-icons/fa
- Saved to `localStorage` + `profiles.theme_preference` in DB
- Implemented via `next-themes`
- CSS variables on `[data-theme="dark"]` and `[data-theme="light"]`

---

## 4.9 Responsive Layout

| Breakpoint | Layout |
|---|---|
| Mobile < 768px | Single column, bottom tab nav, full-width cards |
| Tablet 768–1024px | Sidebar collapses to icon strip, 2-col cards |
| Desktop > 1024px | Full 240px sidebar, 3-col dashboard, split transcript+AI panel |

---

## 4.10 Accessibility

- Keyboard navigation throughout (logical Tab order)
- Yellow focus ring (`--shadow-accent`) on all focusable elements
- ARIA labels on all icon-only buttons
- `aria-live` for form errors and processing status
- Skip-to-content link at page top
- Min contrast 4.5:1 body text, 3:1 large text

---

---

# DOCUMENT 5 — DATABASE SCHEMA & DATA FLOW

## 5.1 Tables

### profiles
```sql
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT,
  avatar_url        TEXT,
  role              TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  theme_preference  TEXT DEFAULT 'dark' CHECK (theme_preference IN ('dark', 'light')),
  onboarded         BOOLEAN DEFAULT FALSE,
  brand_voice       TEXT DEFAULT NULL CHECK (char_length(brand_voice) <= 500),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### transcripts
```sql
CREATE TABLE public.transcripts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL DEFAULT 'Untitled Transcript',
  source_type         TEXT NOT NULL CHECK (source_type IN ('upload', 'youtube', 'url')),
  source_url          TEXT,
  original_filename   TEXT,
  duration_seconds    INTEGER,
  language_detected   TEXT,
  whisper_model       TEXT DEFAULT 'whisper-large-v3',
  transcription_provider TEXT DEFAULT 'groq' CHECK (
                        transcription_provider IN ('groq', 'gladia')
                      ),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (
                        status IN ('pending', 'processing', 'completed', 'failed')
                      ),
  error_message       TEXT,
  word_count          INTEGER,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### transcript_versions
```sql
CREATE TABLE public.transcript_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id   UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  content         TEXT NOT NULL,
  segments        JSONB,   -- [{start: 0.0, end: 2.4, text: "Hello..."}]
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### ai_outputs
```sql
CREATE TABLE public.ai_outputs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id   UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  output_type     TEXT NOT NULL CHECK (output_type IN (
                    'summary_short', 'summary_detailed', 'summary_executive',
                    'key_insights', 'action_items', 'chapters',
                    'blog_post', 'seo_article',
                    'linkedin_post', 'twitter_thread',
                    'instagram_caption', 'tiktok_caption', 'facebook_post',
                    'study_notes', 'meeting_notes', 'research_notes'
                  )),
  content         TEXT NOT NULL,
  model_used      TEXT DEFAULT 'llama-3.3-70b-versatile',
  provider        TEXT DEFAULT 'groq',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### processing_jobs
```sql
CREATE TABLE public.processing_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id   UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (
                    status IN ('queued', 'running', 'completed', 'failed')
                  ),
  provider_used   TEXT,
  attempts        INTEGER DEFAULT 0,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
```

---

## 5.2 Relationships

```
auth.users
  └── profiles (1:1)
  └── transcripts (1:many)
      └── transcript_versions (1:many — max 5 kept)
      └── ai_outputs (1:many — cached, not regenerated)
      └── processing_jobs (1:many)
```

---

## 5.3 Indexes

```sql
CREATE INDEX idx_transcripts_user_id    ON transcripts(user_id);
CREATE INDEX idx_transcripts_status     ON transcripts(status);
CREATE INDEX idx_transcripts_created_at ON transcripts(created_at DESC);

CREATE INDEX idx_transcript_versions_tid ON transcript_versions(transcript_id);
CREATE INDEX idx_ai_outputs_tid_type     ON ai_outputs(transcript_id, output_type);
CREATE INDEX idx_jobs_status             ON processing_jobs(status);

-- Full-text search index
ALTER TABLE transcripts ADD COLUMN search_vector TSVECTOR;
CREATE INDEX idx_transcripts_fts ON transcripts USING GIN(search_vector);

-- Auto-update search_vector on insert/update
CREATE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transcripts_search_vector_update
  BEFORE INSERT OR UPDATE ON transcripts
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();
```

---

## 5.4 Row Level Security

```sql
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_outputs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs   ENABLE ROW LEVEL SECURITY;

-- Users see only their own data
CREATE POLICY "own_profiles"    ON profiles          FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_transcripts" ON transcripts       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_versions"    ON transcript_versions FOR ALL
  USING (transcript_id IN (SELECT id FROM transcripts WHERE user_id = auth.uid()));
CREATE POLICY "own_ai_outputs"  ON ai_outputs        FOR ALL
  USING (transcript_id IN (SELECT id FROM transcripts WHERE user_id = auth.uid()));
CREATE POLICY "own_jobs"        ON processing_jobs   FOR ALL USING (auth.uid() = user_id);
```

---

## 5.5 Storage Buckets

```
media-uploads/           ← TEMPORARY only
  {user_id}/
    {job_id}.{ext}       ← Deleted immediately after Groq processes it

(No exports bucket — exports streamed directly to browser, never stored)
```

---

## 5.6 Complete Data Flow

### Upload → Transcript
```
1.  Client: select file → validate type/size
2.  Client: upload file to Supabase Storage (media-uploads/{user}/{job})
3.  Client: POST /api/transcribe { storageKey, jobId }
4.  Server: INSERT transcripts (status: pending)
5.  Server: INSERT processing_jobs (status: queued)
6.  Server: download file from Supabase Storage via signed URL
7.  Server: send audio buffer to Groq Whisper API
         → on rate limit: fallback to Gladia
8.  Server: receive { text, segments, language, duration }
9.  Server: INSERT transcript_versions (version 1, segments JSONB)
10. Server: UPDATE transcripts (status: completed, word_count, language)
11. Server: UPDATE processing_jobs (status: completed, provider_used: 'groq')
12. Server: DELETE file from Supabase Storage
13. Client: SWR polling detects completed → renders transcript
```

### AI Generation Flow
```
1. User clicks "Generate Summary" on transcript page
2. Client: POST /api/ai/generate { transcript_id, output_type: 'summary_short' }
3. Server: check ai_outputs — if exists, return cached (no API call)
4. Server: fetch transcript text from transcript_versions (latest)
5. Server: build prompt for output_type
6. Server: POST to Groq LLaMA 3.3 70b
7. Server: INSERT ai_outputs { transcript_id, output_type, content }
8. Server: return content to client
9. Client: render in AI panel
```

### Export Flow
```
1. User clicks "Export PDF"
2. Client: GET /api/export/{id}?format=pdf
3. Server: fetch transcript from transcript_versions
4. Server: optionally fetch ai_outputs (if user chose to include summary)
5. Server: generate PDF in memory (jsPDF)
6. Server: set Content-Disposition: attachment; filename="transcript.pdf"
7. Server: stream file buffer directly to browser
8. Browser: saves file to downloads
9. Nothing stored anywhere — storage unchanged
```

---

---

# DOCUMENT 6 — IMPLEMENTATION PLAN

## Phase Overview

| Phase | Name | Duration | Cumulative |
|---|---|---|---|
| 1 | Foundation | 3 days | Day 3 |
| 2 | Authentication | 3 days | Day 6 |
| 3 | Upload + Transcription | 5 days | Day 11 |
| 4 | Transcript Management | 4 days | Day 15 |
| 5 | AI Processing | 4 days | Day 19 |
| 6 | Export System | 3 days | Day 22 |
| 7 | Search + Polish | 3 days | Day 25 |
| 8 | Testing + Deploy | 5 days | Day 30 |
| **Total** | | **~30 days** | **~4-5 weeks** |

---

## Phase 1 — Foundation (Days 1–3)

**Goal:** Project skeleton, design system, all tooling configured.

**Tasks:**
1. `npx create-next-app@latest voicescribe --typescript --tailwind --app`
2. `npm install @fontsource/satoshi next-themes zustand swr`
3. `npm install react-icons react-hook-form zod @supabase/ssr`
4. `npm install groq-sdk` (Groq official SDK)
5. Configure `tailwind.config.ts` with Satoshi + custom design tokens
6. Create `globals.css` with full CSS variable system (dark + light)
7. Create Supabase project: enable Auth, create `media-uploads` bucket
8. Run migrations: `profiles` table + RLS policies
9. Set up GitHub repo + connect to Vercel
10. Configure environment variables:
    ```
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    GROQ_API_KEY=
    GLADIA_API_KEY=
    ```

**Risk:** Tailwind v4 breaking changes — pin to v3.4.x

---

## Phase 2 — Authentication (Days 4–6)

**Goal:** Full auth flow with Google OAuth + email, protected routes.

**Tasks:**
1. Enable Google OAuth in Supabase Auth dashboard
2. Create `/app/(auth)/login` — Google button + email/password form
3. Create `/app/(auth)/register` — registration form
4. Create `/app/(auth)/reset-password` — password reset
5. Implement Supabase SSR helpers (cookie-based JWT for Next.js)
6. Create `middleware.ts` — protect all `/dashboard/*` routes
7. DB trigger: auto-create `profiles` row on new `auth.users` entry
8. Implement sign-out in sidebar
9. Onboarding modal check on first login

**Risk:** Google OAuth redirect URL must match exactly in Google Console + Supabase.

---

## Phase 3 — Upload + Transcription (Days 7–11)

**Goal:** File upload and URL transcription working end-to-end with Groq.

**Tasks:**
1. Create `/upload` page with File tab + URL tab
2. Build `DropZone` component (drag & drop + click to browse)
3. Build `URLInput` component with YouTube + direct URL regex validation
4. Implement Supabase Storage direct upload from client (bypasses Vercel 4MB limit)
5. Create `/api/transcribe` route — download from storage → Groq Whisper → save
6. Create `/api/transcribe/url` route — yt-dlp → Groq Whisper → save
7. Install yt-dlp binary for Vercel serverless environment
8. Implement Gladia fallback in `/lib/transcription/index.ts`
9. Build `/transcripts/[id]` processing state UI (spinner + live status)
10. Implement SWR polling every 2 seconds for job status
11. Auto-delete media from Supabase Storage after successful transcription
12. End-to-end test: upload MP3 → transcript in DB → UI renders

**Key decision:** Upload directly to Supabase Storage from client, then pass signed
URL to API route. This bypasses Vercel's 4.5MB body size limit entirely.

**Risk:** yt-dlp binary size on Vercel — use `yt-dlp-wrap` npm package instead of binary.

---

## Phase 4 — Transcript Management (Days 12–15)

**Goal:** Full transcript viewing, editing, version history.

**Tasks:**
1. Build `TranscriptViewer` — timestamps left column, text right column
2. In-page search (highlight matching text, Ctrl+F style)
3. Build `TranscriptEditor` with debounced autosave (2 seconds)
4. Version save: INSERT into `transcript_versions` on save
5. Keep max 5 versions: DELETE oldest when count exceeds 5
6. Build version history dropdown + restore with confirmation modal
7. Build `/dashboard` — transcript grid with status badges, date, duration
8. Inline title editing on transcript page header

---

## Phase 5 — AI Processing (Days 16–19)

**Goal:** All AI features working via Groq LLaMA 3.3 70b — free.

**Tasks:**
1. Add `GROQ_API_KEY` to Vercel environment variables
2. Build prompt templates for all 15 output types in `/lib/groq/prompts.ts`
3. Create `/api/ai/generate` route — check cache → call Groq → save + return
4. Build `AIPanel` component with two tabs: Insights | Repurpose
5. Build `SummaryBlock` — short/detailed/executive toggle
6. Build `ActionItemsList` — checkbox list of extracted tasks
7. Build `ChapterList` — timestamped chapter navigation
8. Build `RepurposePanel` — blog, social, notes output cards
9. Add loading skeletons during generation
10. Cache check: if `ai_outputs` row exists for that type, skip API call

**Cost:** $0 — Groq LLaMA 3.3 70b is free, 14,400 requests/day.

---

## Phase 6 — Export System (Days 20–22)

**Goal:** All 5 export formats working, streamed directly to browser.

**Tasks:**
1. `npm install jspdf docx`
2. Build `/lib/exporters/txt.ts` — plain text with optional timestamps
3. Build `/lib/exporters/srt.ts` — SRT format from segments JSONB
4. Build `/lib/exporters/vtt.ts` — WebVTT format from segments JSONB
5. Build `/lib/exporters/pdf.ts` — jsPDF with title, meta, transcript
6. Build `/lib/exporters/docx.ts` — DOCX with title, timestamp table, transcript
7. Create `/api/export/[id]` — generate in memory → stream to browser
8. Build `ExportModal` — format picker with options (include timestamps? include summary?)
9. Test all formats with edge cases (special characters, very long transcripts)

---

## Phase 7 — Search + Polish (Days 23–25)

**Goal:** Full-text search working, UI polished, responsive on mobile.

**Tasks:**
1. Implement `/api/search` — PostgreSQL full-text search with GIN index
2. Build `SearchResults` with excerpt highlighting
3. Filter by: date range, language, duration
4. Mobile responsive: bottom tab nav, full-width cards, touch-friendly
5. Keyboard shortcuts: `Cmd+K` for search, `Cmd+Enter` to transcribe
6. Toast notifications system (success, error, info)
7. Empty states for dashboard (no transcripts yet) and search (no results)
8. Loading skeletons everywhere (no blank flashes)

---

## Phase 8 — Testing + Deploy (Days 26–30)

**Goal:** All critical paths tested, production deployment live.

**Tasks:**
1. Set up Vitest — unit tests for exporters, validators, URL detection
2. Set up Playwright — E2E tests for: login, upload, transcribe, AI, export, search
3. Test Groq → Gladia fallback (mock Groq rate limit error)
4. Test all export formats with long transcripts (>10,000 words)
5. Set up Sentry (Vercel integration — 1 click)
6. Set up UptimeRobot (monitor Vercel app URL)
7. Configure production Supabase: run all migrations
8. Set all Vercel production environment variables
9. Final smoke test of all features in production
10. Write README: setup guide, env vars, architecture notes

---

---

# FINAL ANALYSIS

## Confirmed Final Architecture

| Component | Technology | Cost |
|---|---|---|
| Frontend + API | Next.js 14 on Vercel | $0 |
| Database + Auth + Storage | Supabase Free Tier | $0 |
| Transcription (primary) | Groq Whisper large-v3 | $0 |
| Transcription (fallback) | Gladia free tier | $0 |
| AI features | Groq LLaMA 3.3 70b | $0 |
| CI/CD | GitHub Actions + Vercel | $0 |
| Error tracking | Sentry Free | $0 |
| Uptime monitoring | UptimeRobot Free | $0 |
| **TOTAL** | | **$0/month forever** |

---

## Why This Works at Zero Cost — The Math

| Resource | Free Limit | Your Usage | % Used |
|---|---|---|---|
| Groq Whisper secs/day | 28,800 | 1,800 | **6%** |
| Groq Whisper requests/day | 2,000 | 10 | **0.5%** |
| Groq LLaMA requests/day | 14,400 | ~50 | **0.3%** |
| Supabase DB storage | 500MB | ~3MB/year | **0.6%/year** |
| Supabase file storage | 1GB | ~0 (deleted) | **~0%** |
| Vercel bandwidth | 100GB/mo | <1GB/mo | **<1%** |

---

## MVP Features — Ship These First

1. Authentication (Google OAuth + email)
2. File upload (audio + video, all formats)
3. YouTube URL transcription
4. Transcript viewer with timestamps
5. Short summary (Groq LLaMA)
6. Export: TXT + SRT
7. Dashboard with transcript list
8. Dark/light mode toggle

---

## Postpone to V2

- All social media repurposing (LinkedIn, Twitter, Instagram, Facebook)
- DOCX + PDF exports
- Version history
- Chapter generation
- Action items extraction
- Instagram / TikTok / Facebook URL support

---

## Technical Risks & Solutions

| Risk | Likelihood | Solution |
|---|---|---|
| Vercel 10s timeout for long files | Low for your use | Use Supabase Edge Function for >10min files |
| Groq rate limit | Very low (6% quota used) | Gladia fallback already built in |
| yt-dlp binary on Vercel | Medium | Use yt-dlp-wrap npm package |
| Supabase free tier storage | Very low | Media deleted after transcription |
| yt-dlp breaks on YouTube changes | Medium | Version-pin; abstracted extractor layer |

---

## Development Timeline

| Week | Focus |
|---|---|
| Week 1 | Foundation + Auth |
| Week 2 | Upload + Transcription (core value) |
| Week 3 | Transcript Management + AI |
| Week 4 | Export + Search + Polish + Deploy |
| **Total** | **~4 weeks to fully working app** |

---

## Recommended Build Order

1. Auth → nothing works without it
2. Upload + Groq transcription → core value proposition
3. Transcript viewer → make the output usable
4. Groq AI features → multiplies transcript value
5. Export → delivers the output
6. Search → essential as library grows
7. Polish + responsive → UX quality
8. Deploy + monitor → go live

---

## Free Tier Limits to Watch

| Service | Limit | Action if hit |
|---|---|---|
| Groq Whisper | 28,800 secs/day | Handled by concurrent fallback to Deepgram/AssemblyAI |
| Gladia | 10hrs/month | Handled by concurrent fallback to Deepgram/AssemblyAI |
| Deepgram | $200 free credit | Lifetime free allowance for personal-use scale |
| AssemblyAI | 100 hours/month | Lifetime free allowance for personal-use scale |
| Supabase DB | 500MB | You'd need ~14 years to hit this |
| Supabase Storage | 1GB | Media deleted = never hit |
| Vercel bandwidth | 100GB/month | Far exceeds your need |
| Vercel functions | 10s timeout | Only matters for files >10mins |

---

# DOCUMENT 6 — PARALLEL MULTI-ENGINE & SPLASH LANDING PAGE REFACTOR (v2.1)

## 6.1 Concurrent Multi-Engine Pipeline
Instead of sequential waterfall checks, transcription now runs concurrently via `Promise.any` to fetch results from the fastest responsive API.
- **Provider Limits Enforced**:
  - **File Size**: Groq (<25MB), Gladia (<20MB), AssemblyAI (<500MB), Deepgram (<500MB).
  - **Quota Limits**: Dynamic database queries in `quota.ts` query monthly limits for each provider and skip exhausted engines.
- **Improved Errors**: Surfaced individual API messages inside the `AggregateError` envelope.

## 6.2 Splash Screen & Landing Page
The root path `/` is now public.
- **Splash Screen Loader**: Features a premium yellow (`#F5C518`) fullscreen container with the black SVG logo (`logo_black.svg`) and brand typography.
- **Flow**:
  - **Unauthenticated**: Loader fades out smoothly after checking auth (1.2s minimum duration) to reveal the feature-rich landing page.
  - **Authenticated**: Loader stays solid and redirects directly to `/dashboard` via client-side transitions.

## 6.3 Dynamic SVG Branding
- **Favicon**: Configured standard `favicon.svg` in `metadata.icons` inside `layout.tsx`.
- **Theme-Aware Navbar**: Integrated `/Logo/logo_light_theme_navbar.svg` and `/Logo/logo_dark_theme_navbar.svg` using client hydration-safe theme resolution.
- **Auth branding**: Swapped custom CSS text box wrappers for original SVG logo vectors in `login`, `register`, and `reset-password` layouts.

## 6.4 AI Brand Voice Tone Injection (v2.2)
- **Profile Schema Addition**: The `profiles` table now includes a `brand_voice` column (nullable, TEXT type, limited to 500 characters). This allows users to save a custom tone of voice description directly from the Settings page.
- **Prompt Customization**: When calling `/api/ai/generate`, the server queries the user's `brand_voice`. If set, it prepends the instructions to the system prompt generated in `/lib/groq/prompts.ts`, shaping all summaries, articles, and posts.

## 6.5 TikTok Caption Repurposing (v2.2)
- **Tool Suite Expansion**: Added the `tiktok_caption` output type to `/lib/supabase/types.ts`, `/lib/validators/api.ts`, `/lib/groq/prompts.ts`, and the frontend selection in `TranscriptDetails.tsx`.
- **Formatting Template**: Standardizes output formatting: scroll-stopping hooks, body sentences, Call To Action, and highly-targeted hashtags.


