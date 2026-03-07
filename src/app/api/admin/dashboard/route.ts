import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { User , Post , Listing } from '@/models';

const MONGODB_URI = process.env.MONGODB_URI || '';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

export async function GET() {
  try {
    // 1. Authenticate Admin (Optional but highly recommended for production)
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;

    if (!adminToken) {
      // For local testing, you can comment this out if you haven't set up admin JWTs yet.
      // return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    } else {
      try {
        jwt.verify(adminToken, process.env.JWT_SECRET || 'fallback_secret');
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
      }
    }

    await connectDB();

    // =======================================================================
    // 2. REAL DATABASE AGGREGATIONS (Using your existing models)
    // =======================================================================
    
    // A. Run independent count queries in parallel for maximum performance
    const [totalFarmers, totalPosts, totalListings] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      Post.countDocuments(),
      Listing.countDocuments()
    ]);

    // B. Calculate Top State Using the Platform
    const topStateAgg = await User.aggregate([
      { $match: { role: 'farmer', state: { $exists: true, $ne: null } } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const topState = topStateAgg.length > 0 ? topStateAgg[0]._id : 'N/A';

    // C. Calculate Farmer Registrations Per Day (Last 7 Days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const rawRegistrations = await User.aggregate([
      { $match: { role: 'farmer', createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Ensure we have a beautiful array for Recharts/Chart.js
    const registrationsPerDay = rawRegistrations.map(item => ({
      date: item._id,
      registrations: item.count
    }));

    // =======================================================================
    // 3. HYBRID / SIMULATED METRICS 
    // (Replace these with real DB queries when you create these models)
    // =======================================================================
    
    // Standard Stats
    const activeUsersToday = Math.floor(totalFarmers * 0.3) + 120; // Simulating 30% daily active users
    const totalScans = 3450; 
    const mostSearchedCrop = "Wheat (HD 3086)";
    const smsSentToday = 1845;

    // Chart Data: Most Reported Crop Diseases
    const diseaseChartData = [
      { name: "Wheat Rust", count: 450 },
      { name: "Rice Blast", count: 380 },
      { name: "Potato Blight", count: 210 },
      { name: "Powdery Mildew", count: 180 },
      { name: "Healthy", count: 850 }
    ];

    // Chart Data: Most Viewed Mandi Markets
    const mandiViewsData = [
      { market: "Meerut APMC", views: 1200 },
      { market: "Karnal Mandi", views: 950 },
      { market: "Ludhiana APMC", views: 840 },
      { market: "Pune Market", views: 620 }
    ];

    // =======================================================================
    // 4. CONSTRUCT FINAL PAYLOAD
    // =======================================================================
    
    const dashboardData = {
      summaryCards: {
        totalFarmers,
        activeUsersToday,
        totalScans,
        totalListings,
        communityPosts: totalPosts,
        mostSearchedCrop,
        topState,
        smsSentToday
      },
      charts: {
        registrationsPerDay,
        diseaseChartData,
        mandiViewsData
      }
    };

    return NextResponse.json({ success: true, data: dashboardData }, { status: 200 });

  } catch (error: any) {
    console.error('Admin Dashboard API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}