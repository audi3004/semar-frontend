import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

// Data Simulasi Tenaga Kerja / Tenaga Alih Daya (TAD) - Master Data Kehadiran 5 Kategori
export const DEFAULT_TAD_TREND_DATA = [
  { date: "Sen", lembur: 14, cuti: 5, ijin: 3, sakit: 2, sppd: 8 },
  { date: "Sel", lembur: 18, cuti: 6, ijin: 4, sakit: 1, sppd: 10 },
  { date: "Rab", lembur: 12, cuti: 8, ijin: 2, sakit: 3, sppd: 6 },
  { date: "Kam", lembur: 22, cuti: 4, ijin: 5, sakit: 2, sppd: 12 },
  { date: "Jum", lembur: 25, cuti: 7, ijin: 3, sakit: 1, sppd: 14 },
  { date: "Sab", lembur: 19, cuti: 9, ijin: 6, sakit: 4, sppd: 9 },
  { date: "Min", lembur: 16, cuti: 5, ijin: 2, sakit: 1, sppd: 7 }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    const firstPayload = payload[0];
    if (!firstPayload) return null;
    const fullDate = firstPayload.payload?.fullDate || label;
    return (
      <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl shadow-xl text-white select-none min-w-[190px] animate-in fade-in duration-100">
        <p className="text-[10px] font-black tracking-wider text-slate-400 mb-2 uppercase border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>Tanggal: {label}</span>
          {fullDate !== label && <span className="text-[9px] text-slate-500 font-normal">{fullDate}</span>}
        </p>
        <div className="space-y-1.5">
          {payload.map((p, idx) => {
            if (!p) return null;
            return (
              <div key={idx} className="flex items-center justify-between gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.stroke || "#6366F1" }} />
                  {p.name || "-"}
                </span>
                <span className="font-black text-white">{p.value ?? 0} {p.name === "Lembur" ? "Jam/Dok" : "Orang"}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const AttendanceChart = ({ data = DEFAULT_TAD_TREND_DATA }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-60 sm:h-72 md:h-80 lg:h-96 bg-slate-50/50 animate-pulse rounded-2xl flex items-center justify-center">
        <span className="text-xs font-bold text-slate-400">Memuat grafik...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-60 sm:h-72 md:h-80 lg:h-96 overflow-hidden select-none">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100} debounce={50}>
        <AreaChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="gradientLembur" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradientCuti" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradientIjin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradientSakit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradientSppd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: "#64748B", fontWeight: "700" }} 
            axisLine={{ stroke: "#F1F5F9", strokeWidth: 1 }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: "#64748B", fontWeight: "700" }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ 
              fontSize: "11px", 
              fontWeight: "800", 
              color: "#334155", 
              paddingTop: "12px",
              fontFamily: "inherit"
            }} 
          />
          <Area 
            type="monotone" 
            dataKey="lembur" 
            name="Lembur" 
            stroke="#6366F1" 
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#gradientLembur)"
            dot={{ r: 4, strokeWidth: 2, fill: "#FFF", stroke: "#6366F1" }} 
            activeDot={{ r: 7, strokeWidth: 0, fill: "#6366F1" }}
          />
          <Area 
            type="monotone" 
            dataKey="cuti" 
            name="Cuti" 
            stroke="#10B981" 
            strokeWidth={2.5} 
            fillOpacity={1}
            fill="url(#gradientCuti)"
            dot={{ r: 3, strokeWidth: 2, fill: "#FFF", stroke: "#10B981" }} 
            activeDot={{ r: 6, strokeWidth: 0, fill: "#10B981" }}
          />
          <Area 
            type="monotone" 
            dataKey="ijin" 
            name="Ijin" 
            stroke="#F59E0B" 
            strokeWidth={2.5} 
            fillOpacity={1}
            fill="url(#gradientIjin)"
            dot={{ r: 3, strokeWidth: 2, fill: "#FFF", stroke: "#F59E0B" }} 
            activeDot={{ r: 6, strokeWidth: 0, fill: "#F59E0B" }}
          />
          <Area 
            type="monotone" 
            dataKey="sakit" 
            name="Sakit" 
            stroke="#F43F5E" 
            strokeWidth={2.5} 
            fillOpacity={1}
            fill="url(#gradientSakit)"
            dot={{ r: 3, strokeWidth: 2, fill: "#FFF", stroke: "#F43F5E" }} 
            activeDot={{ r: 6, strokeWidth: 0, fill: "#F43F5E" }}
          />
          <Area 
            type="monotone" 
            dataKey="sppd" 
            name="SPPD" 
            stroke="#0D9488" 
            strokeWidth={2.5} 
            fillOpacity={1}
            fill="url(#gradientSppd)"
            dot={{ r: 3, strokeWidth: 2, fill: "#FFF", stroke: "#0D9488" }} 
            activeDot={{ r: 6, strokeWidth: 0, fill: "#0D9488" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
