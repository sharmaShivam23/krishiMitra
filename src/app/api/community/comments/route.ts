import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { Comment , Post , User } from '@/models';

// 1. GET: Fetch all comments for a specific post
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });

    await connectDB();

    const comments = await Comment.find({ post: postId })
      .populate('author', 'name')
      .sort({ createdAt: 1 }); // Oldest first (chronological thread)

    const formattedComments = comments.map(comment => ({
      _id: comment._id.toString(),
      author: comment.author?.name || 'Anonymous Farmer',
      text: comment.text,
      createdAt: comment.createdAt,
    }));

    return NextResponse.json({ success: true, comments: formattedComments });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments.' }, { status: 500 });
  }
}

// 2. POST: Add a new comment to a post
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    const userId = (decoded as any).userId || (decoded as any).id;

    const { postId, text } = await req.json();

    if (!postId || !text) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    await connectDB();

    // Create the comment
    const newComment = await Comment.create({
      post: postId,
      author: userId,
      text: text
    });

    // Increment the comment counter on the parent Post
    await Post.findByIdAndUpdate(postId, { $inc: { comments: 1 } });

    // Populate author so frontend gets the name instantly
    const populatedComment = await Comment.findById(newComment._id).populate('author', 'name');

    const formattedComment = {
      _id: populatedComment._id.toString(),
      author: populatedComment.author.name,
      text: populatedComment.text,
      createdAt: populatedComment.createdAt,
    };

    return NextResponse.json({ success: true, comment: formattedComment });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to post reply.' }, { status: 500 });
  }
}