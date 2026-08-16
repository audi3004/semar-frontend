import { useState, useEffect, Fragment } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { DataService } from "../services/dataService";
import { MasterDataService } from "../services/masterDataService";
import { AuthService } from "../services/authService";
import { api } from "../services/api";
import {
  mapWorkflowLembur,
  mapWorkflowCuti,
  mapWorkflowIjin,
  mapWorkflowSakit,
  mapWorkflowSppd
} from "../utils/workflowSubmissionMapper";
import { SignatureModal } from "../components/common/SignatureModal";
import { DocumentViewerModal } from "../components/common/DocumentViewerModal";
import { RejectModal } from "../components/common/RejectModal";
import { RevisionModal } from "../components/common/RevisionModal";
import { AlertNotificationModal } from "../components/common/AlertNotificationModal";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { WorkflowHistoryModal } from "../components/common/WorkflowHistoryModal";
import { motion, AnimatePresence } from "motion/react";
import {
  GitPullRequest,
  Check,
  X,
  Eye,
  Filter,
  Search,
  Building,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  HelpCircle,
  AlertTriangle,
  FileText,
  User,
  Activity,
  UserCheck,
  Award,
  CornerDownRight,
  ShieldCheck,
  FileCheck2,
  Calendar,
  Layers,
  FolderOpen,
  Briefcase,
  Trash2,
  Plus,
  Edit3,
  Save,
  RotateCcw,
  XCircle,
  Calculator,
  DollarSign,
  History
} from "lucide-react";
import {
  formatDateIndonesian,
  getStatusBadgeColor,
  getStatusLabel,
  getFormattedDocNo,
  formatRupiah
} from "../utils/formatters";
import { validateLemburMaxHours } from "../utils/submissionValidation";

// Route & Stage Mapping helpers
const STAGE_ROUTE_MAP = {
  all: "/workflow",
  maker: "/workflow/maker",
  checker: "/workflow/checker",
  verification: "/workflow/verification",
  approved1: "/workflow/approval-1",
  approved2: "/workflow/approval-2",
  approved3: "/workflow/approval-3"
};

const STAGE_LABEL_MAP = {
  all: "Semua",
  maker: "Maker",
  checker: "Checker",
  verification: "Verification",
  approved1: "Approval 1",
  approved2: "Approval 2",
  approved3: "Approval 3"
};

const getStageFromPath = (pathname) => {
  if (pathname.includes("/workflow/maker")) return "maker";
  if (pathname.includes("/workflow/checker")) return "checker";
  if (pathname.includes("/workflow/verification")) return "verification";
  if (pathname.includes("/workflow/approval-1")) return "approved1";
  if (pathname.includes("/workflow/approval-2")) return "approved2";
  if (pathname.includes("/workflow/approval-3")) return "approved3";
  return "all";
};

const WORKFLOW_API = {
  lembur: { approve: api.approveLembur, reject: api.rejectLembur, revise: api.reviseLembur, update: api.updateLembur },
  cuti: { approve: api.approveCuti, reject: api.rejectCuti, revise: api.reviseCuti, update: api.updateCuti },
  ijin: { approve: api.approveIjin, reject: api.rejectIjin, revise: api.reviseIjin, update: api.updateIjin },
  sakit: { approve: api.approveSakit, reject: api.rejectSakit, revise: api.reviseSakit, update: api.updateSakit },
  sppd: { approve: api.approveSppd, reject: api.rejectSppd, revise: api.reviseSppd, update: api.updateSppd }
};

const WORKFLOW_LOG_API = {
  lembur: api.getLemburLogs,
  cuti: api.getCutiLogs,
  ijin: api.getIjinLogs,
  sakit: api.getSakitLogs,
  sppd: api.getSppdLogs
};

const SIGNATURE_FIELDS = {
  maker: "maker_signature",
  checker: "checker_signature",
  verification: "verification_signature",
  approved1: "approval_1_signature",
  approved2: "approval_2_signature",
  approved3: "approval_3_signature"
};

const buildApprovalPayload = (dataUrl, role, extra = {}) => {
  const form = new FormData();
  const signatureField = SIGNATURE_FIELDS[role];
  if (dataUrl && signatureField) {
    const [header, encoded] = dataUrl.split(",");
    const mime = header.match(/data:(.*?);base64/)?.[1] || "image/png";
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    form.append(signatureField, new Blob([bytes], { type: mime }), `${signatureField}.png`);
  }
  const allowedExtra = {
    jumlahJamKoreksi: "jumlah_jam_koreksi",
    catatanKoreksi: "catatan_koreksi",
    jumlahHariDisetujui: "jumlah_hari_disetujui"
  };
  Object.entries(allowedExtra).forEach(([source, target]) => {
    if (extra[source] !== undefined && extra[source] !== null) form.append(target, extra[source]);
  });
  return form;
};

const getApiError = (error) =>
  error?.response?.data?.message || error?.message || "Terjadi kesalahan saat memproses workflow.";

const calculateCorrectedOvertimeCost = (submission, correctedHours) => {
  const effectiveHours = Number(submission.jumlahJamKoreksi ?? submission.durasiJam ?? 0);
  const storedCost = Number(submission.biayaLembur ?? submission.estimasiBiayaRupiah ?? 0);
  if (effectiveHours <= 0 || storedCost <= 0) return 0;
  return (storedCost / effectiveHours) * Number(correctedHours || 0);
};

const mapSppdExpensesPayload = (expenses = []) => {
  const grouped = {
    transportasi: expenses.filter((item) => item.kategori === "Transportasi"),
    akomodasi: expenses.filter((item) => item.kategori === "Akomodasi"),
    lain_lain: expenses.filter((item) => ["Uang Harian", "Lain-lain"].includes(item.kategori))
  };
  const description = (items) => {
    const value = items.map((item) => String(item.deskripsi || "").trim()).filter(Boolean).join("; ");
    return value || null;
  };
  const nominal = (items) => items.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

  return {
    rp_transportasi: nominal(grouped.transportasi),
    desc_transportasi: description(grouped.transportasi),
    rp_akomodasi: nominal(grouped.akomodasi),
    desc_akomodasi: description(grouped.akomodasi),
    rp_lain_lain: nominal(grouped.lain_lain),
    desc_lain_lain: description(grouped.lain_lain)
  };
};

const mapCheckerEditPayload = (type, data) => {
  if (type === "lembur") return {
    tgl_lembur: data.tanggalLembur, jam_mulai: data.jamMulai, jam_selesai: data.jamSelesai,
    kategori_lembur: data.kategoriLembur, jenis_pekerjaan: data.jenisPekerjaan,
    detail_pekerjaan_lembur: data.detailKegiatan, jumlah_jam_koreksi: data.jumlahJamKoreksi,
    catatan_koreksi: data.catatanKoreksi, keterangan: data.keterangan
  };
  if (type === "cuti") return {
    jenis_cuti: data.cutiType, tgl_mulai: data.tanggalMulai, tgl_selesai: data.tanggalSelesai,
    contact_alamat: data.alamatSelamaCuti, nomor_telepon_darurat: data.nomorTeleponDarurat,
    perihal: data.keterangan
  };
  if (type === "ijin") return {
    agenda: data.ijinReasonType || data.alasanIjin, tanggal: data.tanggalMulai,
    tgl_selesai: data.tanggalSelesai, jumlah_hari_disetujui: data.jumlahHariDisetujui,
    keterangan: data.keterangan
  };
  if (type === "sakit") return {
    tanggal: data.tanggalMulai, tgl_selesai: data.tanggalSelesai,
    agenda: data.instansiKlinik || data.diagnosaSingkat, nama_dokter: data.namaDokter,
    keterangan: data.diagnosaSingkat
  };
  if (type === "sppd") {
    return {
      ...(data.maksudPerjalanan !== undefined && { maksud_dinas: data.maksudPerjalanan }),
      ...(data.kotaAsal !== undefined && { kota_asal: data.kotaAsal }),
      ...(data.kotaTujuan !== undefined && { kota_tujuan: data.kotaTujuan }),
      ...(data.tanggalBerangkat !== undefined && { tgl_berangkat: data.tanggalBerangkat }),
      ...(data.tanggalKembali !== undefined && { tgl_kembali: data.tanggalKembali }),
      ...mapSppdExpensesPayload(data.expenses)
    };
  }
  return {};
};

const ActionIconButton = ({ label, children, className = "", ...props }) => (
  <button
    {...props}
    aria-label={label}
    className={`group relative h-8 w-8 overflow-visible rounded-lg inline-flex items-center justify-center transition active:scale-95 ${className}`}
  >
    {children}
    <span className="pointer-events-none absolute right-full mr-2 z-30 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100">
      {label}
    </span>
  </button>
);

// Helper to get employee origin (TAD, PLN, PLN ES) based on the user properties
const getEmployeeOrigin = (sub, allUsers = []) => {
  // If explicitly defined on submission, prioritize it
  if (sub.asalPegawai) return sub.asalPegawai;
  if (sub.employeeAsalPegawai) return sub.employeeAsalPegawai;

  const user = allUsers.find((u) => u.nip === sub.employeeNip);
  if (user) {
    if (user.email?.endsWith("@pln-es.co.id") || user.role === "approved2" || user.role === "approved3") {
      return "PLN ES";
    }
    if (user.role === "maker") {
      return "TAD";
    }
    return "PLN";
  }

  // Heuristics based on NIP
  const nip = sub.employeeNip || "";
  if (nip === "9112345W" || nip === "8876543A") return "PLN ES"; // Andi, Hendra
  if (nip === "8534567X" || nip === "8112344W" || nip === "7823411V" || nip === "9999999ADM") return "PLN"; // Ahmad, Rahmat, Bambang, Admin
  
  return "TAD"; // Default is TAD for Makers
};

const getProjectIdForSub = (sub, allUsers = []) => {
  const employee = (allUsers || []).find((u) => u.nip === sub.employeeNip);
  if (employee) {
    if (employee.multiProject && Array.isArray(employee.multiProject) && employee.multiProject.length > 0) {
      return String(employee.multiProject[0]);
    }
  }
  return "1"; // Default project ID
};

// Helper for Asal Pegawai badges
const renderOriginBadge = (origin) => {
  switch (origin) {
    case "TAD":
      return (
        <span className="px-2.5 py-1 text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full shrink-0 tracking-wider">
          TAD
        </span>
      );
    case "PLN":
      return (
        <span className="px-2.5 py-1 text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200 rounded-full shrink-0 tracking-wider">
          PLN
        </span>
      );
    case "PLN ES":
      return (
        <span className="px-2.5 py-1 text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shrink-0 tracking-wider">
          PLN ES
        </span>
      );
    default:
      return null;
  }
};

export const WorkflowPage = ({ currentUser: propCurrentUser, onRefreshData: propOnRefreshData, initialStage }) => {
  const context = useOutletContext() || {};
  const currentUser = propCurrentUser || context.currentUser;
  const onRefreshData = propOnRefreshData || context.onRefreshData;

  const selectedProject = context.selectedProject || "Semua Project";
  const selectedUp = context.selectedUp || "Semua UP";
  const selectedUpt = context.selectedUpt || "Semua UPT";
  const selectedUltg = context.selectedUltg || "Semua ULTG";
  const selectedGi = context.selectedGi || "Semua GI";
  const startDate = context.startDate;
  const endDate = context.endDate;
  const navbarScope = context.navbarScope || {};

  const location = useLocation();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [masterJabatans, setMasterJabatans] = useState([]);
  const [masterProjects, setMasterProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || "");
  const [activeStageTab, setActiveStageTab] = useState(() => {
    const stageFromPath = getStageFromPath(location.pathname);
    if (stageFromPath !== "all") return stageFromPath;
    if (initialStage) return initialStage;
    if (currentUser?.role && STAGE_ROUTE_MAP[currentUser.role] && currentUser.role !== "admin") {
      return currentUser.role;
    }
    return "all";
  }); // 'all', 'maker', 'checker', 'verification', 'approved1', 'approved2', 'approved3'
  const [selectedOriginFilter, setSelectedOriginFilter] = useState("all"); // 'all', 'TAD', 'PLN', 'PLN ES'
  const [statusCardFilter, setStatusCardFilter] = useState("all"); // 'all', 'pending', 'approved', 'rejected'
  
  // State for Form Group Expand/Collapse (Lembur, Cuti, Ijin, Sakit, SPPD)
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    const activeType = location.state?.typeFilter;
    return {
      lembur: Boolean(activeType && activeType !== "lembur"),
      cuti: Boolean(activeType && activeType !== "cuti"),
      ijin: Boolean(activeType && activeType !== "ijin"),
      sakit: Boolean(activeType && activeType !== "sakit"),
      sppd: Boolean(activeType && activeType !== "sppd")
    };
  });

  // State for Individual Submission Table Row Expand/Collapse (Stepper Stepper Details)
  const [expandedRows, setExpandedRows] = useState({});

  const isRowExpanded = (subId, isActiveUserTurn) => {
    if (expandedRows[subId] !== undefined) {
      return expandedRows[subId];
    }
    return isActiveUserTurn;
  };

  const toggleRowExpand = (subId, isActiveUserTurn) => {
    const current = isRowExpanded(subId, isActiveUserTurn);
    setExpandedRows((prev) => ({
      ...prev,
      [subId]: !current
    }));
  };

  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const expandAllGroups = () => {
    setCollapsedGroups({
      lembur: false,
      cuti: false,
      ijin: false,
      sakit: false,
      sppd: false
    });
  };

  const collapseAllGroups = () => {
    setCollapsedGroups({
      lembur: true,
      cuti: true,
      ijin: true,
      sakit: true,
      sppd: true
    });
  };

  // Navbar transaction changes only accordion visibility. Transaction rows stay
  // loaded in submissions and are not repurposed as a search filter.
  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
    }

    if (location.state?.typeFilter) {
      const typeFilter = location.state.typeFilter;
      setCollapsedGroups({
        lembur: typeFilter !== "lembur",
        cuti: typeFilter !== "cuti",
        ijin: typeFilter !== "ijin",
        sakit: typeFilter !== "sakit",
        sppd: typeFilter !== "sppd"
      });

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document
            .getElementById(`workflow-form-${typeFilter}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }
  }, [location.state]);

  // Task 3: Sync activeStageTab with URL pathname or default to user's role landing page
  useEffect(() => {
    const stageFromPath = getStageFromPath(location.pathname);
    if (stageFromPath !== "all") {
      setActiveStageTab(stageFromPath);
    } else if (initialStage) {
      setActiveStageTab(initialStage);
    } else if (currentUser?.role && STAGE_ROUTE_MAP[currentUser.role] && currentUser.role !== "admin") {
      setActiveStageTab(currentUser.role);
    } else {
      setActiveStageTab("all");
    }
  }, [location.pathname, initialStage, currentUser?.role]);

  // Handler to navigate when sub-tabs are clicked
  const handleTabClick = (tabId) => {
    setActiveStageTab(tabId);
    const targetRoute = STAGE_ROUTE_MAP[tabId] || "/workflow";
    if (location.pathname !== targetRoute) {
      navigate(targetRoute, { state: location.state });
    }
  };

  // Modals state
  const [selectedDocSub, setSelectedDocSub] = useState(null);
  const [selectedHistorySub, setSelectedHistorySub] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  
  // Rejection modal
  const [rejectSub, setRejectSub] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Revision / Request Revision modal
  const [reviseSub, setReviseSub] = useState(null);
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [revisionError, setRevisionError] = useState("");

  // Approval Signature modal
  const [approveSub, setApproveSub] = useState(null);
  const [isApproveSignOpen, setIsApproveSignOpen] = useState(false);
  const [selectedApprovalKeys, setSelectedApprovalKeys] = useState([]);
  const [isBulkApproval, setIsBulkApproval] = useState(false);

  // Checker Expense Management (SPPD Task)
  const [checkerExpenses, setCheckerExpenses] = useState([]);
  const [isCheckerSppdModalOpen, setIsCheckerSppdModalOpen] = useState(false);

  // Checker Lembur Correction Management
  const [checkerLemburSub, setCheckerLemburSub] = useState(null);
  const [isCheckerLemburModalOpen, setIsCheckerLemburModalOpen] = useState(false);
  const [jumlahJamKoreksiInput, setJumlahJamKoreksiInput] = useState("");
  const [catatanKoreksiInput, setCatatanKoreksiInput] = useState("");
  const [checkerExtraData, setCheckerExtraData] = useState({});

  // Cuti Checker States
  const [isCheckerCutiModalOpen, setIsCheckerCutiModalOpen] = useState(false);
  const [checkerCutiSub, setCheckerCutiSub] = useState(null);
  const [checkerCutiType, setCheckerCutiType] = useState("Cuti Tahunan");
  const [checkerCutiTanggalMulai, setCheckerCutiTanggalMulai] = useState("");
  const [checkerCutiTanggalSelesai, setCheckerCutiTanggalSelesai] = useState("");
  const [checkerCutiJumlahHari, setCheckerCutiJumlahHari] = useState(0);
  const [checkerCutiAlamat, setCheckerCutiAlamat] = useState("");
  const [checkerCutiTelepon, setCheckerCutiTelepon] = useState("");
  const [checkerCutiKeterangan, setCheckerCutiKeterangan] = useState("");

  // Ijin Checker States
  const [isCheckerIjinModalOpen, setIsCheckerIjinModalOpen] = useState(false);
  const [checkerIjinSub, setCheckerIjinSub] = useState(null);
  const [checkerIjinType, setCheckerIjinType] = useState("Ijin Resmi");
  const [checkerIjinTanggalMulai, setCheckerIjinTanggalMulai] = useState("");
  const [checkerIjinTanggalSelesai, setCheckerIjinTanggalSelesai] = useState("");
  const [checkerIjinJumlahHari, setCheckerIjinJumlahHari] = useState(0);
  const [checkerIjinKeterangan, setCheckerIjinKeterangan] = useState("");

  // Sakit Checker States
  const [isCheckerSakitModalOpen, setIsCheckerSakitModalOpen] = useState(false);
  const [checkerSakitSub, setCheckerSakitSub] = useState(null);
  const [checkerSakitTanggalMulai, setCheckerSakitTanggalMulai] = useState("");
  const [checkerSakitTanggalSelesai, setCheckerSakitTanggalSelesai] = useState("");
  const [checkerSakitJumlahHari, setCheckerSakitJumlahHari] = useState(0);
  const [checkerSakitKlinik, setCheckerSakitKlinik] = useState("");
  const [checkerSakitDokter, setCheckerSakitDokter] = useState("");
  const [checkerSakitDiagnosa, setCheckerSakitDiagnosa] = useState("");

  // Lembur Checker Extra States
  const [checkerLemburTanggalLembur, setCheckerLemburTanggalLembur] = useState("");
  const [checkerLemburJamMulai, setCheckerLemburJamMulai] = useState("");
  const [checkerLemburJamSelesai, setCheckerLemburJamSelesai] = useState("");
  const [checkerLemburKategoriLembur, setCheckerLemburKategoriLembur] = useState("");
  const [checkerLemburJenisPekerjaan, setCheckerLemburJenisPekerjaan] = useState("");
  const [checkerLemburDetailKegiatan, setCheckerLemburDetailKegiatan] = useState("");

  // SPPD Checker Extra States
  const [isCheckerSppdEditOpen, setIsCheckerSppdEditOpen] = useState(false);
  const [checkerSppdSub, setCheckerSppdSub] = useState(null);
  const [checkerSppdMaksud, setCheckerSppdMaksud] = useState("");
  const [checkerSppdKotaAsal, setCheckerSppdKotaAsal] = useState("");
  const [checkerSppdKotaTujuan, setCheckerSppdKotaTujuan] = useState("");
  const [checkerSppdTanggalBerangkat, setCheckerSppdTanggalBerangkat] = useState("");
  const [checkerSppdTanggalKembali, setCheckerSppdTanggalKembali] = useState("");
  const [checkerSppdDurasiHari, setCheckerSppdDurasiHari] = useState(1);
  const [checkerSppdKategori, setCheckerSppdKategori] = useState("");

  // Auto duration calculations for Checker
  useEffect(() => {
    if (checkerCutiTanggalMulai && checkerCutiTanggalSelesai) {
      const start = new Date(checkerCutiTanggalMulai);
      const end = new Date(checkerCutiTanggalSelesai);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 3600 * 24)) + 1);
        setCheckerCutiJumlahHari((prev) => prev !== diffDays ? diffDays : prev);
      }
    }
  }, [checkerCutiTanggalMulai, checkerCutiTanggalSelesai]);

  useEffect(() => {
    if (checkerIjinTanggalMulai && checkerIjinTanggalSelesai) {
      const start = new Date(checkerIjinTanggalMulai);
      const end = new Date(checkerIjinTanggalSelesai);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 3600 * 24)) + 1);
        setCheckerIjinJumlahHari((prev) => prev !== diffDays ? diffDays : prev);
      }
    }
  }, [checkerIjinTanggalMulai, checkerIjinTanggalSelesai]);

  useEffect(() => {
    if (checkerSakitTanggalMulai && checkerSakitTanggalSelesai) {
      const start = new Date(checkerSakitTanggalMulai);
      const end = new Date(checkerSakitTanggalSelesai);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 3600 * 24)) + 1);
        setCheckerSakitJumlahHari((prev) => prev !== diffDays ? diffDays : prev);
      }
    }
  }, [checkerSakitTanggalMulai, checkerSakitTanggalSelesai]);

  useEffect(() => {
    if (checkerSppdTanggalBerangkat && checkerSppdTanggalKembali) {
      const start = new Date(checkerSppdTanggalBerangkat);
      const end = new Date(checkerSppdTanggalKembali);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 3600 * 24)) + 1);
        setCheckerSppdDurasiHari((prev) => prev !== diffDays ? diffDays : prev);
      }
    }
  }, [checkerSppdTanggalBerangkat, checkerSppdTanggalKembali]);

  const calculateLemburHours = (mulai, selesai) => {
    if (!mulai || !selesai) return 0;
    const [hM, mM] = mulai.split(":").map(Number);
    const [hS, mS] = selesai.split(":").map(Number);
    if (isNaN(hM) || isNaN(mM) || isNaN(hS) || isNaN(mS)) return 0;
    let diffMin = (hS * 60 + mS) - (hM * 60 + mM);
    if (diffMin < 0) diffMin += 24 * 60;
    return parseFloat((diffMin / 60).toFixed(1));
  };

  useEffect(() => {
    if (checkerLemburJamMulai && checkerLemburJamSelesai) {
      const calculated = calculateLemburHours(checkerLemburJamMulai, checkerLemburJamSelesai);
      setJumlahJamKoreksiInput((prev) => prev !== calculated ? calculated : prev);
    }
  }, [checkerLemburJamMulai, checkerLemburJamSelesai]);

  // Approver 2 Expense Nominal Management
  const [approver2Expenses, setApprover2Expenses] = useState([]);
  const [isApprover2SppdModalOpen, setIsApprover2SppdModalOpen] = useState(false);

  // Alert Modal
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: "info", title: "", message: "" });

  const loadData = async () => {
    setAllUsers(AuthService.getUsers() || []);
    try {
      setMasterJabatans(MasterDataService.getAll("m_jabatan", { limit: 1000 })?.data || []);
      setMasterProjects(MasterDataService.getAll("m_project", { limit: 1000 })?.data || []);
    } catch (err) {
      console.error("Failed to load master data in WorkflowPage:", err);
    }

    try {
      const [lembur, cuti, ijin, sakit, sppd] = await Promise.all([
        api.getPendingLembur(),
        api.getPendingCuti(),
        api.getPendingIjin(),
        api.getPendingSakit(),
        api.getPendingSppd()
      ]);

      setSubmissions([
        ...(Array.isArray(lembur) ? lembur : []).map(mapWorkflowLembur),
        ...(Array.isArray(cuti) ? cuti : []).map(mapWorkflowCuti),
        ...(Array.isArray(ijin) ? ijin : []).map(mapWorkflowIjin),
        ...(Array.isArray(sakit) ? sakit : []).map(mapWorkflowSakit),
        ...(Array.isArray(sppd) ? sppd : []).map(mapWorkflowSppd)
      ]);
    } catch (error) {
      console.error("Failed to load scoped workflow transactions:", error);
      setSubmissions([]);
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Memuat Transaksi Workflow",
        message: error?.response?.data?.message || error.message || "Data transaksi sesuai unit-role tidak dapat dimuat."
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id_user, currentUser?.id_role]);

  const handleRefresh = async () => {
    if (onRefreshData) await onRefreshData();
    await loadData();
  };

  const handleOpenHistory = async (sub) => {
    const getLogs = WORKFLOW_LOG_API[sub.type];
    setSelectedHistorySub({ ...sub, workflowHistory: [] });
    setIsHistoryLoading(true);
    try {
      if (!getLogs) throw new Error(`Endpoint log untuk ${sub.type} tidak tersedia`);
      const logs = await getLogs(sub.id);
      setSelectedHistorySub((current) => current?.id === sub.id
        ? { ...current, workflowHistory: Array.isArray(logs) ? logs : [] }
        : current);
    } catch (error) {
      setSelectedHistorySub((current) => current?.id === sub.id
        ? { ...current, workflowHistory: sub.workflowHistory || [] }
        : current);
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Memuat History Log",
        message: getApiError(error)
      });
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Helper functions for project and date resolution inside WorkflowPage
  const getProjectIdForSubmission = (sub, usersList = [], jabatans = []) => {
    const employee = (usersList || []).find((u) => u.nip === sub.employeeNip);
    if (employee) {
      const matchedJab = (jabatans || []).find(
        (j) => j.nama_jabatan?.toLowerCase() === (employee.jabatan || "").toLowerCase()
      );
      if (matchedJab) {
        return String(matchedJab.id_project);
      }
    }
    const matchedJab = (jabatans || []).find(
      (j) => j.nama_jabatan?.toLowerCase() === (sub.employeeJabatan || "").toLowerCase()
    );
    if (matchedJab) {
      return String(matchedJab.id_project);
    }
    return "1";
  };

  const getProjectNameForSubmission = (sub, usersList = [], jabatans = [], projects = []) => {
    const employee = (usersList || []).find((u) => u.nip === sub.employeeNip);
    if (employee) {
      if (employee.multiProject && Array.isArray(employee.multiProject) && employee.multiProject.length > 0) {
        const firstProjId = employee.multiProject[0];
        const proj = (projects || []).find((p) => String(p.id_project) === String(firstProjId));
        if (proj) return proj.nama_project;
      }
      const matchedJab = (jabatans || []).find(
        (j) => j.nama_jabatan?.toLowerCase() === (employee.jabatan || "").toLowerCase()
      );
      if (matchedJab) {
        const proj = (projects || []).find((p) => Number(p.id_project) === Number(matchedJab.id_project));
        if (proj) return proj.nama_project;
      }
    }
    const matchedJab = (jabatans || []).find(
      (j) => j.nama_jabatan?.toLowerCase() === (sub.employeeJabatan || "").toLowerCase()
    );
    if (matchedJab) {
      const proj = (projects || []).find((p) => Number(p.id_project) === Number(matchedJab.id_project));
      if (proj) return proj.nama_project;
    }
    return (projects && projects[0]?.nama_project) || "Operator Gardu Induk";
  };

  // Base filtered submissions respecting global header selections and user role-based restrictions
  const baseFilteredSubmissions = submissions.filter((sub) => {
    const usesBackendApprovalScope = [
      "checker",
      "verification",
      "approved1",
      "approved2",
      "approved3"
    ].includes(currentUser?.role);

    // `/pending` is already authoritative for approver role + UnitRole scope.
    // Rechecking it here previously removed valid API rows when local profile/
    // assignment metadata had not finished loading or used a different shape.

    // Role & Unit Scope Filter according to user login
    if (currentUser?.role === "maker") {
      const isMySub =
        (sub.employeeNip && sub.employeeNip === currentUser.nip) ||
        (sub.employeeName && sub.employeeName === currentUser.name) ||
        (sub.createdBy && sub.createdBy === currentUser.id);
      if (!isMySub) return false;
    }

    // 2. Global "Pilih Project" filter from header
    if (!navbarScope.isAdministrator && navbarScope.allowedProjectIds?.length) {
      const subProjectId = Number(getProjectIdForSubmission(sub, allUsers, masterJabatans));
      if (!navbarScope.allowedProjectIds.includes(subProjectId)) return false;
    } else if (!navbarScope.allowedProjectIds && selectedProject && selectedProject !== "Semua Project") {
      const subProject = getProjectNameForSubmission(sub, allUsers, masterJabatans, masterProjects);
      if (subProject !== selectedProject) return false;
    }

    // 3. Global unit filters from header
    const emp = (allUsers || []).find((u) => u.nip === sub.employeeNip);
    const submissionUnitId = Number(sub.id_unit || emp?.id_unit || emp?.petugas?.id_unit || 0);
    const hasSpecificUnitFilter = [selectedUp, selectedUpt, selectedUltg, selectedGi]
      .some((value) => value && !value.startsWith("Semua "));
    if ((!navbarScope.isAdministrator || hasSpecificUnitFilter) && navbarScope.activeFilterUnitIds?.length) {
      if (!submissionUnitId || !navbarScope.activeFilterUnitIds.includes(submissionUnitId)) return false;
    }

    const transactionDate = sub.tanggalLembur || sub.tanggalMulai || sub.tanggalBerangkat || sub.tanggalPengajuan || "";
    if (startDate && transactionDate && transactionDate < startDate) return false;
    if (endDate && transactionDate && transactionDate > endDate) return false;

    return true;
  });

  // Final filtered list including stage tabs, search queries, origin filters, and card filters
  const filteredSubmissions = baseFilteredSubmissions.filter((sub) => {
    // 1. Stage Tab Filter
    if (activeStageTab !== "all") {
      if (activeStageTab === "maker") {
        const statusLower = sub.status ? sub.status.toLowerCase() : "";
        const isMakerStage =
          sub.currentApproverRole === "maker" ||
          statusLower === "revision" ||
          statusLower === "revision_required" ||
          statusLower === "rejected" ||
          statusLower === "draft";
        if (!isMakerStage) return false;
      } else {
        if (sub.currentApproverRole !== activeStageTab) return false;
      }
    }

    // 2. Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (sub.employeeName || "").toLowerCase().includes(q);
      const matchNip = (sub.employeeNip || "").toLowerCase().includes(q);
      const matchDocNo = getFormattedDocNo(sub).toLowerCase().includes(q) || (sub.nomorDokumen || "").toLowerCase().includes(q);
      const matchType = (sub.type || "").toLowerCase().includes(q);
      const matchDesc = (sub.keterangan || "").toLowerCase().includes(q);
      if (!matchName && !matchNip && !matchDocNo && !matchType && !matchDesc) {
        return false;
      }
    }

    // 3. Asal Pegawai Filter
    if (selectedOriginFilter !== "all") {
      const origin = getEmployeeOrigin(sub, allUsers);
      if (origin !== selectedOriginFilter) return false;
    }

    // 4. Status Card Click Filter
    if (statusCardFilter !== "all") {
      const statusLower = sub.status ? sub.status.toLowerCase() : "";
      if (statusCardFilter === "pending") {
        if (!statusLower.startsWith("pending_")) return false;
      } else if (statusCardFilter === "approved") {
        if (statusLower !== "approved") return false;
      } else if (statusCardFilter === "rejected") {
        if (
          statusLower !== "revision" &&
          statusLower !== "revision_required" &&
          statusLower !== "rejected"
        )
          return false;
      }
    }

    return true;
  });

  // Stage submissions for counts (base submissions matched with current tab)
  const stageSubmissions = baseFilteredSubmissions.filter((sub) => {
    if (activeStageTab === "all") return true;
    if (activeStageTab === "maker") {
      const statusLower = sub.status ? sub.status.toLowerCase() : "";
      return (
        sub.currentApproverRole === "maker" ||
        statusLower === "revision" ||
        statusLower === "revision_required" ||
        statusLower === "rejected" ||
        statusLower === "draft"
      );
    }
    return sub.currentApproverRole === activeStageTab;
  });

  const totalStageCount = stageSubmissions.length;
  const pendingStageCount = stageSubmissions.filter(
    (s) => s.status && s.status.toLowerCase().startsWith("pending_")
  ).length;
  const approvedTotalCount = baseFilteredSubmissions.filter(
    (s) => s.status && s.status.toLowerCase() === "approved"
  ).length;
  const rejectedTotalCount = baseFilteredSubmissions.filter((s) => {
    const sLower = s.status ? s.status.toLowerCase() : "";
    return (
      sLower === "revision" ||
      sLower === "revision_required" ||
      sLower === "rejected"
    );
  }).length;

  const currentStageTitle = STAGE_LABEL_MAP[activeStageTab] || "Semua Peran";

  if (!currentUser) return <LoadingSkeleton variant="dashboard" />;

  // Action handlers
  const handleOpenCheckerLemburModal = (sub) => {
    setCheckerLemburSub(sub);
    const initialHours =
      sub.jumlahJamKoreksi !== undefined && sub.jumlahJamKoreksi !== null
        ? sub.jumlahJamKoreksi
        : sub.durasiJam;
    setJumlahJamKoreksiInput(initialHours);
    setCatatanKoreksiInput(sub.catatanKoreksi || "");
    
    // Populate other lembur fields
    setCheckerLemburTanggalLembur(sub.tanggalLembur || "");
    setCheckerLemburJamMulai(sub.jamMulai || "");
    setCheckerLemburJamSelesai(sub.jamSelesai || "");
    setCheckerLemburKategoriLembur(sub.kategoriLembur || "");
    setCheckerLemburJenisPekerjaan(sub.jenisPekerjaan || "");
    setCheckerLemburDetailKegiatan(sub.detailKegiatan || "");
    
    setIsCheckerLemburModalOpen(true);
  };

  const handleOpenCheckerCutiModal = (sub) => {
    setCheckerCutiSub(sub);
    setCheckerCutiType(sub.cutiType || "Cuti Tahunan");
    setCheckerCutiTanggalMulai(sub.tanggalMulai || "");
    setCheckerCutiTanggalSelesai(sub.tanggalSelesai || "");
    setCheckerCutiJumlahHari(sub.jumlahHari || 0);
    setCheckerCutiAlamat(sub.alamatSelamaCuti || "");
    setCheckerCutiTelepon(sub.nomorTeleponDarurat || "");
    setCheckerCutiKeterangan(sub.keterangan || "");
    setIsCheckerCutiModalOpen(true);
  };

  const handleOpenCheckerIjinModal = (sub) => {
    setCheckerIjinSub(sub);
    setCheckerIjinType(sub.ijinReasonType || sub.alasanIjin || "Ijin Resmi");
    setCheckerIjinTanggalMulai(sub.tanggalMulai || "");
    setCheckerIjinTanggalSelesai(sub.tanggalSelesai || "");
    setCheckerIjinJumlahHari(sub.jumlahHari || 0);
    setCheckerIjinKeterangan(sub.keterangan || "");
    setIsCheckerIjinModalOpen(true);
  };

  const handleOpenCheckerSakitModal = (sub) => {
    setCheckerSakitSub(sub);
    setCheckerSakitTanggalMulai(sub.tanggalMulai || "");
    setCheckerSakitTanggalSelesai(sub.tanggalSelesai || "");
    setCheckerSakitJumlahHari(sub.jumlahHari || 0);
    setCheckerSakitKlinik(sub.instansiKlinik || "");
    setCheckerSakitDokter(sub.namaDokter || "");
    setCheckerSakitDiagnosa(sub.diagnosaSingkat || "");
    setIsCheckerSakitModalOpen(true);
  };

  const handleOpenCheckerSppdEditModal = (sub) => {
    setCheckerSppdSub(sub);
    setApproveSub(sub);
    setCheckerSppdMaksud(sub.maksudPerjalanan || "");
    setCheckerSppdKotaAsal(sub.kotaAsal || "");
    setCheckerSppdKotaTujuan(sub.kotaTujuan || "");
    setCheckerSppdTanggalBerangkat(sub.tanggalBerangkat || "");
    setCheckerSppdTanggalKembali(sub.tanggalKembali || "");
    setCheckerSppdDurasiHari(sub.durasiHari || 1);
    setCheckerSppdKategori(sub.kategoriSppd || "Dalam Wilayah");
    setCheckerExpenses(
      sub.expenses && sub.expenses.length > 0
        ? sub.expenses.map((e) => ({ ...e }))
        : [
            { id: "exp-1", deskripsi: "Biaya Transportasi Perjalanan Dinas", kategori: "Transportasi", nominal: 0 },
            { id: "exp-2", deskripsi: "Uang Harian Perjalanan Dinas", kategori: "Uang Harian", nominal: 0 },
            { id: "exp-3", deskripsi: "Biaya Penginapan / Hotel", kategori: "Akomodasi", nominal: 0 }
          ]
    );
    setIsCheckerSppdEditOpen(true);
  };

  const handleSaveCheckerCuti = async (e) => {
    if (e) e.preventDefault();
    if (!checkerCutiSub) return;

    const start = new Date(checkerCutiTanggalMulai);
    const end = new Date(checkerCutiTanggalSelesai);
    let calculatedDays = checkerCutiJumlahHari;
    if (checkerCutiTanggalMulai && checkerCutiTanggalSelesai && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffTime = end.getTime() - start.getTime();
      calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)) + 1);
    }

    const updatedFields = {
      cutiType: checkerCutiType,
      tanggalMulai: checkerCutiTanggalMulai,
      tanggalSelesai: checkerCutiTanggalSelesai,
      jumlahHari: calculatedDays,
      alamatSelamaCuti: checkerCutiAlamat,
      nomorTeleponDarurat: checkerCutiTelepon,
      keterangan: checkerCutiKeterangan,
      sisaCutiSesudahnya: (checkerCutiSub.sisaCutiSebelumnya || 12) - calculatedDays,
    };

    try {
      await WORKFLOW_API.cuti.update(checkerCutiSub.id, mapCheckerEditPayload("cuti", updatedFields));
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Koreksi Cuti Gagal", message: getApiError(error) });
      return;
    }
    setIsCheckerCutiModalOpen(false);
    setAlertModal({
      isOpen: true,
      type: "success",
      title: "Draft Koreksi Cuti Berhasil Disimpan",
      message: `Data draft koreksi pengajuan cuti untuk dokumen ${getFormattedDocNo(checkerCutiSub)} berhasil disimpan sebagai draft. Pengajuan belum dikirim ke Approval 1.`
    });
    handleRefresh();
  };

  const handleApproveWithCheckerCutiCorrection = () => {
    if (!checkerCutiSub) return;

    const start = new Date(checkerCutiTanggalMulai);
    const end = new Date(checkerCutiTanggalSelesai);
    let calculatedDays = checkerCutiJumlahHari;
    if (checkerCutiTanggalMulai && checkerCutiTanggalSelesai && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffTime = end.getTime() - start.getTime();
      calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)) + 1);
    }

    const updatedFields = {
      cutiType: checkerCutiType,
      tanggalMulai: checkerCutiTanggalMulai,
      tanggalSelesai: checkerCutiTanggalSelesai,
      jumlahHari: calculatedDays,
      alamatSelamaCuti: checkerCutiAlamat,
      nomorTeleponDarurat: checkerCutiTelepon,
      keterangan: checkerCutiKeterangan,
      sisaCutiSesudahnya: (checkerCutiSub.sisaCutiSebelumnya || 12) - calculatedDays,
    };

    setApproveSub(checkerCutiSub);
    setCheckerExtraData(updatedFields);
    setIsCheckerCutiModalOpen(false);
    setIsApproveSignOpen(true);
  };

  const handleSaveCheckerIjin = async (e) => {
    if (e) e.preventDefault();
    if (!checkerIjinSub) return;

    const start = new Date(checkerIjinTanggalMulai);
    const end = new Date(checkerIjinTanggalSelesai);
    let calculatedDays = checkerIjinJumlahHari;
    if (checkerIjinTanggalMulai && checkerIjinTanggalSelesai && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffTime = end.getTime() - start.getTime();
      calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)) + 1);
    }

    const updatedFields = {
      ijinReasonType: checkerIjinType,
      alasanIjin: checkerIjinType,
      tanggalMulai: checkerIjinTanggalMulai,
      tanggalSelesai: checkerIjinTanggalSelesai,
      jumlahHari: calculatedDays,
      jumlahHariDisetujui: calculatedDays,
      keterangan: checkerIjinKeterangan,
      checkerDraftCorrection: true
    };

    try {
      await WORKFLOW_API.ijin.update(checkerIjinSub.id, mapCheckerEditPayload("ijin", updatedFields));
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Koreksi Ijin Gagal", message: getApiError(error) });
      return;
    }
    setIsCheckerIjinModalOpen(false);
    setAlertModal({
      isOpen: true,
      type: "success",
      title: "Draft Koreksi Ijin Berhasil Disimpan",
      message: `Data draft koreksi pengajuan ijin untuk dokumen ${getFormattedDocNo(checkerIjinSub)} berhasil disimpan sebagai draft. Pengajuan belum dikirim ke Approval 1.`
    });
    handleRefresh();
  };

  const handleApproveWithCheckerIjinCorrection = () => {
    if (!checkerIjinSub) return;

    const start = new Date(checkerIjinTanggalMulai);
    const end = new Date(checkerIjinTanggalSelesai);
    let calculatedDays = checkerIjinJumlahHari;
    if (checkerIjinTanggalMulai && checkerIjinTanggalSelesai && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffTime = end.getTime() - start.getTime();
      calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)) + 1);
    }

    const updatedFields = {
      ijinReasonType: checkerIjinType,
      alasanIjin: checkerIjinType,
      tanggalMulai: checkerIjinTanggalMulai,
      tanggalSelesai: checkerIjinTanggalSelesai,
      jumlahHari: calculatedDays,
      jumlahHariDisetujui: calculatedDays,
      keterangan: checkerIjinKeterangan,
    };

    setApproveSub(checkerIjinSub);
    setCheckerExtraData(updatedFields);
    setIsCheckerIjinModalOpen(false);
    setIsApproveSignOpen(true);
  };

  const handleSaveCheckerSakit = async (e) => {
    if (e) e.preventDefault();
    if (!checkerSakitSub) return;

    const start = new Date(checkerSakitTanggalMulai);
    const end = new Date(checkerSakitTanggalSelesai);
    let calculatedDays = checkerSakitJumlahHari;
    if (checkerSakitTanggalMulai && checkerSakitTanggalSelesai && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffTime = end.getTime() - start.getTime();
      calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)) + 1);
    }

    const updatedFields = {
      tanggalMulai: checkerSakitTanggalMulai,
      tanggalSelesai: checkerSakitTanggalSelesai,
      jumlahHari: calculatedDays,
      instansiKlinik: checkerSakitKlinik,
      namaDokter: checkerSakitDokter,
      diagnosaSingkat: checkerSakitDiagnosa,
    };

    try {
      await WORKFLOW_API.sakit.update(checkerSakitSub.id, mapCheckerEditPayload("sakit", updatedFields));
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Koreksi Sakit Gagal", message: getApiError(error) });
      return;
    }
    setIsCheckerSakitModalOpen(false);
    setAlertModal({
      isOpen: true,
      type: "success",
      title: "Draft Koreksi Sakit Berhasil Disimpan",
      message: `Data draft koreksi pengajuan sakit untuk dokumen ${getFormattedDocNo(checkerSakitSub)} berhasil disimpan sebagai draft. Pengajuan belum dikirim ke Approval 1.`
    });
    handleRefresh();
  };

  const handleApproveWithCheckerSakitCorrection = () => {
    if (!checkerSakitSub) return;

    const start = new Date(checkerSakitTanggalMulai);
    const end = new Date(checkerSakitTanggalSelesai);
    let calculatedDays = checkerSakitJumlahHari;
    if (checkerSakitTanggalMulai && checkerSakitTanggalSelesai && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffTime = end.getTime() - start.getTime();
      calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)) + 1);
    }

    const updatedFields = {
      tanggalMulai: checkerSakitTanggalMulai,
      tanggalSelesai: checkerSakitTanggalSelesai,
      jumlahHari: calculatedDays,
      instansiKlinik: checkerSakitKlinik,
      namaDokter: checkerSakitDokter,
      diagnosaSingkat: checkerSakitDiagnosa,
    };

    setApproveSub(checkerSakitSub);
    setCheckerExtraData(updatedFields);
    setIsCheckerSakitModalOpen(false);
    setIsApproveSignOpen(true);
  };

  const handleSaveCheckerLemburDirect = async (e) => {
    if (e) e.preventDefault();
    if (!checkerLemburSub) return;

    const corrNum = Number(jumlahJamKoreksiInput) || 0;
    const valRes = validateLemburMaxHours(
      corrNum,
      submissions,
      checkerLemburSub.employeeNip,
      checkerLemburTanggalLembur,
      checkerLemburSub.id,
      checkerLemburJenisPekerjaan
    );

    if (!valRes.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Limit Jam Lembur (Checker)",
        message: valRes.message
      });
      return;
    }

    const updatedFields = {
      tanggalLembur: checkerLemburTanggalLembur,
      jamMulai: checkerLemburJamMulai,
      jamSelesai: checkerLemburJamSelesai,
      kategoriLembur: checkerLemburKategoriLembur,
      jenisPekerjaan: checkerLemburJenisPekerjaan,
      detailKegiatan: checkerLemburDetailKegiatan,
      durasiJam: corrNum,
      jumlahJamKoreksi: corrNum,
      catatanKoreksi: catatanKoreksiInput,
      keterangan: `${checkerLemburKategoriLembur} - ${checkerLemburJenisPekerjaan} (${corrNum} Jam)`
    };

    try {
      await WORKFLOW_API.lembur.update(checkerLemburSub.id, mapCheckerEditPayload("lembur", updatedFields));
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Koreksi Lembur Gagal", message: getApiError(error) });
      return;
    }
    setIsCheckerLemburModalOpen(false);
    setAlertModal({
      isOpen: true,
      type: "success",
      title: "Koreksi Lembur Berhasil Disimpan",
      message: `Data pengajuan lembur untuk dokumen ${getFormattedDocNo(checkerLemburSub)} berhasil dikoreksi dan diperbarui.`
    });
    handleRefresh();
  };

  const handleSaveCheckerSppdDirect = async (e) => {
    if (e) e.preventDefault();
    if (!checkerSppdSub) return;

    if (checkerExpenses.length === 0) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Komponen Biaya Kosong",
        message: "Harap tambahkan minimal 1 komponen biaya SPPD."
      });
      return;
    }
    const hasEmptyDesc = checkerExpenses.some((e) => !e.deskripsi || !e.deskripsi.trim());
    if (hasEmptyDesc) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Deskripsi Kosong",
        message: "Harap isi deskripsi untuk seluruh komponen biaya SPPD."
      });
      return;
    }

    const updatedFields = {
      maksudPerjalanan: checkerSppdMaksud,
      kotaAsal: checkerSppdKotaAsal,
      kotaTujuan: checkerSppdKotaTujuan,
      tanggalBerangkat: checkerSppdTanggalBerangkat,
      tanggalKembali: checkerSppdTanggalKembali,
      durasiHari: checkerSppdDurasiHari,
      kategoriSppd: checkerSppdKategori,
      expenses: checkerExpenses
    };

    try {
      await WORKFLOW_API.sppd.update(checkerSppdSub.id, mapCheckerEditPayload("sppd", updatedFields));
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Koreksi SPPD Gagal", message: getApiError(error) });
      return;
    }
    setIsCheckerSppdEditOpen(false);
    setAlertModal({
      isOpen: true,
      type: "success",
      title: "Draft Koreksi SPPD Berhasil Disimpan",
      message: `Data draft koreksi pengajuan SPPD untuk dokumen ${getFormattedDocNo(checkerSppdSub)} berhasil disimpan sebagai draft. Pengajuan belum dikirim ke Approval 1.`
    });
    handleRefresh();
  };

  const handleApproveWithCheckerSppdCorrection = () => {
    if (!checkerSppdSub) return;

    if (checkerExpenses.length === 0) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Komponen Biaya Kosong",
        message: "Harap tambahkan minimal 1 komponen biaya SPPD."
      });
      return;
    }
    const hasEmptyDesc = checkerExpenses.some((e) => !e.deskripsi || !e.deskripsi.trim());
    if (hasEmptyDesc) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Deskripsi Kosong",
        message: "Harap isi deskripsi untuk seluruh komponen biaya SPPD."
      });
      return;
    }

    const updatedFields = {
      maksudPerjalanan: checkerSppdMaksud,
      kotaAsal: checkerSppdKotaAsal,
      kotaTujuan: checkerSppdKotaTujuan,
      tanggalBerangkat: checkerSppdTanggalBerangkat,
      tanggalKembali: checkerSppdTanggalKembali,
      durasiHari: checkerSppdDurasiHari,
      kategoriSppd: checkerSppdKategori,
      expenses: checkerExpenses
    };

    setApproveSub(checkerSppdSub);
    setCheckerExtraData(updatedFields);
    setIsCheckerSppdEditOpen(false);
    setIsApproveSignOpen(true);
  };

  const handleSaveCheckerDraft = (e) => {
    if (e) e.preventDefault();
    if (!checkerLemburSub) return;

    const corrNum = Number(jumlahJamKoreksiInput) || 0;
    const valRes = validateLemburMaxHours(
      corrNum,
      submissions,
      checkerLemburSub.employeeNip,
      checkerLemburSub.tanggalLembur,
      checkerLemburSub.id,
      checkerLemburSub.jenisPekerjaan
    );

    if (!valRes.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Limit Jam Lembur (Checker)",
        message: valRes.message
      });
      return;
    }

    const newEstCost = calculateCorrectedOvertimeCost(checkerLemburSub, corrNum);

    DataService.saveCheckerDraftCorrection(
      checkerLemburSub.id,
      corrNum,
      catatanKoreksiInput,
      currentUser,
      newEstCost
    );

    setIsCheckerLemburModalOpen(false);
    setAlertModal({
      isOpen: true,
      type: "success",
      title: "Draft Koreksi Berhasil Disimpan",
      message: `Draft koreksi jam lembur (${corrNum} Jam) untuk dokumen ${getFormattedDocNo(checkerLemburSub)} berhasil disimpan sebagai draft. Anda dapat mengedit/memperbaruinya kapan saja sebelum menyetujui pengajuan.`
    });
    handleRefresh();
  };

  const handleApproveWithCheckerCorrection = () => {
    if (!checkerLemburSub) return;

    const corrNum = Number(jumlahJamKoreksiInput) || 0;
    const valRes = validateLemburMaxHours(
      corrNum,
      submissions,
      checkerLemburSub.employeeNip,
      checkerLemburSub.tanggalLembur,
      checkerLemburSub.id,
      checkerLemburSub.jenisPekerjaan
    );

    if (!valRes.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Persetujuan Koreksi Lembur",
        message: valRes.message
      });
      return;
    }

    setApproveSub(checkerLemburSub);
    setCheckerExtraData({
      jumlahJamKoreksi: corrNum,
      catatanKoreksi: catatanKoreksiInput,
      checkerDraftCorrection: false
    });
    setIsCheckerLemburModalOpen(false);
    setIsApproveSignOpen(true);
  };

  const handleOpenApproveSign = (sub) => {
    setApproveSub(sub);
    const effectiveRole = currentUser.role === "admin" ? sub.currentApproverRole : currentUser.role;

    if (effectiveRole === "checker" && sub.type === "lembur") {
      handleOpenCheckerLemburModal(sub);
    } else if (effectiveRole === "checker" && sub.type === "ijin") {
      handleOpenCheckerIjinModal(sub);
    } else if (effectiveRole === "checker" && sub.type === "cuti") {
      handleOpenCheckerCutiModal(sub);
    } else if (effectiveRole === "checker" && sub.type === "sakit") {
      handleOpenCheckerSakitModal(sub);
    } else if (effectiveRole === "checker" && sub.type === "sppd") {
      setCheckerExpenses(
        sub.expenses && sub.expenses.length > 0
          ? sub.expenses.map((e) => ({
              ...e,
              kategori: ["Transportasi", "Akomodasi", "Uang Harian", "Lain-lain"].includes(e.kategori) ? e.kategori : "Lain-lain",
              nominal: 0
            }))
          : [
              { id: "exp-1", deskripsi: "Biaya Transportasi Perjalanan Dinas", kategori: "Transportasi", nominal: 0 },
              { id: "exp-2", deskripsi: "Uang Harian Perjalanan Dinas", kategori: "Uang Harian", nominal: 0 },
              { id: "exp-3", deskripsi: "Biaya Penginapan / Hotel", kategori: "Akomodasi", nominal: 0 }
            ]
      );
      setIsCheckerSppdModalOpen(true);
    } else if ((effectiveRole === "approved1" || effectiveRole === "approved2") && sub.type === "sppd") {
      setApprover2Expenses(
        sub.expenses && sub.expenses.length > 0
          ? sub.expenses.map((e) => ({ ...e, nominal: e.nominal || 0 }))
          : []
      );
      setIsApprover2SppdModalOpen(true);
    } else {
      setIsApproveSignOpen(true);
    }
  };

  const handleApproveSignatureSave = async (dataUrl) => {
    if (!approveSub) return;
    const effectiveRole = currentUser.role === "admin" ? approveSub.currentApproverRole : currentUser.role;
    let extra = { ...checkerExtraData };

    if (effectiveRole === "checker" && approveSub.type === "sppd") {
      extra = { expenses: checkerExpenses, totalEstimasiBiaya: 0 };
    } else if ((effectiveRole === "approved1" || effectiveRole === "approved2") && approveSub.type === "sppd") {
      const total = approver2Expenses.reduce((a, b) => a + (Number(b.nominal) || 0), 0);
      extra = { expenses: approver2Expenses, totalEstimasiBiaya: total };
    }

    try {
      if (isBulkApproval) {
        const selectedTransactions = approval1SelectableSubmissions
          .filter((sub) => selectedApprovalKeys.includes(`${sub.type}:${sub.id}`))
          .map((sub) => ({ type: sub.type, id: sub.id }));
        const payload = buildApprovalPayload(dataUrl, "approved1");
        payload.append("transactions", JSON.stringify(selectedTransactions));
        await api.bulkApproveWorkflow(payload);
        setIsApproveSignOpen(false);
        setIsBulkApproval(false);
        setSelectedApprovalKeys([]);
        setApproveSub(null);
        setAlertModal({
          isOpen: true,
          type: "success",
          title: "Persetujuan Massal Berhasil",
          message: `${selectedTransactions.length} transaksi berhasil disetujui dengan satu tanda tangan.`
        });
        await handleRefresh();
        return;
      }

      const moduleApi = WORKFLOW_API[approveSub.type];
      if (!moduleApi) throw new Error("Jenis transaksi tidak didukung");
      const shouldPersistCorrection = Object.keys(extra).length > 0 && (
        effectiveRole === "checker"
        || (approveSub.type === "sppd" && ["approved1", "approved2"].includes(effectiveRole))
      );
      if (shouldPersistCorrection) {
        const correctionPayload = mapCheckerEditPayload(approveSub.type, extra);
        if (Object.keys(correctionPayload).length > 0) {
          await moduleApi.update(approveSub.id, correctionPayload);
        }
      }
      await moduleApi.approve(approveSub.id, buildApprovalPayload(dataUrl, effectiveRole, extra));
      setIsApproveSignOpen(false);
      setIsCheckerSppdModalOpen(false);
      setIsApprover2SppdModalOpen(false);
      setAlertModal({
        isOpen: true,
        type: "success",
        title: effectiveRole === "approved3" ? "Proses Selesai" : "Persetujuan Berhasil",
        message: `Dokumen ${getFormattedDocNo(approveSub)} berhasil disetujui dan diteruskan ke tahap berikutnya.`
      });
      setApproveSub(null);
      await handleRefresh();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Persetujuan Gagal", message: getApiError(error) });
    }
  };

  const handleOpenReject = (sub) => {
    setRejectSub(sub);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (notes) => {
    if (!rejectSub) return;
    try {
      await WORKFLOW_API[rejectSub.type].reject(rejectSub.id, notes);
      setIsRejectModalOpen(false);
      setRejectSub(null);
      setAlertModal({ isOpen: true, type: "success", title: "Pengajuan Ditolak", message: "Status dan catatan penolakan berhasil disimpan." });
      await handleRefresh();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Penolakan Gagal", message: getApiError(error) });
    }
  };

  const handleOpenRevise = (sub) => {
    setReviseSub(sub);
    setRevisionNotes("");
    setRevisionError("");
    setIsReviseModalOpen(true);
  };

  const handleConfirmRevise = async (notes, targetRole) => {
    if (!reviseSub) return;
    try {
      await WORKFLOW_API[reviseSub.type].revise(reviseSub.id, notes, targetRole);
      setIsReviseModalOpen(false);
      setReviseSub(null);
      setAlertModal({ isOpen: true, type: "success", title: "Revisi Berhasil", message: `Pengajuan dikembalikan ke ${STAGE_LABEL_MAP[targetRole] || targetRole}.` });
      await handleRefresh();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Revisi Gagal", message: getApiError(error) });
    }
  };

  // Check if current user is authorized to act on this submission
  const canUserApprove = (sub) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true; // Admin has master override
    if (sub.currentApproverRole === "maker") {
      return sub.employeeNip === currentUser.nip || currentUser.role === "maker";
    }
    return sub.currentApproverRole === currentUser.role;
  };

  const approval1SelectableSubmissions = filteredSubmissions.filter(
    (sub) => currentUser.role === "approved1" && sub.currentApproverRole === "approved1" && canUserApprove(sub)
  );
  const selectableApprovalKeys = approval1SelectableSubmissions.map((sub) => `${sub.type}:${sub.id}`);
  const isAllApproval1Selected = selectableApprovalKeys.length > 0
    && selectableApprovalKeys.every((key) => selectedApprovalKeys.includes(key));

  useEffect(() => {
    setSelectedApprovalKeys((previous) => previous.filter((key) => selectableApprovalKeys.includes(key)));
  }, [submissions, activeStageTab, searchQuery, selectedOriginFilter, statusCardFilter, selectedProject, selectedUp, selectedUpt, selectedUltg, selectedGi, startDate, endDate]);

  const toggleApprovalSelection = (sub) => {
    const key = `${sub.type}:${sub.id}`;
    setSelectedApprovalKeys((previous) => previous.includes(key)
      ? previous.filter((item) => item !== key)
      : [...previous, key]);
  };

  const toggleSelectAllApproval1 = () => {
    setSelectedApprovalKeys(isAllApproval1Selected ? [] : selectableApprovalKeys);
  };

  const handleOpenBulkApproval = () => {
    if (selectedApprovalKeys.length === 0) return;
    setApproveSub({ currentApproverRole: "approved1" });
    setIsBulkApproval(true);
    setIsApproveSignOpen(true);
  };

  // Build the 6-level step array with precise status coloring
  const getWorkflowSteps = (sub) => {
    const steps = [
      {
        id: "maker",
        label: "Maker",
        sublabel: sub.employeeName,
        status: sub.status === "rejected" ? "rejected" : sub.status === "revision" ? "revision" : "approved",
        notes: sub.rejectionReason || "",
        date: sub.tanggalPengajuan
      },
      {
        id: "checker",
        label: "Checker",
        sublabel: "TL PLN",
        status: "pending",
        approvedBy: "",
        date: "",
        notes: ""
      },
      {
        id: "verification",
        label: "Verifikasi",
        sublabel: "AMN PLN",
        status: "pending",
        approvedBy: "",
        date: "",
        notes: ""
      },
      {
        id: "approved1",
        label: "Approval 1",
        sublabel: "MAN PLN",
        status: "pending",
        approvedBy: "",
        date: "",
        notes: ""
      },
      {
        id: "approved2",
        label: "Approval 2",
        sublabel: "TL PLN ES",
        status: "pending",
        approvedBy: "",
        date: "",
        notes: ""
      },
      {
        id: "approved3",
        label: "Approval 3",
        sublabel: "AMN PLN ES",
        status: "pending",
        approvedBy: "",
        date: "",
        notes: ""
      }
    ];

    // Populate steps 2 to 6 from submission approvalSteps
    const subSteps = sub.approvalSteps || [];
    subSteps.forEach((s, idx) => {
      const stepIdx = idx + 1;
      if (stepIdx < steps.length) {
        steps[stepIdx].status = s.status || "pending";
        steps[stepIdx].approvedBy = s.actionByName || "";
        steps[stepIdx].date = s.actionDate || "";
        steps[stepIdx].notes = s.notes || "";
      }
    });

    // Smart logic: if the submission is fully approved, mark everything as approved
    const statusLower = sub.status ? sub.status.toLowerCase() : "";
    if (statusLower === "approved") {
      steps.forEach((s) => {
        s.status = "approved";
      });
    } else if (statusLower === "rejected" || statusLower === "revision" || statusLower === "revision_required") {
      // Find the last step that was actually processed, leave remaining as gray/pending
    }

    // Explicitly check current active step
    steps.forEach((s) => {
      if (sub.currentApproverRole === s.id && statusLower !== "approved" && statusLower !== "rejected" && statusLower !== "revision" && statusLower !== "revision_required") {
        s.status = "active_pending";
      }
    });

    return steps;
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 select-none max-w-none">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#0F172A] text-[#FFD100] rounded-xl shadow-lg shadow-slate-900/10">
              <GitPullRequest className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Workflow Persetujuan Berjenjang
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Monitoring progress real-time, verifikasi digital, dan approval
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 shadow-md transition duration-150 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-[#FFD100] animate-spin-slow" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Stats Summary Panel (Interactive Click Filters - Disesuaikan dengan Peran/Stage Active) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Pengajuan */}
        <button
          onClick={() => setStatusCardFilter("all")}
          className={`p-3 sm:p-3.5 rounded-xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-98 ${
            statusCardFilter === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900 ring-offset-1"
              : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                statusCardFilter === "all"
                  ? "bg-white/10 text-[#FFD100]"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <Activity className="w-4.5 h-4.5" />
            </div>
            <div>
              <p
                className={`text-[9.5px] font-extrabold uppercase tracking-wider leading-none ${
                  statusCardFilter === "all" ? "text-slate-300" : "text-slate-400"
                }`}
              >
                Total ({currentStageTitle})
              </p>
              <p className="text-lg font-black mt-1 leading-none">{totalStageCount}</p>
            </div>
          </div>
          {statusCardFilter === "all" && (
            <span className="w-2 h-2 rounded-full bg-[#FFD100] animate-pulse"></span>
          )}
        </button>

        {/* Card 2: Menunggu Approval */}
        <button
          onClick={() =>
            setStatusCardFilter(statusCardFilter === "pending" ? "all" : "pending")
          }
          className={`p-3 sm:p-3.5 rounded-xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-98 ${
            statusCardFilter === "pending"
              ? "bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-400 ring-offset-1"
              : "bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                statusCardFilter === "pending"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div>
              <p
                className={`text-[9.5px] font-extrabold uppercase tracking-wider leading-none ${
                  statusCardFilter === "pending" ? "text-amber-800" : "text-slate-400"
                }`}
              >
                Menunggu ({currentStageTitle})
              </p>
              <p
                className={`text-lg font-black mt-1 leading-none ${
                  statusCardFilter === "pending" ? "text-amber-900" : "text-amber-600"
                }`}
              >
                {pendingStageCount}
              </p>
            </div>
          </div>
          {statusCardFilter === "pending" && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </button>

        {/* Card 3: Disetujui Penuh */}
        <button
          onClick={() =>
            setStatusCardFilter(statusCardFilter === "approved" ? "all" : "approved")
          }
          className={`p-3 sm:p-3.5 rounded-xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-98 ${
            statusCardFilter === "approved"
              ? "bg-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-400 ring-offset-1"
              : "bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                statusCardFilter === "approved"
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <UserCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <p
                className={`text-[9.5px] font-extrabold uppercase tracking-wider leading-none ${
                  statusCardFilter === "approved" ? "text-emerald-800" : "text-slate-400"
                }`}
              >
                Disetujui Penuh
              </p>
              <p
                className={`text-lg font-black mt-1 leading-none ${
                  statusCardFilter === "approved" ? "text-emerald-900" : "text-emerald-600"
                }`}
              >
                {approvedTotalCount}
              </p>
            </div>
          </div>
          {statusCardFilter === "approved" && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        {/* Card 4: Revisi / Ditolak */}
        <button
          onClick={() =>
            setStatusCardFilter(statusCardFilter === "rejected" ? "all" : "rejected")
          }
          className={`p-3 sm:p-3.5 rounded-xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-98 ${
            statusCardFilter === "rejected"
              ? "bg-rose-50 border-rose-400 shadow-sm ring-2 ring-rose-400 ring-offset-1"
              : "bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                statusCardFilter === "rejected"
                  ? "bg-rose-500 text-white"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div>
              <p
                className={`text-[9.5px] font-extrabold uppercase tracking-wider leading-none ${
                  statusCardFilter === "rejected" ? "text-rose-800" : "text-slate-400"
                }`}
              >
                Revisi / Ditolak
              </p>
              <p
                className={`text-lg font-black mt-1 leading-none ${
                  statusCardFilter === "rejected" ? "text-rose-900" : "text-rose-600"
                }`}
              >
                {rejectedTotalCount}
              </p>
            </div>
          </div>
          {statusCardFilter === "rejected" && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* FILTER BAR & TAB NAVIGATION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan Nama, NIP, Nomor Dokumen, Keterangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-10 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-900 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>

          {/* Task 2: Asal Pegawai Dropdown Filter (Remarked out / Hidden) */}
          {/*
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Asal Pegawai:
            </span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {["all", "TAD", "PLN", "PLN ES"].map((origin) => (
                <button
                  key={origin}
                  onClick={() => setSelectedOriginFilter(origin)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedOriginFilter === origin
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {origin === "all" ? "Semua" : origin}
                </button>
              ))}
            </div>
          </div>
          */}
        </div>

        {/* Tab khusus per-stage (Child Routes) */}
        <div className="border-b border-slate-200 pb-1">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 text-xs font-bold">
            {[
              { id: "all", label: "Semua Tahap" },
              { id: "maker", label: "1. Maker (TAD)" },
              { id: "checker", label: "2. Checker (TL PLN)" },
              { id: "verification", label: "3. Verifikasi (AMN PLN)" },
              { id: "approved1", label: "4. Approval 1 (MAN PLN)" },
              { id: "approved2", label: "5. Approval 2 (TL ES)" },
              { id: "approved3", label: "6. Approval 3 (AMN ES)" }
            ].map((tab) => {
              const count = baseFilteredSubmissions.filter((sub) => {
                if (tab.id === "all") return true;
                if (tab.id === "maker") {
                  return (
                    sub.currentApproverRole === "maker" ||
                    sub.status === "revision" ||
                    sub.status === "rejected" ||
                    sub.status === "draft"
                  );
                }
                return sub.currentApproverRole === tab.id;
              }).length;

              const isActive = activeStageTab === tab.id;
              const isUserRole = currentUser && currentUser.role === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-2 px-4 pb-3 pt-2 border-b-2 transition duration-200 whitespace-nowrap min-h-[42px] cursor-pointer relative group ${
                    isActive
                      ? "border-emerald-600 text-emerald-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-amber-500 hover:border-amber-400"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{tab.label}</span>
                    {isUserRole && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black bg-sky-50 text-sky-700 border border-sky-100 rounded-md shadow-3xs animate-pulse">
                        <span className="w-1 h-1 rounded-full bg-sky-500"></span>
                        Peran Anda
                      </span>
                    )}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20"
                        : "bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CORE WORKFLOW LISTING GROUPED BY FORM TYPE (Lembur, Cuti, Ijin, Sakit, SPPD) */}
      <div className="space-y-6">
        {/* Toolbar Group Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Pengelompokan Form Berkas Workflow ({filteredSubmissions.length} Total Berkas)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAllGroups}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Buka Semua</span>
            </button>
            <button
              onClick={collapseAllGroups}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              <span>Tutup Semua</span>
            </button>
          </div>
        </div>

        {currentUser.role === "approved1" && approval1SelectableSubmissions.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-emerald-950">
              <input
                type="checkbox"
                checked={isAllApproval1Selected}
                onChange={toggleSelectAllApproval1}
                className="h-4 w-4 rounded border-emerald-300 accent-emerald-600"
              />
              Pilih semua transaksi yang tampil ({approval1SelectableSubmissions.length})
            </label>
            <button
              type="button"
              onClick={handleOpenBulkApproval}
              disabled={selectedApprovalKeys.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-4 w-4 stroke-[3]" />
              Setujui {selectedApprovalKeys.length} Transaksi
            </button>
          </div>
        )}

        {/* 5 Form Category Groups */}
        {[
          {
            id: "lembur",
            name: "Form Lembur",
            icon: Clock,
            headerBg: "bg-amber-500/10 hover:bg-amber-500/15 border-amber-300/80 text-amber-950",
            badgeBg: "bg-amber-500 text-white",
            matchTypes: ["lembur"]
          },
          {
            id: "cuti",
            name: "Form Cuti",
            icon: Calendar,
            headerBg: "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-300/80 text-emerald-950",
            badgeBg: "bg-emerald-600 text-white",
            matchTypes: ["cuti"]
          },
          {
            id: "ijin",
            name: "Form Ijin",
            icon: FileCheck2,
            headerBg: "bg-sky-500/10 hover:bg-sky-500/15 border-sky-300/80 text-sky-950",
            badgeBg: "bg-sky-600 text-white",
            matchTypes: ["ijin", "izin"]
          },
          {
            id: "sakit",
            name: "Form Sakit",
            icon: Activity,
            headerBg: "bg-rose-500/10 hover:bg-rose-500/15 border-rose-300/80 text-rose-950",
            badgeBg: "bg-rose-600 text-white",
            matchTypes: ["sakit"]
          },
          {
            id: "sppd",
            name: "Form SPPD (Dinas)",
            icon: Building,
            headerBg: "bg-indigo-500/10 hover:bg-indigo-500/15 border-indigo-300/80 text-indigo-950",
            badgeBg: "bg-indigo-600 text-white",
            matchTypes: ["sppd"]
          }
        ].map((groupCat) => {
          const groupItems = filteredSubmissions.filter((sub) => {
            const tLower = (sub.type || "").toLowerCase();
            return groupCat.matchTypes.includes(tLower);
          });

          const pendingCount = groupItems.filter(
            (s) => s.status && s.status.toLowerCase().startsWith("pending_")
          ).length;

          const isCollapsed = collapsedGroups[groupCat.id];
          const GroupIcon = groupCat.icon;

          return (
            <div
              key={groupCat.id}
              id={`workflow-form-${groupCat.id}`}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition"
            >
              {/* Group Accordion Header */}
              <div
                onClick={() => toggleGroup(groupCat.id)}
                className={`p-4 flex items-center justify-between cursor-pointer border-b transition ${groupCat.headerBg} ${
                  isCollapsed ? "border-transparent" : "border-slate-200/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl shadow-xs ${groupCat.badgeBg}`}>
                    <GroupIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900">{groupCat.name}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-white/80 border border-slate-200/80 text-slate-800 shadow-3xs">
                        {groupItems.length} Berkas
                      </span>
                      {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white shadow-3xs animate-pulse">
                          {pendingCount} Menunggu
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      {groupItems.length === 0
                        ? "Belum ada dokumen pengajuan pada kelompok form ini."
                        : `Menampilkan ${groupItems.length} pengajuan ${groupCat.name.toLowerCase()}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-600 font-extrabold text-xs">
                  <span className="hidden sm:inline">
                    {isCollapsed ? "Buka Group" : "Tutup Group"}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white/80 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-3xs">
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Group Content Body (Professional Table Layout matching ListDokumenPage) */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-50/30"
                  >
                    {groupItems.length === 0 ? (
                      <div className="p-6 text-center bg-white border-t border-slate-200/80">
                        <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-500">
                          Tidak ada pengajuan {groupCat.name} yang sesuai dengan filter.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border-t border-slate-200/80">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                              {currentUser.role === "approved1" && (
                                <th className="py-2.5 px-3.5 text-center w-10">Pilih</th>
                              )}
                              <th className="py-2.5 px-3.5 text-center w-10">No</th>
                              <th className="py-2.5 px-3.5">ID Dokumen / Tipe</th>
                              <th className="py-2.5 px-3.5">Pemohon</th>
                              <th className="py-2.5 px-3.5">Tanggal &amp; Keterangan</th>
                              <th className="py-2.5 px-3.5 text-center">Posisi / Status</th>
                              <th className="py-2.5 px-3.5 text-right pr-4">Aksi</th>
                              <th className="py-2.5 px-3.5 text-center w-12">Alur</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium bg-white">
                            {groupItems.map((sub, idx) => {
                              const origin = getEmployeeOrigin(sub, allUsers);
                              const steps = getWorkflowSteps(sub);
                              const isActiveUserTurn = canUserApprove(sub);
                              const expanded = isRowExpanded(sub.id, isActiveUserTurn);

                              return (
                                <Fragment key={sub.id}>
                                  <tr className={`hover:bg-slate-50/80 transition-colors ${isActiveUserTurn ? "bg-amber-50/30" : ""}`}>
                                    {currentUser.role === "approved1" && (
                                      <td className="py-3 px-3.5 text-center">
                                        {sub.currentApproverRole === "approved1" && isActiveUserTurn && (
                                          <input
                                            type="checkbox"
                                            checked={selectedApprovalKeys.includes(`${sub.type}:${sub.id}`)}
                                            onChange={() => toggleApprovalSelection(sub)}
                                            aria-label={`Pilih ${getFormattedDocNo(sub)}`}
                                            className="h-4 w-4 cursor-pointer rounded border-emerald-300 accent-emerald-600"
                                          />
                                        )}
                                      </td>
                                    )}
                                    <td className="py-3 px-3.5 text-center font-mono text-slate-400 text-[11px]">
                                      {idx + 1}
                                    </td>
                                    <td className="py-3 px-3.5">
                                      <div className="font-mono font-black text-slate-900 text-xs flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <span>{getFormattedDocNo(sub)}</span>
                                      </div>
                                      {/*<div className="flex items-center gap-1 mt-1">
                                        <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] uppercase">
                                          {sub.type}
                                        </span>
                                      </div> */}
                                    </td>
                                    <td className="py-3 px-3.5">
                                      <div className="flex items-center gap-2">
                                        {/*{renderOriginBadge(origin)} */}
                                        <div>
                                          <p className="font-extrabold text-slate-900 text-xs leading-none">
                                            {sub.employeeName}
                                          </p> 
                                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                            NIP: {sub.employeeNip}
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-3.5 max-w-xs">
                                      <p className="font-semibold text-slate-800 text-xs truncate" title={sub.keterangan || "-"}>
                                        {sub.keterangan || "-"}
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                        Diajukan: {formatDateIndonesian(sub.tanggalPengajuan)}
                                      </p>
                                    </td>
                                    <td className="py-3 px-3.5 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[9.5px] uppercase tracking-wider font-extrabold border ${getStatusBadgeColor(sub.status)}`}>
                                          {getStatusLabel(sub.status)}
                                        </span>
                                        {sub.currentApproverRole && (
                                          <span className="text-[10px] font-semibold text-slate-600">
                                            Posisi: <strong className="text-slate-900 uppercase">{getStatusLabel("pending_" + sub.currentApproverRole).replace("Menunggu ", "")}</strong>
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-3.5 text-right pr-4">
                                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                        {/* Lihat PDF */}
                                        <ActionIconButton
                                          onClick={() => setSelectedDocSub(sub)}
                                          label="Lihat PDF"
                                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80 cursor-pointer"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                                        </ActionIconButton>

                                        <ActionIconButton
                                          onClick={() => handleOpenHistory(sub)}
                                          label="Lihat History Log"
                                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer"
                                        >
                                          <History className="w-3.5 h-3.5" />
                                        </ActionIconButton>

                                        {/* Active Actions */}
                                        {isActiveUserTurn && sub.status !== "approved" && (
                                          <>
                                            {(sub.currentApproverRole === "maker" || (sub.status || "").toLowerCase() === "draft") ? (
                                              <button
                                                onClick={() => navigate(`/${sub.type}?editId=${sub.id}`)}
                                                className="px-2.5 py-1 text-xs bg-[#00A3E0] hover:bg-[#0082B3] text-white font-bold rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer active:scale-95"
                                                title="Edit & Perbarui Draft / Pengajuan"
                                              >
                                                <Edit3 className="w-3.5 h-3.5" />
                                                <span>Edit / Perbarui</span>
                                              </button>
                                            ) : (
                                              <>
                                                <ActionIconButton
                                                  onClick={() => handleOpenRevise(sub)}
                                                  label="Revisi"
                                                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer"
                                                >
                                                  <RefreshCw className="w-3.5 h-3.5" />
                                                </ActionIconButton>

                                                {/* Edit button for Checker (Lembur, Cuti, Ijin, Sakit & SPPD) */}
                                                {(currentUser.role === "checker" || (currentUser.role === "admin" && sub.currentApproverRole === "checker")) && (
                                                  <>
                                                    {sub.type === "lembur" && (
                                                      <ActionIconButton
                                                        onClick={() => handleOpenCheckerLemburModal(sub)}
                                                        className="bg-[#00A3E0]/10 hover:bg-[#00A3E0]/20 text-[#00A3E0] border border-[#00A3E0]/30 cursor-pointer"
                                                        label="Edit Lembur"
                                                      >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                      </ActionIconButton>
                                                    )}
                                                    {sub.type === "cuti" && (
                                                      <ActionIconButton
                                                        onClick={() => handleOpenCheckerCutiModal(sub)}
                                                        className="bg-[#00A3E0]/10 hover:bg-[#00A3E0]/20 text-[#00A3E0] border border-[#00A3E0]/30 cursor-pointer"
                                                        label="Edit Cuti"
                                                      >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                      </ActionIconButton>
                                                    )}
                                                    {sub.type === "ijin" && (
                                                      <ActionIconButton
                                                        onClick={() => handleOpenCheckerIjinModal(sub)}
                                                        className="bg-[#00A3E0]/10 hover:bg-[#00A3E0]/20 text-[#00A3E0] border border-[#00A3E0]/30 cursor-pointer"
                                                        label="Edit Ijin"
                                                      >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                      </ActionIconButton>
                                                    )}
                                                    {sub.type === "sakit" && (
                                                      <ActionIconButton
                                                        onClick={() => handleOpenCheckerSakitModal(sub)}
                                                        className="bg-[#00A3E0]/10 hover:bg-[#00A3E0]/20 text-[#00A3E0] border border-[#00A3E0]/30 cursor-pointer"
                                                        label="Edit Sakit"
                                                      >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                      </ActionIconButton>
                                                    )}
                                                    {sub.type === "sppd" && (
                                                      <ActionIconButton
                                                        onClick={() => handleOpenCheckerSppdEditModal(sub)}
                                                        className="bg-[#00A3E0]/10 hover:bg-[#00A3E0]/20 text-[#00A3E0] border border-[#00A3E0]/30 cursor-pointer"
                                                        label="Edit SPPD"
                                                      >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                      </ActionIconButton>
                                                    )}
                                                  </>
                                                )}

                                                <ActionIconButton
                                                  onClick={() => handleOpenReject(sub)}
                                                  label="Tolak"
                                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                </ActionIconButton>

                                                <ActionIconButton
                                                  onClick={() => handleOpenApproveSign(sub)}
                                                  label="Setujui"
                                                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs shadow-emerald-600/20 cursor-pointer"
                                                >
                                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                </ActionIconButton>
                                              </>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-3.5 text-center">
                                      <button
                                        onClick={() => toggleRowExpand(sub.id, isActiveUserTurn)}
                                        className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                        title={expanded ? "Sembunyikan Alur" : "Tampilkan Alur Stepper"}
                                      >
                                        {expanded ? (
                                          <ChevronUp className="w-4 h-4 text-slate-700" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-slate-500" />
                                        )}
                                      </button>
                                    </td>
                                  </tr>

                                  {/* Expandable Stepper Details Row */}
                                  {expanded && (
                                    <tr className="bg-slate-50/90 border-b border-slate-200">
                                      <td colSpan={currentUser.role === "approved1" ? 8 : 7} className="p-3 sm:p-4">
                                        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
                                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                              <Activity className="w-3.5 h-3.5 text-blue-600" />
                                              <span>Visualisasi Alur Workflow 6-Level Approval</span>
                                            </p>
                                            {sub.currentApproverRole ? (
                                              <span className="text-[10.5px] font-semibold text-slate-600">
                                                Posisi Berkas: <strong className="text-slate-900 uppercase">{getStatusLabel("pending_" + sub.currentApproverRole)}</strong>
                                              </span>
                                            ) : (
                                              <span className="text-[10.5px] font-bold text-emerald-700 flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                Disetujui Penuh
                                              </span>
                                            )}
                                          </div>

                                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                                            {steps.map((st, sIdx) => {
                                              let dotColor = "bg-slate-200 border-slate-300 text-slate-500";
                                              let textColor = "text-slate-600 font-semibold";
                                              let ringEffect = "";

                                              if (st.status === "approved") {
                                                dotColor = "bg-emerald-500 border-emerald-600 text-white shadow-2xs";
                                                textColor = "text-emerald-800 font-extrabold";
                                              } else if (st.status === "active_pending") {
                                                dotColor = "bg-[#FFD100] border-amber-500 text-slate-950 shadow-2xs";
                                                textColor = "text-[#0F172A] font-black";
                                                ringEffect = "ring-2 ring-amber-400/20 animate-pulse";
                                              } else if (st.status === "rejected") {
                                                dotColor = "bg-rose-500 border-rose-600 text-white shadow-2xs";
                                                textColor = "text-rose-700 font-extrabold";
                                              } else if (st.status === "revision") {
                                                dotColor = "bg-amber-400 border-amber-500 text-slate-950 shadow-2xs";
                                                textColor = "text-amber-800 font-extrabold";
                                              }

                                              return (
                                                <div
                                                  key={st.id}
                                                  className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex flex-col justify-between h-full transition hover:border-slate-300"
                                                >
                                                  <div className="flex items-center justify-between gap-1">
                                                    <span className="text-[10px] font-black text-slate-900 leading-none truncate">
                                                      {st.label}
                                                    </span>
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8.5px] shrink-0 ${dotColor} ${ringEffect}`}>
                                                      {st.status === "approved" ? (
                                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                      ) : st.status === "rejected" ? (
                                                        <X className="w-2.5 h-2.5 stroke-[3]" />
                                                      ) : (
                                                        <span className="font-extrabold">{sIdx + 1}</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="mt-1.5 space-y-0.5">
                                                    <p className={`text-[9.5px] leading-tight truncate ${textColor}`}>
                                                      {st.sublabel}
                                                    </p>
                                                    {st.date && (
                                                      <p className="text-[8.5px] text-slate-400 font-medium leading-none">
                                                        {st.date.split(" ")[0]}
                                                      </p>
                                                    )}
                                                    {st.notes && (
                                                      <p className="text-[8.5px] text-slate-600 bg-slate-100 rounded px-1 py-0.5 font-medium italic mt-0.5 leading-tight line-clamp-1" title={st.notes}>
                                                        "{st.notes}"
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>

                                          {sub.workflowHistory?.some((entry) => String(entry.aksi || "").toUpperCase() === "REVISION") && (
                                            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                                              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                                                <RotateCcw className="h-3.5 w-3.5" />
                                                Riwayat Catatan Revisi
                                              </p>
                                              <div className="space-y-2">
                                                {sub.workflowHistory
                                                  .filter((entry) => String(entry.aksi || "").toUpperCase() === "REVISION")
                                                  .map((entry, index) => (
                                                    <div key={entry.id_log_lembur || entry.id_log_cuti || entry.id_log_ijin || entry.id_log_sakit || entry.id_log_sppd || index} className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                                                      <p className="text-xs font-semibold leading-relaxed text-slate-700">{entry.keterangan}</p>
                                                      <p className="mt-1 text-[10px] font-medium text-slate-500">
                                                        {entry.createdBy?.username || "User workflow"}
                                                        {entry.created_at ? ` • ${formatDateIndonesian(String(entry.created_at).slice(0, 10))}` : ""}
                                                      </p>
                                                    </div>
                                                  ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* CORE MODALS */}
      {/* 1. PDF Viewer modal */}
      <DocumentViewerModal
        isOpen={selectedDocSub !== null}
        submission={selectedDocSub}
        onClose={() => setSelectedDocSub(null)}
      />
      <WorkflowHistoryModal
        submission={selectedHistorySub}
        isLoading={isHistoryLoading}
        onClose={() => setSelectedHistorySub(null)}
      />

      {/* 2. Reject modal */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectSub(null);
        }}
        onConfirm={handleConfirmReject}
        submissionDocNo={rejectSub?.nomorDokumen}
        title="Tolak Pengajuan & Kembalikan ke Maker"
      />

      {/* 3. Signature (Approve) modal */}
      <SignatureModal
        isOpen={isApproveSignOpen}
        onClose={() => {
          setIsApproveSignOpen(false);
          setApproveSub(null);
          setIsBulkApproval(false);
        }}
        onSave={handleApproveSignatureSave}
        title={isBulkApproval
          ? `Tandatangan Persetujuan ${selectedApprovalKeys.length} Transaksi`
          : `Bubuhkan Tandatangan Persetujuan (${getStatusLabel("pending_" + approveSub?.currentApproverRole).replace("Menunggu ", "")})`}
        subtitle={isBulkApproval
          ? "Tanda tangan ini akan tersimpan pada seluruh transaksi yang Anda pilih."
          : "Bubuhkan tandatangan Anda di bawah ini sebagai bentuk verifikasi persetujuan sah berkas."}
        saveButtonText={isBulkApproval
          ? `Setujui ${selectedApprovalKeys.length} Transaksi`
          : approveSub?.currentApproverRole === "checker" ? "Setujui & Kirim ke Approval 1" : "Setujui & Kirim Berkas"}
      />

      {/* 4. Request Revision modal */}
      <RevisionModal
        isOpen={isReviseModalOpen}
        onClose={() => {
          setIsReviseModalOpen(false);
          setReviseSub(null);
        }}
        onConfirm={handleConfirmRevise}
        submissionDocNo={reviseSub?.nomorDokumen}
        currentApproverRole={reviseSub?.currentApproverRole || currentUser?.role}
        title={`Minta Revisi Dokumen (${reviseSub?.nomorDokumen || ""})`}
      />

      {/* Task 2: Checker SPPD Expenses Modal */}
      {isCheckerSppdModalOpen && approveSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sky-600" />
                Penentuan Rincian Komponen Biaya SPPD (Role Checker)
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 space-y-1">
                <p className="font-bold text-slate-900">{approveSub.employeeName} ({approveSub.employeeNip})</p>
                <p className="text-slate-700 font-semibold">{approveSub.maksudPerjalanan}</p>
                <p className="text-slate-600">Rute: {approveSub.kotaAsal} &rarr; {approveSub.kotaTujuan} ({approveSub.durasiHari} Hari)</p>
                <p className="text-sky-800 text-[11px] font-semibold pt-1 border-t border-sky-200/60 mt-1">
                  * Tambahkan / edit komponen biaya SPPD. Nilai nominal terisi default 0 &amp; bersifat Readonly (nominal diisi oleh Approved 2).
                </p>
              </div>

              <div className="space-y-2 border border-slate-200 p-3 rounded-2xl bg-slate-50">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    Rincian Komponen Biaya SPPD
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckerExpenses([
                        ...checkerExpenses,
                        { id: "exp-" + Date.now(), deskripsi: "Komponen Biaya SPPD", kategori: "Transportasi", nominal: 0 }
                      ]);
                    }}
                    className="px-3 py-1.5 text-[11px] font-extrabold bg-sky-100 text-sky-800 hover:bg-sky-200 active:bg-sky-300 rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Item
                  </button>
                </div>

                {checkerExpenses.map((exp, idx) => (
                  <div key={exp.id} className="grid grid-cols-12 gap-1.5 items-center bg-white p-1.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={exp.deskripsi}
                      onChange={(e) => {
                        const newExp = [...checkerExpenses];
                        newExp[idx].deskripsi = e.target.value;
                        setCheckerExpenses(newExp);
                      }}
                      placeholder="Deskripsi Komponen..."
                      className="col-span-5 h-9 px-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-[11px] font-medium focus:outline-none"
                    />
                    <select
                      value={exp.kategori}
                      onChange={(e) => {
                        const newExp = [...checkerExpenses];
                        newExp[idx].kategori = e.target.value;
                        setCheckerExpenses(newExp);
                      }}
                      className="col-span-4 h-9 px-1.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-[10.5px] font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="Transportasi">Transportasi</option>
                      <option value="Akomodasi">Akomodasi</option>
                      <option value="Uang Harian">Uang Harian</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                    <input
                      type="text"
                      readOnly
                      value="Rp 0 (Readonly)"
                      className="col-span-2 h-9 px-1 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-mono text-[9.5px] text-center focus:outline-none select-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCheckerExpenses(checkerExpenses.filter((e) => e.id !== exp.id))}
                      className="col-span-1 text-rose-500 hover:text-rose-700 flex justify-center cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCheckerSppdModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (checkerExpenses.length === 0) {
                    setAlertModal({
                      isOpen: true,
                      type: "error",
                      title: "Komponen Biaya Kosong",
                      message: "Harap tambahkan minimal 1 komponen biaya SPPD."
                    });
                    return;
                  }
                  const hasEmptyDesc = checkerExpenses.some((e) => !e.deskripsi || !e.deskripsi.trim());
                  if (hasEmptyDesc) {
                    setAlertModal({
                      isOpen: true,
                      type: "error",
                      title: "Deskripsi Kosong",
                      message: "Harap isi deskripsi untuk seluruh komponen biaya SPPD."
                    });
                    return;
                  }
                  setIsCheckerSppdModalOpen(false);
                  setIsApproveSignOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Lanjut Tandatangan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval 1 correction / Approval 2 nominal SPPD modal */}
      {isApprover2SppdModalOpen && approveSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              {(currentUser.role === "admin" ? approveSub.currentApproverRole : currentUser.role) === "approved1"
                ? "Koreksi Komponen Biaya SPPD (Approval 1)"
                : "Input Nominal Biaya SPPD (Approval 2)"}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 space-y-1">
                <p className="font-bold text-slate-900">{approveSub.employeeName} ({approveSub.employeeNip})</p>
                <p className="text-slate-700 font-semibold">{approveSub.maksudPerjalanan}</p>
                <p className="text-slate-600">Rute: {approveSub.kotaAsal} &rarr; {approveSub.kotaTujuan} ({approveSub.durasiHari} Hari)</p>
                <p className="text-emerald-800 text-[11px] font-bold pt-1 border-t border-emerald-200/60 mt-1">
                  {(currentUser.role === "admin" ? approveSub.currentApproverRole : currentUser.role) === "approved1"
                    ? "* Periksa komponen dari Checker. Hapus komponen yang tidak disetujui sebelum melanjutkan."
                    : "* Wajib memasukkan nominal rupiah untuk setiap komponen biaya SPPD yang telah dikoreksi Approval 1."}
                </p>
              </div>

              <div className="space-y-2 border border-slate-200 p-3 rounded-2xl bg-slate-50">
                <label className="font-bold text-slate-800 block mb-1">
                  Rincian Komponen Biaya &amp; Nominal
                </label>

                {approver2Expenses.map((exp, idx) => (
                  <div key={exp.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-slate-200">
                    <div className="col-span-6">
                      <p className="font-bold text-slate-900 text-[11px]">{exp.deskripsi}</p>
                      <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                        {exp.kategori}
                      </span>
                    </div>
                    {(currentUser.role === "admin" ? approveSub.currentApproverRole : currentUser.role) === "approved1" ? (
                      <div className="col-span-6 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setApprover2Expenses((current) => current.filter((_, itemIndex) => itemIndex !== idx))}
                          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus Komponen
                        </button>
                      </div>
                    ) : (
                      <div className="col-span-6">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nominal (Rp)</label>
                        <input
                          type="number"
                          min={0}
                          value={exp.nominal}
                          onChange={(e) => {
                            const newExp = [...approver2Expenses];
                            newExp[idx].nominal = Number(e.target.value);
                            setApprover2Expenses(newExp);
                          }}
                          required
                          placeholder="Masukkan nominal..."
                          className="w-full h-9 px-2 border border-emerald-300 rounded-lg bg-white font-mono font-bold text-emerald-800 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsApprover2SppdModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const effectiveRole = currentUser.role === "admin" ? approveSub.currentApproverRole : currentUser.role;
                  if (approver2Expenses.length === 0) {
                    setAlertModal({
                      isOpen: true,
                      type: "error",
                      title: "Komponen Biaya Kosong",
                      message: "Minimal satu komponen biaya SPPD harus dipertahankan."
                    });
                    return;
                  }
                  const hasInvalidNominal = effectiveRole === "approved2"
                    && approver2Expenses.some((e) => !e.nominal || Number(e.nominal) <= 0);
                  if (hasInvalidNominal) {
                    setAlertModal({
                      isOpen: true,
                      type: "error",
                      title: "Nominal Belum Lengkap",
                      message: "Harap isi nominal rupiah yang valid (lebih besar dari Rp 0) untuk semua komponen biaya SPPD."
                    });
                    return;
                  }
                  setIsApprover2SppdModalOpen(false);
                  setIsApproveSignOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {(currentUser.role === "admin" ? approveSub.currentApproverRole : currentUser.role) === "approved1"
                  ? "Simpan Koreksi & Lanjut Tandatangan"
                  : "Simpan Nominal & Lanjut Tandatangan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checker Lembur Hours Edit & Correction Modal */}
      {isCheckerLemburModalOpen && checkerLemburSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-600" />
                Edit &amp; Koreksi Pengajuan Lembur (Checker)
              </span>
              <button
                onClick={() => setIsCheckerLemburModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 space-y-1">
                <p className="font-bold text-slate-900">{checkerLemburSub.employeeName} ({checkerLemburSub.employeeNip})</p>
                <p className="text-slate-600">Dokumen: {checkerLemburSub.nomorDokumen}</p>
                <p className="text-sky-800 text-[11px] font-semibold pt-1 border-t border-sky-200/60 mt-1">
                  * Durasi Awal Pengajuan Maker: <strong>{checkerLemburSub.durasiJam} Jam</strong>
                </p>
                <p className="text-emerald-700 text-[11px] font-semibold">
                  * Biaya Lembur Pengajuan: <strong>{formatRupiah(checkerLemburSub.biayaLembur)}</strong>
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Tanggal Lembur</label>
                    <input
                      type="date"
                      value={checkerLemburTanggalLembur}
                      onChange={(e) => setCheckerLemburTanggalLembur(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Kategori Lembur</label>
                    <select
                      value={checkerLemburKategoriLembur}
                      onChange={(e) => setCheckerLemburKategoriLembur(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    >
                      <option value="Terencana">Terencana</option>
                      <option value="Darurat">Darurat</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      value={checkerLemburJamMulai}
                      onChange={(e) => setCheckerLemburJamMulai(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Jam Selesai</label>
                    <input
                      type="time"
                      value={checkerLemburJamSelesai}
                      onChange={(e) => setCheckerLemburJamSelesai(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-black text-[11px] text-slate-900 mb-1">
                      Jumlah Jam Koreksi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      value={jumlahJamKoreksiInput}
                      onChange={(e) => setJumlahJamKoreksiInput(e.target.value)}
                      className="w-full h-9 px-2 bg-white border-2 border-sky-400 rounded-lg font-mono font-black text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="p-1.5 bg-white rounded-lg border border-amber-200 flex flex-col justify-center">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Estimasi Biaya Koreksi</p>
                    <p className="text-xs font-black font-mono text-emerald-700 leading-tight">
                      {formatRupiah(
                        calculateCorrectedOvertimeCost(
                          checkerLemburSub,
                          Number(jumlahJamKoreksiInput) || 0
                        )
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Jenis Pekerjaan</label>
                  <input
                    type="text"
                    value={checkerLemburJenisPekerjaan}
                    onChange={(e) => setCheckerLemburJenisPekerjaan(e.target.value)}
                    className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    placeholder="Contoh: Pemeliharaan Jaringan SUTM"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Detail Kegiatan / Pekerjaan</label>
                  <input
                    type="text"
                    value={checkerLemburDetailKegiatan}
                    onChange={(e) => setCheckerLemburDetailKegiatan(e.target.value)}
                    className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    placeholder="Masukkan rincian kegiatan..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Catatan / Alasan Koreksi (TL PLN Checker)
                  </label>
                  <textarea
                    rows={2}
                    value={catatanKoreksiInput}
                    onChange={(e) => setCatatanKoreksiInput(e.target.value)}
                    placeholder="Masukkan alasan atau penjelasan koreksi..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCheckerLemburModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReviseSub(checkerLemburSub);
                    setIsReviseModalOpen(true);
                    setIsCheckerLemburModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl border border-amber-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Minta Revisi
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRejectSub(checkerLemburSub);
                    setIsRejectModalOpen(true);
                    setIsCheckerLemburModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-xl border border-rose-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <X className="w-3.5 h-3.5" /> Tolak
                </button>

                <button
                  type="button"
                  onClick={handleSaveCheckerLemburDirect}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                  title="Simpan seluruh perubahan pengajuan lembur"
                >
                  <Save className="w-3.5 h-3.5" /> Simpan Perubahan
                </button>

                <button
                  type="button"
                  onClick={handleApproveWithCheckerCorrection}
                  className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-1 cursor-pointer transition"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Setujui &amp; Lanjut Tandatangan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checker Cuti Edit & Correction Modal */}
      {isCheckerCutiModalOpen && checkerCutiSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                Edit &amp; Koreksi Pengajuan Cuti (Checker)
              </span>
              <button
                onClick={() => setIsCheckerCutiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 space-y-1">
                <p className="font-bold text-slate-900">{checkerCutiSub.employeeName} ({checkerCutiSub.employeeNip})</p>
                <p className="text-slate-600">Dokumen: {checkerCutiSub.nomorDokumen}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Jenis Cuti</label>
                  <select
                    value={checkerCutiType}
                    onChange={(e) => setCheckerCutiType(e.target.value)}
                    className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  >
                    <option value="Cuti Tahunan">Cuti Tahunan</option>
                    <option value="Cuti Alasan Penting">Cuti Alasan Penting</option>
                    <option value="Cuti Bersalin">Cuti Bersalin</option>
                    <option value="Cuti Besar">Cuti Besar</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={checkerCutiTanggalMulai}
                      onChange={(e) => setCheckerCutiTanggalMulai(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={checkerCutiTanggalSelesai}
                      onChange={(e) => setCheckerCutiTanggalSelesai(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-850 mb-1">
                    Jumlah Durasi Cuti (Hari Kerja)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      readOnly
                      value={checkerCutiJumlahHari}
                      className="w-24 h-9 px-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 focus:outline-none"
                    />
                    <span className="text-slate-500 font-medium">Hari Kerja (Terhitung otomatis dari rentang tanggal)</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Alamat Selama Cuti</label>
                  <input
                    type="text"
                    value={checkerCutiAlamat}
                    onChange={(e) => setCheckerCutiAlamat(e.target.value)}
                    className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    placeholder="Alamat lengkap selama cuti..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">No. Telepon Darurat</label>
                  <input
                    type="text"
                    value={checkerCutiTelepon}
                    onChange={(e) => setCheckerCutiTelepon(e.target.value)}
                    className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    placeholder="Nomor telepon aktif..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Alasan / Keterangan</label>
                  <textarea
                    rows={2}
                    value={checkerCutiKeterangan}
                    onChange={(e) => setCheckerCutiKeterangan(e.target.value)}
                    placeholder="Tulis alasan atau keterangan cuti..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCheckerCutiModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReviseSub(checkerCutiSub);
                    setIsReviseModalOpen(true);
                    setIsCheckerCutiModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl border border-amber-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Minta Revisi
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRejectSub(checkerCutiSub);
                    setIsRejectModalOpen(true);
                    setIsCheckerCutiModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-xl border border-rose-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <X className="w-3.5 h-3.5" /> Tolak
                </button>

                <button
                  type="button"
                  onClick={handleSaveCheckerCuti}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Save className="w-3.5 h-3.5 text-slate-600" /> Simpan Draft Koreksi
                </button>

                <button
                  type="button"
                  onClick={handleApproveWithCheckerCutiCorrection}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Check className="w-4 h-4" /> Setujui &amp; Teruskan ke Approval 1
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checker Ijin Edit & Correction Modal */}
      {isCheckerIjinModalOpen && checkerIjinSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-sky-600" />
                Edit &amp; Koreksi Pengajuan Ijin (Checker)
              </span>
              <button
                onClick={() => setIsCheckerIjinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 space-y-1">
                <p className="font-bold text-slate-900">{checkerIjinSub.employeeName} ({checkerIjinSub.employeeNip})</p>
                <p className="text-slate-600">Dokumen: {checkerIjinSub.nomorDokumen}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Alasan / Jenis Ijin</label>
                  <select
                    value={checkerIjinType}
                    onChange={(e) => setCheckerIjinType(e.target.value)}
                    className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  >
                    <option value="Ijin Resmi PLN">Ijin Resmi PLN</option>
                    <option value="Ijin Keperluan Pribadi Mandiri">Ijin Keperluan Pribadi Mandiri</option>
                    <option value="Ijin Mengikuti Pendidikan">Ijin Mengikuti Pendidikan</option>
                    <option value="Ijin Musibah Keluarga">Ijin Musibah Keluarga</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={checkerIjinTanggalMulai}
                      onChange={(e) => setCheckerIjinTanggalMulai(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={checkerIjinTanggalSelesai}
                      onChange={(e) => setCheckerIjinTanggalSelesai(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-850 mb-1">
                    Jumlah Durasi Ijin (Hari)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      readOnly
                      value={checkerIjinJumlahHari}
                      className="w-24 h-9 px-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 focus:outline-none"
                    />
                    <span className="text-slate-500 font-medium">Hari (Terhitung otomatis dari rentang tanggal)</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Detail Keterangan</label>
                  <textarea
                    rows={3}
                    value={checkerIjinKeterangan}
                    onChange={(e) => setCheckerIjinKeterangan(e.target.value)}
                    placeholder="Tulis detail keterangan ijin..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCheckerIjinModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReviseSub(checkerIjinSub);
                    setIsReviseModalOpen(true);
                    setIsCheckerIjinModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl border border-amber-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Minta Revisi
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRejectSub(checkerIjinSub);
                    setIsRejectModalOpen(true);
                    setIsCheckerIjinModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-xl border border-rose-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <X className="w-3.5 h-3.5" /> Tolak
                </button>

                <button
                  type="button"
                  onClick={handleSaveCheckerIjin}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Save className="w-3.5 h-3.5 text-slate-600" /> Simpan Draft Koreksi
                </button>

                <button
                  type="button"
                  onClick={handleApproveWithCheckerIjinCorrection}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Check className="w-4 h-4" /> Setujui &amp; Teruskan ke Approval 1
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checker Sakit Edit & Correction Modal */}
      {isCheckerSakitModalOpen && checkerSakitSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-600" />
                Edit &amp; Koreksi Surat Sakit (Checker)
              </span>
              <button
                onClick={() => setIsCheckerSakitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 space-y-1">
                <p className="font-bold text-slate-900">{checkerSakitSub.employeeName} ({checkerSakitSub.employeeNip})</p>
                <p className="text-slate-600">Dokumen: {checkerSakitSub.nomorDokumen}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={checkerSakitTanggalMulai}
                      onChange={(e) => setCheckerSakitTanggalMulai(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={checkerSakitTanggalSelesai}
                      onChange={(e) => setCheckerSakitTanggalSelesai(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-850 mb-1">
                    Jumlah Durasi Sakit (Hari)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      readOnly
                      value={checkerSakitJumlahHari}
                      className="w-24 h-9 px-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 focus:outline-none"
                    />
                    <span className="text-slate-500 font-medium">Hari (Terhitung otomatis dari rentang tanggal)</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Instansi Kesehatan / Klinik</label>
                  <input
                    type="text"
                    value={checkerSakitKlinik}
                    onChange={(e) => setCheckerSakitKlinik(e.target.value)}
                    className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    placeholder="Contoh: RS Pertamedika, Klinik Sehat"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nama Dokter Pemeriksa</label>
                  <input
                    type="text"
                    value={checkerSakitDokter}
                    onChange={(e) => setCheckerSakitDokter(e.target.value)}
                    className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    placeholder="Nama Dokter Lengkap..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Diagnosa Singkat Penyakit</label>
                  <textarea
                    rows={2}
                    value={checkerSakitDiagnosa}
                    onChange={(e) => setCheckerSakitDiagnosa(e.target.value)}
                    placeholder="Tulis diagnosa penyakit singkat..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCheckerSakitModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReviseSub(checkerSakitSub);
                    setIsReviseModalOpen(true);
                    setIsCheckerSakitModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl border border-amber-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Minta Revisi
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRejectSub(checkerSakitSub);
                    setIsRejectModalOpen(true);
                    setIsCheckerSakitModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-xl border border-rose-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <X className="w-3.5 h-3.5" /> Tolak
                </button>

                <button
                  type="button"
                  onClick={handleSaveCheckerSakit}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Save className="w-3.5 h-3.5 text-slate-600" /> Simpan Draft Koreksi
                </button>

                <button
                  type="button"
                  onClick={handleApproveWithCheckerSakitCorrection}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Check className="w-4 h-4" /> Setujui &amp; Teruskan ke Approval 1
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checker SPPD Edit & Correction Modal */}
      {isCheckerSppdEditOpen && checkerSppdSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sky-600" />
                Edit &amp; Koreksi SPPD (Checker)
              </span>
              <button
                onClick={() => setIsCheckerSppdEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 space-y-1">
                <p className="font-bold text-slate-900">{checkerSppdSub.employeeName} ({checkerSppdSub.employeeNip})</p>
                <p className="text-slate-600">Dokumen: {checkerSppdSub.nomorDokumen}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Maksud Perjalanan Dinas</label>
                  <textarea
                    rows={2}
                    value={checkerSppdMaksud}
                    onChange={(e) => setCheckerSppdMaksud(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    placeholder="Maksud / keperluan perjalanan..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Kota Asal</label>
                    <input
                      type="text"
                      value={checkerSppdKotaAsal}
                      onChange={(e) => setCheckerSppdKotaAsal(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Kota Tujuan</label>
                    <input
                      type="text"
                      value={checkerSppdKotaTujuan}
                      onChange={(e) => setCheckerSppdKotaTujuan(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Tanggal Berangkat</label>
                    <input
                      type="date"
                      value={checkerSppdTanggalBerangkat}
                      onChange={(e) => setCheckerSppdTanggalBerangkat(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Tanggal Kembali</label>
                    <input
                      type="date"
                      value={checkerSppdTanggalKembali}
                      onChange={(e) => setCheckerSppdTanggalKembali(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Durasi (Hari)</label>
                    <input
                      type="number"
                      readOnly
                      value={checkerSppdDurasiHari}
                      className="w-full h-9 px-2 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Kategori SPPD</label>
                    <select
                      value={checkerSppdKategori}
                      onChange={(e) => setCheckerSppdKategori(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    >
                      <option value="Dalam Wilayah">Dalam Wilayah</option>
                      <option value="Luar Wilayah">Luar Wilayah</option>
                      <option value="Luar Negeri">Luar Negeri</option>
                    </select>
                  </div>
                </div>

                {/* Expenses list */}
                <div className="space-y-2 border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Rincian Komponen Biaya SPPD</label>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckerExpenses([
                          ...checkerExpenses,
                          { id: "exp-" + Date.now(), deskripsi: "Komponen Biaya SPPD", kategori: "Transportasi", nominal: 0 }
                        ]);
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold bg-sky-100 text-sky-800 hover:bg-sky-200 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tambah Item
                    </button>
                  </div>

                  {checkerExpenses.map((exp, idx) => (
                    <div key={exp.id} className="grid grid-cols-12 gap-1.5 items-center bg-white p-1 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        value={exp.deskripsi}
                        onChange={(e) => {
                          const newExp = [...checkerExpenses];
                          newExp[idx].deskripsi = e.target.value;
                          setCheckerExpenses(newExp);
                        }}
                        placeholder="Deskripsi Komponen..."
                        className="col-span-6 h-8 px-2 border border-slate-300 rounded-lg text-[10.5px] focus:outline-none"
                      />
                      <select
                        value={exp.kategori}
                        onChange={(e) => {
                          const newExp = [...checkerExpenses];
                          newExp[idx].kategori = e.target.value;
                          setCheckerExpenses(newExp);
                        }}
                        className="col-span-4 h-8 px-1 border border-slate-300 rounded-lg text-[10px] focus:outline-none cursor-pointer"
                      >
                        <option value="Transportasi">Transportasi</option>
                        <option value="Akomodasi">Akomodasi</option>
                        <option value="Uang Harian">Uang Harian</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setCheckerExpenses(checkerExpenses.filter((e) => e.id !== exp.id))}
                        className="col-span-2 text-rose-500 hover:text-rose-700 flex justify-center cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCheckerSppdEditOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReviseSub(checkerSppdSub);
                    setIsReviseModalOpen(true);
                    setIsCheckerSppdEditOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl border border-amber-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Minta Revisi
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRejectSub(checkerSppdSub);
                    setIsRejectModalOpen(true);
                    setIsCheckerSppdEditOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-xl border border-rose-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <X className="w-3.5 h-3.5" /> Tolak
                </button>

                <button
                  type="button"
                  onClick={handleSaveCheckerSppdDirect}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Save className="w-3.5 h-3.5 text-slate-600" /> Simpan Draft Koreksi
                </button>

                <button
                  type="button"
                  onClick={handleApproveWithCheckerSppdCorrection}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Check className="w-4 h-4" /> Setujui &amp; Teruskan ke Approval 1
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert / Notification Modal */}
      <AlertNotificationModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
      />
    </div>
  );
};
