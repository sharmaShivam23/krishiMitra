import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getAiLanguage } from '@/lib/localeToLanguage';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Session invalid' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state') || 'India';
    const monthIndex = parseInt(searchParams.get('month') || new Date().getMonth().toString(), 10);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthStr = months[monthIndex] || months[new Date().getMonth()];

    // Derive AI language from the user's active locale stored in cookie
    const localeCode = cookieStore.get('preferredLocale')?.value || 'en';
    const aiLanguage = getAiLanguage(localeCode);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are an expert Indian agriculturist. Based on the current month (${monthStr}) and the location ${state}, India, 
      what are the top 5 BEST crops a farmer should start sowing/planting right now for maximum yield?
      
      CRITICAL INSTRUCTION: Provide the "name" and "shortReason" entirely in ${aiLanguage}. Keep the JSON keys in English.
      
      Output EXACTLY a raw JSON array of objects. DO NOT wrap the JSON in markdown blocks (like \`\`\`json). No introductory text.
      Format:
      [
        { "name": "Crop Name", "shortReason": "Brief reason why it's good to plant this month" }
      ]
    `;

    const result = await model.generateContent(prompt);
    let aiText = result.response.text().trim();
    
    // Safety cleaner for JSON parsing
    if (aiText.startsWith('```json')) {
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (aiText.startsWith('```')) {
        aiText = aiText.replace(/```/g, '').trim();
    }
    
    const recommendations = JSON.parse(aiText);

    return NextResponse.json({ success: true, recommendations });
  } catch (error: any) {
    console.error("Recommendations API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch recommendations." }, { status: 500 });
  }
}
