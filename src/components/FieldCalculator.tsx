"use client";

import React, {
  useState, useCallback, useRef, useEffect, useMemo,
} from "react";
import Map, { Source, Layer, Marker, MapRef } from "react-map-gl/maplibre";
import type { MapMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Coord      = [number, number];            // [lng, lat]
type Mode       = "draw" | "gps";
type GpsStatus  = "idle" | "requesting" | "tracking" | "stopped" | "error";

/* ─── Indian state units ─────────────────────────────────────────────────── */
interface StateUnit   { label: string; sqm: number; primary?: boolean }
interface StateConfig { code: string; name: string; units: StateUnit[] }

const STATES: StateConfig[] = [
  { code:"UP",    name:"Uttar Pradesh",    units:[{label:"Pucca Bigha",sqm:2529.28,primary:true},{label:"Kachha Bigha",sqm:843.09},{label:"Bissa",sqm:126.46}] },
  { code:"MP",    name:"Madhya Pradesh",   units:[{label:"Bigha",sqm:1333.33,primary:true},{label:"Biswa",sqm:66.67}] },
  { code:"RJ",    name:"Rajasthan",        units:[{label:"Bigha",sqm:2529.28,primary:true},{label:"Biswa",sqm:126.46}] },
  { code:"BR",    name:"Bihar",            units:[{label:"Bigha",sqm:2529.28,primary:true},{label:"Kattha",sqm:126.46},{label:"Dhur",sqm:16.93}] },
  { code:"WB",    name:"West Bengal",      units:[{label:"Bigha",sqm:1337.8,primary:true},{label:"Katha",sqm:66.89},{label:"Dhur",sqm:3.34}] },
  { code:"PB",    name:"Punjab",           units:[{label:"Kanal",sqm:505.857,primary:true},{label:"Marla",sqm:25.29}] },
  { code:"HR",    name:"Haryana",          units:[{label:"Bigha",sqm:2529.28,primary:true},{label:"Kanal",sqm:505.857},{label:"Marla",sqm:25.29}] },
  { code:"MH",    name:"Maharashtra",      units:[{label:"Guntha",sqm:101.17,primary:true},{label:"Bigha",sqm:1619.21}] },
  { code:"GJ",    name:"Gujarat",          units:[{label:"Vigha",sqm:1681.25,primary:true},{label:"Vaar",sqm:0.836}] },
  { code:"TN",    name:"Tamil Nadu",       units:[{label:"Cent",sqm:40.47,primary:true},{label:"Ground",sqm:222.97}] },
  { code:"KA",    name:"Karnataka",        units:[{label:"Guntha",sqm:101.17,primary:true},{label:"Acre",sqm:4046.86}] },
  { code:"AP",    name:"Andhra Pradesh",   units:[{label:"Cent",sqm:40.47,primary:true},{label:"Acre",sqm:4046.86}] },
  { code:"TG",    name:"Telangana",        units:[{label:"Cent",sqm:40.47,primary:true},{label:"Acre",sqm:4046.86}] },
  { code:"KL",    name:"Kerala",           units:[{label:"Cent",sqm:40.47,primary:true},{label:"Are(100m²)",sqm:100}] },
  { code:"OD",    name:"Odisha",           units:[{label:"Decimal",sqm:40.47,primary:true},{label:"Acre",sqm:4046.86}] },
  { code:"AS",    name:"Assam",            units:[{label:"Bigha",sqm:1337.8,primary:true},{label:"Katha",sqm:66.89},{label:"Lecha",sqm:3.34}] },
  { code:"JH",    name:"Jharkhand",        units:[{label:"Bigha",sqm:2529.28,primary:true},{label:"Kattha",sqm:126.46}] },
  { code:"CG",    name:"Chhattisgarh",     units:[{label:"Bigha",sqm:1333.33,primary:true},{label:"Biswa",sqm:66.67}] },
  { code:"HP2",   name:"Himachal Pradesh", units:[{label:"Bigha",sqm:843.09,primary:true},{label:"Biswa",sqm:42.15}] },
  { code:"UK",    name:"Uttarakhand",      units:[{label:"Nali",sqm:2160,primary:true},{label:"Mutthi",sqm:540}] },
  { code:"GA",    name:"Goa",              units:[{label:"Acre",sqm:4046.86,primary:true},{label:"Guntha",sqm:101.17}] },
  { code:"GLOBAL",name:"🌐 International", units:[{label:"Hectare",sqm:10000,primary:true},{label:"Acre",sqm:4046.86}] },
];

/* ─── Map style ─────────────────────────────────────────────────────────── */
const SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    sat: { type:"raster", tiles:["/api/tiles/{z}/{x}/{y}"], tileSize:256,
           attribution:"© Esri / OpenStreetMap", maxzoom:18 },
  },
  layers: [
    { id:"background", type:"background", paint:{ "background-color":"#1a2e1a" } },
    { id:"sat",        type:"raster",     source:"sat", minzoom:0, maxzoom:22 },
  ],
};

/* ─── Empty GeoJSON sentinels ─────────────────────────────────────────────── */
const EMPTY_LINE: any = { type:"Feature", geometry:{ type:"LineString", coordinates:[] }, properties:{} };
const EMPTY_POLY: any = { type:"Feature", geometry:{ type:"Polygon",    coordinates:[[]] }, properties:{} };

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-IN", { maximumFractionDigits:d, minimumFractionDigits:d });

function shapeLabel(n: number): string {
  if (n < 2)  return "";
  if (n === 2) return "Line";
  if (n === 3) return "Triangle";
  if (n === 4) return "Quadrilateral";
  if (n === 5) return "Pentagon";
  if (n === 6) return "Hexagon";
  return `Polygon (${n} corners)`;
}

function calcArea(pts: Coord[]): number {
  if (pts.length < 3) return 0;
  try {
    const deduped: Coord[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const d = turf.distance(turf.point(deduped[deduped.length-1]), turf.point(pts[i]), { units:"meters" });
      if (d > 0.3) deduped.push(pts[i]);
    }
    if (deduped.length < 3) return 0;
    const poly = turf.polygon([[...deduped, deduped[0]]]);
    return turf.area(turf.rewind(poly, { reverse:false, mutate:false }));
  } catch { return 0; }
}

function calcPerimeter(pts: Coord[]): number {
  if (pts.length < 2) return 0;
  const ring = [...pts, pts[0]];
  let d = 0;
  for (let i = 1; i < ring.length; i++)
    d += turf.distance(turf.point(ring[i-1]), turf.point(ring[i]), { units:"meters" });
  return d;
}

/* ─── Nominatim types ────────────────────────────────────────────────────── */
interface NomResult {
  place_id: number; display_name: string;
  lat: string; lon: string;
  type?: string; class?: string;
}

function placeIcon(r: NomResult) {
  const t = r.type ?? ""; const c = r.class ?? "";
  if (t==="village"||t==="hamlet")         return { icon:"🏡", badge:"Gaon" };
  if (t==="town")                          return { icon:"🏘️", badge:"Kasba" };
  if (t==="city")                          return { icon:"🏙️", badge:"Shahar" };
  if (t==="district"||t==="county")        return { icon:"🗺️", badge:"Zila" };
  if (t==="state"||t==="administrative")   return { icon:"🏛️", badge:"Rajya" };
  if (t==="country")                       return { icon:"🌍", badge:"Desh" };
  if (t==="farm"||t==="farmland")          return { icon:"🌾", badge:"Khet" };
  if (c==="highway"||t==="road")           return { icon:"🛣️", badge:"Sadak" };
  if (c==="waterway"||t==="river")         return { icon:"🌊", badge:"Nadi" };
  if (c==="amenity"||c==="shop"||c==="tourism"||c==="leisure") {
    if (t==="cafe"||t==="restaurant")      return { icon:"☕", badge:"Cafe" };
    if (t==="college"||t==="school"||t==="university") return { icon:"🎓", badge:"School" };
    if (t==="mall"||t==="supermarket")     return { icon:"🛍️", badge:"Mall" };
    if (t==="hospital"||t==="clinic")      return { icon:"🏥", badge:"Hospital" };
    return { icon:"📌", badge:"POI" };
  }
  if (c==="building"||c==="office")        return { icon:"🏢", badge:"Building" };
  return { icon:"📍", badge:"Location" };
}

/* ─── LocationSearch component ───────────────────────────────────────────── */
function LocationSearch({ onSelect }: { onSelect:(lat:number,lon:number)=>void }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<NomResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const debRef   = useRef<ReturnType<typeof setTimeout>|null>(null);
  const boxRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    const q = query.trim();
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    debRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error();
        const data: NomResult[] = await res.json();
        setResults(data); setOpen(data.length > 0);
      } catch {
        setResults([]); setOpen(false);
      } finally { setLoading(false); }
    }, 380);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const clear = () => { setQuery(""); setResults([]); setOpen(false); inputRef.current?.focus(); };
  const noResult = !loading && open && results.length === 0 && query.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative w-full" style={{ zIndex:50 }}>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-sm pointer-events-none">🔍</span>
        <input
          ref={inputRef} type="text" value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Gaon, Shahar, Cafe, Mall… kuch bhi dhundhen"
          autoComplete="off" autoCorrect="off" spellCheck={false}
          className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm text-white
            bg-black/80 border border-white/25 placeholder-white/30
            outline-none focus:border-emerald-400/80 backdrop-blur-md
            transition-all shadow-lg"
          style={{ WebkitAppearance:"none" }}
        />
        {loading
          ? <span className="absolute right-3 w-4 h-4 rounded-full border-2 border-emerald-400/40 border-t-emerald-400 animate-spin" />
          : query
            ? <button onMouseDown={e => { e.preventDefault(); clear(); }}
                className="absolute right-3 w-5 h-5 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white/70 text-xs transition-all">✕</button>
            : null}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl overflow-hidden shadow-2xl border border-emerald-900/60 bg-[#050e07]/98 backdrop-blur-xl">
          <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{results.length} result{results.length>1?"s":""}</span>
            <span className="text-[10px] text-gray-700">© OSM</span>
          </div>
          {results.map((r, idx) => {
            const { icon, badge } = placeIcon(r);
            const name = r.display_name.split(",")[0].trim();
            const sub  = r.display_name.split(",").slice(1,4).join(",").trim();
            return (
              <button key={r.place_id}
                onClick={() => { onSelect(parseFloat(r.lat), parseFloat(r.lon)); setQuery(name); setOpen(false); }}
                className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3
                  hover:bg-emerald-900/35 transition-colors active:bg-emerald-900/50
                  ${idx < results.length-1 ? "border-b border-white/4" : ""}`}>
                <span className="text-lg flex-shrink-0">{icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 text-emerald-400/80 border-emerald-700/40 bg-emerald-900/20">{badge}</span>
                  </div>
                  {sub && <p className="text-[11px] text-gray-500 truncate mt-0.5">{sub}</p>}
                </div>
                <span className="text-gray-600 text-sm flex-shrink-0">→</span>
              </button>
            );
          })}
        </div>
      )}
      {noResult && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl border border-white/5 bg-black/85 backdrop-blur-md px-4 py-3 text-center shadow-xl">
          <p className="text-sm text-gray-400">Koi jagah nahi mili 😕</p>
          <p className="text-[11px] text-gray-600 mt-0.5">Spelling jaanchein ya alag naam try karein</p>
        </div>
      )}
    </div>
  );
}

/* ─── GPS signal badge ───────────────────────────────────────────────────── */
function AccBadge({ acc }: { acc:number }) {
  const good = acc<=5, ok = acc<=15;
  return (
    <div className={`flex items-center gap-2.5 rounded-xl p-3 border ${
      good ? "bg-emerald-900/30 border-emerald-700/40"
           : ok ? "bg-yellow-900/25 border-yellow-700/30"
                : "bg-red-900/20 border-red-700/25"}`}>
      <span className="text-xl">{good?"🟢":ok?"🟡":"🔴"}</span>
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">GPS Accuracy</p>
        <p className={`text-xl font-black ${good?"text-emerald-300":ok?"text-yellow-300":"text-red-300"}`}>
          ±{fmt(acc,0)} m
        </p>
      </div>
      <p className="ml-auto text-xs text-gray-500 font-semibold">
        {good?"Badhiya 👍":ok?"Theek hai":"Kamzor 📶"}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function FieldCalculator() {
  const mapRef   = useRef<MapRef>(null);
  const watchRef = useRef<number|null>(null);
  const ptsRef   = useRef<Coord[]>([]);

  /* ── State ────────────────────────────────────────────────────────────── */
  const [mode,          setMode]         = useState<Mode>("draw");
  const [points,        setPoints]       = useState<Coord[]>([]);
  const [gpsStatus,     setGpsStatus]    = useState<GpsStatus>("idle");
  const [gpsAcc,        setGpsAcc]       = useState<number|null>(null);
  const [gpsPos,        setGpsPos]       = useState<Coord|null>(null);
  const [gpsErr,        setGpsErr]       = useState("");
  const [userLoc,       setUserLoc]      = useState<Coord|null>(null);
  const [locating,      setLocating]     = useState(false);
  const [mousePos,      setMousePos]     = useState<Coord|null>(null);
  const [stateCode,     setStateCode]    = useState("UP");
  const [mapFullscreen, setMapFullscreen] = useState(false);

  useEffect(() => { ptsRef.current = points; }, [points]);

  const stateCfg  = useMemo(() => STATES.find(s => s.code===stateCode)!, [stateCode]);
  const area      = useMemo(() => calcArea(points),      [points]);
  const perimeter = useMemo(() => calcPerimeter(points), [points]);
  const shape     = useMemo(() => shapeLabel(points.length), [points.length]);
  const hasLine   = points.length >= 2;

  /* ── Map pan ──────────────────────────────────────────────────────────── */
  const panMap = useCallback((dx:number, dy:number) => {
    mapRef.current?.panBy([dx, dy], { duration:400 });
  }, []);

  /* ── Locate Me ──────────────────────────────────────────────────────────── */
  const locateMe = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c: Coord = [pos.coords.longitude, pos.coords.latitude];
        setUserLoc(c);
        mapRef.current?.flyTo({ center:c, zoom:18, duration:1200 });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy:true, timeout:10000 }
    );
  }, []);

  /* ── Draw mode: add point on click ────────────────────────────────────── */
  const onMapClick = useCallback((e: MapMouseEvent) => {
    if (mode !== "draw") return;
    const c: Coord = [e.lngLat.lng, e.lngLat.lat];
    setPoints(p => [...p, c]);
  }, [mode]);

  const onMouseMove = useCallback((e: MapMouseEvent) => {
    if (mode === "draw") setMousePos([e.lngLat.lng, e.lngLat.lat]);
    else setMousePos(null);
  }, [mode]);

  const onMouseLeave = useCallback(() => setMousePos(null), []);

  /* ── Controls ─────────────────────────────────────────────────────────── */
  const undo = useCallback(() => {
    setPoints(p => p.slice(0,-1));
  }, []);

  const clearAll = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setPoints([]); setGpsStatus("idle"); setGpsAcc(null);
    setGpsPos(null); setGpsErr(""); setMousePos(null);
  }, []);

  const switchMode = useCallback((m: Mode) => {
    clearAll(); setMode(m);
  }, [clearAll]);

  /* ── GPS mode ─────────────────────────────────────────────────────────── */
  const startGPS = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGpsErr("GPS is device par available nahi hai");
      setGpsStatus("error");
      return;
    }
    setGpsStatus("requesting"); setGpsErr("");
    setPoints([]); ptsRef.current = [];

    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const c: Coord = [pos.coords.longitude, pos.coords.latitude];
        setGpsAcc(pos.coords.accuracy);
        setGpsPos(c);
        setGpsStatus("tracking");
        setPoints(prev => {
          if (prev.length > 0) {
            const d = turf.distance(
              turf.point(prev[prev.length-1]), turf.point(c), { units:"meters" }
            );
            if (d < 1) return prev;
          }
          return [...prev, c];
        });
        mapRef.current?.flyTo({ center:c, zoom:19, duration:600 });
      },
      err => {
        const msgs: Record<number,string> = {
          1: "Location permission nahi mila. Settings mein GPS allow karein.",
          2: "GPS signal nahi mila. Bahar jaayein.",
          3: "GPS timeout. Dobara try karein.",
        };
        setGpsErr(msgs[err.code] || "GPS error.");
        setGpsStatus("error");
        if (watchRef.current !== null) {
          navigator.geolocation.clearWatch(watchRef.current);
          watchRef.current = null;
        }
      },
      { enableHighAccuracy:true, maximumAge:0, timeout:15000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setGpsStatus("stopped");
  }, []);

  useEffect(() => () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  /* ── GeoJSON data ─────────────────────────────────────────────────────── */
  const closedRingCoords = useMemo(
    () => points.length >= 2 ? [...points, points[0]] : [],
    [points]
  );

  // Polygon fill (needs 3+ pts)
  const polyData = useMemo((): any => {
    if (points.length < 3) return EMPTY_POLY;
    return {
      type:"Feature",
      geometry:{ type:"Polygon", coordinates:[closedRingCoords] },
      properties:{},
    };
  }, [points, closedRingCoords]);

  // Border line — always closed ring from 2+ points
  const borderData = useMemo((): any => {
    if (points.length < 2) return EMPTY_LINE;
    return {
      type:"Feature",
      geometry:{ type:"LineString", coordinates:closedRingCoords },
      properties:{},
    };
  }, [points, closedRingCoords]);

  // Preview polygon that follows cursor
  const previewPolyData = useMemo((): any => {
    if (mode !== "draw" || points.length < 2 || !mousePos) return EMPTY_POLY;
    const ring = [...points, mousePos, points[0]];
    if (ring.length < 4) return EMPTY_POLY;
    try {
      return {
        type:"Feature",
        geometry:{ type:"Polygon", coordinates:[ring] },
        properties:{},
      };
    } catch { return EMPTY_POLY; }
  }, [mode, points, mousePos]);

  // Rubber-band: last placed point → cursor
  const rubberData = useMemo((): any => {
    if (mode !== "draw" || points.length < 1 || !mousePos) return EMPTY_LINE;
    return {
      type:"Feature",
      geometry:{ type:"LineString", coordinates:[points[points.length-1], mousePos] },
      properties:{},
    };
  }, [mode, points, mousePos]);

  // GPS accuracy circle
  const accCircleData = useMemo((): any =>
    gpsPos && gpsAcc
      ? turf.circle(gpsPos, gpsAcc, { units:"meters", steps:48 })
      : EMPTY_POLY,
    [gpsPos, gpsAcc]
  );

  const fillColor   = mode==="gps" ? "#3b82f6" : "#22ff7a";
  const borderColor = mode==="gps" ? "#60a5fa" : "#e53e3e";
  const glowColor   = mode==="gps" ? "#93c5fd" : "#fc8181";

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-emerald-900/30 bg-[#071a0d] flex flex-col">

      {/* ════ MAP ══════════════════════════════════════════════════════════ */}
      <div
        className="relative w-full flex-shrink-0 transition-all duration-300"
        style={{
          height: mapFullscreen ? "100dvh" : "min(62vh,540px)",
          position: mapFullscreen ? "fixed" : "relative",
          inset: mapFullscreen ? 0 : undefined,
          zIndex: mapFullscreen ? 9999 : undefined,
          cursor: mode==="draw" ? "crosshair" : "default",
        }}
      >
        <Map
          ref={mapRef}
          initialViewState={{ longitude:77.4538, latitude:28.6692, zoom:15, pitch:0 }}
          mapStyle={SATELLITE_STYLE}
          onClick={onMapClick}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          doubleClickZoom={false}
          style={{ width:"100%", height:"100%" }}
        >
          {/* ── Live preview polygon ─── */}
          <Source id="preview-poly" type="geojson" data={previewPolyData}>
            <Layer id="preview-fill" type="fill"
              paint={{ "fill-color":fillColor, "fill-opacity":0.10 }}
            />
          </Source>

          {/* ── Confirmed polygon fill ── */}
          <Source id="poly" type="geojson" data={polyData}>
            <Layer id="poly-fill" type="fill"
              paint={{ "fill-color":fillColor, "fill-opacity": mode==="gps" ? 0.4 : 0.48 }}
            />
          </Source>

          {/* ── Closed border ring ── */}
          <Source id="border" type="geojson" data={borderData}>
            <Layer id="border-glow" type="line"
              layout={{ "line-cap":"round", "line-join":"round" }}
              paint={{ "line-color":glowColor, "line-width":10, "line-blur":7, "line-opacity":0.35 }}
            />
            <Layer id="border-solid" type="line"
              layout={{ "line-cap":"round", "line-join":"round" }}
              paint={{ "line-color":borderColor, "line-width":2.5 }}
            />
          </Source>

          {/* ── Rubber-band ─── */}
          <Source id="rubber" type="geojson" data={rubberData}>
            <Layer id="rubber-l" type="line"
              paint={{ "line-color":"#67e8f9", "line-width":2, "line-dasharray":[4,4], "line-opacity":0.85 }}
            />
          </Source>

          {/* ── GPS accuracy circle ── */}
          <Source id="gps-acc" type="geojson" data={accCircleData}>
            <Layer id="gps-acc-fill"   type="fill" paint={{ "fill-color":"#3b82f6","fill-opacity":0.07 }} />
            <Layer id="gps-acc-border" type="line" paint={{ "line-color":"#60a5fa","line-width":1.5,"line-opacity":0.45 }} />
          </Source>

          {/* ── Current GPS position dot ── */}
          {gpsPos && (
            <Marker longitude={gpsPos[0]} latitude={gpsPos[1]} anchor="center">
              <div style={{ position:"relative", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ position:"absolute", width:32, height:32, borderRadius:"50%",
                  background:"rgba(59,130,246,0.3)", animation:"pulse 1.5s ease-in-out infinite" }} />
                <div style={{ width:14, height:14, borderRadius:"50%", background:"#93c5fd",
                  border:"2.5px solid white", boxShadow:"0 2px 8px rgba(0,0,0,0.4)", zIndex:2 }} />
              </div>
            </Marker>
          )}

          {/* ── "You are here" from Locate Me ── */}
          {userLoc && !gpsPos && (
            <Marker longitude={userLoc[0]} latitude={userLoc[1]} anchor="center">
              <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ position:"absolute", width:28, height:28, borderRadius:"50%",
                  background:"rgba(139,92,246,0.25)", animation:"pulse 2s ease-in-out infinite" }} />
                <div style={{ width:12, height:12, borderRadius:"50%", background:"#a78bfa",
                  border:"2.5px solid white", boxShadow:"0 2px 6px rgba(0,0,0,0.4)", zIndex:2, position:"relative" }} />
              </div>
            </Marker>
          )}

          {/* ── Small numbered dot markers on every vertex ── */}
          {points.map((p, i) => {
            const isFirst = i === 0;
            const dotSize = isFirst ? 18 : 14;
            const dotColor = isFirst
              ? (mode === "gps" ? "#60a5fa" : "#22ff7a")
              : (mode === "gps" ? "#93c5fd" : "#86efac");
            const borderCol = isFirst
              ? (mode === "gps" ? "#1d4ed8" : "#15803d")
              : (mode === "gps" ? "#3b82f6" : "#16a34a");

            return (
              <Marker key={`dot-${i}`} longitude={p[0]} latitude={p[1]} anchor="center" style={{ zIndex:10 }}>
                <div style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: dotSize + 16,
                  height: dotSize + 16,
                }}>
                  {/* Dot */}
                  <div style={{
                    width: dotSize,
                    height: dotSize,
                    borderRadius: "50%",
                    background: dotColor,
                    border: `2px solid ${borderCol}`,
                    boxShadow: `0 0 0 2px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.5)`,
                    zIndex: 2,
                    position: "relative",
                  }}>
                    {/* Pulse ring for first point */}
                    {isFirst && (
                      <div style={{
                        position: "absolute",
                        inset: -5,
                        borderRadius: "50%",
                        border: `2px solid ${dotColor}`,
                        opacity: 0.6,
                        animation: "dotPulse 1.6s ease-in-out infinite",
                      }} />
                    )}
                  </div>
                  {/* Number label */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%) translateY(-100%)",
                    background: "rgba(0,0,0,0.82)",
                    color: dotColor,
                    fontSize: 10,
                    fontWeight: 900,
                    lineHeight: 1,
                    padding: "2px 5px",
                    borderRadius: 4,
                    border: `1px solid ${borderCol}`,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                    letterSpacing: "0.02em",
                    marginBottom: 2,
                  }}>
                    {i + 1}
                  </div>
                </div>
              </Marker>
            );
          })}
        </Map>

        {/* ── Live area badge ── */}
        <div className="absolute top-3 left-14 z-40 pointer-events-none">
          {area > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border shadow-lg text-sm font-black ${
              mode==="gps" ? "bg-blue-900/90 border-blue-500/50 text-blue-100"
                           : "bg-emerald-900/90 border-emerald-500/50 text-emerald-100"}`}>
              <span>{mode==="gps"?"📍":"📐"}</span>
              <span>{fmt(area,0)} m²</span>
              {shape && <span className="text-[10px] font-bold opacity-70 ml-1">({shape})</span>}
            </div>
          )}
        </div>

        {/* ── Search bar ── */}
        <div className="absolute top-3 right-14 z-40" style={{ left:"8rem" }}>
          <LocationSearch
            onSelect={(lat,lon) => mapRef.current?.flyTo({ center:[lon,lat], zoom:17, duration:1200 })}
          />
        </div>

        {/* ── Fullscreen + Locate Me ── */}
        <div className="absolute top-3 right-3 z-40 flex flex-col gap-2">
          <button onClick={() => setMapFullscreen(f => !f)}
            className="w-10 h-10 rounded-xl bg-black/75 border border-white/20 backdrop-blur-md flex items-center justify-center text-base hover:bg-emerald-900/80 hover:border-emerald-500/60 transition-all shadow-lg"
            title={mapFullscreen ? "Normal view" : "Full screen"}>
            {mapFullscreen ? "⊠" : "⛶"}
          </button>
          <button onClick={locateMe} disabled={locating}
            className="w-10 h-10 rounded-xl bg-black/75 border border-white/20 backdrop-blur-md flex items-center justify-center text-base hover:bg-emerald-900/80 hover:border-emerald-500/60 transition-all disabled:opacity-50 shadow-lg"
            title="Meri location">
            {locating
              ? <span className="w-4 h-4 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
              : "📍"}
          </button>
        </div>

        {/* ── D-Pad ── */}
        <div className="absolute left-3 bottom-16 z-40 flex flex-col items-center gap-1 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-xl">
          <button onClick={() => panMap(0,-120)} className="w-8 h-8 flex items-center justify-center rounded-[10px] bg-white/10 hover:bg-emerald-600/60 active:scale-90 text-white/90 transition-all font-black text-xs">▲</button>
          <div className="flex gap-1">
            <button onClick={() => panMap(-120,0)} className="w-8 h-8 flex items-center justify-center rounded-[10px] bg-white/10 hover:bg-emerald-600/60 active:scale-90 text-white/90 transition-all font-black text-xs">◀</button>
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500/10 text-[9px] font-bold text-emerald-300 pointer-events-none opacity-80">PAN</div>
            <button onClick={() => panMap(120,0)}  className="w-8 h-8 flex items-center justify-center rounded-[10px] bg-white/10 hover:bg-emerald-600/60 active:scale-90 text-white/90 transition-all font-black text-xs">▶</button>
          </div>
          <button onClick={() => panMap(0,120)}  className="w-8 h-8 flex items-center justify-center rounded-[10px] bg-white/10 hover:bg-emerald-600/60 active:scale-90 text-white/90 transition-all font-black text-xs">▼</button>
        </div>

        {/* ── Draw mode action bar ── */}
        {mode==="draw" && (
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2">
            <button onClick={undo} disabled={points.length===0}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-sm text-white
                bg-black/75 border border-white/15 backdrop-blur-sm hover:bg-white/10 transition-all
                disabled:opacity-30 disabled:cursor-not-allowed">
              ↩ Undo
            </button>
            <button onClick={clearAll} disabled={points.length===0}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-sm
                bg-red-900/60 border border-red-700/35 text-red-300 backdrop-blur-sm hover:bg-red-800/80
                transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              🗑 Clear
            </button>
            {points.length >= 2 && (
              <div className="flex-1 text-center pointer-events-none">
                <span className="text-xs font-bold bg-black/65 text-white/70 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                  {shape} · {points.length} points
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── GPS mode action bar ── */}
        {mode==="gps" && (
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2">
            {(gpsStatus==="idle"||gpsStatus==="error") && (
              <button onClick={startGPS}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600/95 hover:bg-blue-500
                  text-white text-sm font-black py-3.5 rounded-xl border border-blue-400/50
                  backdrop-blur-sm shadow-lg transition-all active:scale-95">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                Start Walking
              </button>
            )}
            {(gpsStatus==="tracking"||gpsStatus==="requesting") && (<>
              <div className="flex items-center gap-2 bg-black/75 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-white/10 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-white/70 font-semibold">
                  {gpsStatus==="requesting" ? "Signal dhundh raha…" : `${points.length} pts`}
                </span>
              </div>
              <button onClick={stopGPS}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600/95 hover:bg-red-500
                  text-white text-sm font-black py-3 rounded-xl border border-red-400/50
                  backdrop-blur-sm shadow-lg transition-all active:scale-95">
                ⏹ Stop Walking
              </button>
            </>)}
            {(gpsStatus==="stopped"||gpsStatus==="error") && (<>
              <button onClick={undo} disabled={points.length===0}
                className="px-4 py-3 rounded-xl font-bold text-sm text-white bg-black/75 border border-white/15 backdrop-blur-sm hover:bg-white/10 transition-all disabled:opacity-30">
                ↩ Undo
              </button>
              <button onClick={clearAll}
                className="px-4 py-3 rounded-xl font-bold text-sm bg-red-900/60 border border-red-700/35 text-red-300 backdrop-blur-sm hover:bg-red-800/80 transition-all">
                🗑 Clear
              </button>
              <button onClick={startGPS}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600/95 hover:bg-blue-500 text-white text-sm font-black py-3 rounded-xl border border-blue-400/50 backdrop-blur-sm transition-all active:scale-95">
                🔄 Start Again
              </button>
            </>)}
            {gpsErr && (
              <div className="flex-1 text-center pointer-events-none">
                <span className="text-xs font-semibold bg-red-900/80 text-red-300 px-3 py-1.5 rounded-full backdrop-blur-sm border border-red-700/40">
                  ❌ {gpsErr}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="absolute bottom-1.5 right-2 z-10 text-[9px] text-white/20 pointer-events-none">
          © Esri / OpenStreetMap
        </div>
      </div>

      {/* ════ MODE SWITCHER ══════════════════════════════════════════════════ */}
      <div className="flex border-t border-b border-emerald-900/30 flex-shrink-0">
        {(["draw","gps"] as Mode[]).map(m => (
          <button key={m} onClick={() => switchMode(m)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-black transition-all ${
              mode===m
                ? m==="draw"
                  ? "bg-emerald-700/40 text-emerald-200 border-b-2 border-emerald-400"
                  : "bg-blue-700/30 text-blue-200 border-b-2 border-blue-400"
                : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
            {m==="draw" ? "🗺️ Map se Banao" : "🚶 GPS Walk"}
          </button>
        ))}
      </div>

      {/* ════ BOTTOM PANEL ══════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">

        {/* Left: instructions + GPS badge */}
        <div className="md:w-[40%] flex-shrink-0 border-r border-emerald-900/20 p-4 space-y-3 bg-[#040f07]">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
            {mode==="draw" ? "Khet Naapne ke Steps" : "GPS Walk se Naapne ke Steps"}
          </p>

          {mode==="draw" ? (<>
            {[
              { n:1, done:points.length>=1, text:"Map par khet ka 1st corner tap karein",       hint:"Search se gaon dhundhen, phir map tap karein" },
              { n:2, done:points.length>=2, text:"2nd corner tap karein → Line ban jayegi",       hint:"Corners ke beech line automatically aayegi" },
              { n:3, done:points.length>=3, text:"3rd tap → Triangle, 4th → Quad, 5th → Polygon",hint:"Shape automatically band hoti rehti hai" },
              { n:4, done:area>0,           text:"Area neeche dikhai dega",                       hint:"Jitne corners, utni accurate measurement" },
            ].map(s => (
              <div key={s.n} className={`flex gap-3 items-start rounded-xl p-3 border transition-all ${
                s.done ? "bg-emerald-900/25 border-emerald-700/40" : "bg-[#071a0d] border-emerald-900/20"}`}>
                <span className={`w-7 h-7 rounded-lg text-sm font-black flex items-center justify-center flex-shrink-0 ${
                  s.done ? "bg-emerald-500/30 border border-emerald-500/50 text-emerald-200"
                         : "bg-emerald-900/25 border border-emerald-800/40 text-emerald-600"}`}>
                  {s.done ? "✓" : s.n}
                </span>
                <div>
                  <p className={`text-sm font-bold leading-snug ${s.done?"text-emerald-200":"text-white/80"}`}>{s.text}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{s.hint}</p>
                </div>
              </div>
            ))}
          </>) : (<>
            {[
              { n:1, done:gpsStatus!=="idle"&&gpsStatus!=="error", text:"\"Start Walking\" dabayein", hint:"Khet ki boundary pe jaayein" },
              { n:2, done:points.length>=5, text:`Khet ki seema par chalte rahein (${points.length} pts)`, hint:"Line real-time mein banti rehti hai" },
              { n:3, done:gpsStatus==="stopped", text:"\"Stop Walking\" dabayein", hint:"Wapis starting point ke paas aayein" },
            ].map(s => (
              <div key={s.n} className={`flex gap-3 items-start rounded-xl p-3 border transition-all ${
                s.done ? "bg-blue-900/25 border-blue-700/40" : "bg-[#071a0d] border-emerald-900/20"}`}>
                <span className={`w-7 h-7 rounded-lg text-sm font-black flex items-center justify-center flex-shrink-0 ${
                  s.done ? "bg-blue-500/30 border border-blue-500/50 text-blue-200"
                         : "bg-blue-900/25 border border-blue-800/40 text-blue-600"}`}>
                  {s.done ? "✓" : s.n}
                </span>
                <div>
                  <p className={`text-sm font-bold leading-snug ${s.done?"text-blue-200":"text-white/80"}`}>{s.text}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{s.hint}</p>
                </div>
              </div>
            ))}
            {gpsStatus==="tracking" && gpsAcc!==null && <AccBadge acc={gpsAcc} />}
          </>)}

          {/* Map legend */}
          <div className="pt-1 space-y-1">
            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Visual Guide</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {[
                { color: mode==="gps"?"#60a5fa":"#22ff7a", label:"Point 1 (Start)", dot:true, large:true },
                { color: mode==="gps"?"#93c5fd":"#86efac", label:"Other Points", dot:true, large:false },
                { color:borderColor, label:"Shape Border", thick:true },
                { color:fillColor, label:"Fill Area", fill:true },
                { color:"#67e8f9", label:"Next Edge Preview", dashed:true },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  {(l as any).dot ? (
                    <span style={{
                      width: (l as any).large ? 10 : 8,
                      height: (l as any).large ? 10 : 8,
                      borderRadius: "50%",
                      background: l.color,
                      border: "1.5px solid rgba(255,255,255,0.3)",
                      display: "inline-block",
                      flexShrink: 0,
                    }} />
                  ) : (
                    <span className="w-5 flex-shrink-0" style={{ height: (l as any).thick ? 3 : 2, borderRadius:2,
                      opacity: (l as any).fill ? 0.5 : 1,
                      background: (l as any).dashed
                        ? `repeating-linear-gradient(90deg,${l.color} 0,${l.color} 4px,transparent 4px,transparent 8px)`
                        : l.color }} />
                  )}
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="flex-1 overflow-y-auto">

          {/* State/unit selector */}
          <div className="px-4 pt-4 pb-3 border-b border-emerald-900/20">
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Apna Rajya Chunein</label>
            <select value={stateCode} onChange={e => setStateCode(e.target.value)}
              className="w-full bg-[#0d2418] text-white text-sm font-semibold border border-emerald-900/50
                rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600/50 cursor-pointer">
              {STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>

          <div className="p-4 space-y-2.5">
            {area > 0 ? (<>

              {/* Shape type + point count */}
              <div className={`rounded-xl px-4 py-2.5 border flex items-center gap-3 ${
                mode==="gps" ? "bg-blue-900/20 border-blue-700/30" : "bg-emerald-900/20 border-emerald-700/25"}`}>
                <span className="text-2xl">{mode==="gps"?"🚶":"📐"}</span>
                <div>
                  <p className={`text-xs font-bold ${mode==="gps"?"text-blue-300":"text-emerald-300"}`}>{shape}</p>
                  <p className="text-[11px] text-gray-500">{points.length} corner points marked</p>
                </div>
              </div>

              {/* Primary area card */}
              <div className="rounded-2xl p-4 border bg-gradient-to-br from-emerald-900/50 to-emerald-950/20 border-emerald-500/30">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-emerald-400">
                  {(gpsStatus==="stopped"||mode==="draw") ? "✅ Calculated Area" : "⏳ Live Area"}
                </p>
                <p className="text-5xl font-black tabular-nums leading-none text-emerald-100">
                  {fmt(area,0)}
                </p>
                <p className="text-sm mt-1 text-emerald-500/60">Varg Meter (m²)</p>
              </div>

              {/* Hectare + Acre */}
              <div className="grid grid-cols-2 gap-2">
                {[{l:"Hectare",v:area/10000},{l:"Acre",v:area/4046.86}].map(x => (
                  <div key={x.l} className="bg-[#0d2418] rounded-xl p-3.5 border border-emerald-900/30">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">{x.l}</p>
                    <p className="text-2xl font-black text-emerald-200 tabular-nums mt-0.5">{fmt(x.v)}</p>
                  </div>
                ))}
              </div>

              {/* State units */}
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">
                  {stateCfg.name} ki Sthaniya Maap
                </p>
                <div className="space-y-2">
                  {stateCfg.units.map(u => (
                    <div key={u.label} className={`rounded-xl p-3.5 border flex justify-between items-center ${
                      u.primary ? "bg-emerald-900/35 border-emerald-700/40" : "bg-[#0d2418] border-emerald-900/20"}`}>
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${u.primary?"text-emerald-400/70":"text-gray-600"}`}>{u.label}</p>
                        <p className={`font-black tabular-nums mt-0.5 ${u.primary?"text-3xl text-emerald-100":"text-xl text-gray-300"}`}>
                          {fmt(area/u.sqm)}
                        </p>
                      </div>
                      <span className="text-3xl opacity-15">🌾</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Perimeter */}
              {hasLine && (
                <div className="bg-[#0d2418] rounded-xl p-3.5 border border-emerald-900/20 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Seema ki Lambai (Perimeter)</p>
                    <p className="text-2xl font-black text-white tabular-nums mt-0.5">
                      {perimeter >= 1000 ? `${fmt(perimeter/1000,2)} km` : `${fmt(perimeter,0)} m`}
                    </p>
                  </div>
                  <span className="text-3xl opacity-15">📏</span>
                </div>
              )}

              {/* Accuracy note */}
              <div className="rounded-xl border border-white/5 bg-white/[0.015] p-3 text-center space-y-1">
                <p className="text-[10px] text-gray-500 font-bold">
                  {points.length} corners · Geodesic (WGS-84) · Turf.js
                </p>
                <p className="text-[10px] text-gray-700">±0.1% accuracy</p>
                {mode==="gps" && gpsAcc!==null && (
                  <p className={`text-[10px] font-bold ${gpsAcc<=5?"text-emerald-500":gpsAcc<=15?"text-yellow-500":"text-red-500"}`}>
                    GPS: ±{fmt(gpsAcc,0)} m {gpsAcc>15&&"— bahar jaayein signal ke liye"}
                  </p>
                )}
              </div>
            </>) : (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <div className="text-5xl animate-pulse">🌾</div>
                <div>
                  <p className="text-white font-black text-lg">Apna Khet Mapiye</p>
                  <p className="text-gray-600 text-xs mt-1 leading-relaxed max-w-[220px] mx-auto">
                    {mode==="draw"
                      ? "Map par khet ke corners tap karein — shape khud ban jayegi"
                      : "\"Start Walking\" dabayein aur khet ki boundary par chalein"}
                  </p>
                </div>
                {points.length===1 && mode==="draw" && (
                  <p className="text-emerald-400/80 text-xs font-semibold animate-pulse">
                    ✓ 1 point mila — ab 2nd corner tap karein
                  </p>
                )}
                {points.length===2 && mode==="draw" && (
                  <p className="text-amber-400/80 text-xs font-semibold animate-pulse">
                    ← Line ban gayi — 3rd corner tap karein → Triangle banega
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-emerald-900/20">
            <p className="text-[9px] text-gray-700 text-center">
              KrishiMitra · Imagery © Esri · Maps © OSM · Geocoding © Nominatim · Math by Turf.js
            </p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%,100% { transform:scale(1);   opacity:0.65; }
          50%      { transform:scale(1.5); opacity:0.1; }
        }
        @keyframes dotPulse {
          0%,100% { transform:scale(1);   opacity:0.7; }
          50%      { transform:scale(1.8); opacity:0; }
        }
      `}</style>
    </div>
  );
}