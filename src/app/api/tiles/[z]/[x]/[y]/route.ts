import { NextRequest, NextResponse } from 'next/server';

/**
 * Tile proxy for Esri World Imagery.
 * MapLibre GL v5 now uses fetch() for tiles → CORS blocks browser requests to Esri.
 * This route fetches tiles server-side (no CORS) and relays them with proper headers.
 *
 * MapLibre tile template:  /api/tiles/{z}/{x}/{y}
 * Esri tile URL format:    tile/{z}/{y}/{x}   ← NOTE: y and x are swapped vs XYZ standard
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;

  // Basic validation
  if (!z || !x || !y || isNaN(Number(z)) || isNaN(Number(x)) || isNaN(Number(y))) {
    return new NextResponse('Invalid tile params', { status: 400 });
  }

  // Esri swaps y/x compared to standard XYZ
  const esriUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

  try {
    const upstream = await fetch(esriUrl, {
      headers: {
        'User-Agent': 'KrishiMitra-FieldSurveyor/1.0 (server-proxy)',
        Accept: 'image/jpeg,image/png,image/*',
      },
      // Next.js route cache — revalidate every 24 hours
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Allow MapLibre to read the response in the browser
        'Access-Control-Allow-Origin': '*',
        // Cache aggressively — satellite tiles never change
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch {
    // Network error reaching upstream Esri server
    return new NextResponse(null, { status: 502 });
  }
}
