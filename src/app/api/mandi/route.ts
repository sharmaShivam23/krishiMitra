import { NextResponse } from "next/server";

const BASE_URL = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const state = searchParams.get("state");
    const commodity = searchParams.get("commodity");

    // Build query params
    const params = new URLSearchParams({
      "api-key": process.env.DATA_GOV_API_KEY!,
      format: "json",
      limit: "50",
    });

    // The government API requires the filter keys to be capitalized as well!
    if (state) params.append("filters[State]", state);
    if (commodity) params.append("filters[Commodity]", commodity);

    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Government API failed");
    }

    const data = await response.json();

    // ✅ FIXED: Mapping exactly to the capitalized keys in your JSON
    const prices = data.records.map((item: any) => ({
      state: item.State,
      district: item.District,
      market: item.Market,
      commodity: item.Commodity,
      variety: item.Variety,
      minPrice: item.Min_Price,
      maxPrice: item.Max_Price,
      modalPrice: item.Modal_Price,
      date: item.Arrival_Date,
    }));

    return NextResponse.json({ prices });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch mandi prices" },
      { status: 500 }
    );
  }
}