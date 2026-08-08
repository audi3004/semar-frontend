import { useState, useMemo } from "react";
import { DataService } from "../services/dataService";
import { MasterDataService } from "../services/masterDataService";
import { AttendanceChart } from "../components/charts/AttendanceChart";
import { DistributionPieChart } from "../components/charts/DistributionPieChart";
import { ParetoOvertimeChart } from "../components/charts/ParetoOvertimeChart";
import { SignatureModal } from "../components/common/SignatureModal";
import { DocumentViewerModal } from "../components/common/DocumentViewerModal";
import { ExportService } from "../services/exportService";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
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
  BarChart3
} from "lucide-react";
import { formatDateIndonesian, formatRupiah, getFormattedDocNo } from "../utils/formatters";

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

  if (!currentUser) return <LoadingSkeleton variant="dashboard" />;

  const isMaker = currentUser?.role === "maker";
  const isApprover = currentUser?.role !== "maker" && currentUser?.role !== "admin";

  // Role, Unit & Date filtered submissions list for Dashboard
  const safeSubmissions = (submissions || []).filter((sub) => {
    // 1. Task 1: Maker role only sees their own submissions
    if (isMaker) {
      const isMySubmission =
        (sub.employeeNip && sub.employeeNip === currentUser?.nip) ||
        (sub.employeeName && sub.employeeName === currentUser?.name) ||
        (sub.createdBy && sub.createdBy === currentUser?.id);
      if (!isMySubmission) return false;

      if (currentUser?.unitUpt && sub.unitUpt && sub.unitUpt !== currentUser.unitUpt) {
        return false;
      }
      if (currentUser?.unitUltg && sub.unitUltg && sub.unitUltg !== currentUser.unitUltg) {
        return false;
      }
      if (
        currentUser?.garduInduk &&
        currentUser?.garduInduk !== "Semua GI" &&
        sub.garduInduk &&
        sub.garduInduk !== currentUser.garduInduk
      ) {
        return false;
      }
    }

    // 2. Approver roles filtered strictly by their level (Approved 2 level UPT, Approved 3 seluruh unit)
    if (isApprover) {
      if (currentUser?.role === "approved3") {
        // Approved 3: Akses seluruh unit (no default unit restriction)
      } else if (
        currentUser?.role === "approved2" ||
        currentUser?.role === "approved1" ||
        currentUser?.role === "verification"
      ) {
        // Approved 2 (TL ES), Approved 1 (MAN PLN), Verification (AMN PLN): Sampai level UPT
        if (currentUser?.role === "approved2" && currentUser?.multiUpt && Array.isArray(currentUser.multiUpt)) {
          if (sub.unitUpt && !currentUser.multiUpt.includes(sub.unitUpt)) {
            return false;
          }
        } else if (currentUser?.unitUpt && sub.unitUpt && sub.unitUpt !== currentUser.unitUpt) {
          return false;
        }
      } else if (currentUser?.role === "checker") {
        // Checker (TL PLN): Level UPT & ULTG (& GI if set)
        if (currentUser?.unitUpt && sub.unitUpt && sub.unitUpt !== currentUser.unitUpt) {
          return false;
        }
        if (currentUser?.unitUltg && sub.unitUltg && sub.unitUltg !== currentUser.unitUltg) {
          return false;
        }
        if (
          currentUser?.garduInduk &&
          currentUser?.garduInduk !== "Semua GI" &&
          sub.garduInduk &&
          sub.garduInduk !== currentUser.garduInduk
        ) {
          return false;
        }
      }
    }

    // 3. Dropdown Unit Filters (selectedUpt, selectedUltg, selectedGi)
    if (selectedUpt && selectedUpt !== "Semua UPT") {
      const uUpt = sub.unitUpt || sub.upt || "";
      if (uUpt && uUpt !== selectedUpt) return false;
    }
    if (selectedUltg && selectedUltg !== "Semua ULTG") {
      const uUltg = sub.unitUltg || sub.ultg || "";
      if (uUltg && uUltg !== selectedUltg) return false;
    }
    if (selectedGi && selectedGi !== "Semua GI") {
      const uGi = sub.garduInduk || sub.gi || "";
      if (uGi && uGi !== selectedGi) return false;
    }

    // 4. Date Range Filters (startDate, endDate)
    const subDateStr = sub.tanggalLembur || sub.tanggalMulai || sub.tanggalBerangkat || sub.tanggalPengajuan || sub.createdAt || "";
    if (subDateStr) {
      const dateOnly = subDateStr.substring(0, 10);
      if (startDate && dateOnly < startDate) return false;
      if (endDate && dateOnly > endDate) return false;
    }

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

  // Analisis Lembur & Kategori calculations derived from safeSubmissions (filtered by unit/role/date) - Exclude Rejected
  const lemburSubmissionsFiltered = safeSubmissions.filter(
    (s) => s.type === "lembur" && s.status?.toLowerCase() !== "rejected" && s.status?.toLowerCase() !== "ditolak" && s.status?.toLowerCase() !== "revision" && s.status?.toLowerCase() !== "revision_required"
  );

  // Rejected Overtime submissions for separated visualization
  const lemburSubmissionsRejected = safeSubmissions.filter(
    (s) => s.type === "lembur" && (s.status?.toLowerCase() === "rejected" || s.status?.toLowerCase() === "ditolak" || s.status?.toLowerCase() === "revision" || s.status?.toLowerCase() === "revision_required")
  );

  const totalJamLemburAnalysis = lemburSubmissionsFiltered.reduce(
    (acc, curr) => acc + (Number(curr.durasiJam) || 0),
    0
  );
  const totalPegawaiTerlibat = new Set(
    lemburSubmissionsFiltered.map((s) => s.employeeNip || s.employeeName)
  ).size;

  const totalBiayaLemburAnalysis = lemburSubmissionsFiltered.reduce(
    (acc, curr) => acc + (Number(curr.estimasiBiayaRupiah) || 0),
    0
  );

  // Pegawai Lembur Tertinggi (Strictly from real data)
  const pegawaiHoursMap = {};
  lemburSubmissionsFiltered.forEach((s) => {
    const key = s.employeeName || "Pegawai";
    pegawaiHoursMap[key] = (pegawaiHoursMap[key] || 0) + (Number(s.durasiJam) || 0);
  });
  let highestPegawaiName = "-";
  let highestPegawaiHours = 0;
  const sortedPegawai = Object.entries(pegawaiHoursMap).sort((a, b) => b[1] - a[1]);
  if (sortedPegawai.length > 0) {
    highestPegawaiName = sortedPegawai[0][0];
    highestPegawaiHours = sortedPegawai[0][1];
  }

  // Pareto 80/20 Rule Overtime Analysis Data Calculation
  const paretoData = useMemo(() => {
    if (!lemburSubmissionsFiltered || lemburSubmissionsFiltered.length === 0) {
      return [];
    }

    const categoryMap = {};

    lemburSubmissionsFiltered.forEach((sub) => {
      let key = "Lainnya";
      if (paretoGroupBy === "unit") {
        key = sub.unitUltg || sub.unitUpt || sub.garduInduk || sub.ultg || sub.upt || "UPT Semarang";
      } else if (paretoGroupBy === "pegawai") {
        key = sub.employeeName || sub.employeeNip || "Pegawai";
      } else {
        key = sub.kategoriLembur || sub.jenisPekerjaan || sub.pekerjaan || sub.keterangan || "Pekerjaan Pemeliharaan";
        if (key.length > 35) {
          key = key.substring(0, 32) + "...";
        }
      }

      const jam = Number(sub.durasiJam) || 0;
      const biaya = Number(sub.estimasiBiayaRupiah) || (jam * 62500);

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

  // Task 1: Get master categories dynamically from MasterDataService
  const masterLemburCategories = (() => {
    try {
      MasterDataService.initLocalStorage();
      const list = MasterDataService.getAll("m_lembur", { limit: 9999 }).data || [];
      return list.map(item => item.kat_lembur).filter(Boolean);
    } catch (e) {
      console.error("Gagal mengambil master kategori lembur:", e);
      return [];
    }
  })();

  const categoryCountMap = {};
  masterLemburCategories.forEach((cat) => {
    categoryCountMap[cat] = 0;
  });

  // Increment counts based on filtered submissions
  lemburSubmissionsFiltered.forEach((s) => {
    const subCat = (s.kategoriLembur || s.jenisPekerjaan || "").toLowerCase().trim();
    let matchedCat = null;
    for (const cat of masterLemburCategories) {
      const target = cat.toLowerCase().trim();
      if (subCat.includes(target) || target.includes(subCat) || 
          (subCat === "manuver" && target.includes("manuver")) ||
          (subCat.includes("piket") && target.includes("piket"))) {
        matchedCat = cat;
        break;
      }
    }
    
    if (matchedCat) {
      categoryCountMap[matchedCat] = (categoryCountMap[matchedCat] || 0) + 1;
    } else {
      // Fuzzy matching by individual words
      const words = subCat.split(/\s+/);
      for (const cat of masterLemburCategories) {
        const target = cat.toLowerCase();
        if (words.some(word => word.length > 3 && target.includes(word))) {
          matchedCat = cat;
          break;
        }
      }
      if (matchedCat) {
        categoryCountMap[matchedCat] = (categoryCountMap[matchedCat] || 0) + 1;
      } else {
        categoryCountMap["Lainnya"] = (categoryCountMap["Lainnya"] || 0) + 1;
      }
    }
  });

  const sortedCategories = Object.entries(categoryCountMap)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  let topCategoryName = "-";
  let topCategoryPct = 0;
  if (sortedCategories.length > 0 && lemburSubmissionsFiltered.length > 0) {
    topCategoryName = sortedCategories[0][0];
    topCategoryPct = Math.round((sortedCategories[0][1] / lemburSubmissionsFiltered.length) * 100);
  }

  // Distribution Pie Data for Overtime Categories
  const categoryColors = ["#00A3E0", "#E30613", "#10B981", "#F59E0B", "#06B6D4", "#8B5CF6"];
  const lemburCategoryPieData = sortedCategories.map(([name, value], idx) => ({
    name,
    value,
    color: categoryColors[idx % categoryColors.length]
  }));

  // Group Area Hours Breakdown (Area GI vs Area Transmisi) - Strictly from real data, no fake fallbacks
  const displayJamGi = lemburSubmissionsFiltered
    .filter((s) => (s.areaGroup || "").toLowerCase().includes("gi") || (s.areaGroup || "").toLowerCase().includes("gardu"))
    .reduce((acc, curr) => acc + (Number(curr.durasiJam) || 0), 0);
  const displayJamTransmisi = lemburSubmissionsFiltered
    .filter((s) => (s.areaGroup || "").toLowerCase().includes("transmisi") || (s.areaGroup || "").toLowerCase().includes("sutt"))
    .reduce((acc, curr) => acc + (Number(curr.durasiJam) || 0), 0);

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
    rejected: safeSubmissions.filter((s) => {
      const st = (s.status || "").toLowerCase();
      return st === "rejected" || st === "revision" || st === "revision_required" || st === "ditolak";
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
    if (selectedStatusCard === "rejected") {
      const st = (sub.status || "").toLowerCase();
      return st === "rejected" || st === "revision" || st === "revision_required" || st === "ditolak";
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
    rejected: lemburSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "rejected" || st === "revision" || st === "revision_required" || st === "ditolak"; }).length,
  };
  const lemburCategoryMap = {};
  lemburSubs.forEach((s) => {
    const cat = s.kategoriLembur || s.jenisPekerjaan || "Lainnya";
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
    rejected: cutiSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "rejected" || st === "revision" || st === "revision_required" || st === "ditolak"; }).length,
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
    rejected: ijinSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "rejected" || st === "revision" || st === "revision_required" || st === "ditolak"; }).length,
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
    rejected: sakitSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "rejected" || st === "revision" || st === "revision_required" || st === "ditolak"; }).length,
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
    rejected: sppdSubs.filter((s) => { const st = (s.status || "").toLowerCase(); return st === "rejected" || st === "revision" || st === "revision_required" || st === "ditolak"; }).length,
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
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold">
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-indigo-700">{currentUser?.roleName || currentUser?.role || "-"}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">Jabatan: {currentUser?.jabatan || "-"}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">Unit: {currentUser?.unit || currentUser?.unitUpt || "-"}</span>
          </div>
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
            onClick={() => setExpandedCardKey(expandedCardKey === "lembur" ? null : "lembur")}
            className={`bg-white p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md ${
              expandedCardKey === "lembur" ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-100"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardKey(expandedCardKey === "lembur" ? null : "lembur");
                  }}
                  className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-200 flex items-center gap-1 hover:bg-indigo-100"
                >
                  Detail {expandedCardKey === "lembur" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Lembur</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {totalLemburJam} <span className="text-xs font-bold text-slate-500">Jam</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">{lemburCount} Pegawai Terlibat</p>
            </div>

            {/* In-Card Details: Task 3 */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span>Pengajuan: <strong className="text-slate-900">{lemburJamPengajuan} Jam</strong></span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Disetujui: {lemburJamDisetujui} Jam</span>
              </div>
              <div className="text-[9.5px] text-slate-500 font-semibold truncate">
                <span className="font-bold text-slate-700">Kategori Pekerjaan:</span> {Object.keys(lemburCategoryMap).slice(0, 2).join(", ") || "Manuver & Maintenance"}
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold pt-1 border-t border-slate-100/60">
                <span className="text-slate-500">Draft: {lemburStatusCounts.draft}</span>
                <span className="text-amber-700">Pending: {lemburStatusCounts.pending}</span>
                <span className="text-emerald-700">Setuju: {lemburStatusCounts.approved}</span>
                <span className="text-rose-700">Tolak: {lemburStatusCounts.rejected}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Permohonan Cuti */}
          <div 
            onClick={() => setExpandedCardKey(expandedCardKey === "cuti" ? null : "cuti")}
            className={`bg-white p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md ${
              expandedCardKey === "cuti" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-100"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <Palmtree className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardKey(expandedCardKey === "cuti" ? null : "cuti");
                  }}
                  className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 flex items-center gap-1 hover:bg-emerald-100"
                >
                  Detail {expandedCardKey === "cuti" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Permohonan Cuti</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {cutiCount} <span className="text-xs font-bold text-slate-500">Orang</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Total: {cutiTotalHari} Hari Pengajuan</p>
            </div>

            {/* In-Card Details: Task 3 */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span>Total Cuti: <strong className="text-slate-900">{cutiTotalHari} Hari</strong></span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Disetujui: {cutiHariDisetujui} Hari</span>
              </div>
              <div className="text-[9.5px] text-slate-500 font-semibold truncate">
                <span className="font-bold text-slate-700">Jenis Cuti:</span> {Object.keys(cutiTypeMap).slice(0, 2).join(", ") || "Cuti Tahunan"}
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold pt-1 border-t border-slate-100/60">
                <span className="text-slate-500">Draft: {cutiStatusCounts.draft}</span>
                <span className="text-amber-700">Pending: {cutiStatusCounts.pending}</span>
                <span className="text-emerald-700">Setuju: {cutiStatusCounts.approved}</span>
                <span className="text-rose-700">Tolak: {cutiStatusCounts.rejected}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Permohonan Ijin */}
          <div 
            onClick={() => setExpandedCardKey(expandedCardKey === "ijin" ? null : "ijin")}
            className={`bg-white p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md ${
              expandedCardKey === "ijin" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-100"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardKey(expandedCardKey === "ijin" ? null : "ijin");
                  }}
                  className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black border border-amber-200 flex items-center gap-1 hover:bg-amber-100"
                >
                  Detail {expandedCardKey === "ijin" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Permohonan Ijin</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {ijinCount} <span className="text-xs font-bold text-slate-500">Orang</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Total: {ijinTotalHari} Hari Ijin</p>
            </div>

            {/* In-Card Details: Task 3 */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span>Total Ijin: <strong className="text-slate-900">{ijinTotalHari} Hari</strong></span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Disetujui: {ijinHariDisetujui} Hari</span>
              </div>
              <div className="text-[9.5px] text-slate-500 font-semibold truncate">
                <span className="font-bold text-slate-700">Alasan:</span> {Object.keys(ijinReasonMap).slice(0, 2).join(", ") || "Keperluan Keluarga"}
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold pt-1 border-t border-slate-100/60">
                <span className="text-slate-500">Draft: {ijinStatusCounts.draft}</span>
                <span className="text-amber-700">Pending: {ijinStatusCounts.pending}</span>
                <span className="text-emerald-700">Setuju: {ijinStatusCounts.approved}</span>
                <span className="text-rose-700">Tolak: {ijinStatusCounts.rejected}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Perizinan Sakit */}
          <div 
            onClick={() => setExpandedCardKey(expandedCardKey === "sakit" ? null : "sakit")}
            className={`bg-white p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md ${
              expandedCardKey === "sakit" ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-100"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardKey(expandedCardKey === "sakit" ? null : "sakit");
                  }}
                  className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200 flex items-center gap-1 hover:bg-rose-100"
                >
                  Detail {expandedCardKey === "sakit" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Perizinan Sakit</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {sakitCount} <span className="text-xs font-bold text-slate-500">Orang</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Surat Dokter: {sakitWithSuratCount} Lampiran</p>
            </div>

            {/* In-Card Details: Task 3 */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span>Total Sakit: <strong className="text-slate-900">{sakitTotalHari} Hari</strong></span>
                <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Dokter: {sakitWithSuratCount}</span>
              </div>
              <div className="text-[9.5px] text-slate-500 font-semibold truncate">
                <span className="font-bold text-slate-700">Klinik/Diagnosa:</span> {Object.keys(sakitKlinikMap).slice(0, 2).join(", ") || "RSUD / ISPA"}
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold pt-1 border-t border-slate-100/60">
                <span className="text-slate-500">Draft: {sakitStatusCounts.draft}</span>
                <span className="text-amber-700">Pending: {sakitStatusCounts.pending}</span>
                <span className="text-emerald-700">Setuju: {sakitStatusCounts.approved}</span>
                <span className="text-rose-700">Tolak: {sakitStatusCounts.rejected}</span>
              </div>
            </div>
          </div>

          {/* Card 5: Perjalanan Dinas SPPD */}
          <div 
            onClick={() => setExpandedCardKey(expandedCardKey === "sppd" ? null : "sppd")}
            className={`bg-white p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md ${
              expandedCardKey === "sppd" ? "border-teal-500 ring-2 ring-teal-500/20" : "border-slate-100"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardKey(expandedCardKey === "sppd" ? null : "sppd");
                  }}
                  className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-black border border-teal-200 flex items-center gap-1 hover:bg-teal-100"
                >
                  Detail {expandedCardKey === "sppd" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Perjalanan Dinas SPPD</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {sppdCount} <span className="text-xs font-bold text-slate-500">Tugas</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Estimasi Biaya: {formatRupiah(sppdTotalBiaya)}</p>
            </div>

            {/* In-Card Details: Task 3 */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span>Total SPPD: <strong className="text-slate-900">{sppdTotalHari} Hari</strong></span>
                <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">Biaya: {formatRupiah(sppdTotalBiaya)}</span>
              </div>
              <div className="text-[9.5px] text-slate-500 font-semibold truncate">
                <span className="font-bold text-slate-700">Kota Tujuan:</span> {Object.keys(sppdTujuanMap).slice(0, 2).join(", ") || "Salatiga, Kudus"}
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold pt-1 border-t border-slate-100/60">
                <span className="text-slate-500">Draft: {sppdStatusCounts.draft}</span>
                <span className="text-amber-700">Pending: {sppdStatusCounts.pending}</span>
                <span className="text-emerald-700">Setuju: {sppdStatusCounts.approved}</span>
                <span className="text-rose-700">Tolak: {sppdStatusCounts.rejected}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Drawer / Panel View (Task 3) */}
        {expandedCardKey && (
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                  Rincian Informasi Detail Modul: <span className="text-indigo-600">{expandedCardKey.toUpperCase()}</span>
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateToTab && onNavigateToTab(expandedCardKey)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs"
                >
                  <MousePointerClick className="w-3.5 h-3.5" /> {isMaker ? `Ke Halaman ${expandedCardKey.toUpperCase()}` : `Ke Persetujuan ${expandedCardKey.toUpperCase()}`}
                </button>
                <button
                  onClick={() => setExpandedCardKey(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content view per module key */}
            {expandedCardKey === "lembur" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Ringkasan Jam Lembur</span>
                  <p className="text-lg font-black text-slate-900">{lemburJamPengajuan} Jam Pengajuan</p>
                  <p className="text-xs text-emerald-700 font-bold">{lemburJamDisetujui} Jam Disetujui ({lemburCount} Pegawai)</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Ringkasan Hari Cuti</span>
                  <p className="text-lg font-black text-slate-900">{cutiTotalHari} Hari Total Pengajuan</p>
                  <p className="text-xs text-emerald-700 font-bold">{cutiHariDisetujui} Hari Disetujui ({cutiCount} Pegawai)</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Ringkasan Perizinan Ijin</span>
                  <p className="text-lg font-black text-slate-900">{ijinTotalHari} Hari Permohonan Ijin</p>
                  <p className="text-xs text-emerald-700 font-bold">{ijinHariDisetujui} Hari Disetujui ({ijinCount} Pegawai)</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Ringkasan Perizinan Sakit</span>
                  <p className="text-lg font-black text-slate-900">{sakitTotalHari} Hari Izin Sakit</p>
                  <p className="text-xs text-rose-700 font-bold">{sakitWithSuratCount} Pengajuan Dilengkapi Surat Keterangan Dokter</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[10px]">Ringkasan SPPD Perjalanan Dinas</span>
                  <p className="text-lg font-black text-slate-900">{sppdTotalHari} Hari Total Tugas Dinas</p>
                  <p className="text-xs text-teal-700 font-bold">Estimasi Biaya Anggaran: {formatRupiah(sppdTotalBiaya)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2">
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
        )}
      </div>

      {/* 3. Analisis Lembur & Kategori (Hidden for Maker) */}
      {!isMaker && (
        <>
          {/* Analisis Lembur & Kategori Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-600" />
                  Analisis Lembur &amp; Kategori
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Ringkasan akumulasi jam, estimasi biaya, serta statistik distribusi kategori pekerjaan lembur ({selectedUpt} - {selectedUltg})
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-lg border border-emerald-200">
                    Disetujui / Pending: {lemburSubmissionsFiltered.length} Dokumen ({totalJamLemburAnalysis} Jam)
                  </span>
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-extrabold rounded-lg border border-rose-200">
                    Ditolak: {lemburSubmissionsRejected.length} Dokumen ({lemburSubmissionsRejected.reduce((a, c) => a + (Number(c.durasiJam) || 0), 0)} Jam)
                  </span>
                </div>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 bg-sky-50 text-sky-700 text-[10px] font-extrabold rounded-full border border-sky-200">
                Data Terfilter Role &amp; Unit
              </span>
            </div>

            {/* Top 4 Stat Boxes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600" /> TOTAL JAM
                </p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {totalJamLemburAnalysis.toLocaleString("id-ID")}{" "}
                  <span className="text-xs font-normal text-slate-500">Jam</span>
                </p>
                <p className="text-[11px] text-sky-700 font-semibold mt-1">
                  {totalPegawaiTerlibat} Pegawai Terlibat
                </p>
              </div>

              <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> TOTAL BIAYA
                </p>
                <p className="text-base sm:text-2xl font-black text-emerald-700 mt-1">
                  {formatRupiah(totalBiayaLemburAnalysis)}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Perhitungan Rumus UPT</p>
              </div>

              <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  👤 LEMBUR TERTINGGI
                </p>
                <p className="text-sm sm:text-lg font-black text-slate-900 mt-1 truncate">
                  {highestPegawaiName}
                </p>
                <p className="text-[11px] font-bold text-amber-700 mt-0.5">
                  {highestPegawaiHours} Jam Terakumulasi
                </p>
              </div>

              <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  🏆 TERBANYAK
                </p>
                <p className="text-sm sm:text-lg font-black text-slate-900 mt-1 truncate">
                  {topCategoryName}
                </p>
                <p className="text-[11px] font-bold text-indigo-700 mt-0.5">
                  {topCategoryPct}% Total Pengajuan
                </p>
              </div>
            </div>

            {/* Main Pareto 80/20 Rule Analysis Chart Card */}
            <div className="bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-600" />
                    GRAFIK PARETO LEMBUR (ANALISIS ATURAN 80/20)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Metode Pareto untuk mengidentifikasi 20% penyebab/kategori utama yang berkontribusi pada 80% total akumulasi jam/biaya lembur
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Kelompokkan:</span>
                  <select
                    value={paretoGroupBy}
                    onChange={(e) => setParetoGroupBy(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition shadow-2xs"
                  >
                    <option value="pekerjaan">Berdasarkan Pekerjaan/Penyebab</option>
                    <option value="unit">Berdasarkan Unit / ULTG</option>
                    <option value="pegawai">Berdasarkan Pegawai</option>
                  </select>
                </div>
              </div>

              {/* Pareto KPI Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Jam Lembur</span>
                  <span className="text-sm font-black text-sky-700">{totalJamLemburAnalysis.toLocaleString("id-ID")} Jam</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Estimasi Total Biaya</span>
                  <span className="text-sm font-black text-emerald-700">{formatRupiah(totalBiayaLemburAnalysis)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Kategori Pareto 80%</span>
                  <span className="text-sm font-black text-amber-700">{pareto80Count} Kategori Utama</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Aturan Pareto 80/20</span>
                  <span className="text-[11px] font-extrabold text-indigo-700">
                    {paretoData.length > 0 ? `${Math.round((pareto80Count / paretoData.length) * 100)}% Kategori = 80% Jam` : "100% Efisien"}
                  </span>
                </div>
              </div>

              {/* Pareto Composed Chart */}
              <ParetoOvertimeChart data={paretoData} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pt-1">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  DISTRIBUSI KATEGORI LEMBUR
                </h3>
                <DistributionPieChart data={lemburCategoryPieData} />
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  TOTAL JAM LEMBUR GROUP AREA
                </h3>
                <div className="h-64 flex items-end justify-center gap-8 sm:gap-12 pt-8 pb-4 border-b border-slate-200">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-800">
                      {displayJamGi.toLocaleString("id-ID")} Jam
                    </span>
                    <div
                      className="w-16 sm:w-24 bg-[#0077B6] rounded-t-xl transition-all duration-300 shadow-md"
                      style={{ height: `${Math.max(20, Math.min(180, (displayJamGi / maxJamGroup) * 170))}px` }}
                    />
                    <span className="text-xs font-bold text-slate-700">Area GI</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-800">
                      {displayJamTransmisi.toLocaleString("id-ID")} Jam
                    </span>
                    <div
                      className="w-16 sm:w-24 bg-[#023E8A] rounded-t-xl transition-all duration-300 shadow-md"
                      style={{ height: `${Math.max(20, Math.min(180, (displayJamTransmisi / maxJamGroup) * 170))}px` }}
                    />
                    <span className="text-xs font-bold text-slate-700">Area Transmisi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Analytics Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Area Chart: Tren Kehadiran */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">Grafik Kehadiran &amp; Presensi TAD</h3>
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
              <AttendanceChart data={chartTrendData} />
            </div>

            {/* Right Donut Chart: Distribusi Status */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">Distribusi Status</h3>
                  <p className="text-xs text-slate-500 font-medium">Proporsi kategori dokumen hari ini</p>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  Live Donut
                </span>
              </div>
              <DistributionPieChart data={pieData} />
            </div>
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
              {isMaker ? "Pengajuan Saya (Pending Approval)" : "Pengajuan Menunggu Persetujuan (Pending Approval)"}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Draft */}
            <div 
              onClick={() => setSelectedStatusCard(selectedStatusCard === "draft" ? "all" : "draft")}
              className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition border ${
                selectedStatusCard === "draft" ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400" : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Draft / Inisiasi</span>
                <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block">{statusCounts.draft}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl shadow-2xs border border-slate-200 text-slate-600">
                <FileClock className="w-4 h-4" />
              </div>
            </div>

            {/* 2. Menunggu Approval */}
            <div 
              onClick={() => setSelectedStatusCard(selectedStatusCard === "pending" ? "all" : "pending")}
              className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition border ${
                selectedStatusCard === "pending" ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400" : "bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/60"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Menunggu Approval</span>
                <span className="text-lg sm:text-xl font-black text-amber-950 mt-0.5 block">{statusCounts.pending}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl shadow-2xs border border-amber-200 text-amber-600">
                <Hourglass className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>

            {/* 3. Disetujui */}
            <div 
              onClick={() => setSelectedStatusCard(selectedStatusCard === "approved" ? "all" : "approved")}
              className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition border ${
                selectedStatusCard === "approved" ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400" : "bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/60"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Disetujui</span>
                <span className="text-lg sm:text-xl font-black text-emerald-950 mt-0.5 block">{statusCounts.approved}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl shadow-2xs border border-emerald-200 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* 4. Ditolak / Revisi */}
            <div 
              onClick={() => setSelectedStatusCard(selectedStatusCard === "rejected" ? "all" : "rejected")}
              className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition border ${
                selectedStatusCard === "rejected" ? "bg-rose-100 border-rose-400 ring-2 ring-rose-400" : "bg-rose-50/60 border-rose-200/80 hover:bg-rose-100/60"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Ditolak / Revisi</span>
                <span className="text-lg sm:text-xl font-black text-rose-950 mt-0.5 block">{statusCounts.rejected}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl shadow-2xs border border-rose-200 text-rose-600">
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
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition duration-150">
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
                <div key={sub.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
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
