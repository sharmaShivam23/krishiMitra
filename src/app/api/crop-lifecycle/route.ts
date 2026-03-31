import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { ActiveCrop } from '@/models';
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
      return NextResponse.json({ success: false, error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    
    const decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Session invalid or expired. Please log in again.' }, { status: 401 });
    }
    
    await mongoose.connect(process.env.MONGODB_URI || '');
    const activeCrops = await ActiveCrop.find({ userId: decoded.userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, activeCrops });
  } catch (error: any) {
    console.error("GET Crop Lifecycle Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ==========================================
// POST: Generate a new AI plan using Gemini
// ==========================================
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Session invalid or expired. Please log in again.' }, { status: 401 });
    }
    
    const { cropName, startDate, state, district } = await req.json();

    await mongoose.connect(process.env.MONGODB_URI || '');

    // Derive AI language from the user's active locale stored in cookie
    const localeCode = cookieStore.get('preferredLocale')?.value || 'en';
    const aiLanguage = getAiLanguage(localeCode);

    // Call Gemini with the localized prompt
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are an expert Indian agronomist. 
      Create a practical, day-by-day crop lifecycle plan for farming ${cropName} in ${district}, ${state}.
      The start/sowing date is ${startDate}.

      CRITICAL INSTRUCTION: You MUST write the "title" and "description" entirely in the ${aiLanguage} language. Keep the JSON keys in English.

      Output EXACTLY a raw JSON array. DO NOT wrap the JSON in markdown blocks (like \`\`\`json). No introductory text.
      
      Format exactly like this:
      [
        {
          "dayOffset": 0,
          "title": "Task title in ${aiLanguage}",
          "description": "Clear, practical farmer-friendly instruction in ${aiLanguage}",
          "priority": "high" 
        }
      ]

      Include 10 to 15 critical stages: Land Preparation, Seed Treatment, Sowing, First Irrigation, Fertilization, Weed Control, Disease Check, and Harvesting. Use realistic day offsets. Priorities must be exactly "high", "medium", or "low".
    `;

    const result = await model.generateContent(prompt);
    let aiText = result.response.text().trim();
    
    // Safety cleaner for JSON parsing
    if (aiText.startsWith('```json')) {
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (aiText.startsWith('```')) {
        aiText = aiText.replace(/```/g, '').trim();
    }
    
    const generatedTasks = JSON.parse(aiText);

    // Calculate real dates
    const start = new Date(startDate);
    const formattedTasks = generatedTasks.map((task: any) => {
      const scheduledDate = new Date(start);
      scheduledDate.setDate(scheduledDate.getDate() + task.dayOffset);
      return { ...task, scheduledDate, isCompleted: false };
    });

    // Save to Database
    const newActiveCrop = new ActiveCrop({
      userId: decoded.userId, 
      cropName, 
      location: { state, district }, 
      startDate: start, 
      tasks: formattedTasks
    });

    await newActiveCrop.save();

    return NextResponse.json({ success: true, activeCrop: newActiveCrop });
  } catch (error: any) {
    console.error("Gemini/DB Error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate plan. Please try again." }, { status: 500 });
  }
}