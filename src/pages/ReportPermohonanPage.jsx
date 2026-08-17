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
import { DocumentViewerModal } from "../components/common/DocumentViewerModal";
import { SignatureModal } from "../components/common/SignatureModal";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../services/api";
import { mapWorkflowSubmission } from "../utils/workflowSubmissionMapper";
import { matchesNavbarTransactionFilter } from "../utils/navbarTransactionFilter";

const DEFAULT_SIGNATORIES = DataService.getDefaultReportSignatories("UPT Semarang");

const isReplacementOvertime = (submission) => {
  if (submission?.type !== "lembur") return false;
  const text = [submission.kategoriLembur, submission.jenisPekerjaan, submission.dasarLemburType, submission.keterangan]
    .filter(Boolean).join(" ").toUpperCase();
  return ["CUTI", "IJIN", "IZIN", "SAKIT"].some((keyword) => text.includes(keyword))
    && (text.includes("PENGGANTI") || ["CUTI", "IJIN", "IZIN", "SAKIT"].includes(String(submission.dasarLemburType || "").toUpperCase()));
};

export const ReportPermohonanPage = ({
  currentUser,
  submissions = [],
  navbarProjectIds = [],
  selectedProject = "Semua Project",
  startDate = "",
  endDate = "",
  setStartDate = () => {},
  setEndDate = () => {},
  selectedUpt = "Semua UPT",
  selectedUltg = "Semua ULTG",
  selectedGi = "Semua GI",
  onSelectGi = () => {}
}) => {
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedType, setSelectedType] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocSub, setSelectedDocSub] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [reportSubmissions, setReportSubmissions] = useState([]);
  const [reportSummary, setReportSummary] = useState({});
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [reportError, setReportError] = useState("");
  const [reportUsers, setReportUsers] = useState([]);
  const [reportUnits, setReportUnits] = useState([]);
  const [reportDocument, setReportDocument] = useState(null);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const jabatanName = String(currentUser?.jabatan?.nama_jabatan || currentUser?.nama_jabatan || currentUser?.jabatan || "");
  const isPlnEsEmployee = /(PLN\s*ES|ELECTRICITY\s+SERVICES)/i.test(jabatanName);
  const [reportView, setReportView] = useState(() => (/(PLN\s*ES|ELECTRICITY\s+SERVICES)/i.test(jabatanName) ? "PLN_ES" : "PLN"));
  const isPlnEsView = reportView === "PLN_ES";
  const isPlnMonitoringView = isPlnEsEmployee && reportView === "PLN";

  useEffect(() => {
    setReportView(isPlnEsEmployee ? "PLN_ES" : "PLN");
  }, [isPlnEsEmployee]);

  const applyMonthToNavbar = (month, year) => {
    const numericMonth = Number(month);
    const numericYear = Number(year);
    if (!numericMonth || !numericYear) return;
    const pad = (value) => String(value).padStart(2, "0");
    const lastDay = new Date(numericYear, numericMonth, 0).getDate();
    setStartDate(`${numericYear}-${pad(numericMonth)}-01`);
    setEndDate(`${numericYear}-${pad(numericMonth)}-${pad(lastDay)}`);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    applyMonthToNavbar(month, selectedYear);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    applyMonthToNavbar(selectedMonth, year);
  };

  useEffect(() => {
    const sourceDate = startDate || endDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) return;
    setSelectedYear(sourceDate.slice(0, 4));
    setSelectedMonth(String(Number(sourceDate.slice(5, 7))));
  }, [startDate, endDate]);
  const normalizedRole = String(currentUser?.kode_role || currentUser?.role || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const isChecker = normalizedRole === "CHECKER";
  const isApproval1 = ["APPROVAL1", "APPROVED1"].includes(normalizedRole);
  const isApproval2 = ["APPROVAL2", "APPROVED2"].includes(normalizedRole);

  useEffect(() => {
    if (!currentUser) return;
    api.getUsers()
      .then((rows) => setReportUsers(Array.isArray(rows) ? rows : []))
      .catch(() => setReportUsers([]));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return undefined;
    let active = true;
    const timeout = setTimeout(async () => {
      setIsLoadingReport(true);
      setReportError("");
      try {
        const params = {
          year: Number(selectedYear),
          month: Number(selectedMonth),
          type: selectedType,
          id_unit: selectedUnit !== "all" ? Number(selectedUnit) : undefined,
          search: searchQuery.trim() || undefined,
          id_project: navbarProjectIds.length === 1 ? navbarProjectIds[0] : undefined,
          view: reportView,
        };
        const result = await api.getReportPermohonan(params);
        if (!active) return;
        setReportSubmissions((result.transactions || []).map(mapWorkflowSubmission));
        setReportSummary(result.summary || {});
        setReportUnits(Array.isArray(result.units) ? result.units : []);
        setReportDocument(result.report || null);
      } catch (error) {
        if (!active) return;
        setReportSubmissions([]);
        setReportSummary({});
        setReportError(error.response?.data?.message || "Gagal mengambil report permohonan dari server.");
      } finally {
        if (active) setIsLoadingReport(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [currentUser, selectedMonth, selectedYear, selectedType, selectedUnit, searchQuery, navbarProjectIds.join(","), reportView]);

  useEffect(() => {
    if (selectedUnit === "all" && reportUnits.length === 1) setSelectedUnit(String(reportUnits[0].id_unit));
  }, [reportUnits, selectedUnit]);

  useEffect(() => {
    if (!reportUnits.length) return;
    if (!selectedGi || selectedGi === "Semua GI") {
      setSelectedUnit("all");
      return;
    }
    const unit = reportUnits.find((item) => item.nama_unit === selectedGi);
    if (unit) setSelectedUnit(String(unit.id_unit));
  }, [selectedGi, reportUnits]);

  // Auto increment sequence for document number (001, 002, ...)
  const [docSeq, setDocSeq] = useState(() => {
    try {
      const saved = globalThis.appStorage.getItem("epresensi_rekap_doc_seq");
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

    const serverUnit = currentUser.unitUpt || currentUser.unit_upt || currentUser.nama_unit || currentUser.unit;
    if (serverUnit && serverUnit !== "Seluruh UPT") return serverUnit;
    return null;
  }, [currentUser]);

  // Compute available Unit/UPT groups for dropdown rendering based on scope
  const availableUnitGroups = useMemo(() => {
    return reportUnits.length ? [{
      label: "Gardu Induk dalam lingkup Anda",
      options: reportUnits.map((unit) => ({ value: String(unit.id_unit), label: unit.nama_unit })),
    }] : [];
  }, [reportUnits]);

  // Scope utama berasal dari Navbar melalui daftar submissions yang sudah terfilter.
  // Filter unit di halaman ini bersifat tambahan dan tidak dipaksa saat halaman dibuka.

  // Load saved signatories from globalThis.appStorage on mount
  useEffect(() => {
    try {
      const saved = globalThis.appStorage.getItem("epresensi_report_signatories");
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
      const authUsers = reportUsers;
      const masterPegawai = [];
      const masterUnits = [];
      
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
  }, [currentUser, selectedUnit, userUnitScope, reportUsers]);

  if (!currentUser) return <LoadingSkeleton variant="dashboard" />;

  // Filter ONLY submissions with status APPROVED / approved (Completed Approval 3)
  const visibleByReportMode = useMemo(() => {
    if (isPlnEsView) return reportSubmissions;
    return reportSubmissions.filter((sub) => {
      const s = sub.status ? sub.status.toUpperCase() : "";
      return s === "APPROVED";
    });
  }, [reportSubmissions, isPlnEsView]);

  // Apply User Filters
  const filteredSubmissions = useMemo(() => {
    return visibleByReportMode.filter((sub) => {
      if (!matchesNavbarTransactionFilter(sub, { projectIds: navbarProjectIds, startDate, endDate })) return false;
      const hierarchyNames = [
        sub.unitUpt,
        sub.unitUltg,
        sub.garduInduk,
        ...(sub.unitHierarchy || []).map((unit) => unit.name)
      ].filter(Boolean);
      if (selectedUpt !== "Semua UPT" && !hierarchyNames.includes(selectedUpt)) return false;
      if (selectedUltg !== "Semua ULTG" && !hierarchyNames.includes(selectedUltg)) return false;
      if (selectedGi !== "Semua GI" && !hierarchyNames.includes(selectedGi)) return false;
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
      if (selectedUnit !== "all" && !/^\d+$/.test(selectedUnit)) {
        const u = [
          sub.unitUpt,
          sub.unitUltg,
          sub.garduInduk,
          ...(sub.unitHierarchy || []).map((unit) => unit.name),
        ].filter(Boolean).join(" ").toLowerCase();
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
  }, [visibleByReportMode, selectedMonth, selectedYear, selectedType, selectedUnit, searchQuery, navbarProjectIds, startDate, endDate, selectedUpt, selectedUltg, selectedGi]);

  // Satu sumber data untuk grid, preview ReportDocument, dan file hasil ekspor.
  const reportOutputSubmissions = filteredSubmissions;

  // Metrics Calculation
  const metrics = useMemo(() => {
    let totalLemburHours = 0;
    let totalLemburCost = 0;
    let totalSppdCost = 0;
    let totalCutiDays = 0;
    let totalIjinDays = 0;
    let totalSakitDays = 0;
    let totalCutiTransactions = 0;
    let totalIjinTransactions = 0;
    let totalSakitTransactions = 0;

    filteredSubmissions.forEach((s) => {
      if (s.type === "lembur") {
        totalLemburHours += Number(s.durasiJam || 0);
        totalLemburCost += Number(s.estimasiBiayaRupiah || 0);
      } else if (s.type === "sppd") {
        totalSppdCost += Number(s.totalEstimasiBiaya || 0);
      } else if (s.type === "cuti") {
        totalCutiDays += Number(s.jumlahHari || 0);
        totalCutiTransactions += 1;
      } else if (s.type === "ijin") {
        totalIjinDays += Number(s.jumlahHari || 1);
        totalIjinTransactions += 1;
      } else if (s.type === "sakit") {
        totalSakitDays += Number(s.jumlahHari || 1);
        totalSakitTransactions += 1;
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
      totalCutiTransactions,
      totalIjinTransactions,
      totalSakitTransactions,
      totalIjinSakitDays: totalIjinDays + totalSakitDays
    };
  }, [filteredSubmissions]);

  const monthNames = [
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

  const effectiveUnit = reportUnits.find((unit) => String(unit.id_unit) === selectedUnit)?.nama_unit || "Pilih GI";

  const filterInfo = {
    periode: `${monthNames.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`,
    project: selectedProject,
    type: selectedType === "all" ? "Semua Jenis" : selectedType,
    unit: effectiveUnit,
    unitUpt: currentUser?.unitUpt || effectiveUnit,
    selectedMonth,
    selectedYear,
    docSeq,
    summary: reportSummary,
    reportView
  };

  const reportSignatories = reportDocument ? [
    { title: "DIPERIKSA OLEH", role: "Checker", name: reportDocument.checker?.name, nip: reportDocument.checker?.nip, jabatan: reportDocument.checker?.jabatan, signature: reportDocument.checker_signature, signatureUrl: reportDocument.checker_signature },
    { title: "DISETUJUI OLEH", role: "Approval 1", name: reportDocument.approval1?.name, nip: reportDocument.approval1?.nip, jabatan: reportDocument.approval1?.jabatan, signature: reportDocument.approval_1_signature, signatureUrl: reportDocument.approval_1_signature },
  ] : [];

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
    if (isPlnEsView) {
      handleExecuteExport(format);
      return;
    }
    if (!isPeriodCompleted) {
      setSuccessNotification(
        "Generate PDF Laporan hanya dapat dilakukan untuk periode yang telah selesai (bulan/tahun yang sudah berlalu). Periode yang sedang berlangsung tidak dapat di-generate."
      );
      setTimeout(() => setSuccessNotification(null), 6000);
      return;
    }
    if (!reportDocument?.fully_signed) {
      setSuccessNotification("PDF dan Excel baru dapat diekspor setelah Checker dan Approval 1 menandatangani report.");
      return;
    }
    handleExecuteExport(format);
  };

  const handleCreateReport = async () => {
    if (!isChecker || isPlnMonitoringView || selectedUnit === "all") return;
    if (navbarProjectIds.length !== 1) {
      setReportError("Pilih tepat satu Project pada filter Navbar sebelum menginisiasi report.");
      return;
    }
    setIsExporting(true);
    setReportError("");
    try {
      const report = await api.createReportPermohonan({ year: Number(selectedYear), month: Number(selectedMonth), id_unit: Number(selectedUnit), id_project: navbarProjectIds[0] });
      setReportDocument(report);
      setSuccessNotification(`Report ${report.nomor_dokumen} berhasil dibuat. Silakan bubuhkan tanda tangan Checker.`);
    } catch (error) {
      setReportError(error.response?.data?.message || "Gagal membuat report.");
    } finally { setIsExporting(false); }
  };

  const handleSaveReportSignature = async (signature) => {
    try {
      const report = await api.signReportPermohonan(reportDocument.id_report_permohonan, signature);
      setReportDocument(report);
      setSuccessNotification(isChecker ? "Tanda tangan Checker tersimpan. Report menunggu Approval 1." : "Report sudah ditandatangani lengkap dan siap diekspor.");
    } catch (error) {
      setReportError(error.response?.data?.message || "Gagal menyimpan tanda tangan.");
    }
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
    globalThis.appStorage.removeItem("epresensi_report_signatories");
    setSuccessNotification("Pejabat Penandatangan di-reset ke data default (Checker & Approval 1).");
    setTimeout(() => setSuccessNotification(null), 3000);
  };

  const handleSaveSignatoriesOnly = () => {
    try {
      globalThis.appStorage.setItem("epresensi_report_signatories", JSON.stringify(signatories));
      setSuccessNotification("Susunan Pejabat Penandatangan (Non-Maker) berhasil disimpan!");
      setTimeout(() => setSuccessNotification(null), 4000);
    } catch (err) {
      console.error("Gagal menyimpan signatories:", err);
    }
  };

  const handleExecuteExport = async (requestedFormat = exportFormat) => {
    setIsExporting(true);
    try {
      if (isPlnEsView) {
        const directFilterInfo = { ...filterInfo, nomorDokumen: "REPORT-PLN-ES", reportLabel: "PLN ES", hideSignatories: true };
        if (requestedFormat === "pdf") {
          await PdfService.downloadReportPdf(filteredSubmissions, directFilterInfo, []);
        } else {
          ExportService.exportReportToExcel(filteredSubmissions, directFilterInfo, [], `Report_Permohonan_PLN_ES_${selectedYear}-${String(selectedMonth).padStart(2, "0")}.xlsx`);
        }
        setSuccessNotification(`Report PLN ES berhasil diekspor ke ${requestedFormat.toUpperCase()}.`);
        setTimeout(() => setSuccessNotification(null), 5000);
        return;
      }
      const exportReport = await api.getReportPermohonanExport(reportDocument.id_report_permohonan);
      const currentFilterInfo = { ...filterInfo, docSeq: exportReport.nomor_urut, nomorDokumen: exportReport.nomor_dokumen };
      if (requestedFormat === "pdf") {
        await PdfService.downloadReportPdf(reportOutputSubmissions, currentFilterInfo, reportSignatories);
      } else {
        ExportService.exportReportToExcel(reportOutputSubmissions, currentFilterInfo, reportSignatories, `Report_Permohonan_${exportReport.nomor_dokumen.replace(/\//g, "-")}.xlsx`);
      }
      setSuccessNotification(`Dokumen ${exportReport.nomor_dokumen} berhasil diekspor ke ${requestedFormat.toUpperCase()}.`);
      setTimeout(() => setSuccessNotification(null), 5000);
    } catch (err) {
      setReportError(err.response?.data?.message || "Gagal mengekspor report.");
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

      {reportError && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 font-bold text-xs rounded-2xl flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          {reportError}
        </div>
      )}

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
          {!isPlnEsView && !isPeriodCompleted && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Periode Sedang Berlangsung</span>
            </span>
          )}
          {!isPlnEsView && !isPlnMonitoringView && isChecker && isPeriodCompleted && !reportDocument && (
            <button onClick={handleCreateReport} disabled={isExporting || selectedUnit === "all"} className="flex-1 md:flex-none px-4 py-2.5 min-h-[42px] font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition cursor-pointer disabled:opacity-50">
              <FileText className="w-4 h-4" /><span>Buat Nomor Report</span>
            </button>
          )}
          {!isPlnMonitoringView && reportDocument && ((isChecker && !reportDocument.checker_signature) || (isApproval1 && reportDocument.checker_signature && !reportDocument.approval_1_signature)) && (
            <button onClick={() => setIsSignatureOpen(true)} className="flex-1 md:flex-none px-4 py-2.5 min-h-[42px] font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2">
              <PenTool className="w-4 h-4" /><span>Tanda Tangani Report</span>
            </button>
          )}
          {!isPlnMonitoringView && reportDocument && isApproval1 && !reportDocument.checker_signature && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">Menunggu tanda tangan Checker</span>
          )}
          {!isPlnEsView && (
            <button onClick={handleOpenPreviewModal} disabled={isLoadingReport} className="flex-1 md:flex-none px-4 py-2.5 min-h-[42px] font-bold text-xs bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
              <Eye className="w-4 h-4" /><span>Preview PDF</span>
            </button>
          )}
          <button onClick={() => handleOpenExportModal("excel")} disabled={isExporting || (!isPlnEsView && !reportDocument?.fully_signed)} className="flex-1 md:flex-none px-4 py-2.5 min-h-[42px] font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            <FileSpreadsheet className="w-4 h-4" /><span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleOpenExportModal("pdf")}
            disabled={isExporting || isLoadingReport || (!isPlnEsView && !reportDocument?.fully_signed)}
            title={
              !isPlnEsView && !reportDocument?.fully_signed
                ? "Generate PDF hanya dapat dilakukan untuk periode yang sudah selesai"
                : "Generate PDF Laporan"
            }
            className={`flex-1 md:flex-none px-4 py-2.5 min-h-[42px] font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 ${
              !isPlnEsView && !reportDocument?.fully_signed
                ? "bg-slate-200 text-slate-400 border border-slate-300 shadow-none cursor-not-allowed"
                : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 cursor-pointer"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF (.pdf)</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-2 flex items-center gap-2">
        {isPlnEsEmployee && (
          <button
            type="button"
            onClick={() => setReportView("PLN_ES")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${isPlnEsView ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Report PLN ES
          </button>
        )}
        <button
          type="button"
          onClick={() => setReportView("PLN")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition ${isPlnEsEmployee ? "cursor-pointer" : "cursor-default"} ${!isPlnEsView ? "bg-sky-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
        >
          Report PLN {isPlnEsEmployee ? "(Monitoring Tanda Tangan)" : ""}
        </button>
        <span className="ml-auto hidden md:block text-[11px] font-semibold text-slate-500 px-3">
          {isPlnEsView ? "Seluruh transaksi dapat dilihat dan diekspor langsung" : "Lembur pengganti piket tidak disertakan"}
        </span>
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Biaya SPPD</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-black text-sky-600 font-mono">{formatRupiah(metrics.totalSppdCost)}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Perjalanan Dinas Resmi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cuti / Ijin / Sakit</p>
          <div className="mt-1.5 space-y-1 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-emerald-600">Cuti: {metrics.totalCutiDays} Hari</span>
              <span className="font-bold text-slate-500">{metrics.totalCutiTransactions} Transaksi</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-amber-600">Ijin: {metrics.totalIjinDays} Hari</span>
              <span className="font-bold text-slate-500">{metrics.totalIjinTransactions} Transaksi</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-rose-500">Sakit: {metrics.totalSakitDays} Hari</span>
              <span className="font-bold text-slate-500">{metrics.totalSakitTransactions} Transaksi</span>
            </div>
          </div>
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
              onChange={(e) => handleMonthChange(e.target.value)}
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
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              {Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() - index)).map((year) => <option key={year} value={year}>{year}</option>)}
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
            <label className="block font-bold text-slate-700 mb-1">Gardu Induk (GI)</label>
            <select
              value={selectedUnit}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedUnit(value);
                const unit = reportUnits.find((item) => String(item.id_unit) === value);
                onSelectGi(unit?.nama_unit || "");
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="all">-- Pilih GI --</option>
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

      {reportDocument && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nomor Dokumen Report</p>
              <p className="font-mono font-black text-slate-900 mt-1">{reportDocument.nomor_dokumen}</p>
            </div>
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${reportDocument.fully_signed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
              {reportDocument.fully_signed ? "Ditandatangani Lengkap" : "Proses Tanda Tangan"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportSignatories.map((signer, index) => (
              <div key={signer.role} className={`rounded-2xl border-2 p-4 text-center ${signer.signature ? "border-emerald-200 bg-emerald-50/40" : "border-dashed border-slate-200 bg-slate-50"}`}>
                <p className="text-[10px] font-black tracking-widest text-slate-500">{signer.title}</p>
                <div className="h-20 flex items-center justify-center">
                  {signer.signature ? <img src={signer.signature} alt={`Tanda tangan ${signer.role}`} className="max-h-16 max-w-[220px] mix-blend-multiply" /> : <span className="text-xs font-bold text-slate-400">{index === 1 && !reportDocument.checker_signature ? "Menunggu Checker" : "Belum ditandatangani"}</span>}
                </div>
                <p className="font-bold text-sm text-slate-900">{signer.name || "-"}</p>
                <p className="text-[10px] text-slate-500">NIP. {signer.nip || "-"} · {signer.jabatan || "-"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {isPlnEsView ? "Daftar Seluruh Permohonan PLN ES" : "Daftar Permohonan PLN Disetujui"} ({filteredSubmissions.length}) berkas
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            {isPlnEsView ? "Tanpa Pembatasan Status" : "Dokumen Resmi Terverifikasi"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">No. Dokumen</th>
                <th className="py-3 px-4">Jenis</th>
                {isPlnEsView && <th className="py-3 px-4">Klasifikasi Lembur</th>}
                <th className="py-3 px-4">Pemohon</th>
                <th className="py-3 px-4">Unit / ULTG</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Ringkasan Detail</th>
                <th className="py-3 px-4 text-right">Estimasi Biaya</th>
                <th className="py-3 px-4 text-center">Status</th>
                {!isApproval2 && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoadingReport ? (
                <tr>
                  <td colSpan={isPlnEsView ? 11 : 10} className="p-10 text-center text-slate-500 font-bold">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Mengambil report dari server...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={isPlnEsView ? 11 : 10} className="py-12 text-center text-slate-400 text-xs">
                    <p className="font-bold text-slate-600 mb-1">Tidak ada dokumen pada filter terpilih</p>
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
                      {isPlnEsView && (
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {sub.type === "lembur" ? (
                            <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black ${isReplacementOvertime(sub) ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-sky-50 text-sky-700 border-sky-200"}`}>
                              {isReplacementOvertime(sub) ? "Pengganti Piket (Cuti/Ijin/Sakit)" : "Lembur Operasional"}
                            </span>
                          ) : <span className="text-slate-400">-</span>}
                        </td>
                      )}
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
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${sub.status === "approved" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                          {sub.status === "approved" && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                          {getStatusLabel(sub.status)}
                        </span>
                      </td>
                      {!isApproval2 && <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedDocSub(sub)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl shadow-2xs cursor-pointer transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                          <span>Pratinjau</span>
                        </button>
                      </td>}
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
        reportSubmissions={reportOutputSubmissions}
        reportFilterInfo={{
          ...filterInfo,
          docSeq: reportDocument?.nomor_urut || docSeq,
          nomorDokumen: reportDocument?.nomor_dokumen || "DRAFT REPORT",
          reportLabel: "LAPORAN PERMOHONAN PLN",
          strictSignatories: true
        }}
        reportSignatories={reportSignatories}
        isPeriodCompleted={isPeriodCompleted}
        canDownloadReport={isPlnEsView || Boolean(reportDocument?.fully_signed)}
      />

      {/* Official Document Preview Modal */}
      {selectedDocSub && (
        <DocumentViewerModal
          submission={selectedDocSub}
          isOpen={!!selectedDocSub}
          onClose={() => setSelectedDocSub(null)}
        />
      )}
      <SignatureModal
        isOpen={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
        onSave={handleSaveReportSignature}
        title={`Tanda Tangan ${isChecker ? "Checker" : "Approval 1"}`}
        saveButtonText="Simpan Tanda Tangan Report"
      />
    </div>
  );
};
