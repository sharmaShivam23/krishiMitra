import { NextResponse } from "next/server";

const BASE_URL = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24";

// Helper to format user input
const formatInput = (str: string) => 
  str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

// 🛠️ THE FIX: Safely parse DD/MM/YYYY dates from the Government API
const parseMandiDate = (dateStr: string) => {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    // Reorder to YYYY-MM-DD for standard JS parsing
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
  }
  return new Date(dateStr); 
};

export async function POST(req: Request) {
  try {
    const { commodity, state, district, quantity } = await req.json();

    if (!commodity || !state) {
      return NextResponse.json({ error: "Commodity and State are required." }, { status: 400 });
    }

    const params = new URLSearchParams({
      "api-key": process.env.DATA_GOV_API_KEY!,
      format: "json",
      limit: "50",
    });

    params.append("filters[Commodity]", formatInput(commodity));
    params.append("filters[State]", formatInput(state));
    if (district) params.append("filters[District]", formatInput(district));

    const response = await fetch(`${BASE_URL}?${params.toString()}`, { cache: "no-store" });
    
    if (!response.ok) throw new Error("Government API unavailable.");
    
    const data = await response.json();
    if (!data.records || data.records.length === 0) {
      return NextResponse.json({ error: "No recent market data found for this crop in this region." }, { status: 404 });
    }

    // Parse, filter, and sort prices safely
    const prices = data.records
      .map((item: any) => ({
        modalPrice: Number(item.Modal_Price),
        date: parseMandiDate(item.Arrival_Date),
      }))
      // 🛠️ Make sure the price is a valid number and the date successfully parsed
      .filter((p: any) => !isNaN(p.modalPrice) && p.modalPrice > 0 && !isNaN(p.date.getTime()))
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

    if (prices.length < 2) {
      return NextResponse.json({ error: "Not enough historical data to generate an AI prediction." }, { status: 400 });
    }

    // Run AI Prediction Engine
    const lastPrices = prices.slice(-10);
    const currentPrice = lastPrices[lastPrices.length - 1].modalPrice;
    const oldestPrice = lastPrices[0].modalPrice;

    // Trend Calculation
    const changePercent = ((currentPrice - oldestPrice) / oldestPrice) * 100;
    let trend = "Stable";
    if (changePercent > 3) trend = "Increasing";
    else if (changePercent < -3) trend = "Decreasing";

    // Risk Level Calculation
    const mean = lastPrices.reduce((sum: number, p: any) => sum + p.modalPrice, 0) / lastPrices.length;
    const variance = lastPrices.reduce((sum: number, p: any) => sum + Math.pow(p.modalPrice - mean, 2), 0) / lastPrices.length;
    const stdDev = Math.sqrt(variance);
    const cov = mean === 0 ? 0 : (stdDev / mean) * 100; 

    let riskLevel = "Low";
    if (cov > 12) riskLevel = "High";
    else if (cov > 5) riskLevel = "Medium";

    // Forecast
    const avgChange = (currentPrice - oldestPrice) / lastPrices.length;
    const expectedPrice = Math.round(currentPrice + (avgChange * 7)); 
    const rangeMargin = Math.round(currentPrice * (cov === 0 ? 0.05 : cov / 100)); 

    let suggestion = "";
    let bestSellTime = "Now";

    if (trend === "Increasing") {
      suggestion = "Market is in an uptrend. Holding stock for 5-7 days is likely to increase profit margins.";
      bestSellTime = "Next Week";
    } else if (trend === "Decreasing") {
      suggestion = "Prices are currently falling in this region. Liquidate stock quickly to prevent further margin loss.";
      bestSellTime = "Immediately";
    } else {
      suggestion = "Market is currently stable. Execute phased selling based on your storage capabilities.";
      bestSellTime = "Phased Selling";
    }

    const qty = Number(quantity) || 1;
    const estimatedValue = currentPrice * qty;

    return NextResponse.json({
      currentPrice,
      expectedPrice,
      priceRange: `₹${Math.max(0, expectedPrice - rangeMargin)} - ₹${expectedPrice + rangeMargin}`,
      trend,
      riskLevel,
      suggestion,
      bestSellTime,
      estimatedValue
    });

  } catch (err: any) {
    console.error("Mandi API Error:", err);
    return NextResponse.json({ error: "AI Advisor failed to process request." }, { status: 500 });
  }
}