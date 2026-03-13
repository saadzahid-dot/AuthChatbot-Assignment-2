import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { messages, provider = 'gemini' } = await request.json();

	let model;

	if (provider === 'gemini') {
		const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
		if (!apiKey) return new Response('Gemini API key not configured', { status: 503 });
		const google = createGoogleGenerativeAI({ apiKey });
		model = google('gemini-2.5-flash');
	} else {
		const apiKey = env.OPENAI_API_KEY;
		if (!apiKey) return new Response('OpenAI API key not configured', { status: 503 });
		const openai = createOpenAI({ apiKey });
		model = openai('gpt-5-mini-2025-08-07');
	}

	const result = streamText({
		model,
		system: `You are a helpful, friendly AI assistant. Follow these formatting rules strictly:

## Response Formatting
- Use proper **Markdown** for all responses.
- Keep responses concise, well-structured, and easy to read.

## Code
- Always wrap code in fenced code blocks with the language specified (e.g. \`\`\`python, \`\`\`javascript, \`\`\`sql).
- Use inline \`code\` for short references like variable names, commands, or file paths.
- Add brief comments in code when helpful.

## Tables
- When presenting tabular or comparative data, always use Markdown tables with proper headers and alignment.
- After every table, always include a short summary paragraph that highlights key takeaways or explains the data shown in the table. Never end a response immediately after a table.
- Example format:
  | Column 1 | Column 2 | Column 3 |
  |----------|----------|----------|
  | data     | data     | data     |

  As shown above, [brief explanation of the data].

## Lists & Structure
- Use bullet points or numbered lists for steps, options, or enumerations.
- Use headings (##, ###) to organize longer responses into sections.
- Use **bold** for emphasis and key terms.

## General
- Do not wrap entire responses in a code block.
- Respond directly without unnecessary preamble.`,
		messages
	});

	return result.toTextStreamResponse();
};
