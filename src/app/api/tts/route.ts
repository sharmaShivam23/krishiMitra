import { NextResponse } from 'next/server';

type SupportedLocale = 'en' | 'hi' | 'pa' | 'mr' | 'bn' | 'te' | 'ta' | 'gu' | 'kn' | 'ml' | 'or' | 'ur';

const localeToLanguageCode: Record<SupportedLocale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  or: 'or-IN',
  ur: 'ur-IN'
};

const localeToSpeaker: Record<SupportedLocale, string> = {
  en: 'shubh',
  hi: 'shubh',
  pa: 'simran',
  mr: 'shubh',
  bn: 'shubh',
  te: 'shubh',
  ta: 'shubh',
  gu: 'shubh',
  kn: 'shubh',
  ml: 'shubh',
  or: 'shubh',
  ur: 'shubh'
};

const normalizeLocale = (value: unknown): SupportedLocale => {
  const localeInput = typeof value === 'string' ? value.toLowerCase() : 'hi';
  return (localeInput in localeToLanguageCode ? localeInput : 'hi') as SupportedLocale;
};

export async function POST(request: Request) {
  try {
    const sarvamKey = process.env.SARVAM_API_KEY;
    if (!sarvamKey) {
      return NextResponse.json({ error: 'TTS service unavailable.' }, { status: 503 });
    }

    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const locale = normalizeLocale(body?.locale);

    if (!text) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        target_language_code: localeToLanguageCode[locale],
        model: 'bulbul:v3',
        speaker: localeToSpeaker[locale],
        pace: 1,
        speech_sample_rate: 24000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const message = typeof data?.error?.message === 'string'
        ? data.error.message
        : 'Failed to generate speech.';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const audioBase64 = Array.isArray(data?.audios) ? data.audios[0] : null;
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return NextResponse.json({ error: 'Invalid TTS response.' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      audioBase64,
      mimeType: 'audio/wav'
    });
  } catch (error) {
    console.error('[Sarvam TTS] Error:', error);
    return NextResponse.json({ error: 'TTS service unavailable.' }, { status: 500 });
  }
}
