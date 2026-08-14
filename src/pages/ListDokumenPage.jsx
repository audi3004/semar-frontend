import { useState, useMemo, useEffect } from "react";
import {
  FolderArchive,
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Clock,
  Palmtree,
  Briefcase,
  Stethoscope,
  FileCheck2,
  RefreshCw,
  Loader2
} from "lucide-react";
import { DocumentViewerModal } from "../components/common/DocumentViewerModal";
import { PdfService } from "../services/pdfService";
import { AuthService } from "../services/authService";
import { MasterDataService } from "../services/masterDataService";
import { formatDateIndonesian, getFormattedDocNo } from "../utils/formatters";
import { api } from "../services/api";
import { mapWorkflowSubmission } from "../utils/workflowSubmissionMapper";

// Fallback Mock Approved Data if submissions prop is empty or has few approved docs
const FALLBACK_APPROVED_SUBMISSIONS = [
  {
    id: "sub-app-001",
    docNo: "PLN/UP2/CUTI/2026/001",
    type: "cuti",
    categoryLabel: "Formulir Cuti",
    employeeName: "Budi Santoso",
    employeeNip: "8912345Z",
    employeeJabatan: "Teknisi Pemeliharaan GI",
    unitUpt: "UPT Semarang",
    unitUltg: "ULTG Semarang",
    garduInduk: "GI Krapyak",
    tanggalPengajuan: "2026-02-10",
    tanggalMulai: "2026-02-15",
    tanggalSelesai: "2026-02-18",
    jumlahHari: 4,
    cutiType: "Cuti Tahunan",
    sisaCutiSebelumnya: 12,
    sisaCutiSesudahnya: 8,
    alamatSelamaCuti: "Jl. Pemuda No. 45, Semarang",
    nomorTeleponDarurat: "081234567890",
    status: "APPROVED",
    approvalSteps: [
      { role: "checker", roleLabel: "TL PLN (Checker)", actionByName: "Ahmad Dani", actionByNip: "8534567X", actionDate: "11/02/2026 09:15", status: "approved" },
      { role: "verification", roleLabel: "AMN PLN (Verifikasi)", actionByName: "Rahmat Hidayat", actionByNip: "8112344W", actionDate: "11/02/2026 11:30", status: "approved" },
      { role: "approved1", roleLabel: "MAN PLN (Approved 1)", actionByName: "Ir. Bambang Suto", actionByNip: "7823411V", actionDate: "11/02/2026 14:20", status: "approved" },
      { role: "approved2", roleLabel: "TL ES (Approved 2)", actionByName: "Andi Prasetyo", actionByNip: "9112345W", actionDate: "12/02/2026 10:05", status: "approved" },
      { role: "approved3", roleLabel: "AMN ES (Approved 3)", actionByName: "Hendra Wijaya", actionByNip: "8876543A", actionDate: "12/02/2026 15:40", status: "approved" }
    ]
  },
  {
    id: "sub-app-002",
    docNo: "PLN/UP2/LEMBUR/2026/014",
    type: "lembur",
    categoryLabel: "Formulir Lembur",
    employeeName: "Siti Aminah",
    employeeNip: "9023456Y",
    employeeJabatan: "Operator Proteksi Transmisi",
    unitUpt: "UPT Semarang",
    unitUltg: "ULTG Semarang",
    garduInduk: "GI Ungaran",
    tanggalPengajuan: "2026-02-12",
    tanggalLembur: "2026-02-12",
    jamMulai: "16:00",
    jamSelesai: "22:00",
    durasiJam: 6,
    kategoriLembur: "Lembur Hari Kerja",
    jenisPekerjaan: "Pemeliharaan Trafo 2 150kV",
    areaGroup: "Pemeliharaan",
    kegiatanDetail: "Pemeliharaan preventif dan pengujian tahanan isolasi Trafo #2 GI Ungaran.",
    status: "APPROVED",
    approvalSteps: [
      { role: "checker", roleLabel: "TL PLN (Checker)", actionByName: "Ahmad Dani", actionByNip: "8534567X", actionDate: "12/02/2026 16:30", status: "approved" },
      { role: "verification", roleLabel: "AMN PLN (Verifikasi)", actionByName: "Rahmat Hidayat", actionByNip: "8112344W", actionDate: "12/02/2026 17:00", status: "approved" },
      { role: "approved1", roleLabel: "MAN PLN (Approved 1)", actionByName: "Ir. Bambang Suto", actionByNip: "7823411V", actionDate: "12/02/2026 18:15", status: "approved" },
      { role: "approved2", roleLabel: "TL ES (Approved 2)", actionByName: "Andi Prasetyo", actionByNip: "9112345W", actionDate: "13/02/2026 08:30", status: "approved" },
      { role: "approved3", roleLabel: "AMN ES (Approved 3)", actionByName: "Hendra Wijaya", actionByNip: "8876543A", actionDate: "13/02/2026 11:00", status: "approved" }
    ]
  },
  {
    id: "sub-app-003",
    docNo: "PLN/UP2/SPPD/2026/005",
    type: "sppd",
    categoryLabel: "Formulir SPPD",
    employeeName: "Kurnia Ramadhan",
    employeeNip: "9512345X",
    employeeJabatan: "Teknisi Pemeliharaan GI",
    unitUpt: "UPT Semarang",
    unitUltg: "ULTG Salatiga",
    garduInduk: "GI Tuntang",
    tanggalPengajuan: "2026-02-01",
    nomorSuratTugas: "ST/UP2/K3/2026/089",
    kotaAsal: "Salatiga",
    kotaTujuan: "Semarang (Kantor Induk)",
    tanggalBerangkat: "2026-02-05",
    tanggalKembali: "2026-02-07",
    durasiHari: 3,
    maksudPerjalanan: "Koordinasi dan Audit Sistem Manajemen K3 Semester I Tahun 2026.",
    bebanAnggaranUnit: "UP2 Jateng & DIY",
    totalEstimasiBiaya: 1850000,
    expenses: [
      { id: "e1", deskripsi: "Uang Harian & Makan", kategori: "Uang Harian", nominal: 1050000 },
      { id: "e2", deskripsi: "BBM & Tol PP", kategori: "Transportasi", nominal: 800000 }
    ],
    status: "APPROVED",
    approvalSteps: [
      { role: "checker", roleLabel: "TL PLN (Checker)", actionByName: "Ahmad Dani", actionByNip: "8534567X", actionDate: "02/02/2026 09:00", status: "approved" },
      { role: "verification", roleLabel: "AMN PLN (Verifikasi)", actionByName: "Rahmat Hidayat", actionByNip: "8112344W", actionDate: "02/02/2026 10:20", status: "approved" },
      { role: "approved1", roleLabel: "MAN PLN (Approved 1)", actionByName: "Ir. Bambang Suto", actionByNip: "7823411V", actionDate: "02/02/2026 13:45", status: "approved" },
      { role: "approved2", roleLabel: "TL ES (Approved 2)", actionByName: "Andi Prasetyo", actionByNip: "9112345W", actionDate: "03/02/2026 09:10", status: "approved" },
      { role: "approved3", roleLabel: "AMN ES (Approved 3)", actionByName: "Hendra Wijaya", actionByNip: "8876543A", actionDate: "03/02/2026 14:00", status: "approved" }
    ]
  },
  {
    id: "sub-app-004",
    docNo: "PLN/UP2/SAKIT/2026/003",
    type: "sakit",
    categoryLabel: "Formulir Sakit",
    employeeName: "Ahmad Dani",
    employeeNip: "8534567X",
    employeeJabatan: "Team Leader GI",
    unitUpt: "UPT Semarang",
    unitUltg: "ULTG Semarang",
    garduInduk: "GI Krapyak",
    tanggalPengajuan: "2026-02-08",
    tanggalMulai: "2026-02-08",
    tanggalSelesai: "2026-02-09",
    jumlahHari: 2,
    instansiKlinik: "RSUD Tugurejo Semarang",
    namaDokter: "dr. Hendra Pratama, Sp.PD",
    diagnosaSingkat: "Demam Dengue / ISPA ringan",
    status: "APPROVED",
    approvalSteps: [
      { role: "checker", roleLabel: "TL PLN (Checker)", actionByName: "Ahmad Dani", actionByNip: "8534567X", actionDate: "08/02/2026 10:00", status: "approved" },
      { role: "verification", roleLabel: "AMN PLN (Verifikasi)", actionByName: "Rahmat Hidayat", actionByNip: "8112344W", actionDate: "08/02/2026 11:15", status: "approved" },
      { role: "approved1", roleLabel: "MAN PLN (Approved 1)", actionByName: "Ir. Bambang Suto", actionByNip: "7823411V", actionDate: "08/02/2026 14:00", status: "approved" },
      { role: "approved2", roleLabel: "TL ES (Approved 2)", actionByName: "Andi Prasetyo", actionByNip: "9112345W", actionDate: "09/02/2026 08:00", status: "approved" },
      { role: "approved3", roleLabel: "AMN ES (Approved 3)", actionByName: "Hendra Wijaya", actionByNip: "8876543A", actionDate: "09/02/2026 10:30", status: "approved" }
    ]
  },
  {
    id: "sub-app-005",
    docNo: "PLN/UP2/IJIN/2026/007",
    type: "ijin",
    categoryLabel: "Formulir Ijin",
    employeeName: "Rahmat Hidayat",
    employeeNip: "8112344W",
    employeeJabatan: "Supervisor Gardu Induk",
    unitUpt: "UPT Purwokerto",
    unitUltg: "ULTG Purwokerto",
    garduInduk: "GI Kalisari",
    tanggalPengajuan: "2026-01-20",
    tanggalMulai: "2026-01-22",
    tanggalSelesai: "2026-01-22",
    jumlahHari: 1,
    ijinReasonType: "Ijin Kepentingan Keluarga",
    keterangan: "Pengurusan dokumen pernikahan anggota keluarga inti.",
    status: "APPROVED",
    approvalSteps: [
      { role: "checker", roleLabel: "TL PLN (Checker)", actionByName: "Ahmad Dani", actionByNip: "8534567X", actionDate: "20/01/2026 11:00", status: "approved" },
      { role: "verification", roleLabel: "AMN PLN (Verifikasi)", actionByName: "Rahmat Hidayat", actionByNip: "8112344W", actionDate: "20/01/2026 13:20", status: "approved" },
      { role: "approved1", roleLabel: "MAN PLN (Approved 1)", actionByName: "Ir. Bambang Suto", actionByNip: "7823411V", actionDate: "21/01/2026 09:10", status: "approved" },
      { role: "approved2", roleLabel: "TL ES (Approved 2)", actionByName: "Andi Prasetyo", actionByNip: "9112345W", actionDate: "21/01/2026 11:45", status: "approved" },
      { role: "approved3", roleLabel: "AMN ES (Approved 3)", actionByName: "Hendra Wijaya", actionByNip: "8876543A", actionDate: "21/01/2026 15:00", status: "approved" }
    ]
  }
];

export const ListDokumenPage = ({
  currentUser,
  submissions = [],
  selectedProject = "Semua Project",
  selectedUpt = "Semua UPT",
  selectedUltg = "Semua ULTG",
  selectedGi = "Semua GI",
  globalStartDate = "",
  globalEndDate = ""
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [downloadingId, setDownloadingId] = useState(null);
  const [serverDocuments, setServerDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState("");

  const loadDocuments = async () => {
    setIsLoadingDocuments(true);
    setDocumentsError("");
    try {
      const rows = await api.getCompletedDocuments({
        start_date: globalStartDate || undefined,
        end_date: globalEndDate || undefined
      });
      setServerDocuments((Array.isArray(rows) ? rows : []).map(mapWorkflowSubmission));
    } catch (error) {
      setServerDocuments([]);
      setDocumentsError(error.response?.data?.message || "Gagal mengambil daftar dokumen dari server.");
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  useEffect(() => {
    if (currentUser) loadDocuments();
  }, [currentUser?.id_user, globalStartDate, globalEndDate]);

  // Detail Modal State
  const [viewingDoc, setViewingDoc] = useState(null);

  // Group Collapsed State (Default: all expanded true)
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Fetch Master Data for Project and Jabatan matching
  const masterJabatans = useMemo(() => {
    try {
      return MasterDataService.getAll("m_jabatan", { limit: 1000 })?.data || [];
    } catch {
      return [];
    }
  }, []);

  const masterProjects = useMemo(() => {
    try {
      return MasterDataService.getAll("m_project", { limit: 1000 })?.data || [];
    } catch {
      return [];
    }
  }, []);

  const getDocProjectName = (doc, validUsers) => {
    if (doc.projectName) return doc.projectName;
    if (doc.nama_project) return doc.nama_project;
    if (doc.petugas?.jabatan?.project?.nama_project) return doc.petugas.jabatan.project.nama_project;
    const employee = (validUsers || []).find((u) => u.nip === doc.employeeNip);
    if (employee) {
      if (employee.multiProject && Array.isArray(employee.multiProject) && employee.multiProject.length > 0) {
        const firstProjId = employee.multiProject[0];
        const proj = masterProjects.find((p) => String(p.id_project) === String(firstProjId));
        if (proj) return proj.nama_project;
      }
      const matchedJab = masterJabatans.find(
        (j) => j.nama_jabatan?.toLowerCase() === (employee.jabatan || "").toLowerCase()
      );
      if (matchedJab) {
        const proj = masterProjects.find((p) => Number(p.id_project) === Number(matchedJab.id_project));
        if (proj) return proj.nama_project;
      }
    }
    const matchedJab = masterJabatans.find(
      (j) => j.nama_jabatan?.toLowerCase() === (doc.employeeJabatan || "").toLowerCase()
    );
    if (matchedJab) {
      const proj = masterProjects.find((p) => Number(p.id_project) === Number(matchedJab.id_project));
      if (proj) return proj.nama_project;
    }
    return masterProjects[0]?.nama_project || "SUTT 150kV JATENG DIY";
  };

  const getDocDateString = (doc) => {
    const raw =
      doc.tanggalPengajuan ||
      doc.tanggalLembur ||
      doc.tanggalMulai ||
      doc.tanggalBerangkat ||
      doc.tgl_lembur ||
      doc.tgl_mulai ||
      doc.tgl_berangkat ||
      doc.createdAt ||
      "";
    if (!raw) return "";
    return String(raw).split("T")[0];
  };

  // 1. Filter Approved Submissions
  const allApproved = useMemo(() => {
    return serverDocuments.filter((item) => String(item.status).toLowerCase() === "approved");
  }, [serverDocuments]);

  // 2. Filter by Project, Unit, Date Range, Category, and Search
  const filteredSubmissions = useMemo(() => {
    const validUsers = AuthService.getUsers() || [];

    return allApproved.filter((doc) => {
      // Category Filter
      if (selectedCategory !== "ALL" && doc.type !== selectedCategory) {
        return false;
      }

      // Project Filter
      if (selectedProject && selectedProject !== "Semua Project") {
        const docProject = getDocProjectName(doc, validUsers);
        if (docProject !== selectedProject) return false;
      }

      // Location Unit Filters (UPT, ULTG, GI)
      if (selectedUpt && selectedUpt !== "Semua UPT") {
        const docUpt = doc.unitUpt || doc.upt || "";
        if (docUpt && docUpt !== selectedUpt) return false;
      }
      if (selectedUltg && selectedUltg !== "Semua ULTG") {
        const docUltg = doc.unitUltg || doc.ultg || "";
        if (docUltg && docUltg !== selectedUltg) return false;
      }
      if (selectedGi && selectedGi !== "Semua GI") {
        const docGi = doc.garduInduk || doc.gi || "";
        if (docGi && docGi !== selectedGi) return false;
      }

      // Search Filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const docNo = (getFormattedDocNo(doc) || doc.docNo || "").toLowerCase();
        const name = (doc.employeeName || "").toLowerCase();
        const nip = (doc.employeeNip || "").toLowerCase();
        const typeStr = (doc.type || "").toLowerCase();
        const jabatan = (doc.employeeJabatan || "").toLowerCase();
        const docProj = (getDocProjectName(doc, validUsers) || "").toLowerCase();
        const upt = (doc.unitUpt || "").toLowerCase();
        const ultg = (doc.unitUltg || "").toLowerCase();
        const gi = (doc.garduInduk || "").toLowerCase();

        return (
          docNo.includes(q) ||
          name.includes(q) ||
          nip.includes(q) ||
          typeStr.includes(q) ||
          jabatan.includes(q) ||
          docProj.includes(q) ||
          upt.includes(q) ||
          ultg.includes(q) ||
          gi.includes(q)
        );
      }

      return true;
    });
  }, [
    allApproved,
    selectedCategory,
    selectedProject,
    selectedUpt,
    selectedUltg,
    selectedGi,
    searchQuery,
    currentUser,
    masterJabatans,
    masterProjects
  ]);

  // 3. Group by Category
  const CATEGORY_MAP = {
    cuti: { title: "Formulir Cuti & Ijin Kerja", icon: Palmtree, color: "text-emerald-700", bg: "bg-emerald-50/80" },
    lembur: { title: "Formulir Perintah Lembur", icon: Clock, color: "text-emerald-700", bg: "bg-emerald-50/80" },
    sppd: { title: "Formulir SPPD & Perjalanan Dinas", icon: Briefcase, color: "text-emerald-700", bg: "bg-emerald-50/80" },
    sakit: { title: "Formulir Sakit & SKD Dokter", icon: Stethoscope, color: "text-emerald-700", bg: "bg-emerald-50/80" },
    ijin: { title: "Formulir Izin / Dispensasi", icon: FileCheck2, color: "text-emerald-700", bg: "bg-emerald-50/80" }
  };

  const groupedSubmissions = useMemo(() => {
    const groups = {};
    filteredSubmissions.forEach((doc) => {
      const catKey = doc.type || "lainnya";
      if (!groups[catKey]) {
        groups[catKey] = [];
      }
      groups[catKey].push(doc);
    });
    return groups;
  }, [filteredSubmissions]);

  const toggleGroupCollapse = (catKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [catKey]: !prev[catKey]
    }));
  };

  // Download PDF Handler
  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc.id);
      await PdfService.downloadPdf(doc);
    } catch (err) {
      console.error("Gagal mengunduh PDF:", err);
      alert(err?.message || "Terjadi kesalahan saat membuat file PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Statistics
  const totalApprovedCount = filteredSubmissions.length;
  const countCuti = filteredSubmissions.filter((d) => d.type === "cuti").length;
  const countLembur = filteredSubmissions.filter((d) => d.type === "lembur").length;
  const countSppd = filteredSubmissions.filter((d) => d.type === "sppd").length;
  const countLainnya = filteredSubmissions.filter((d) => !["cuti", "lembur", "sppd"].includes(d.type)).length;

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl md:rounded-3xl p-5 md:p-7 text-white shadow-lg border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <FolderArchive className="w-3.5 h-3.5 text-emerald-300" />
              <span>Arsip Resmi Digital UP2</span>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>List Dokumen &amp; Arsip Approved</span>
            </h1>
            <p className="text-xs md:text-sm text-emerald-100 max-w-2xl font-medium leading-relaxed">
              Daftar seluruh formulir pengajuan (Cuti, Lembur, SPPD, Sakit, Ijin) yang telah menyelesaikan seluruh tahapan approval berjenjang (Status: <strong className="text-emerald-300 font-bold">APPROVED</strong>) dan terenkripsi secara sah.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-right hidden sm:block">
              <p className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">Total Dokumen Ready</p>
              <p className="text-2xl font-black text-white">{totalApprovedCount} <span className="text-xs font-normal text-emerald-200">Berkas</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Approved</p>
            <p className="text-lg font-black text-slate-800">{totalApprovedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Form Lembur</p>
            <p className="text-lg font-black text-slate-800">{countLembur}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Palmtree className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Form Cuti</p>
            <p className="text-lg font-black text-slate-800">{countCuti}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Form SPPD</p>
            <p className="text-lg font-black text-slate-800">{countSppd}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID Dokumen, Nama Pemohon, NIP, atau Jenis Form..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none font-medium text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kategori Form</option>
                <option value="cuti">Cuti Tahunan / Alasan Penting</option>
                <option value="lembur">Perintah Lembur</option>
                <option value="sppd">SPPD Perjalanan Dinas</option>
                <option value="sakit">Sakit / SKD Dokter</option>
                <option value="ijin">Ijin / Dispensasi</option>
              </select>
            </div>

            {(selectedCategory !== "ALL" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                title="Reset Semua Filter"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grouped Table View */}
      <div className="space-y-4">
        {isLoadingDocuments ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs">
            <Loader2 className="w-8 h-8 mx-auto text-emerald-600 animate-spin" />
            <p className="mt-3 text-xs font-bold text-slate-600">Mengambil dokumen selesai dari server...</p>
          </div>
        ) : documentsError ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-rose-200 shadow-2xs">
            <p className="text-sm font-bold text-rose-700">{documentsError}</p>
            <button onClick={loadDocuments} className="mt-3 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold disabled:opacity-50" disabled={isLoadingDocuments}>
              Coba Lagi
            </button>
          </div>
        ) : Object.keys(groupedSubmissions).length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FolderArchive className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Tidak ada dokumen yang ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ditemukan berkas approved yang cocok dengan kriteria pencarian atau filter kategori yang dipilih.
            </p>
          </div>
        ) : (
          Object.entries(groupedSubmissions).map(([catKey, items]) => {
            const catMeta = CATEGORY_MAP[catKey] || {
              title: `Formulir ${catKey.toUpperCase()}`,
              icon: FileText,
              color: "text-emerald-700",
              bg: "bg-emerald-50/80"
            };
            const IconGroup = catMeta.icon;
            const isCollapsed = collapsedGroups[catKey];

            return (
              <div key={catKey} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all">
                {/* Group Header (Emerald Accents, Collapsible Toggle) */}
                <button
                  onClick={() => toggleGroupCollapse(catKey)}
                  className="w-full px-4 md:px-5 py-3.5 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-slate-50 border-b border-emerald-100/80 flex items-center justify-between hover:bg-emerald-100/50 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                      <IconGroup className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs md:text-sm font-black text-emerald-950 uppercase tracking-wide flex items-center gap-2">
                        <span>{catMeta.title}</span>
                      </h3>
                      <p className="text-[10px] text-emerald-700/80 font-medium">
                        {items.length} Berkas Tersedia &amp; Siap Diunduh
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                      {items.length} Dokumen
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-emerald-700" />
                    )}
                  </div>
                </button>

                {/* Group Content (Table) */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4">ID Dokumen / No. Surat</th>
                          <th className="py-3 px-4">Pemohon</th>
                          <th className="py-3 px-4">Tanggal Pengajuan</th>
                          <th className="py-3 px-4">Detail Formulir</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right pr-6">Aksi (Maker &amp; User)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {items.map((doc, idx) => {
                          const formattedDocNo = getFormattedDocNo(doc);
                          const isDownloading = downloadingId === doc.id;

                          return (
                            <tr key={doc.id || idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                                {idx + 1}
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-mono font-black text-slate-900 text-xs flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{formattedDocNo}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Unit: {doc.unitUpt || "UP2"}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-900 leading-tight">{doc.employeeName}</p>
                                <p className="text-[10px] text-slate-500 font-mono">NIP: {doc.employeeNip || "-"}</p>
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-800">
                                  {formatDateIndonesian(doc.tanggalPengajuan || doc.createdAt)}
                                </span>
                              </td>

                              <td className="py-3 px-4 max-w-xs truncate">
                                {doc.type === "cuti" && (
                                  <div>
                                    <span className="font-bold text-slate-800">{doc.cutiType}</span>
                                    <p className="text-[10px] text-slate-500 truncate">{doc.jumlahHari} Hari Kerja</p>
                                  </div>
                                )}
                                {doc.type === "lembur" && (
                                  <div>
                                    <span className="font-bold text-slate-800">{doc.kategoriLembur}</span>
                                    <p className="text-[10px] text-slate-500 truncate">{doc.jenisPekerjaan || doc.kegiatanDetail || `${doc.durasiJam} Jam`}</p>
                                  </div>
                                )}
                                {doc.type === "sppd" && (
                                  <div>
                                    <span className="font-bold text-slate-800">{doc.kotaAsal} &rarr; {doc.kotaTujuan}</span>
                                    <p className="text-[10px] text-slate-500 truncate">{doc.maksudPerjalanan}</p>
                                  </div>
                                )}
                                {doc.type === "sakit" && (
                                  <div>
                                    <span className="font-bold text-slate-800">Izin Sakit ({doc.jumlahHari} Hari)</span>
                                    <p className="text-[10px] text-slate-500 truncate">{doc.instansiKlinik || doc.diagnosaSingkat || "SKD Dokter"}</p>
                                  </div>
                                )}
                                {doc.type === "ijin" && (
                                  <div>
                                    <span className="font-bold text-slate-800">{doc.ijinReasonType || "Izin Kerja"}</span>
                                    <p className="text-[10px] text-slate-500 truncate">{doc.keterangan || `${doc.jumlahHari} Hari`}</p>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>APPROVED</span>
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right pr-6">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Button Lihat Detail */}
                                  <button
                                    onClick={() => setViewingDoc(doc)}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                                    title="Pratinjau Dokumen & Matriks TTD"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                                    <span className="hidden sm:inline">Detail</span>
                                  </button>

                                  {/* Button Download PDF */}
                                  <button
                                    onClick={() => handleDownload(doc)}
                                    disabled={isDownloading}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                                    title="Unduh Salinan PDF Resmi"
                                  >
                                    <Download className={`w-3.5 h-3.5 ${isDownloading ? "animate-bounce" : ""}`} />
                                    <span>{isDownloading ? "Mengunduh..." : "Unduh"}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          isOpen={!!viewingDoc}
          submission={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
};

export default ListDokumenPage;
