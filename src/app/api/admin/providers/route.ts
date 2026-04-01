export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User , PesticideProduct } from '@/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const providers = await User.find({ role: 'provider' }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, providers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, isVerifiedProvider, providerStatus } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (isVerifiedProvider !== undefined) updateData.isVerifiedProvider = isVerifiedProvider;
    if (providerStatus !== undefined) updateData.providerStatus = providerStatus;

    // We store the result in a variable to ensure MongoDB actually found and updated them
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { strict: false, new: true }
    );

    // If it returns null, the ID was wrong or didn't exist
    if (!updatedUser) {
      console.error("Admin Update Failed: User not found in DB.");
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    console.log(`Successfully updated provider ${updatedUser.name} to ${providerStatus}`);
    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });

  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}