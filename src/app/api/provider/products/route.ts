export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PesticideProduct, User } from "@/models";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// Helper function to extract auth safely
// Helper function to extract auth safely
async function getUserIdFromRequest(req: Request) {
  // 1. Grab tokens from both sources
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("auth_token")?.value;

  const authHeader = req.headers.get("authorization");
  let headerToken = null;
  if (authHeader && authHeader.startsWith("Bearer ") && !authHeader.includes("null") && !authHeader.includes("undefined")) {
    headerToken = authHeader.split(" ")[1];
  }

  // 2. Try verifying the Cookie FIRST (Immune to frontend localStorage bugs)
  if (cookieToken) {
    try {
      const decoded = verifyToken(cookieToken) as any;
      // 🚀 Added decoded._id just in case your JWT uses that!
      const finalId = decoded?.userId || decoded?.id || decoded?._id || null;
      if (finalId) return finalId;
    } catch (e) {
      console.error("Cookie token verification failed:", e);
    }
  }

  // 3. If Cookie failed or doesn't exist, try the Header token (Fallback)
  if (headerToken) {
    try {
      const decoded = verifyToken(headerToken) as any;
      const finalId = decoded?.userId || decoded?.id || decoded?._id || null;
      if (finalId) return finalId;
    } catch (e) {
      console.error("Header token verification failed:", e);
    }
  }

  // 4. If both failed, kick them out
  console.error("Auth Error: Valid token not found in cookies or headers.");
  return null;
}

// GET - Fetch Products and Provider Status
export async function GET(req: Request) {
  try {
    await connectDB();

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized or Invalid Token" }, { status: 401 });
    }

    const user = await User.findById(userId).lean() as any;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Explicitly grab the verification fields
    const isVerifiedProvider = user.isVerifiedProvider || false;
    const providerStatus = user.providerStatus || 'Pending';

    // Log this to your terminal so you can verify the database is returning the right thing!
    console.log(`PROVIDER CHECK: ${user.name} | Verified: ${isVerifiedProvider} | Status: ${providerStatus}`);

    const products = await PesticideProduct.find({ providerId: userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ 
      success: true, 
      products, 
      isVerifiedProvider, 
      providerStatus 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Fetch products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(req: Request) {
  try {
    await connectDB();

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId).lean() as any;
    
    // Check if user exists and is a provider
    if (!user || user.role !== "provider") {
      return NextResponse.json({ error: "Forbidden: Only providers can add products" }, { status: 403 });
    }

    // ==========================================
    // 🔒 SECURITY CHECK: Are they verified?
    // ==========================================
    if (!user.isVerifiedProvider || user.providerStatus !== "Accepted") {
      return NextResponse.json(
        { error: "Forbidden: Your provider account must be verified by an admin before you can list products." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, image, price, cropSuitability, diseaseTreats, usageInstructions, benefits, safetyWarnings, location } = body;

    if (!name || !price || !location || !location.state || !location.district) {
      return NextResponse.json({ error: "Name, price, state, and district are required" }, { status: 400 });
    }

    const newProduct = await PesticideProduct.create({
      providerId: user._id,
      name,
      image: image || "",
      price: Number(price),
      cropSuitability: cropSuitability || [],
      diseaseTreats: diseaseTreats || [],
      usageInstructions: usageInstructions || "",
      benefits: benefits || "",
      safetyWarnings: safetyWarnings || "",
      location: {
        state: location.state,
        district: location.district,
      },
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}