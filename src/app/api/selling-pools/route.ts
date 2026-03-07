import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
// 🛠️ Updated to import from your unified models file
import { SellingPool } from '@/models';

const MONGODB_URI = process.env.MONGODB_URI || '';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

export async function GET() {
  try {
    await connectDB();
    const pools = await SellingPool.find({ status: 'Open' }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, pools }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch pools' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    const newPool = new SellingPool({
      ...body,
      currentQuantity: body.initialQuantity,
      members: [{
        farmerName: body.creatorName,
        phone: body.creatorPhone,
        quantity: body.initialQuantity
      }]
    });

    await newPool.save();
    return NextResponse.json({ success: true, pool: newPool }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create pool' }, { status: 500 });
  }
}