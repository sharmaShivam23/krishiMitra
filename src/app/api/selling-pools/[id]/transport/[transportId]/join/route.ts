import { NextResponse } from 'next/server';
import { SellingPool } from '@/models';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, transportId: string }> }) {
  try {
    const { id, transportId } = await params;
    const { phone } = await req.json();

    const pool = await SellingPool.findById(id);
    if (!pool) return NextResponse.json({ success: false }, { status: 404 });

    const transport = pool.transports.id(transportId);
    if (!transport) return NextResponse.json({ success: false }, { status: 404 });

    if (!transport.joinedFarmers.includes(phone) && transport.joinedFarmers.length < transport.capacity) {
      transport.joinedFarmers.push(phone);
      await pool.save();
    }

    return NextResponse.json({ success: true, pool }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to join transport' }, { status: 500 });
  }
}