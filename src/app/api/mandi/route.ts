import { NextResponse } from "next/server";

const BASE_URL = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24";

// Helper to ensure strict Title Case (e.g., "meerut" -> "Meerut")
const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const state = searchParams.get("state");
    const commodity = searchParams.get("commodity");
    const district = searchParams.get("district");

    // Build query params
    const params = new URLSearchParams({
      "api-key": process.env.DATA_GOV_API_KEY!,
      format: "json",
      limit: "50",
    });

    // Apply proper casing to match the strict government API requirement
    if (state) params.append("filters[State]", toTitleCase(state));
    if (commodity) params.append("filters[Commodity]", toTitleCase(commodity));
    if (district) params.append("filters[District]", toTitleCase(district));

    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Government API failed");
    }

    const data = await response.json();

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