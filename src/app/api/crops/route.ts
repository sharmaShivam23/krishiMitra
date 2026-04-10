import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Crop } from "@/models";
import { generateCropAdvice } from "@/lib/gemini";


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

        advice = await Promise.race([aiPromise, timeoutPromise]);
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
            "Maintain current irrigation schedule based on upcoming weather forecasts.",
            "Apply a balanced NPK fertilizer top-up within the next 5-7 days.",
            "Monitor lower leaves for signs of early blight due to humidity levels.",
            "Scout for pests weekly and apply preventive measures as needed.",
          ],
          risks: [
            "Moderate risk of fungal infection if humidity remains elevated.",
            "Watch for nutrient deficiencies if soil quality is poor.",
            "Weather changes could impact irrigation requirements.",
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
