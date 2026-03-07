

import { NextResponse } from "next/server";

// Helper to ensure strict Title Case for the government filters (e.g., "meerut" -> "Meerut")
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
      limit: "2000",
    });

    // Apply proper casing to match the strict government API requirement
    // Note: The filter keys should be lowercase as per the API's field IDs
    if (state) params.append("filters[state]", toTitleCase(state));
    if (commodity) params.append("filters[commodity]", toTitleCase(commodity));
    if (district) params.append("filters[district]", toTitleCase(district));

    const response = await fetch(`${process.env.BASE_URL}?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Government API failed");
    }

    const data = await response.json();

    // FIXED: Mapped using the exact lowercase keys returned by the Gov API
    const prices = data.records.map((item: any) => ({
      state: item.state,
      district: item.district,
      market: item.market,
      commodity: item.commodity,
      variety: item.variety,
      minPrice: item.min_price,
      maxPrice: item.max_price,
      modalPrice: item.modal_price,
      date: item.arrival_date,
    }));

    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Mandi API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mandi prices" },
      { status: 500 }
    );
  }
}