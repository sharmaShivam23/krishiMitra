import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface PageContextInput {
  module?: string;
  route?: string;
  summary?: string;
}

const localeLanguageMap: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  mr: 'Marathi',
  bn: 'Bengali',
  te: 'Telugu',
  ta: 'Tamil',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  or: 'Odia',
  ur: 'Urdu'
};

const fallbackByLocale: Record<string, { retry: string; error: string }> = {
  en: {
    retry: 'I am ready. Please ask your question again.',
    error: 'KrishiSarthi is facing a technical issue. Please try again.'
  },
  hi: {
    retry: 'मैं तैयार हूँ। कृपया अपना सवाल दोबारा बताएं।',
    error: 'KrishiSarthi अभी तकनीकी समस्या में है. कृपया दोबारा कोशिश करें।'
  },
  pa: {
    retry: 'ਮੈਂ ਤਿਆਰ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਸਵਾਲ ਦੁਬਾਰਾ ਦੱਸੋ।',
    error: 'KrishiSarthi ਨੂੰ ਤਕਨੀਕੀ ਸਮੱਸਿਆ ਆ ਰਹੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
  }
};

const normalizeLocale = (value: unknown): string => {
  const localeInput = typeof value === 'string' ? value.toLowerCase() : 'hi';
  return localeInput in localeLanguageMap ? localeInput : 'hi';
};

export async function POST(request: Request) {
  let locale = 'hi';

  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    locale = normalizeLocale(body?.locale);
    const history = Array.isArray(body?.history) ? (body.history as ChatHistoryItem[]) : [];
    const pageContext = (body?.pageContext && typeof body.pageContext === 'object')
      ? (body.pageContext as PageContextInput)
      : null;

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[KrishiSarthi] GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: fallbackByLocale[locale]?.error || fallbackByLocale.hi.error },
        { status: 500 }
      );
    }

    const language = localeLanguageMap[locale] || 'Hindi';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const normalizedHistory = history
      .filter((item) => item && typeof item.content === 'string' && (item.role === 'user' || item.role === 'assistant'))
      .slice(-8)
      .map((item) => `${item.role === 'user' ? 'Farmer' : 'KrishiSarthi'}: ${item.content}`)
      .join('\n');

    const contextBlock = pageContext
      ? `
Active app context:
- Module: ${pageContext.module || 'unknown'}
- Route: ${pageContext.route || 'unknown'}
- Context hint: ${pageContext.summary || 'none'}
`
      : '\nActive app context: not provided.\n';

    const prompt = `
You are KrishiSarthi, an Indian farmer support AI assistant.
Answer in ${language} only.

Behavior rules:
- Keep responses practical, simple, and action-oriented for low-literacy users.
- Prefer short bullets and very clear next steps.
- Avoid jargon. If a technical term is needed, explain it in one short line.
- If the user asks about mandi prices, weather, schemes, disease, or community, guide them clearly.
- If uncertain, say what information is missing and ask one clear follow-up question.
- Keep answer length concise (max 120 words).
- Use active app context to give page-relevant guidance first. If context is disease page, prioritize symptom/photo/remedy guidance. If mandi page, prioritize rate/trend/sell timing guidance.

${contextBlock}

Conversation so far:
${normalizedHistory || 'No previous context.'}

Farmer message: ${message}

Return plain text only.
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();

    return NextResponse.json({
      success: true,
      reply: reply || fallbackByLocale[locale]?.retry || fallbackByLocale.hi.retry
    });
  } catch (error) {
    console.error('KrishiSarthi chat error:', error);

    if (error instanceof Error && /api key|permission|quota|unauthorized/i.test(error.message)) {
      return NextResponse.json(
        {
          success: true,
          reply: fallbackByLocale[locale]?.retry || fallbackByLocale.hi.retry
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reply: fallbackByLocale[locale]?.error || fallbackByLocale.hi.error
      },
      { status: 200 }
    );
  }
}
