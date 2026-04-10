import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { ActiveCrop, User } from '@/models';
import { verifyToken } from '@/lib/auth';
import OpenAI from 'openai';
import { cookies } from 'next/headers';

// 1. Initialize OpenAI pointing to GitHub Models
const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN2, 
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decoded: any = token ? verifyToken(token) : null;

    const { message } = await req.json();
    let systemContext = "You are KrishiMitra, an expert AI farming assistant. Respond helpfully, clearly, and concisely to the farmer.";

    // 🧠 AI AWARENESS LOGIC
    if (decoded) {
      await mongoose.connect(process.env.MONGODB_URI || '');
      const user = await User.findById(decoded.userId);
      const activeCrop = await ActiveCrop.findOne({ userId: decoded.userId, status: 'Active' });

      if (activeCrop && user) {
        const missedTasks = activeCrop.tasks.filter((t: any) => 
          !t.isCompleted && new Date(t.scheduledDate) < new Date()
        );

        systemContext += `\n\nContext: The user (${user.name}) is currently growing ${activeCrop.cropName}.`;
        
        if (missedTasks.length > 0) {
          const taskNames = missedTasks.map((t: any) => t.title).join(', ');
          systemContext += `\nCRITICAL INSTRUCTION: The user has missed these scheduled tasks: ${taskNames}. Before answering their question, gently but firmly remind them that they skipped these tasks and need to complete them urgently for a healthy yield.`;
        }
      }
    }

    // 2. Call GitHub Models using o3-mini
    const response = await openai.chat.completions.create({
      model: "o3-mini", // 🚀 Switched to o3-mini
      messages: [
        // ⚠️ For o3 models, 'system' is replaced by 'developer'
        { role: "developer", content: systemContext }, 
        { role: "user", content: message }
      ]
      // ⚠️ Temperature is intentionally removed because o3 models do not support it!
    });

    const reply = response.choices[0].message.content;

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Chat API Error:", error.message);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}