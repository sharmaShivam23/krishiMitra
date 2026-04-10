import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Scan, User } from "@/models";

const MONGODB_URI = process.env.MONGODB_URI || "";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

export async function POST(req: Request) {
  try {
    await connectDB();

    // console.log("Received scan data:"); // Log the incoming data

    const body = await req.json();
    const { userId, aiResult } = body;

    // Fetch the user to get their district
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const detectedDisease = aiResult.diseaseName;
    const severity = "HIGH";
    const userDistrict = currentUser.district;

    // 2. Save the scan to your database
    await Scan.create({
      userId: currentUser._id,
      disease: detectedDisease,
      district: userDistrict,
      severity: severity,
      confidence: aiResult.confidence,
      aiProcessingStatus: "PENDING",
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentScansCount = await Scan.countDocuments({
      district: userDistrict,
      disease: detectedDisease,
      createdAt: { $gte: sevenDaysAgo },
    });

    let outbreakTriggered = false;

    if (severity === "HIGH" || recentScansCount >= 3) {
      outbreakTriggered = true;

      // Fetch all farmers in this district (using .lean() to convert to plain JSON)
      const localFarmers = await User.find(
        { district: userDistrict },
        "name phone preferredLanguage"
      ).lean();

      // Securely fetch the webhook URL from the environment
      const N8N_WEBHOOK_URL = process.env.N8N_BIORADAR_WEBHOOK_URL || "";
      console.log("Pinging n8n at:", N8N_WEBHOOK_URL);

      if (N8N_WEBHOOK_URL) {
        try {
          await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              alertType:
                severity === "HIGH" ? "CRITICAL_DISEASE" : "OUTBREAK_DETECTED",
              disease: detectedDisease,
              district: userDistrict,
              solution: aiResult.solution,
              prevention: aiResult.prevention,
              targetFarmers: localFarmers,
            }),
          });
        } catch (err) {
          console.error("Failed to ping n8n:", err);
        }
      } else {
        console.error(
          "CRITICAL ERROR: N8N_BIORADAR_WEBHOOK_URL missing in .env"
        );
      }
    }

    console.log("Severity:", severity);

    // 5. Return success to the frontend
    return NextResponse.json(
      {
        success: true,
        message: "Scan saved successfully",
        outbreakTriggered: outbreakTriggered,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Scan processing error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}