import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
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
    
    await connectDB();
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
// ==========================================
// POST: Generate a new AI plan using Gemini
// ==========================================
// ==========================================
// POST: Generate a new AI plan using Gemini (WITH AUTO-RETRY)
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

    await connectDB();

    // Derive AI language from the user's active locale stored in cookie
    const localeCode = cookieStore.get('preferredLocale')?.value || 'en';
    const aiLanguage = getAiLanguage(localeCode);

    // UPDATED PROMPT: Added strict Indian agriculture seasonality rules
    const prompt = `
      You are an expert Indian agronomist. 
      Create a practical, day-by-day crop lifecycle plan for farming ${cropName} in ${district}, ${state}.
      The start/sowing date is ${startDate}.
      
      CRITICAL INSTRUCTION 1: You MUST write the "title" and "description" entirely in the ${aiLanguage} language. Keep the JSON keys in English.
      
      CRITICAL INSTRUCTION 2 (SEASONALITY CHECK): 
      - India has 3 main crop seasons: Kharif (Monsoon), Rabi (Winter), and Zaid (Summer).
      - Evaluate if ${startDate} is a generally acceptable and standard time to plant ${cropName} in ${state}. 
      - If ${cropName} is a summer/Zaid crop (like watermelon, muskmelon, cucumber, okra/bhindi, summer moong, bottle gourd, etc.) and ${startDate} is in the summer/pre-monsoon (e.g., March, April, May), it IS the correct season.
      - If ${startDate} IS a suitable time to grow this crop, you MUST set "outOfSeasonWarning" strictly to null.
      - ONLY if ${startDate} is completely wrong for this crop (e.g., planting wheat in May, or planting Kharif rice in December), provide a brief warning string in "outOfSeasonWarning" explaining the best months to plant.

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

    // 🚀 BULLETPROOF RETRY LOGIC
    let aiText = "";
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        // First try the newest model, if it fails on attempt 3, fallback to the stable 1.5 model
        const modelName = attempts === maxRetries - 1 ? "gemini-1.5-flash" : "gemini-2.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent(prompt);
        aiText = result.response.text().trim();
        break; // If successful, exit the retry loop
        
      } catch (apiError: any) {
        attempts++;
        console.warn(`⚠️ Gemini API Attempt ${attempts} failed:`, apiError.message);
        
        if (attempts >= maxRetries) {
          throw new Error("Google AI servers are currently overloaded. Please try again in a few minutes.");
        }
        
        // Wait 1.5 seconds before retrying (Exponential Backoff approach)
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    let parsedData;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not find valid JSON in AI response.");
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON Parsing Error:", parseError, "AI Text:", aiText);
      return NextResponse.json({ success: false, error: "Failed to parse AI response. Please try again." }, { status: 500 });
    }
    const generatedTasks = parsedData.tasks || [];
    
    // Ensure "null" string is parsed as actual null if the AI makes a slight formatting mistake
    let warningText = parsedData.outOfSeasonWarning;
    if (warningText === "null" || warningText === "") {
        warningText = null;
    }

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
      outOfSeasonWarning: warningText, // Persistence 
      tasks: formattedTasks
    });

    await newActiveCrop.save();

    return NextResponse.json({ success: true, activeCrop: newActiveCrop, warning: warningText });
  } catch (error: any) {
    console.error("Gemini/DB Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate plan. Please try again." }, { status: 500 });
  }
}