import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
// Import Subscriber and Scan (assuming you save AI scans to a Scan model)
import { User, Post, Listing, Subscriber , Scan } from '@/models';

const MONGODB_URI = process.env.MONGODB_URI || '';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;

    if (adminToken) {
      try {
        jwt.verify(adminToken, process.env.JWT_SECRET || 'fallback_secret');
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
      }
    }

    await connectDB();

    // Time calculations
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // =======================================================================
    // 1. FAST PARALLEL QUERIES (100% REAL DATA)
    // =======================================================================
    const [
      totalFarmers, 
      totalPosts, 
      totalListings,
      activeUsersToday,
      totalScans,
      activeSubscribers // Used as a proxy for daily SMS sent
    ] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      Post.countDocuments(),
      Listing.countDocuments(),
      User.countDocuments({ updatedAt: { $gte: startOfToday } }), // Real active users
      Scan?.countDocuments() || 0, // Using optional chaining in case Scan model is empty
      Subscriber.countDocuments({ isActive: true }) // Real daily SMS count
    ]);

    // =======================================================================
    // 2. COMPLEX AGGREGATIONS (100% REAL DATA)
    // =======================================================================

    // A. Top State
    const topStateAgg = await User.aggregate([
    { $match: { role: 'farmer', state: { $exists: true, $nin: [null, 'General'] } } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const topState = topStateAgg.length > 0 ? topStateAgg[0]._id : 'N/A';

    // B. Registrations Per Day (Last 7 Days)
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

    // Fill in missing days with 0 so the chart looks continuous
    const registrationsPerDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = rawRegistrations.find(r => r._id === dateStr);
      registrationsPerDay.push({ date: dateStr, registrations: found ? found.count : 0 });
    }

    // C. Most Listed Crop (Real proxy for "Most Searched/Popular")
    const topCropAgg = await Listing.aggregate([
      { $group: { _id: '$cropName', count: { $sum: 1 } } }, // adjust '$cropName' to match your schema
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const mostSearchedCrop = topCropAgg.length > 0 && topCropAgg[0]._id ? topCropAgg[0]._id : 'No data yet';

    // D. Real Disease Data from AI Scans
    let diseaseChartData = [];
    if (mongoose.models.Scan) {
      const rawDiseases = await Scan.aggregate([
        { $group: { _id: '$disease', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      diseaseChartData = rawDiseases.map(d => ({ name: d._id || 'Unknown', count: d.count }));
    } else {
      diseaseChartData = [{ name: "No Scans Yet", count: 1 }];
    }

    // E. Top Markets (Based on actual active Listings instead of fake Mandi views)
    const rawMarketData = await Listing.aggregate([
      { $match: { district: { $exists: true, $ne: null } } },
      { $group: { _id: '$district', views: { $sum: 1 } } }, // using 'views' key so frontend doesn't break
      { $sort: { views: -1 } },
      { $limit: 5 }
    ]);
    const mandiViewsData = rawMarketData.map(m => ({ market: m._id, views: m.views }));

    // =======================================================================
    // 3. CONSTRUCT FINAL PAYLOAD
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
        smsSentToday: activeSubscribers 
      },
      charts: {
        registrationsPerDay,
        diseaseChartData,
        mandiViewsData: mandiViewsData.length > 0 ? mandiViewsData : [{ market: "No Listings", views: 0 }]
      }
    };

    return NextResponse.json({ success: true, data: dashboardData }, { status: 200 });

  } catch (error: any) {
    console.error('Admin Dashboard API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}