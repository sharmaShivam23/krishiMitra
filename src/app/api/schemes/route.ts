import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Scheme } from '@/models';
import { GoogleGenerativeAI } from '@google/generative-ai';

type SupportedLocale = 'en' | 'hi' | 'pa' | 'mr' | 'bn' | 'te' | 'ta';

type SchemeItem = {
  _id?: unknown;
  name?: string;
  category?: string;
  state?: string;
  benefits?: string;
  eligibility?: string[];
  deadline?: string;
  link?: string;
  [key: string]: unknown;
};

const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta'];

const LOCALE_LANGUAGE_NAME: Record<SupportedLocale, string> = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  mr: 'Marathi',
  bn: 'Bengali',
  te: 'Telugu',
  ta: 'Tamil'
};

const normalizeLocale = (value: string | null): SupportedLocale => {
  const candidate = (value || 'en').toLowerCase().split('-')[0] as SupportedLocale;
  return SUPPORTED_LOCALES.includes(candidate) ? candidate : 'en';
};

const tryParseJsonArray = (rawText: string): unknown[] | null => {
  const trimmed = rawText.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i) || trimmed.match(/```\s*([\s\S]*?)\s*```/i);
    if (!fenced?.[1]) return null;
    try {
      const parsed = JSON.parse(fenced[1]);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
};

const translateSchemes = async (schemes: SchemeItem[], locale: SupportedLocale): Promise<SchemeItem[]> => {
  if (locale === 'en' || schemes.length === 0) return schemes;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return schemes;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const language = LOCALE_LANGUAGE_NAME[locale];

    const payload = schemes.map((scheme) => ({
      name: scheme.name || '',
      category: scheme.category || '',
      state: scheme.state || '',
      benefits: scheme.benefits || '',
      eligibility: Array.isArray(scheme.eligibility) ? scheme.eligibility : [],
      deadline: scheme.deadline || '',
      link: scheme.link || ''
    }));

    const prompt = `
You are a precise translator for Indian farmers.
Translate the following JSON array of government scheme objects into ${language}.

Rules:
1. Return ONLY a valid JSON array.
2. Keep array length and object order exactly the same.
3. Keep keys exactly same: name, category, state, benefits, eligibility, deadline, link.
4. Keep link value unchanged.
5. Keep numbers, dates, and acronyms (PM-KISAN, KCC) intact.
6. eligibility must remain an array of strings.
7. Do not add or remove fields.

Input JSON:
${JSON.stringify(payload)}
`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const translatedArray = tryParseJsonArray(raw);

    if (!translatedArray || translatedArray.length !== schemes.length) {
      return schemes;
    }

    return schemes.map((original, index) => {
      const translated = translatedArray[index] as Record<string, unknown>;
      return {
        ...original,
        name: typeof translated?.name === 'string' ? translated.name : original.name,
        category: typeof translated?.category === 'string' ? translated.category : original.category,
        state: typeof translated?.state === 'string' ? translated.state : original.state,
        benefits: typeof translated?.benefits === 'string' ? translated.benefits : original.benefits,
        eligibility: Array.isArray(translated?.eligibility)
          ? translated.eligibility.filter((item): item is string => typeof item === 'string')
          : (Array.isArray(original.eligibility) ? original.eligibility : []),
        deadline: typeof translated?.deadline === 'string' ? translated.deadline : original.deadline,
        link: typeof translated?.link === 'string' ? translated.link : original.link
      };
    });
  } catch (error) {
    console.error('[Schemes API] Translation failed:', error);
    return schemes;
  }
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const locale = normalizeLocale(request.nextUrl.searchParams.get('locale'));

    const schemes = await Scheme
      .find({})
      .sort({ createdAt: -1 })
      .lean<SchemeItem[]>();

    const localizedSchemes = await translateSchemes(schemes, locale);

    return NextResponse.json({
      success: true,
      count: localizedSchemes.length,
      schemes: localizedSchemes
    });

  } catch (error) {
    console.error("Failed to fetch schemes:", error);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}