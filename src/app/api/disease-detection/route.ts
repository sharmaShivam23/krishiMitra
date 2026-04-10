import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { connectDB } from '@/lib/mongodb'; 
import { Scan, User } from '@/models'; 

// 1. Initialize the OpenAI Client pointing to GitHub Models
const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN, // Ensure this is in your .env file
});

export async function POST(req: Request) {
  try {
    const { imageUrl, imageBase64, audioBase64, language, userId } = await req.json();

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
      // Ensure clean base64 string without data URI prefix
      finalBase64Image = finalBase64Image.substring(finalBase64Image.indexOf(',') + 1);
    }

    const prompt = `
      You are an expert agricultural plant pathologist. 
      Look at this image of a plant leaf and perform a general disease analysis.

      CRITICAL INSTRUCTION: 
      You MUST write all of your analysis, explanations, and solutions strictly in ${language || 'English'}.

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

    let analysisData;
    let isMockData = false;
    let attempts = 0;
    const maxRetries = 3;

    // 🚀 BULLETPROOF RETRY LOGIC (OpenAI / GitHub Models)
    while (attempts < maxRetries) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // Using the powerful GPT-4o model available on GitHub Models
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that analyzes plant diseases and always outputs valid JSON."
            },
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${imageMimeType};base64,${finalBase64Image}`
                  }
                }
              ]
            }
          ],
          response_format: { type: "json_object" }, // Native strict JSON mode
          temperature: 0.2, // Low temperature for factual accuracy
        });

        const responseText = response.choices[0].message.content;
        
        if (responseText) {
          analysisData = JSON.parse(responseText);
          break; // Success! Exit loop.
        } else {
          throw new Error("Empty response from API");
        }
      } catch (apiError: any) {
        attempts++;
        console.warn(`⚠️ AI Attempt ${attempts} failed:`, apiError.message);
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }

    // 🛡️ HACKATHON MOCK FALLBACK (Guarantees the demo never crashes)
    if (!analysisData) {
      console.log("🚨 GITHUB MODELS OVERLOADED. USING MOCK DATA FOR PRESENTATION!");
      isMockData = true;
      analysisData = {
        disease: "Early Blight (Simulated)",
        confidence: 0.96,
        harm: "This disease causes brown spots with concentric rings on lower leaves. It spreads rapidly in warm, humid conditions and can destroy the crop yield.",
        solutions: [
          "Apply a copper-based fungicide spray immediately.",
          "Ensure proper spacing between plants to improve airflow and reduce humidity.",
          "Remove and burn infected lower leaves to stop the spread."
        ]
      };
    }

    // 🚀 DATABASE & N8N OUTBREAK LOGIC
    let outbreakTriggered = false;

    try {
      await connectDB();
      
      let userDistrict = "Ghaziabad"; 
      const severity = "HIGH"; 
      const finalUserId = userId || "507f191e810c19729de860ea";

      if (userId && userId.length === 24) {
        const currentUser = await User.findById(userId).catch(() => null);
        if (currentUser && currentUser.district) {
          userDistrict = currentUser.district;
        }
      }

      await Scan.create({
        userId: finalUserId,
        disease: analysisData.disease,
        district: userDistrict,
        severity: severity,
        confidence: analysisData.confidence,
        language: language || 'English',
        hasAudio: !!audioBase64 
      });

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentScansCount = await Scan.countDocuments({
        district: userDistrict,
        disease: analysisData.disease,
        createdAt: { $gte: sevenDaysAgo },
      });

      if (severity === "HIGH" || recentScansCount >= 3) {
        outbreakTriggered = true;
        
        const localFarmers = await User.find(
          { district: userDistrict },
          "name phone preferredLanguage"
        ).lean();

        const N8N_WEBHOOK_URL = "https://n8n.sharmashivam.me/webhook/edddd3d6-2f69-4f35-9e05-2037ee8484c5";
        console.log("🔥 Pinging n8n SMS Webhook at:", N8N_WEBHOOK_URL);

        try {
          await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              alertType: severity === "HIGH" ? "CRITICAL_DISEASE" : "OUTBREAK_DETECTED",
              disease: analysisData.disease,
              district: userDistrict,
              solution: analysisData.solutions ? analysisData.solutions.join(" ") : analysisData.harm,
              prevention: "Please check your crops immediately.",
              targetFarmers: localFarmers,
            }),
          });
          console.log("✅ Successfully triggered n8n webhook!");
        } catch (err) {
          console.error("❌ Failed to ping n8n:", err);
        }
      }
      
    } catch (dbErr) {
      console.error("Database/Webhook Error (Non-Fatal):", dbErr);
    }

    return NextResponse.json({ 
      success: true, 
      analysis: analysisData,
      outbreakTriggered: outbreakTriggered,
      isMockData: isMockData 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Critical Route Error:", error);
    return NextResponse.json(
      { error: 'Failed to process request entirely.' }, 
      { status: 500 }
    );
  }
}