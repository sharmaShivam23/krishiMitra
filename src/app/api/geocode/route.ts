import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (q.trim().length < 2) return NextResponse.json([]);

  try {
    // Removed countrycodes to allow global search for any country, state, city, cafe, mall, etc.
    // addressdetails=1 provides address breakdown, extratags=1 provides extra POI info
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(q)}` +
      `&format=json&addressdetails=1&extratags=1&limit=10`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'KrishiMitra-FieldSurveyor/1.0 (open-source-agricultural-gis)',
        'Accept-Language': 'hi,en',
        Accept: 'application/json',
      },
      // Cache geocode results for 2 minutes server-side
      next: { revalidate: 120 },
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json([]);
  }
}
