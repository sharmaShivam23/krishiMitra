import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
// 🛠️ Updated to import from your unified models file
import { SellingPool } from '@/models';

const MONGODB_URI = process.env.MONGODB_URI || '';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const body = await req.json();
    const { farmerName, phone, quantity } = body;
    const { id } = await params;

    const pool = await SellingPool.findById(id);
    if (!pool) return NextResponse.json({ success: false, error: 'Pool not found' }, { status: 404 });

    pool.members.push({ farmerName, phone, quantity });
    pool.currentQuantity += Number(quantity);
    
    if (pool.currentQuantity >= pool.targetQuantity) {
        pool.status = 'Closed';
    }

    await pool.save();
    return NextResponse.json({ success: true, pool }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to join pool' }, { status: 500 });
  }
}