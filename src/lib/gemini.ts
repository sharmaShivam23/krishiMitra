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

export async function generateSoilReportAI(
  farmlandInfo: {
    landName: string;
    location: string;
    areaAcres: number;
    soilType: string;
  },
  soilValues: {
    ph?: number;
    moisture?: number;
    n?: number;
    p?: number;
    k?: number;
    ec?: number;
    organicCarbon?: number;
  },
  language: string = "English"
) {
  const prompt = `
    Generate a comprehensive soil health report in ${language} for:
    
    **Farmland Details:**
    - Name: ${farmlandInfo.landName}
    - Location: ${farmlandInfo.location}
    - Area: ${farmlandInfo.areaAcres} acres
    - Soil Type: ${farmlandInfo.soilType}
    
    **Soil Test Values:**
    - pH: ${soilValues.ph ?? "Not measured"}
    - Moisture: ${soilValues.moisture ?? "Not measured"}%
    - Nitrogen (N): ${soilValues.n ?? "Not measured"} mg/kg
    - Phosphorus (P): ${soilValues.p ?? "Not measured"} mg/kg
    - Potassium (K): ${soilValues.k ?? "Not measured"} mg/kg
    - EC (Electrical Conductivity): ${soilValues.ec ?? "Not measured"} dS/m
    - Organic Carbon: ${soilValues.organicCarbon ?? "Not measured"}%
    
    Provide a JSON object with:
    - summary (string): Overall soil health assessment
    - healthScore (number 0-100): Overall soil health score
    - phStatus (string): pH interpretation and suitability
    - moistureStatus (string): Moisture level assessment
    - nutrientAnalysis (object): {n, p, k} with interpretations
    - recommendations (array): Actionable improvement steps
    - warnings (array): Critical issues to address
  `;

  const modelName = process.env.GENAI_MODEL || "gemini-2.5-flash";
  const maxRetries = 3;
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
        // Return structured fallback if not valid JSON
        return {
          summary: text.trim(),
          healthScore: 70,
          phStatus: `pH: ${soilValues.ph ?? "Not measured"}`,
          moistureStatus: `Moisture: ${soilValues.moisture ?? "Not measured"}%`,
          nutrientAnalysis: {
            n: `Nitrogen: ${soilValues.n ?? "Not measured"}`,
            p: `Phosphorus: ${soilValues.p ?? "Not measured"}`,
            k: `Potassium: ${soilValues.k ?? "Not measured"}`,
          },
          recommendations: [
            "Conduct soil testing for accurate nutrient levels",
            "Implement crop rotation",
          ],
          warnings: [],
        };
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? null;

      if (
        (status === 503 || /high demand/i.test(String(err?.message || ""))) &&
        attempt < maxRetries
      ) {
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(
          `Soil report attempt ${attempt} failed. Retrying in ${delayMs}ms...`
        );
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }

      console.warn(`Soil report attempt ${attempt} error:`, err);
      break;
    }
  }

  // Fallback response
  console.warn("Soil report AI unavailable — returning fallback.");
  return {
    summary: `Soil health report for ${farmlandInfo.landName} in ${
      farmlandInfo.location
    }. Based on available test data: pH ${
      soilValues.ph ?? "unknown"
    }, Moisture ${soilValues.moisture ?? "unknown"}%.`,
    healthScore: 65,
    phStatus: `pH level: ${soilValues.ph ?? "Not measured"}`,
    moistureStatus: `Soil moisture: ${soilValues.moisture ?? "Not measured"}%`,
    nutrientAnalysis: {
      n: `N: ${soilValues.n ?? "Not available"}`,
      p: `P: ${soilValues.p ?? "Not available"}`,
      k: `K: ${soilValues.k ?? "Not available"}`,
    },
    recommendations: [
      "Get comprehensive soil testing done through an accredited lab",
      "Based on results, apply targeted fertilizer amendments",
      "Maintain consistent irrigation to optimize soil moisture",
    ],
    warnings: ["Incomplete soil data — comprehensive testing recommended"],
  };
}
