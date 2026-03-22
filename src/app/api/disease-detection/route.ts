

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectDB } from '@/lib/mongodb'; // Added
import { Scan } from '@/models'; // Added

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { imageUrl, imageBase64, audioBase64, audioMimeType, language } = await req.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    let finalBase64Image = imageBase64;
    let imageMimeType = 'image/jpeg';
    if (imageUrl) {
      const imageResp = await fetch(imageUrl);
      const arrayBuffer = await imageResp.arrayBuffer();
      finalBase64Image = Buffer.from(arrayBuffer).toString('base64');
      imageMimeType = imageResp.headers.get('content-type') || 'image/jpeg';
    } else if (finalBase64Image) {
      // FOOLPROOF STRIP: Grab everything after the comma
      finalBase64Image = finalBase64Image.substring(finalBase64Image.indexOf(',') + 1);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert agricultural plant pathologist. 
      Look at this image of a plant leaf. If the user has provided an audio question, listen to it carefully and address their specific concern. If there is no audio, just do a general analysis.

      CRITICAL INSTRUCTION: 
      You MUST write all of your analysis, explanations, and solutions strictly in ${language || 'English'}.

      Return a raw JSON object where the KEYS remain in English exactly as shown below. 
      Do NOT wrap the response in markdown blocks like \`\`\`json.

      Structure:
      {
        "disease": "[Write the disease name or 'Healthy Crop' in ${language || 'English'}]",
        "confidence": [A number between 0.0 and 1.0],
        "harm": "[Write a 2-3 sentence explanation of the threat/harm in ${language || 'English'}]",
        "solutions": [
          "[Solution step 1 in ${language || 'English'}]",
          "[Solution step 2 in ${language || 'English'}]"
        ]
      }
    `;

    // Construct the payload dynamically
    const payloadParts: any[] = [
      prompt,
      {
        inlineData: {
          data: finalBase64Image,
          mimeType: imageMimeType,
        },
      },
    ];

    // If the user spoke, clean the audio base64 and attach it
    if (audioBase64) {
      const cleanAudioBase64 = audioBase64.substring(audioBase64.indexOf(',') + 1);
      const cleanMimeType = audioMimeType ? audioMimeType.split(';')[0] : 'audio/webm';

      payloadParts.push({
        inlineData: {
          data: cleanAudioBase64,
          mimeType: cleanMimeType,
        },
      });
    }

    const result = await model.generateContent(payloadParts);
    const responseText = result.response.text();

    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const analysisData = JSON.parse(cleanedText);


    try {
      await connectDB();
      await Scan.create({
        disease: analysisData.disease,
        confidence: analysisData.confidence,
        language: language || 'English',
        hasAudio: !!audioBase64
        // Note: If you have a logged-in user system, you can pass userId: decodedToken.id here too!
      });
    } catch (dbErr) {
      // We log the error but don't fail the user's scan just because the analytics save failed
      console.error("Failed to save scan telemetry to database:", dbErr);
    }

    return NextResponse.json({ success: true, analysis: analysisData }, { status: 200 });

  } catch (error: any) {
    console.error("AI Disease Detection Error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image and audio' }, 
      { status: 500 }
    );
  }
}