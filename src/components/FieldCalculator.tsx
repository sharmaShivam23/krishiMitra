"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Map, { Source, Layer, MapRef } from 'react-map-gl/maplibre';
import type { MapMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

type Coord = [number, number];
type Mode = 'draw' | 'gps';
type GpsStatus = 'idle' | 'requesting' | 'tracking' | 'complete' | 'error';

/* ── All Indian States with local land units ─────────────────────────────── */
interface StateUnit { label: string; sqm: number; primary?: boolean }
interface StateConfig { code: string; name: string; units: StateUnit[] }

const STATES: StateConfig[] = [
  { code:'UP',  name:'Uttar Pradesh',     units:[{label:'Pucca Bigha',sqm:2529.28,primary:true},{label:'Kachha Bigha',sqm:843.09},{label:'Bissa',sqm:126.46}]},
  { code:'MP',  name:'Madhya Pradesh',    units:[{label:'Bigha',sqm:1333.33,primary:true},{label:'Biswa',sqm:66.67}]},
  { code:'RJ',  name:'Rajasthan',         units:[{label:'Bigha',sqm:2529.28,primary:true},{label:'Biswa',sqm:126.46}]},
  { code:'BR',  name:'Bihar',             units:[{label:'Bigha',sqm:2529.28,primary:true},{label:'Kattha',sqm:126.46},{label:'Dhur',sqm:16.93}]},
  { code:'WB',  name:'West Bengal',       units:[{label:'Bigha',sqm:1337.8,primary:true},{label:'Katha',sqm:66.89},{label:'Dhur',sqm:3.34}]},
  { code:'PB',  name:'Punjab',            units:[{label:'Kanal',sqm:505.857,primary:true},{label:'Marla',sqm:25.29}]},
  { code:'HR',  name:'Haryana',           units:[{label:'Bigha',sqm:2529.28,primary:true},{label:'Kanal',sqm:505.857},{label:'Marla',sqm:25.29}]},
  { code:'MH',  name:'Maharashtra',       units:[{label:'Guntha',sqm:101.17,primary:true},{label:'Bigha',sqm:1619.21}]},
  { code:'GJ',  name:'Gujarat',           units:[{label:'Vigha',sqm:1681.25,primary:true},{label:'Vaar',sqm:0.836}]},
  { code:'TN',  name:'Tamil Nadu',        units:[{label:'Cent',sqm:40.47,primary:true},{label:'Ground',sqm:222.97}]},
  { code:'KA',  name:'Karnataka',         units:[{label:'Guntha',sqm:101.17,primary:true},{label:'Acre',sqm:4046.86}]},
  { code:'AP',  name:'Andhra Pradesh',    units:[{label:'Cent',sqm:40.47,primary:true},{label:'Acre',sqm:4046.86}]},
  { code:'TG',  name:'Telangana',         units:[{label:'Cent',sqm:40.47,primary:true},{label:'Acre',sqm:4046.86}]},
  { code:'KL',  name:'Kerala',            units:[{label:'Cent',sqm:40.47,primary:true},{label:'Are (100m²)',sqm:100}]},
  { code:'OD',  name:'Odisha',            units:[{label:'Decimal',sqm:40.47,primary:true},{label:'Acre',sqm:4046.86}]},
  { code:'AS',  name:'Assam',             units:[{label:'Bigha',sqm:1337.8,primary:true},{label:'Katha',sqm:66.89},{label:'Lecha',sqm:3.34}]},
  { code:'JH',  name:'Jharkhand',         units:[{label:'Bigha',sqm:2529.28,primary:true},{label:'Kattha',sqm:126.46}]},
  { code:'CG',  name:'Chhattisgarh',      units:[{label:'Bigha',sqm:1333.33,primary:true},{label:'Biswa',sqm:66.67}]},
  { code:'HP',  name:'Himachal Pradesh',  units:[{label:'Bigha',sqm:843.09,primary:true},{label:'Biswa',sqm:42.15}]},
  { code:'UK',  name:'Uttarakhand',       units:[{label:'Nali',sqm:2160,primary:true},{label:'Mutthi',sqm:540}]},
  { code:'GA',  name:'Goa',               units:[{label:'Acre',sqm:4046.86,primary:true},{label:'Guntha',sqm:101.17}]},
  { code:'GLOBAL', name:'🌐 International', units:[{label:'Hectare',sqm:10000,primary:true},{label:'Acre',sqm:4046.86}]},
];

const SATELLITE_STYLE: any = {
  version: 8,
  sources: { sat: { type:'raster', tiles:['/api/tiles/{z}/{x}/{y}'], tileSize:256, attribution:'© Esri', maxzoom:19 }},
  layers: [{ id:'sat', type:'raster', source:'sat', minzoom:0, maxzoom:22 }],
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const f = (n: number, d = 2) => n.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });

function calcArea(pts: Coord[]) {
  if (pts.length < 3) return 0;
  try { return turf.area(turf.polygon([[...pts, pts[0]]])); } catch { return 0; }
}
function calcPerimeter(pts: Coord[], closed = false) {
  if (pts.length < 2) return 0;
  const coords = closed && pts.length >= 3 ? [...pts, pts[0]] : pts;
  let d = 0;
  for (let i = 1; i < coords.length; i++)
    d += turf.distance(turf.point(coords[i-1]), turf.point(coords[i]), { units:'meters' });
  return d;
}

/* ── GPS accuracy badge ──────────────────────────────────────────────────── */
function AccBadge({ acc }: { acc: number }) {
  const good = acc <= 5, ok = acc <= 15;
  return (
    <div className={`flex items-center gap-2.5 rounded-xl p-3 border ${good ? 'bg-emerald-900/30 border-emerald-700/40' : ok ? 'bg-yellow-900/25 border-yellow-700/30' : 'bg-red-900/20 border-red-700/25'}`}>
      <span className="text-xl">{good ? '🟢' : ok ? '🟡' : '🔴'}</span>
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">GPS Accuracy</p>
        <p className={`text-lg font-black ${good ? 'text-emerald-300' : ok ? 'text-yellow-300' : 'text-red-300'}`}>±{f(acc, 1)} m</p>
      </div>
      <p className="ml-auto text-[10px] text-gray-600">{good ? 'Excellent' : ok ? 'Good' : 'Poor signal'}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function FieldCalculator() {
  const mapRef     = useRef<MapRef>(null);
  const watchRef   = useRef<number | null>(null);
  const ptsRef     = useRef<Coord[]>([]);
  const doneRef    = useRef(false);

  const [mode,       setMode]       = useState<Mode>('draw');
  const [points,     setPoints]     = useState<Coord[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [stateCode,  setStateCode]  = useState('UP');
  const [gpsStatus,  setGpsStatus]  = useState<GpsStatus>('idle');
  const [gpsAcc,     setGpsAcc]     = useState<number | null>(null);
  const [gpsPos,     setGpsPos]     = useState<Coord | null>(null);
  const [gpsErr,     setGpsErr]     = useState('');

  useEffect(() => { ptsRef.current = points;   }, [points]);
  useEffect(() => { doneRef.current = isComplete; }, [isComplete]);

  const stateCfg   = useMemo(() => STATES.find(s => s.code === stateCode)!, [stateCode]);
  const area       = useMemo(() => calcArea(points), [points]);
  const perimeter  = useMemo(() => calcPerimeter(points, isComplete), [points, isComplete]);

  /* ── Draw handlers ────────────────────────────────────────────────────── */
  const onMapClick = useCallback((e: MapMouseEvent) => {
    if (mode !== 'draw' || doneRef.current) return;
    setPoints(p => [...p, [e.lngLat.lng, e.lngLat.lat]]);
  }, [mode]);

  const onDblClick = useCallback((e: MapMouseEvent) => {
    e.preventDefault();
    if (mode !== 'draw') return;
    if (ptsRef.current.length >= 3) setIsComplete(true);
  }, [mode]);

  const finish = useCallback(() => {
    if (ptsRef.current.length >= 3) setIsComplete(true);
  }, []);

  const undo = useCallback(() => {
    if (doneRef.current) setIsComplete(false);
    else setPoints(p => p.slice(0, -1));
  }, []);

  /* ── GPS handlers ─────────────────────────────────────────────────────── */
  const startGPS = useCallback(() => {
    if (!('geolocation' in navigator)) { setGpsErr('GPS not available on this device'); setGpsStatus('error'); return; }
    setGpsStatus('requesting'); setGpsErr(''); setPoints([]); setIsComplete(false); doneRef.current = false;

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coord: Coord = [pos.coords.longitude, pos.coords.latitude];
        setGpsAcc(pos.coords.accuracy);
        setGpsPos(coord);
        setGpsStatus('tracking');
        setPoints(prev => {
          if (prev.length > 0) {
            const dist = turf.distance(turf.point(prev[prev.length - 1]), turf.point(coord), { units: 'meters' });
            if (dist < 3) return prev;
          }
          return [...prev, coord];
        });
        mapRef.current?.flyTo({ center: coord, zoom: 19, duration: 600 });
      },
      (err) => {
        const msgs: Record<number, string> = { 1: 'Location permission denied. Please allow GPS access.', 2: 'GPS signal not found. Go outside and try again.', 3: 'GPS timed out. Try again.' };
        setGpsErr(msgs[err.code] || 'GPS error. Try again.');
        setGpsStatus('error');
        if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    setGpsStatus('complete');
    if (ptsRef.current.length >= 3) setIsComplete(true);
  }, []);

  const reset = useCallback(() => {
    if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    setPoints([]); setIsComplete(false); setGpsStatus('idle'); setGpsAcc(null); setGpsPos(null); setGpsErr('');
  }, []);

  const switchMode = useCallback((m: Mode) => { reset(); setMode(m); }, [reset]);

  useEffect(() => () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current); }, []);

  /* ── GeoJSON ──────────────────────────────────────────────────────────── */
  const polyGeo: any = useMemo(() => points.length < 3 ? null : ({ type:'Feature', geometry:{ type:'Polygon', coordinates:[[...points, points[0]]] }, properties:{} }), [points]);
  const lineGeo: any = useMemo(() => points.length < 2 ? null : ({ type:'Feature', geometry:{ type:'LineString', coordinates: isComplete ? [...points, points[0]] : points }, properties:{} }), [points, isComplete]);
  const ptsGeo:  any = useMemo(() => ({ type:'FeatureCollection', features: points.map((p,i) => ({ type:'Feature', geometry:{ type:'Point', coordinates:p }, properties:{ isFirst: i===0 } })) }), [points]);
  const accGeo:  any = useMemo(() => gpsPos && gpsAcc ? turf.circle(gpsPos, gpsAcc, { units:'meters', steps:48 }) : null, [gpsPos, gpsAcc]);
  const posGeo:  any = useMemo(() => gpsPos ? { type:'Feature', geometry:{ type:'Point', coordinates:gpsPos }, properties:{} } : null, [gpsPos]);

  /* ── Status banner ────────────────────────────────────────────────────── */
  const status = useMemo(() => {
    if (isComplete) return { msg:'✅ Naap puri ho gayi! Results dekhen →', cls:'bg-emerald-900/80 border-emerald-500/40 text-emerald-200' };
    if (mode === 'gps') {
      if (gpsStatus === 'requesting') return { msg:'📡 GPS signal dhundh raha hai…', cls:'bg-blue-900/70 border-blue-500/30 text-blue-200' };
      if (gpsStatus === 'tracking')   return { msg:`🟢 GPS chal raha hai — khet ke kinare chalein (${points.length} points)`, cls:'bg-emerald-900/70 border-emerald-500/30 text-emerald-200' };
      if (gpsStatus === 'error')      return { msg:`❌ ${gpsErr}`, cls:'bg-red-900/70 border-red-500/30 text-red-300' };
      return { msg:'📍 Neeche "GPS Walk Shuru Karein" dabayein', cls:'bg-black/60 border-white/10 text-white/70' };
    }
    if (points.length === 0) return { msg:'👆 Map par click karke khet ke corner lagayein', cls:'bg-black/60 border-white/10 text-white/70' };
    if (points.length < 3)   return { msg:`📍 ${3 - points.length} aur point lagayen polygon ke liye`, cls:'bg-black/60 border-white/10 text-white/70' };
    return { msg:'✓ Double-click ya "Poora Karo" button dabayein', cls:'bg-lime-900/70 border-lime-500/30 text-lime-200' };
  }, [isComplete, mode, gpsStatus, points.length, gpsErr]);

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row w-full rounded-2xl overflow-hidden shadow-2xl border border-emerald-900/30" style={{ height:'clamp(620px,82vh,920px)' }}>

      {/* MAP */}
      <div className="relative w-full lg:w-[63%] h-[55%] lg:h-full" style={{ cursor: mode==='draw'&&!isComplete ? 'crosshair' : 'default' }}>

        {/* Mode switcher */}
        <div className="absolute top-3 left-3 z-20 flex gap-1.5">
          <button onClick={() => switchMode('draw')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border backdrop-blur-md shadow-lg transition-all ${mode==='draw' ? 'bg-emerald-700/90 border-emerald-400/40 text-white' : 'bg-black/60 border-white/15 text-white/60 hover:bg-white/10'}`}>
            🗺️ Map se Banao
          </button>
          <button onClick={() => switchMode('gps')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border backdrop-blur-md shadow-lg transition-all ${mode==='gps' ? 'bg-blue-700/90 border-blue-400/40 text-white' : 'bg-black/60 border-white/15 text-white/60 hover:bg-white/10'}`}>
            📍 GPS Walk
          </button>
        </div>

        <Map ref={mapRef} initialViewState={{ longitude:77.4538, latitude:28.6692, zoom:15, pitch:30 }}
          mapStyle={SATELLITE_STYLE} onClick={onMapClick} onDblClick={onDblClick}
          doubleClickZoom={false} style={{ width:'100%', height:'100%' }}>

          {polyGeo && <Source id="poly" type="geojson" data={polyGeo}>
            <Layer id="poly-fill"   type="fill" paint={{ 'fill-color':'#22c55e', 'fill-opacity': isComplete ? 0.28 : 0.12 }} />
            <Layer id="poly-border" type="line" paint={{ 'line-color':'#4ade80', 'line-width':2.5, 'line-dasharray': isComplete ? [1,0] : [5,3] }} />
          </Source>}

          {!polyGeo && lineGeo && <Source id="line" type="geojson" data={lineGeo}>
            <Layer id="line-l" type="line" paint={{ 'line-color':'#a3e635', 'line-width':2, 'line-dasharray':[4,2] }} />
          </Source>}

          {points.length > 0 && <Source id="pts" type="geojson" data={ptsGeo}>
            <Layer id="pts-glow" type="circle" paint={{ 'circle-radius':10, 'circle-color':['case',['==',['get','isFirst'],true],'#f59e0b','#22c55e'], 'circle-opacity':0.2 }} />
            <Layer id="pts-dot"  type="circle" paint={{ 'circle-radius':5,  'circle-color':['case',['==',['get','isFirst'],true],'#fbbf24','#4ade80'], 'circle-stroke-color':'#fff','circle-stroke-width':2 }} />
          </Source>}

          {accGeo && <Source id="gps-acc" type="geojson" data={accGeo}>
            <Layer id="gps-acc-fill"   type="fill" paint={{ 'fill-color':'#3b82f6','fill-opacity':0.1 }} />
            <Layer id="gps-acc-border" type="line" paint={{ 'line-color':'#60a5fa','line-width':1.5,'line-opacity':0.5 }} />
          </Source>}
          {posGeo && <Source id="gps-pos" type="geojson" data={posGeo}>
            <Layer id="gps-pos-halo" type="circle" paint={{ 'circle-radius':12,'circle-color':'#3b82f6','circle-opacity':0.25 }} />
            <Layer id="gps-pos-dot"  type="circle" paint={{ 'circle-radius':6, 'circle-color':'#93c5fd','circle-stroke-color':'#fff','circle-stroke-width':2 }} />
          </Source>}
        </Map>

        {/* Status pill */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-max max-w-[90%]">
          <div className={`text-xs font-semibold px-4 py-2 rounded-full border backdrop-blur-md shadow-lg ${status.cls}`}>{status.msg}</div>
        </div>

        {/* Draw controls */}
        {mode === 'draw' && points.length > 0 && (
          <div className="absolute bottom-4 left-3 right-3 z-10 flex items-center gap-2 flex-wrap">
            {!isComplete && points.length >= 3 && (
              <button onClick={finish} className="flex items-center gap-1 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl border border-emerald-400/40 backdrop-blur-sm shadow-lg transition-all hover:scale-105">✓ Poora Karo</button>
            )}
            <button onClick={undo}  className="bg-black/60 hover:bg-white/10 text-white/70 text-xs font-semibold px-3 py-2 rounded-xl border border-white/15 backdrop-blur-sm transition-all">↩ Undo</button>
            <button onClick={reset} className="bg-red-900/60 hover:bg-red-800/80 text-red-300 text-xs font-semibold px-3 py-2 rounded-xl border border-red-700/30 backdrop-blur-sm transition-all">🗑 Saaf Karo</button>
            <div className="ml-auto bg-black/50 text-white/40 text-[11px] px-3 py-1.5 rounded-lg border border-white/10">{points.length} corners</div>
          </div>
        )}

        {/* GPS controls */}
        {mode === 'gps' && (
          <div className="absolute bottom-4 left-3 right-3 z-10 flex items-center gap-2">
            {(gpsStatus === 'idle' || gpsStatus === 'error') && (
              <button onClick={startGPS} className="flex-1 flex items-center justify-center gap-2 bg-blue-600/90 hover:bg-blue-500 text-white text-sm font-black py-3 rounded-xl border border-blue-400/40 backdrop-blur-sm shadow-lg transition-all hover:scale-[1.02]">
                📍 GPS Walk Shuru Karein
              </button>
            )}
            {(gpsStatus === 'tracking' || gpsStatus === 'requesting') && (<>
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-white/70">{gpsStatus==='requesting' ? 'Signal dhundh raha hai…' : `${points.length} pts · ${f(perimeter,0)}m chale`}</span>
              </div>
              <button onClick={stopGPS} className="flex-1 flex items-center justify-center gap-2 bg-red-600/90 hover:bg-red-500 text-white text-sm font-black py-3 rounded-xl border border-red-400/40 backdrop-blur-sm shadow-lg transition-all">
                ⏹ Ruko &amp; Napo
              </button>
            </>)}
            {isComplete && (
              <button onClick={reset} className="bg-gray-800/70 text-gray-300 text-xs px-3 py-2.5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition">🔄 Dobara Naapen</button>
            )}
          </div>
        )}

        <div className="absolute bottom-1.5 right-2 z-10 text-[9px] text-white/20 pointer-events-none">© Esri</div>
      </div>

      {/* RESULTS PANEL */}
      <div className="w-full lg:w-[37%] h-[45%] lg:h-full flex flex-col bg-[#071a0d] border-l border-emerald-900/30 overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 bg-gradient-to-b from-[#0a2212] to-[#071a0d] border-b border-emerald-900/30 flex-shrink-0">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">KrishiMitra</p>
          <h2 className="text-base font-black text-white mt-0.5">Khet ki Naap</h2>
          <p className="text-emerald-500/40 text-[11px]">Sabhi Rajyon ke liye · Geodesic accuracy</p>
        </div>

        {/* State selector */}
        <div className="px-4 pt-4 pb-3 border-b border-emerald-900/20 flex-shrink-0">
          <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Apna Rajya Chunein (Select State)</label>
          <select value={stateCode} onChange={e => setStateCode(e.target.value)}
            className="w-full bg-[#0d2418] text-white text-sm font-semibold border border-emerald-900/50 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600/50 cursor-pointer">
            {STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </div>

        {/* GPS accuracy */}
        {mode === 'gps' && gpsStatus === 'tracking' && gpsAcc !== null && (
          <div className="px-4 pt-3 flex-shrink-0"><AccBadge acc={gpsAcc} /></div>
        )}

        {/* Results body */}
        <div className="flex-1 px-4 py-4 space-y-2.5">
          {area > 0 ? (<>

            {/* Primary sqm */}
            <div className={`rounded-2xl p-4 border transition-all duration-500 ${isComplete ? 'bg-gradient-to-br from-emerald-900/50 to-emerald-950/20 border-emerald-500/30' : 'bg-gradient-to-br from-amber-900/25 to-amber-950/10 border-amber-700/20'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isComplete ? 'text-emerald-400' : 'text-amber-500'}`}>{isComplete ? '✅ Final Naap' : '⏳ Live Preview'}</p>
              <p className={`text-4xl font-black tabular-nums leading-none ${isComplete ? 'text-emerald-100' : 'text-amber-100'}`}>{f(area, 1)}</p>
              <p className={`text-sm mt-0.5 ${isComplete ? 'text-emerald-500/50' : 'text-amber-500/40'}`}>Square Metres (Varg Meter)</p>
            </div>

            {/* Hectare + Acre always */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0d2418] rounded-xl p-3 border border-emerald-900/30">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Hectare</p>
                <p className="text-lg font-black text-emerald-200 tabular-nums">{f(area / 10000)}</p>
              </div>
              <div className="bg-[#0d2418] rounded-xl p-3 border border-emerald-900/30">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Acre</p>
                <p className="text-lg font-black text-emerald-200 tabular-nums">{f(area / 4046.86)}</p>
              </div>
            </div>

            {/* Local units */}
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">{stateCfg.name} ki Sthaniya Ikaiyan</p>
              <div className="space-y-2">
                {stateCfg.units.map(u => (
                  <div key={u.label} className={`rounded-xl p-3.5 border flex justify-between items-center ${u.primary ? 'bg-emerald-900/35 border-emerald-700/40' : 'bg-[#0d2418] border-emerald-900/20'}`}>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${u.primary ? 'text-emerald-400/70' : 'text-gray-600'}`}>{u.label}</p>
                      <p className={`font-black tabular-nums mt-0.5 ${u.primary ? 'text-2xl text-emerald-100' : 'text-lg text-gray-300'}`}>{f(area / u.sqm)}</p>
                    </div>
                    <span className="text-3xl opacity-20">🌾</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Perimeter */}
            {points.length >= 3 && (
              <div className="bg-[#0d2418] rounded-xl p-3.5 border border-emerald-900/20 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Seema ki Lambai (Perimeter)</p>
                  <p className="text-xl font-black text-white tabular-nums mt-0.5">
                    {perimeter >= 1000 ? `${f(perimeter/1000, 2)} km` : `${f(perimeter, 1)} m`}
                  </p>
                </div>
                <span className="text-3xl opacity-20">📏</span>
              </div>
            )}

            <div className="rounded-xl border border-white/5 bg-white/[0.015] p-3 text-center">
              <p className="text-[10px] text-gray-700">{points.length} boundary points · Spherical Earth model · ±0.5%</p>
            </div>

          </>) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
              <div className="text-6xl animate-pulse">🌾</div>
              <div>
                <p className="text-white font-black text-lg">Apna Khet Mapiye</p>
                <p className="text-gray-600 text-xs mt-1 leading-relaxed max-w-[200px] mx-auto">
                  {mode === 'draw' ? 'Satellite map par apne khet ke corners click karein' : 'GPS Walk mode mein khet ke kinare chalein'}
                </p>
              </div>
              <div className="w-full space-y-1.5">
                {(mode === 'draw' ? [
                  { n:'1', t:'Map par corners click karein' },
                  { n:'2', t:'Kam se kam 3 points lagana zaroori hai' },
                  { n:'3', t:'Double-click ya "Poora Karo" dabayein' },
                ] : [
                  { n:'1', t:'"GPS Walk Shuru Karein" dabayein' },
                  { n:'2', t:'Khet ke kinare dheere dheere chalein' },
                  { n:'3', t:'Wapas aane par "Ruko & Napo" dabayein' },
                ]).map(({ n, t }) => (
                  <div key={n} className="flex items-center gap-2.5 bg-emerald-900/15 rounded-xl px-3 py-2 border border-emerald-900/20 text-left">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black flex items-center justify-center flex-shrink-0">{n}</span>
                    <span className="text-xs text-gray-500">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-emerald-900/20 flex-shrink-0">
          <p className="text-[9px] text-gray-700 text-center">KrishiMitra · Imagery © Esri · Math by Turf.js</p>
        </div>
      </div>
    </div>
  );
}