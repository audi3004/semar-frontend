import { useState, useMemo, useEffect } from "react";
import { DataService } from "../services/dataService";
import { api } from "../services/api";
import { mapWorkflowLembur, mapWorkflowCuti, mapWorkflowIjin, mapWorkflowSakit, mapWorkflowSppd } from "../utils/workflowSubmissionMapper";
import { AttendanceChart } from "../components/charts/AttendanceChart";
import { DistributionPieChart } from "../components/charts/DistributionPieChart";
import { ParetoOvertimeChart } from "../components/charts/ParetoOvertimeChart";
import { SignatureModal } from "../components/common/SignatureModal";
import { DocumentViewerModal } from "../components/common/DocumentViewerModal";
import { ExportService } from "../services/exportService";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { GiLocationMap } from "../components/dashboard/GiLocationMap";
import {
  Clock,
  Palmtree,
  FileText,
  Stethoscope,
  Briefcase,
  DollarSign,
  Check,
  X,
  Eye,
  FileSpreadsheet,
  Presentation,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Hourglass,
  FileClock,
  AlertTriangle,
  MousePointerClick,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Building2,
  TrendingUp,
  BarChart3,
  UserCheck,
  Users,
  Trophy,
  Sparkles
} from "lucide-react";
import { formatDateIndonesian, formatRupiah, getFormattedDocNo } from "../utils/formatters";
import { matchesNavbarTransactionFilter } from "../utils/navbarTransactionFilter";

export const DashboardPage = ({
  currentUser,
  submissions = [],
  allSubmissions = [],
  startDate = "",
  endDate = "",
  setStartDate = () => {},
  setEndDate = () => {},
  selectedUpt = "Semua UPT",
  selectedUltg = "Semua ULTG",
  selectedGi = "Semua GI",
  setSelectedUpt = () => {},
  setSelectedUltg = () => {},
  setSelectedGi = () => {},
  navbarScope,
  navbarProjectIds = [],
  onRefreshData,
  onNavigateToTab
}) => {
  const [selectedSubForDoc, setSelectedSubForDoc] = useState(null);
  const [selectedSubForApproval, setSelectedSubForApproval] = useState(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [rejectModalSub, setRejectModalSub] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [chartPeriod, setChartPeriod] = useState("Bulan Ini");
  const [paretoGroupBy, setParetoGroupBy] = useState("pekerjaan");
  const [selectedStatusCard, setSelectedStatusCard] = useState("all");
  const [expandedCardKey, setExpandedCardKey] = useState(null);
  const [dashboardSubmissions, setDashboardSubmissions] = useState(submissions || []);
  const [mapData, setMapData] = useState({ units: [], scope_level: "NONE" });
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return undefined;
    let active = true;
    const loadDashboard = async () => {
      try {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        const result = await api.getDashboardTransactions(params);
        if (!active) return;
        setDashboardSubmissions([
          ...(result.lembur || []).map(mapWorkflowLembur),
          ...(result.cuti || []).map(mapWorkflowCuti),
          ...(result.ijin || []).map(mapWorkflowIjin),
          ...(result.sakit || []).map(mapWorkflowSakit),
          ...(result.sppd || []).map(mapWorkflowSppd)
        ]);
      } catch (error) {
        if (active) {
          console.error("Gagal memuat data dashboard:", error);
          setDashboardSubmissions([]);
        }
      }
    };
    loadDashboard();
    return () => { active = false; };
  }, [currentUser?.id_user, currentUser?.id, startDate, endDate]);

  useEffect(() => {
    if (!currentUser || currentUser.role === "maker") {
      setMapData({ units: [], scope_level: "NONE" });
      return undefined;
    }
    let active = true;
    setMapLoading(true);
    api.getDashboardMapUnits()
      .then((result) => { if (active) setMapData(result || { units: [], scope_level: "NONE" }); })
      .catch((error) => {
        if (active) {
          console.error("Gagal memuat peta unit GI:", error);
          setMapData({ units: [], scope_level: "NONE" });
        }
      })
      .finally(() => { if (active) setMapLoading(false); });
    return () => { active = false; };
  }, [currentUser?.id_user, currentUser?.id, currentUser?.role]);

  if (!currentUser) return <LoadingSkeleton variant="dashboard" />;

  const isMaker = currentUser?.role === "maker";
  // Scope identitas, role dan UnitRole telah diterapkan backend; bagian ini hanya filter tampilan.
  const safeSubmissions = dashboardSubmissions.filter((sub) => {
    if (!matchesNavbarTransactionFilter(sub, { projectIds: navbarProjectIds, startDate, endDate })) return false;
    const unitNames = (sub.unitHierarchy || []).map((unit) => String(unit?.name || "").trim().toLowerCase()).filter(Boolean);
    const matchesUnit = (selected, fallback) => {
      if (!selected || selected.startsWith("Semua ")) return true;
      const selectedName = String(selected).trim().toLowerCase();
      return unitNames.includes(selectedName) || String(fallback || "").trim().toLowerCase() === selectedName;
    };
    if (!matchesUnit(selectedUpt, sub.unitUpt || sub.upt)) return false;
    if (!matchesUnit(selectedUltg, sub.unitUltg || sub.ultg)) return false;
    if (!matchesUnit(selectedGi, sub.garduInduk || sub.gi)) return false;

    return true;
  });

  // Formatted date period string for Task 1
  const formattedPeriodText = () => {
    if (startDate && endDate) {
      return `${formatDateIndonesian(startDate)} - ${formatDateIndonesian(endDate)}`;
    }
    if (startDate) {
      return `>= ${formatDateIndonesian(startDate)}`;
    }
    if (endDate) {
      return `<= ${formatDateIndonesian(endDate)}`;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const pad = (num) => String(num).padStart(2, "0");
    const sStr = `${year}-${pad(month + 1)}-01`;
    const eStr = `${year}-${pad(month + 1)}-${pad(lastDay.getDate())}`;
    return `${formatDateIndonesian(sStr)} - ${formatDateIndonesian(eStr)}`;
  };

  // Preset handler for quick period selection
  const handleSelectPreset = (preset) => {
    setChartPeriod(preset);
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const pad = (num) => String(num).padStart(2, "0");

    if (preset === "Minggu Ini") {
      const d7 = new Date(today);
      d7.setDate(d7.getDate() - 6);
      setStartDate(d7.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    } else if (preset === "Bulan Ini") {
      const lastDay = new Date(year, month + 1, 0);
      setStartDate(`${year}-${pad(month + 1)}-01`);
      setEndDate(`${year}-${pad(month + 1)}-${pad(lastDay.getDate())}`);
    } else if (preset === "Tahun Ini") {
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
    }
  };

  // Dynamic date timeline trend generator for Area Chart with X-Axis Drilldown (Tanggal)
  const chartTrendData = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const pad = (num) => String(num).padStart(2, "0");
    const defaultStart = `${year}-${pad(month + 1)}-01`;
    const defaultEnd = `${year}-${pad(month + 1)}-${pad(lastDay.getDate())}`;

    let sDate = startDate ? new Date(startDate) : new Date(defaultStart);
    let eDate = endDate ? new Date(endDate) : new Date(defaultEnd);

    if (isNaN(sDate.getTime())) sDate = new Date(defaultStart);
    if (isNaN(eDate.getTime())) eDate = new Date(defaultEnd);
    if (sDate > eDate) {
      const temp = sDate;
      sDate = eDate;
      eDate = temp;
    }

    const points = [];
    const diffDays = Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    // Filter active (non-rejected) submissions
    const activeSubmissions = safeSubmissions.filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st !== "rejected" && st !== "ditolak" && st !== "revision" && st !== "revision_required";
    });

    if (diffDays <= 31) {
      // Find all dates within range that have at least one active submission
      const dateSet = new Set();
      activeSubmissions.forEach((s) => {
        const subDateStr = s.tanggalLembur || s.tanggalMulai || s.tanggalBerangkat || s.tanggalPengajuan || "";
        if (subDateStr) {
          const dateOnly = subDateStr.substring(0, 10); // YYYY-MM-DD
          // Check if dateOnly is between startDate and endDate boundaries
          const curD = new Date(dateOnly);
          if (curD >= sDate && curD <= eDate) {
            dateSet.add(dateOnly);
          }
        }
      });

      // Sort chronological
      const sortedDates = Array.from(dateSet).sort();

      sortedDates.forEach((dateStr) => {
        const curDate = new Date(dateStr);
        const dayLabel = `${curDate.getDate()} ${months[curDate.getMonth()]}`;

        // Aggregate submissions on this date (only non-rejected)
        let lembur = 0, cuti = 0, ijin = 0, sakit = 0, sppd = 0;
        activeSubmissions.forEach((s) => {
          const subDate = s.tanggalLembur || s.tanggalMulai || s.tanggalBerangkat || s.tanggalPengajuan || "";
          if (subDate.startsWith(dateStr)) {
            if (s.type === "lembur") lembur += Number(s.durasiJam) || 1;
            else if (s.type === "cuti") cuti += 1;
            else if (s.type === "ijin") ijin += 1;
            else if (s.type === "sakit") sakit += 1;
            else if (s.type === "sppd") sppd += 1;
          }
        });

        points.push({
          date: dayLabel,
          fullDate: formatDateIndonesian(dateStr),
          lembur: lembur,
          cuti: cuti,
          ijin: ijin,
          sakit: sakit,
          sppd: sppd
        });
      });
    } else {
      // Monthly points for yearly view
      for (let m = 0; m < 12; m++) {
        const mLabel = months[m];
        const mKey = `2026-${String(m + 1).padStart(2, "0")}`;

        let lembur = 0, cuti = 0, ijin = 0, sakit = 0, sppd = 0;
        activeSubmissions.forEach((s) => {
          const subDate = s.tanggalLembur || s.tanggalMulai || s.tanggalBerangkat || s.tanggalPengajuan || "";
          if (subDate.startsWith(mKey)) {
            if (s.type === "lembur") lembur += Number(s.durasiJam) || 1;
            else if (s.type === "cuti") cuti += 1;
            else if (s.type === "ijin") ijin += 1;
            else if (s.type === "sakit") sakit += 1;
            else if (s.type === "sppd") sppd += 1;
          }
        });

        if (lembur > 0 || cuti > 0 || ijin > 0 || sakit > 0 || sppd > 0) {
          points.push({
            date: mLabel,
            fullDate: `${mLabel} 2026`,
            lembur: lembur,
            cuti: cuti,
            ijin: ijin,
            sakit: sakit,
            sppd: sppd
          });
        }
      }
    }

    return points;
  })();

  // Summary counts for 5 categories (Lembur, Cuti, Ijin, Sakit, SPPD)
  const totalLemburJam = safeSubmissions
    .filter((s) => s.type === "lembur" && s.status?.toLowerCase() !== "rejected" && s.status?.toLowerCase() !== "ditolak" && s.status?.toLowerCase() !== "revision" && s.status?.toLowerCase() !== "revision_required")
    .reduce((acc, curr) => acc + (Number(curr.durasiJam) || 0), 0);
  const lemburCount = safeSubmissions.filter((s) => s.type === "lembur" && s.status?.toLowerCase() !== "rejected" && s.status?.toLowerCase() !== "ditolak" && s.status?.toLowerCase() !== "revision" && s.status?.toLowerCase() !== "revision_required").length;
  const cutiCount = safeSubmissions.filter((s) => s.type === "cuti" && s.status?.toLowerCase() !== "rejected" && s.status?.toLowerCase() !== "ditolak" && s.status?.toLowerCase() !== "revision" && s.status?.toLowerCase() !== "revision_required").length;
  const ijinCount = safeSubmissions.filter((s) => s.type === "ijin" && s.status?.toLowerCase() !== "rejected" && s.status?.toLowerCase() !== "ditolak" && s.status?.toLowerCase() !== "revision" && s.status?.toLowerCase() !== "revision_required").length;
  const sakitCount = safeSubmissions.filter((s) => s.type === "sakit" && s.status?.toLowerCase() !== "rejected" && s.status?.toLowerCase() !== "ditolak" && s.status?.toLowerCase() !== "revision" && s.status?.toLowerCase() !== "revision_required").length;
  const sppdCount = safeSubmissions.filter((s) => s.type === "sppd" && s.status?.toLowerCase() !== "rejected" && s.status?.toLowerCase() !== "ditolak" && s.status?.toLowerCase() !== "revision" && s.status?.toLowerCase() !== "revision_required").length;

  // Analisis Lembur & Kategori calculations derived from safeSubmissions (filtered by unit/role/date) - Exclude Rejected & Revision
  const lemburSubmissionsFiltered = safeSubmissions.filter(
    (s) => s.type === "lembur" && s.status?.toLowerCase() !== "rejected" && s.status?.toLowerCase() !== "ditolak" && s.status?.toLowerCase() !== "revision" && s.status?.toLowerCase() !== "revision_required"
  );

  // Rejected Overtime submissions for separated visualization
  const lemburSubmissionsRejected = safeSubmissions.filter(
    (s) => s.type === "lembur" && (s.status?.toLowerCase() === "rejected" || s.status?.toLowerCase() === "ditolak")
  );

  // Revision Overtime submissions for separated visualization
  const lemburSubmissionsRevision = safeSubmissions.filter(
    (s) => s.type === "lembur" && (s.status?.toLowerCase() === "revision" || s.status?.toLowerCase() === "revision_required" || s.status?.toLowerCase() === "revisi")
  );

  const totalJamLemburAnalysis = lemburSubmissionsFiltered.reduce(
    (acc, curr) => acc + (Number(curr.durasiJam) || 0),
    0
  );
  const totalPegawaiTerlibat = new Set(
    lemburSubmissionsFiltered.map((s) => s.employeeNip || s.employeeName)
  ).size;

  // Detailed Overtime Hours Process Stages for Card 1 (Diajukan, Direvisi, Disetujui)
  let totalJamDiajukan = 0;
  let totalJamApproved = 0;
  let countJamDiajukan = 0;
  let countJamApproved = 0;
  let totalJamSetelahRevisi = 0;

  lemburSubmissionsFiltered.forEach((s) => {
    const st = (s.status || "").toLowerCase();
    const isApproved = ["approved", "disetujui", "completed", "acc", "approved_2", "selesai"].includes(st);
    const jam = Number(s.durasiJam) || 0;

    totalJamDiajukan += jam;
    const jamRevisi = Number(s.durasiJamApproved ?? s.jumlahJamKoreksi ?? jam);
    totalJamSetelahRevisi += Number.isNaN(jamRevisi) ? jam : jamRevisi;
    countJamDiajukan += 1;

    if (isApproved) {
      const jamApprove = Number(s.durasiJamApproved || jam);
      totalJamApproved += jamApprove;
      countJamApproved += 1;
    }

  });

  const selisihJamRevisi = totalJamSetelahRevisi - totalJamDiajukan;
  const hasPerubahanRevisi = Math.abs(selisihJamRevisi) > 0.0001;
  const totalJamSetiapRevisi = totalJamSetelahRevisi;

  const countJamSetiapRevisi = countJamDiajukan;

  const subLabelRevisi = hasPerubahanRevisi
    ? `Selisih Koreksi: ${selisihJamRevisi > 0 ? "+" : ""}${selisihJamRevisi} Jam`
    : "Sama dengan Diajukan (Tanpa Revisi)";

  const top3HoursProcess = [
    {
      rank: 1,
      title: "Total Jam Diajukan",
      subLabel: "Akumulasi Pengajuan Lembur",
      hours: totalJamDiajukan,
      count: countJamDiajukan,
      pct: 100,
      badgeColor: "bg-gradient-to-r from-sky-600 to-blue-600 text-white border border-sky-400 shadow-2xs",
      cardStyle: "group relative bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-sky-100/70 shadow-2xs hover:border-sky-300 transition-all duration-150",
      barColor: "bg-gradient-to-r from-sky-500 to-blue-600",
      tagStyle: "bg-sky-50 text-sky-950 border-sky-200/80 font-black"
    },
    {
      rank: 2,
      title: "Jam Setelah Direvisi",
      subLabel: subLabelRevisi,
      hours: totalJamSetiapRevisi,
      count: countJamSetiapRevisi,
      pct: totalJamDiajukan > 0 ? Math.round((totalJamSetiapRevisi / totalJamDiajukan) * 100) : 0,
      badgeColor: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400/80 shadow-2xs font-black",
      cardStyle: "group relative bg-purple-50/70 backdrop-blur-md p-2 rounded-xl border border-purple-200/90 shadow-2xs hover:border-purple-300 transition-all duration-150",
      barColor: "bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600",
      tagStyle: "bg-purple-100/90 text-purple-950 border border-purple-300/80 font-black backdrop-blur-xs"
    },
    {
      rank: 3,
      title: "Total Jam Disetujui",
      subLabel: "Realisasi Approval Final",
      hours: totalJamApproved,
      count: countJamApproved,
      pct: totalJamDiajukan > 0 ? Math.round((totalJamApproved / totalJamDiajukan) * 100) : 0,
      badgeColor: "bg-emerald-100 text-emerald-900 border border-emerald-200/80 font-bold",
      cardStyle: "group relative bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-emerald-100/70 shadow-2xs hover:border-emerald-300 transition-all duration-150",
      barColor: "bg-emerald-500",
      tagStyle: "bg-emerald-50 text-emerald-950 border-emerald-200/80 font-black"
    }
  ];

  // Detailed Overtime Cost Process Stages (Total Diajukan, Disetujui, Menunggu)
  let totalBiayaLemburDiajukan = 0;
  let totalBiayaLemburApproved = 0;
  let totalBiayaLemburPending = 0;

  let countBiayaDiajukan = 0;
  let countBiayaApproved = 0;
  let countBiayaPending = 0;

  const getOvertimeFactor = (hours, isHoliday) => {
    const duration = Math.max(0, Number(hours) || 0);
    if (duration <= 0) return 0;
    if (isHoliday) {
      return (Math.min(duration, 8) * 2)
        + (duration > 8 ? Math.min(duration - 8, 1) * 3 : 0)
        + (duration > 9 ? (duration - 9) * 4 : 0);
    }
    return Math.min(duration, 1) * 1.5 + Math.max(duration - 1, 0) * 2;
  };

  const calculateLemburCostByHours = (submission, hours) => {
    const requestedFactor = getOvertimeFactor(hours, submission.isHariLibur);
    if (requestedFactor <= 0) return 0;

    let hourlyRate = Number(submission.tarifLembur) || 0;
    if (hourlyRate <= 0) {
      // Kompatibilitas data lama: biaya_lembur tersimpan berdasarkan jam efektif.
      const effectiveHours = Number(
        submission.jumlahJamKoreksi ?? submission.durasiJamApproved ?? submission.durasiJam ?? 0
      ) || 0;
      const effectiveFactor = getOvertimeFactor(effectiveHours, submission.isHariLibur);
      const storedCost = Number(submission.estimasiBiayaRupiah ?? submission.biayaLembur ?? 0) || 0;
      if (effectiveFactor > 0 && storedCost > 0) hourlyRate = storedCost / effectiveFactor;
    }

    return hourlyRate > 0 ? Math.ceil(hourlyRate * requestedFactor) : 0;
  };

  lemburSubmissionsFiltered.forEach((s) => {
    const st = (s.status || "").toLowerCase();
    const isApproved = ["approved", "disetujui", "completed", "acc", "approved_2", "selesai"].includes(st);
    const submittedHours = Number(s.durasiJam) || 0;
    const correctedHours = Number(s.jumlahJamKoreksi ?? s.durasiJamApproved ?? submittedHours);
    const submittedCost = calculateLemburCostByHours(s, submittedHours);
    const effectiveCost = calculateLemburCostByHours(
      s,
      Number.isNaN(correctedHours) ? submittedHours : correctedHours
    );
    
    totalBiayaLemburDiajukan += submittedCost;
    countBiayaDiajukan += 1;

    if (isApproved) {
      totalBiayaLemburApproved += effectiveCost;
      countBiayaApproved += 1;
    } else {
      totalBiayaLemburPending += effectiveCost;
      countBiayaPending += 1;
    }
  });

  const totalBiayaLemburAnalysis = totalBiayaLemburDiajukan;

  // Top 3 Process Cost Items for Card 2
  const top3CostProcess = [
    {
      rank: 1,
      title: "Total Biaya Diajukan",
      subLabel: "Berdasarkan Jam Pengajuan Maker",
      amount: totalBiayaLemburDiajukan,
      count: countBiayaDiajukan,
      pct: 100,
      badgeColor: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400 shadow-2xs",
      barColor: "bg-gradient-to-r from-emerald-500 to-teal-600",
      tagStyle: "bg-emerald-50 text-emerald-950 border-emerald-200/80 font-black"
    },
    {
      rank: 2,
      title: "Biaya Status Disetujui",
      subLabel: "Berdasarkan Jam Koreksi yang Disetujui",
      amount: totalBiayaLemburApproved,
      count: countBiayaApproved,
      pct: totalBiayaLemburDiajukan > 0 ? Math.round((totalBiayaLemburApproved / totalBiayaLemburDiajukan) * 100) : 0,
      badgeColor: "bg-sky-200 text-sky-900 border border-sky-300 font-bold",
      barColor: "bg-sky-500",
      tagStyle: "bg-sky-50 text-sky-950 border-sky-200/80 font-black"
    },
    {
      rank: 3,
      title: "Biaya Menunggu Approval",
      subLabel: "Berdasarkan Jam Efektif Saat Ini",
      amount: totalBiayaLemburPending,
      count: countBiayaPending,
      pct: totalBiayaLemburDiajukan > 0 ? Math.round((totalBiayaLemburPending / totalBiayaLemburDiajukan) * 100) : 0,
      badgeColor: "bg-amber-100 text-amber-900 border border-amber-200/80 font-bold",
      barColor: "bg-amber-500",
      tagStyle: "bg-amber-50 text-amber-950 border-amber-200/80 font-black"
    }
  ];

  // Top 3 Pegawai Lembur Tertinggi (Calculated from real data)
  const pegawaiOvertimeMap = {};
  safeSubmissions
    .filter((s) => s.type === "lembur")
    .forEach((s) => {
      const name = s.employeeName || s.namaPegawai || "Pegawai";
      const st = (s.status || "").toLowerCase();
      const isRejected = st === "rejected" || st === "ditolak";
      const isRevision = st === "revision" || st === "revision_required" || st === "revisi";
      const isApproved = ["approved", "disetujui", "completed", "acc", "approved_2", "selesai"].includes(st);
      
      const jamSubmit = Number(s.durasiJam) || 0;
      const jamApprove = Number(s.durasiJamApproved || (isApproved ? s.durasiJam : 0)) || 0;

      if (!pegawaiOvertimeMap[name]) {
        pegawaiOvertimeMap[name] = {
          name,
          totalPengajuan: 0,
          totalDisetujui: 0,
          count: 0
        };
      }
      if (!isRejected && !isRevision) {
        pegawaiOvertimeMap[name].totalPengajuan += jamSubmit;
      }
      pegawaiOvertimeMap[name].totalDisetujui += jamApprove;
      pegawaiOvertimeMap[name].count += 1;
    });

  const top3Pegawai = Object.values(pegawaiOvertimeMap)
    .sort((a, b) => b.totalPengajuan - a.totalPengajuan || b.totalDisetujui - a.totalDisetujui)
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));

  let highestPegawaiName = "-";
  let highestPegawaiHours = 0;
  if (top3Pegawai.length > 0) {
    highestPegawaiName = top3Pegawai[0].name;
    highestPegawaiHours = top3Pegawai[0].totalPengajuan;
  }

  // Pareto 80/20 Rule Overtime Analysis Data Calculation
  const paretoData = useMemo(() => {
    if (!lemburSubmissionsFiltered || lemburSubmissionsFiltered.length === 0) {
      return [];
    }

    const categoryMap = {};

    lemburSubmissionsFiltered.forEach((sub) => {
      let key = "Kategori Belum Diisi";
      if (paretoGroupBy === "unit") {
        key = sub.unitUltg || sub.unitUpt || sub.garduInduk || sub.ultg || sub.upt || "UPT Semarang";
      } else if (paretoGroupBy === "unit GI" || paretoGroupBy === "gi") {
        key = sub.garduInduk || sub.unitGi || sub.gi || sub.lokasiGi || sub.lokasiPekerjaan || sub.unitUltg || "Gardu Induk / Lokasi";
      } else if (paretoGroupBy === "pegawai") {
        key = sub.employeeName || sub.employeeNip || "Pegawai";
      } else {
        key = sub.kategoriLembur || sub.jenisPekerjaan || sub.pekerjaan || sub.keterangan || "Pekerjaan Pemeliharaan";
        if (key.length > 35) {
          key = key.substring(0, 32) + "...";
        }
      }

      const jam = Number(sub.durasiJam) || 0;
      const biaya = Number(sub.estimasiBiayaRupiah ?? sub.biayaLembur ?? 0) || 0;

      if (!categoryMap[key]) {
        categoryMap[key] = { category: key, total_jam: 0, total_biaya: 0, count: 0 };
      }
      categoryMap[key].total_jam += jam;
      categoryMap[key].total_biaya += biaya;
      categoryMap[key].count += 1;
    });

    const sorted = Object.values(categoryMap).sort((a, b) => b.total_jam - a.total_jam);
    const grandTotalJam = sorted.reduce((acc, curr) => acc + curr.total_jam, 0);

    let cumulativeSum = 0;
    return sorted.map((item) => {
      cumulativeSum += item.total_jam;
      const contribution_pct = grandTotalJam > 0 ? (item.total_jam / grandTotalJam) * 100 : 0;
      const cumulative_pct = grandTotalJam > 0 ? (cumulativeSum / grandTotalJam) * 100 : 0;

      return {
        category: item.category,
        total_jam: Math.round(item.total_jam * 10) / 10,
        total_biaya: item.total_biaya,
        count: item.count,
        contribution_pct: Math.round(contribution_pct * 10) / 10,
        cumulative_pct: Math.min(100, Math.round(cumulative_pct * 10) / 10)
      };
    });
  }, [lemburSubmissionsFiltered, paretoGroupBy]);

  const pareto80Count = useMemo(() => {
    if (!paretoData || paretoData.length === 0) return 0;
    const count = paretoData.filter((p) => p.cumulative_pct <= 80).length;
    return count > 0 ? count : 1;
  }, [paretoData]);

  // Kategori dashboard mengikuti snapshot yang tersimpan pada transaksi.
  // Jenis pekerjaan hanya menjadi fallback untuk data legacy tanpa kategori.
  const categoryCountMap = new Map();
  lemburSubmissionsFiltered.forEach((s) => {
    const label = String(
      s.kategoriLembur ||
      s.jenisPekerjaan ||
      s.pekerjaan ||
      "Kategori Belum Diisi"
    ).trim();
    const normalized = label.toLocaleLowerCase("id-ID");
    const current = categoryCountMap.get(normalized);
    categoryCountMap.set(normalized, {
      name: current?.name || label,
      count: (current?.count || 0) + 1
    });
  });

  const sortedCategories = Array.from(categoryCountMap.values())
    .map(({ name, count }) => [name, count])
    .sort((a, b) => b[1] - a[1]);

  let topCategoryName = "-";
  let topCategoryPct = 0;
  if (sortedCategories.length > 0 && lemburSubmissionsFiltered.length > 0) {
    topCategoryName = sortedCategories[0][0];
    topCategoryPct = Math.round((sortedCategories[0][1] / lemburSubmissionsFiltered.length) * 100);
  }

  const totalSubmissionsFilteredCount = lemburSubmissionsFiltered.length || 1;
  const top3Categories = sortedCategories.slice(0, 3).map(([name, count], index) => ({
    name,
    count,
    pct: Math.round((count / totalSubmissionsFilteredCount) * 100),
    rank: index + 1
  }));

  // Distribution Pie Data for Overtime Categories
  const categoryColors = ["#00A3E0", "#E30613", "#10B981", "#F59E0B", "#06B6D4", "#8B5CF6"];
  const lemburCategoryPieData = sortedCategories.map(([name, value], idx) => ({
    name,
    value,
    color: categoryColors[idx % categoryColors.length]
  }));

  // Group Area Hours Breakdown (Area GI vs Area Transmisi) - Diajukan vs Disetujui
  let giJamDiajukan = 0;
  let giJamDisetujui = 0;
  let transmisiJamDiajukan = 0;
  let transmisiJamDisetujui = 0;

  lemburSubmissionsFiltered.forEach((s) => {
    const area = (s.areaGroup || "").toLowerCase();
    const st = (s.status || "").toLowerCase();
    const isApproved = ["approved", "disetujui", "completed", "acc", "approved_2", "selesai"].includes(st);
    
    const jamSubmit = Number(s.durasiJam) || 0;
    const jamApprove = Number(s.durasiJamApproved || (isApproved ? s.durasiJam : 0)) || 0;

    const isGi = area.includes("gi") || area.includes("gardu");
    const isTransmisi = area.includes("transmisi") || area.includes("sutt");

    if (isGi) {
      giJamDiajukan += jamSubmit;
      if (isApproved) giJamDisetujui += jamApprove;
    } else if (isTransmisi) {
      transmisiJamDiajukan += jamSubmit;
      if (isApproved) transmisiJamDisetujui += jamApprove;
    } else {
      const giOrTrans = (s.garduInduk || s.unitUltg || s.jenisPekerjaan || "").toLowerCase();
      if (giOrTrans.includes("transmisi") || giOrTrans.includes("sutt") || giOrTrans.includes("pemberat")) {
        transmisiJamDiajukan += jamSubmit;
        if (isApproved) transmisiJamDisetujui += jamApprove;
      } else {
        giJamDiajukan += jamSubmit;
        if (isApproved) giJamDisetujui += jamApprove;
      }
    }
  });

  const displayJamGi = giJamDiajukan;
  const displayJamTransmisi = transmisiJamDiajukan;

  const pctGiApproved = giJamDiajukan > 0 ? Math.round((giJamDisetujui / giJamDiajukan) * 100) : 0;
  const pctTransmisiApproved = transmisiJamDiajukan > 0 ? Math.round((transmisiJamDisetujui / transmisiJamDiajukan) * 100) : 0;

  const totalGroupDiajukan = giJamDiajukan + transmisiJamDiajukan;
  const totalGroupDisetujui = giJamDisetujui + transmisiJamDisetujui;
  const totalGroupPctApproved = totalGroupDiajukan > 0 ? Math.round((totalGroupDisetujui / totalGroupDiajukan) * 100) : 0;

  const maxJamGroup = Math.max(displayJamGi, displayJamTransmisi, 1);

  // Process Status Counts
  const statusCounts = {
    draft: safeSubmissions.filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st === "draft" || st === "pengajuan_baru";
    }).length,
    pending: safeSubmissions.filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st.includes("pending") || st === "submitted";
    }).length,
    approved: safeSubmissions.filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st === "approved" || st === "disetujui";
    }).length,
    revision: safeSubmissions.filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st === "revision" || st === "revision_required" || st === "revisi";
    }).length,
    rejected: safeSubmissions.filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st === "rejected" || st === "ditolak";
    }).length,
  };

  const pendingApprovals = safeSubmissions.filter((sub) => {
    if (isMaker) {
      const st = (sub.status || "").toLowerCase();
      return st.includes("pending") || st === "submitted" || st === "draft";
    }
    if (currentUser?.role === "admin") return sub.status && sub.status.toLowerCase().startsWith("pending_");
    return sub.currentApproverRole === currentUser?.role;
  });

  const displayTableSubmissions = safeSubmissions.filter((sub) => {
    if (selectedStatusCard === "draft") {
      const st = (sub.status || "").toLowerCase();
      return st === "draft" || st === "pengajuan_baru";
    }
    if (selectedStatusCard === "pending") {
      const st = (sub.status || "").toLowerCase();
      return st.includes("pending") || st === "submitted";
    }
    if (selectedStatusCard === "approved") {
      const st = (sub.status || "").toLowerCase();
      return st === "approved" || st === "disetujui";
    }
    if (selectedStatusCard === "revision") {
      const st = (sub.status || "").toLowerCase();
      return st === "revision" || st === "revision_required" || st === "revisi";
    }
    if (selectedStatusCard === "rejected") {
      const st = (sub.status || "").toLowerCase();
      return st === "rejected" || st === "ditolak";
    }

    if (isMaker) {
      return true;
    }
    if (currentUser?.role === "admin") return sub.status && sub.status.toLowerCase().startsWith("pending_");
    return sub.currentApproverRole === currentUser?.role;
  });

  const handleOpenApproveSign = (sub) => {
    setSelectedSubForApproval(sub);
    setIsSignModalOpen(true);
  };

  const handleSaveApprovalSignature = (signatureDataUrl) => {
    if (!selectedSubForApproval) return;
    DataService.processApproval(
      selectedSubForApproval.id,
      currentUser,
      "approve",
      signatureDataUrl,
      `Disetujui oleh ${currentUser.name} (${currentUser.jabatan})`
    );
    setIsSignModalOpen(false);
    setSelectedSubForApproval(null);
    onRefreshData();
  };

  const handleOpenRejectModal = (sub) => {
    setRejectModalSub(sub);
    setRejectionNote("");
  };

  const handleConfirmReject = () => {
    if (!rejectModalSub) return;
    DataService.processApproval(
      rejectModalSub.id,
      currentUser,
      "reject",
      void 0,
      rejectionNote || "Dokumen ditolak pada tahap " + currentUser.role
    );
    setRejectModalSub(null);
    onRefreshData();
  };

  const handleExportExcel = () => {
    ExportService.exportSubmissionsToExcel(safeSubmissions, "Laporan_Rekapitulasi_E-Presensi_PLN.xlsx");
  };

  const handleExportPPT = () => {
    const totalCost = safeSubmissions
      .filter((s) => s.type === "lembur")
      .reduce((a, b) => a + (Number(b.estimasiBiayaRupiah) || 0), 0);
    ExportService.exportSummaryPresentationPPT(safeSubmissions, {
      totalHours: totalLemburJam,
      totalCost,
      activeCount: safeSubmissions.length
    });
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "disetujui") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disetujui
        </span>
      );
    }
    if (s === "rejected" || s === "ditolak") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" /> Ditolak
        </span>
      );
    }
    if (s === "revision" || s === "revision_required") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Perlu Revisi
        </span>
      );
    }
    if (s === "draft" || s === "pengajuan_baru") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
          <FileClock className="w-3 h-3 text-slate-500" /> Draft / Inisiasi
        </span>
      );
    }
    let label = "Menunggu Approval";
    if (s === "pending_spv") label = "Menunggu Supervisor";
    else if (s === "pending_manajer") label = "Menunggu Manajer";
    else if (s === "pending_sistem") label = "Menunggu Sistem";
    else if (s === "pending_sdm") label = "Menunggu SDM";
    else if (s === "pending_keuangan") label = "Menunggu Keuangan";

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-50 text-sky-800 border border-sky-200">
        <Clock className="w-3 h-3 text-sky-600 animate-pulse" /> {label}
      </span>
    );
  };

  // --- DETAILED BREAKDOWN CALCULATIONS FOR METRIC CARDS (TASK 3) ---
  // 1. Lembur Breakdown
  const lemburSubs = safeSubmissions.filter((s) => s.type === "lembur");
  const lemburJamPengajuan = totalLemburJam;
  const lemburJamDisetujui = lemburSubs
    .filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st === "approved" || st === "disetujui";
    })
    .reduce((acc, curr) => acc + (Number(curr.durasiJam) || 0), 0);
  const lemburStatusCounts = {
    draft: lemburSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "draft" || st === "pengajuan_baru"; }).length,
    pending: lemburSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st.includes("pending") || st === "submitted"; }).length,
    approved: lemburSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "approved" || st === "disetujui"; }).length,
    revision: lemburSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "revision" || st === "revision_required" || st === "revisi"; }).length,
    rejected: lemburSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "rejected" || st === "ditolak"; }).length,
  };
  const lemburCategoryMap = {};
  lemburSubs.forEach((s) => {
    const cat = s.kategoriLembur || s.jenisPekerjaan || s.pekerjaan || "Kategori Belum Diisi";
    if (!lemburCategoryMap[cat]) lemburCategoryMap[cat] = { count: 0, hours: 0 };
    lemburCategoryMap[cat].count += 1;
    lemburCategoryMap[cat].hours += Number(s.durasiJam) || 0;
  });

  // 2. Cuti Breakdown
  const cutiSubs = safeSubmissions.filter((s) => s.type === "cuti");
  const cutiTotalHari = cutiSubs.reduce((acc, curr) => acc + (Number(curr.jumlahHari) || Number(curr.durasiHari) || 1), 0);
  const cutiHariDisetujui = cutiSubs
    .filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st === "approved" || st === "disetujui";
    })
    .reduce((acc, curr) => acc + (Number(curr.jumlahHari) || Number(curr.durasiHari) || 1), 0);
  const cutiStatusCounts = {
    draft: cutiSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "draft" || st === "pengajuan_baru"; }).length,
    pending: cutiSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st.includes("pending") || st === "submitted"; }).length,
    approved: cutiSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "approved" || st === "disetujui"; }).length,
    revision: cutiSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "revision" || st === "revision_required" || st === "revisi"; }).length,
    rejected: cutiSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "rejected" || st === "ditolak"; }).length,
  };
  const cutiTypeMap = {};
  cutiSubs.forEach((s) => {
    const typeName = s.cutiType || "Cuti Tahunan";
    if (!cutiTypeMap[typeName]) cutiTypeMap[typeName] = { count: 0, days: 0 };
    cutiTypeMap[typeName].count += 1;
    cutiTypeMap[typeName].days += Number(s.jumlahHari) || Number(s.durasiHari) || 1;
  });

  // 3. Ijin Breakdown
  const ijinSubs = safeSubmissions.filter((s) => s.type === "ijin");
  const ijinTotalHari = ijinSubs.reduce((acc, curr) => acc + (Number(curr.jumlahHari) || 1), 0);
  const ijinHariDisetujui = ijinSubs
    .filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st === "approved" || st === "disetujui";
    })
    .reduce((acc, curr) => acc + (Number(curr.jumlahHari) || 1), 0);
  const ijinStatusCounts = {
    draft: ijinSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "draft" || st === "pengajuan_baru"; }).length,
    pending: ijinSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st.includes("pending") || st === "submitted"; }).length,
    approved: ijinSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "approved" || st === "disetujui"; }).length,
    revision: ijinSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "revision" || st === "revision_required" || st === "revisi"; }).length,
    rejected: ijinSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "rejected" || st === "ditolak"; }).length,
  };
  const ijinReasonMap = {};
  ijinSubs.forEach((s) => {
    const r = s.ijinReasonType || s.keterangan || "Keperluan Pribadi";
    if (!ijinReasonMap[r]) ijinReasonMap[r] = { count: 0, days: 0 };
    ijinReasonMap[r].count += 1;
    ijinReasonMap[r].days += Number(s.jumlahHari) || 1;
  });

  // 4. Sakit Breakdown
  const sakitSubs = safeSubmissions.filter((s) => s.type === "sakit");
  const sakitTotalHari = sakitSubs.reduce((acc, curr) => acc + (Number(curr.jumlahHari) || 1), 0);
  const sakitHariDisetujui = sakitSubs
    .filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st === "approved" || st === "disetujui";
    })
    .reduce((acc, curr) => acc + (Number(curr.jumlahHari) || 1), 0);
  const sakitWithSuratCount = sakitSubs.filter((s) => !!s.suratDokterUrl).length;
  const sakitStatusCounts = {
    draft: sakitSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "draft" || st === "pengajuan_baru"; }).length,
    pending: sakitSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st.includes("pending") || st === "submitted"; }).length,
    approved: sakitSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "approved" || st === "disetujui"; }).length,
    revision: sakitSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "revision" || st === "revision_required" || st === "revisi"; }).length,
    rejected: sakitSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "rejected" || st === "ditolak"; }).length,
  };
  const sakitKlinikMap = {};
  sakitSubs.forEach((s) => {
    const k = s.instansiKlinik || s.diagnosaSingkat || "Klinik / Dokter";
    if (!sakitKlinikMap[k]) sakitKlinikMap[k] = { count: 0, days: 0 };
    sakitKlinikMap[k].count += 1;
    sakitKlinikMap[k].days += Number(s.jumlahHari) || 1;
  });

  // 5. SPPD Breakdown
  const sppdSubs = safeSubmissions.filter((s) => s.type === "sppd");
  const sppdTotalHari = sppdSubs.reduce((acc, curr) => acc + (Number(curr.durasiHari) || 1), 0);
  const sppdHariDisetujui = sppdSubs
    .filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st === "approved" || st === "disetujui";
    })
    .reduce((acc, curr) => acc + (Number(curr.durasiHari) || 1), 0);
  const sppdTotalBiaya = sppdSubs.reduce((acc, curr) => {
    const expTotal = (curr.expenses || []).reduce((eAcc, e) => eAcc + (Number(e.nominal) || 0), 0);
    return acc + (expTotal || Number(curr.totalBiaya) || 0);
  }, 0);
  const sppdStatusCounts = {
    draft: sppdSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "draft" || st === "pengajuan_baru"; }).length,
    pending: sppdSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st.includes("pending") || st === "submitted"; }).length,
    approved: sppdSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "approved" || st === "disetujui"; }).length,
    revision: sppdSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "revision" || st === "revision_required" || st === "revisi"; }).length,
    rejected: sppdSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "rejected" || st === "ditolak"; }).length,
  };
  const sppdTujuanMap = {};
  sppdSubs.forEach((s) => {
    const dest = s.kotaTujuan || "Dinas Luar Kota";
    if (!sppdTujuanMap[dest]) sppdTujuanMap[dest] = { count: 0, days: 0 };
    sppdTujuanMap[dest].count += 1;
    sppdTujuanMap[dest].days += Number(s.durasiHari) || 1;
  });

  const pieData = [
    { name: "Lembur", value: lemburCount, color: "#6366F1" },
    { name: "Cuti", value: cutiCount, color: "#10B981" },
    { name: "Ijin", value: ijinCount, color: "#F59E0B" },
    { name: "Sakit", value: sakitCount, color: "#F43F5E" },
    { name: "SPPD", value: sppdCount, color: "#0D9488" }
  ];

  return (
    <div className="p-3 sm:p-6 space-y-6 select-none max-w-none">
      {/* 1. Header Greeting & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Selamat Datang, {currentUser?.name || "User"} 👋
            </h1>
            {/*<span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-200 uppercase tracking-wide">
              {currentUser?.role || "User"}
            </span> */}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Monitoring Real-Time Employee Form Request & Workflow Approval — <span className="font-bold text-slate-700">{selectedUpt}</span> ({selectedUltg})
          </p>
        </div>

        {/* Date Badge Filter & Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col items-center justify-center text-center shrink-0 shadow-2xs">
            {/* Teks Label di Atas */}
            <p className="text-[11px] text-slate-500 font-medium leading-tight">
              Periode Terpilih
            </p>

            {/* Icon + Periode Terpilih di Bawahnya */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mt-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-extrabold">{formattedPeriodText()}</span>
            </div>
          </div>
          {/*
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 rounded-xl flex items-center gap-1.5 border border-emerald-200 transition shadow-2xs cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Unduh Excel</span>
          </button>
          
          <button
            onClick={handleExportPPT}
            className="px-3.5 py-2 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 rounded-xl flex items-center gap-1.5 border border-indigo-200 transition shadow-2xs cursor-pointer active:scale-95"
          >
            <Presentation className="w-4 h-4 text-indigo-600" />
            <span>Laporan PPT</span>
          </button>
          */}
        </div>
      </div>

      {/* 2. Top Metric Cards Row - 5 Column Layout with Detailed Information Breakdown (Task 3) */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Total Lembur */}
          <div 
            onClick={() => onNavigateToTab && onNavigateToTab(isMaker ? "lembur" : "workflow")}
            className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] active:shadow-inner active:backdrop-blur-2xl ${
              expandedCardKey === "lembur"
                ? "bg-gradient-to-br from-indigo-100 via-white/90 to-sky-100 border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-200/50"
                : "bg-gradient-to-br from-indigo-100/80 via-indigo-50/60 to-sky-100/70 hover:from-indigo-100 hover:to-sky-100 border-indigo-200 hover:border-indigo-400"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold shadow-2xs">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardKey(expandedCardKey === "lembur" ? null : "lembur");
                  }}
                  className="px-2 py-0.5 rounded-full bg-indigo-100/90 text-indigo-800 text-[10px] font-black border border-indigo-300 flex items-center gap-1 hover:bg-indigo-200 transition"
                >
                  Detail {expandedCardKey === "lembur" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button> */}
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Total Lembur</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {totalLemburJam} <span className="text-xs font-bold text-slate-500">Jam</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">{lemburCount} Pegawai Terlibat</p>
            </div>

            {/* In-Card Details */}
            <div className="mt-3 pt-2.5 border-t border-indigo-200/80 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span>Pengajuan: <strong className="text-slate-900">{lemburJamPengajuan} Jam</strong></span>
                <span className="text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300">Disetujui: {lemburJamDisetujui} Jam</span>
              </div>
              <div className="text-[9.5px] text-slate-600 font-semibold truncate">
                <span className="font-bold text-slate-800">Kategori Pekerjaan:</span> {Object.keys(lemburCategoryMap).slice(0, 2).join(", ") || "Manuver & Maintenance"}
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold pt-1 border-t border-indigo-200/80 flex-wrap">
                <span className="text-slate-600">Draft: {lemburStatusCounts.draft}</span>
                <span className="text-amber-800">Menunggu: {lemburStatusCounts.pending}</span>
                <span className="text-emerald-800">Setuju: {lemburStatusCounts.approved}</span>
                <span className="text-purple-800">Revisi: {lemburStatusCounts.revision}</span>
                <span className="text-rose-800">Tolak: {lemburStatusCounts.rejected}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Permohonan Cuti */}
          <div 
            onClick={() => onNavigateToTab && onNavigateToTab(isMaker ? "cuti" : "workflow")}
            className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] active:shadow-inner active:backdrop-blur-2xl ${
              expandedCardKey === "cuti"
                ? "bg-gradient-to-br from-emerald-100 via-white/90 to-teal-100 border-emerald-500 ring-2 ring-emerald-500/30 shadow-emerald-200/50"
                : "bg-gradient-to-br from-emerald-100/80 via-emerald-50/60 to-teal-100/70 hover:from-emerald-100 hover:to-teal-100 border-emerald-200 hover:border-emerald-400"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
                  <Palmtree className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardKey(expandedCardKey === "cuti" ? null : "cuti");
                  }}
                  className="px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center gap-1 hover:bg-emerald-200 transition"
                >
                  Detail {expandedCardKey === "cuti" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button> */}
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Permohonan Cuti</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {cutiCount} <span className="text-xs font-bold text-slate-500">Orang</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Total: {cutiTotalHari} Hari Pengajuan</p>
            </div>

            {/* In-Card Details */}
            <div className="mt-3 pt-2.5 border-t border-emerald-200/80 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span>Total Cuti: <strong className="text-slate-900">{cutiTotalHari} Hari</strong></span>
                <span className="text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300">Disetujui: {cutiHariDisetujui} Hari</span>
              </div>
              <div className="text-[9.5px] text-slate-600 font-semibold truncate">
                <span className="font-bold text-slate-800">Jenis Cuti:</span> {Object.keys(cutiTypeMap).slice(0, 2).join(", ") || "Cuti Tahunan"}
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold pt-1 border-t border-emerald-200/80 flex-wrap">
                <span className="text-slate-600">Draft: {cutiStatusCounts.draft}</span>
                <span className="text-amber-800">Menunggu: {cutiStatusCounts.pending}</span>
                <span className="text-emerald-800">Setuju: {cutiStatusCounts.approved}</span>
                <span className="text-purple-800">Revisi: {cutiStatusCounts.revision}</span>
                <span className="text-rose-800">Tolak: {cutiStatusCounts.rejected}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Permohonan Ijin */}
          <div 
            onClick={() => onNavigateToTab && onNavigateToTab(isMaker ? "ijin" : "workflow")}
            className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] active:shadow-inner active:backdrop-blur-2xl ${
              expandedCardKey === "ijin"
                ? "bg-gradient-to-br from-amber-100 via-white/90 to-yellow-100 border-amber-500 ring-2 ring-amber-500/30 shadow-amber-200/50"
                : "bg-gradient-to-br from-amber-100/80 via-amber-50/60 to-yellow-100/70 hover:from-amber-100 hover:to-yellow-100 border-amber-200 hover:border-amber-400"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardKey(expandedCardKey === "ijin" ? null : "ijin");
                  }}
                  className="px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-800 text-[10px] font-black border border-amber-300 flex items-center gap-1 hover:bg-amber-200 transition"
                >
                  Detail {expandedCardKey === "ijin" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button> */}
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Permohonan Ijin</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {ijinCount} <span className="text-xs font-bold text-slate-500">Orang</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Total: {ijinTotalHari} Hari Ijin</p>
            </div>

            {/* In-Card Details */}
            <div className="mt-3 pt-2.5 border-t border-amber-200/80 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span>Total Ijin: <strong className="text-slate-900">{ijinTotalHari} Hari</strong></span>
                <span className="text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300">Disetujui: {ijinHariDisetujui} Hari</span>
              </div>
              <div className="text-[9.5px] text-slate-600 font-semibold truncate">
                <span className="font-bold text-slate-800">Alasan:</span> {Object.keys(ijinReasonMap).slice(0, 2).join(", ") || "Keperluan Keluarga"}
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold pt-1 border-t border-amber-200/80 flex-wrap">
                <span className="text-slate-600">Draft: {ijinStatusCounts.draft}</span>
                <span className="text-amber-800">Menunggu: {ijinStatusCounts.pending}</span>
                <span className="text-emerald-800">Setuju: {ijinStatusCounts.approved}</span>
                <span className="text-purple-800">Revisi: {ijinStatusCounts.revision}</span>
                <span className="text-rose-800">Tolak: {ijinStatusCounts.rejected}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Perizinan Sakit */}
          <div 
            onClick={() => onNavigateToTab && onNavigateToTab(isMaker ? "sakit" : "workflow")}
            className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] active:shadow-inner active:backdrop-blur-2xl ${
              expandedCardKey === "sakit"
                ? "bg-gradient-to-br from-rose-100 via-white/90 to-pink-100 border-rose-500 ring-2 ring-rose-500/30 shadow-rose-200/50"
                : "bg-gradient-to-br from-rose-100/80 via-rose-50/60 to-pink-100/70 hover:from-rose-100 hover:to-pink-100 border-rose-200 hover:border-rose-400"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center font-bold shadow-2xs">
                  <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardKey(expandedCardKey === "sakit" ? null : "sakit");
                  }}
                  className="px-2 py-0.5 rounded-full bg-rose-100/90 text-rose-800 text-[10px] font-black border border-rose-300 flex items-center gap-1 hover:bg-rose-200 transition"
                >
                  Detail {expandedCardKey === "sakit" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button> */}
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Perizinan Sakit</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {sakitCount} <span className="text-xs font-bold text-slate-500">Orang</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Surat Dokter: {sakitWithSuratCount} Lampiran</p>
            </div>

            {/* In-Card Details */}
            <div className="mt-3 pt-2.5 border-t border-rose-200/80 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span>Total Sakit: <strong className="text-slate-900">{sakitTotalHari} Hari</strong></span>
                <span className="text-rose-800 bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300">Dokter: {sakitWithSuratCount}</span>
              </div>
              <div className="text-[9.5px] text-slate-600 font-semibold truncate">
                <span className="font-bold text-slate-800">Klinik/Diagnosa:</span> {Object.keys(sakitKlinikMap).slice(0, 2).join(", ") || "RSUD / ISPA"}
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold pt-1 border-t border-rose-200/80 flex-wrap">
                <span className="text-slate-600">Draft: {sakitStatusCounts.draft}</span>
                <span className="text-amber-800">Menunggu: {sakitStatusCounts.pending}</span>
                <span className="text-emerald-800">Setuju: {sakitStatusCounts.approved}</span>
                <span className="text-purple-800">Revisi: {sakitStatusCounts.revision}</span>
                <span className="text-rose-800">Tolak: {sakitStatusCounts.rejected}</span>
              </div>
            </div>
          </div>

          {/* Card 5: Perjalanan Dinas SPPD */}
          <div 
            onClick={() => onNavigateToTab && onNavigateToTab(isMaker ? "sppd" : "workflow")}
            className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] active:shadow-inner active:backdrop-blur-2xl ${
              expandedCardKey === "sppd"
                ? "bg-gradient-to-br from-teal-100 via-white/90 to-cyan-100 border-teal-500 ring-2 ring-teal-500/30 shadow-teal-200/50"
                : "bg-gradient-to-br from-teal-100/80 via-teal-50/60 to-cyan-100/70 hover:from-teal-100 hover:to-cyan-100 border-teal-200 hover:border-teal-400"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center font-bold shadow-2xs">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardKey(expandedCardKey === "sppd" ? null : "sppd");
                  }}
                  className="px-2 py-0.5 rounded-full bg-teal-100/90 text-teal-800 text-[10px] font-black border border-teal-300 flex items-center gap-1 hover:bg-teal-200 transition"
                  >
                  Detail {expandedCardKey === "sppd" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button> */}
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Perjalanan Dinas SPPD</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {sppdCount} <span className="text-xs font-bold text-slate-500">Tugas</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Estimasi Biaya: {formatRupiah(sppdTotalBiaya)}</p>
            </div>

            {/* In-Card Details */}
            <div className="mt-3 pt-2.5 border-t border-teal-200/80 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span>Total SPPD: <strong className="text-slate-900">{sppdTotalHari} Hari</strong></span>
                <span className="text-teal-800 bg-teal-100/80 px-1.5 py-0.5 rounded border border-teal-300">Biaya: {formatRupiah(sppdTotalBiaya)}</span>
              </div>
              <div className="text-[9.5px] text-slate-600 font-semibold truncate">
                <span className="font-bold text-slate-800">Kota Tujuan:</span> {Object.keys(sppdTujuanMap).slice(0, 2).join(", ") || "Salatiga, Kudus"}
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold pt-1 border-t border-teal-200/80 flex-wrap">
                <span className="text-slate-600">Draft: {sppdStatusCounts.draft}</span>
                <span className="text-amber-800">Menunggu: {sppdStatusCounts.pending}</span>
                <span className="text-emerald-800">Setuju: {sppdStatusCounts.approved}</span>
                <span className="text-purple-800">Revisi: {sppdStatusCounts.revision}</span>
                <span className="text-rose-800">Tolak: {sppdStatusCounts.rejected}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Drawer / Panel View (Task 3) - REMARKED / DISABLED */}
        {false && expandedCardKey && (() => {
          const activeStatusCounts = 
            expandedCardKey === "lembur" ? lemburStatusCounts :
            expandedCardKey === "cuti" ? cutiStatusCounts :
            expandedCardKey === "ijin" ? ijinStatusCounts :
            expandedCardKey === "sakit" ? sakitStatusCounts :
            expandedCardKey === "sppd" ? sppdStatusCounts :
            { draft: 0, pending: 0, approved: 0, revision: 0, rejected: 0 };

          const moduleTitleMap = {
            lembur: "Lembur",
            cuti: "Cuti",
            ijin: "Ijin",
            sakit: "Sakit",
            sppd: "SPPD Perjalanan Dinas"
          };

          return (
            <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                    Rincian Informasi Detail Modul: <span className="text-indigo-600">{moduleTitleMap[expandedCardKey]?.toUpperCase() || expandedCardKey.toUpperCase()}</span>
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedCardKey(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/80 transition"
                    title="Tutup Detail"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Process Cards Breakdown */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                  Status Proses Dokumen {moduleTitleMap[expandedCardKey]}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Draft</span>
                      <span className="text-base font-black text-slate-900 mt-0.5 block">{activeStatusCounts.draft} Dokumen</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600 border border-slate-200">
                      <FileClock className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Menunggu Approval</span>
                      <span className="text-base font-black text-amber-950 mt-0.5 block">{activeStatusCounts.pending} Dokumen</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg text-amber-600 border border-amber-200">
                      <Hourglass className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Disetujui</span>
                      <span className="text-base font-black text-emerald-950 mt-0.5 block">{activeStatusCounts.approved} Dokumen</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg text-emerald-600 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Perlu Revisi</span>
                      <span className="text-base font-black text-purple-950 mt-0.5 block">{activeStatusCounts.revision} Dokumen</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg text-purple-600 border border-purple-200">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200/80 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Ditolak</span>
                      <span className="text-base font-black text-rose-950 mt-0.5 block">{activeStatusCounts.rejected} Dokumen</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg text-rose-600 border border-rose-200">
                      <XCircle className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content view per module key */}
              {expandedCardKey === "lembur" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Ringkasan Jam Lembur</span>
                    <p className="text-lg font-black text-slate-900">{lemburJamPengajuan} Jam Total Pengajuan</p>
                    <p className="text-xs text-emerald-700 font-bold">{lemburJamDisetujui} Jam Disetujui ({lemburCount} Pegawai)</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2 shadow-2xs">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Kategori Jenis Pekerjaan Lembur</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(lemburCategoryMap).length === 0 ? (
                        <span className="text-slate-400 font-medium">Belum ada pengajuan lembur.</span>
                      ) : (
                        Object.entries(lemburCategoryMap).map(([cat, val], idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-lg font-bold border border-indigo-100 flex items-center gap-1.5">
                            {cat}: <strong className="text-indigo-950">{val.hours} Jam</strong> ({val.count} Pengajuan)
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {expandedCardKey === "cuti" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Ringkasan Hari Cuti</span>
                    <p className="text-lg font-black text-slate-900">{cutiTotalHari} Hari Total Pengajuan</p>
                    <p className="text-xs text-emerald-700 font-bold">{cutiHariDisetujui} Hari Disetujui ({cutiCount} Pegawai)</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2 shadow-2xs">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Breakdown Jenis Cuti</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(cutiTypeMap).length === 0 ? (
                        <span className="text-slate-400 font-medium">Belum ada pengajuan cuti.</span>
                      ) : (
                        Object.entries(cutiTypeMap).map(([type, val], idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-bold border border-emerald-100 flex items-center gap-1.5">
                            {type}: <strong className="text-emerald-950">{val.days} Hari</strong> ({val.count} Pemohon)
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {expandedCardKey === "ijin" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Ringkasan Perizinan Ijin</span>
                    <p className="text-lg font-black text-slate-900">{ijinTotalHari} Hari Permohonan Ijin</p>
                    <p className="text-xs text-emerald-700 font-bold">{ijinHariDisetujui} Hari Disetujui ({ijinCount} Pegawai)</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2 shadow-2xs">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Detail Alasan Permohonan Ijin</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ijinReasonMap).length === 0 ? (
                        <span className="text-slate-400 font-medium">Belum ada permohonan ijin.</span>
                      ) : (
                        Object.entries(ijinReasonMap).map(([reason, val], idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg font-bold border border-amber-100 flex items-center gap-1.5">
                            {reason}: <strong className="text-amber-950">{val.days} Hari</strong> ({val.count} Orang)
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {expandedCardKey === "sakit" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Ringkasan Perizinan Sakit</span>
                    <p className="text-lg font-black text-slate-900">{sakitTotalHari} Hari Izin Sakit</p>
                    <p className="text-xs text-rose-700 font-bold">{sakitWithSuratCount} Pengajuan Dilengkapi Surat Keterangan Dokter</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2 shadow-2xs">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Detail Instansi Klinik & Diagnosa Sakit</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(sakitKlinikMap).length === 0 ? (
                        <span className="text-slate-400 font-medium">Belum ada data perizinan sakit.</span>
                      ) : (
                        Object.entries(sakitKlinikMap).map(([klinik, val], idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-rose-50 text-rose-800 rounded-lg font-bold border border-rose-100 flex items-center gap-1.5">
                            {klinik}: <strong className="text-rose-950">{val.days} Hari</strong> ({val.count} Kasus)
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {expandedCardKey === "sppd" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Ringkasan SPPD Perjalanan Dinas</span>
                    <p className="text-lg font-black text-slate-900">{sppdTotalHari} Hari Total Tugas Dinas</p>
                    <p className="text-xs text-teal-700 font-bold">Estimasi Biaya Anggaran: {formatRupiah(sppdTotalBiaya)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2 shadow-2xs">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Detail Destinasi Kota Tujuan SPPD</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(sppdTujuanMap).length === 0 ? (
                        <span className="text-slate-400 font-medium">Belum ada tugas SPPD.</span>
                      ) : (
                        Object.entries(sppdTujuanMap).map(([dest, val], idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg font-bold border border-teal-100 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-teal-600" /> {dest}: <strong className="text-teal-950">{val.days} Hari</strong> ({val.count} Tugas)
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* 3. Analisis Lembur & Kategori (Executive Analytics Dashboard) */}
      {!isMaker && (
        <>
          {/* Main Analytics Card Container */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            
            {/* Executive Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Analisis Lembur &amp; Kategori Pekerjaan
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Dashboard analitis akumulasi jam, estimasi biaya, dan pola kerja lembur ({selectedUpt} — {selectedUltg})
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Context Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-extrabold rounded-xl border border-emerald-200/80 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Disetujui / Menunggu: <strong className="text-emerald-900">{lemburSubmissionsFiltered.length} Dok ({totalJamLemburAnalysis} Jam)</strong></span>
                </div>
                {lemburSubmissionsRevision.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-[11px] font-extrabold rounded-xl border border-purple-200/80 shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
                    <span>Revisi: <strong className="text-purple-900">{lemburSubmissionsRevision.length} Dok</strong></span>
                  </div>
                )}
                {lemburSubmissionsRejected.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 text-[11px] font-extrabold rounded-xl border border-rose-200/80 shadow-2xs">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Ditolak: <strong className="text-rose-900">{lemburSubmissionsRejected.length} Dok</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-xl border border-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unit Filter Active</span>
                </div>
              </div>
            </div>

            {/* Top 4 Key Performance Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Top 3 Tahapan Jam Lembur (Diajukan, Direvisi, Disetujui) */}
              <div className="relative overflow-hidden bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-slate-50 p-4 rounded-2xl border border-sky-100/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-sky-100/80 pb-2.5">
                    <span className="text-[11px] font-black text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      TAHAPAN JAM LEMBUR
                    </span>
                    <span className="px-2 py-0.5 bg-sky-600 text-white text-[10px] font-black rounded-lg shadow-2xs">
                      Proses 1 - 3
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2">
                    {top3HoursProcess.map((item) => (
                      <div
                        key={item.title}
                        className={item.cardStyle || "group relative bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-sky-100/70 shadow-2xs hover:border-sky-300 transition-all duration-150"}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-lg shrink-0 flex items-center justify-center min-w-[20px] h-5 ${item.badgeColor}`}>
                              #{item.rank}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-black text-slate-800 leading-snug block">
                                {item.title}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 block">
                                {item.subLabel}
                              </span>
                            </div>
                          </div>
                          <div className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg border shrink-0 flex items-center gap-1 ${item.tagStyle}`}>
                            <span>{item.hours.toLocaleString("id-ID")} Jam</span>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                              style={{ width: `${Math.max(6, item.pct)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-600 shrink-0">
                            {item.pct}% <span className="font-normal text-slate-400">({item.count} dok)</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-sky-100/80 flex items-center justify-between text-[10px] font-bold text-sky-950">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-sky-600" />
                    <span>Total Personel Terlibat</span>
                  </span>
                  <span className="bg-sky-100/90 text-sky-900 px-2 py-0.5 rounded-md font-extrabold">
                    {totalPegawaiTerlibat} Personel
                  </span>
                </div>
              </div>

              {/* Card 2: Top 3 Process Biaya Lembur (Estimasi Total, Disetujui, Diajukan) */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-slate-50 p-4 rounded-2xl border border-emerald-100/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-emerald-100/80 pb-2.5">
                    <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      TAHAPAN BIAYA LEMBUR
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-lg shadow-2xs">
                      Proses 1 - 3
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2">
                    {top3CostProcess.map((item) => (
                      <div
                        key={item.title}
                        className="group relative bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-emerald-100/70 shadow-2xs hover:border-emerald-300 transition-all duration-150"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-lg shrink-0 flex items-center justify-center min-w-[20px] h-5 ${item.badgeColor}`}>
                              #{item.rank}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-black text-slate-800 leading-snug block">
                                {item.title}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 block">
                                {item.subLabel}
                              </span>
                            </div>
                          </div>
                          <div className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg border shrink-0 flex items-center gap-1 ${item.tagStyle}`}>
                            <span>{formatRupiah(item.amount)}</span>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                              style={{ width: `${Math.max(6, item.pct)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-600 shrink-0">
                            {item.pct}% <span className="font-normal text-slate-400">({item.count} dok)</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-emerald-100/80 flex items-center justify-between text-[10px] font-bold text-emerald-950">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Perhitungan Formula UPT</span>
                  </span>
                  <span className="bg-emerald-100/90 text-emerald-900 px-2 py-0.5 rounded-md font-extrabold">
                    {formatRupiah(totalBiayaLemburAnalysis)}
                  </span>
                </div>
              </div>

              {/* Card 3: Top 3 Pegawai Lembur Tertinggi */}
              <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-slate-50 p-4 rounded-2xl border border-amber-100/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-amber-100/80 pb-2.5">
                    <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      TOP 3 PEGAWAI LEMBUR
                    </span>
                    <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-black rounded-lg shadow-2xs">
                      Rank 1 - 3
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2">
                    {top3Pegawai.length > 0 ? (
                      top3Pegawai.map((item) => {
                        const isRank1 = item.rank === 1;
                        const isRank2 = item.rank === 2;

                        const rankBadgeStyle = isRank1
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xs border border-amber-400"
                          : isRank2
                          ? "bg-slate-200 text-slate-800 border border-slate-300"
                          : "bg-amber-100 text-amber-900 border border-amber-200/80";

                        return (
                          <div
                            key={item.name}
                            className="group relative bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-amber-100/70 shadow-2xs hover:border-amber-300 transition-all duration-150"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-lg shrink-0 flex items-center justify-center min-w-[20px] h-5 ${rankBadgeStyle}`}>
                                  #{item.rank}
                                </span>
                                <span className="text-xs font-black text-slate-800 leading-snug break-words">
                                  {item.name}
                                </span>
                              </div>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                              <span className="px-2 py-0.5 bg-sky-50 text-sky-800 rounded-md border border-sky-200/80 flex items-center gap-1">
                                <span className="text-sky-600 font-medium">Diajukan:</span>
                                <strong className="text-sky-950 font-black">{item.totalPengajuan} Jam</strong>
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200/80 flex items-center gap-1">
                                <span className="text-emerald-600 font-medium">Disetujui:</span>
                                <strong className="text-emerald-950 font-black">{item.totalDisetujui} Jam</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-xs font-semibold text-slate-400">
                        Belum Ada Data Pegawai
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-amber-100/80 flex items-center justify-between text-[10px] font-bold text-amber-950">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-amber-600" />
                    <span>Total Pegawai Terlibat</span>
                  </span>
                  <span className="bg-amber-100/90 text-amber-900 px-2 py-0.5 rounded-md font-extrabold">
                    {totalPegawaiTerlibat} Personel
                  </span>
                </div>
              </div>

              {/* Card 4: Top 3 Kategori Pekerjaan Terbanyak */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-slate-50 p-4 rounded-2xl border border-indigo-100/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2.5">
                    <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      TOP 3 KATEGORI DOMINAN
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg shadow-2xs">
                      Rank 1 - 3
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2">
                    {top3Categories.length > 0 ? (
                      top3Categories.map((item) => {
                        const isRank1 = item.rank === 1;
                        const isRank2 = item.rank === 2;

                        const rankBadgeStyle = isRank1
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xs border border-amber-400"
                          : isRank2
                          ? "bg-slate-200 text-slate-800 border border-slate-300"
                          : "bg-amber-100 text-amber-900 border border-amber-200/80";

                        const barColorStyle = isRank1
                          ? "bg-gradient-to-r from-amber-500 to-amber-600"
                          : isRank2
                          ? "bg-indigo-500"
                          : "bg-purple-500";

                        const badgeBgStyle = isRank1
                          ? "bg-amber-50 text-amber-900 border-amber-200/80"
                          : isRank2
                          ? "bg-indigo-50 text-indigo-900 border-indigo-200/80"
                          : "bg-purple-50 text-purple-900 border-purple-200/80";

                        return (
                          <div
                            key={item.name}
                            className="group relative bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-indigo-100/70 shadow-2xs hover:border-indigo-300 transition-all duration-150"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-lg shrink-0 flex items-center justify-center min-w-[20px] h-5 ${rankBadgeStyle}`}>
                                  #{item.rank}
                                </span>
                                <span className="text-xs font-black text-slate-800 leading-snug break-words">
                                  {item.name}
                                </span>
                              </div>
                              <div className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg border shrink-0 flex items-center gap-1 ${badgeBgStyle}`}>
                                <span>{item.pct}%</span>
                                <span className="text-slate-400 font-normal">({item.count} dok)</span>
                              </div>
                            </div>
                            <div className="mt-1.5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barColorStyle}`}
                                style={{ width: `${Math.max(8, item.pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-xs font-semibold text-slate-400">
                        Belum Ada Data Kategori
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-indigo-100/80 flex items-center justify-between text-[10px] font-bold text-indigo-950">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Kontributor Pareto</span>
                  </span>
                  <span className="bg-indigo-100/90 text-indigo-900 px-2 py-0.5 rounded-md font-extrabold">
                    {topCategoryPct}% Dominansi #1
                  </span>
                </div>
              </div>

            </div>

            {/* Pareto 80/20 Analysis Card */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-600 text-white rounded-xl shadow-xs">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      Grafik Pareto Lembur (Analisis Aturan 80/20)
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Mengidentifikasi 20% kategori utama pemicu 80% beban jam dan biaya lembur operasional
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">Kelompokkan:</span>
                  <select
                    value={paretoGroupBy}
                    onChange={(e) => setParetoGroupBy(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition shadow-2xs"
                  >
                    <option value="pekerjaan">Berdasarkan Pekerjaan / Penyebab</option>
                    <option value="unit">Berdasarkan Unit / ULTG</option>
                    <option value="unit GI">Berdasarkan Gardu Induk</option>
                    <option value="pegawai">Berdasarkan Pegawai</option>
                  </select>
                </div>
              </div>

              {/* Pareto KPI Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Jam Lembur</span>
                  <span className="text-sm sm:text-base font-black text-sky-700 mt-0.5">{totalJamLemburAnalysis.toLocaleString("id-ID")} Jam</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Estimasi Total Biaya</span>
                  <span className="text-sm sm:text-base font-black text-emerald-700 mt-0.5">{formatRupiah(totalBiayaLemburAnalysis)}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Kategori Pareto 80%</span>
                  <span className="text-sm sm:text-base font-black text-amber-700 mt-0.5">{pareto80Count} Kategori Utama</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Aturan Pareto 80/20</span>
                  <span className="text-xs sm:text-sm font-black text-indigo-700 mt-0.5">
                    {paretoData.length > 0 ? `${Math.round((pareto80Count / paretoData.length) * 100)}% Kategori = 80% Jam` : "100% Efisien"}
                  </span>
                </div>
              </div>

              {/* Pareto Composed Chart */}
              <ParetoOvertimeChart data={paretoData} groupBy={paretoGroupBy} />
            </div>

            {/* Visual Distribution Charts Row: Category Donut & Area Group Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
              
              {/* Category Breakdown Donut Chart */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-sky-600" />
                      Distribusi Kategori Pekerjaan Lembur
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Proporsi variasi jenis pekerjaan lembur yang diajukan
                    </p>
                  </div>
                </div>
                <DistributionPieChart data={lemburCategoryPieData} />
              </div>

              {/* Group Area Hours Breakdown (Area GI vs Area Transmisi) */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80 space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      Total Jam Lembur Group Area Operasional
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Perbandingan beban jam kerja lembur Diajukan vs Disetujui (GI &amp; Transmisi)
                    </p>
                  </div>
                </div>

                <div className="space-y-3 py-1">
                  {/* Area GI Bar */}
                  <div className="space-y-1.5 bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-sky-600" />
                        Area Gardu Induk (GI)
                      </span>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200/80">
                        {pctGiApproved}% Disetujui
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-500">Diajukan:</span>
                        <strong className="font-black text-sky-900">{giJamDiajukan.toLocaleString("id-ID")} Jam</strong>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-500">Disetujui:</span>
                        <strong className="font-black text-emerald-700">{giJamDisetujui.toLocaleString("id-ID")} Jam</strong>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-600 rounded-full transition-all duration-500 shadow-2xs"
                        style={{ width: `${Math.max(5, Math.min(100, pctGiApproved))}%` }}
                      />
                    </div>
                  </div>

                  {/* Area Transmisi Bar */}
                  <div className="space-y-1.5 bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        Area Transmisi / SUTT
                      </span>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200/80">
                        {pctTransmisiApproved}% Disetujui
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-500">Diajukan:</span>
                        <strong className="font-black text-indigo-900">{transmisiJamDiajukan.toLocaleString("id-ID")} Jam</strong>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-500">Disetujui:</span>
                        <strong className="font-black text-emerald-700">{transmisiJamDisetujui.toLocaleString("id-ID")} Jam</strong>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-600 rounded-full transition-all duration-500 shadow-2xs"
                        style={{ width: `${Math.max(5, Math.min(100, pctTransmisiApproved))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-500">Gabungan Diajukan:</span>
                    <span className="font-black text-slate-900">{totalGroupDiajukan.toLocaleString("id-ID")} Jam</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-500">Disetujui:</span>
                    <span className="font-black text-emerald-700">{totalGroupDisetujui.toLocaleString("id-ID")} Jam ({totalGroupPctApproved}%)</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 4. Analytics Charts Section (Presensi TAD Active Trend Chart) */}
          <div className="w-full bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Grafik Petugas Pengajuan Lembur, Cuti, Ijin, Sakit &amp; SPPD</h3>
                <p className="text-xs text-slate-500 font-medium">Monitoring tren harian per tanggal &amp; kategori pengajuan pegawai</p>
              </div>
              <select 
                value={chartPeriod}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition"
                > 
                <option value="Minggu Ini">Minggu Ini</option>
                <option value="Bulan Ini">Bulan Ini</option>
                <option value="Tahun Ini">Tahun Ini</option>
              </select>
            </div>
            <AttendanceChart submissions={safeSubmissions} initialPeriod={chartPeriod} />
          </div>

          {/* Belum Selesai */}
          {/* 4. Bottom Grid Widgets Row */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Widget 1: Recent Projects */}
            {/* 
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Pengajuan Terbaru</h3>
                <button onClick={() => onNavigateToTab && onNavigateToTab("workflow")} className="text-xs font-bold text-indigo-600 hover:underline">
                  Lihat Semua
                </button>
              </div>
              <div className="space-y-3">
                {safeSubmissions.slice(0, 3).map((sub, i) => (
                  <div key={i} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">{sub.employeeName}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {sub.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{sub.keterangan || "Pengajuan Surat Lembur/Cuti"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {renderStatusBadge(sub.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Widget 2: Log Aktivitas Approval */}
            {/*
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Aktivitas Approval</h3>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">LIVE LOG</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Siti Rahma", role: "Supervisor", action: "Menyetujui Surat Lembur", time: "2m lalu" },
                  { name: "Budi Santoso", role: "Manajer", action: "Menyetujui Permohonan Cuti", time: "15m lalu" },
                  { name: "Agus Pratama", role: "Keuangan", action: "Memverifikasi Dokumen SPPD", time: "1j lalu" }
                ].map((act, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                      {act.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-bold text-slate-900 truncate">{act.name} <span className="text-slate-400 font-normal">({act.role})</span></p>
                      <p className="text-[10px] text-slate-500 font-medium">{act.action}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">{act.time}</span>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Widget 3: Agenda & Jadwal Shift */}
            {/* 
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Agenda &amp; Jadwal Shift</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">Hari Ini</span>
              </div>
              <div className="space-y-3">
                {[
                  { date: "24 MEI", title: "Inspeksi Pemeliharaan Gardu Induk", time: "08:00 - 12:00 WIB", count: "+4 TAD" },
                  { date: "25 MEI", title: "Evaluasi Kinerja Shift Malam ULTG", time: "14:00 - 16:00 WIB", count: "+6 TAD" },
                  { date: "26 MEI", title: "Rapat Koordinasi Keselamatan K3", time: "09:00 - 11:00 WIB", count: "+8 TAD" }
                ].map((evt, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-2xs">
                      <span className="text-[9px] font-black text-indigo-600 leading-none">{evt.date.split(" ")[1]}</span>
                      <span className="text-xs font-black text-slate-900 leading-none mt-0.5">{evt.date.split(" ")[0]}</span>
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <h4 className="font-bold text-slate-900 truncate">{evt.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{evt.time}</p>
                    </div>
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                      {evt.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          */}
        </>
      )}

      {/* 5. Pending Approvals Section with Status Summary Cards & Filter Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/40">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              {isMaker ? "Pengajuan Saya (Menunggu Approval)" : "Pengajuan Menunggu Persetujuan (Menunggu Approval)"}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-500 font-bold">
                {isMaker ? "Pemohon:" : "Aksi persetujuan untuk role:"}
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-extrabold border border-indigo-100 uppercase tracking-wide">
                {currentUser?.name} ({currentUser?.nip})
              </span>
              {(currentUser?.unitUpt || currentUser?.unitUltg) && (
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-extrabold border border-emerald-100">
                  {currentUser?.unitUltg || currentUser?.unitUpt}
                </span>
              )}
            </div>
          </div>

          <span className="px-3.5 py-1.5 bg-amber-50 text-amber-800 rounded-full text-xs font-black border border-amber-200 shadow-2xs flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
            {pendingApprovals.length} Dokumen Menunggu
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Summary Cards Status Pengajuan */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* 1. Draft */}
            <div 
              onClick={() => setSelectedStatusCard(selectedStatusCard === "draft" ? "all" : "draft")}
              className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 border backdrop-blur-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:shadow-inner active:backdrop-blur-xl ${
                selectedStatusCard === "draft"
                  ? "bg-slate-100/90 border-slate-400 ring-2 ring-slate-400 shadow-md"
                  : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Draft / Inisiasi</span>
                <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block">{statusCounts.draft}</span>
              </div>
              <div className="p-2.5 bg-white/80 backdrop-blur-xs rounded-xl shadow-2xs border border-slate-200 text-slate-600">
                <FileClock className="w-4 h-4" />
              </div>
            </div>

            {/* 2. Menunggu Approval */}
            <div 
              onClick={() => setSelectedStatusCard(selectedStatusCard === "pending" ? "all" : "pending")}
              className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 border backdrop-blur-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:shadow-inner active:backdrop-blur-xl ${
                selectedStatusCard === "pending"
                  ? "bg-amber-100/90 border-amber-400 ring-2 ring-amber-400 shadow-md"
                  : "bg-amber-50/60 hover:bg-amber-100/70 border-amber-200/80 hover:border-amber-300"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Menunggu Approval</span>
                <span className="text-lg sm:text-xl font-black text-amber-950 mt-0.5 block">{statusCounts.pending}</span>
              </div>
              <div className="p-2.5 bg-white/80 backdrop-blur-xs rounded-xl shadow-2xs border border-amber-200 text-amber-600">
                <Hourglass className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>

            {/* 3. Disetujui */}
            <div 
              onClick={() => setSelectedStatusCard(selectedStatusCard === "approved" ? "all" : "approved")}
              className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 border backdrop-blur-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:shadow-inner active:backdrop-blur-xl ${
                selectedStatusCard === "approved"
                  ? "bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-400 shadow-md"
                  : "bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-200/80 hover:border-emerald-300"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Disetujui</span>
                <span className="text-lg sm:text-xl font-black text-emerald-950 mt-0.5 block">{statusCounts.approved}</span>
              </div>
              <div className="p-2.5 bg-white/80 backdrop-blur-xs rounded-xl shadow-2xs border border-emerald-200 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* 4. Perlu Revisi */}
            <div 
              onClick={() => setSelectedStatusCard(selectedStatusCard === "revision" ? "all" : "revision")}
              className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 border backdrop-blur-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:shadow-inner active:backdrop-blur-xl ${
                selectedStatusCard === "revision"
                  ? "bg-purple-100/90 border-purple-400 ring-2 ring-purple-400 shadow-md"
                  : "bg-purple-50/60 hover:bg-purple-100/70 border-purple-200/80 hover:border-purple-300"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Perlu Revisi</span>
                <span className="text-lg sm:text-xl font-black text-purple-950 mt-0.5 block">{statusCounts.revision}</span>
              </div>
              <div className="p-2.5 bg-white/80 backdrop-blur-xs rounded-xl shadow-2xs border border-purple-200 text-purple-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            {/* 5. Ditolak */}
            <div 
              onClick={() => setSelectedStatusCard(selectedStatusCard === "rejected" ? "all" : "rejected")}
              className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 border backdrop-blur-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:shadow-inner active:backdrop-blur-xl ${
                selectedStatusCard === "rejected"
                  ? "bg-rose-100/90 border-rose-400 ring-2 ring-rose-400 shadow-md"
                  : "bg-rose-50/60 hover:bg-rose-100/70 border-rose-200/80 hover:border-rose-300"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Ditolak</span>
                <span className="text-lg sm:text-xl font-black text-rose-950 mt-0.5 block">{statusCounts.rejected}</span>
              </div>
              <div className="p-2.5 bg-white/80 backdrop-blur-xs rounded-xl shadow-2xs border border-rose-200 text-rose-600">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Desktop View: Data Table with Status Proses Column & Action Buttons */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                  <th className="py-3.5 px-4">Nama Pegawai</th>
                  <th className="py-3.5 px-4">NIP</th>
                  <th className="py-3.5 px-4">Unit (GI/ULTG)</th>
                  <th className="py-3.5 px-4">Jenis</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4 text-center">Status Proses</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayTableSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 px-5 text-center text-slate-400 text-xs font-bold">
                      <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-500 mb-2 opacity-80 animate-pulse" />
                      Tidak ada pengajuan ditemukan untuk kriteria ini.
                    </td>
                  </tr>
                ) : (
                  displayTableSubmissions.map((sub) => (
                    <tr key={`${sub.type}-${sub.id}`} className="hover:bg-slate-50/80 transition duration-150">
                      <td className="py-3.5 px-4 font-black text-slate-950 text-xs sm:text-sm">{sub.employeeName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 font-bold tracking-tight">{sub.employeeNip}</td>
                      <td className="py-3.5 px-4 text-slate-650 font-bold">{sub.garduInduk || sub.unitUltg}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                            sub.type === "lembur"
                              ? "bg-sky-50 text-sky-700 border border-sky-100"
                              : sub.type === "cuti"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : sub.type === "ijin"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : sub.type === "sppd"
                              ? "bg-teal-50 text-teal-700 border border-teal-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {sub.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium max-w-xs truncate">{sub.keterangan}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-bold whitespace-nowrap">{formatDateIndonesian(sub.tanggalPengajuan)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          {renderStatusBadge(sub.status)}
                          {/* Task 2: Pesan dari Revisi / Tolak dimasukkan ke dalam kolom Status Proses dibawah statusnya */}
                          {(sub.rejectionReason || sub.revisionNote || (sub.status && (sub.status.toLowerCase().includes("reject") || sub.status.toLowerCase().includes("revis")) && sub.notes)) && (
                            <div className="mt-1.5 px-2.5 py-1 bg-rose-50/90 text-rose-800 border border-rose-200 rounded-lg text-[10px] font-bold text-center max-w-[210px] shadow-2xs leading-snug">
                              <span className="text-rose-900 font-extrabold block text-[9px] uppercase tracking-wider">Catatan:</span>
                              <p className="line-clamp-2 font-medium">{sub.rejectionReason || sub.revisionNote || sub.notes}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Document Button */}
                          <button
                            onClick={() => setSelectedSubForDoc(sub)}
                            title="Lihat Dokumen"
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition border border-slate-200 hover:border-indigo-200 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Task: Untuk role Checker, Verification, Approval 1, Approval 2, Approval 3 pada bagian Grid Pengajuan Menunggu Persetujuan, kolom Aksi hanya tersedia icon eye saja (aksi lainnya di-remark) */}
                          {isMaker ? (
                            <button
                              onClick={() => onNavigateToTab && onNavigateToTab(sub.type || "lembur")}
                              title={`Buka Modul ${(sub.type || "lembur").toUpperCase()}`}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition border border-indigo-200 cursor-pointer hover:scale-105 active:scale-95"
                            >
                              <MousePointerClick className="w-4 h-4" />
                            </button>
                          ) : (
                            /* Role Checker, Verification, Approval 1, 2, 3: Hanya icon Eye yang aktif di Dashboard grid
                            sub.currentApproverRole === currentUser?.role && (
                              <>
                                <button
                                  onClick={() => handleOpenApproveSign(sub)}
                                  title="Setujui Pengajuan"
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition border border-emerald-200 cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(sub)}
                                  title="Tolak Pengajuan"
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition border border-rose-200 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )
                            */ null
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Card List */}
          <div className="md:hidden space-y-3">
            {displayTableSubmissions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-xl p-4 border border-slate-200">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1.5 opacity-80" />
                Tidak ada pengajuan ditemukan.
              </div>
            ) : (
              displayTableSubmissions.map((sub) => (
                <div key={`${sub.type}-${sub.id}`} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-slate-900 text-xs">{sub.employeeName}</h4>
                      <p className="text-[10px] font-mono font-bold text-slate-500">{sub.employeeNip}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      {renderStatusBadge(sub.status)}
                      {(sub.rejectionReason || sub.revisionNote || (sub.status && (sub.status.toLowerCase().includes("reject") || sub.status.toLowerCase().includes("revis")) && sub.notes)) && (
                        <span className="mt-1 px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[9px] font-bold text-right max-w-[160px]">
                          Catatan: {sub.rejectionReason || sub.revisionNote || sub.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium pt-1 border-t border-slate-200/60">
                    <span>{sub.garduInduk || sub.unitUltg}</span>
                    <span className="font-bold">{formatDateIndonesian(sub.tanggalPengajuan)}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium truncate">{sub.keterangan}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                      sub.type === "lembur" ? "bg-sky-50 text-sky-700 border border-sky-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {sub.type}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedSubForDoc(sub)}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                      >
                        Detail
                      </button>
                      {isMaker ? (
                        <button
                          onClick={() => onNavigateToTab && onNavigateToTab(sub.type || "lembur")}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer"
                        >
                          <MousePointerClick className="w-3.5 h-3.5" /> Ke Module
                        </button>
                      ) : (
                        /* Role Checker, Verification, Approval 1, 2, 3: Aksi hanya icon eye/detail saja, tombol persetujuan di-remark
                        sub.currentApproverRole === currentUser?.role && (
                          <button
                            onClick={() => handleOpenApproveSign(sub)}
                            className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                          >
                            Setujui
                          </button>
                        )
                        */ null
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!isMaker && <GiLocationMap data={mapData} loading={mapLoading} selectedUpt={selectedUpt} selectedUltg={selectedUltg} setSelectedUpt={setSelectedUpt} setSelectedUltg={setSelectedUltg} setSelectedGi={setSelectedGi} defaultUpt={navbarScope?.uptName || "Semua UPT"} defaultUltg={navbarScope?.ultgName || "Semua ULTG"} defaultGi={navbarScope?.giName || "Semua GI"} />}

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSave={handleSaveApprovalSignature}
        title={`Persetujuan Digital (${currentUser?.jabatan || "Approver"})`}
        subtitle={`Dokumen #${getFormattedDocNo(selectedSubForApproval)} oleh ${selectedSubForApproval?.employeeName}`}
      />

      {/* Rejection Modal */}
      {rejectModalSub && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> Tolak Dokumen #{getFormattedDocNo(rejectModalSub)}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Masukkan alasan penolakan untuk dikirimkan notifikasinya ke pemohon.
            </p>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Contoh: Dokumen lampiran kurang lengkap / anggaran melebihi kuota."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-rose-500"
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-2 pb-safe">
              <button
                onClick={() => setRejectModalSub(null)}
                className="px-4 py-2.5 min-h-[42px] text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2.5 min-h-[42px] text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition cursor-pointer"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!selectedSubForDoc}
        submission={selectedSubForDoc}
        onClose={() => setSelectedSubForDoc(null)}
      />
    </div>
  );
};
