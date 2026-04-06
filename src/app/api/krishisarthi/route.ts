import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
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

interface MandiIntent {
  intent: 'mandi' | 'weather' | 'schemes' | 'disease' | 'community' | 'general';
  state?: string;
  district?: string;
  commodity?: string;
  market?: string;
}

interface KrishiSarthiResponse {
  success: boolean;
  reply: string;
  actionPath?: string;
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

const safeJsonParse = (raw: string): MandiIntent | null => {
  if (!raw) return null;
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned) as MandiIntent;
  } catch {
    return null;
  }
};

const safeJsonParseArray = (raw: string): unknown[] | null => {
  if (!raw) return null;
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const getOrigin = (request: Request) => {
  try {
    return new URL(request.url).origin;
  } catch {
    return '';
  }
};

const getAuthUser = async (request: Request) => {
  let token = '';
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value || '';
  }

  if (!token) return null;
  const decoded = verifyToken(token) as { userId?: string } | null;
  if (!decoded?.userId) return null;
  const user = await User.findById(decoded.userId).select('-password');
  if (!user) return null;
  return { userId: decoded.userId, user };
};

const formatMandiFallback = (language: string) => {
  if (language === 'English') {
    return 'Which state and commodity should I check mandi prices for? You can also add district.';
  }
  if (language === 'Punjabi') {
    return 'ਕਿਹੜੇ ਸੂਬੇ ਅਤੇ ਫਸਲ ਲਈ ਮੰਡੀ ਭਾਵ ਵੇਖਾਂ? ਜ਼ਿਲ੍ਹਾ ਵੀ ਦੱਸ ਸਕਦੇ ਹੋ।';
  }
  return 'किस राज्य और फसल के लिए मंडी भाव देखें? आप जिला भी बता सकते हैं।';
};

const shouldUseSchemesIntent = (message: string, intentData: MandiIntent | null) => {
  const lower = message.toLowerCase();
  const keywordMatch = /scheme|schemes|yojana|योजना|yojanaye|subsidy|subsidies|govt scheme|government scheme/.test(lower);
  return intentData?.intent === 'schemes' || keywordMatch;
};

const shouldUseMandiIntent = (message: string, intentData: MandiIntent | null) => {
  const lower = message.toLowerCase();
  const keywordMatch = /mandi|mandi price|market price|bhav|भाव|rate|price|मंडी|बाज़ार|बाजार/.test(lower);
  const hasSlots = Boolean(intentData?.state || intentData?.district || intentData?.commodity || intentData?.market);
  return keywordMatch || hasSlots;
};

const COMMON_STATES = [
  'Uttar Pradesh', 'Punjab', 'Haryana', 'Maharashtra', 'Madhya Pradesh',
  'Gujarat', 'Rajasthan', 'Karnataka', 'Andhra Pradesh', 'West Bengal',
  'Bihar', 'Kerala', 'Tamil Nadu'
];

const STATE_ALIASES: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Uttar Pradesh', pattern: /uttar\s*pradesh|utter\s*pradesh|u\.?p\.?/i },
  { name: 'Madhya Pradesh', pattern: /madhya\s*pradesh|m\.?p\.?/i },
  { name: 'Andhra Pradesh', pattern: /andhra\s*pradesh|a\.?p\.?/i }
];

const COMMON_COMMODITIES = [
  'Wheat', 'Paddy', 'Paddy(Dhan)', 'Potato', 'Onion', 'Tomato', 'Mustard',
  'Cotton', 'Sugarcane', 'Soyabean', 'Maize', 'Apple'
];

const findListMatch = (text: string, list: string[]) => {
  const lower = text.toLowerCase();
  return list.find((item) => lower.includes(item.toLowerCase()));
};

const findStateMatch = (text: string) => {
  for (const alias of STATE_ALIASES) {
    if (alias.pattern.test(text)) return alias.name;
  }
  return findListMatch(text, COMMON_STATES);
};

export async function POST(request: Request) {
  let locale = 'hi';

  try {
    await connectDB();
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

    const authUser = await getAuthUser(request);
    const userProfile = authUser?.user;

    const normalizedHistory = history
      .filter((item) => item && typeof item.content === 'string' && (item.role === 'user' || item.role === 'assistant'))
      .slice(-8)
      .map((item) => `${item.role === 'user' ? 'Farmer' : 'KrishiSarthi'}: ${item.content}`)
      .join('\n');

    const intentPrompt = `
  Extract the user's intent and slots as JSON only.
  Allowed intents: mandi, weather, schemes, disease, community, general.
  Return JSON with keys: intent, state, district, commodity, market.
  Use intent=mandi ONLY if the user explicitly asks for mandi/market prices or provides mandi filters.
  If not present, use null or omit.
  User message: ${message}
  `;

    const intentResult = await model.generateContent(intentPrompt);
    const intentText = intentResult.response.text();
    const intentData = safeJsonParse(intentText);

    if (intentData?.intent === 'mandi' && shouldUseMandiIntent(message, intentData)) {
      const state = intentData.state?.trim();
      const commodity = intentData.commodity?.trim();
      const district = intentData.district?.trim();

      const historyText = history
        .filter((item) => item?.role === 'user' && typeof item.content === 'string')
        .map((item) => item.content)
        .join(' ');

      const resolvedState = state || findStateMatch(message) || findStateMatch(historyText) || userProfile?.state;
      const resolvedCommodity = commodity || findListMatch(message, COMMON_COMMODITIES) || findListMatch(historyText, COMMON_COMMODITIES);
      const resolvedDistrict = district || userProfile?.district;

      if (authUser?.userId) {
        const updateData: Record<string, unknown> = {
          lastLocale: locale,
          lastActiveModule: pageContext?.module,
          lastActiveRoute: pageContext?.route,
          lastContextSummary: pageContext?.summary,
          lastIntent: 'mandi',
          lastQuestion: message,
          lastSeenAt: new Date()
        };

        if (!userProfile?.state && resolvedState) updateData.state = resolvedState;
        if (!userProfile?.district && resolvedDistrict) updateData.district = resolvedDistrict;

        await User.updateOne({ _id: authUser.userId }, { $set: updateData });
      }

      if (!resolvedState || !resolvedCommodity) {
        return NextResponse.json({
          success: true,
          reply: formatMandiFallback(language)
        });
      }

      const origin = getOrigin(request);
      const params = new URLSearchParams();
      if (resolvedState) params.append('state', resolvedState);
      if (resolvedCommodity) params.append('commodity', resolvedCommodity);
      if (resolvedDistrict) params.append('district', resolvedDistrict);

      const mandiUrl = `${origin}/api/mandi${params.toString() ? `?${params.toString()}` : ''}`;
      const mandiResponse = await fetch(mandiUrl, { cache: 'no-store' });

      if (mandiResponse.ok) {
        const mandiData = await mandiResponse.json();
        const prices = Array.isArray(mandiData?.prices) ? mandiData.prices : [];

        if (prices.length === 0) {
          const noDataText = language === 'English'
            ? 'I could not find mandi prices for that selection. Please share state, district, and commodity.'
            : language === 'Punjabi'
              ? 'ਇਸ ਚੋਣ ਲਈ ਮੰਡੀ ਭਾਵ ਨਹੀਂ ਮਿਲੇ। ਰਾਜ, ਜ਼ਿਲ੍ਹਾ ਅਤੇ ਫਸਲ ਦੱਸੋ।'
              : 'उस चयन के लिए मंडी भाव नहीं मिले। राज्य, जिला और फसल बताएं।';

          return NextResponse.json({ success: true, reply: noDataText });
        }

        const topPrices = prices.slice(0, 6);
        const mandiSummaryPrompt = `
      You are KrishiSarthi. Respond in ${language} only.
      Summarize mandi prices using the data below. Be direct and data-first.

      Output format:
      1) A single-line heading: "Today's mandi prices" (localized language).
      2) 3-5 bullets. Each bullet must include:
         - Commodity
         - Market (district)
         - Modal price per quintal
         - Date
      3) Ask ONE short follow-up question only if state or commodity is missing.

      Rules:
      - Do NOT add advice, trends, or next steps unless the user asked.
      - Do NOT invent arrivals or quantities.
      - Keep under 110 words.

      Mandi data (JSON): ${JSON.stringify(topPrices)}
      `;

        const mandiSummary = await model.generateContent(mandiSummaryPrompt);
        const mandiReply = mandiSummary.response.text().trim();

        const mandiResponsePayload: KrishiSarthiResponse = {
          success: true,
          reply: mandiReply || fallbackByLocale[locale]?.retry || fallbackByLocale.hi.retry
        };

        return NextResponse.json(mandiResponsePayload);
      }
    }

    if (shouldUseSchemesIntent(message, intentData)) {
      if (authUser?.userId) {
        await User.updateOne(
          { _id: authUser.userId },
          {
            $set: {
              lastLocale: locale,
              lastActiveModule: pageContext?.module,
              lastActiveRoute: pageContext?.route,
              lastContextSummary: pageContext?.summary,
              lastIntent: 'schemes',
              lastQuestion: message,
              lastSeenAt: new Date()
            }
          }
        );
      }

      const origin = getOrigin(request);
      const schemesUrl = `${origin}/api/schemes?locale=${encodeURIComponent(locale)}`;
      const schemesResponse = await fetch(schemesUrl, { cache: 'no-store' });

      if (schemesResponse.ok) {
        const schemesData = await schemesResponse.json();
        const schemes = Array.isArray(schemesData?.schemes) ? schemesData.schemes : [];
        const sampleSchemes = schemes.slice(0, 30);

        const selectionPrompt = `
You are selecting relevant government schemes for a farmer. Return JSON only.
User message: ${message}
Return an array of up to 3 items with keys: name, state, benefits, eligibility, link.
Choose the most relevant schemes from the list below. If none match, return [].
Schemes list (JSON): ${JSON.stringify(sampleSchemes)}
`;

        const selectionResult = await model.generateContent(selectionPrompt);
        const selectedRaw = selectionResult.response.text();
        const selectedSchemes = safeJsonParseArray(selectedRaw) || [];

        if (selectedSchemes.length > 0) {
          const replyPrompt = `
You are KrishiSarthi. Respond in ${language} only.
Give a helpful, human reply with direct scheme info from the list below.
Rules:
- 2-4 short sentences.
- No markdown, no bold, no headings.
- Mention scheme name and 1 key benefit or eligibility.
- End with a short line inviting to open the schemes page.

Selected schemes (JSON): ${JSON.stringify(selectedSchemes)}
`;

          const replyResult = await model.generateContent(replyPrompt);
          const replyText = replyResult.response.text().trim();

          const schemesPayload: KrishiSarthiResponse = {
            success: true,
            reply: replyText || (fallbackByLocale[locale]?.retry || fallbackByLocale.hi.retry),
            actionPath: `/${locale}/dashboard/schemes`
          };

          return NextResponse.json(schemesPayload);
        }
      }

      const fallbackReply = language === 'English'
        ? 'Tell me your crop and state so I can surface the most relevant schemes. I can also open the schemes page for you.'
        : language === 'Punjabi'
          ? 'ਆਪਣੀ ਫਸਲ ਅਤੇ ਰਾਜ ਦੱਸੋ ਤਾਂ ਮੈਂ ਸਭ ਤੋਂ ਸਬੰਧਤ ਸਕੀਮਾਂ ਦੱਸ ਸਕਾਂ। ਮੈਂ ਸਕੀਮਾਂ ਵਾਲਾ ਪੰਨਾ ਵੀ ਖੋਲ ਸਕਦਾ ਹਾਂ।'
          : 'अपनी फसल और राज्य बताएं ताकि मैं सबसे ज़रूरी योजनाएं बता सकूं। मैं योजनाओं वाला पेज भी खोल सकता हूँ।';

      return NextResponse.json({
        success: true,
        reply: fallbackReply,
        actionPath: `/${locale}/dashboard/schemes`
      });
    }

        const contextBlock = pageContext
      ? `
Active app context:
- Module: ${pageContext.module || 'unknown'}
- Route: ${pageContext.route || 'unknown'}
- Context hint: ${pageContext.summary || 'none'}
`
      : '\nActive app context: not provided.\n';

        const userBlock = userProfile
      ? `
    Farmer profile (saved):
    - Name: ${userProfile.name || 'unknown'}
    - Role: ${userProfile.role || 'farmer'}
    - State: ${userProfile.state || 'unknown'}
    - District: ${userProfile.district || 'unknown'}
    - Preferred language: ${userProfile.preferredLanguage || 'hi'}
    `
      : '\nFarmer profile (saved): not available.\n';

    const prompt = `
  You are KrishiSarthi, an Indian farmer support AI assistant.
  Answer in ${language} only.

  Behavior rules:
  - Sound like a helpful human, not a checklist.
  - Use 2-4 short sentences or 2-3 simple bullets when needed.
  - Do not use Markdown formatting like **bold**, headings, or numbered lists.
  - Avoid jargon. If a technical term is needed, explain it in one short line.
  - If the user asks about mandi prices, collect state, district, and commodity if missing, then provide the prices directly.
  - If uncertain, ask one clear follow-up question.
  - Keep answer length concise (max 120 words).
  - Use active app context to give page-relevant guidance first. If context is disease page, prioritize symptom/photo/remedy guidance. If mandi page, prioritize rate/trend/sell timing guidance.

${contextBlock}

${userBlock}

Conversation so far:
${normalizedHistory || 'No previous context.'}

Farmer message: ${message}

Return plain text only.
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();

    if (authUser?.userId) {
      await User.updateOne(
        { _id: authUser.userId },
        {
          $set: {
            lastLocale: locale,
            lastActiveModule: pageContext?.module,
            lastActiveRoute: pageContext?.route,
            lastContextSummary: pageContext?.summary,
            lastIntent: intentData?.intent || 'general',
            lastQuestion: message,
            lastSeenAt: new Date()
          }
        }
      );
    }

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
