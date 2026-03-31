
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const formatInput = (str: string) =>
  str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

const parseMandiDate = (dateStr: string) => {
  if (!dateStr) return new Date(0);
  const dateOnly = dateStr.split(' ')[0];
  const parts = dateOnly.split('/');
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
  }
  return new Date(dateOnly);
};

export async function POST(req: Request) {
  try {
    const { commodity, state, district, quantity, language = 'English' } = await req.json();

    if (!commodity || !state) {
      return NextResponse.json({ error: "Commodity and State are required." }, { status: 400 });
    }

    const params = new URLSearchParams({
      "api-key": process.env.DATA_GOV_API_KEY!,
      format: "json",
      limit: "2000",
    });

    params.append("filters[commodity]", formatInput(commodity));
    params.append("filters[state]", formatInput(state));
    if (district) params.append("filters[district]", formatInput(district));

    const response = await fetch(`${BASE_URL}?${params.toString()}`, { cache: "no-store" });

    if (!response.ok) throw new Error("Government API unavailable.");

    const data = await response.json();
    if (!data.records || data.records.length === 0) {
      return NextResponse.json({ error: "No recent market data found for this crop in this region." }, { status: 404 });
    }

    const prices = data.records
      .map((item: any) => ({
        modalPrice: Number(item.modal_price),
        date: parseMandiDate(item.arrival_date),
      }))
      .filter((p: any) => !isNaN(p.modalPrice) && p.modalPrice > 0 && !isNaN(p.date.getTime()))
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

    if (prices.length < 2) {
      return NextResponse.json({ error: "Not enough historical data to generate an AI prediction." }, { status: 400 });
    }

    const lastPrices = prices.slice(-10);
    const currentPrice = lastPrices[lastPrices.length - 1].modalPrice;
    const oldestPrice = lastPrices[0].modalPrice;

    const changePercent = ((currentPrice - oldestPrice) / oldestPrice) * 100;
    let trend = "Stable";
    if (changePercent > 3) trend = "Increasing";
    else if (changePercent < -3) trend = "Decreasing";

    const mean = lastPrices.reduce((sum: number, p: any) => sum + p.modalPrice, 0) / lastPrices.length;
    const variance = lastPrices.reduce((sum: number, p: any) => sum + Math.pow(p.modalPrice - mean, 2), 0) / lastPrices.length;
    const stdDev = Math.sqrt(variance);
    const cov = mean === 0 ? 0 : (stdDev / mean) * 100;

    let riskLevel = "Low";
    if (cov > 12) riskLevel = "High";
    else if (cov > 5) riskLevel = "Medium";

    const avgChange = (currentPrice - oldestPrice) / lastPrices.length;
    const expectedPrice = Math.round(currentPrice + (avgChange * 7));
    const rangeMargin = Math.round(currentPrice * (cov === 0 ? 0.05 : cov / 100));

    const qty = Number(quantity) || 1;
    const estimatedValue = currentPrice * qty;
    const bestSellTime = trend === 'Increasing' ? 'Next Week' : trend === 'Decreasing' ? 'Immediately' : 'Phased Selling';

    // Generate Gemini suggestion in the user's chosen language
    let suggestion: string;
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const aiPrompt = `
You are an expert Indian agricultural market advisor.
A farmer has ${qty} quintal(s) of ${commodity} in ${district || state}.
Current market price: ₹${currentPrice}/quintal. Expected 7-day price: ₹${expectedPrice}/quintal.
Market trend: ${trend}. Price range next week: ₹${expectedPrice - rangeMargin}–₹${expectedPrice + rangeMargin}.
Risk level: ${riskLevel}.

In 2–3 clear, friendly sentences STRICTLY in ${language}, give the farmer a personalized selling recommendation.
Do NOT translate units or numbers. Write only natural, friendly advice.`;

      const aiResult = await model.generateContent(aiPrompt);
      suggestion = aiResult.response.text().trim();
    } catch (aiErr) {
      console.error('Gemini suggestion failed, using English fallback:', aiErr);
      if (trend === 'Increasing') {
        suggestion = 'Market is in an uptrend. Holding stock for 5–7 days is likely to increase profit margins.';
      } else if (trend === 'Decreasing') {
        suggestion = 'Prices are currently falling in this region. Liquidate stock quickly to prevent further margin loss.';
      } else {
        suggestion = 'Market is currently stable. Execute phased selling based on your storage capabilities.';
      }
    }

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