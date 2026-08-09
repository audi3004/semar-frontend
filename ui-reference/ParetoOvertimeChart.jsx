import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

const CustomParetoTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0]?.payload || {};
    return (
      <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl shadow-xl text-white select-none min-w-[220px] animate-in fade-in duration-100">
        <p className="text-[11px] font-black tracking-wider text-amber-400 mb-2 uppercase border-b border-slate-800 pb-1.5 truncate">
          {label || dataItem.category}
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
              Total Jam Lembur:
            </span>
            <span className="font-black text-sky-300">
              {dataItem.total_jam?.toLocaleString("id-ID") ?? 0} Jam
            </span>
          </div>
          {dataItem.total_biaya > 0 && (
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400 font-medium">Estimasi Biaya:</span>
              <span className="font-bold text-emerald-400">
                Rp {dataItem.total_biaya?.toLocaleString("id-ID")}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
              Kontribusi %:
            </span>
            <span className="font-black text-indigo-300">
              {dataItem.contribution_pct ?? 0}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-800/80 pt-1.5 mt-1">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Kumulatif (Pareto):
            </span>
            <span className="font-black text-amber-400 text-sm">
              {dataItem.cumulative_pct ?? 0}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ParetoOvertimeChart = ({ data = [] }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-72 sm:h-80 md:h-96 bg-slate-50/50 animate-pulse rounded-2xl flex items-center justify-center">
        <span className="text-xs font-bold text-slate-400">Memuat grafik...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-72 sm:h-80 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 text-xl">
          📊
        </div>
        <p className="text-xs font-bold text-slate-600">Tidak ada data lembur untuk periode/filter ini</p>
        <p className="text-[11px] text-slate-400 font-medium mt-1">Sesuaikan filter tanggal, unit, atau project di bagian atas</p>
      </div>
    );
  }

  // Max left value for padding headroom
  const maxLeftValue = Math.max(...data.map((d) => d.total_jam || 0), 10);

  return (
    <div className="w-full h-72 sm:h-80 md:h-96 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 25, left: -10, bottom: 25 }}>
          <defs>
            <linearGradient id="paretoBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#0369A1" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="category"
            tick={(props) => {
              const { x, y, payload } = props;
              const text = payload.value || "";
              const shortText = text.length > 14 ? text.substring(0, 12) + "..." : text;
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={12}
                    textAnchor="end"
                    fill="#475569"
                    fontSize={10}
                    fontWeight={700}
                    transform="rotate(-25)"
                  >
                    {shortText}
                  </text>
                </g>
              );
            }}
            interval={0}
            height={45}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          {/* Left Y-Axis: Jam Lembur */}
          <YAxis
            yAxisId="left"
            orientation="left"
            domain={[0, Math.ceil(maxLeftValue * 1.15)]}
            tick={{ fontSize: 10, fill: "#0284C7", fontWeight: "800" }}
            axisLine={false}
            tickLine={false}
            label={{
              value: "Total Jam",
              angle: -90,
              position: "insideLeft",
              fill: "#0284C7",
              fontSize: 10,
              fontWeight: 800,
              offset: 15
            }}
          />
          {/* Right Y-Axis: Kumulatif % (0 - 100%) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickFormatter={(val) => `${val}%`}
            tick={{ fontSize: 10, fill: "#D97706", fontWeight: "800" }}
            axisLine={false}
            tickLine={false}
            label={{
              value: "Kumulatif %",
              angle: 90,
              position: "insideRight",
              fill: "#D97706",
              fontSize: 10,
              fontWeight: 800,
              offset: 15
            }}
          />
          <Tooltip content={<CustomParetoTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#334155",
              paddingBottom: "8px"
            }}
          />
          {/* 80% Pareto Cutoff Threshold Line */}
          <ReferenceLine
            yAxisId="right"
            y={80}
            stroke="#EF4444"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: "Batas Pareto 80%",
              position: "top",
              fill: "#EF4444",
              fontSize: 10,
              fontWeight: 800
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="total_jam"
            name="Jam Lembur"
            fill="url(#paretoBarGrad)"
            radius={[6, 6, 0, 0]}
            barSize={28}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative_pct"
            name="Kumulatif % (Pareto)"
            stroke="#D97706"
            strokeWidth={3}
            dot={{ r: 4, fill: "#FFF", stroke: "#D97706", strokeWidth: 2 }}
            activeDot={{ r: 7, fill: "#D97706", stroke: "#FFF", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
