import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const ML_SERVER_URL = process.env.ML_API_URL_MANDI || '';

    const response = await fetch(ML_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ML_API_KEY_MANDI || '', 
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`ML Model responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error: any) {
    console.error("AI Prediction Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to generate prediction.' }, { status: 500 });
  }
}