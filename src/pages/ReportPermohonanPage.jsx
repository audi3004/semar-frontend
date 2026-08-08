import React, { useState, useMemo, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
  Briefcase,
  Palmtree,
  Stethoscope,
  Eye,
  Calendar,
  Building,
  ShieldCheck,
  RefreshCw,
  PenTool,
  Check,
  X,
  RotateCcw,
  UserCheck,
  Save,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { formatRupiah, formatDateIndonesian, getStatusBadgeColor, getStatusLabel, getFormattedDocNo } from "../utils/formatters";
import { ExportService } from "../services/exportService";
import { PdfService } from "../services/pdfService";
import { DataService } from "../services/dataService";
import { AuthService } from "../services/authService";
import { MasterDataService } from "../services/masterDataService";
import { DocumentViewerModal } from "../components/common/DocumentViewerModal";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { motion, AnimatePresence } from "motion/react";

const DEFAULT_SIGNATORIES = DataService.getDefaultReportSignatories("UPT Semarang");

export const ReportPermohonanPage = ({ currentUser, submissions = [] }) => {
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocSub, setSelectedDocSub] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Auto increment sequence for document number (001, 002, ...)
  const [docSeq, setDocSeq] = useState(() => {
    try {
      const saved = localStorage.getItem("epresensi_rekap_doc_seq");
      return saved ? parseInt(saved, 10) || 1 : 1;
    } catch {
      return 1;
    }
  });

  // Modal Penentuan Tanda Tangan
  const [isSignatoryModalOpen, setIsSignatoryModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf"); // 'pdf' or 'excel'
  const [signatories, setSignatories] = useState(DEFAULT_SIGNATORIES);
  const [successNotification, setSuccessNotification] = useState(null);

  // Modal Preview PDF Periode Saat Ini
  const [isPreviewReportModalOpen, setIsPreviewReportModalOpen] = useState(false);
  const [reportPreviewUrl, setReportPreviewUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Compute userUnitScope based on m_pegawai and m_unit tables
  const userUnitScope = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === "admin") return null;

    try {
      const masterPeg = MasterDataService.getAll("m_pegawai", { limit: 1000 })?.data || [];
      const pegRecord = masterPeg.find((p) => p.nip === currentUser.nip);
      if (pegRecord) {
        const masterUnit = MasterDataService.getAll("m_unit", { limit: 1000 })?.data || [];
        const unitRecord = masterUnit.find((u) => u.id_unit_upt === pegRecord.id_unit_upt);
        if (unitRecord && unitRecord.upt) {
          return unitRecord.upt;
        }
      }
    } catch (e) {
      console.error("Error finding user unit in master pegawai:", e);
    }

    const directUnit = currentUser.unitUpt || currentUser.unit_upt;
    if (directUnit && directUnit !== "Seluruh UPT") {
      return directUnit;
    }

    return "UPT Semarang"; // fallback
  }, [currentUser]);

  // Compute available Unit/UPT groups for dropdown rendering based on scope
  const availableUnitGroups = useMemo(() => {
    const allGroups = [
      {
        label: "UPT Semarang",
        options: [
          { value: "UPT Semarang", label: "Seluruh UPT Semarang" },
          { value: "ULTG Semarang", label: "ULTG Semarang" },
          { value: "ULTG Kudus", label: "ULTG Kudus" },
          { value: "GI Krapyak", label: "GI Krapyak" },
          { value: "GI Ungaran", label: "GI Ungaran" },
          { value: "GI Srondol", label: "GI Srondol" }
        ]
      },
      {
        label: "UPT Purwokerto",
        options: [
          { value: "UPT Purwokerto", label: "Seluruh UPT Purwokerto" },
          { value: "ULTG Purwokerto", label: "ULTG Purwokerto" },
          { value: "GI Kalisari", label: "GI Kalisari" }
        ]
      },
      {
        label: "UPT Surakarta",
        options: [
          { value: "UPT Surakarta", label: "Seluruh UPT Surakarta" },
          { value: "ULTG Surakarta", label: "ULTG Surakarta" },
          { value: "GI Pedan", label: "GI Pedan" }
        ]
      },
      {
        label: "UPT Salatiga",
        options: [
          { value: "UPT Salatiga", label: "Seluruh UPT Salatiga" },
          { value: "ULTG Salatiga", label: "ULTG Salatiga" },
          { value: "GI Tuntang", label: "GI Tuntang" },
          { value: "GI Bawen", label: "GI Bawen" }
        ]
      }
    ];

    if (!userUnitScope) {
      return allGroups;
    }

    const normalizedScope = userUnitScope.toLowerCase();
    return allGroups.filter(g => g.label.toLowerCase().includes(normalizedScope) || normalizedScope.includes(g.label.toLowerCase()));
  }, [userUnitScope]);

  // Set initial selectedUnit from logged in user if available
  useEffect(() => {
    if (userUnitScope && (selectedUnit === "all" || !selectedUnit)) {
      setSelectedUnit(userUnitScope);
    }
  }, [userUnitScope, selectedUnit]);

  // Load saved signatories from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("epresensi_report_signatories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length === 3 && (parsed[0].role?.includes("Verifikasi") || parsed[0].title === "DIVERIFIKASI OLEH")) {
            setSignatories([
              { ...parsed[1], title: "DIVERIFIKASI OLEH", role: "Checker" },
              parsed[2]
            ]);
          } else {
            setSignatories(parsed);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Filter officers and employees EXCLUDING maker roles, scoped to current user UPT and active status
  const nonMakerSignatories = useMemo(() => {
    try {
      const authUsers = AuthService.getUsers() || [];
      const masterPegawai = MasterDataService.getAll("m_pegawai", { limit: 1000 })?.data || [];
      const masterUnits = MasterDataService.getAll("m_unit", { limit: 1000 })?.data || [];
      
      const finalUnitScope = userUnitScope || (selectedUnit !== "all" ? selectedUnit : null);

      const list = [];
      const seenNips = new Set();

      const isMatchUpt = (unitName) => {
        if (!finalUnitScope || finalUnitScope === "Seluruh UPT" || finalUnitScope === "all") return true;
        
        const scopeLower = finalUnitScope.toLowerCase();
        const nameLower = (unitName || "").toLowerCase();
        
        if (nameLower.includes(scopeLower) || scopeLower.includes(nameLower)) return true;
        
        if (scopeLower.includes("semarang")) {
          return nameLower.includes("semarang") || nameLower.includes("kudus") || nameLower.includes("srondol") || nameLower.includes("ungaran") || nameLower.includes("krapyak");
        } else if (scopeLower.includes("purwokerto")) {
          return nameLower.includes("purwokerto") || nameLower.includes("kalisari");
        } else if (scopeLower.includes("surakarta")) {
          return nameLower.includes("surakarta") || nameLower.includes("pedan");
        } else if (scopeLower.includes("salatiga")) {
          return nameLower.includes("salatiga") || nameLower.includes("tuntang") || nameLower.includes("bawen");
        }
        
        return false;
      };

      // Add authUsers except maker
      authUsers.forEach((u) => {
        const roleLower = (u.role || u.sub_role || "").toLowerCase();
        const isAllowedRole = roleLower === "checker" || roleLower === "verification" || roleLower === "approved1" || roleLower === "approval 1" || roleLower === "approval1";
        const isActive = u.status === undefined || u.status === "AKTIF" || u.status === "aktif" || u.isActive !== false;

        let userUptName = u.unitUpt || u.unit_upt;
        if (!userUptName && u.nip) {
          const matchedPeg = masterPegawai.find(p => p.nip === u.nip);
          if (matchedPeg) {
            const matchedUnit = masterUnits.find(un => un.id_unit_upt === matchedPeg.id_unit_upt);
            if (matchedUnit) {
              userUptName = matchedUnit.upt;
            }
          }
        }
        if (!userUptName) {
          userUptName = "UPT Semarang";
        }

        if (isAllowedRole && isActive && isMatchUpt(userUptName) && u.nip && !seenNips.has(u.nip)) {
          seenNips.add(u.nip);
          list.push({
            nip: u.nip,
            name: u.name || u.nama || "Pejabat",
            jabatan: u.jabatan || (u.role ? u.role.toUpperCase() : "Pejabat PLN"),
            roleLabel: u.role ? u.role.toUpperCase() : "OFFICER",
            unitUpt: userUptName
          });
        }
      });

      // Add masterPegawai if active, matching UPT, and not maker
      masterPegawai.forEach((p) => {
        const matchedUser = authUsers.find(u => u.nip === p.nip);
        const roleLower = (p.role || (matchedUser && matchedUser.role) || "").toLowerCase();
        const isAllowedRole = roleLower === "checker" || roleLower === "verification" || roleLower === "approved1" || roleLower === "approval 1" || roleLower === "approval1";
        const isActive = p.active === undefined || p.active === "Y" || p.status === "AKTIF";

        let pegawaiUptName = p.unitUpt || p.unit_upt;
        if (!pegawaiUptName && p.id_unit_upt) {
          const matchedUnit = masterUnits.find(un => un.id_unit_upt === p.id_unit_upt);
          if (matchedUnit) {
            pegawaiUptName = matchedUnit.upt;
          }
        }
        if (!pegawaiUptName) {
          pegawaiUptName = "UPT Semarang";
        }

        if (isAllowedRole && isActive && isMatchUpt(pegawaiUptName) && p.nip && !seenNips.has(p.nip)) {
          seenNips.add(p.nip);
          list.push({
            nip: p.nip,
            name: p.nama || p.name,
            jabatan: p.jabatan || "Pegawai Staf PLN",
            roleLabel: p.role ? p.role.toUpperCase() : (matchedUser && matchedUser.role ? matchedUser.role.toUpperCase() : "PEGAWAI AKTIF"),
            unitUpt: pegawaiUptName
          });
        }
      });

      return list;
    } catch (err) {
      console.error("Error in nonMakerSignatories useMemo:", err);
      return [];
    }
  }, [currentUser, selectedUnit, userUnitScope]);

  if (!currentUser) return <LoadingSkeleton variant="dashboard" />;

  // Filter ONLY submissions with status APPROVED / approved (Completed Approval 3)
  const approved3Submissions = useMemo(() => {
    return (submissions || []).filter((sub) => {
      const s = sub.status ? sub.status.toUpperCase() : "";
      return s === "APPROVED";
    });
  }, [submissions]);

  // Apply User Filters
  const filteredSubmissions = useMemo(() => {
    return approved3Submissions.filter((sub) => {
      // Month & Year Filter based on tanggalPengajuan / tanggalLembur / tanggalMulai
      const dateStr = sub.tanggalPengajuan || sub.tanggalLembur || sub.tanggalMulai;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          if (selectedMonth !== "all") {
            const m = (d.getMonth() + 1).toString();
            if (m !== selectedMonth) return false;
          }
          if (selectedYear !== "all") {
            const y = d.getFullYear().toString();
            if (y !== selectedYear) return false;
          }
        }
      }

      // Type Filter
      if (selectedType !== "all" && sub.type !== selectedType) {
        return false;
      }

      // Unit Filter per UPT Grouping
      if (selectedUnit !== "all") {
        const u = (sub.unitUltg || sub.unitUpt || "").toLowerCase();
        const sel = selectedUnit.toLowerCase();

        let match = u.includes(sel);
        if (!match) {
          if (selectedUnit === "UPT Semarang") {
            match = u.includes("semarang") || u.includes("kudus") || u.includes("srondol") || u.includes("ungaran") || u.includes("krapyak");
          } else if (selectedUnit === "UPT Purwokerto") {
            match = u.includes("purwokerto") || u.includes("kalisari");
          } else if (selectedUnit === "UPT Surakarta") {
            match = u.includes("surakarta") || u.includes("pedan");
          } else if (selectedUnit === "UPT Salatiga") {
            match = u.includes("salatiga") || u.includes("tuntang") || u.includes("bawen");
          }
        }
        if (!match) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (sub.employeeName || "").toLowerCase().includes(q);
        const matchNip = (sub.employeeNip || "").toLowerCase().includes(q);
        const matchDoc = (sub.nomorDokumen || "").toLowerCase().includes(q);
        const matchKet = (sub.keterangan || sub.maksudSppd || "").toLowerCase().includes(q);
        if (!matchName && !matchNip && !matchDoc && !matchKet) return false;
      }

      return true;
    });
  }, [approved3Submissions, selectedMonth, selectedYear, selectedType, selectedUnit, searchQuery]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    let totalLemburHours = 0;
    let totalLemburCost = 0;
    let totalSppdCost = 0;
    let totalCutiDays = 0;
    let totalIjinDays = 0;
    let totalSakitDays = 0;

    filteredSubmissions.forEach((s) => {
      if (s.type === "lembur") {
        totalLemburHours += Number(s.durasiJam || 0);
        totalLemburCost += Number(s.estimasiBiayaRupiah || 0);
      } else if (s.type === "sppd") {
        totalSppdCost += Number(s.totalEstimasiBiaya || 0);
      } else if (s.type === "cuti") {
        totalCutiDays += Number(s.jumlahHari || 0);
      } else if (s.type === "ijin") {
        totalIjinDays += Number(s.jumlahHari || 1);
      } else if (s.type === "sakit") {
        totalSakitDays += Number(s.jumlahHari || 1);
      }
    });

    return {
      count: filteredSubmissions.length,
      totalLemburHours,
      totalLemburCost,
      totalSppdCost,
      totalCutiDays,
      totalIjinDays,
      totalSakitDays,
      totalIjinSakitDays: totalIjinDays + totalSakitDays
    };
  }, [filteredSubmissions]);

  const monthNames = [
    { value: "all", label: "Semua Bulan" },
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" }
  ];

  const effectiveUnit = selectedUnit !== "all" 
    ? selectedUnit 
    : (currentUser?.unitUpt || "UPT Semarang");

  const filterInfo = {
    periode: `${selectedMonth === "all" ? "Semua Bulan" : monthNames.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`,
    type: selectedType === "all" ? "Semua Jenis" : selectedType,
    unit: effectiveUnit,
    unitUpt: currentUser?.unitUpt || effectiveUnit,
    selectedMonth,
    selectedYear,
    docSeq
  };

  // Check if selected period is completed (periode yang sudah selesai) vs ongoing (periode yang sedang berlangsung)
  const isPeriodCompleted = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    if (selectedYear === "all") return false;

    const y = parseInt(selectedYear, 10);
    if (isNaN(y)) return false;

    if (y < currentYear) return true;
    if (y > currentYear) return false;

    // y === currentYear
    if (selectedMonth === "all") return false;

    const m = parseInt(selectedMonth, 10);
    if (isNaN(m)) return false;

    return m < currentMonth;
  }, [selectedMonth, selectedYear]);

  const handleOpenExportModal = (format) => {
    if (format === "pdf" && !isPeriodCompleted) {
      setSuccessNotification(
        "Generate PDF Laporan hanya dapat dilakukan untuk periode yang telah selesai (bulan/tahun yang sudah berlalu). Periode yang sedang berlangsung tidak dapat di-generate."
      );
      setTimeout(() => setSuccessNotification(null), 6000);
      return;
    }
    setExportFormat(format);
    setIsSignatoryModalOpen(true);
  };

  const handleOpenPreviewModal = () => {
    setIsPreviewReportModalOpen(true);
  };

  const handleClosePreviewModal = () => {
    setIsPreviewReportModalOpen(false);
  };

  const handleSelectUserForSignatory = (index, userNip) => {
    if (!userNip) return;
    const found = nonMakerSignatories.find((u) => u.nip === userNip);
    if (!found) return;
    setSignatories((prev) => {
      const next = [...prev];
      const defaultTitle = index === 0 ? "DIVERIFIKASI OLEH" : index === 1 ? "DISETUJUI OLEH" : "MENGETAHUI / PENGESAHAN";
      const defaultRole = found.roleLabel === "CHECKER" ? "TL PLN (Checker)" : found.roleLabel === "VERIFICATION" ? "AMN PLN (Verifikasi)" : found.roleLabel === "APPROVED1" ? "MAN PLN (Approval 1)" : found.roleLabel;
      next[index] = {
        ...next[index],
        name: found.name,
        nip: found.nip,
        jabatan: found.jabatan,
        role: next[index].role || defaultRole,
        title: next[index].title || defaultTitle
      };
      return next;
    });
  };

  const handleUpdateSignatoryField = (index, field, value) => {
    setSignatories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleResetSignatories = () => {
    const unitTarget = selectedUnit !== "all" ? selectedUnit : userUnitScope || "UPT Semarang";
    const freshDefaults = DataService.getDefaultReportSignatories(unitTarget);
    setSignatories(freshDefaults);
    localStorage.removeItem("epresensi_report_signatories");
    setSuccessNotification("Pejabat Penandatangan di-reset ke data default (Checker & Approval 1).");
    setTimeout(() => setSuccessNotification(null), 3000);
  };

  const handleSaveSignatoriesOnly = () => {
    try {
      localStorage.setItem("epresensi_report_signatories", JSON.stringify(signatories));
      setSuccessNotification("Susunan Pejabat Penandatangan (Non-Maker) berhasil disimpan!");
      setTimeout(() => setSuccessNotification(null), 4000);
    } catch (err) {
      console.error("Gagal menyimpan signatories:", err);
    }
  };

  const handleExecuteExport = async () => {
    if (exportFormat === "pdf" && !isPeriodCompleted) {
      alert("Generate PDF hanya dapat dilakukan untuk periode yang sudah selesai.");
      return;
    }
    setIsExporting(true);
    try {
      localStorage.setItem("epresensi_report_signatories", JSON.stringify(signatories));

      const currentSeq = docSeq;
      const currentFilterInfo = { ...filterInfo, docSeq: currentSeq };

      if (exportFormat === "pdf") {
        await PdfService.downloadReportPdf(filteredSubmissions, currentFilterInfo, signatories);
      } else {
        ExportService.exportReportToExcel(filteredSubmissions, currentFilterInfo, signatories);
      }

      // Auto-increment sequence for next document
      const nextSeq = currentSeq + 1;
      setDocSeq(nextSeq);
      localStorage.setItem("epresensi_rekap_doc_seq", String(nextSeq));

      setIsSignatoryModalOpen(false);
      setSuccessNotification(`Dokumen Laporan ${exportFormat.toUpperCase()} (#${String(currentSeq).padStart(3, "0")}) berhasil di-generate dengan susunan 3 Pejabat Penandatangan.`);
      setTimeout(() => setSuccessNotification(null), 5000);
    } catch (err) {
      console.error("Failed exporting report:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Success Notification Banner */}
      <AnimatePresence>
        {successNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs rounded-2xl shadow-md flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successNotification}</span>
            </div>
            <button
              onClick={() => setSuccessNotification(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Title & Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Report Permohonan Selesai
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Rekapitulasi resmi & laporan resume seluruh transaksi yang telah disetujui
              </p>
            </div>
          </div>
        </div>

        {/* Generate Export Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          {!isPeriodCompleted && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Periode Sedang Berlangsung</span>
            </span>
          )}
          <button
            onClick={handleOpenPreviewModal}
            className="flex-1 md:flex-none px-4 py-2.5 min-h-[42px] font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center justify-center gap-2"
            title="Pratinjau tampilan ReportPdfDocument.jsx untuk periode saat ini"
          >
            <Eye className="w-4 h-4 text-sky-200" />
            <span>Preview Periode Saat Ini</span>
          </button>
          <button
            onClick={() => handleOpenExportModal("pdf")}
            disabled={isExporting || !isPeriodCompleted}
            title={
              !isPeriodCompleted
                ? "Generate PDF hanya dapat dilakukan untuk periode yang sudah selesai"
                : "Generate PDF Laporan"
            }
            className={`flex-1 md:flex-none px-4 py-2.5 min-h-[42px] font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 ${
              !isPeriodCompleted
                ? "bg-slate-200 text-slate-400 border border-slate-300 shadow-none cursor-not-allowed"
                : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 cursor-pointer"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Generate PDF (.pdf)</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Transaksi</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-slate-900">{metrics.count}</span>
            <span className="text-xs font-semibold text-slate-500">Dokumen</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Fully Verified
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Jam Lembur & Biaya</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-amber-600">{metrics.totalLemburHours} Jam</span>
          </div>
          <p className="text-[11px] text-slate-600 font-bold mt-1 font-mono">
            {formatRupiah(metrics.totalLemburCost)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Estimasi SPPD</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-black text-sky-600 font-mono">{formatRupiah(metrics.totalSppdCost)}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Perjalanan Dinas Resmi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cuti / Ijin / Sakit</p>
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mt-1">
            <span className="text-sm font-black text-emerald-600">{metrics.totalCutiDays} Cuti</span>
            <span className="text-[10px] font-bold text-slate-300">/</span>
            <span className="text-sm font-black text-amber-600">{metrics.totalIjinDays} Ijin</span>
            <span className="text-[10px] font-bold text-slate-300">/</span>
            <span className="text-sm font-black text-rose-500">{metrics.totalSakitDays} Sakit</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Rekapitulasi Cuti, Ijin & Sakit Pegawai</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-800">Filter Laporan & Parameter Pencarian</h2>
          </div>
          {isPeriodCompleted ? (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Periode Selesai (Siap Generate PDF)
            </span>
          ) : (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Periode Sedang Berlangsung (PDF Dibatasi)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Month Filter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Bulan Pengajuan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              {monthNames.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tahun</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="all">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Jenis Permohonan</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="all">Semua Jenis</option>
              <option value="lembur">Lembur</option>
              <option value="cuti">Cuti</option>
              <option value="ijin">Ijin</option>
              <option value="sakit">Sakit</option>
              <option value="sppd">SPPD</option>
            </select>
          </div>

          {/* Unit Filter - Grouped per UPT */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Grup Unit Kerja / UPT</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              {userUnitScope ? (
                <option value={userUnitScope}>-- Semua Unit di {userUnitScope} --</option>
              ) : (
                <option value="all">-- Semua Unit (Seluruh UPT) --</option>
              )}
              {availableUnitGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Search Query */}
        <div className="relative pt-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan NIP, Nama Pegawai, Nomor Dokumen, atau Keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-600 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Daftar Permohonan Di Setujui ({filteredSubmissions.length}) berkas
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Dokumen Resmi Terverifikasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">No. Dokumen</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Pemohon</th>
                <th className="py-3 px-4">Unit / ULTG</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Ringkasan Detail</th>
                <th className="py-3 px-4 text-right">Estimasi Biaya</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    <p className="font-bold text-slate-600 mb-1">Tidak ada dokumen yang telah di Setujui</p>
                    <p>Tidak ditemukan data permohonan yang sesuai dengan filter pilihan Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub, index) => {
                  let nominal = "-";
                  if (sub.type === "lembur") nominal = formatRupiah(sub.estimasiBiayaRupiah || 0);
                  if (sub.type === "sppd") nominal = formatRupiah(sub.totalEstimasiBiaya || 0);

                  let rincian = sub.keterangan || "-";
                  if (sub.type === "lembur") rincian = `${sub.kategoriLembur || ""} - ${sub.jenisPekerjaan || ""} (${sub.durasiJam || 0} Jam)`;
                  if (sub.type === "cuti") rincian = `${sub.cutiType || "Cuti"} (${sub.jumlahHari || 0} Hari)`;
                  if (sub.type === "sppd") rincian = `${sub.maksudSppd || ""} - Rute: ${sub.kotaTujuan || "-"}`;

                  return (
                    <tr key={sub.id || index} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">{index + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-[11px] whitespace-nowrap">
                        {getFormattedDocNo(sub)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          {sub.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{sub.employeeName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{sub.employeeNip}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {sub.unitUltg || sub.unitUpt || "UPT Semarang"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {formatDateIndonesian(sub.tanggalPengajuan || sub.tanggalLembur || sub.tanggalMulai)}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-700" title={rincian}>
                        {rincian}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap font-mono">
                        {nominal}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Approved 3
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedDocSub(sub)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl shadow-2xs cursor-pointer transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                          <span>Pratinjau</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL POP-UP: Penentuan Tanda Tangan Penandatangan Dokumen (Kiri ke Kanan) */}
      {isSignatoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-8"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white tracking-tight flex items-center gap-2">
                    <span>Penentuan Pejabat Penandatangan Laporan</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      Format: {exportFormat.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Susun pejabat penandatangan yang akan dicetak dalam dokumen laporan dari KIRI ke KANAN.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSignatoryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-slate-50/50">
              {/* Info Banner */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Panduan Tandatangan:</strong> Laporan akan mencetak 2 blok penandatangan secara horisontal (Posisi Kiri DIVERIFIKASI OLEH dan Posisi Kanan MENGETAHUI / PENGESAHAN). Anda dapat memilih pejabat dari sistem atau mengetikkan nama, NIP, dan jabatan secara manual.
                </p>
              </div>

              {/* 2 Columns Signatories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {signatories.map((sig, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 relative hover:border-emerald-500/50 transition"
                  >
                    {/* Position Label Badge */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[11px] font-black tracking-tight text-slate-800 uppercase flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {sig.positionLabel}
                      </span>
                    </div>

                    {/* Quick Select Dropdown */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        Pilih dari Daftar User / Officer
                      </label>
                      <select
                        onChange={(e) => handleSelectUserForSignatory(idx, e.target.value)}
                        defaultValue=""
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                      >
                        <option value="">-- Pilih Pejabat / Pegawai Non-Maker --</option>
                        {nonMakerSignatories.map((u) => (
                          <option key={u.nip} value={u.nip}>
                            {u.name} — {u.jabatan} [{u.roleLabel}]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Judul Tanggung Jawab */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        Judul Header Tanda Tangan *
                      </label>
                      <input
                        type="text"
                        value={sig.title}
                        onChange={(e) => handleUpdateSignatoryField(idx, "title", e.target.value)}
                        placeholder="Contoh: DIVERIFIKASI OLEH"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* Role / Sub Title */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        Sub-Judul / Peran Approval
                      </label>
                      <input
                        type="text"
                        value={sig.role}
                        onChange={(e) => handleUpdateSignatoryField(idx, "role", e.target.value)}
                        placeholder="Contoh: AMN PLN (Verifikasi)"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* Nama Lengkap */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        Nama Lengkap Penandatangan *
                      </label>
                      <input
                        type="text"
                        value={sig.name}
                        onChange={(e) => handleUpdateSignatoryField(idx, "name", e.target.value)}
                        placeholder="Nama Pejabat / Pegawai"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* NIP */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        NIP *
                      </label>
                      <input
                        type="text"
                        value={sig.nip}
                        onChange={(e) => handleUpdateSignatoryField(idx, "nip", e.target.value)}
                        placeholder="Nomor Induk Pegawai"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* Jabatan */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        Jabatan Lengkap *
                      </label>
                      <input
                        type="text"
                        value={sig.jabatan}
                        onChange={(e) => handleUpdateSignatoryField(idx, "jabatan", e.target.value)}
                        placeholder="Jabatan Struktur PLN"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={handleResetSignatories}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Pejabat Default</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleSaveSignatoriesOnly}
                  className="px-4 py-2 font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Simpan Penandatangan</span>
                </button>
                <button
                  onClick={() => setIsSignatoryModalOpen(false)}
                  className="px-3.5 py-2 font-bold text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleExecuteExport}
                  disabled={isExporting}
                  className="px-5 py-2.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {exportFormat === "pdf" ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  <span>
                    {isExporting
                      ? "Proses Meng-generate..."
                      : `Generate & Download ${exportFormat.toUpperCase()}`}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Preview Report PDF / Document via DocumentViewerModal */}
      <DocumentViewerModal
        isOpen={isPreviewReportModalOpen}
        onClose={handleClosePreviewModal}
        isReport={true}
        reportSubmissions={filteredSubmissions}
        reportFilterInfo={{ ...filterInfo, docSeq }}
        reportSignatories={signatories}
        isPeriodCompleted={isPeriodCompleted}
      />

      {/* Official Document Preview Modal */}
      {selectedDocSub && (
        <DocumentViewerModal
          submission={selectedDocSub}
          isOpen={!!selectedDocSub}
          onClose={() => setSelectedDocSub(null)}
        />
      )}
    </div>
  );
};
