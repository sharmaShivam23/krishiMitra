import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ActiveCrop, User } from '@/models';

export async function GET(req: Request) {
  // ==========================================
  // 🔒 SECURITY CHECK: Verify Secret API Key
  // ==========================================
  const authHeader = req.headers.get('authorization');
  
  // If there is no password, or it's the wrong password, kick them out immediately!
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_LIFE}`) {
    console.error("Blocked unauthorized attempt to access daily tasks.");
    return new NextResponse('Unauthorized: Invalid API Key', { status: 401 });
  }

  try {
    await connectDB();
    
    // Get beginning and end of today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find crops with tasks due today or overdue, that are NOT completed
    const crops = await ActiveCrop.find({
      status: 'Active',
      tasks: {
        $elemMatch: {
          isCompleted: false,
          scheduledDate: { $lte: todayEnd } // Less than or equal to today
        }
      }
    }).populate('userId', 'name phone preferredLanguage district');

    // Format data beautifully for n8n to digest
    const alerts = crops.map(crop => {
      const pendingTasks = crop.tasks.filter((t: any) => !t.isCompleted && new Date(t.scheduledDate) <= todayEnd);
      return {
        farmerName: (crop.userId as any).name,
        phone: (crop.userId as any).phone,
        language: (crop.userId as any).preferredLanguage,
        district: crop.location?.district || (crop.userId as any).district,
        cropName: crop.cropName,
        tasks: pendingTasks.map((t: any) => ({
          id: t._id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          isOverdue: new Date(t.scheduledDate) < todayStart
        }))
      };
    });

    return NextResponse.json({ success: true, count: alerts.length, alerts });
  } catch (error: any) {
    console.error("Daily Tasks API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}