import { NextResponse } from 'next/server';
import { SellingPool } from '@/models';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, phone: string }> }) {
  try {
    const { id, phone } = await params;

    const pool = await SellingPool.findById(id);
    if (!pool) return NextResponse.json({ success: false }, { status: 404 });

    // उस किसान को ढूंढें
    const memberIndex = pool.members.findIndex((m: any) => m.phone === phone);
    if (memberIndex === -1) return NextResponse.json({ success: false }, { status: 404 });

    // Quantity वापस घटाएं
    const quantityToDeduct = pool.members[memberIndex].quantity;
    pool.currentQuantity -= quantityToDeduct;

    // अगर 100% से कम हो गया, तो वापस Open कर दें
    if (pool.currentQuantity < pool.targetQuantity) {
      pool.status = 'Open';
    }

    // मेंबर को Array से हटा दें
    pool.members.splice(memberIndex, 1);

    await pool.save();
    return NextResponse.json({ success: true, pool }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to remove member' }, { status: 500 });
  }
}