# 🎙️ VoiceScribe (theandscribe)

> **AI-Powered Audio & Video Transcription & Repurposing Platform**  
> Convert any audio, video, or YouTube link into high-quality transcripts in seconds—completely for free. Automatically repurpose transcripts into executive summaries, professional blog posts, and viral TikTok captions styled in your customized AI Brand Voice. Genuinely $0/month forever.

---

## ✨ Key Features

- **⚡ Near-Instant Transcription**: Powered by **Groq Whisper large-v3** (with **Gladia**, **AssemblyAI**, and **Deepgram** fallbacks running concurrently). Typical transcription completes in 5–15 seconds for a 3-minute video.
- **🎙️ AI Brand Voice**: Describe your writing tone and style (e.g. casual, witty, professional) in the Settings page. This instruction is automatically prepended to every AI repurposing prompt so all content sounds uniquely like *you*.
- **🎵 Viral TikTok Captions**: Repurpose any audio or video transcript into punchy TikTok captions, including scroll-stopping hooks, body sentences, CTA, and optimized hashtags.
- **🧠 Rich Repurposing & Insights Suite**: 
  - *Insights*: Short/Detailed/Executive Summaries, Key Insights (with key quotes), Action Items, and Chapters.
  - *Repurposing*: Blog Posts, SEO Articles, LinkedIn Posts, Twitter Threads, Instagram Captions, Facebook Posts, Study Notes, Meeting Notes, and Research Notes.
- **✍️ Interactive Transcript Editor**: Full inline editor with debounced autosave (2s delay) and a 5-version history restoration dropdown.
- **📥 On-Demand Multi-Format Exports**: Download transcripts and summaries as **TXT, PDF, DOCX, SRT, or VTT** files. All files are generated serverless on-demand and streamed to your browser—saving cloud storage costs.
- **🔍 Full-Text GIN Index Search**: Powerful, lightning-fast PostgreSQL full-text search across transcript titles and content with dynamic highlighted excerpts.
- **🌗 Harmonious Dark/Light Mode**: Sleek, premium user interface utilizing Satoshi typography, styled in a refined black-and-yellow palette.

---

## 🏗️ Architecture & Cost Optimization ($0/Month Forever)

VoiceScribe uses a single-app, serverless architecture designed to run completely on **free tiers** with zero hosting or computing costs:

```
                  [ Web Browser (Next.js SPA) ]
                                |
                   [ Next.js App on Vercel ]
                    /           |           \
     [ Supabase Backend ]   [ Groq Cloud API ]   [ Fallback APIs ]
      |-- PostgreSQL DB      |-- Whisper STT      |-- Gladia
      |-- User Auth          |-- LLaMA 3.3 70b    |-- AssemblyAI
      |-- Storage Bucket     (Free, Zero Cost)    |-- Deepgram
```

### 💸 Free Tier Math & Quota Room
| Service | Free Tier Limit | VoiceScribe Daily Usage | % Quota Used |
|---|---|---|---|
| **Groq Whisper** | 28,800 secs/day (8 hrs) | ~1,800 secs (30 mins) | **6.25%** |
| **Groq LLaMA** | 14,400 requests/day | ~50 requests | **0.34%** |
| **Supabase DB** | 500 MB database | ~30 KB per transcript | **0.60% / year** |
| **Supabase Storage** | 1 GB storage | **0 MB** (media auto-deleted) | **0.00%** |
| **Vercel** | 100 GB bandwidth/month | < 1 GB/month | **< 1.00%** |

---

## 🛠️ Database Schema

The platform relies on 5 primary tables:
1. `profiles`: Manages user metadata, theme preferences, onboarding state, and the customized `brand_voice` style instructions.
2. `transcripts`: Tracks active transcript details, duration, language, and status.
3. `transcript_versions`: Stores versioned content and JSONB timestamped transcript segments (up to 5 versions are kept).
4. `ai_outputs`: Caches post-processed content (e.g., blog posts, TikTok captions) so you never waste API tokens repeating requests.
5. `processing_jobs`: Tracks asynchronous transcription jobs and provider fallback details.

---

## ⚙️ Getting Started (Local Development)

### Prerequisites
- Node.js (v20+ recommended)
- A free [Supabase](https://supabase.com) account
- A free [Groq Cloud API Key](https://console.groq.com)

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/your-username/voicescribe.git
cd voicescribe
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory and populate it with your credentials:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Transcription & Post-Processing (Groq)
GROQ_API_KEY=gsk_your_groq_api_key

# Fallback Transcription API Keys (Optional but Recommended)
GLADIA_API_KEY=your-gladia-key
ASSEMBLY_API_KEY=your-assembly-key
DEEPGRAM_API_KEY=your-deepgram-key
```

### 3. Database Migration Setup
Initialize your database schema by executing the SQL migrations found under `supabase/migrations/` in order (001 through 012) using the Supabase SQL editor:
- *Note*: Ensure migration `012_add_brand_voice_to_profiles.sql` is run, which appends the `brand_voice` column to the `profiles` table.

```sql
-- Migration 012: Add brand_voice column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brand_voice TEXT DEFAULT NULL
  CHECK (char_length(brand_voice) <= 500);
```

### 4. Running the Dev Server
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment (Vercel)

Deploying VoiceScribe is streamlined via Vercel:
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Configure all environment variables in Vercel's project settings matching `.env.local`.
3. Set the build command as `npm run build` and install settings.
4. Go live instantly.

---

## 📝 License
This project is licensed under the MIT License.
