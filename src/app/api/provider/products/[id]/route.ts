export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PesticideProduct } from "@/models";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// Helper to get Auth (Same secure logic as your main route)
async function getUserIdFromRequest(req: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("auth_token")?.value;

  const authHeader = req.headers.get("authorization");
  let headerToken = null;
  if (authHeader && authHeader.startsWith("Bearer ") && !authHeader.includes("null")) {
    headerToken = authHeader.split(" ")[1];
  }

  const tokenToVerify = cookieToken || headerToken;
  if (!tokenToVerify) return null;

  try {
    const decoded = verifyToken(tokenToVerify) as any;
    return decoded?.userId || decoded?.id || decoded?._id || null;
  } catch (e) {
    return null;
  }
}

// DELETE Request
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    // 1. Verify User is logged in
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🚀 NEW NEXT.JS REQUIREMENT: Await the params!
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // 2. Delete the product. 
    // CRITICAL SECURITY: We include providerId in the query so a hacker cannot delete someone else's product!
    const deletedProduct = await PesticideProduct.findOneAndDelete({ 
      _id: productId, 
      providerId: userId 
    });

    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found or you do not have permission to delete it" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}