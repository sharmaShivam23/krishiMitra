

import { NextResponse } from "next/server";

// Helper to ensure strict Title Case for the government filters (e.g., "meerut" -> "Meerut")
const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
};

const FALLBACK_PRICES = [
  {
    state: 'Uttar Pradesh',
    district: 'Shamli',
    market: 'Shamli',
    commodity: 'Potato',
    variety: '',
    minPrice: 1200,
    maxPrice: 1500,
    modalPrice: 1350,
    date: '10/04/2026'
  },
  {
    state: 'Punjab',
    district: 'Ludhiana',
    market: 'Ludhiana',
    commodity: 'Wheat',
    variety: '',
    minPrice: 2200,
    maxPrice: 2450,
    modalPrice: 2320,
    date: '10/04/2026'
  },
  {
    state: 'Maharashtra',
    district: 'Nashik',
    market: 'Nashik',
    commodity: 'Onion',
    variety: '',
    minPrice: 900,
    maxPrice: 1250,
    modalPrice: 1080,
    date: '10/04/2026'
  },
  {
    state: 'Karnataka',
    district: 'Mandya',
    market: 'Mandya',
    commodity: 'Sugarcane',
    variety: '',
    minPrice: 310,
    maxPrice: 340,
    modalPrice: 325,
    date: '10/04/2026'
  },
  {
    state: 'Madhya Pradesh',
    district: 'Indore',
    market: 'Indore',
    commodity: 'Soyabean',
    variety: '',
    minPrice: 4200,
    maxPrice: 4600,
    modalPrice: 4450,
    date: '10/04/2026'
  },
  {
    state: 'Gujarat',
    district: 'Rajkot',
    market: 'Rajkot',
    commodity: 'Cotton',
    variety: '',
    minPrice: 6600,
    maxPrice: 7100,
    modalPrice: 6900,
    date: '10/04/2026'
  },
  {
    state: 'Rajasthan',
    district: 'Kota',
    market: 'Kota',
    commodity: 'Mustard',
    variety: '',
    minPrice: 5200,
    maxPrice: 5600,
    modalPrice: 5450,
    date: '10/04/2026'
  },
  {
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    market: 'Coimbatore',
    commodity: 'Tomato',
    variety: '',
    minPrice: 1400,
    maxPrice: 1900,
    modalPrice: 1650,
    date: '10/04/2026'
  }
];

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

const filterFallback = (state?: string | null, commodity?: string | null, district?: string | null) => {
  const normalizedState = normalize(state);
  const normalizedCommodity = normalize(commodity);
  const normalizedDistrict = normalize(district);

  return FALLBACK_PRICES.filter((item) => {
    const stateOk = !normalizedState || normalize(item.state) === normalizedState;
    const commodityOk = !normalizedCommodity || normalize(item.commodity) === normalizedCommodity;
    const districtOk = !normalizedDistrict || normalize(item.district) === normalizedDistrict;
    return stateOk && commodityOk && districtOk;
  });
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const state = searchParams.get("state");
    const commodity = searchParams.get("commodity");
    const district = searchParams.get("district");

    const baseUrl = process.env.BASE_URL;
    const apiKey = process.env.DATA_GOV_API_KEY;

    if (!baseUrl || !apiKey) {
      return NextResponse.json({ prices: filterFallback(state, commodity, district) });
    }

    // Build query params
    const params = new URLSearchParams({
      "api-key": apiKey,
      format: "json",
      limit: "2000",
    });

    // Apply proper casing to match the strict government API requirement
    // Note: The filter keys should be lowercase as per the API's field IDs
    if (state) params.append("filters[state]", toTitleCase(state));
    if (commodity) params.append("filters[commodity]", toTitleCase(commodity));
    if (district) params.append("filters[district]", toTitleCase(district));

    const response = await fetch(`${baseUrl}?${params.toString()}`, {
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