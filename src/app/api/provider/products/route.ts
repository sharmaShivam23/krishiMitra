import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PesticideProduct, User } from "@/models";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    await connectDB();

    let token = "";

    // 1. Try to get token from headers
    const authHeader = req.headers.get("authorization");
    if (
      authHeader &&
      authHeader.startsWith("Bearer ") &&
      authHeader !== "Bearer null"
    ) {
      token = authHeader.split(" ")[1];
    }
    // 2. Fallback to HttpOnly cookie if header is missing or null
    else {
      const cookieStore = await cookies();
      token = cookieStore.get("auth_token")?.value || "";
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as { userId: string };

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    const isVerifiedProvider = user?.isVerifiedProvider || false;

    const products = await PesticideProduct.find({
      providerId: decoded.userId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, products, isVerifiedProvider }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch products error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    let token = "";

    // 1. Try to get token from headers
    const authHeader = req.headers.get("authorization");
    if (
      authHeader &&
      authHeader.startsWith("Bearer ") &&
      authHeader !== "Bearer null"
    ) {
      token = authHeader.split(" ")[1];
    }
    // 2. Fallback to HttpOnly cookie if header is missing or null
    else {
      const cookieStore = await cookies();
      token = cookieStore.get("auth_token")?.value || "";
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as { userId: string };

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "provider") {
      return NextResponse.json(
        { error: "Forbidden: Only providers can add products" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      image,
      price,
      cropSuitability,
      diseaseTreats,
      usageInstructions,
      benefits,
      safetyWarnings,
      location,
    } = body;

    if (!name || !price || !location || !location.state || !location.district) {
      return NextResponse.json(
        { error: "Name, price, state, and district are required" },
        { status: 400 }
      );
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

    return NextResponse.json(
      { success: true, product: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
