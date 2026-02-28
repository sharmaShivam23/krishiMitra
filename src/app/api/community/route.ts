import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
// Import your unified models
// import { Post, User } from '@/lib/models'; // <-- Update this path if your models file is elsewhere
import { Post , User } from '@/models';

export async function GET() {
  try {
    await connectDB();
    
    // Fetch posts and POPULATE the author field with the User's name
    const posts = await Post.find({})
      .populate('author', 'name') // Pulls the 'name' field from the User collection
      .sort({ createdAt: -1 });

    // Format the data perfectly for our frontend interface
    const formattedPosts = posts.map((post: any) => ({
      _id: post._id.toString(),
      author: post.author?.name || 'Anonymous Farmer', // Safely extract the populated name
      state: post.state,
      title: post.title,
      content: post.content,
      upvotes: post.upvotes,
      comments: post.comments,
      tags: post.tags,
      isResolved: post.isResolved,
      createdAt: post.createdAt,
    }));

    return NextResponse.json({ success: true, posts: formattedPosts });
  } catch (error) {
    console.error("DB Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch discussions.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    // Assuming your token payload contains the user's ID as `userId` or `id`
    const userId = (decoded as any).userId || (decoded as any).id;

    const body = await req.json();
    const { title, content, state, tags } = body;

    await connectDB();

    // Create the post using the real User ObjectId
    const newPost = await Post.create({
      author: userId, 
      state,
      title,
      content,
      tags: tags || ['General']
    });

    // Populate the newly created post so we can return it to the UI immediately
    const populatedPost = await Post.findById(newPost._id).populate('author', 'name');

    const formattedPost = {
      _id: populatedPost._id.toString(),
      author: populatedPost.author.name,
      state: populatedPost.state,
      title: populatedPost.title,
      content: populatedPost.content,
      upvotes: populatedPost.upvotes,
      comments: populatedPost.comments,
      tags: populatedPost.tags,
      isResolved: populatedPost.isResolved,
      createdAt: populatedPost.createdAt,
    };

    return NextResponse.json({ success: true, post: formattedPost });
  } catch (error) {
    console.error("DB Create Error:", error);
    return NextResponse.json({ error: 'Failed to publish post.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { postId, action } = await req.json();
    
    await connectDB();

    const incrementValue = action === 'upvote' ? 1 : -1;
    
    await Post.findByIdAndUpdate(postId, {
      $inc: { upvotes: incrementValue }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DB Patch Error:", error);
    return NextResponse.json({ error: 'Failed to update upvote.' }, { status: 500 });
  }
}