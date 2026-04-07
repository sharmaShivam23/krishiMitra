import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateCropAdvice(data: any) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

export async function generateSoilReportAI(farmData: any, soilData: any, language: string = 'English') {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

  const prompt = `
You are an expert Indian agronomist, but you are speaking directly to a farmer.
Your task is to analyze the provided farm and soil data and generate a comprehensive, highly actionable 'Soil Profile & Report'.
CRITICAL: You must write in extremely simple, easy-to-understand language. Avoid all complex scientific jargon. Explain things as if you are talking to a farmer who does not have formal scientific training. 

FARM DATA:
- Name: ${farmData.landName}
- Location: ${farmData.location?.district || 'Unknown'}, ${farmData.location?.state || 'Unknown'}
- Area: ${farmData.areaAcres || 'Unknown'} acres
- Main Soil Type: ${farmData.soilType || 'Unknown'}

SOIL PARAMETERS:
- pH: ${soilData.ph !== null ? soilData.ph : 'Not provided'}
- Moisture: ${soilData.moisture !== null ? soilData.moisture + '%' : 'Not provided'}
- Nitrogen (N): ${soilData.n !== null ? soilData.n + ' kg/ha' : 'Not provided'}
- Phosphorus (P): ${soilData.p !== null ? soilData.p + ' kg/ha' : 'Not provided'}
- Potassium (K): ${soilData.k !== null ? soilData.k + ' kg/ha' : 'Not provided'}
- Electrical Conductivity (EC): ${soilData.ec !== null ? soilData.ec + ' dS/m' : 'Not provided'}
- Organic Carbon (OC): ${soilData.organicCarbon !== null ? soilData.organicCarbon + '%' : 'Not provided'}

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
    text = text.replace(/^\`\`\`json\s*/, '').replace(/\s*\`\`\`$/, '');
    return JSON.parse(text);
  } catch (err) {
    console.error("AI Generation Parsing Error:", err);
    throw new Error('Failed to generate AI report');
  }
}