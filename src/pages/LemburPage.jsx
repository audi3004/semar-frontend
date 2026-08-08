import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DataService } from "../services/dataService";
import { api } from "../services/api";
import { MasterDataService } from "../services/masterDataService";
import { SignatureModal } from "../components/common/SignatureModal";
import { DocumentViewerModal } from "../components/common/DocumentViewerModal";
import { RejectModal } from "../components/common/RejectModal";
import { RevisionModal } from "../components/common/RevisionModal";
import { AlertNotificationModal } from "../components/common/AlertNotificationModal";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import {
   validateLemburInput,
   validateLemburMaxHours,
   calculateEmployeeLemburAccumulation,
   getWeekRange,
} from "../utils/submissionValidation";
import { compressImageDataUrl } from "../utils/imageCompressor";
import {
   Clock,
   Plus,
   DollarSign,
   Calculator,
   Check,
   X,
   Eye,
   CheckCircle2,
   XCircle,
   Upload,
   FileCheck,
   RotateCcw,
   Edit3,
   AlertTriangle,
   Save,
   Send,
   Trash2,
} from "lucide-react";
import {
   formatRupiah,
   formatDateIndonesian,
   calculateHoursDifference,
   calculateOvertimeCost,
   getStatusBadgeColor,
   getStatusLabel,
} from "../utils/formatters";
import { DistributionPieChart } from "../components/charts/DistributionPieChart";
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3003").replace(/\/$/, "");
const CATEGORY_SEPARATOR = "|||";
const resolveFileUrl = (value) => value && !String(value).startsWith("http") ? `${API_ORIGIN}${value}` : value || "";
const dataUrlToFile = (dataUrl, filename) => {
   const [header, encoded] = dataUrl.split(",");
   const mime = header.match(/data:([^;]+)/)?.[1] || "image/png";
   const bytes = atob(encoded);
   const buffer = new Uint8Array(bytes.length);
   for (let index = 0; index < bytes.length; index += 1) buffer[index] = bytes.charCodeAt(index);
   return new File([buffer], filename, { type: mime });
};

const ActionTooltip = ({ text }) => (
   <span className="pointer-events-none absolute bottom-full left-1/2 z-[80] mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover/action:opacity-100">
      {text}
   </span>
);

const DetailItem = ({ label, value }) => (
   <div className="min-w-0 p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs">
      <p className="text-[9px] uppercase tracking-wider font-black text-slate-400">{label}</p>
      <p className="text-[11px] font-bold text-slate-800 mt-1 break-words">{value || "-"}</p>
   </div>
);

const FilePreview = ({ label, url, compact = false }) => {
   const isImage = Boolean(url && /\.(jpe?g|png|webp|gif)(?:\?|$)/i.test(url));
   return (
      <div className={`rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden ${compact ? "min-h-24" : "min-h-36"}`}>
         {isImage ? <img src={url} alt={label} className={`${compact ? "h-20" : "h-28"} w-full object-cover bg-white`} /> : <div className={`${compact ? "h-20" : "h-28"} flex items-center justify-center bg-white text-slate-300`}><FileCheck className="w-8 h-8" /></div>}
         <div className="p-2.5 flex items-center justify-between gap-2"><span className="text-[10px] font-bold text-slate-700 truncate">{label}</span>{url ? <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-[10px] font-black text-indigo-600 hover:text-indigo-800">Lihat</a> : <span className="text-[9px] text-slate-400">Belum ada</span>}</div>
      </div>
   );
};
const getSignatureField = (role = "") => ({
   maker: "maker_signature", checker: "checker_signature", verification: "verification_signature",
   approved1: "approval_1_signature", approved2: "approval_2_signature", approved3: "approval_3_signature",
}[role] || null);
const unpackCategory = (value = "") => {
   const [kategoriLembur = "", jenisPekerjaan = ""] = String(value).split(CATEGORY_SEPARATOR);
   return { kategoriLembur, jenisPekerjaan };
};
const mapApiLembur = (item) => {
   const legacyCategory = unpackCategory(item.kategori_lembur);
   const category = { kategoriLembur: legacyCategory.kategoriLembur, jenisPekerjaan: item.jenis_pekerjaan || legacyCategory.jenisPekerjaan };
   const statusCode = item.status?.kode_status || "DRAFT";
   return {
      ...item,
      id: String(item.id_lembur),
      type: "lembur",
      nomorDokumen: item.nomor_dokumen || `LMB-${String(item.id_lembur).padStart(6, "0")}`,
      employeeNip: item.petugas?.nip || "",
      employeeName: item.petugas?.nama || `Petugas #${item.id_petugas}`,
      employeeJabatan: item.petugas?.jabatan?.nama_jabatan || "-",
      unitUpt: item.petugas?.unit?.nama_unit || "-",
      garduInduk: item.petugas?.unit?.nama_unit || "-",
      tanggalPengajuan: String(item.created_at || item.tgl_lembur || "").slice(0, 10),
      tanggalLembur: item.tgl_lembur,
      jamMulai: String(item.jam_mulai || "").slice(0, 5),
      jamSelesai: String(item.jam_selesai || "").slice(0, 5),
      durasiJam: Number(item.total_jam || 0),
      ...category,
      areaGroup: item.area_group || "",
      isHariLibur: item.is_hari_libur === "Y",
      kegiatanDetail: item.detail_pekerjaan_lembur || "",
      petugasPendampingNip: item.petugasCuti?.nip || "",
      petugasPendampingNama: item.petugasCuti?.nama || "",
      fotoDokumentasi1Url: resolveFileUrl(item.foto_kegiatan_1),
      fotoDokumentasi2Url: resolveFileUrl(item.foto_kegiatan_2),
      dasarPerintahLemburUrl: resolveFileUrl(item.surat_perintah_lembur),
      dasarPerintahLemburName: String(item.surat_perintah_lembur || "").split("/").pop(),
      makerSignatureUrl: resolveFileUrl(item.maker_signature),
      checkerSignatureUrl: resolveFileUrl(item.checker_signature),
      verificationSignatureUrl: resolveFileUrl(item.verification_signature),
      approval1SignatureUrl: resolveFileUrl(item.approval_1_signature),
      approval2SignatureUrl: resolveFileUrl(item.approval_2_signature),
      approval3SignatureUrl: resolveFileUrl(item.approval_3_signature),
      jumlahJamKoreksi: item.jumlah_jam_koreksi == null ? null : Number(item.jumlah_jam_koreksi),
      catatanKoreksi: item.catatan_koreksi || "",
      status: statusCode.toLowerCase(),
      currentApproverRole: item.status?.role?.kode_role?.toLowerCase() || "maker",
      isFinal: item.status?.is_final === "Y",
   };
};
const OVERTIME_MAPPING = {
   "Pekerjaan Tower": [
      "Perbaikan Anomali Pentanahan",
      "Assesment Kondisi Tower",
      "Pengukuran Pentanahan",
   ],
   "Perbantuan Validasi ROW": ["-"],
   "Emergency / Pelacakan Gangguan": ["-"],
   Manuver: [
      "Manuver Konfigurasi",
      "Manuver Pemeliharaan",
      "Manuver Emergency",
   ],
   "005 - Piket Tanggal Merah / Cuti Pengganti": [
      "Pengganti Piket (Operator sedang cuti)",
      "Siaga / Libur Nasional",
   ],
};
const getDynamicOvertimeMapping = () => {
   try {
      const list = MasterDataService.getAll("m_jenis_lembur").data;
      if (list && list.length > 0) {
         const mapping = {};
         list.forEach((item) => {
            const cat = item.jenis_lembur;
            const job = item.jenis_pekerjaan;
            if (job === "Pengganti Piket") return;
            if (!mapping[cat]) {
               mapping[cat] = [];
            }
            if (job && !mapping[cat].includes(job)) {
               mapping[cat].push(job);
            }
         });
         return mapping;
      }
   } catch (err) {
      console.error("Error getting dynamic overtime mapping:", err);
   }
   return OVERTIME_MAPPING;
};
export const LemburPage = ({
   currentUser,
   submissions,
   settings,
   onRefreshData,
}) => {
   const [activeSubTab, setActiveSubTab] = useState("daftar");
   const [isNewModalOpen, setIsNewModalOpen] = useState(false);
   const [selectedDocSub, setSelectedDocSub] = useState(null);
   const [detailSub, setDetailSub] = useState(null);
   const [searchParams, setSearchParams] = useSearchParams();
   const [filterStatus, setFilterStatus] = useState("all");
   const [tanggalLembur, setTanggalLembur] = useState("");
   const [jamMulai, setJamMulai] = useState("");
   const [jamSelesai, setJamSelesai] = useState("");
   const [kategoriLembur, setKategoriLembur] = useState("");
   const [jenisPekerjaan, setJenisPekerjaan] = useState("");
   const [areaGroup, setAreaGroup] = useState("");
   const [isHariLibur, setIsHariLibur] = useState(false);
   const [holidays, setHolidays] = useState([]);
   const [kegiatanDetail, setKegiatanDetail] = useState("");
   const [petugasPendampingNip, setPetugasPendampingNip] = useState("");
   const [petugasPendampingError, setPetugasPendampingError] = useState("");
   const [fotoDokumentasi1Url, setFotoDokumentasi1Url] = useState("");
   const [fotoDokumentasi2Url, setFotoDokumentasi2Url] = useState("");
   const [dasarPerintahLemburUrl, setDasarPerintahLemburUrl] = useState("");
   const [dasarPerintahLemburName, setDasarPerintahLemburName] = useState("");
   const [makerSignatureUrl, setMakerSignatureUrl] = useState("");
   const [fotoKegiatan1File, setFotoKegiatan1File] = useState(null);
   const [fotoKegiatan2File, setFotoKegiatan2File] = useState(null);
   const [suratPerintahFile, setSuratPerintahFile] = useState(null);
   const [apiLembur, setApiLembur] = useState([]);
   const [apiOfficers, setApiOfficers] = useState([]);
   const [isSignModalOpen, setIsSignModalOpen] = useState(false);
   const [editingSub, setEditingSub] = useState(null);
   const [alertModal, setAlertModal] = useState({
      isOpen: false,
      type: "info",
      title: "",
      message: "",
   });

   // Checker Correction Modal States (Task 3 & Task 4)
   const [checkerReviewSub, setCheckerReviewSub] = useState(null);
   const [jumlahJamKoreksiInput, setJumlahJamKoreksiInput] = useState(4);
   const [catatanKoreksiInput, setCatatanKoreksiInput] = useState("");
   const [isCheckerModalOpen, setIsCheckerModalOpen] = useState(false);
   const [checkerExtraData, setCheckerExtraData] = useState({});

   // Approval Modal States
   const [approveSub, setApproveSub] = useState(null);
   const [isApproveSignOpen, setIsApproveSignOpen] = useState(false);
   const [rejectSub, setRejectSub] = useState(null);
   const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
   const [revisionSub, setRevisionSub] = useState(null);
   const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

   const editIdParam = searchParams.get("editId");

   const loadLemburFromApi = async () => {
      try {
         const idPetugas = currentUser?.id_petugas || currentUser?.petugas?.id_petugas;
         const [lemburRows, petugasRows] = await Promise.all([
            idPetugas ? api.getLemburByPetugas(idPetugas) : api.getLembur(),
            api.getPetugas(),
         ]);
         setApiLembur((Array.isArray(lemburRows) ? lemburRows : []).map(mapApiLembur));
         setApiOfficers(Array.isArray(petugasRows) ? petugasRows : []);
      } catch (error) {
         setAlertModal({ isOpen: true, type: "error", title: "Gagal Memuat Lembur", message: error.response?.data?.message || "Data lembur dari API gagal dimuat." });
      }
   };

   useEffect(() => { loadLemburFromApi(); }, [currentUser?.id_petugas, currentUser?.petugas?.id_petugas]);

   useEffect(() => {
      if (editIdParam) {
         const sub = apiLembur.find((s) => s.id === editIdParam);
         if (sub) {
            handleOpenEditModal(sub);
            setSearchParams(
               (prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete("editId");
                  return next;
               },
               { replace: true },
            );
         }
      }
   }, [editIdParam, apiLembur]);

   useEffect(() => {
      const fetchHolidays = async () => {
         try {
            const res = await MasterDataService.fetchApiAll("m_hari_libur", {
               limit: 1000,
            });
            setHolidays(res.data || []);
         } catch (err) {
            console.warn(
               "Gagal fetch master hari libur via API, use local fallback",
               err,
            );
            const resFallback = MasterDataService.getAll("m_hari_libur", {
               limit: 1000,
            });
            setHolidays(resFallback?.data || []);
         }
      };
      fetchHolidays();
   }, []);

   if (!currentUser) return <LoadingSkeleton variant="dashboard" />;

   const mapping = getDynamicOvertimeMapping();
   const allOfficers = apiOfficers
      .filter((item) => item.is_active !== "N" && item.nip !== currentUser?.nip)
      .map((item) => ({ ...item, name: item.nama, garduInduk: item.unit?.nama_unit, jabatan: item.jabatan?.nama_jabatan, role: "maker" }));

   // Derived conditional flags based on Jenis Pekerjaan
   const isOperatorCuti =
      jenisPekerjaan === "Pengganti Piket (Operator sedang cuti)";
   const isSiagaLibur = jenisPekerjaan === "Siaga / Libur Nasional";

   // Task 2: Filter Pendamping / Rekan Lembur by same Gardu Induk as applicant & status TAD if Operator Cuti
   const filteredOfficers = allOfficers.filter((u) => {
      if (isOperatorCuti) {
         const currentUnitId = currentUser?.id_unit || currentUser?.petugas?.id_unit || currentUser?.pegawai?.id_unit;
         const matchGI = currentUnitId
            ? String(u.id_unit) === String(currentUnitId)
            : (!currentUser?.garduInduk || currentUser.garduInduk === "Semua GI" || u.garduInduk === currentUser.garduInduk);

         const isTad =
            u.status === "TAD" ||
            u.employeeType === "TAD" ||
            u.role === "maker" ||
            u.role === "MAKER" ||
            (u.jabatan &&
               (u.jabatan.toLowerCase().includes("operator") ||
                  u.jabatan.toLowerCase().includes("teknisi") ||
                  u.jabatan.toLowerCase().includes("tad")));

         return matchGI && isTad;
      }
      return true;
   });

   // Task 3: Helper to check officer leave/permission/sick status on target date
   const getOfficerLeaveStatus = (nip, targetDate) => {
      if (!nip || !submissions || !Array.isArray(submissions)) return null;
      const activeLeave = submissions.find((s) => {
         if (s.employeeNip !== nip) return false;
         const sLower = s.status ? s.status.toLowerCase() : "";
         if (sLower === "rejected" || sLower === "cancelled") return false;
         if (s.type === "cuti" || s.type === "ijin" || s.type === "sakit") {
            const start =
               s.tanggalMulai || s.tanggalPengajuan || s.tanggalLembur;
            const end = s.tanggalSelesai || start;
            if (targetDate && start && end) {
               return targetDate >= start && targetDate <= end;
            }
            return true;
         }
         return false;
      });
      return activeLeave ? activeLeave.type : null;
   };

   // Task 4: Auto-check isHariLibur when jenisPekerjaan === "Siaga / Libur Nasional" and tanggalLembur matches master holiday
   useEffect(() => {
      if (jenisPekerjaan === "Siaga / Libur Nasional" && tanggalLembur) {
         const hInfo = getHolidayInfo(tanggalLembur);
         setIsHariLibur(!!hInfo);
      }
   }, [jenisPekerjaan, tanggalLembur, holidays]);

   // Kondisi 1: "Pengganti Piket (Operator sedang cuti)" -> Checkbox Hidden, Pendamping Visible & Required
   // Kondisi 2: "Siaga / Libur Nasional" -> Checkbox Visible & Default Terpilih (Mandatory), Pendamping Hidden
   // Kondisi 3: Default / Option Lain -> Checkbox Hidden (standar), Pendamping Hidden
   const showLemburCheckbox = isSiagaLibur;
   const showPetugasPendamping = isOperatorCuti;
   const isPetugasPendampingRequired = isOperatorCuti;

   // Estimasi Biaya Rumus Rupiah hanya muncul dari proses Checker sampai Approver 3
   const isApprovalRole = [
      "checker",
      "verification",
      "approved1",
      "approved2",
      "approved3",
      "admin",
   ].includes(currentUser?.role);

   const lemburSubmissions = apiLembur;
   const validationSubmissions = [
      ...(submissions || []).filter((item) => item.type !== "lembur"),
      ...apiLembur,
   ];

   const displaySubmissions = lemburSubmissions.filter((s) => {
      const sLower = s.status ? s.status.toLowerCase() : "";
      if (filterStatus === "draft") {
         return sLower === "draft";
      }
      if (filterStatus === "revision") {
         return sLower === "revision" || sLower === "revision_required";
      }
      if (filterStatus === "rejected") {
         return sLower === "rejected";
      }
      if (filterStatus === "pending") {
         return sLower.startsWith("pending_");
      }
      if (filterStatus === "approved") {
         return sLower === "approved";
      }
      return true;
   });

   const getHolidayInfo = (dateStr) => {
      if (!dateStr || !Array.isArray(holidays)) return null;
      return holidays.find((h) => h.tgl_libur === dateStr) || null;
   };

   const handleOpenEditModal = (sub) => {
      setEditingSub(sub);
      setTanggalLembur(sub.tanggalLembur || "");
      setJamMulai(sub.jamMulai || "");
      setJamSelesai(sub.jamSelesai || "");
      setKategoriLembur(sub.kategoriLembur || "");
      setJenisPekerjaan(sub.jenisPekerjaan || "");
      setAreaGroup(sub.areaGroup || "");
      setIsHariLibur(!!sub.isHariLibur);
      setKegiatanDetail(sub.kegiatanDetail || "");
      setPetugasPendampingNip(sub.petugasPendampingNip || "");
      setPetugasPendampingError("");
      setFotoDokumentasi1Url(sub.fotoDokumentasi1Url || "");
      setFotoDokumentasi2Url(sub.fotoDokumentasi2Url || "");
      setDasarPerintahLemburUrl(sub.dasarPerintahLemburUrl || "");
      setDasarPerintahLemburName(sub.dasarPerintahLemburName || "");
      setMakerSignatureUrl(sub.makerSignatureUrl || "");
      setFotoKegiatan1File(null);
      setFotoKegiatan2File(null);
      setSuratPerintahFile(null);
      setIsNewModalOpen(true);
   };
   const handleOpenCreateModal = () => {
      setEditingSub(null);
      setTanggalLembur("");
      setJamMulai("");
      setJamSelesai("");
      setKategoriLembur("");
      setJenisPekerjaan("");
      setAreaGroup("");
      setIsHariLibur(false);
      setKegiatanDetail("");
      setPetugasPendampingNip("");
      setPetugasPendampingError("");
      setFotoDokumentasi1Url("");
      setFotoDokumentasi2Url("");
      setDasarPerintahLemburUrl("");
      setDasarPerintahLemburName("");
      setMakerSignatureUrl("");
      setFotoKegiatan1File(null);
      setFotoKegiatan2File(null);
      setSuratPerintahFile(null);
      setIsNewModalOpen(true);
   };

   const handleConfirmRevision = async (notes, targetRole) => {
      if (!revisionSub) return;
      try {
         await api.reviseLembur(revisionSub.id_lembur, notes, targetRole || "maker");
         setIsRevisionModalOpen(false); setRevisionSub(null); await loadLemburFromApi();
      } catch (error) { setAlertModal({ isOpen: true, type: "error", title: "Gagal Meminta Revisi", message: error.response?.data?.message || error.message }); }
   };
   const calculatedDuration = calculateHoursDifference(jamMulai, jamSelesai);
   const estimatedCost = calculateOvertimeCost(
      currentUser?.gajiPokok || 55e5,
      calculatedDuration,
      showLemburCheckbox ? isHariLibur : false,
      settings?.overtimeFormula,
   );

   const handleJenisPekerjaanChange = (
      newVal,
      selectedDate = tanggalLembur,
   ) => {
      setJenisPekerjaan(newVal);
      setPetugasPendampingError("");

      // Auto-resetting state when changing Jenis Pekerjaan
      // 1. Reset Petugas Pendamping if not Kondisi 1
      if (newVal !== "Pengganti Piket (Operator sedang cuti)") {
         setPetugasPendampingNip("");
      }
      // 2. Set isHariLibur to true if newVal is "Siaga / Libur Nasional" and selected date matches a master holiday
      if (newVal === "Siaga / Libur Nasional") {
         const hInfo = getHolidayInfo(selectedDate);
         setIsHariLibur(!!hInfo);
      } else {
         setIsHariLibur(false);
      }

      // Task 1 & Task 2: Default jam lembur set to 8 jam (08:00 - 16:00) jika Pengganti Piket / Siaga Libur
      if (
         newVal === "Pengganti Piket (Operator sedang cuti)" ||
         newVal === "Siaga / Libur Nasional"
      ) {
         if (!jamMulai || !jamSelesai) {
            setJamMulai("08:00");
            setJamSelesai("16:00");
         }
      }
   };

   const handleTanggalLemburChange = (val) => {
      setTanggalLembur(val);
      if (jenisPekerjaan === "Siaga / Libur Nasional") {
         const hInfo = getHolidayInfo(val);
         setIsHariLibur(!!hInfo);
      }
   };

   const handleKategoriChange = (val) => {
      setKategoriLembur(val);
      const subJobs = mapping[val] || ["-"];
      const defaultJob = subJobs[0] || "-";
      handleJenisPekerjaanChange(defaultJob);
   };

   const handleFileUpload = (e, setUrl, setName) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
         setAlertModal({ isOpen: true, type: "error", title: "File Terlalu Besar", message: `${file.name} melebihi batas maksimum 5 MB.` });
         e.target.value = "";
         return;
      }
      if (setUrl === setFotoDokumentasi1Url) setFotoKegiatan1File(file);
      if (setUrl === setFotoDokumentasi2Url) setFotoKegiatan2File(file);
      if (setUrl === setDasarPerintahLemburUrl) setSuratPerintahFile(file);
      if (setName) setName(file.name);
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();
      reader.onloadend = async () => {
         const rawResult = reader.result;
         if (isImage && typeof rawResult === "string") {
            const compressed = await compressImageDataUrl(rawResult, 800, 0.7);
            setUrl(compressed);
         } else {
            setUrl(rawResult);
         }
      };
      reader.readAsDataURL(file);
   };

   const buildApiPayload = () => {
      const idPetugas = currentUser?.id_petugas || currentUser?.petugas?.id_petugas;
      const partner = allOfficers.find((item) => item.nip === petugasPendampingNip);
      const formData = new FormData();
      formData.append("id_petugas", String(idPetugas || ""));
      if (showPetugasPendamping && partner?.id_petugas) formData.append("id_petugas_cuti", String(partner.id_petugas));
      formData.append("tgl_lembur", tanggalLembur);
      formData.append("jam_mulai", jamMulai);
      formData.append("jam_selesai", jamSelesai);
      formData.append("kategori_lembur", kategoriLembur);
      formData.append("jenis_pekerjaan", jenisPekerjaan);
      formData.append("area_group", areaGroup);
      formData.append("is_hari_libur", isHariLibur ? "Y" : "N");
      formData.append("detail_pekerjaan_lembur", kegiatanDetail);
      formData.append("keterangan", `${kategoriLembur} - ${jenisPekerjaan} (${calculatedDuration} Jam)`);
      if (fotoKegiatan1File) formData.append("foto_kegiatan_1", fotoKegiatan1File);
      if (fotoKegiatan2File) formData.append("foto_kegiatan_2", fotoKegiatan2File);
      if (suratPerintahFile) formData.append("surat_perintah_lembur", suratPerintahFile);
      if (makerSignatureUrl?.startsWith("data:")) formData.append("maker_signature", dataUrlToFile(makerSignatureUrl, "maker-signature.png"));
      return formData;
   };

   const saveToApi = async ({ release = false } = {}) => {
      const idPetugas = currentUser?.id_petugas || currentUser?.petugas?.id_petugas;
      if (!idPetugas) throw new Error("Akun login belum terhubung ke data petugas (id_petugas).");
      const isCreate = !editingSub?.id_lembur;
      if (isCreate && (!fotoKegiatan1File || !fotoKegiatan2File || !suratPerintahFile)) {
         throw new Error("Backend mewajibkan Foto Kegiatan 1, Foto Kegiatan 2, dan Surat Perintah Lembur saat membuat data.");
      }
      const response = isCreate
         ? await api.createLembur(buildApiPayload())
         : await api.updateLembur(editingSub.id_lembur, buildApiPayload());
      const savedId = response?.data?.id_lembur || response?.id_lembur || editingSub?.id_lembur;
      if (release && savedId) await api.releaseLembur(savedId);
      await loadLemburFromApi();
      return savedId;
   };

   const handleSaveDraftLembur = async (e) => {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }
      setPetugasPendampingError("");

      if (isPetugasPendampingRequired && !petugasPendampingNip) {
         setPetugasPendampingError(
            "Petugas Pendamping / Rekan Lembur wajib dipilih untuk Pengganti Piket (Operator sedang cuti)",
         );
         return;
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const valResult = validateLemburInput(tanggalLembur, todayStr);
      if (!valResult.isValid) {
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Simpan Draft Lembur",
            message: valResult.message,
         });
         return;
      }

      // Task 1: Validation for 4h/day and 18h/week max limits (passed up to 8h for Pengganti Piket / Siaga Libur)
      const maxVal = validateLemburMaxHours(
         calculatedDuration,
         validationSubmissions,
         currentUser.nip,
         tanggalLembur,
         editingSub?.id,
         jenisPekerjaan,
      );
      if (!maxVal.isValid) {
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Limit Jam Lembur",
            message: maxVal.message,
         });
         return;
      }

      const finalPartnerNip = showPetugasPendamping ? petugasPendampingNip : "";
      const finalIsHariLibur = showLemburCheckbox ? isHariLibur : false;
      const subDesc =
         jenisPekerjaan && jenisPekerjaan !== "-"
            ? `${kategoriLembur} - ${jenisPekerjaan}`
            : kategoriLembur;
      const partnerObj = allOfficers.find((u) => u.nip === finalPartnerNip);

      const payload = {
         ...(editingSub || {}),
         id: editingSub ? editingSub.id : "sub-" + Date.now(),
         nomorDokumen: editingSub
            ? editingSub.nomorDokumen
            : `LMB/2026/${new Date().getMonth() + 1}/${currentUser.nip}/${Math.floor(100 + Math.random() * 900)}`,
         type: "lembur",
         employeeNip: currentUser.nip,
         employeeName: currentUser.name,
         employeeJabatan: currentUser.jabatan,
         unitUpt: currentUser.unitUpt,
         unitUltg: currentUser.unitUltg,
         garduInduk: currentUser.garduInduk,
         tanggalPengajuan: editingSub
            ? editingSub.tanggalPengajuan || todayStr
            : todayStr,
         tanggalLembur,
         jamMulai,
         jamSelesai,
         durasiJam: calculatedDuration,
         kategoriLembur,
         jenisPekerjaan,
         areaGroup,
         isHariLibur: finalIsHariLibur,
         estimasiBiayaRupiah: estimatedCost,
         kegiatanDetail,
         petugasPendampingNip: partnerObj?.nip || "",
         petugasPendampingNama: partnerObj?.name || "",
         fotoDokumentasi1Url,
         fotoDokumentasi2Url,
         dasarPerintahLemburUrl,
         dasarPerintahLemburName,
         makerSignatureUrl,
         status: "draft",
         currentApproverRole: "maker",
         keterangan: `${subDesc} (${calculatedDuration} Jam)`,
      };

      try {
         const savedId = await saveToApi();
         payload.id = String(savedId);
         payload.nomorDokumen = `LMB-${String(savedId).padStart(6, "0")}`;
      } catch (error) {
         setAlertModal({ isOpen: true, type: "error", title: "Gagal Simpan Draft Lembur", message: error.response?.data?.message || error.message });
         return;
      }
      setIsNewModalOpen(false);
      setEditingSub(null);
      setAlertModal({
         isOpen: true,
         type: "success",
         title: "Simpan Draft Berhasil",
         message: `Draft pengajuan lembur (${payload.nomorDokumen}) berhasil disimpan sebagai draft. Anda dapat memperbarui/mengirimkannya kapan saja.`,
      });
      onRefreshData?.();
   };

   const handleCreateLembur = async (e) => {
      e.preventDefault();
      setPetugasPendampingError("");

      if (
         !tanggalLembur ||
         !areaGroup ||
         !jamMulai ||
         !jamSelesai ||
         !kategoriLembur ||
         !jenisPekerjaan ||
         !dasarPerintahLemburUrl ||
         !kegiatanDetail
      ) {
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Kirim Pengajuan Lembur",
            message:
               "Semua kolom formulir (Tanggal Lembur, Group Area, Jam Mulai, Jam Selesai, Kategori Pekerjaan, Jenis Pekerjaan, Upload File Dasar Perintah Lembur, dan Detail Rincian Pekerjaan) harus terisi dan lengkap sebelum dikirim.",
         });
         return;
      }
      if (!makerSignatureUrl) {
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Kirim Pengajuan Lembur",
            message:
               "Tandatangan Pemohon wajib dibubuhkan sebelum mengirim pengajuan.",
         });
         return;
      }

      if (isPetugasPendampingRequired && !petugasPendampingNip) {
         setPetugasPendampingError(
            "Petugas Pendamping / Rekan Lembur wajib dipilih untuk Pengganti Piket (Operator sedang cuti)",
         );
         return;
      }

      if (kategoriLembur !== "Piket Tanggal Merah / Cuti Pengganti") {
         if (!fotoDokumentasi1Url || !fotoDokumentasi2Url) {
            setAlertModal({
               isOpen: true,
               type: "error",
               title: "Gagal Kirim Pengajuan Lembur",
               message:
                  "Foto Dokumentasi Kegiatan 1 dan Foto Dokumentasi Kegiatan 2 wajib diupload untuk kategori pekerjaan ini.",
            });
            return;
         }
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const valResult = validateLemburInput(tanggalLembur, todayStr);
      if (!valResult.isValid) {
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Kirim Pengajuan Lembur",
            message: valResult.message,
         });
         return;
      }

      // Task 1: Validation for 4h/day and 18h/week max limits (passed up to 8h for Pengganti Piket / Siaga Libur)
      const maxVal = validateLemburMaxHours(
         calculatedDuration,
         validationSubmissions,
         currentUser.nip,
         tanggalLembur,
         editingSub?.id,
         jenisPekerjaan,
      );
      if (!maxVal.isValid) {
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Pembatasan Jam Lembur",
            message: maxVal.message,
         });
         return;
      }

      const finalPartnerNip = showPetugasPendamping ? petugasPendampingNip : "";
      const finalIsHariLibur = showLemburCheckbox ? isHariLibur : false;
      const subDesc =
         jenisPekerjaan && jenisPekerjaan !== "-"
            ? `${kategoriLembur} - ${jenisPekerjaan}`
            : kategoriLembur;
      const partnerObj = allOfficers.find((u) => u.nip === finalPartnerNip);

      // Validasi pembatasan pengajuan ganda pada tanggal yang masih aktif
      const checkOverlap = DataService.checkActiveSubmissionOverlap(
         currentUser.nip,
         tanggalLembur,
         tanggalLembur,
         editingSub ? editingSub.id : null,
      );
      if (checkOverlap.isOverlapping) {
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Mengajukan - Tanggal Sudah Memiliki Pengajuan Aktif",
            message: checkOverlap.message,
         });
         return;
      }

      try {
         await saveToApi({ release: true });
         setIsNewModalOpen(false);
         setEditingSub(null);
         setAlertModal({ isOpen: true, type: "success", title: "Pengajuan Berhasil Dikirim", message: "Pengajuan lembur berhasil disimpan dan diteruskan ke tahap berikutnya." });
         setKegiatanDetail(""); setFotoDokumentasi1Url(""); setFotoDokumentasi2Url(""); setDasarPerintahLemburUrl(""); setDasarPerintahLemburName(""); setPetugasPendampingNip("");
         onRefreshData?.();
      } catch (error) {
         setAlertModal({ isOpen: true, type: "error", title: "Gagal Kirim Pengajuan Lembur", message: error.response?.data?.message || error.message });
      }
      return;

      if (editingSub) {
         const updatedFields = {
            tanggalLembur,
            jamMulai,
            jamSelesai,
            durasiJam: calculatedDuration,
            kategoriLembur,
            jenisPekerjaan,
            areaGroup,
            isHariLibur: finalIsHariLibur,
            estimasiBiayaRupiah: estimatedCost,
            kegiatanDetail,
            petugasPendampingNip: partnerObj?.nip || "",
            petugasPendampingNama: partnerObj?.name || "",
            fotoDokumentasi1Url,
            fotoDokumentasi2Url,
            dasarPerintahLemburUrl,
            dasarPerintahLemburName,
            makerSignatureUrl,
            status: "pending_checker",
            currentApproverRole: "checker",
            keterangan: `${subDesc} (${calculatedDuration} Jam)`,
         };
         DataService.resubmitSubmission(
            editingSub.id,
            updatedFields,
            currentUser,
         );
         setIsNewModalOpen(false);
         setEditingSub(null);
         setAlertModal({
            isOpen: true,
            type: "success",
            title: "Pengajuan Berhasil Dikirim",
            message:
               "Pengajuan lembur berhasil dikirim ke TL PLN (Checker) untuk direview.",
         });
         onRefreshData();
         return;
      }

      const newSub = {
         id: "sub-" + Date.now(),
         nomorDokumen: `LMB/2026/${new Date().getMonth() + 1}/${currentUser.nip}/${Math.floor(100 + Math.random() * 900)}`,
         type: "lembur",
         employeeNip: currentUser.nip,
         employeeName: currentUser.name,
         employeeJabatan: currentUser.jabatan,
         unitUpt: currentUser.unitUpt,
         unitUltg: currentUser.unitUltg,
         garduInduk: currentUser.garduInduk,
         tanggalPengajuan: todayStr,
         tanggalLembur,
         jamMulai,
         jamSelesai,
         durasiJam: calculatedDuration,
         kategoriLembur,
         jenisPekerjaan,
         areaGroup,
         isHariLibur: finalIsHariLibur,
         estimasiBiayaRupiah: estimatedCost,
         kegiatanDetail,
         petugasPendampingNip: partnerObj?.nip || "",
         petugasPendampingNama: partnerObj?.name || "",
         fotoDokumentasi1Url,
         fotoDokumentasi2Url,
         dasarPerintahLemburUrl,
         dasarPerintahLemburName,
         makerSignatureUrl,
         status: "pending_checker",
         currentApproverRole: "checker",
         keterangan: `${subDesc} (${calculatedDuration} Jam)`,
         approvalSteps: [
            {
               role: "checker",
               roleLabel: "TL PLN (Checker)",
               status: "pending",
            },
            {
               role: "verification",
               roleLabel: "AMN PLN (Verifikasi)",
               status: "pending",
            },
            {
               role: "approved1",
               roleLabel: "MAN PLN (Approved 1)",
               status: "pending",
            },
            {
               role: "approved2",
               roleLabel: "TL ES (Approved 2)",
               status: "pending",
            },
            {
               role: "approved3",
               roleLabel: "AMN ES (Approved 3)",
               status: "pending",
            },
         ],
      };
      DataService.createSubmission(newSub, currentUser);
      setIsNewModalOpen(false);
      setAlertModal({
         isOpen: true,
         type: "success",
         title: "Pengajuan Berhasil Dikirim",
         message:
            "Pengajuan lembur berhasil dikirim ke TL PLN (Checker) untuk direview.",
      });
      setKegiatanDetail("");
      setFotoDokumentasi1Url("");
      setFotoDokumentasi2Url("");
      setDasarPerintahLemburUrl("");
      setDasarPerintahLemburName("");
      setPetugasPendampingNip("");
      onRefreshData();
   };

   const handleSubmitDraftDirectly = async (sub) => {
      if (
         !sub.tanggalLembur ||
         !sub.jamMulai ||
         !sub.jamSelesai ||
         !sub.kegiatanDetail ||
         !sub.makerSignatureUrl
      ) {
         handleOpenEditModal(sub);
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Formulir Belum Lengkap",
            message:
               "Pengajuan lembur ini belum lengkap. Harap lengkapi semua kolom formulir dan tandatangan terlebih dahulu sebelum mengirim.",
         });
         return;
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      const valResult = validateLemburInput(sub.tanggalLembur, todayStr);
      if (!valResult.isValid) {
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Kirim Pengajuan Lembur",
            message: valResult.message,
         });
         return;
      }

      const effDur =
         sub.jumlahJamKoreksi !== undefined && sub.jumlahJamKoreksi !== null
            ? sub.jumlahJamKoreksi
            : sub.durasiJam;
      const maxVal = validateLemburMaxHours(
         effDur,
         validationSubmissions,
         currentUser.nip,
         sub.tanggalLembur,
         sub.id,
         sub.jenisPekerjaan,
      );
      if (!maxVal.isValid) {
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Limit Jam Lembur",
            message: maxVal.message,
         });
         return;
      }

      try { await api.releaseLembur(sub.id_lembur); await loadLemburFromApi(); }
      catch (error) { setAlertModal({ isOpen: true, type: "error", title: "Gagal Kirim Pengajuan", message: error.response?.data?.message || error.message }); return; }
      setAlertModal({
         isOpen: true,
         type: "success",
         title: "Pengajuan Berhasil Dikirim",
         message: `Draft pengajuan lembur (${sub.nomorDokumen}) berhasil dikirim ke TL PLN (Checker).`,
      });
      onRefreshData?.();
   };

   // --- CHECKER (TL PLN) CORRECTION HANDLERS (Task 3 & 4) ---
   const handleOpenCheckerModal = (sub) => {
      setCheckerReviewSub(sub);
      const initialHours =
         sub.jumlahJamKoreksi !== undefined && sub.jumlahJamKoreksi !== null
            ? sub.jumlahJamKoreksi
            : sub.durasiJam;
      setJumlahJamKoreksiInput(initialHours);
      setCatatanKoreksiInput(sub.catatanKoreksi || "");
      setIsCheckerModalOpen(true);
   };

   const handleSaveCheckerDraft = (e) => {
      if (e) e.preventDefault();
      if (!checkerReviewSub) return;

      const corrNum = Number(jumlahJamKoreksiInput) || 0;
      const valRes = validateLemburMaxHours(
         corrNum,
         validationSubmissions,
         checkerReviewSub.employeeNip,
         checkerReviewSub.tanggalLembur,
         checkerReviewSub.id,
         checkerReviewSub.jenisPekerjaan,
      );

      if (!valRes.isValid) {
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Limits Jam Lembur (Checker)",
            message: valRes.message,
         });
         return;
      }

      const newEstCost = calculateOvertimeCost(
         checkerReviewSub.employeeGajiPokok || 55e5,
         corrNum,
         checkerReviewSub.isHariLibur,
         settings.overtimeFormula,
      );

      DataService.saveCheckerDraftCorrection(
         checkerReviewSub.id,
         corrNum,
         catatanKoreksiInput,
         currentUser,
         newEstCost,
      );

      setIsCheckerModalOpen(false);
      setAlertModal({
         isOpen: true,
         type: "success",
         title: "Draft Koreksi Berhasil Disimpan",
         message: `Draft koreksi jam lembur (${corrNum} Jam) untuk dokumen ${checkerReviewSub.nomorDokumen} berhasil disimpan as draft. Anda dapat mengedit/memperbaruinya kapan saja sebelum menyetujui pengajuan.`,
      });
      onRefreshData();
   };

   const handleApproveWithCheckerCorrection = () => {
      if (!checkerReviewSub) return;

      const corrNum = Number(jumlahJamKoreksiInput) || 0;
      const valRes = validateLemburMaxHours(
         corrNum,
         validationSubmissions,
         checkerReviewSub.employeeNip,
         checkerReviewSub.tanggalLembur,
         checkerReviewSub.id,
         checkerReviewSub.jenisPekerjaan,
      );

      if (!valRes.isValid) {
         setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Persetujuan Koreksi Lembur",
            message: valRes.message,
         });
         return;
      }

      const newEstCost = calculateOvertimeCost(
         checkerReviewSub.employeeGajiPokok || 55e5,
         corrNum,
         checkerReviewSub.isHariLibur,
         settings.overtimeFormula,
      );

      setApproveSub(checkerReviewSub);
      setCheckerExtraData({
         jumlahJamKoreksi: corrNum,
         estimasiBiayaRupiah: newEstCost,
         catatanKoreksi: catatanKoreksiInput,
         checkerDraftCorrection: false,
      });
      setIsCheckerModalOpen(false);
      setIsApproveSignOpen(true);
   };

   const handleConfirmReject = async (notes) => {
      if (!rejectSub) return;
      try {
         await api.rejectLembur(rejectSub.id_lembur, notes);
         setIsRejectModalOpen(false); setRejectSub(null); await loadLemburFromApi(); onRefreshData?.();
      } catch (error) { setAlertModal({ isOpen: true, type: "error", title: "Gagal Menolak Lembur", message: error.response?.data?.message || error.message }); }
   };
   const handleResubmit = async (sub) => {
      try { await api.releaseLembur(sub.id_lembur); await loadLemburFromApi(); onRefreshData?.(); }
      catch (error) { setAlertModal({ isOpen: true, type: "error", title: "Gagal Mengirim Ulang", message: error.response?.data?.message || error.message }); }
   };
   const handleApproveSignatureSave = async (dataUrl) => {
      if (!approveSub) return;
      let updatedSub;
      try {
         const workflowPayload = new FormData();
         const signatureField = getSignatureField(currentUser?.role);
         if (signatureField && dataUrl?.startsWith("data:")) workflowPayload.append(signatureField, dataUrlToFile(dataUrl, `${signatureField}.png`));
         if (checkerExtraData.jumlahJamKoreksi != null) workflowPayload.append("jumlah_jam_koreksi", String(checkerExtraData.jumlahJamKoreksi));
         if (checkerExtraData.catatanKoreksi) workflowPayload.append("catatan_koreksi", checkerExtraData.catatanKoreksi);
         const response = await api.releaseLembur(approveSub.id_lembur, workflowPayload);
         updatedSub = mapApiLembur(response?.data || response); await loadLemburFromApi();
      }
      catch (error) { setAlertModal({ isOpen: true, type: "error", title: "Gagal Memproses Lembur", message: error.response?.data?.message || error.message }); return; }
      setIsApproveSignOpen(false);
      setApproveSub(null);
      setCheckerExtraData({});

      if (updatedSub) {
         if (
            updatedSub.status === "APPROVED" ||
            currentUser.role === "approved3"
         ) {
            setAlertModal({
               isOpen: true,
               type: "success",
               title: "Proses Selesai",
               message: `Dokumen ${updatedSub.nomorDokumen || "Pengajuan"} telah disetujui sepenuhnya oleh AMN ES (Approved 3). Seluruh alur proses workflow persetujuan TELAH SELESAI!`,
            });
         } else {
            const roleTitleMap = {
               verification: "AMN PLN (Verifikasi)",
               approved1: "MAN PLN (Approved 1)",
               approved2: "TL ES (Approved 2)",
               approved3: "AMN ES (Approved 3)",
            };
            const nextRoleTitle =
               roleTitleMap[updatedSub.currentApproverRole] ||
               updatedSub.currentApproverRole;
            setAlertModal({
               isOpen: true,
               type: "success",
               title: "Persetujuan Berhasil",
               message: `Pengajuan lembur ${updatedSub.nomorDokumen || "Pengajuan"} berhasil disetujui! Lanjut Kirim ke role berikutnya: ${nextRoleTitle}.`,
            });
         }
      }

      onRefreshData?.();
   };

   const handleDeleteLembur = async (sub) => {
      try { await api.deleteLembur(sub.id_lembur); await loadLemburFromApi(); onRefreshData?.(); }
      catch (error) { setAlertModal({ isOpen: true, type: "error", title: "Gagal Menghapus Lembur", message: error.response?.data?.message || error.message }); }
   };

   const handleOpenDetail = async (sub) => {
      try {
         const record = await api.getLemburById(sub.id_lembur);
         setDetailSub(mapApiLembur(record));
      } catch (error) {
         setAlertModal({ isOpen: true, type: "error", title: "Gagal Memuat Detail", message: error.response?.data?.message || error.message });
      }
   };
   return (
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 select-none">
         {/* Header */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
               <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />{" "}
                  Lembur &amp; Analisis Karyawan
               </h1>
               <p className="text-xs text-slate-600 font-medium">
                  Pengajuan Lembur Digital, Limit Jam Maksimal, dan Tabel
                  Perhitungan
               </p>
            </div>

            {currentUser?.role === "maker" && (
               <button
                  onClick={handleOpenCreateModal}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-[#00A3E0] hover:bg-[#0082B3] active:bg-[#006A93] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#00A3E0]/30 transition cursor-pointer active:scale-95"
               >
                  <Plus className="w-4 h-4" /> Ajukan Lembur Baru
               </button>
            )}
         </div>

         {/* Subtabs Bar */}
         <div className="flex border-b border-slate-200 text-xs font-bold gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
            <button
               onClick={() => setActiveSubTab("daftar")}
               className={`pb-2.5 sm:pb-3 border-b-2 transition cursor-pointer whitespace-nowrap min-h-[38px] ${activeSubTab === "daftar" ? "border-sky-500 text-sky-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
               Daftar Pengajuan Lembur ({lemburSubmissions.length})
            </button>
            <button
               onClick={() => setActiveSubTab("rumus")}
               className={`pb-2.5 sm:pb-3 border-b-2 transition cursor-pointer whitespace-nowrap min-h-[38px] ${activeSubTab === "rumus" ? "border-sky-500 text-sky-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
               Tabel Master Perhitungan Rumus
            </button>
         </div>

         {/* SUBTAB 1: DAFTAR PENGAJUAN LEMBUR */}
         {activeSubTab === "daftar" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
               <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        DETAIL PENGAJUAN LEMBUR PEGAWAI
                     </h3>
                     <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Filter status dan detail approval berjenjang
                     </p>
                  </div>

                  {/* Status Filter Tab Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                     <button
                        onClick={() => setFilterStatus("all")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "all" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                     >
                        Semua ({lemburSubmissions.length})
                     </button>
                     <button
                        onClick={() => setFilterStatus("draft")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "draft" ? "bg-slate-700 border-slate-700 text-white" : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"}`}
                     >
                        Draft (
                        {
                           lemburSubmissions.filter(
                              (s) =>
                                 s.status && s.status.toLowerCase() === "draft",
                           ).length
                        }
                        )
                     </button>
                     <button
                        onClick={() => setFilterStatus("revision")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                           filterStatus === "revision"
                              ? "bg-amber-600 border-amber-600 text-white"
                              : "bg-amber-50/50 border-amber-200 text-amber-800 hover:bg-amber-50"
                        }`}
                     >
                        <span className="relative flex h-2 w-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        Perlu Perbaikan (
                        {
                           lemburSubmissions.filter((s) => {
                              const sL = s.status ? s.status.toLowerCase() : "";
                              return (
                                 sL === "revision" || sL === "revision_required"
                              );
                           }).length
                        }
                        )
                     </button>
                     <button
                        onClick={() => setFilterStatus("rejected")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                           filterStatus === "rejected"
                              ? "bg-rose-700 border-rose-700 text-white"
                              : "bg-rose-50/50 border-rose-200 text-rose-800 hover:bg-rose-50"
                        }`}
                     >
                        Ditolak (
                        {
                           lemburSubmissions.filter(
                              (s) =>
                                 s.status &&
                                 s.status.toLowerCase() === "rejected",
                           ).length
                        }
                        )
                     </button>
                     <button
                        onClick={() => setFilterStatus("pending")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "pending" ? "bg-sky-700 border-sky-700 text-white" : "bg-sky-50/50 border-sky-200 text-sky-800 hover:bg-sky-50"}`}
                     >
                        Menunggu (
                        {
                           lemburSubmissions.filter(
                              (s) =>
                                 s.status &&
                                 s.status.toLowerCase().startsWith("pending_"),
                           ).length
                        }
                        )
                     </button>
                     <button
                        onClick={() => setFilterStatus("approved")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "approved" ? "bg-emerald-700 border-emerald-700 text-white" : "bg-emerald-50/50 border-emerald-200 text-emerald-800 hover:bg-emerald-50"}`}
                     >
                        Disetujui (
                        {
                           lemburSubmissions.filter(
                              (s) =>
                                 s.status &&
                                 s.status.toLowerCase() === "approved",
                           ).length
                        }
                        )
                     </button>
                  </div>
               </div>

               {/* Mobile View Card List */}
               <div className="block sm:hidden divide-y divide-slate-100">
                  {displaySubmissions.length === 0 ? (
                     <div className="p-6 text-center text-slate-400 text-xs font-medium">
                        Belum ada pengajuan lembur yang sesuai filter.
                     </div>
                  ) : (
                     displaySubmissions.map((sub) => {
                        const canApprove =
                           currentUser.role !== "maker" && currentUser.role === sub.currentApproverRole;
                        const sLower = sub.status
                           ? sub.status.toLowerCase()
                           : "";
                        const isRevision =
                           sLower === "revision" ||
                           sLower === "revision_required";
                        const isRejected = sLower === "rejected";
                        return (
                           <div
                              key={sub.id}
                              className={`p-3.5 space-y-2 hover:bg-slate-50 transition ${isRevision ? "bg-amber-50/80 border-l-4 border-l-amber-500" : isRejected ? "bg-rose-50/80 border-l-4 border-l-rose-500" : "bg-white"}`}
                           >
                              <div className="flex items-start justify-between gap-2">
                                 <div>
                                    <h4 className="font-bold text-xs text-slate-900">
                                       {sub.employeeName}
                                    </h4>
                                    <p className="font-mono text-[10px] text-slate-500">
                                       NIP: {sub.employeeNip} • {sub.garduInduk}
                                    </p>
                                 </div>
                                 <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeColor(sub.status)}`}
                                 >
                                    {getStatusLabel(sub.status)}
                                 </span>
                              </div>

                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs space-y-1">
                                 <p className="font-semibold text-slate-800">
                                    {sub.kategoriLembur}
                                 </p>
                                 {sub.jenisPekerjaan &&
                                    sub.jenisPekerjaan !== "-" && (
                                       <p className="text-[10px] text-slate-500 font-medium">
                                          {sub.jenisPekerjaan}
                                       </p>
                                    )}
                                 <div className="flex items-center justify-between text-[11px] text-slate-600">
                                    <span>
                                       {formatDateIndonesian(sub.tanggalLembur)}{" "}
                                       ({sub.jamMulai} - {sub.jamSelesai})
                                    </span>
                                    <span className="font-bold text-slate-900">
                                       {sub.durasiJam} Jam
                                    </span>
                                 </div>
                                 <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 text-[10px] text-slate-600 font-medium">
                                    <span>
                                       Group:{" "}
                                       <strong className="text-slate-800">
                                          {sub.areaGroup}
                                       </strong>
                                    </span>
                                    <span className="font-mono font-bold text-emerald-700">
                                       {sub.status?.toLowerCase() === "approved"
                                          ? formatRupiah(
                                               sub.estimasiBiayaRupiah,
                                            )
                                          : "-"}
                                    </span>
                                 </div>
                              </div>

                              {isRevision && (
                                 <div className="p-2.5 bg-amber-100/80 border border-amber-300 rounded-xl text-amber-900 text-xs flex flex-col gap-1">
                                    <p className="font-extrabold flex items-center gap-1 text-[11px]">
                                       <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                                       <span>
                                          Catatan Perbaikan dari Peninjau:
                                       </span>
                                    </p>
                                    <p className="font-semibold italic text-[11px] bg-white/75 p-1.5 rounded border border-amber-200/80">
                                       {sub.revisionNote ||
                                          "Harap perbaiki pengajuan sesuai catatan."}
                                    </p>
                                    {sub.revisedByName && (
                                       <p className="text-[10px] text-amber-800 font-extrabold self-end mt-0.5">
                                          Diminta oleh: {sub.revisedByName} (
                                          {sub.revisedByRole
                                             ? sub.revisedByRole.toUpperCase()
                                             : "Checker"}
                                          )
                                       </p>
                                    )}
                                 </div>
                              )}

                              {isRejected && (
                                 <div className="p-2.5 bg-rose-100/80 border border-rose-300 rounded-xl text-rose-900 text-xs flex flex-col gap-1">
                                    <p className="font-extrabold flex items-center gap-1 text-[11px] text-rose-800">
                                       <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                       <span>
                                          Pengajuan Ditolak (Proses Dibatalkan):
                                       </span>
                                    </p>
                                    <p className="font-semibold italic text-[11px] bg-white/75 p-1.5 rounded border border-rose-200/80 text-rose-900">
                                       {sub.rejectionReason ||
                                          "Pengajuan ditolak oleh peninjau."}
                                    </p>
                                    <p className="text-[10px] text-rose-700 font-medium">
                                       Seluruh proses pengajuan telah dibatalkan
                                       dan tidak dapat dilanjutkan kembali.
                                    </p>
                                 </div>
                              )}

                              <div className="flex flex-wrap items-center justify-end gap-1.5 pt-0.5">
                                 {canApprove && !isRevision && !isRejected && (
                                    <>
                                       {currentUser.role === "checker" ||
                                       (currentUser.role === "admin" &&
                                          sub.currentApproverRole ===
                                             "checker") ? (
                                          <button
                                             onClick={() =>
                                                handleOpenCheckerModal(sub)
                                             }
                                             className="px-2.5 py-1 min-h-[34px] text-xs font-bold text-sky-900 bg-sky-100 active:bg-sky-200 border border-sky-300 rounded-xl flex items-center gap-1 transition cursor-pointer shadow-xs"
                                          >
                                             <Clock className="w-3.5 h-3.5 text-sky-600" />{" "}
                                             Review &amp; Koreksi Jam
                                          </button>
                                       ) : (
                                          <button
                                             onClick={() => {
                                                setApproveSub(sub);
                                                setIsApproveSignOpen(true);
                                             }}
                                             className="px-2.5 py-1 min-h-[34px] text-xs font-bold text-white bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-700 rounded-xl flex items-center gap-1 transition cursor-pointer shadow-xs"
                                             title="Setujui & Kirim ke Proses Selanjutnya"
                                          >
                                             <Check className="w-3.5 h-3.5" />{" "}
                                             Setujui
                                          </button>
                                       )}
                                       <button
                                          onClick={() => {
                                             setRevisionSub(sub);
                                             setIsRevisionModalOpen(true);
                                          }}
                                          className="px-2.5 py-1 min-h-[34px] text-xs font-bold text-amber-800 bg-amber-100 active:bg-amber-200 rounded-xl flex items-center gap-1 transition cursor-pointer"
                                       >
                                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />{" "}
                                          Minta Revisi
                                       </button>
                                       <button
                                          onClick={() => {
                                             setRejectSub(sub);
                                             setIsRejectModalOpen(true);
                                          }}
                                          className="px-2.5 py-1 min-h-[34px] text-xs font-bold text-rose-800 bg-rose-100 active:bg-rose-200 rounded-xl flex items-center gap-1 transition cursor-pointer"
                                       >
                                          <XCircle className="w-3.5 h-3.5 text-rose-600" />{" "}
                                          Tolak
                                       </button>
                                    </>
                                 )}

                                 {isRevision &&
                                    currentUser.nip === sub.employeeNip && (
                                       <>
                                          <button
                                             onClick={() =>
                                                handleOpenEditModal(sub)
                                             }
                                             className="group/action relative w-9 h-9 text-amber-800 bg-amber-100 active:bg-amber-200 hover:bg-amber-200 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
                                             aria-label="Edit"
                                          >
                                             <Edit3 className="w-4 h-4" /><ActionTooltip text="Edit" />
                                          </button>
                                       </>
                                    )}

                                 {sub.status?.toLowerCase() === "draft" &&
                                    (currentUser.nip === sub.employeeNip ||
                                       currentUser.role === "maker") && (
                                       <>
                                          <button
                                             onClick={() =>
                                                handleOpenEditModal(sub)
                                             }
                                             className="group/action relative w-9 h-9 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
                                             aria-label="Edit"
                                          >
                                             <Edit3 className="w-4 h-4" /><ActionTooltip text="Edit" />
                                          </button>
                                          <button
                                             onClick={() =>
                                                handleSubmitDraftDirectly(sub)
                                             }
                                             className="group/action relative w-9 h-9 text-white bg-sky-600 hover:bg-sky-700 rounded-xl inline-flex items-center justify-center transition cursor-pointer shadow-xs"
                                             aria-label="Kirim"
                                          >
                                             <Send className="w-4 h-4" /><ActionTooltip text="Kirim" />
                                          </button>
                                          <button
                                             onClick={() => {
                                                if (
                                                   window.confirm(
                                                      "Apakah Anda yakin ingin membatalkan draft lembur ini? Status akan diubah menjadi Dibatalkan.",
                                                   )
                                                ) {
                                                   handleDeleteLembur(sub);
                                                }
                                             }}
                                             className="group/action relative w-9 h-9 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
                                             aria-label="Batalkan"
                                          >
                                             <Trash2 className="w-4 h-4 text-rose-600" /><ActionTooltip text="Batalkan" />
                                          </button>
                                       </>
                                    )}

                                 <button
                                    onClick={() => handleOpenDetail(sub)}
                                    className="group/action relative w-9 h-9 text-indigo-700 bg-indigo-50 active:bg-indigo-100 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
                                    aria-label="Detail"
                                 >
                                    <Eye className="w-4 h-4" /><ActionTooltip text="Detail" />
                                 </button>
                                 <button onClick={() => setSelectedDocSub(sub)} className="group/action relative w-9 h-9 text-emerald-700 bg-emerald-50 active:bg-emerald-100 rounded-xl inline-flex items-center justify-center transition cursor-pointer" aria-label="Document"><FileCheck className="w-4 h-4" /><ActionTooltip text="Document" /></button>
                              </div>
                           </div>
                        );
                     })
                  )}
               </div>

               {/* Desktop View Table */}
               <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                     <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                           <th className="p-3">Nama Pegawai</th>
                           <th className="p-3">NIP</th>
                           <th className="p-3">Unit</th>
                           <th className="p-3">Group (Area)</th>
                           <th className="p-3">Tanggal Lembur</th>
                           <th className="p-3">Jam (Durasi)</th>
                           <th className="p-3">Kategori Lembur</th>
                           <th className="p-3">Estimasi Biaya</th>
                           <th className="p-3">Status</th>
                           <th className="p-3 text-center">Aksi</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-200">
                        {displaySubmissions.map((sub) => {
                           const canApprove =
                              currentUser.role !== "maker" && currentUser.role === sub.currentApproverRole;
                           const sLower = sub.status
                              ? sub.status.toLowerCase()
                              : "";
                           const isRevision =
                              sLower === "revision" ||
                              sLower === "revision_required";
                           const isRejected = sLower === "rejected";
                           return (
                              <React.Fragment key={sub.id}>
                                 <tr
                                    className={`hover:bg-slate-50 transition ${isRevision ? "bg-amber-50/50" : isRejected ? "bg-rose-50/50" : ""}`}
                                 >
                                    <td className="p-3 font-bold text-slate-900">
                                       {sub.employeeName}
                                    </td>
                                    <td className="p-3 font-mono text-slate-600">
                                       {sub.employeeNip}
                                    </td>
                                    <td className="p-3 text-slate-700">
                                       {sub.garduInduk}
                                    </td>
                                    <td className="p-3 text-slate-700 font-medium">
                                       {sub.areaGroup}
                                    </td>
                                    <td className="p-3 font-medium text-slate-800">
                                       {formatDateIndonesian(sub.tanggalLembur)}
                                    </td>
                                    <td className="p-3">
                                       <span className="font-bold text-slate-800">
                                          {sub.jamMulai} - {sub.jamSelesai}
                                       </span>
                                       <span className="text-[10px] text-slate-500 block">
                                          ({sub.durasiJam} Jam)
                                       </span>
                                    </td>
                                    <td className="p-3 max-w-xs text-slate-800">
                                       <span className="font-bold block">
                                          {sub.kategoriLembur}
                                       </span>
                                       {sub.jenisPekerjaan &&
                                          sub.jenisPekerjaan !== "-" && (
                                             <span className="text-[10px] text-slate-500 block">
                                                {sub.jenisPekerjaan}
                                             </span>
                                          )}
                                    </td>
                                    <td className="p-3 font-mono font-bold text-emerald-700">
                                       {sub.status?.toLowerCase() === "approved"
                                          ? formatRupiah(
                                               sub.estimasiBiayaRupiah,
                                            )
                                          : "-"}
                                    </td>
                                    <td className="p-3">
                                       <div className="flex flex-col items-start gap-1">
                                          <span
                                             className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeColor(sub.status)}`}
                                          >
                                             {getStatusLabel(sub.status)}
                                          </span>
                                          {sub.status?.toLowerCase() ===
                                             "approved" && (
                                             <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                Estimasi:{" "}
                                                {formatRupiah(
                                                   sub.estimasiBiayaRupiah,
                                                )}
                                             </span>
                                          )}
                                          {isRevision && sub.revisionNote && (
                                             <span
                                                className="text-[9.5px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 max-w-[170px] truncate"
                                                title={sub.revisionNote}
                                             >
                                                Catatan: {sub.revisionNote}
                                             </span>
                                          )}
                                          {isRejected &&
                                             sub.rejectionReason && (
                                                <span
                                                   className="text-[9.5px] font-medium text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 max-w-[170px] truncate"
                                                   title={sub.rejectionReason}
                                                >
                                                   Alasan: {sub.rejectionReason}
                                                </span>
                                             )}
                                       </div>
                                    </td>
                                    <td className="p-3 text-center">
                                       <div className="flex items-center justify-center gap-1.5">
                                          {canApprove &&
                                             !isRevision &&
                                             !isRejected && (
                                                <>
                                                   {currentUser.role ===
                                                      "checker" ||
                                                   (currentUser.role ===
                                                      "admin" &&
                                                      sub.currentApproverRole ===
                                                         "checker") ? (
                                                      <button
                                                         onClick={() =>
                                                            handleOpenCheckerModal(
                                                               sub,
                                                            )
                                                         }
                                                         className="px-2.5 py-1 text-xs font-bold text-sky-900 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs"
                                                      >
                                                         <Clock className="w-3.5 h-3.5 text-sky-600" />{" "}
                                                         Review &amp; Koreksi
                                                         Jam
                                                      </button>
                                                   ) : (
                                                      <button
                                                         onClick={() => {
                                                            setApproveSub(sub);
                                                            setIsApproveSignOpen(
                                                               true,
                                                            );
                                                         }}
                                                         className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs"
                                                         title="Setujui & Kirim ke Proses Selanjutnya"
                                                      >
                                                         <Check className="w-3.5 h-3.5" />{" "}
                                                         Setujui
                                                      </button>
                                                   )}
                                                   <button
                                                      onClick={() => {
                                                         setRevisionSub(sub);
                                                         setIsRevisionModalOpen(
                                                            true,
                                                         );
                                                      }}
                                                      className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                                                   >
                                                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />{" "}
                                                      Minta Revisi
                                                   </button>
                                                   <button
                                                      onClick={() => {
                                                         setRejectSub(sub);
                                                         setIsRejectModalOpen(
                                                            true,
                                                         );
                                                      }}
                                                      className="px-2.5 py-1 text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                                                   >
                                                      <XCircle className="w-3.5 h-3.5" />{" "}
                                                      Tolak
                                                   </button>
                                                </>
                                             )}

                                          {isRevision &&
                                             currentUser.nip ===
                                                sub.employeeNip && (
                                                <>
                                                   <button
                                                      onClick={() =>
                                                         handleOpenEditModal(
                                                            sub,
                                                         )
                                                      }
                                                      className="group/action relative w-9 h-9 text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg inline-flex items-center justify-center transition cursor-pointer"
                                                      aria-label="Edit"
                                                   >
                                                      <Edit3 className="w-4 h-4" /><ActionTooltip text="Edit" />
                                                   </button>
                                                </>
                                             )}

                                          {sub.status?.toLowerCase() ===
                                             "draft" &&
                                             (currentUser.nip ===
                                                sub.employeeNip ||
                                                currentUser.role ===
                                                   "maker") && (
                                                <>
                                                   <button
                                                      onClick={() =>
                                                         handleOpenEditModal(
                                                            sub,
                                                         )
                                                      }
                                                      className="group/action relative w-9 h-9 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg inline-flex items-center justify-center transition cursor-pointer"
                                                      aria-label="Edit"
                                                   >
                                                      <Edit3 className="w-4 h-4" /><ActionTooltip text="Edit" />
                                                   </button>
                                                   <button
                                                      onClick={() =>
                                                         handleSubmitDraftDirectly(
                                                            sub,
                                                         )
                                                      }
                                                      className="group/action relative w-9 h-9 text-white bg-sky-600 hover:bg-sky-700 rounded-lg inline-flex items-center justify-center transition cursor-pointer shadow-xs"
                                                      aria-label="Kirim"
                                                   >
                                                      <Send className="w-4 h-4" /><ActionTooltip text="Kirim" />
                                                   </button>
                                                   <button
                                                      onClick={() => {
                                                         if (
                                                            window.confirm(
                                                               "Apakah Anda yakin ingin membatalkan draft lembur ini? Status akan diubah menjadi Dibatalkan.",
                                                            )
                                                         ) {
                                                            handleDeleteLembur(sub);
                                                         }
                                                      }}
                                                      className="group/action relative w-9 h-9 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg inline-flex items-center justify-center transition cursor-pointer"
                                                      aria-label="Batalkan"
                                                   >
                                                      <Trash2 className="w-4 h-4 text-rose-600" /><ActionTooltip text="Batalkan" />
                                                   </button>
                                                </>
                                             )}

                                          <button
                                             onClick={() => handleOpenDetail(sub)}
                                             className="group/action relative w-9 h-9 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg inline-flex items-center justify-center transition cursor-pointer"
                                             aria-label="Detail"
                                          >
                                             <Eye className="w-4 h-4" /><ActionTooltip text="Detail" />
                                          </button>
                                          <button onClick={() => setSelectedDocSub(sub)} className="group/action relative w-9 h-9 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg inline-flex items-center justify-center transition cursor-pointer" aria-label="Document"><FileCheck className="w-4 h-4" /><ActionTooltip text="Document" /></button>
                                       </div>
                                    </td>
                                 </tr>
                                 {isRevision && (
                                    <tr className="bg-amber-50/20">
                                       <td
                                          colSpan={10}
                                          className="p-3 pt-0 border-t-0"
                                       >
                                          <div className="p-2.5 bg-amber-100/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center justify-between gap-4">
                                             <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                                                <span className="font-extrabold shrink-0">
                                                   Catatan Revisi:
                                                </span>
                                                <span className="font-semibold italic bg-white/70 px-2.5 py-1 rounded border border-amber-200">
                                                   {sub.revisionNote ||
                                                      sub.rejectionReason ||
                                                      "Harap perbaiki pengajuan."}
                                                </span>
                                             </div>
                                             {sub.revisedByName && (
                                                <span className="text-[10px] text-amber-800 font-extrabold shrink-0">
                                                   Diminta oleh:{" "}
                                                   <strong>
                                                      {sub.revisedByName} (
                                                      {sub.revisedByRole?.toUpperCase()}
                                                      )
                                                   </strong>
                                                </span>
                                             )}
                                          </div>
                                       </td>
                                    </tr>
                                 )}
                              </React.Fragment>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* SUBTAB 3: TABEL MASTER PERHITUNGAN RUMUS RUPIAH */}
         {activeSubTab === "rumus" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4 sm:space-y-6">
               <div className="border-b pb-3 border-slate-200">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                     <Calculator className="w-5 h-5 text-sky-600" />
                     Tabel Master Rumus Perhitungan Biaya Lembur PLN
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                     Formula standar ketenagakerjaan PLN:{" "}
                     <code className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-sky-700 font-bold">
                        Rate Jam = Gaji Pokok / 173
                     </code>
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Rule 1: Working Day */}
                  <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                     <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm border-b border-slate-200 pb-2">
                        1. Multiplier Hari Kerja Normal (Workday)
                     </h4>
                     <ul className="space-y-2 text-slate-700 font-medium">
                        <li className="flex justify-between border-b border-slate-200 pb-1">
                           <span>Jam Pertama (Jam ke-1):</span>
                           <strong className="text-sky-700 font-mono">
                              1.5 x Rate Jam
                           </strong>
                        </li>
                        <li className="flex justify-between border-b border-slate-200 pb-1">
                           <span>Jam Kedua &amp; Seterusnya (Jam ke-2+):</span>
                           <strong className="text-sky-700 font-mono">
                              2.0 x Rate Jam
                           </strong>
                        </li>
                        <li className="flex justify-between">
                           <span>Batas Maksimal Lembur Per Hari:</span>
                           <strong className="text-rose-700">
                              {settings.overtimeFormula.maxHoursPerDay} Jam /
                              Hari
                           </strong>
                        </li>
                     </ul>
                  </div>

                  {/* Rule 2: Holiday */}
                  <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                     <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm border-b border-slate-200 pb-2">
                        2. Multiplier Hari Libur / Off (Holiday)
                     </h4>
                     <ul className="space-y-2 text-slate-700 font-medium">
                        <li className="flex justify-between border-b border-slate-200 pb-1">
                           <span>Jam ke-1 s/d Jam ke-8:</span>
                           <strong className="text-amber-700 font-mono">
                              2.0 x Rate Jam
                           </strong>
                        </li>
                        <li className="flex justify-between border-b border-slate-200 pb-1">
                           <span>Jam ke-9:</span>
                           <strong className="text-amber-700 font-mono">
                              3.0 x Rate Jam
                           </strong>
                        </li>
                        <li className="flex justify-between">
                           <span>Jam ke-10 dan seterusnya:</span>
                           <strong className="text-amber-700 font-mono">
                              4.0 x Rate Jam
                           </strong>
                        </li>
                     </ul>
                  </div>
               </div>

               {/* Sample Calculation Table */}
               <div className="border border-sky-200 rounded-xl p-3.5 sm:p-4 bg-sky-50/60 text-xs space-y-2">
                  <h4 className="font-bold text-sky-950">
                     Contoh Simulasi Perhitungan Pegawai (Gaji Pokok Rp
                     5.500.000, Lembur 4 Jam Kerja):
                  </h4>
                  <p className="font-mono text-slate-800 leading-relaxed">
                     • Rate Per Jam = Rp 5.500.000 / 173 ={" "}
                     <strong>Rp 31.791,90</strong>
                     <br />• Koefisien 4 Jam = (1.5 x 1) + (2.0 x 3) ={" "}
                     <strong>7.5 Factor</strong>
                     <br />• Total Biaya Lembur = 7.5 x Rp 31.791,90 ={" "}
                     <strong className="text-emerald-700 text-sm">
                        Rp 238.439
                     </strong>
                  </p>
               </div>
            </div>
         )}

         {/* New Overtime Modal */}
         {isNewModalOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 md:p-6">
               <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-lg md:max-w-2xl w-full p-4 sm:p-6 md:p-7 space-y-4 my-0 sm:my-8 max-h-[92vh] overflow-y-auto overscroll-y-contain">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                     <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-sky-600" />{" "}
                        {editingSub
                           ? "Edit & Perbarui Pengajuan Lembur"
                           : "Formulir Pengajuan Lembur Baru"}
                     </h3>
                     <button
                        onClick={() => setIsNewModalOpen(false)}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                     >
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <form
                     onSubmit={handleCreateLembur}
                     className="space-y-3.5 text-xs"
                  >
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                           <label className="block font-bold mb-1 text-slate-800">
                              Tanggal Lembur
                           </label>
                           <input
                              type="date"
                              value={tanggalLembur}
                              onChange={(e) =>
                                 handleTanggalLemburChange(e.target.value)
                              }
                              required
                              className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                           />
                        </div>

                        <div>
                           <label className="block font-bold mb-1 text-slate-800">
                              Group Area
                           </label>
                           <select
                              value={areaGroup}
                              onChange={(e) => setAreaGroup(e.target.value)}
                              required
                              className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                           >
                              <option value="">-- Pilih Group Area --</option>
                              <option value="Area GI">
                                 Area Gardu Induk (GI)
                              </option>
                              <option value="Area Transmisi">
                                 Area Transmisi SUTT
                              </option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="block font-bold mb-1 text-slate-800">
                              Jam Mulai
                           </label>
                           <input
                              type="time"
                              value={jamMulai}
                              onChange={(e) => setJamMulai(e.target.value)}
                              required
                              className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                           />
                        </div>

                        <div>
                           <label className="block font-bold mb-1 text-slate-800">
                              Jam Selesai
                           </label>
                           <input
                              type="time"
                              value={jamSelesai}
                              onChange={(e) => setJamSelesai(e.target.value)}
                              required
                              className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                           <label className="block font-bold mb-1 text-slate-800">
                              Kategori Pekerjaan Lembur
                           </label>
                           <select
                              value={kategoriLembur}
                              onChange={(e) =>
                                 handleKategoriChange(e.target.value)
                              }
                              required
                              className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                           >
                              <option value="">
                                 -- Pilih Kategori Pekerjaan --
                              </option>
                              {Object.keys(mapping).map((cat) => (
                                 <option key={cat} value={cat}>
                                    {cat}
                                 </option>
                              ))}
                           </select>
                        </div>

                        <div>
                           <label className="block font-bold mb-1 text-slate-800">
                              Jenis Pekerjaan
                           </label>
                           <select
                              value={jenisPekerjaan}
                              onChange={(e) =>
                                 handleJenisPekerjaanChange(e.target.value)
                              }
                              required
                              disabled={
                                 !kategoriLembur ||
                                 ((mapping[kategoriLembur] || []).length <= 1 &&
                                    mapping[kategoriLembur]?.[0] === "-")
                              }
                              className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                           >
                              <option value="">
                                 -- Pilih Jenis Pekerjaan --
                              </option>
                              {(mapping[kategoriLembur] || []).map((subJob) => (
                                 <option key={subJob} value={subJob}>
                                    {subJob}
                                 </option>
                              ))}
                           </select>
                        </div>
                     </div>

                     {/* Checklist / Checkbox "Lembur" (Tampil & Default Terpilih untuk Pengganti Piket / Siaga Libur Nasional) */}
                     {showLemburCheckbox && (
                        <>
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-50/90 rounded-xl border border-amber-300 transition-all">
                              <div className="flex items-center gap-2.5">
                                 <input
                                    type="checkbox"
                                    id="liburCheck"
                                    checked={isHariLibur}
                                    onChange={(e) =>
                                       setIsHariLibur(e.target.checked)
                                    }
                                    className="w-5 h-5 text-sky-600 rounded cursor-pointer accent-sky-600"
                                 />
                                 <label
                                    htmlFor="liburCheck"
                                    className="font-semibold text-amber-900 text-xs cursor-pointer select-none"
                                 >
                                    Lembur pada Hari Libur / Off (Multiplier
                                    Libur)
                                 </label>
                              </div>
                              <span className="self-start sm:self-center text-[10px] font-bold px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-md border border-amber-300/80 whitespace-nowrap">
                                 (Mandatory)
                              </span>
                           </div>

                           {isHariLibur && tanggalLembur && (
                              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-[11px] flex items-center gap-2">
                                 <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                 <span>
                                    Terkonfirmasi Hari Libur Nasional:{" "}
                                    <span className="font-extrabold text-emerald-950 uppercase tracking-tight">
                                       {getHolidayInfo(tanggalLembur)
                                          ?.ket_libur || "Libur Nasional"}
                                    </span>
                                 </span>
                              </div>
                           )}

                           {!isHariLibur && tanggalLembur && (
                              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl font-bold text-[11px] flex items-center gap-2">
                                 <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-bounce"></span>
                                 <span>
                                    Peringatan: Tanggal{" "}
                                    {formatDateIndonesian(tanggalLembur)} tidak
                                    terdaftar di Master Hari Libur Nasional!
                                 </span>
                              </div>
                           )}
                        </>
                     )}

                     {/* Automatic Calculation Preview Box */}
                     <div className="p-3 bg-slate-100 rounded-xl space-y-1 border border-slate-200">
                        <div className="flex justify-between font-bold text-slate-800">
                           <span>Kalkulasi Durasi Jam:</span>
                           <span className="text-sky-700">
                              {calculatedDuration} Jam
                           </span>
                        </div>
                        {isApprovalRole && (
                           <div className="flex justify-between font-bold text-slate-800">
                              <span>Estimasi Biaya Rumus Rupiah:</span>
                              <span className="text-emerald-700 font-mono text-sm">
                                 {formatRupiah(estimatedCost)}
                              </span>
                           </div>
                        )}
                     </div>

                     {/* Dropdown Petugas Pendamping / Rekan Lembur */}
                     {showPetugasPendamping && (
                        <div className="transition-all">
                           <label className="block font-bold mb-1 text-slate-800 flex items-center gap-1">
                              Petugas Pendamping / Rekan Lembur (NIP - Nama)
                              {isPetugasPendampingRequired ? (
                                 <span className="text-rose-500 font-bold ml-0.5">
                                    *
                                 </span>
                              ) : (
                                 <span className="text-slate-400 font-normal text-[10px] ml-1">
                                    (Opsional)
                                 </span>
                              )}
                           </label>
                           <select
                              value={petugasPendampingNip}
                              onChange={(e) => {
                                 setPetugasPendampingNip(e.target.value);
                                 if (e.target.value)
                                    setPetugasPendampingError("");
                              }}
                              required={isPetugasPendampingRequired}
                              className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer transition ${
                                 petugasPendampingError
                                    ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                                    : "border-slate-300"
                              }`}
                           >
                              <option value="">
                                 {isPetugasPendampingRequired
                                    ? `-- Pilih Petugas Pendamping (Wajib - Unit GI: ${currentUser?.garduInduk || "Sama"}, Status: TAD) --`
                                    : "-- Pilih Petugas Pendamping (Opsional) --"}
                              </option>
                              {filteredOfficers.map((u) => {
                                 const leaveStatus = getOfficerLeaveStatus(
                                    u.nip,
                                    tanggalLembur,
                                 );
                                 let statusBadge = "";
                                 if (leaveStatus === "cuti")
                                    statusBadge = "🟨 [CUTI] ";
                                 if (leaveStatus === "ijin")
                                    statusBadge = "🟦 [IJIN] ";
                                 if (leaveStatus === "sakit")
                                    statusBadge = "🟥 [SAKIT] ";

                                 return (
                                    <option key={u.nip} value={u.nip}>
                                       {statusBadge}
                                       {u.nip} - {u.name} ({u.jabatan}) - GI:{" "}
                                       {u.garduInduk || "-"}
                                    </option>
                                 );
                              })}
                           </select>

                           {/* Task 1: Color Legend for Petugas Status (Hanya CUTI, IJIN, SAKIT) */}
                           <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-800 block">
                                 Indikator Legend Status Petugas:
                              </span>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                                 <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                    🟨 [CUTI] (Sedang mengajukan/menjalani Cuti)
                                 </span>
                                 <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1">
                                    🟦 [IJIN] (Sedang Ijin)
                                 </span>
                                 <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                                    🟥 [SAKIT] (Sedang Izin Sakit)
                                 </span>
                              </div>
                           </div>

                           {petugasPendampingError && (
                              <p className="text-rose-600 font-semibold text-[11px] mt-1.5 flex items-center gap-1">
                                 <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                 {petugasPendampingError}
                              </p>
                           )}
                        </div>
                     )}

                     {/* Upload Lampiran Dokumentasi & Dasar Perintah */}
                     <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs border-b border-slate-200 pb-1.5">
                           <Upload className="w-4 h-4 text-sky-600" /> Upload
                           Lampiran Dokumentasi &amp; Dasar Perintah
                        </p>

                        {/* Task 2: Jika Kategori Pekerjaan selain Piket Tanggal Merah / Cuti Pengganti, tampilkan Foto 1 dan Foto 2 (Wajib Diisi) */}
                        {kategoriLembur !==
                           "Piket Tanggal Merah / Cuti Pengganti" && (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-slate-200">
                              {/* Foto 1 */}
                              <div>
                                 <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                                    Foto Dokumentasi Kegiatan 1{" "}
                                    <span className="text-rose-500">*</span>
                                 </label>
                                 {fotoDokumentasi1Url ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-slate-300 h-24 bg-slate-900">
                                       <img
                                          src={fotoDokumentasi1Url}
                                          alt="Foto 1"
                                          className="w-full h-full object-cover"
                                       />
                                       <button
                                          type="button"
                                          onClick={() =>
                                             setFotoDokumentasi1Url("")
                                          }
                                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 cursor-pointer"
                                       >
                                          <X className="w-3.5 h-3.5" />
                                       </button>
                                    </div>
                                 ) : (
                                    <label className="flex flex-col items-center justify-center h-24 bg-white border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-sky-500 hover:bg-sky-50/50 transition p-2 text-center">
                                       <Upload className="w-5 h-5 text-slate-400 mb-1" />
                                       <span className="text-[11px] font-bold text-slate-600">
                                          Pilih Foto 1
                                       </span>
                                       <span className="text-[9px] text-slate-400">
                                          JPG/PNG maks 5MB
                                       </span>
                                       <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) =>
                                             handleFileUpload(
                                                e,
                                                setFotoDokumentasi1Url,
                                             )
                                          }
                                          className="hidden"
                                       />
                                    </label>
                                 )}
                              </div>

                              {/* Foto 2 */}
                              <div>
                                 <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                                    Foto Dokumentasi Kegiatan 2{" "}
                                    <span className="text-rose-500">*</span>
                                 </label>
                                 {fotoDokumentasi2Url ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-slate-300 h-24 bg-slate-900">
                                       <img
                                          src={fotoDokumentasi2Url}
                                          alt="Foto 2"
                                          className="w-full h-full object-cover"
                                       />
                                       <button
                                          type="button"
                                          onClick={() =>
                                             setFotoDokumentasi2Url("")
                                          }
                                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 cursor-pointer"
                                       >
                                          <X className="w-3.5 h-3.5" />
                                       </button>
                                    </div>
                                 ) : (
                                    <label className="flex flex-col items-center justify-center h-24 bg-white border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-sky-500 hover:bg-sky-50/50 transition p-2 text-center">
                                       <Upload className="w-5 h-5 text-slate-400 mb-1" />
                                       <span className="text-[11px] font-bold text-slate-600">
                                          Pilih Foto 2
                                       </span>
                                       <span className="text-[9px] text-slate-400">
                                          JPG/PNG maks 5MB
                                       </span>
                                       <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) =>
                                             handleFileUpload(
                                                e,
                                                setFotoDokumentasi2Url,
                                             )
                                          }
                                          className="hidden"
                                       />
                                    </label>
                                 )}
                              </div>
                           </div>
                        )}

                        {/* File Dasar Perintah Lembur */}
                        <div>
                           <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                              File Dasar Perintah Lembur (ST / Nota / Surat
                              Dinas) <span className="text-rose-500">*</span>
                           </label>
                           {dasarPerintahLemburUrl ? (
                              <div className="p-2.5 bg-sky-50 border border-sky-300 rounded-xl flex items-center justify-between">
                                 <div className="flex items-center gap-2 overflow-hidden">
                                    <FileCheck className="w-5 h-5 text-sky-600 flex-shrink-0" />
                                    <span className="font-bold text-sky-900 truncate">
                                       {dasarPerintahLemburName ||
                                          "File Dokumen Terpilih"}
                                    </span>
                                 </div>
                                 <button
                                    type="button"
                                    onClick={() => {
                                       setDasarPerintahLemburUrl("");
                                       setDasarPerintahLemburName("");
                                    }}
                                    className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                                 >
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>
                           ) : (
                              <label className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-sky-500 hover:bg-sky-50/50 transition text-slate-700 font-bold text-xs">
                                 <Upload className="w-4 h-4 text-sky-600" />
                                 <span>
                                    Upload File Dasar Perintah Lembur
                                    (PDF/Gambar)
                                 </span>
                                 <input
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx"
                                    onChange={(e) =>
                                       handleFileUpload(
                                          e,
                                          setDasarPerintahLemburUrl,
                                          setDasarPerintahLemburName,
                                       )
                                    }
                                    className="hidden"
                                 />
                              </label>
                           )}
                        </div>
                     </div>

                     <div>
                        <label className="block font-bold mb-1 text-slate-800">
                           Uraian Detail Kegiatan Pekerjaan
                        </label>
                        <textarea
                           value={kegiatanDetail}
                           onChange={(e) => setKegiatanDetail(e.target.value)}
                           required
                           rows={3}
                           placeholder="Jelaskan detail pekerjaan, nomor bay trafo / kelaikan..."
                           className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                        />
                     </div>

                     {/* Digital Signature Canvas Trigger */}
                     <div>
                        <label className="block font-bold mb-1 text-slate-800">
                           Tandatangan Digital Pemohon (Maker)
                        </label>
                        {makerSignatureUrl ? (
                           <div className="p-3 border border-emerald-300 rounded-xl flex items-center justify-between bg-emerald-50">
                              <span className="text-emerald-800 font-bold flex items-center gap-1">
                                 <CheckCircle2 className="w-4 h-4" /> TTD
                                 Terbubuh
                              </span>
                              <button
                                 type="button"
                                 onClick={() => setIsSignModalOpen(true)}
                                 className="text-sky-700 underline font-semibold cursor-pointer"
                              >
                                 Ubah TTD
                              </button>
                           </div>
                        ) : (
                           <button
                              type="button"
                              onClick={() => setIsSignModalOpen(true)}
                              className="w-full h-11 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-800 font-bold cursor-pointer transition flex items-center justify-center"
                           >
                              + Tandatangan Pemohon
                           </button>
                        )}
                     </div>

                     <div className="flex flex-wrap items-center justify-end gap-2 pt-3 pb-safe">
                        <button
                           type="button"
                           onClick={() => setIsNewModalOpen(false)}
                           className="px-4 py-2.5 min-h-[42px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                        >
                           Batal
                        </button>
                        <button
                           type="button"
                           onClick={(e) => handleSaveDraftLembur(e)}
                           className="px-4 py-2.5 min-h-[42px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer transition"
                        >
                           <Save className="w-4 h-4 text-slate-600" />
                           Simpan Draft
                        </button>
                        <button
                           type="submit"
                           className="px-5 py-2.5 min-h-[42px] font-bold bg-[#00A3E0] hover:bg-[#0082B3] text-white rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5"
                        >
                           <Send className="w-4 h-4" />
                           {editingSub && editingSub.status !== "draft"
                              ? "Simpan & Ajukan Ulang"
                              : "Lanjut Kirim ke TL PLN (Checker)"}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* Alert / Notification Modal */}
         <AlertNotificationModal
            isOpen={alertModal.isOpen}
            onClose={() =>
               setAlertModal((prev) => ({ ...prev, isOpen: false }))
            }
            type={alertModal.type}
            title={alertModal.title}
            message={alertModal.message}
         />

         {/* Maker Signature Pad Modal */}
         <SignatureModal
            isOpen={isSignModalOpen}
            onClose={() => setIsSignModalOpen(false)}
            onSave={(url) => setMakerSignatureUrl(url)}
            title="Tandatangan Pemohon Lembur"
         />

         {/* Approval Signature Pad Modal */}
         <SignatureModal
            isOpen={isApproveSignOpen}
            onClose={() => setIsApproveSignOpen(false)}
            onSave={handleApproveSignatureSave}
            title={`Persetujuan Digital Lembur (${currentUser.jabatan})`}
         />

         {/* Revision Modal */}
         <RevisionModal
            isOpen={isRevisionModalOpen}
            onClose={() => {
               setIsRevisionModalOpen(false);
               setRevisionSub(null);
            }}
            onConfirm={handleConfirmRevision}
            submissionDocNo={revisionSub?.nomorDokumen}
            currentApproverRole={
               revisionSub?.currentApproverRole || currentUser?.role
            }
            title={`Minta Revisi Lembur (${revisionSub?.nomorDokumen || ""})`}
         />

         {/* Reject Modal */}
         <RejectModal
            isOpen={isRejectModalOpen}
            onClose={() => {
               setIsRejectModalOpen(false);
               setRejectSub(null);
            }}
            onConfirm={handleConfirmReject}
            submissionDocNo={rejectSub?.nomorDokumen}
            title={`Tolak Pengajuan Lembur (${rejectSub?.nomorDokumen || ""})`}
         />

         {/* Detail Data API & Uploaded Files */}
         {detailSub && (
            <div className="fixed inset-0 z-[60] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && setDetailSub(null)}>
               <div className="bg-white w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200">
                  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                     <div><p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Detail Pengajuan Lembur</p><h3 className="font-black text-slate-900 mt-0.5">{detailSub.nomorDokumen}</h3></div>
                     <button type="button" onClick={() => setDetailSub(null)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 inline-flex items-center justify-center" aria-label="Tutup detail"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-5 space-y-5">
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <DetailItem label="Petugas" value={`${detailSub.employeeName || "-"} (${detailSub.employeeNip || "-"})`} />
                        <DetailItem label="Unit" value={detailSub.garduInduk || detailSub.unitUpt || "-"} />
                        <DetailItem label="Tanggal" value={formatDateIndonesian(detailSub.tanggalLembur)} />
                        <DetailItem label="Jam & Durasi" value={`${detailSub.jamMulai || "-"} - ${detailSub.jamSelesai || "-"} (${detailSub.durasiJam || 0} Jam)`} />
                        <DetailItem label="Kategori" value={detailSub.kategoriLembur || "-"} />
                        <DetailItem label="Jenis Pekerjaan" value={detailSub.jenisPekerjaan || "-"} />
                        <DetailItem label="Area / Group" value={detailSub.areaGroup || "-"} />
                        <DetailItem label="Status" value={getStatusLabel(detailSub.status)} />
                        <DetailItem label="Petugas Digantikan" value={detailSub.petugasPendampingNama ? `${detailSub.petugasPendampingNama} (${detailSub.petugasPendampingNip})` : "-"} />
                        <DetailItem label="Hari Libur" value={detailSub.isHariLibur ? "Ya" : "Tidak"} />
                        <DetailItem label="Jam Koreksi" value={detailSub.jumlahJamKoreksi == null ? "-" : `${detailSub.jumlahJamKoreksi} Jam`} />
                        <DetailItem label="Catatan Koreksi" value={detailSub.catatanKoreksi || "-"} />
                     </div>
                     <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Detail Pekerjaan</p><p className="text-xs font-semibold text-slate-800 mt-2 whitespace-pre-wrap">{detailSub.kegiatanDetail || "-"}</p></div>
                     <div><h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-indigo-600" /> Dokumen &amp; Evidence</h4><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><FilePreview label="Foto Kegiatan 1" url={detailSub.fotoDokumentasi1Url} /><FilePreview label="Foto Kegiatan 2" url={detailSub.fotoDokumentasi2Url} /><FilePreview label="Surat Perintah Lembur" url={detailSub.dasarPerintahLemburUrl} /></div></div>
                     <div><h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-2"><FileCheck className="w-4 h-4 text-emerald-600" /> Signature Workflow</h4><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[["Maker", detailSub.makerSignatureUrl], ["Checker", detailSub.checkerSignatureUrl], ["Verification", detailSub.verificationSignatureUrl], ["Approval 1", detailSub.approval1SignatureUrl], ["Approval 2", detailSub.approval2SignatureUrl], ["Approval 3", detailSub.approval3SignatureUrl]].map(([label, url]) => <FilePreview key={label} label={label} url={url} compact />)}</div></div>
                  </div>
               </div>
            </div>
         )}

         {/* Document Viewer Modal */}
         <DocumentViewerModal
            isOpen={!!selectedDocSub}
            submission={selectedDocSub}
            onClose={() => setSelectedDocSub(null)}
         />

         {/* Checker (TL PLN) Review & Correction Form Modal (Task 3 & Task 4) */}
         {isCheckerModalOpen &&
            checkerReviewSub &&
            (() => {
               const accum = calculateEmployeeLemburAccumulation(
                  submissions,
                  checkerReviewSub.employeeNip,
                  checkerReviewSub.tanggalLembur,
                  checkerReviewSub.id,
               );
               const corrNum = Number(jumlahJamKoreksiInput) || 0;
               const newWeeklyTotal =
                  Math.round((accum.weeklyHours + corrNum) * 10) / 10;
               const isWeeklyLimitExceeded = newWeeklyTotal > 18;
               const isDailyLimitExceeded = corrNum > 4;

               const corrEstCost = calculateOvertimeCost(
                  checkerReviewSub.employeeGajiPokok || 55e5,
                  corrNum,
                  checkerReviewSub.isHariLibur,
                  settings.overtimeFormula,
               );

               return (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                     <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                           <div>
                              <div className="flex items-center gap-2">
                                 <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-black uppercase tracking-wider border border-sky-300">
                                    Posisi Checker (TL PLN)
                                 </span>
                                 {checkerReviewSub.checkerDraftCorrection && (
                                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-300 flex items-center gap-1">
                                       <Save className="w-3 h-3 text-amber-600" />{" "}
                                       Draft Koreksi Tersimpan
                                    </span>
                                 )}
                              </div>
                              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                                 <Clock className="w-5 h-5 text-sky-600 shrink-0" />
                                 Formulir Review &amp; Koreksi Lembur
                              </h3>
                              <p className="text-xs text-slate-500 font-medium">
                                 Dokumen No:{" "}
                                 <strong className="font-mono text-slate-800">
                                    {checkerReviewSub.nomorDokumen}
                                 </strong>
                              </p>
                           </div>
                           <button
                              type="button"
                              onClick={() => setIsCheckerModalOpen(false)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                           >
                              <X className="w-5 h-5" />
                           </button>
                        </div>

                        {/* Task 4 Rule Banner */}
                        <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-xl text-sky-900 text-xs space-y-1">
                           <p className="font-bold flex items-center gap-1 text-sky-900">
                              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />{" "}
                              Ketentuan Akses Checker (TL PLN):
                           </p>
                           <p className="text-[11px] leading-relaxed text-sky-800">
                              Data pengajuan pemohon (Maker) bersifat{" "}
                              <strong>Readonly</strong>. Posisi Checker hanya
                              dapat mengisi{" "}
                              <strong>Jumlah Lembur Koreksi (angka jam)</strong>{" "}
                              dan <strong>Catatan Koreksi</strong>. Ketentuan
                              batas maksimal: <strong>4 jam/hari</strong> dan
                              total akumulasi <strong>18 jam/minggu</strong>.
                           </p>
                        </div>

                        {/* Task 3 Accumulation Stats Section */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                           <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                              <span>AKUMULASI JAM LEMBUR PEGAWAI (TASK 3)</span>
                              <span className="text-[10px] font-mono text-slate-500 lowercase font-normal">
                                 NIP: {checkerReviewSub.employeeNip} (
                                 {checkerReviewSub.employeeName})
                              </span>
                           </h4>

                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                              {/* Card 1: Total Per Minggu Ini */}
                              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                 <p className="text-[10px] text-slate-500 font-bold uppercase">
                                    Total Minggu Ini (Senin - Minggu)
                                 </p>
                                 <p className="text-sm font-black text-slate-900">
                                    {accum.weeklyHours}{" "}
                                    <span className="text-xs font-normal text-slate-500">
                                       Jam (Terdaftar)
                                    </span>
                                 </p>
                                 <p className="text-[9.5px] font-mono text-slate-400 truncate">
                                    {accum.weekPeriodStr}
                                 </p>
                                 <div className="pt-1 border-t border-slate-100 text-[10.5px]">
                                    <span className="text-slate-600 font-medium">
                                       Pasca Koreksi:{" "}
                                    </span>
                                    <strong
                                       className={`font-mono font-bold ${isWeeklyLimitExceeded ? "text-rose-600" : "text-emerald-700"}`}
                                    >
                                       {newWeeklyTotal} / 18 Jam
                                    </strong>
                                 </div>
                              </div>

                              {/* Card 2: Total Per Bulan Ini */}
                              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                 <p className="text-[10px] text-slate-500 font-bold uppercase">
                                    Total Bulan Ini
                                 </p>
                                 <p className="text-sm font-black text-slate-900">
                                    {accum.monthlyHours}{" "}
                                    <span className="text-xs font-normal text-slate-500">
                                       Jam (Terakumulasi)
                                    </span>
                                 </p>
                                 <p className="text-[9.5px] text-slate-400">
                                    Total akumulasi lembur bulan ini
                                 </p>
                                 <div className="pt-1 border-t border-slate-100 text-[10.5px]">
                                    <span className="text-slate-600 font-medium">
                                       Akumulasi Bulan + Koreksi:{" "}
                                    </span>
                                    <strong className="font-mono font-bold text-sky-800">
                                       {Math.round(
                                          (accum.monthlyHours + corrNum) * 10,
                                       ) / 10}{" "}
                                       Jam
                                    </strong>
                                 </div>
                              </div>

                              {/* Card 3: Maker vs Checker Koreksi */}
                              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                 <p className="text-[10px] text-slate-500 font-bold uppercase">
                                    Jam Maker vs Koreksi
                                 </p>
                                 <p className="text-sm font-black text-slate-900">
                                    {checkerReviewSub.durasiJam}{" "}
                                    <span className="text-xs font-normal text-slate-400">
                                       Jam (Pengajuan Awal)
                                    </span>
                                 </p>
                                 <div className="pt-1 border-t border-slate-100 text-[10.5px]">
                                    <span className="text-slate-600 font-medium">
                                       Jam Koreksi Saat Ini:{" "}
                                    </span>
                                    <strong className="font-mono font-bold text-sky-900 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                                       {corrNum} Jam
                                    </strong>
                                 </div>
                              </div>
                           </div>

                           {(isDailyLimitExceeded || isWeeklyLimitExceeded) && (
                              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs flex items-center gap-2">
                                 <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                 <span className="font-bold">
                                    {isDailyLimitExceeded
                                       ? `Input Koreksi (${corrNum} Jam) melebihi batas harian 4 jam!`
                                       : `Total akumulasi minggu ini (${newWeeklyTotal} Jam) melebihi batas mingguan 18 jam!`}
                                 </span>
                              </div>
                           )}
                        </div>

                        {/* Maker Fields (READONLY) */}
                        <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
                           <p className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">
                              DATA PENGAJUAN LEMBUR MAKER (READONLY)
                           </p>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase block">
                                    Pemohon / Pegawai
                                 </label>
                                 <input
                                    type="text"
                                    readOnly
                                    value={`${checkerReviewSub.employeeName} (${checkerReviewSub.employeeNip})`}
                                    className="w-full mt-0.5 p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase block">
                                    Unit / Gardu Induk
                                 </label>
                                 <input
                                    type="text"
                                    readOnly
                                    value={
                                       checkerReviewSub.garduInduk ||
                                       checkerReviewSub.unitUpt
                                    }
                                    className="w-full mt-0.5 p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase block">
                                    Tanggal &amp; Jam Lembur
                                 </label>
                                 <input
                                    type="text"
                                    readOnly
                                    value={`${formatDateIndonesian(checkerReviewSub.tanggalLembur)} | ${checkerReviewSub.jamMulai} - ${checkerReviewSub.jamSelesai} (${checkerReviewSub.durasiJam} Jam)`}
                                    className="w-full mt-0.5 p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase block">
                                    Kategori &amp; Jenis Pekerjaan
                                 </label>
                                 <input
                                    type="text"
                                    readOnly
                                    value={`${checkerReviewSub.kategoriLembur} - ${checkerReviewSub.jenisPekerjaan || "-"}`}
                                    className="w-full mt-0.5 p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
                                 />
                              </div>
                           </div>

                           <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                                 Uraian Kegiatan Pekerjaan
                              </label>
                              <textarea
                                 readOnly
                                 rows={2}
                                 value={checkerReviewSub.kegiatanDetail || "-"}
                                 className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium cursor-not-allowed"
                              />
                           </div>
                        </div>

                        {/* Task 3 & 4 EDITABLE INPUTS FOR CHECKER */}
                        <div className="p-4 bg-amber-50/50 border-2 border-amber-300 rounded-2xl space-y-3">
                           <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                 <Edit3 className="w-4 h-4 text-amber-600" />{" "}
                                 INPUT FORM KOREKSI CHECKER (TL PLN)
                              </h4>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                                 Hanya Input Angka Jam
                              </span>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                              {/* Task 3: Input Jumlah Lembur Koreksi */}
                              <div>
                                 <label className="block font-black text-xs text-slate-900 mb-1 flex items-center justify-between">
                                    <span>
                                       Jumlah Lembur Koreksi (Jam){" "}
                                       <span className="text-rose-500">*</span>
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-normal">
                                       (Maks 4 Jam/Hari)
                                    </span>
                                 </label>
                                 <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="24"
                                    value={jumlahJamKoreksiInput}
                                    onChange={(e) =>
                                       setJumlahJamKoreksiInput(e.target.value)
                                    }
                                    className="w-full h-11 px-3 bg-white border-2 border-sky-400 rounded-xl font-mono font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                                    placeholder="Contoh: 4"
                                 />
                                 <p className="text-[10px] text-slate-500 font-medium mt-1">
                                    *Mengacu pada limit harian maks 4 jam dan
                                    mingguan maks 18 jam.
                                 </p>
                              </div>

                              {/* Recalculated Cost Display */}
                              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                                 <p className="text-[10px] font-bold text-slate-500 uppercase">
                                    Estimasi Biaya Rumus Rupiah PLN Pasca
                                    Koreksi
                                 </p>
                                 <p className="text-base font-black font-mono text-emerald-700">
                                    {formatRupiah(corrEstCost)}
                                 </p>
                                 <p className="text-[9.5px] text-slate-400">
                                    Tabel Rumus Perhitungan PLN (1.5x, 2x, 3x,
                                    4x x 1/173 Gaji Pokok)
                                 </p>
                              </div>
                           </div>

                           {/* Catatan Koreksi */}
                           <div>
                              <label className="block font-bold text-xs text-slate-800 mb-1">
                                 Catatan / Alasan Koreksi Checker (TL PLN)
                              </label>
                              <textarea
                                 rows={2}
                                 value={catatanKoreksiInput}
                                 onChange={(e) =>
                                    setCatatanKoreksiInput(e.target.value)
                                 }
                                 placeholder="Masukkan alasan atau penjelasan koreksi jumlah jam lembur jika ada..."
                                 className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                              />
                           </div>
                        </div>

                        {/* Modal Actions (Task 4) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                           <button
                              type="button"
                              onClick={() => setIsCheckerModalOpen(false)}
                              className="px-3.5 py-2 min-h-[38px] text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                           >
                              Batal
                           </button>

                           <div className="flex flex-wrap items-center gap-2">
                              <button
                                 type="button"
                                 onClick={() => {
                                    setRevisionSub(checkerReviewSub);
                                    setIsRevisionModalOpen(true);
                                    setIsCheckerModalOpen(false);
                                 }}
                                 className="px-3.5 py-2 min-h-[38px] text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl border border-amber-300 flex items-center gap-1 cursor-pointer transition"
                              >
                                 <RotateCcw className="w-3.5 h-3.5" /> Minta
                                 Revisi
                              </button>

                              <button
                                 type="button"
                                 onClick={() => {
                                    setRejectSub(checkerReviewSub);
                                    setIsRejectModalOpen(true);
                                    setIsCheckerModalOpen(false);
                                 }}
                                 className="px-3.5 py-2 min-h-[38px] text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-xl border border-rose-300 flex items-center gap-1 cursor-pointer transition"
                              >
                                 <XCircle className="w-3.5 h-3.5" /> Tolak
                              </button>

                              {/* Task 4: Simpan Draft Checker */}
                              <button
                                 type="button"
                                 onClick={handleSaveCheckerDraft}
                                 className="px-4 py-2 min-h-[38px] text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer transition"
                              >
                                 <Save className="w-4 h-4 text-slate-600" />{" "}
                                 Simpan Draft Koreksi
                              </button>

                              {/* Approve & Send */}
                              <button
                                 type="button"
                                 onClick={handleApproveWithCheckerCorrection}
                                 className="px-5 py-2 min-h-[38px] text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5"
                              >
                                 <Check className="w-4 h-4" /> Setujui &amp;
                                 Teruskan ke Verifikator
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               );
            })()}
      </div>
   );
};
