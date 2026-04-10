import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Crop } from "@/models";
import { generateCropAdvice } from "@/lib/gemini";

// Helper function to clean and parse AI response
const parseAIResponse = (text: string) => {
  try {
    // Remove markdown code blocks if present
    let cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Try to extract JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        data: parsed,
      };
    }

    return { success: false, data: null };
  } catch (err) {
    console.error("JSON Parse Error:", err);
    return { success: false, data: null };
  }
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const cropId = searchParams.get("id");

    // Get single crop
    if (cropId) {
      if (cropId.length !== 24) {
        return NextResponse.json(
          { success: false, message: "Invalid Crop ID format" },
          { status: 400 }
        );
      }

      const crop = await Crop.findById(cropId);
      if (!crop) {
        return NextResponse.json(
          { success: false, message: "Crop not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, crop });
    }

    // Search crops
    const query = search ? { name: { $regex: search, $options: "i" } } : {};
    const crops = await Crop.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, count: crops.length, crops });
  } catch (error) {
    console.error("GET Crop Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

/* ======================================================
   POST → Create Crop OR Generate Intelligence
====================================================== */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    /* ---------- MODE 1 : CREATE CROP (ADMIN) ---------- */
    if (body.mode === "create") {
      const crop = await Crop.create(body);
      return NextResponse.json({
        success: true,
        message: "Crop created",
        crop,
      });
    }

    /* ---------- MODE 2 : CROP INTELLIGENCE ---------- */
    if (body.mode === "intelligence") {
      const crop = await Crop.findOne({ name: body.crop });

      if (!crop) {
        return NextResponse.json(
          { success: false, message: "Crop not found in database" },
          { status: 404 }
        );
      }

      let advice;
      let isMockData = false;

      // 🛡️ HACKATHON SAFETY NET: Wrap AI call in try/catch with timeout
      try {
        const aiPromise = generateCropAdvice({
          crop: crop.name,
          location: body.location,
          weather: body.weather,
          soil: body.soil,
          language: body.language,
        });

        // Set 30 second timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI request timeout")), 30000)
        );

        const rawResponse = await Promise.race([aiPromise, timeoutPromise]);

        // Parse the response - handle both object and string responses
        if (typeof rawResponse === "string") {
          const parseResult = parseAIResponse(rawResponse);
          if (parseResult.success) {
            advice = parseResult.data;
          } else {
            throw new Error("Failed to parse AI response");
          }
        } else {
          advice = rawResponse;
        }

        // Ensure recommendations and risks are arrays of strings (remove markdown formatting if needed)
        if (advice.recommendations && Array.isArray(advice.recommendations)) {
          advice.recommendations = advice.recommendations.map((rec: string) =>
            rec.replace(/\*\*/g, "").trim()
          );
        }
        if (advice.risks && Array.isArray(advice.risks)) {
          advice.risks = advice.risks.map((risk: string) =>
            risk.replace(/\*\*/g, "").trim()
          );
        }
      } catch (aiError: any) {
        console.warn(
          "⚠️ Gemini AI Failed for Crop Advice. Using Mock Data!",
          aiError?.message
        );
        isMockData = true;

        advice = {
          summary: `(Simulated) The current conditions in ${
            body.location || "your area"
          } are optimal for ${
            crop.name
          }. Weather patterns and soil conditions appear favorable for healthy crop growth.`,
          healthScore: 80,
          recommendations: [
            "Soil Testing: Conduct comprehensive soil tests to determine pH, NPK, and micronutrient levels.",
            "Water Management: Monitor soil moisture closely and provide supplemental irrigation during dry spells.",
            "Nutrient Application: Apply balanced NPK fertilizers based on soil test results.",
            "Weed Control: Implement timely weed management to minimize competition.",
            "Pest & Disease Scouting: Regularly scout for common pests and diseases and take preventive measures.",
          ],
          risks: [
            "Nutrient Imbalance/Deficiency: Unknown soil type and fertility can impact growth and yield.",
            "Water Stress: Potential for drought stress if dry spells persist without irrigation.",
            "Weed Competition: Uncontrolled weeds can significantly reduce yields.",
            "Pest & Disease Outbreaks: Untreated pest pressure can lead to significant crop loss.",
          ],
        };
      }

      return NextResponse.json({
        success: true,
        crop,
        aiAdvice: advice,
        isMockData,
        message: isMockData
          ? "Using simulated advice - AI service temporarily unavailable"
          : "AI advice generated successfully",
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid mode" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST Crop Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

/* ======================================================
   PUT → Update Crop
====================================================== */
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.id || body.id.length !== 24) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 }
      );
    }

    const updated = await Crop.findByIdAndUpdate(body.id, body, { new: true });
    return NextResponse.json({ success: true, crop: updated });
  } catch (error) {
    console.error("PUT Crop Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/* ======================================================
   DELETE → Remove Crop
====================================================== */
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || id.length !== 24) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 }
      );
    }

    await Crop.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Crop deleted" });
  } catch (error) {
    console.error("DELETE Crop Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
