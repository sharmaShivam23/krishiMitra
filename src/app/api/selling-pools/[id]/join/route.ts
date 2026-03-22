import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { SellingPool } from '@/models';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { farmerName, phone, quantity, district, state } = body;

    const pool = await SellingPool.findById(id);
    if (!pool) return NextResponse.json({ success: false, error: 'Pool not found' }, { status: 404 });

    pool.members.push({ farmerName, phone, quantity, district, state });
    pool.currentQuantity += Number(quantity);
    
    if (pool.currentQuantity >= pool.targetQuantity) {
        pool.status = 'Closed'; // 100% हो गया!
    }

    await pool.save();
    return NextResponse.json({ success: true, pool }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to join pool' }, { status: 500 });
  }
}