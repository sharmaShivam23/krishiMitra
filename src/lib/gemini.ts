import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AdviceParams {
  crop: string;
  location?: string;
  weather?: string;
  soil?: string;
  language?: string;
}

export async function generateCropAdvice(params: {
  crop: string;
  location?: string;
  weather?: string;
  soil?: string;
  language?: string;
}) {
  const {
    crop,
    location = "your area",
    weather = "unknown",
    soil = "unknown",
    language = "English",
  } = params;

  const prompt = `
    Provide concise crop advice in ${language} for ${crop} in ${location}.
    Weather: ${weather}
    Soil: ${soil}

    Return a JSON object with keys:
    - summary (string)
    - healthScore (number, 0-100)
    - recommendations (array of strings)
    - risks (array of strings)
  `;

  const modelName = process.env.GENAI_MODEL || "gemini-2.5-flash";
  const maxRetries = 4;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch {
        return {
          summary: text.trim(),
          healthScore: 75,
          recommendations: [],
          risks: [],
        };
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.statusCode ?? null;

      if (
        (status === 503 || /high demand/i.test(String(err?.message || ""))) &&
        attempt < maxRetries
      ) {
        const delayMs = Math.min(60_000, Math.pow(2, attempt) * 1000);
        console.warn(
          `Gemini API attempt ${attempt} failed. Retrying in ${delayMs}ms...`
        );
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }

      console.warn(`Gemini API attempt ${attempt} error:`, err);
      break;
    }
  }

  console.warn("Gemini unavailable after retries — returning fallback advice.");
  return {
    summary: `(Fallback) Current conditions in ${location} are generally suitable for ${crop}.`,
    healthScore: 80,
    recommendations: [
      "Maintain regular irrigation based on short-term weather forecasts.",
      "Monitor for pests and diseases; apply targeted treatment if symptoms appear.",
      "Apply balanced NPK fertilizer following soil test recommendations.",
    ],
    risks: ["If humidity increases, watch for fungal disease risk."],
  };
}
