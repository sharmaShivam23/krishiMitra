import { NextRequest, NextResponse } from 'next/server';

/**
 * Tile proxy — tries Esri World Imagery first, falls back to OpenStreetMap.
 * This avoids the "map data not available" error when Esri lacks coverage.
 *
 * Esri tile format: tile/{z}/{y}/{x}  ← y and x are SWAPPED vs XYZ standard
 * OSM tile format:  {z}/{x}/{y}.png   ← standard XYZ
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;

  if (!z || !x || !y || isNaN(Number(z)) || isNaN(Number(x)) || isNaN(Number(y))) {
    return new NextResponse('Invalid tile params', { status: 400 });
  }

  // ── 1. Try Esri World Imagery (satellite) ────────────────────────────────
  try {
    const esriUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    const esriRes = await fetch(esriUrl, {
      headers: {
        'User-Agent': 'KrishiMitra-FieldSurveyor/1.0 (server-proxy)',
        Accept: 'image/jpeg,image/png,image/*',
      },
      next: { revalidate: 86400 },
    });

    if (esriRes.ok) {
      const buffer = await esriRes.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': esriRes.headers.get('content-type') ?? 'image/jpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
          'X-Tile-Source': 'esri',
        },
      });
    }
  } catch { /* fall through */ }

  // ── 2. Fallback: OpenStreetMap (road map — always has India coverage) ────
  try {
    const osmUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    const osmRes = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'KrishiMitra-FieldSurveyor/1.0 (server-proxy)',
        Accept: 'image/png',
      },
      next: { revalidate: 3600 },
    });

    if (osmRes.ok) {
      const buffer = await osmRes.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=1800',
          'X-Tile-Source': 'osm-fallback',
        },
      });
    }
  } catch { /* fall through */ }

  // ── 3. Nothing worked — return empty transparent tile ────────────────────
  return new NextResponse(null, { status: 204 });
}
