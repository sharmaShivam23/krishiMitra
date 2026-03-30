import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { ActiveCrop, User } from '@/models';
import { verifyToken } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cookies } from 'next/headers';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decoded: any = token ? verifyToken(token) : null;

    const { message } = await req.json();
    let systemContext = "You are KrishiMitra, an expert AI farming assistant.";

    // 🧠 AI AWARENESS LOGIC: Inject database state into the prompt!
    if (decoded) {
      await mongoose.connect(process.env.MONGODB_URI || '');
      const user = await User.findById(decoded.userId);
      const activeCrop = await ActiveCrop.findOne({ userId: decoded.userId, status: 'Active' });

      if (activeCrop) {
        // Find tasks that are NOT completed and their date has passed (Overdue)
        const missedTasks = activeCrop.tasks.filter((t: any) => 
          !t.isCompleted && new Date(t.scheduledDate) < new Date()
        );

        systemContext += `\nThe user (${user.name}) is currently growing ${activeCrop.cropName}. `;
        
        if (missedTasks.length > 0) {
          systemContext += `\nCRITICAL: The user has missed these tasks: ${missedTasks.map((t:any)=>t.title).join(', ')}. 
          Before answering their question, gently remind them they skipped this and need to do it urgently.`;
        }
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `${systemContext}\n\nFarmer: ${message}\nKrishiMitra:`;
    
    const result = await model.generateContent(prompt);
    return NextResponse.json({ reply: result.response.text() });

  } catch (error) {
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}