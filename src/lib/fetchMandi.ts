const BASE_URL =
  "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24";

export async function fetchMandiPrices({
  commodity,
  state,
  district,
}: {
  commodity: string;
  state: string;
  district?: string;
}) {
  const params = new URLSearchParams({
    "api-key": process.env.DATA_GOV_API_KEY!,
    format: "json",
    limit: "100",
  });

  params.append("filters[Commodity]", commodity);
  params.append("filters[State]", state);

  if (district) {
    params.append("filters[District]", district);
  }

  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch mandi data");
  }

  const data = await response.json();

  return data.records.map((item: any) => ({
    state: item.State,
    district: item.District,
    market: item.Market,
    commodity: item.Commodity,
    modalPrice: Number(item.Modal_Price),
    date: new Date(item.Arrival_Date),
  }));
}