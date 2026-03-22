import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ProductReview, PesticideProduct, User } from '@/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    
    const product = await PesticideProduct.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const reviews = await ProductReview.find({ productId: id })
      .populate('farmerId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, reviews }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    let token = '';

    // 1. Try to get token from headers
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader !== 'Bearer null') {
      token = authHeader.split(' ')[1];
    } 
  
    else {
      const cookieStore = await cookies();
      token = cookieStore.get('auth_token')?.value || '';
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { userId: string };
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const product = await PesticideProduct.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await req.json();
    const { rating, feedback, effectiveness } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Check if user already reviewed
    const existingReview = await ProductReview.findOne({ productId: id, farmerId: user._id });
    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }

    const newReview = await ProductReview.create({
      productId: id,
      farmerId: user._id,
      rating: Number(rating),
      effectiveness: effectiveness || '',
      feedback: feedback || ''
    });

    // Populate the farmerId so the UI can immediately display the name without refreshing
    await newReview.populate('farmerId', 'name');

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}