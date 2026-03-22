import { NextResponse } from 'next/server';
import { SellingPool } from '@/models';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const pool = await SellingPool.findByIdAndDelete(id);
    if (!pool) return NextResponse.json({ success: false, error: 'Pool not found' }, { status: 404 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete pool' }, { status: 500 });
  }
}
