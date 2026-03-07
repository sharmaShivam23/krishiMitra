import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateCropAdvice(data: any) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `
You are an agriculture expert.

Crop: ${data.crop}
Location: ${data.location}
Weather: ${data.weather}
Soil: ${data.soil}

Give short farming recommendations in bullet points.
Use simple language that is easy for farmers to understand.
IMPORTANT: You MUST write your entire response strictly in ${data.language || 'English'}. Do not use English if another language is requested.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}