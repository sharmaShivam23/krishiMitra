import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { ActiveCrop, User } from '@/models'; 
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyToken } from '@/lib/auth'; 
import { cookies } from 'next/headers'; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ==========================================
// GET: Fetch all active crops for the farmer
// ==========================================
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

    // Fetch the user to get their preferred language
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Map language codes to full names for the AI
    const languageMap: { [key: string]: string } = {
      'en': 'English', 'hi': 'Hindi', 'pa': 'Punjabi', 'mr': 'Marathi',
      'gu': 'Gujarati', 'ta': 'Tamil', 'te': 'Telugu', 'kn': 'Kannada'
    };
    const aiLanguage = languageMap[user.preferredLanguage || 'hi'] || 'Hindi';

    // Call Gemini with the localized prompt
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are an expert Indian agronomist. 
      Create a practical, day-by-day crop lifecycle plan for farming ${cropName} in ${district}, ${state}.
      The start/sowing date is ${startDate}.
      
      CRITICAL INSTRUCTION 1: You MUST write the "title" and "description" entirely in the ${aiLanguage} language. Keep the JSON keys in English.
      CRITICAL INSTRUCTION 2: Evaluate if the start date ${startDate} is the optimal season/month to start growing ${cropName} in ${state}. If it is NOT the optimal season, provide a warning in the "outOfSeasonWarning" field specifying which month(s) would be best for optimal growth. If it IS the right season, set "outOfSeasonWarning" to null.

      Output EXACTLY a raw JSON object. DO NOT wrap the JSON in markdown blocks (like \`\`\`json). No introductory text.
      
      Format exactly like this:
      {
        "outOfSeasonWarning": "Ideally, it is best to grow this in [Best Month(s)]. If you grow now, yield might decrease." or null,
        "tasks": [
          {
            "dayOffset": 0,
            "title": "Task title in ${aiLanguage}",
            "description": "Clear, practical farmer-friendly instruction in ${aiLanguage}",
            "priority": "high" 
          }
        ]
      }

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
    
    const parsedData = JSON.parse(aiText);
    const generatedTasks = parsedData.tasks || [];
    const warningText = parsedData.outOfSeasonWarning || null;

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

    return NextResponse.json({ success: true, activeCrop: newActiveCrop, warning: warningText });
  } catch (error: any) {
    console.error("Gemini/DB Error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate plan. Please try again." }, { status: 500 });
  }
}

// ==========================================
// DELETE: Remove an active crop plan
// ==========================================
export async function DELETE(req: Request) {
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
    
    const url = new URL(req.url);
    const cropId = url.searchParams.get('cropId');

    if (!cropId) {
      return NextResponse.json({ success: false, error: 'cropId is required' }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI || '');
    
    const deletedCrop = await ActiveCrop.findOneAndDelete({ _id: cropId, userId: decoded.userId });
    
    if (!deletedCrop) {
      return NextResponse.json({ success: false, error: 'Crop not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedCropId: cropId });
  } catch (error: any) {
    console.error("DELETE Crop Lifecycle Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}