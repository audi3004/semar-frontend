import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DataService } from "../services/dataService";
import { api } from "../services/api";
import { SignatureModal } from "../components/common/SignatureModal";
import { DocumentViewerModal } from "../components/common/DocumentViewerModal";
import { RejectModal } from "../components/common/RejectModal";
import { RevisionModal } from "../components/common/RevisionModal";
import { AlertNotificationModal } from "../components/common/AlertNotificationModal";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { validateSakitInput } from "../utils/submissionValidation";
import { compressImageDataUrl } from "../utils/imageCompressor";
import {
  Stethoscope,
  Plus,
  Check,
  Eye,
  Image as ImageIcon,
  FileText,
  Building2,
  UserCheck,
  Calendar,
  AlertCircle,
  File,
  MessageSquare,
  X,
  ShieldCheck,
  RotateCcw,
  Paperclip,
  Edit3,
  AlertTriangle,
  XCircle,
  Save,
  Send,
  Trash2
} from "lucide-react";
import {
  formatDateIndonesian,
  getStatusBadgeColor,
  getStatusLabel,
  calculateAccumulatedSakit12Months,
  getFormattedDocNo
} from "../utils/formatters";

const ActionTooltip = ({ text }) => (
  <span className="pointer-events-none absolute bottom-full left-1/2 z-[80] mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover/action:opacity-100">
    {text}
  </span>
);

export const SakitPage = ({
  currentUser,
  submissions,
  onRefreshData
}) => {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDocSub, setSelectedDocSub] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingSub, setEditingSub] = useState(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: "info", title: "", message: "" });

  // Form Fields
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [jumlahHari, setJumlahHari] = useState(0);
  const [instansiKlinik, setInstansiKlinik] = useState("");
  const [namaDokter, setNamaDokter] = useState("");
  const [suratDokterUrl, setSuratDokterUrl] = useState("");
  const [suratDokterFileType, setSuratDokterFileType] = useState("image"); // "image" | "pdf"
  const [suratDokterFileName, setSuratDokterFileName] = useState("");
  const [diagnosaSingkat, setDiagnosaSingkat] = useState("");
  const [makerSignatureUrl, setMakerSignatureUrl] = useState("");
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  // Approval Modal State
  const [approveSub, setApproveSub] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvalCatatan, setApprovalCatatan] = useState("");
  const [approvalSignatureUrl, setApprovalSignatureUrl] = useState("");
  const [isApprovalSignModalOpen, setIsApprovalSignModalOpen] = useState(false);
  const [rejectSub, setRejectSub] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [revisionSub, setRevisionSub] = useState(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [apiSakit, setApiSakit] = useState([]);

  const getApiError = (error) => error?.response?.data?.message || error?.message || "Terjadi kesalahan saat menghubungi server.";
  const normalizeStatus = (item) => {
    const code = String(item?.status?.kode_status || "").toLowerCase();
    if (item?.status?.is_final === "Y" && (code.includes("reject") || code.includes("tolak"))) return "rejected";
    if (item?.status?.is_final === "Y") return "approved";
    if (code.includes("revision") || code.includes("revisi")) return "revision";
    if (item?.status?.is_initial === "Y" || code.includes("draft")) return "draft";
    return code ? `pending_${code}` : "pending_checker";
  };
  const mapSakit = (item) => {
    const fileName = item.foto ? String(item.foto).split("/").pop() : "";
    return {
      ...item,
      id: String(item.id_sakit),
      type: "sakit",
      nomorDokumen: item.nomor_dokumen || `SAKIT-${item.id_sakit}`,
      employeeNip: item.petugas?.nip || String(item.id_petugas),
      employeeName: item.petugas?.nama || "-",
      employeeJabatan: item.petugas?.jabatan?.nama_jabatan || "-",
      unitUpt: item.petugas?.unit?.nama_unit || "-",
      tanggalPengajuan: item.created_at?.slice?.(0, 10) || item.tanggal,
      tanggalMulai: item.tanggal,
      tanggalSelesai: item.tgl_selesai,
      jumlahHari: Math.max(1, Math.round((new Date(item.tgl_selesai) - new Date(item.tanggal)) / 86400000) + 1),
      instansiKlinik: item.agenda || "",
      namaDokterFaskes: item.agenda || "",
      namaDokter: item.nama_dokter || "",
      suratKeteranganDokterUrl: item.foto || "",
      suratKeteranganDokterFileName: fileName,
      suratKeteranganDokterFileType: fileName.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
      diagnosaSingkat: item.keterangan || "",
      makerSignatureUrl: item.maker_signature || "",
      status: normalizeStatus(item),
      currentApproverRole: item.status?.role?.kode_role?.toLowerCase() || "maker"
    };
  };
  const loadSakit = async () => {
    try {
      const rows = await api.getSakit();
      setApiSakit((Array.isArray(rows) ? rows : []).map(mapSakit));
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Memuat Data Sakit", message: getApiError(error) });
    }
  };
  const refreshSakit = async () => {
    await loadSakit();
    if (onRefreshData) onRefreshData();
  };
  useEffect(() => { loadSakit(); }, []);

  const sakitSubmissions = apiSakit;

  const displaySubmissions = sakitSubmissions.filter((s) => {
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

  const handleOpenEditModal = (sub) => {
    setEditingSub(sub);
    setTanggalMulai(sub.tanggalMulai);
    setTanggalSelesai(sub.tanggalSelesai);
    setJumlahHari(sub.jumlahHari);
    setInstansiKlinik(sub.instansiKlinik || "");
    setNamaDokter(sub.namaDokter || "");
    setSuratDokterUrl(sub.suratKeteranganDokterUrl || "");
    setSuratDokterFileType(sub.suratKeteranganDokterFileType || "image");
    setSuratDokterFileName(sub.suratKeteranganDokterFileName || "");
    setDiagnosaSingkat(sub.diagnosaSingkat || "");
    setMakerSignatureUrl(sub.makerSignatureUrl || "");
    setIsNewModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingSub(null);
    setTanggalMulai("");
    setTanggalSelesai("");
    setJumlahHari(0);
    setInstansiKlinik("");
    setNamaDokter("");
    setSuratDokterUrl("");
    setSuratDokterFileType("image");
    setSuratDokterFileName("");
    setDiagnosaSingkat("");
    setMakerSignatureUrl("");
    setIsNewModalOpen(true);
  };

  const editIdParam = searchParams.get("editId");

  useEffect(() => {
    if (editIdParam) {
      const sub = sakitSubmissions.find((s) => s.id === editIdParam);
      if (sub) {
        handleOpenEditModal(sub);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("editId");
          return next;
        }, { replace: true });
      }
    }
  }, [editIdParam, apiSakit]);

  const handleResubmit = async (sub) => {
    try {
      await api.nextSakit(sub.id);
      await refreshSakit();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Mengirim Laporan", message: getApiError(error) });
    }
  };

  const handleConfirmRevision = (notes, targetRole) => {
    if (!revisionSub) return;
    DataService.processApproval(
      revisionSub.id,
      currentUser,
      "revision",
      undefined,
      notes,
      { targetRevisionRole: targetRole || "maker" }
    );
    setIsRevisionModalOpen(false);
    setRevisionSub(null);
    onRefreshData();
  };

  const handleConfirmReject = (notes) => {
    if (!rejectSub) return;
    DataService.processApproval(rejectSub.id, currentUser, "reject", undefined, notes);
    setIsRejectModalOpen(false);
    setRejectSub(null);
    onRefreshData();
  };

  // Calculate accumulated sakit for 12 months (Current User)
  const loggedInNip = currentUser?.petugas?.nip || currentUser?.nip;
  const userAccumulatedSakit = calculateAccumulatedSakit12Months(sakitSubmissions, loggedInNip);

  // Auto-calculate range date duration (like cuti)
  useEffect(() => {
    if (tanggalMulai && tanggalSelesai) {
      const d1 = new Date(tanggalMulai);
      const d2 = new Date(tanggalSelesai);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24)) + 1;
        setJumlahHari(Math.max(1, diffDays));
      }
    }
  }, [tanggalMulai, tanggalSelesai]);

  if (!currentUser) return <LoadingSkeleton variant="dashboard" />;

  const appendDataUrl = (formData, field, dataUrl, fallbackName) => {
    if (!dataUrl?.startsWith("data:")) return;
    const [header, encoded] = dataUrl.split(",");
    const mime = header.match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    const extension = mime === "application/pdf" ? "pdf" : mime.split("/")[1]?.replace("jpeg", "jpg") || "bin";
    formData.append(field, new Blob([bytes], { type: mime }), fallbackName || `${field}.${extension}`);
  };
  const buildApiPayload = () => {
    const idPetugas = currentUser?.id_petugas || currentUser?.petugas?.id_petugas;
    if (!idPetugas) throw new Error("Akun login belum terhubung dengan data petugas (id_petugas).");
    const values = {
      id_petugas: Number(idPetugas),
      agenda: instansiKlinik,
      tanggal: tanggalMulai,
      tgl_selesai: tanggalSelesai,
      nama_dokter: namaDokter || null,
      keterangan: diagnosaSingkat || null
    };
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, String(value));
    });
    appendDataUrl(formData, "foto", suratDokterUrl, suratDokterFileName || undefined);
    appendDataUrl(formData, "maker_signature", makerSignatureUrl, "maker_signature.png");
    return formData;
  };

  // File Upload Restricted to Photo & PDF
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name;
      const ext = fileName.split('.').pop().toLowerCase();
      const isPdf = file.type === "application/pdf" || ext === "pdf";
      const isImage = file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(ext);

      if (!isPdf && !isImage) {
        alert("Format file tidak didukung! Hanya diperbolehkan mengunggah file Foto (.JPG, .PNG, .WEBP) atau dokumen (.PDF).");
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawResult = reader.result;
        if (isImage && typeof rawResult === "string") {
          const compressed = await compressImageDataUrl(rawResult, 800, 0.7);
          setSuratDokterUrl(compressed);
        } else {
          setSuratDokterUrl(rawResult);
        }
        setSuratDokterFileName(fileName);
        setSuratDokterFileType(isPdf ? "pdf" : "image");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDraftSakit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const valResult = validateSakitInput(tanggalMulai, todayStr);
    if (!valResult.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Simpan Draft Sakit",
        message: valResult.message
      });
      return;
    }

    try {
      const response = editingSub
        ? await api.updateSakit(editingSub.id, buildApiPayload())
        : await api.createSakit(buildApiPayload());
      const saved = response?.data || response;
      setIsNewModalOpen(false);
      setEditingSub(null);
      setAlertModal({ isOpen: true, type: "success", title: "Draft Berhasil Disimpan", message: `Draft laporan sakit (SAKIT-${saved?.id_sakit || editingSub?.id || "baru"}) berhasil disimpan.` });
      await refreshSakit();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Simpan Draft Sakit", message: getApiError(error) });
    }
  };

  const handleCreateSakit = async (e) => {
    e.preventDefault();
    if (!suratDokterUrl) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Sakit",
        message: "Surat Keterangan Dokter (Foto / PDF) Wajib diunggah!"
      });
      return;
    }
    if (!instansiKlinik || !tanggalMulai || !tanggalSelesai || !namaDokter || !diagnosaSingkat) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Laporan Sakit",
        message: "Semua kolom formulir (Tanggal Mulai, Tanggal Selesai, Nama Faskes/Klinik, Nama Dokter, dan Diagnosa/Keterangan) harus terisi dan lengkap sebelum dikirim."
      });
      return;
    }
    if (!makerSignatureUrl) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Laporan Sakit",
        message: "Tandatangan Pemohon wajib dibubuhkan sebelum mengirim laporan."
      });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const valResult = validateSakitInput(tanggalMulai, todayStr);
    if (!valResult.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Sakit",
        message: valResult.message
      });
      return;
    }

    try {
      let id = editingSub?.id;
      if (id) {
        await api.updateSakit(id, buildApiPayload());
      } else {
        const response = await api.createSakit(buildApiPayload());
        id = response?.data?.id_sakit || response?.id_sakit;
      }
      if (!id) throw new Error("ID sakit tidak ditemukan pada respons server.");
      await api.nextSakit(id);
      setIsNewModalOpen(false);
      setEditingSub(null);
      setAlertModal({ isOpen: true, type: "success", title: "Laporan Berhasil Dikirim", message: "Laporan sakit berhasil dikirim ke tahap berikutnya." });
      await refreshSakit();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Kirim Laporan Sakit", message: getApiError(error) });
    }
  };

  const handleSubmitDraftDirectly = async (sub) => {
    if (!sub.instansiKlinik || !sub.tanggalMulai || !sub.tanggalSelesai || !sub.namaDokter || !sub.diagnosaSingkat || !sub.makerSignatureUrl) {
      handleOpenEditModal(sub);
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Formulir Belum Lengkap",
        message: "Pengajuan sakit ini belum lengkap. Harap lengkapi semua kolom formulir dan tandatangan terlebih dahulu sebelum mengirim."
      });
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const valResult = validateSakitInput(sub.tanggalMulai, todayStr);
    if (!valResult.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Sakit",
        message: valResult.message
      });
      return;
    }
    try {
      await api.nextSakit(sub.id);
      setAlertModal({ isOpen: true, type: "success", title: "Laporan Berhasil Dikirim", message: `Draft laporan sakit (${sub.nomorDokumen}) berhasil dikirim ke tahap berikutnya.` });
      await refreshSakit();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Kirim Laporan Sakit", message: getApiError(error) });
    }
  };

  const handleCancelSakit = async (sub) => {
    try {
      await api.deleteSakit(sub.id);
      await refreshSakit();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Membatalkan Laporan", message: getApiError(error) });
    }
  };

  const handleOpenApprovalModal = (sub) => {
    setApproveSub(sub);
    setApprovalCatatan("");
    setApprovalSignatureUrl("");
    setIsApproveModalOpen(true);
  };

  const handleConfirmApproval = (e) => {
    e.preventDefault();
    if (!approveSub) return;

    const updatedSub = DataService.processApproval(
      approveSub.id,
      currentUser,
      "approve",
      approvalSignatureUrl,
      approvalCatatan
    );

    setIsApproveModalOpen(false);

    if (updatedSub) {
      if (updatedSub.status === "APPROVED" || currentUser.role === "approved3") {
        setAlertModal({
          isOpen: true,
          type: "success",
          title: "Proses Selesai",
          message: `Dokumen ${updatedSub.nomorDokumen || "Pengajuan"} telah disetujui sepenuhnya oleh AMN ES (Approved 3). Seluruh alur proses workflow persetujuan TELAH SELESAI!`
        });
      } else {
        const roleTitleMap = {
          verification: "AMN PLN (Verifikasi)",
          approved1: "MAN PLN (Approved 1)",
          approved2: "TL ES (Approved 2)",
          approved3: "AMN ES (Approved 3)"
        };
        const nextRoleTitle = roleTitleMap[updatedSub.currentApproverRole] || updatedSub.currentApproverRole;
        setAlertModal({
          isOpen: true,
          type: "success",
          title: "Persetujuan Berhasil",
          message: `Pengajuan ijin sakit ${updatedSub.nomorDokumen || "Pengajuan"} berhasil disetujui! Lanjut Kirim ke role berikutnya: ${nextRoleTitle}.`
        });
      }
    }

    setApproveSub(null);
    onRefreshData();
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" /> Dokumentasi Sakit & Surat Dokter
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Perhitungan Akumulasi Sakit 12 Bulan Terakhir & Upload Surat Keterangan Dokter (.PDF / Foto)
          </p>
        </div>

        {currentUser?.role === "maker" && (
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-[#00A3E0] hover:bg-[#0082B3] active:bg-[#006A93] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#00A3E0]/30 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Laporkan Sakit Baru
          </button>
        )}
      </div>

      {/* 12-Month Accumulation Stat Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-gradient-to-br from-rose-50 to-amber-50 p-4 rounded-2xl border border-rose-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-rose-800 tracking-wide uppercase flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-600" /> Akumulasi Sakit (12 Bulan)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{userAccumulatedSakit.totalDays}</span>
              <span className="text-xs font-bold text-slate-600">Hari Istirahat Sakit</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Periode: {userAccumulatedSakit.periodFormatted}
            </p>
          </div>
          <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl border border-rose-200">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-600 tracking-wide uppercase">
              Total Laporan Sakit (12 Bulan)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-sky-700">{userAccumulatedSakit.totalSubmissionsCount}</span>
              <span className="text-xs font-bold text-slate-600">Pengajuan Terdata</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Pegawai: {currentUser?.name}</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-600 tracking-wide uppercase">
              Proses Persetujuan Berjenjang
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">
                {sakitSubmissions.filter((s) => s.status === "approved").length}
              </span>
              <span className="text-xs font-bold text-slate-600">Disetujui PLN & ES</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Termasuk Catatan Checker & Verifikasi</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table & List Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              DETAIL PENGAJUAN SAKIT PEGAWAI
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Filter status dan detail persetujuan sakit</p>
          </div>
          
          {/* Status Filter Tab Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "all" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              Semua ({sakitSubmissions.length})
            </button>
            <button
              onClick={() => setFilterStatus("draft")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "draft" ? "bg-slate-700 border-slate-700 text-white" : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"}`}
            >
              Draft ({sakitSubmissions.filter(s => s.status && s.status.toLowerCase() === "draft").length})
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
              Perlu Perbaikan ({sakitSubmissions.filter(s => {
                const sL = s.status ? s.status.toLowerCase() : "";
                return sL === "revision" || sL === "revision_required";
              }).length})
            </button>
            <button
              onClick={() => setFilterStatus("rejected")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                filterStatus === "rejected"
                  ? "bg-rose-700 border-rose-700 text-white"
                  : "bg-rose-50/50 border-rose-200 text-rose-800 hover:bg-rose-50"
              }`}
            >
              Ditolak ({sakitSubmissions.filter(s => s.status && s.status.toLowerCase() === "rejected").length})
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "pending" ? "bg-sky-700 border-sky-700 text-white" : "bg-sky-50/50 border-sky-200 text-sky-800 hover:bg-sky-50"}`}
            >
              Menunggu ({sakitSubmissions.filter(s => s.status && s.status.toLowerCase().startsWith("pending_")).length})
            </button>
            <button
              onClick={() => setFilterStatus("approved")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "approved" ? "bg-emerald-700 border-emerald-700 text-white" : "bg-emerald-50/50 border-emerald-200 text-emerald-800 hover:bg-emerald-50"}`}
            >
              Disetujui ({sakitSubmissions.filter(s => s.status && s.status.toLowerCase() === "approved").length})
            </button>
          </div>
        </div>

        {/* Mobile View Card List */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {displaySubmissions.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs font-medium">
              Belum ada pengajuan sakit yang sesuai filter.
            </div>
          ) : (
            displaySubmissions.map((sub) => {
              const sLower = sub.status ? sub.status.toLowerCase() : "";
              const isRevision = sLower === "revision" || sLower === "revision_required";
              const isRejected = sLower === "rejected";
              
              return (
                <div key={sub.id} className={`p-3.5 space-y-2 hover:bg-slate-50 transition ${isRevision ? "bg-amber-50/80 border-l-4 border-l-amber-500" : isRejected ? "bg-rose-50/80 border-l-4 border-l-rose-500" : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{sub.employeeName}</h4>
                      <p className="font-mono text-[10px] text-slate-500">NIP: {sub.employeeNip}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeColor(sub.status)}`}>
                      {getStatusLabel(sub.status)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs space-y-1.5">
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{sub.instansiKlinik || sub.namaDokterFaskes}</span>
                    </p>
                    {sub.namaDokter && (
                      <p className="text-[11px] text-slate-600 font-medium">
                        Dokter: <strong className="text-slate-800">{sub.namaDokter}</strong>
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/40">
                      <span>Periode: {formatDateIndonesian(sub.tanggalMulai)}</span>
                      <strong className="text-slate-900">{sub.jumlahHari} Hari</strong>
                    </div>

                    {sub.suratKeteranganDokterUrl && (
                      <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                        {sub.suratKeteranganDokterFileType === "pdf" ? (
                          <FileText className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>Lampiran Surat Dokter ({sub.suratKeteranganDokterFileType === "pdf" ? "Document PDF" : "File Foto"})</span>
                      </div>
                    )}
                  </div>

                  {isRevision && (
                    <div className="p-2.5 bg-amber-100/80 border border-amber-300 rounded-xl text-amber-900 text-xs flex flex-col gap-1">
                      <p className="font-extrabold flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                        <span>Catatan Perbaikan dari Peninjau:</span>
                      </p>
                      <p className="font-semibold italic text-[11px] bg-white/75 p-1.5 rounded border border-amber-200/80">
                        {sub.revisionNote || "Harap perbaiki pengajuan sesuai catatan."}
                      </p>
                      {sub.revisedByName && (
                        <p className="text-[10px] text-amber-800 font-extrabold self-end mt-0.5">
                          Diminta oleh: {sub.revisedByName} ({sub.revisedByRole ? sub.revisedByRole.toUpperCase() : "Checker"})
                        </p>
                      )}
                    </div>
                  )}

                  {isRejected && (
                    <div className="p-2.5 bg-rose-100/80 border border-rose-300 rounded-xl text-rose-900 text-xs flex flex-col gap-1">
                      <p className="font-extrabold flex items-center gap-1 text-[11px] text-rose-800">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Pengajuan Ditolak (Proses Dibatalkan):</span>
                      </p>
                      <p className="font-semibold italic text-[11px] bg-white/75 p-1.5 rounded border border-rose-200/80 text-rose-900">
                        {sub.rejectionReason || "Pengajuan ditolak oleh peninjau."}
                      </p>
                      <p className="text-[10px] text-rose-700 font-medium">
                        Seluruh proses pengajuan telah dibatalkan dan tidak dapat dilanjutkan kembali.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-0.5">
                    {isRevision && loggedInNip === sub.employeeNip && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(sub)}
                          className="group/action relative w-9 h-9 text-amber-800 bg-amber-100 active:bg-amber-200 hover:bg-amber-200 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
                          aria-label="Edit"
                        >
                          <Edit3 className="w-4 h-4" /><ActionTooltip text="Edit" />
                        </button>
                        <button
                          onClick={() => handleResubmit(sub)}
                          className="group/action relative w-9 h-9 text-white bg-sky-600 active:bg-sky-700 hover:bg-sky-700 rounded-xl inline-flex items-center justify-center transition cursor-pointer shadow-xs"
                          aria-label="Kirim Ulang"
                        >
                          <RotateCcw className="w-4 h-4" /><ActionTooltip text="Kirim Ulang" />
                        </button>
                      </>
                    )}

                    {sub.status?.toLowerCase() === "draft" && (loggedInNip === sub.employeeNip || currentUser.role === "maker") && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(sub)}
                          className="group/action relative w-9 h-9 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
                          aria-label="Edit"
                        >
                          <Edit3 className="w-4 h-4" /><ActionTooltip text="Edit" />
                        </button>
                        <button
                          onClick={() => handleSubmitDraftDirectly(sub)}
                          className="group/action relative w-9 h-9 text-white bg-sky-600 hover:bg-sky-700 rounded-xl inline-flex items-center justify-center transition cursor-pointer shadow-xs"
                          aria-label="Kirim"
                        >
                          <Send className="w-4 h-4" /><ActionTooltip text="Kirim" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Apakah Anda yakin ingin membatalkan draft laporan sakit ini? Status akan diubah menjadi Dibatalkan.")) {
                              handleCancelSakit(sub);
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
                      onClick={() => setSelectedDocSub(sub)}
                      className="group/action relative w-9 h-9 text-indigo-700 bg-indigo-50 active:bg-indigo-100 hover:bg-indigo-100 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
                      aria-label="Detail"
                    >
                      <Eye className="w-4 h-4" /><ActionTooltip text="Detail" />
                    </button>
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
                <th className="p-3">Periode Istirahat Sakit</th>
                <th className="p-3">Instansi / Klinik / Rumah Sakit</th>
                <th className="p-3">Dokter Penanggung Jawab</th>
                <th className="p-3">Surat Dokter (.PDF / Foto)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displaySubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    Belum ada pengajuan sakit yang sesuai filter.
                  </td>
                </tr>
              ) : (
                displaySubmissions.map((sub) => {
                  const isPdf = sub.suratKeteranganDokterFileType === "pdf" || (sub.suratKeteranganDokterFileName && sub.suratKeteranganDokterFileName.endsWith(".pdf"));
                  const sLower = sub.status ? sub.status.toLowerCase() : "";
                  const isRevision = sLower === "revision" || sLower === "revision_required";
                  const isRejected = sLower === "rejected";

                  return (
                    <React.Fragment key={sub.id}>
                      <tr className={`hover:bg-slate-50 transition ${isRevision ? "bg-amber-50/50" : isRejected ? "bg-rose-50/50" : ""}`}>
                        <td className="p-3 font-bold text-slate-900">{sub.employeeName}</td>
                        <td className="p-3 font-mono text-slate-600">{sub.employeeNip}</td>
                        <td className="p-3 text-slate-700 font-medium">
                          {formatDateIndonesian(sub.tanggalMulai)} s/d {formatDateIndonesian(sub.tanggalSelesai)}
                          <span className="block text-[10px] font-bold text-rose-700">{sub.jumlahHari} Hari Kerja</span>
                        </td>
                        <td className="p-3 text-slate-900 font-bold">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{sub.instansiKlinik || sub.namaDokterFaskes || "-"}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-800 font-semibold">{sub.namaDokter || "-"}</td>
                        <td className="p-3">
                          {sub.suratKeteranganDokterUrl ? (
                            <span className={`px-2.5 py-1 rounded font-bold text-[10px] flex items-center gap-1.5 w-max border ${
                              isPdf ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}>
                              {isPdf ? <FileText className="w-3.5 h-3.5 text-rose-600" /> : <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />}
                              <span>{isPdf ? "Dokumen PDF" : "File Foto"}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">Kosong</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeColor(sub.status)}`}>
                            {getStatusLabel(sub.status)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isRevision && loggedInNip === sub.employeeNip && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(sub)}
                                  className="group/action relative w-9 h-9 text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
                                  aria-label="Edit"
                                >
                                  <Edit3 className="w-4 h-4" /><ActionTooltip text="Edit" />
                                </button>
                                <button
                                  onClick={() => handleResubmit(sub)}
                                  className="group/action relative w-9 h-9 text-white bg-sky-600 hover:bg-sky-700 rounded-xl inline-flex items-center justify-center transition cursor-pointer shadow-xs"
                                  aria-label="Kirim Ulang"
                                >
                                  <RotateCcw className="w-4 h-4" /><ActionTooltip text="Kirim Ulang" />
                                </button>
                              </>
                            )}

                            {sub.status?.toLowerCase() === "draft" && (loggedInNip === sub.employeeNip || currentUser.role === "maker") && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(sub)}
                                  className="group/action relative w-9 h-9 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
                                  aria-label="Edit"
                                >
                                  <Edit3 className="w-4 h-4" /><ActionTooltip text="Edit" />
                                </button>
                                <button
                                  onClick={() => handleSubmitDraftDirectly(sub)}
                                  className="group/action relative w-9 h-9 text-white bg-sky-600 hover:bg-sky-700 rounded-xl inline-flex items-center justify-center transition cursor-pointer shadow-xs"
                                  aria-label="Kirim"
                                >
                                  <Send className="w-4 h-4" /><ActionTooltip text="Kirim" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm("Apakah Anda yakin ingin membatalkan draft laporan sakit ini? Status akan diubah menjadi Dibatalkan.")) {
                                      handleCancelSakit(sub);
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
                              onClick={() => setSelectedDocSub(sub)}
                              className="group/action relative w-9 h-9 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
                              aria-label="Detail"
                            >
                              <Eye className="w-4 h-4" /><ActionTooltip text="Detail" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isRevision && (
                        <tr className="bg-amber-50/20">
                          <td colSpan={8} className="p-3 pt-0 border-t-0">
                            <div className="p-2.5 bg-amber-100/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                                <span className="font-extrabold shrink-0">Catatan Revisi:</span>
                                <span className="font-semibold italic bg-white/70 px-2.5 py-1 rounded border border-amber-200">
                                  {sub.revisionNote || sub.rejectionReason || "Harap perbaiki pengajuan."}
                                </span>
                              </div>
                              {sub.revisedByName && (
                                <span className="text-[10px] text-amber-800 font-extrabold shrink-0">
                                  Diminta oleh: <strong>{sub.revisedByName} ({sub.revisedByRole?.toUpperCase()})</strong>
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sakit Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-md md:max-w-xl w-full p-4 sm:p-6 md:p-7 space-y-4 my-0 sm:my-8 max-h-[92vh] overflow-y-auto overscroll-y-contain">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-rose-600" /> {editingSub ? "Perbaiki Laporan Sakit" : "Form Laporan Sakit & Upload Surat Dokter"}
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 12-Month Accumulation Info Badge in Modal */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-amber-900">Akumulasi Sakit Anda (12 Bulan Terakhir):</p>
                <p className="text-[11px] text-amber-800">
                  {userAccumulatedSakit.totalDays} Hari Istirahat ({userAccumulatedSakit.totalSubmissionsCount} Kali Laporan)
                </p>
              </div>
              <span className="px-2.5 py-1 bg-amber-200 text-amber-900 font-black rounded-xl text-xs">
                {userAccumulatedSakit.totalDays} Hari
              </span>
            </div>

            <form onSubmit={handleCreateSakit} className="space-y-3.5 text-xs">
              {/* Range Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Tanggal Mulai Sakit</label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    required
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Tanggal Selesai Sakit</label>
                  <input
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    required
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              {/* Calculated Days Display */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Kalkulasi Durasi Istirahat:</span>
                <strong className="text-slate-900 text-sm font-black">{jumlahHari} Hari Kerja</strong>
              </div>

              {/* Instansi / Klinik / Rumah Sakit Field */}
              <div>
                <label className="block font-bold mb-1 text-slate-800">
                  Instansi / Klinik / Rumah Sakit <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={instansiKlinik}
                  onChange={(e) => setInstansiKlinik(e.target.value)}
                  required
                  placeholder="Contoh: RSUD Tugurejo Semarang / Klinik Pratama PLN"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-sky-600"
                />
              </div>

              {/* Nama Dokter Penanggung Jawab */}
              <div>
                <label className="block font-bold mb-1 text-slate-800">Nama Dokter Penanggung Jawab</label>
                <input
                  type="text"
                  value={namaDokter}
                  onChange={(e) => setNamaDokter(e.target.value)}
                  placeholder="Contoh: Dr. Setyo Wibowo, Sp.PD"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-sky-600"
                />
              </div>

              {/* Diagnosa Singkat */}
              <div>
                <label className="block font-bold mb-1 text-slate-800">Diagnosa / Keterangan Sakit</label>
                <input
                  type="text"
                  value={diagnosaSingkat}
                  onChange={(e) => setDiagnosaSingkat(e.target.value)}
                  required
                  placeholder="Contoh: Demam Tinggi, Influenza & ISPA"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-sky-600"
                />
              </div>

              {/* Upload File Surat Dokter (.PDF / Foto) */}
              <div>
                <label className="block font-bold mb-1 text-rose-700">
                  Upload Surat Keterangan Dokter (Hanya .PDF & File Foto) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 mt-1">Format yang diterima: .PDF, .JPG, .PNG, .WEBP</p>

                {suratDokterUrl && (
                  <div className="mt-2.5 p-3 border border-slate-200 rounded-2xl bg-slate-50">
                    <p className="text-[10px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-sky-600" /> Preview File Surat Dokter Uploaded:
                    </p>
                    {suratDokterFileType === "pdf" ? (
                      <div className="p-3 bg-white border border-rose-200 rounded-xl flex items-center gap-3">
                        <FileText className="w-8 h-8 text-rose-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-xs text-slate-900 truncate">{suratDokterFileName}</p>
                          <span className="text-[10px] text-rose-700 font-bold">Dokumen PDF Terlampir</span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={suratDokterUrl}
                        alt="Preview Surat Dokter"
                        className="max-h-32 rounded-xl object-contain mx-auto border border-slate-200"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Maker Signature */}
              <div>
                <label className="block font-bold mb-1 text-slate-800">Tandatangan Canvas Digital Pemohon</label>
                {makerSignatureUrl ? (
                  <div className="p-3 border border-emerald-300 rounded-xl flex items-center justify-between bg-emerald-50">
                    <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> TTD Pemohon Terbubuh
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSignModalOpen(true)}
                      className="text-sky-700 underline font-semibold cursor-pointer"
                    >
                      Ubah
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSignModalOpen(true)}
                    className="w-full h-11 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl font-bold text-slate-800 cursor-pointer transition flex items-center justify-center gap-2"
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
                  onClick={(e) => handleSaveDraftSakit(e)}
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
                  {editingSub && editingSub.status !== "draft" ? "Simpan Perbaikan Laporan" : "Lanjut Kirim ke TL PLN (Checker)"}
                </button>
              </div>
            </form>
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

      {/* Approval Modal with Notes Field (Checker, Verifikasi, Approval PLN & ES) */}
      {isApproveModalOpen && approveSub && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 space-y-4 my-0 sm:my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Persetujuan Sakit ({currentUser?.jabatan})
                  </h3>
                  <p className="text-[11px] text-slate-500">ID: {getFormattedDocNo(approveSub)}</p>
                </div>
              </div>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submission Info Brief */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900">{approveSub.employeeName}</span>
                <span className="font-mono text-slate-600">NIP: {approveSub.employeeNip}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Instansi / Klinik / RS:</span>
                  <strong className="text-slate-900">{approveSub.instansiKlinik || approveSub.namaDokterFaskes}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Dokter Penanggung Jawab:</span>
                  <strong className="text-slate-900">{approveSub.namaDokter || "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Periode Istirahat Sakit:</span>
                  <strong className="text-slate-900">
                    {formatDateIndonesian(approveSub.tanggalMulai)} ({approveSub.jumlahHari} Hari)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Diagnosa:</span>
                  <strong className="text-slate-900">{approveSub.diagnosaSingkat || "-"}</strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4 text-xs">
              {/* Kolom Catatan Approval */}
              <div>
                <label className="block font-bold mb-1.5 text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-sky-600" />
                  <span>Catatan Persetujuan ({currentUser?.role?.toUpperCase()})</span>
                </label>
                <textarea
                  rows={3}
                  value={approvalCatatan}
                  onChange={(e) => setApprovalCatatan(e.target.value)}
                  placeholder="Masukkan catatan verifikasi atau keterangan tambahan (opsional)..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-sky-600"
                />
              </div>

              {/* Digital Signature Canvas for Approver */}
              <div>
                <label className="block font-bold mb-1.5 text-slate-800">
                  Tandatangan Canvas Digital Persetujuan
                </label>
                {approvalSignatureUrl ? (
                  <div className="p-3 border border-emerald-300 rounded-xl flex items-center justify-between bg-emerald-50">
                    <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Tandatangan Digital Siap
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsApprovalSignModalOpen(true)}
                      className="text-sky-700 underline font-semibold cursor-pointer"
                    >
                      Ubah TTD
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsApprovalSignModalOpen(true)}
                    className="w-full h-11 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl font-bold text-slate-800 cursor-pointer transition flex items-center justify-center gap-2"
                  >
                    + Bubuhkan Tandatangan Canvas Approver
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2.5 min-h-[42px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[42px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Setujui Laporan Sakit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature Modals */}
      <SignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSave={(url) => setMakerSignatureUrl(url)}
        title="Tandatangan Laporan Sakit"
      />

      <SignatureModal
        isOpen={isApprovalSignModalOpen}
        onClose={() => setIsApprovalSignModalOpen(false)}
        onSave={(url) => setApprovalSignatureUrl(url)}
        title={`Tandatangan Persetujuan Sakit (${currentUser?.jabatan})`}
      />

      {/* Document Detail Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!selectedDocSub}
        submission={selectedDocSub}
        onClose={() => setSelectedDocSub(null)}
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
        currentApproverRole={revisionSub?.currentApproverRole || currentUser?.role}
        title={`Minta Revisi Laporan Sakit (${revisionSub?.nomorDokumen || ""})`}
      />

      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectSub(null);
        }}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
};
