import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateCropAdvice(params: {
  crop: string;
  location: string;
  weather: string;
  soil: string;
  language: string;
}) {
  const { crop, location, weather, soil, language } = params;

  const prompt = `
    Provide farming advice for ${crop} in ${location}.
    Weather: ${weather}
    Soil: ${soil}
    Language: ${language}
    Please respond in ${language}.
  `;

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      if (error.status === 503 && attempt < maxRetries) {
        const delayMs = Math.pow(3, attempt) * 500; // 1.5s, 4.5s, 13.5s
        console.warn(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else if (attempt === maxRetries) {
        // Return cached/default advice instead of crashing
        return `Sorry, AI service is temporarily unavailable. Please try again in a few minutes.`;
      } else {
        throw error;
      }
    }
  }
}

export async function generateSoilReportAI(
  farmData: any,
  soilData: any,
  language: string = "English"
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const currentMonth = new Date().toLocaleString("en-US", { month: "long" });

  const prompt = `
You are an expert Indian agronomist, but you are speaking directly to a farmer.
Your task is to analyze the provided farm and soil data and generate a comprehensive, highly actionable 'Soil Profile & Report'.
CRITICAL: You must write in extremely simple, easy-to-understand language. Avoid all complex scientific jargon. Explain things as if you are talking to a farmer who does not have formal scientific training. 

FARM DATA:
- Name: ${farmData.landName}
- Location: ${farmData.location?.district || "Unknown"}, ${
    farmData.location?.state || "Unknown"
  }
- Area: ${farmData.areaAcres || "Unknown"} acres
- Main Soil Type: ${farmData.soilType || "Unknown"}

SOIL PARAMETERS:
- pH: ${soilData.ph !== null ? soilData.ph : "Not provided"}
- Moisture: ${
    soilData.moisture !== null ? soilData.moisture + "%" : "Not provided"
  }
- Nitrogen (N): ${soilData.n !== null ? soilData.n + " kg/ha" : "Not provided"}
- Phosphorus (P): ${
    soilData.p !== null ? soilData.p + " kg/ha" : "Not provided"
  }
- Potassium (K): ${soilData.k !== null ? soilData.k + " kg/ha" : "Not provided"}
- Electrical Conductivity (EC): ${
    soilData.ec !== null ? soilData.ec + " dS/m" : "Not provided"
  }
- Organic Carbon (OC): ${
    soilData.organicCarbon !== null
      ? soilData.organicCarbon + "%"
      : "Not provided"
  }

CONTEXT:
- The current month is ${currentMonth}. Keep your crop recommendations completely specific to crops that can be planted in the upcoming season in the given Indian state based on this month.
- Target language: ${language} (ALL text outputs must be strictly in this language). Do not use English if another language is requested.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema exactly. Remove any markdown styling like \`\`\`json. DO NOT output anything else.

{
  "score": <number 0-100 indicating overall soil health>,
  "rating": "<string: Excellent | Good | Moderate | Needs Improvement | Critical>",
  "summary": "<string: 1 short paragraph summarizing the farm's soil capacity and major limitations>",
  "insights": [
    "<string: interesting highly specific observation 1>",
    "<string: observation 2>"
  ],
  "issues": [
    {
      "parameter": "<string: e.g. Nitrogen, pH, Salinity>",
      "severity": "<string: critical | warning | info>",
      "description": "<string: brief description of issue>",
      "fix": "<string: actionable remedy using local Indian farming methods/fertilizers>"
    }
  ],
  "cropRecommendations": [
    {
      "cropName": "<string: specific crop name suited for upcoming season>",
      "confidence": <number 0-100>,
      "reason": "<string: why this crop fits the soil and season>",
      "season": "<string: e.g. Rabi, Kharif, Zaid>"
    } // provide up to 4 recommendations
  ],
  "fertilizerSchedule": [
    {
      "stage": "<string: timeline e.g. Pre-sowing, Basal, Tillering>",
      "instructions": "<string: exact practical instructions based on the NPK values>"
    }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/^\`\`\`json\s*/, "").replace(/\s*\`\`\`$/, "");
    return JSON.parse(text);
  } catch (err) {
    console.error("AI Generation Parsing Error:", err);
    throw new Error("Failed to generate AI report");
  }
}
