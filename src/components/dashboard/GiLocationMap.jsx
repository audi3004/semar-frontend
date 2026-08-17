import { useEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import { Building2, Factory, MapPinned, RotateCcw, Users } from "lucide-react";
import "leaflet/dist/leaflet.css";

const PALETTE = ["#4f46e5", "#0284c7", "#0891b2", "#059669", "#7c3aed", "#c2410c", "#be123c", "#0f766e"];

const colorMap = (items, getKey) => {
  const keys = [...new Set(items.map(getKey).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "id"));
  return new Map(keys.map((key, index) => [key, PALETTE[index % PALETTE.length]]));
};

const markerIcon = (color) => L.divIcon({
  className: "gi-factory-marker",
  html: `<div style="--pin-color:${color}" class="gi-factory-pin">${renderToStaticMarkup(<Factory size={19} strokeWidth={2.5} />)}</div>`,
  iconSize: [38, 46],
  iconAnchor: [19, 44],
  tooltipAnchor: [0, -38]
});

const FitVisibleMarkers = ({ units }) => {
  const map = useMap();
  useEffect(() => {
    if (!units.length) return;
    if (units.length === 1) map.setView([units[0].lat, units[0].lon], 12, { animate: true });
    else map.fitBounds(L.latLngBounds(units.map((unit) => [unit.lat, unit.lon])), { padding: [36, 36], maxZoom: 11, animate: true });
  }, [map, units]);
  return null;
};

export const GiLocationMap = ({ data, loading = false }) => {
  const units = data?.units || [];
  const scopeLevel = data?.scope_level || "UPT";
  const [selectedUpt, setSelectedUpt] = useState(null);
  const [selectedUltg, setSelectedUltg] = useState(null);

  useEffect(() => { setSelectedUpt(null); setSelectedUltg(null); }, [scopeLevel, units.length]);

  const uptColors = useMemo(() => colorMap(units, (unit) => unit.upt?.id_unit), [units]);
  const selectedUptUnits = selectedUpt ? units.filter((unit) => Number(unit.upt?.id_unit) === Number(selectedUpt)) : units;
  const ultgColors = useMemo(() => colorMap(selectedUptUnits, (unit) => unit.ultg?.id_unit), [selectedUptUnits]);
  const visibleUnits = selectedUltg ? selectedUptUnits.filter((unit) => Number(unit.ultg?.id_unit) === Number(selectedUltg)) : selectedUptUnits;
  const showUltgLegend = scopeLevel === "ULTG" || Boolean(selectedUpt);
  const legendItems = useMemo(() => {
    if (scopeLevel === "GI") return [];
    const source = showUltgLegend
      ? selectedUptUnits.map((unit) => ({ id: unit.ultg?.id_unit, name: unit.ultg?.nama_unit, color: ultgColors.get(unit.ultg?.id_unit) }))
      : units.map((unit) => ({ id: unit.upt?.id_unit, name: unit.upt?.nama_unit, color: uptColors.get(unit.upt?.id_unit) }));
    return [...new Map(source.filter((item) => item.id).map((item) => [item.id, item])).values()];
  }, [scopeLevel, showUltgLegend, selectedUptUnits, units, ultgColors, uptColors]);

  const getMarkerColor = (unit) => {
    if (scopeLevel === "GI") return PALETTE[0];
    return showUltgLegend ? ultgColors.get(unit.ultg?.id_unit) || PALETTE[0] : uptColors.get(unit.upt?.id_unit) || PALETTE[0];
  };
  const resetFilter = () => { setSelectedUpt(null); setSelectedUltg(null); };
  const totalPetugas = visibleUnits.reduce((total, unit) => total + Number(unit.jumlah_petugas || 0), 0);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><div className="rounded-2xl bg-indigo-600 p-2.5 text-white shadow-lg shadow-indigo-200"><MapPinned className="h-5 w-5" /></div><div><h2 className="text-base font-black text-slate-900">Peta Sebaran Gardu Induk</h2><p className="mt-1 text-[11px] text-slate-500">Lokasi GI mengikuti scope Unit Role akun yang sedang aktif.</p></div></div>
        <div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-700"><Building2 className="h-3.5 w-3.5" />{visibleUnits.length} Gardu Induk</span><span className="inline-flex items-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] font-black text-sky-700"><Users className="h-3.5 w-3.5" />{totalPetugas} Petugas</span></div>
      </div>

      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Legend & Filter</p><p className="mt-0.5 text-xs font-bold text-slate-700">{scopeLevel === "GI" ? "Scope Gardu Induk" : showUltgLegend ? "Warna berdasarkan ULTG" : "Warna berdasarkan UPT"}</p></div>{(selectedUpt || selectedUltg) && <button type="button" onClick={resetFilter} title="Reset filter peta" className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-indigo-600"><RotateCcw className="h-3.5 w-3.5" /></button>}</div>
          {selectedUpt && <div className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50 p-2.5 text-[10px] font-bold text-indigo-700">UPT aktif: {units.find((unit) => Number(unit.upt?.id_unit) === Number(selectedUpt))?.upt?.nama_unit}</div>}
          {scopeLevel === "GI" ? <div className="rounded-xl border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-600">Pin yang tampil hanya GI yang ditugaskan langsung melalui Unit Role Anda.</div> : <div className="space-y-1.5">{legendItems.map((item) => { const active = showUltgLegend ? Number(selectedUltg) === Number(item.id) : Number(selectedUpt) === Number(item.id); return <button key={item.id} type="button" onClick={() => { if (showUltgLegend) setSelectedUltg(active ? null : item.id); else { setSelectedUpt(item.id); setSelectedUltg(null); } }} className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[11px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-sm ${active ? "border-indigo-300 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200" : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200"}`}><span className="h-3 w-3 shrink-0 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: item.color }} /><span className="truncate">{item.name}</span></button>; })}</div>}
          {selectedUpt && <button type="button" onClick={resetFilter} className="mt-3 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-100">Kembali ke semua UPT</button>}
        </aside>

        <div className="relative min-h-[430px] bg-slate-100">
          {loading ? <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 text-xs font-bold text-slate-500 backdrop-blur-sm">Memuat lokasi Gardu Induk...</div> : !visibleUnits.length ? <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50 text-center"><MapPinned className="mb-2 h-10 w-10 text-slate-300" /><p className="text-sm font-black text-slate-600">Lokasi GI tidak tersedia</p><p className="mt-1 text-[11px] text-slate-400">Tidak ada koordinat dalam scope Unit Role aktif.</p></div> : null}
          <MapContainer center={[-7.25, 110.1]} zoom={8} scrollWheelZoom className="h-[430px] w-full" preferCanvas>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FitVisibleMarkers units={visibleUnits} />
            {visibleUnits.map((unit) => <Marker key={unit.id_unit} position={[unit.lat, unit.lon]} icon={markerIcon(getMarkerColor(unit))}><Tooltip direction="top" opacity={1} sticky className="gi-map-tooltip"><div className="min-w-48 p-1"><p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{unit.upt?.nama_unit || "UPT -"}</p><p className="mt-1 text-xs font-bold text-slate-700">{unit.ultg?.nama_unit || "ULTG -"}</p><p className="mt-0.5 text-sm font-black text-slate-900">{unit.nama_gi}</p><div className="mt-2 flex items-center gap-1.5 rounded-lg bg-sky-50 px-2 py-1.5 text-[11px] font-bold text-sky-700"><Users className="h-3.5 w-3.5" />{unit.jumlah_petugas} Petugas aktif</div></div></Tooltip></Marker>)}
          </MapContainer>
        </div>
      </div>
    </section>
  );
};
