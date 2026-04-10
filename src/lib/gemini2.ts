import OpenAI from 'openai';

// 🚀 Pointing to GitHub Models using GITHUB_TOKEN3
const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN3 || "dummy_key_to_bypass_vercel_build", 
});

export interface AdviceParams {
  crop: string;
  location?: string;
  weather?: string;
  soil?: string;
  language?: string;
}

export async function generateCropAdvice(params: AdviceParams) {
  const { 
    crop, location = 'Unknown', weather = 'Unknown', soil = 'Unknown', language = 'English' 
  } = params;

  const prompt = `
    Provide actionable farming advice for growing ${crop}.
    Conditions: Location: ${location}, Weather: ${weather}, Soil Type: ${soil}
    Write strictly in ${language}.
    
    Format EXACTLY as this JSON object:
    {
      "summary": "[Short summary in ${language}]",
      "healthScore": [Number 0-100],
      "recommendations": ["[Tip 1]", "[Tip 2]", "[Tip 3]"],
      "risks": ["[Risk 1]", "[Risk 2]"]
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // 🚀 Upgraded to GPT-5!
      messages: [
        { role: "system", content: "You are KrishiMitra, an expert AI. Always output valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3 // Keeping temperature low for factual farming accuracy
    });
    
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("OpenAI GPT-5 Advice Error:", error);
    throw new Error("Failed to generate AI advice");
  }
}