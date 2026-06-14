export type OutputType =
  | 'summary_short'
  | 'summary_detailed'
  | 'summary_executive'
  | 'key_insights'
  | 'action_items'
  | 'chapters'
  | 'blog_post'
  | 'seo_article'
  | 'linkedin_post'
  | 'twitter_thread'
  | 'instagram_caption'
  | 'facebook_post'
  | 'study_notes'
  | 'meeting_notes'
  | 'research_notes';

export function buildPrompt(
  outputType: OutputType,
  transcript: string
): string {
  const prompts: Record<OutputType, string> = {

    summary_short: `
You are a professional summariser.
Read the transcript below and write a single clear paragraph
summary of 3-5 sentences. Capture the main topic, key points,
and any conclusions. Be concise and direct.
Do not include any preamble or labels — output only the summary.

TRANSCRIPT:
${transcript}
`.trim(),

    summary_detailed: `
You are a professional content summariser.
Read the transcript below and write a detailed structured summary.
Include: the main topic, key points discussed, supporting details,
any conclusions or outcomes, and important context.
Use clear paragraphs with natural flow. No bullet points.
Do not include any preamble — output only the summary.

TRANSCRIPT:
${transcript}
`.trim(),

    summary_executive: `
You are an executive communications specialist.
Read the transcript below and produce an executive summary
in bullet point format for a senior decision-maker who has
no time to read the full content.
Format:
- TOPIC: one sentence
- KEY POINTS: 3-5 bullets, each under 15 words
- OUTCOME: one sentence on the conclusion or next step
- ACTION REQUIRED: yes/no and what

Do not include preamble — output only the formatted summary.

TRANSCRIPT:
${transcript}
`.trim(),

    key_insights: `
You are an expert analyst.
Read the transcript below and extract the most valuable insights.
Return a JSON array of insight objects. Each object must have:
  - "insight": the key idea in one clear sentence
  - "quote": the most relevant direct quote from the transcript
    (under 25 words, verbatim from the text)
  - "category": one of "Main Idea", "Key Quote",
    "Important Detail", "Conclusion"

Return ONLY the JSON array. No explanation, no preamble.
Example format:
[
  {
    "insight": "Customer retention drives more revenue than acquisition",
    "quote": "keeping existing customers is five times cheaper than...",
    "category": "Key Quote"
  }
]

TRANSCRIPT:
${transcript}
`.trim(),

    action_items: `
You are a project management assistant.
Read the transcript below and extract all action items,
tasks, responsibilities, and deadlines mentioned.
Return a JSON array of action item objects. Each must have:
  - "task": what needs to be done (clear, specific)
  - "owner": person responsible if mentioned, else "Unassigned"
  - "deadline": deadline if mentioned, else null
  - "priority": "High", "Medium", or "Low" based on context

Return ONLY the JSON array. No explanation, no preamble.
If no action items exist, return an empty array [].

TRANSCRIPT:
${transcript}
`.trim(),

    chapters: `
You are a content organiser.
Read the transcript below and divide it into logical chapters
or topic sections based on the content flow.
Return a JSON array of chapter objects. Each must have:
  - "title": short chapter name (2-5 words)
  - "startTime": approximate start time in seconds (number)
  - "summary": one sentence describing what this section covers

Return ONLY the JSON array. No explanation, no preamble.
Aim for 3-8 chapters depending on content length.

TRANSCRIPT:
${transcript}
`.trim(),

    blog_post: `
You are an expert blog writer and content strategist.
Read the transcript below and transform it into a
well-structured, engaging blog article.

Requirements:
- Title: compelling, specific, under 65 characters
- Introduction: hook the reader in 2-3 sentences
- Body: 3-5 sections with clear subheadings (## format)
- Each section: 2-3 paragraphs of substance
- Conclusion: clear takeaway in 2-3 sentences
- Tone: professional but conversational
- Length: 600-900 words
- Do NOT use filler phrases or generic transitions
- Write for a reader who wants real value

Output the full article in markdown format.
Start directly with the title — no preamble.

TRANSCRIPT:
${transcript}
`.trim(),

    seo_article: `
You are an SEO content specialist.
Read the transcript below and write an SEO-optimised article.

Requirements:
- Title: include the main keyword naturally, under 60 characters
- Meta description: 150-160 chars summarising the article
  (label it "META:" on its own line before the article)
- Introduction: include the main keyword in first 100 words
- Body: 4-6 sections with keyword-rich subheadings (## format)
- Include natural keyword variations throughout
- Use short paragraphs (2-4 sentences max)
- Add a FAQ section at the end with 3 questions and answers
- Length: 800-1200 words
- Tone: authoritative, clear, helpful

Output in markdown. Start with META: then the article.

TRANSCRIPT:
${transcript}
`.trim(),

    linkedin_post: `
You are a LinkedIn content expert.
Read the transcript below and write a high-performing LinkedIn post.

Requirements:
- Hook: first line must stop scrolling — bold claim,
  surprising stat, or direct question (no "I" start)
- Body: 4-6 short punchy paragraphs, each 1-3 lines
- Use line breaks generously — no walls of text
- Include 1 personal insight or lesson learned
- End with a clear question to drive comments
- Add 3-5 relevant hashtags at the very end
- Tone: professional, authentic, direct
- Length: 150-250 words total
- No emojis

Output only the post text. No preamble.

TRANSCRIPT:
${transcript}
`.trim(),

    twitter_thread: `
You are a Twitter/X thread writer.
Read the transcript below and create an engaging thread.

Requirements:
- Tweet 1 (hook): bold statement or question under 200 chars
  End with "Thread 🧵" or "Here's what I learned 👇"
- Tweets 2-8: one insight per tweet, under 250 characters each
  Number them: "2/" "3/" etc
- Each tweet must stand alone and be shareable
- Last tweet: summary + call to action
  ("Follow for more" or "RT if this helped")
- Total: 7-10 tweets
- Tone: conversational, punchy, no fluff

Format each tweet on its own line prefixed with its number.
Output only the thread. No preamble.

TRANSCRIPT:
${transcript}
`.trim(),

    instagram_caption: `
You are an Instagram content creator.
Read the transcript below and write an engaging Instagram caption.

Requirements:
- Opening line: attention-grabbing, relatable, max 125 chars
  (this shows before "more" is clicked)
- Body: expand on the key message in 3-5 short paragraphs
- Include 1-2 relevant emojis per paragraph (natural, not forced)
- Call to action: ask a question or encourage engagement
- Line breaks: generous — every 1-2 sentences gets its own line
- Hashtags: 10-15 relevant hashtags at the end
  separated from caption by 3 line breaks
- Tone: authentic, warm, conversational
- Total length: 150-300 words before hashtags

Output only the caption. No preamble.

TRANSCRIPT:
${transcript}
`.trim(),

    facebook_post: `
You are a Facebook content writer.
Read the transcript below and write an engaging Facebook post.

Requirements:
- Opening: friendly hook — story, question, or bold statement
- Body: conversational, 3-5 paragraphs, warm tone
- Include personal angle or community connection
- End with a question to encourage comments
- Optional: 2-3 relevant emojis (natural placement)
- No hashtags (Facebook doesn't use them like Instagram)
- Tone: warm, personal, community-focused
- Length: 100-200 words

Output only the post. No preamble.

TRANSCRIPT:
${transcript}
`.trim(),

    study_notes: `
You are an expert academic note-taker.
Read the transcript below and produce structured study notes.

Format:
# [Topic Title]

## Key Concepts
- Bullet list of core ideas and definitions

## Main Points
Numbered list of the most important information to remember

## Details & Examples
- Supporting facts, examples, and explanations

## Summary
2-3 sentence recap of everything covered

## Potential Exam Questions
3-5 questions a student should be able to answer after studying

Use clear, concise language. Prioritise information by importance.
Output only the notes in markdown. No preamble.

TRANSCRIPT:
${transcript}
`.trim(),

    meeting_notes: `
You are a professional meeting notes writer.
Read the transcript below and produce clean meeting notes.

Format:
# Meeting Notes

**Date:** [extract if mentioned, else leave blank]
**Attendees:** [extract names if mentioned]
**Topic:** [main meeting subject]

## Summary
2-3 sentences covering what the meeting was about

## Key Discussion Points
- Bullet list of main topics discussed

## Decisions Made
- List any decisions that were agreed upon

## Action Items
| Task | Owner | Deadline |
|------|-------|----------|
| ...  | ...   | ...      |

## Next Steps
- What happens after this meeting

Use professional language. Be specific and factual.
Output only the notes in markdown. No preamble.

TRANSCRIPT:
${transcript}
`.trim(),

    research_notes: `
You are an academic research assistant.
Read the transcript below and produce structured research notes.

Format:
# Research Notes: [Topic]

## Research Question / Focus
What is being investigated or discussed

## Key Findings
Numbered list of the most significant findings or claims

## Evidence & Support
- Direct quotes or data points that support the findings
  (with approximate timestamp context if available)

## Methodology / Approach
How the topic was approached or studied (if mentioned)

## Gaps & Questions
- What is unclear, missing, or needs further investigation

## Citations to Follow Up
- Any sources, authors, or works mentioned

## Synthesis
2-3 sentences connecting the key ideas

Output only the notes in markdown. No preamble.

TRANSCRIPT:
${transcript}
`.trim(),

  };

  return prompts[outputType];
}

export const OUTPUT_TYPE_LABELS: Record<OutputType, string> = {
  summary_short:      'Short Summary',
  summary_detailed:   'Detailed Summary',
  summary_executive:  'Executive Summary',
  key_insights:       'Key Insights',
  action_items:       'Action Items',
  chapters:           'Chapters',
  blog_post:          'Blog Post',
  seo_article:        'SEO Article',
  linkedin_post:      'LinkedIn Post',
  twitter_thread:     'Twitter/X Thread',
  instagram_caption:  'Instagram Caption',
  facebook_post:      'Facebook Post',
  study_notes:        'Study Notes',
  meeting_notes:      'Meeting Notes',
  research_notes:     'Research Notes',
};

export const JSON_OUTPUT_TYPES: OutputType[] = [
  'key_insights',
  'action_items',
  'chapters',
];

export function isJsonOutputType(type: OutputType): boolean {
  return JSON_OUTPUT_TYPES.includes(type);
}
