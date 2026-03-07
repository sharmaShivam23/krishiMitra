import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Crop } from "@/models"; 
import { generateCropAdvice } from "@/lib/gemini";

/* ======================================================
   GET → Fetch crops or single crop intelligence
====================================================== */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const cropId = searchParams.get("id");

    // Get single crop
    if (cropId) {
      const crop = await Crop.findById(cropId);
      if (!crop) {
        return NextResponse.json({ success: false, message: "Crop not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, crop });
    }

    // Search crops
    const query = search ? { name: { $regex: search, $options: "i" } } : {};
    const crops = await Crop.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, count: crops.length, crops });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

/* ======================================================
   POST → Create Crop OR Generate Intelligence (Multilingual)
====================================================== */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    /* ---------- MODE 1 : CREATE CROP (ADMIN) ---------- */
    if (body.mode === "create") {
      const crop = await Crop.create(body);
      return NextResponse.json({ success: true, message: "Crop created", crop });
    }

    /* ---------- MODE 2 : CROP INTELLIGENCE ---------- */
    if (body.mode === "intelligence") {
      const crop = await Crop.findOne({ name: body.crop });

      if (!crop) {
        return NextResponse.json({ success: false, message: "Crop not found" }, { status: 404 });
      }

      // Gemini AI Advice
      const advice = await generateCropAdvice({
        crop: crop.name,
        location: body.location,
        weather: body.weather,
        soil: body.soil,
        language: body.language, // Language passed successfully to Gemini
      });

      return NextResponse.json({ success: true, crop, aiAdvice: advice });
    }

    return NextResponse.json({ success: false, message: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

/* ======================================================
   PUT → Update Crop
====================================================== */
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const updated = await Crop.findByIdAndUpdate(body.id, body, { new: true });
    return NextResponse.json({ success: true, crop: updated });
  } catch (error) {
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

    await Crop.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Crop deleted" });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}