import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectDB } from '@/lib/mongodb'; 
import { Scan, User } from '@/models'; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { imageUrl, imageBase64, audioBase64, audioMimeType, language, userId } = await req.json();

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
      finalBase64Image = finalBase64Image.substring(finalBase64Image.indexOf(',') + 1);
    }

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

    const payloadParts: any[] = [
      prompt,
      { inlineData: { data: finalBase64Image, mimeType: imageMimeType } },
    ];

    if (audioBase64) {
      const cleanAudioBase64 = audioBase64.substring(audioBase64.indexOf(',') + 1);
      const cleanMimeType = audioMimeType ? audioMimeType.split(';')[0] : 'audio/webm';
      payloadParts.push({ inlineData: { data: cleanAudioBase64, mimeType: cleanMimeType } });
    }

    let analysisData;
    let isMockData = false;
    let attempts = 0;
    const maxRetries = 3;

    // 🚀 BULLETPROOF RETRY LOGIC FOR AI
    while (attempts < maxRetries) {
      try {
        const modelName = attempts === maxRetries - 1 ? "gemini-2.5-flash" : "gemini-2.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(payloadParts);
        const responseText = result.response.text();
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        analysisData = JSON.parse(cleanedText);
        break; // Success! Exit loop.
      } catch (apiError: any) {
        attempts++;
        console.warn(`⚠️ API Attempt ${attempts} failed:`, apiError.message);
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }

    // 🛡️ HACKATHON MOCK FALLBACK
    // If all 3 attempts failed (servers overloaded), use fake data so the presentation doesn't crash!
    if (!analysisData) {
      console.log("🚨 ALL AI ATTEMPTS FAILED. USING MOCK DATA FOR DEMO!");
      isMockData = true;
      analysisData = {
        disease: "Early Blight (Simulated)",
        confidence: 0.95,
        harm: "This is a simulated response due to high server traffic. Early blight causes brown spots on leaves and can reduce yield.",
        solutions: [
          "Apply a copper-based fungicide immediately.",
          "Ensure proper spacing between plants for airflow."
        ]
      };
    }

    // 3. 🚀 DATABASE & N8N OUTBREAK LOGIC
    let outbreakTriggered = false;

    try {
      await connectDB();
      
      // We only run the outbreak logic if the frontend sent us a userId
      if (userId) {
        const currentUser = await User.findById(userId);
        
        if (currentUser) {
          const userDistrict = currentUser.district;
          const severity = "HIGH"; // Forced to HIGH for testing

          // Save scan
          await Scan.create({
            userId: currentUser._id,
            disease: analysisData.disease,
            district: userDistrict,
            severity: severity,
            confidence: analysisData.confidence,
            language: language || 'English',
            hasAudio: !!audioBase64
          });

          // Check for outbreak
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
            console.log("🔥 CRITICAL OUTBREAK: Pinging n8n at", N8N_WEBHOOK_URL);

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
        }
      }
    } catch (dbErr) {
      console.error("Database or Webhook Error:", dbErr);
    }

    // 4. Return everything to frontend
    return NextResponse.json({ 
      success: true, 
      analysis: analysisData,
      outbreakTriggered: outbreakTriggered,
      isMockData: isMockData // Let the frontend know if it was faked
    }, { status: 200 });

  } catch (error: any) {
    console.error("Critical Route Error:", error);
    return NextResponse.json(
      { error: 'Failed to process request entirely.' }, 
      { status: 500 }
    );
  }
}