import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { PesticideProduct } from '@/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    const disease = searchParams.get('disease');
    const crop = searchParams.get('crop');

    const query: any = { isActive: true };

    // Strict match for location
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;
    
    // Flexible text match for diseases and crops
    if (disease) {
      query.diseaseTreats = { $regex: new RegExp(disease, 'i') };
    }
    if (crop) {
      query.cropSuitability = { $regex: new RegExp(crop, 'i') };
    }

    const products = await PesticideProduct.find(query)
      .populate('providerId', 'name phone')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, products }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}