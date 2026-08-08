import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const DEFAULT_DISTRIBUTION = [
  { name: "Lembur", value: 35, color: "#6366F1" },
  { name: "Cuti", value: 24, color: "#10B981" },
  { name: "Ijin", value: 14, color: "#F59E0B" },
  { name: "Sakit", value: 8, color: "#F43F5E" },
  { name: "SPPD", value: 19, color: "#0D9488" }
];

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const firstPayload = payload[0];
    if (!firstPayload) return null;
    const data = firstPayload.payload;
    return (
      <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-md p-3 rounded-2xl shadow-xl text-white select-none min-w-[130px] animate-in fade-in duration-100 z-50">
        <div className="flex items-center gap-2 text-[11px] font-black">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data?.color || firstPayload.fill || "#6366F1" }} />
          <span>{firstPayload.name || "-"}</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 font-bold">
          Jumlah: <span className="text-white font-black">{firstPayload.value ?? 0} Orang</span>
        </p>
      </div>
    );
  }
  return null;
};

export const DistributionPieChart = ({
  data = DEFAULT_DISTRIBUTION
}) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalCount = data.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  if (!isMounted) {
    return (
      <div className="w-full h-64 bg-slate-50/50 animate-pulse rounded-2xl flex items-center justify-center">
        <span className="text-xs font-bold text-slate-400">Memuat grafik...</span>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 font-sans select-none w-full h-64 border border-dashed border-slate-200/80 rounded-2xl bg-slate-50/30">
        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Tidak Ada Data Pengajuan</span>
        <p className="text-[10px] text-slate-400/80 mt-1">Belum ada aktivitas terdaftar untuk filter unit atau rentang tanggal ini.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full h-full select-none py-2">
      {/* Donut Chart with Center Summary Label */}
      <div className="relative w-full sm:w-1/2 h-52 sm:h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100} debounce={50}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Count Label (Reference Image 1 Donut Center) */}
        <div 
          className="absolute flex flex-col items-center justify-center pointer-events-none"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
            {totalCount}
          </span>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mt-1">
            Total Tasks
          </span>
        </div>
      </div>

      {/* Side Legend Breakdown matching Reference Image 1 */}
      <div className="w-full sm:w-1/2 space-y-2.5 px-2">
        {data.map((item, idx) => {
          const percent = totalCount > 0 ? ((item.value / totalCount) * 100).toFixed(1) : 0;
          return (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="font-bold text-slate-700 truncate">{item.name}</span>
              </div>
              <div className="text-right shrink-0 font-semibold text-slate-500 text-[11px]">
                <span className="font-extrabold text-slate-900 mr-1">{item.value}</span>
                <span>({percent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
