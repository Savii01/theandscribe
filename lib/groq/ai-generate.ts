import Groq from 'groq-sdk';
import { buildPrompt, OutputType } from './prompts';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export type AIGenerateResult = {
  content: string;
  model: string;
  tokensUsed?: number;
};

/**
 * Generate AI content from a transcript using Groq LLaMA 3.3 70b.
 * Optionally inject a brand voice description to shape output tone/style.
 * Returns the generated text content.
 */
export async function generateWithGroq(
  transcriptText: string,
  outputType: OutputType,
  brandVoice?: string | null
): Promise<AIGenerateResult> {
  const prompt = buildPrompt(outputType, transcriptText, brandVoice);

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert content creator and analyst. Produce high-quality, accurate content based on the provided transcript. Be concise, clear, and professional.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 2048,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content ?? '';

  return {
    content,
    model: 'llama-3.3-70b-versatile',
    tokensUsed: response.usage?.total_tokens,
  };
}
