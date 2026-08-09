import React, { useState, useEffect, useMemo } from "react";
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
import { ChevronLeft, Layers, Calendar, Sparkles } from "lucide-react";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
];

// Custom X-Axis Tick for 3-Level Stacked Hierarchy: Tanggal (Atas), Bulan (Tengah), Tahun (Bawah)
const CustomXAxisTick = (props) => {
  const { x, y, payload } = props;
  if (!payload || payload.value === undefined) return null;

  const parts = String(payload.value).split("|");
  if (parts.length === 3) {
    // Tanggal | Bulan | Tahun
    const [day, month, year] = parts;
    return (
      <g transform={`translate(${x},${y})`}>
        {/* Tanggal (Di Atas) */}
        <text x={0} y={10} textAnchor="middle" className="text-[10px] font-black fill-slate-800">
          {day}
        </text>
        {/* Bulan (Di Tengah) */}
        <text x={0} y={22} textAnchor="middle" className="text-[9px] font-bold fill-indigo-600">
          {month}
        </text>
        {/* Tahun (Di Bawah) */}
        <text x={0} y={32} textAnchor="middle" className="text-[8px] font-medium fill-slate-400">
          {year}
        </text>
      </g>
    );
  } else if (parts.length === 2) {
    // Bulan | Tahun
    const [month, year] = parts;
    return (
      <g transform={`translate(${x},${y})`}>
        {/* Bulan (Di Atas) */}
        <text x={0} y={12} textAnchor="middle" className="text-[10px] font-black fill-indigo-700">
          {month}
        </text>
        {/* Tahun (Di Bawah) */}
        <text x={0} y={24} textAnchor="middle" className="text-[9px] font-bold fill-slate-500">
          {year}
        </text>
      </g>
    );
  } else {
    // Tahun
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={14} textAnchor="middle" className="text-[11px] font-black fill-slate-800">
          {parts[0]}
        </text>
      </g>
    );
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    const firstPayload = payload[0];
    if (!firstPayload) return null;
    const fullDate = firstPayload.payload?.fullDate || label;
    return (
      <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl shadow-xl text-white select-none min-w-[200px] animate-in fade-in duration-100">
        <p className="text-[10px] font-black tracking-wider text-indigo-300 mb-2 uppercase border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>{fullDate}</span>
        </p>
        <div className="space-y-1.5">
          {payload.map((p, idx) => {
            if (!p) return null;
            const isLembur = p.name === "Lembur";
            return (
              <div key={idx} className="flex items-center justify-between gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.stroke || "#6366F1" }} />
                  {p.name || "-"}
                </span>
                <span className={`font-black ${isLembur ? "text-indigo-300" : "text-white"}`}>
                  {p.value ?? 0} {isLembur ? "Petugas" : "Orang"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const renderCustomLegend = (props) => {
  const { payload } = props;
  const desiredOrder = ["Lembur", "Cuti", "Ijin", "Sakit", "SPPD"];
  const orderedPayload = desiredOrder
    .map((name) => payload?.find((item) => item.value === name))
    .filter(Boolean);

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-5 pb-2">
      {orderedPayload.map((entry, index) => (
        <div key={`legend-item-${index}`} className="flex items-center gap-1.5 text-xs font-black text-slate-800 hover:text-indigo-600 transition-colors select-none">
          <span className="w-2.5 h-2.5 rounded-full inline-block shadow-2xs" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const DEFAULT_TAD_TREND_DATA = [
  { tickLabel: "01|Ags|2026", fullDate: "1 Agustus 2026", day: 1, month: 7, year: 2026, lembur: 14, cuti: 5, ijin: 3, sakit: 2, sppd: 8 },
  { tickLabel: "02|Ags|2026", fullDate: "2 Agustus 2026", day: 2, month: 7, year: 2026, lembur: 18, cuti: 6, ijin: 4, sakit: 1, sppd: 10 },
  { tickLabel: "03|Ags|2026", fullDate: "3 Agustus 2026", day: 3, month: 7, year: 2026, lembur: 12, cuti: 8, ijin: 2, sakit: 3, sppd: 6 },
  { tickLabel: "04|Ags|2026", fullDate: "4 Agustus 2026", day: 4, month: 7, year: 2026, lembur: 22, cuti: 4, ijin: 5, sakit: 2, sppd: 12 },
  { tickLabel: "05|Ags|2026", fullDate: "5 Agustus 2026", day: 5, month: 7, year: 2026, lembur: 25, cuti: 7, ijin: 3, sakit: 1, sppd: 14 },
  { tickLabel: "06|Ags|2026", fullDate: "6 Agustus 2026", day: 6, month: 7, year: 2026, lembur: 19, cuti: 9, ijin: 6, sakit: 4, sppd: 9 },
  { tickLabel: "07|Ags|2026", fullDate: "7 Agustus 2026", day: 7, month: 7, year: 2026, lembur: 16, cuti: 5, ijin: 2, sakit: 1, sppd: 7 }
];

export const AttendanceChart = ({
  submissions = [],
  data = null,
  initialPeriod = "Bulan Ini"
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [level, setLevel] = useState("tanggal"); // "tanggal" | "bulan" | "tahun"
  const [drillYear, setDrillYear] = useState(2026);
  const [drillMonth, setDrillMonth] = useState(7); // 7 = Agustus (0-indexed)

  useEffect(() => {
    setIsMounted(true);
    const now = new Date();
    setDrillYear(now.getFullYear());
    setDrillMonth(now.getMonth());
  }, []);

  // Update level automatically if period preset changes
  useEffect(() => {
    if (initialPeriod === "Tahun Ini") {
      setLevel("bulan");
    } else if (initialPeriod === "Minggu Ini" || initialPeriod === "Bulan Ini") {
      setLevel("tanggal");
    }
  }, [initialPeriod]);

  // Aggregate real submissions according to active drill level & period filters
  const chartData = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      if (data && data.length > 0) return data;
      return DEFAULT_TAD_TREND_DATA;
    }

    // Filter active (non-rejected) submissions
    const activeSubmissions = submissions.filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st !== "rejected" && st !== "ditolak" && st !== "revision" && st !== "revision_required";
    });

    if (level === "tahun") {
      // Group by Year
      const yearMap = {};
      const targetYears = [2024, 2025, 2026];
      targetYears.forEach((y) => {
        yearMap[y] = {
          tickLabel: `${y}`,
          fullDate: `Tahun ${y}`,
          year: y,
          lemburPetugasSet: new Set(),
          cuti: 0,
          ijin: 0,
          sakit: 0,
          sppd: 0
        };
      });

      activeSubmissions.forEach((s) => {
        const dateStr = s.tanggalLembur || s.tanggalMulai || s.tanggalBerangkat || s.tanggalPengajuan || s.createdAt || "";
        if (!dateStr) return;
        const year = new Date(dateStr).getFullYear() || 2026;
        if (!yearMap[year]) {
          yearMap[year] = {
            tickLabel: `${year}`,
            fullDate: `Tahun ${year}`,
            year,
            lemburPetugasSet: new Set(),
            cuti: 0,
            ijin: 0,
            sakit: 0,
            sppd: 0
          };
        }

        const personId = s.employeeNip || s.employeeName || s.id || "p";
        if (s.type === "lembur") {
          yearMap[year].lemburPetugasSet.add(personId);
        } else if (s.type === "cuti") {
          yearMap[year].cuti += 1;
        } else if (s.type === "ijin") {
          yearMap[year].ijin += 1;
        } else if (s.type === "sakit") {
          yearMap[year].sakit += 1;
        } else if (s.type === "sppd") {
          yearMap[year].sppd += 1;
        }
      });

      return Object.values(yearMap)
        .sort((a, b) => a.year - b.year)
        .map((item) => ({
          ...item,
          lembur: item.lemburPetugasSet.size || (item.lemburCount || 0)
        }));
    }

    if (level === "bulan") {
      // Group by Month for selected drillYear
      const monthList = [];
      for (let m = 0; m < 12; m++) {
        monthList.push({
          tickLabel: `${MONTH_SHORT[m]}|${drillYear}`,
          fullDate: `Bulan ${MONTH_NAMES[m]} ${drillYear}`,
          month: m,
          year: drillYear,
          lemburPetugasSet: new Set(),
          cuti: 0,
          ijin: 0,
          sakit: 0,
          sppd: 0
        });
      }

      activeSubmissions.forEach((s) => {
        const dateStr = s.tanggalLembur || s.tanggalMulai || s.tanggalBerangkat || s.tanggalPengajuan || s.createdAt || "";
        if (!dateStr) return;
        const dObj = new Date(dateStr);
        const year = dObj.getFullYear();
        const month = dObj.getMonth();

        if (year === drillYear && month >= 0 && month < 12) {
          const personId = s.employeeNip || s.employeeName || s.id || "p";
          if (s.type === "lembur") {
            monthList[month].lemburPetugasSet.add(personId);
          } else if (s.type === "cuti") {
            monthList[month].cuti += 1;
          } else if (s.type === "ijin") {
            monthList[month].ijin += 1;
          } else if (s.type === "sakit") {
            monthList[month].sakit += 1;
          } else if (s.type === "sppd") {
            monthList[month].sppd += 1;
          }
        }
      });

      return monthList.map((item) => ({
        ...item,
        lembur: item.lemburPetugasSet.size
      }));
    }

    // Default: Level "tanggal" (Daily)
    // Find all days in the drillYear & drillMonth
    const daysInMonth = new Date(drillYear, drillMonth + 1, 0).getDate();
    const dayMap = {};

    for (let d = 1; d <= daysInMonth; d++) {
      const dPad = String(d).padStart(2, "0");
      const key = `${drillYear}-${String(drillMonth + 1).padStart(2, "0")}-${dPad}`;
      dayMap[key] = {
        tickLabel: `${dPad}|${MONTH_SHORT[drillMonth]}|${drillYear}`,
        fullDate: `${d} ${MONTH_NAMES[drillMonth]} ${drillYear}`,
        day: d,
        month: drillMonth,
        year: drillYear,
        dateKey: key,
        lemburPetugasSet: new Set(),
        cuti: 0,
        ijin: 0,
        sakit: 0,
        sppd: 0
      };
    }

    activeSubmissions.forEach((s) => {
      const dateStr = s.tanggalLembur || s.tanggalMulai || s.tanggalBerangkat || s.tanggalPengajuan || s.createdAt || "";
      if (!dateStr) return;
      const key = dateStr.substring(0, 10); // YYYY-MM-DD
      if (dayMap[key]) {
        const personId = s.employeeNip || s.employeeName || s.id || "p";
        if (s.type === "lembur") {
          dayMap[key].lemburPetugasSet.add(personId);
        } else if (s.type === "cuti") {
          dayMap[key].cuti += 1;
        } else if (s.type === "ijin") {
          dayMap[key].ijin += 1;
        } else if (s.type === "sakit") {
          dayMap[key].sakit += 1;
        } else if (s.type === "sppd") {
          dayMap[key].sppd += 1;
        }
      }
    });

    // Filter to only days that fall in month or retain days with non-zero activity if sparse
    const resultDays = Object.values(dayMap).map((item) => ({
      ...item,
      lembur: item.lemburPetugasSet.size
    }));

    return resultDays;
  }, [submissions, data, level, drillYear, drillMonth]);

  const handleDrillUp = () => {
    if (level === "tanggal") {
      setLevel("bulan");
    } else if (level === "bulan") {
      setLevel("tahun");
    }
  };

  const handleChartClick = (state) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const payloadData = state.activePayload[0].payload;
      if (level === "tahun" && payloadData.year) {
        setDrillYear(payloadData.year);
        setLevel("bulan");
      } else if (level === "bulan" && payloadData.month !== undefined) {
        setDrillMonth(payloadData.month);
        setLevel("tanggal");
      }
    }
  };

  if (!isMounted) {
    return (
      <div className="w-full h-72 sm:h-80 md:h-96 bg-slate-50/50 animate-pulse rounded-2xl flex items-center justify-center">
        <span className="text-xs font-bold text-slate-400">Memuat grafik...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 select-none">
      {/* Interactive Controls & Drill Down / Up Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Hirarki Tampilan:</span>
          <div className="flex items-center gap-1 text-xs font-extrabold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
            {level === "tahun" && <span className="text-indigo-600 font-black">Semua Tahun</span>}
            {level === "bulan" && (
              <>
                <span className="text-slate-500 font-bold">{drillYear}</span>
                <span className="text-slate-400">&gt;</span>
                <span className="text-indigo-600 font-black">Bulan (Jan - Des)</span>
              </>
            )}
            {level === "tanggal" && (
              <>
                <span className="text-slate-500 font-bold">{drillYear}</span>
                <span className="text-slate-400">&gt;</span>
                <span className="text-slate-600 font-bold">{MONTH_NAMES[drillMonth]}</span>
                <span className="text-slate-400">&gt;</span>
                <span className="text-indigo-600 font-black">Tanggal (Harian)</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Switcher Buttons */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setLevel("tanggal")}
              className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                level === "tanggal"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
              }`}
            >
              Tanggal
            </button>
            <button
              onClick={() => setLevel("bulan")}
              className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                level === "bulan"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
              }`}
            >
              Bulan
            </button>
            <button
              onClick={() => setLevel("tahun")}
              className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                level === "tahun"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
              }`}
            >
              Tahun
            </button>
          </div>

          {/* Drill Up Button */}
          {level !== "tahun" && (
            <button
              onClick={handleDrillUp}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-[11px] font-black flex items-center gap-1 transition shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span>Drill Up ({level === "tanggal" ? "Ke Bulan" : "Ke Tahun"})</span>
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 sm:h-80 md:h-96 overflow-hidden select-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 15, right: 15, left: 10, bottom: 25 }}
            onClick={handleChartClick}
          >
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
            
            {/* Custom Multi-level Stacked Hierarchy X-Axis Tick */}
            <XAxis
              dataKey="tickLabel"
              tick={<CustomXAxisTick />}
              axisLine={{ stroke: "#CBD5E1", strokeWidth: 1.5 }}
              tickLine={false}
              interval={0}
              height={50}
            />

            {/* Y-Axis without numbers as requested */}
            <YAxis hide={true} />

            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              verticalAlign="bottom"
              content={renderCustomLegend}
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
    </div>
  );
};
