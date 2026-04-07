import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EXTRACTION_PROMPT = `You are a soil health card data extraction expert.

Analyze this image of an Indian Soil Health Card (Mitti Parikshan Card / मिट्टी स्वास्थ्य कार्ड).

Extract the following values from the card. Return ONLY a valid JSON object with these fields:
{
  "ph": <number or null>,
  "moisture": <number or null>,
  "n": <number in kg/ha or null>,
  "p": <number in kg/ha or null>,
  "k": <number in kg/ha or null>,
  "ec": <number in dS/m or null>,
  "organicCarbon": <number in % or null>
}

Rules:
- Extract only numeric values. If a value is not clearly readable, set it to null.
- For N, P, K values, report in kg/ha.
- For EC, report in dS/m.
- For Organic Carbon, report as percentage.
- If the image is not a soil health card, return all null values.
- Return ONLY the JSON object, no other text.`;

async function extractWithGeminiVision(imageUrl: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to fetch image');

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
    ]);

    const text = result.response.text().trim();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const values = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      values: {
        ph: typeof values.ph === 'number' ? values.ph : null,
        moisture: typeof values.moisture === 'number' ? values.moisture : null,
        n: typeof values.n === 'number' ? values.n : null,
        p: typeof values.p === 'number' ? values.p : null,
        k: typeof values.k === 'number' ? values.k : null,
        ec: typeof values.ec === 'number' ? values.ec : null,
        organicCarbon: typeof values.organicCarbon === 'number' ? values.organicCarbon : null,
      },
    };
  } catch (error) {
    console.error('Gemini Vision OCR error:', error);
    return { success: false, values: null, error: String(error) };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required for OCR.' },
        { status: 400 }
      );
    }

    const result = await extractWithGeminiVision(body.imageUrl);

    if (!result.success || !result.values) {
      return NextResponse.json(
        {
          success: false,
          error: 'OCR extraction failed. Please try a clearer image or enter values manually.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      values: result.values,
    });
  } catch (error) {
    console.error('Soil OCR Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
