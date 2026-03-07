// import { NextResponse } from 'next/server';
// import { verifyToken } from '@/lib/auth';
// import { cookies } from 'next/headers';
// import { GoogleGenerativeAI } from '@google/generative-ai';

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// export async function POST(req: Request) {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get('auth_token')?.value;

//     if (!token || !verifyToken(token)) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();
//     const { imageUrl } = body;

//     if (!imageUrl) {
//       return NextResponse.json({ error: "Image URL required" }, { status: 400 });
//     }

//     if (!process.env.GEMINI_API_KEY) {
//       throw new Error("GEMINI_API_KEY is missing in .env.local");
//     }

//     const imageResponse = await fetch(imageUrl);
//     if (!imageResponse.ok) {
//       throw new Error("Failed to fetch the uploaded image from Cloudinary.");
//     }
    
//     const arrayBuffer = await imageResponse.arrayBuffer();
//     const base64Image = Buffer.from(arrayBuffer).toString('base64');
//     const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

//     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

//     // 🚀 NEW PROMPT: Forces Gemini to explain the harm and provide an array of solutions
//     const prompt = `
//       You are an expert agronomist and botanist AI. Analyze the provided image of a crop leaf.
//       You must reply ONLY with a valid, raw JSON object. Do not include markdown tags like \`\`\`json.
//       The JSON object must strictly match this structure:
//       {
//         "disease": "Name of the disease (or 'Healthy Crop' if no pathogen is detected)",
//         "confidence": 0.98,
//         "harm": "Explain in 1-2 sentences exactly how this disease harms the plant (e.g., blocks photosynthesis, rots roots, causes yield loss). If the plant is healthy, state 'No harm detected. The crop is in optimal condition.'",
//         "solutions": [
//           "First highly actionable step (e.g., Specific fungicide to use)",
//           "Second highly actionable step (e.g., Pruning or watering changes)",
//           "Third highly actionable step (e.g., Future preventative measure)"
//         ]
//       }
//     `;

//     const imagePart = {
//       inlineData: {
//         data: base64Image,
//         mimeType: mimeType,
//       },
//     };

//     const result = await model.generateContent([prompt, imagePart]);
//     const responseText = result.response.text();
    
//     const cleanJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
//     const analysis = JSON.parse(cleanJsonString);

//     // Return the new detailed structure
//     return NextResponse.json({
//       success: true,
//       analysis: {
//         disease: analysis.disease,
//         confidence: analysis.confidence,
//         harm: analysis.harm,
//         solutions: analysis.solutions,
//       }
//     });

//   } catch (error: any) {
//     console.error("🚨 AI Route Error:", error);
//     return NextResponse.json(
//       { error: error.message || "AI processing failed. Please try a clearer image." },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    //  Extract the requested language from the frontend
    const { imageUrl, language } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
    }

    // Download the image from Cloudinary to send it to Gemini
    const imageResp = await fetch(imageUrl);
    const arrayBuffer = await imageResp.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

    // Use Gemini 1.5 Flash or Gemini 2.5 Flash for multimodal (image + text) tasks
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    //  The Multilingual Prompt
    const prompt = `
      You are an expert agricultural plant pathologist. Analyze this image of a plant leaf.
      Identify any diseases, pests, or deficiencies.

      CRITICAL INSTRUCTION: 
      You MUST write all of your analysis, explanations, and solutions strictly in ${language || 'English'}.
      Do not use English for the values if another language is requested.

      HOWEVER, you must return a raw JSON object where the KEYS remain in English exactly as shown below. 
      Do NOT wrap the response in markdown blocks like \`\`\`json. Just return the raw JSON.

      Structure:
      {
        "disease": "[Write the disease name or 'Healthy Crop' in ${language || 'English'}]",
        "confidence": [A number between 0.0 and 1.0 representing your confidence],
        "harm": "[Write a 2-3 sentence explanation of the threat/harm in ${language || 'English'}]",
        "solutions": [
          "[Solution step 1 in ${language || 'English'}]",
          "[Solution step 2 in ${language || 'English'}]",
          "[Solution step 3 in ${language || 'English'}]"
        ]
      }
    `;

    // Send the prompt and the image to Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const responseText = result.response.text();

    // Safely parse the JSON (removing any accidental markdown backticks Gemini might add)
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const analysisData = JSON.parse(cleanedText);

    return NextResponse.json({ success: true, analysis: analysisData }, { status: 200 });

  } catch (error: any) {
    console.error("AI Disease Detection Error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' }, 
      { status: 500 }
    );
  }
}