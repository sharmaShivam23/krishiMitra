import { NextResponse } from 'next/server';

type SupportedLocale =
  | 'en' | 'hi' | 'bn' | 'kn' | 'ml' | 'mr' | 'or' | 'pa' | 'ta' | 'te' | 'gu'
  | 'as' | 'ur' | 'ne' | 'kok' | 'ks' | 'sd' | 'sa' | 'sat' | 'mni' | 'brx' | 'mai' | 'doi';

const localeToSttLanguageCode: Record<SupportedLocale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  or: 'od-IN',
  pa: 'pa-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  gu: 'gu-IN',
  as: 'as-IN',
  ur: 'ur-IN',
  ne: 'ne-IN',
  kok: 'kok-IN',
  ks: 'ks-IN',
  sd: 'sd-IN',
  sa: 'sa-IN',
  sat: 'sat-IN',
  mni: 'mni-IN',
  brx: 'brx-IN',
  mai: 'mai-IN',
  doi: 'doi-IN'
};

const normalizeLocale = (value: unknown): SupportedLocale | 'unknown' => {
  const localeInput = typeof value === 'string' ? value.toLowerCase() : 'unknown';
  return localeInput in localeToSttLanguageCode ? (localeInput as SupportedLocale) : 'unknown';
};

const sanitizeMimeType = (mimeType: string): string => {
  const baseType = (mimeType || '').toLowerCase().split(';')[0].trim();

  if (baseType === 'audio/webm' || baseType === 'video/webm') return 'audio/webm';
  if (baseType === 'audio/mp4' || baseType === 'audio/x-m4a') return 'audio/mp4';
  if (baseType === 'audio/mpeg' || baseType === 'audio/mp3') return 'audio/mpeg';
  if (baseType === 'audio/wav' || baseType === 'audio/x-wav') return 'audio/wav';
  if (baseType === 'audio/ogg' || baseType === 'audio/opus') return 'audio/ogg';

  return 'audio/webm';
};

const extensionFromMime = (mimeType: string): string => {
  if (mimeType === 'audio/mp4') return 'm4a';
  if (mimeType === 'audio/mpeg') return 'mp3';
  if (mimeType === 'audio/wav') return 'wav';
  if (mimeType === 'audio/ogg') return 'ogg';
  return 'webm';
};

export async function POST(req: Request) {
  try {
    const sarvamKey = process.env.SARVAM_API_KEY;
    if (!sarvamKey) {
      return NextResponse.json({ error: 'Speech service unavailable.' }, { status: 503 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const locale = normalizeLocale(formData.get('locale'));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
    }

    const normalizedMimeType = sanitizeMimeType(file.type);
    const audioBuffer = await file.arrayBuffer();
    const sanitizedFile = new File(
      [audioBuffer],
      `voice.${extensionFromMime(normalizedMimeType)}`,
      { type: normalizedMimeType }
    );

    const outbound = new FormData();
    outbound.append('file', sanitizedFile, sanitizedFile.name);
    outbound.append('model', 'saaras:v3');
    outbound.append('mode', 'transcribe');
    outbound.append('language_code', locale === 'unknown' ? 'unknown' : localeToSttLanguageCode[locale]);

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamKey
      },
      body: outbound
    });

    const data = await response.json();

    if (!response.ok) {
      const message = typeof data?.error?.message === 'string'
        ? data.error.message
        : 'Speech recognition failed.';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const transcript = typeof data?.transcript === 'string' ? data.transcript.trim() : '';
    return NextResponse.json({ success: true, transcript });
  } catch (error) {
    console.error('[Sarvam STT] Error:', error);
    return NextResponse.json({ error: 'Speech service unavailable.' }, { status: 500 });
  }
}
