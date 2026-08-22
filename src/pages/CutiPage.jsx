import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthService } from "../services/authService";
import { api } from "../services/api";
import { SignatureModal } from "../components/common/SignatureModal";
import { DocumentViewerModal } from "../components/common/DocumentViewerModal";
import { matchesNavbarTransactionFilter } from "../utils/navbarTransactionFilter";
import { RejectModal } from "../components/common/RejectModal";
import { RevisionModal } from "../components/common/RevisionModal";
import { AlertNotificationModal } from "../components/common/AlertNotificationModal";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { validateCutiInput } from "../utils/submissionValidation";
import { resolveBackendFileFields, resolveBackendFileUrl } from "../utils/fileUrl";
import { Palmtree, Plus, Check, Eye, Users, XCircle, RotateCcw, Edit3, AlertTriangle, Save, Send, Trash2 } from "lucide-react";
import {
  formatDateIndonesian,
  calculateAccruedCuti,
  getStatusBadgeColor,
  getStatusLabel
} from "../utils/formatters";

const ActionTooltip = ({ text }) => (
  <span className="pointer-events-none absolute bottom-full left-1/2 z-[80] mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover/action:opacity-100">
    {text}
  </span>
);

export const CutiPage = ({
  currentUser,
  submissions,
  settings,
    onRefreshData,
    navbarProjectIds = [],
    startDate = "",
    endDate = ""
}) => {
  const [activeSubTab, setActiveSubTab] = useState("daftar");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDocSub, setSelectedDocSub] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState("all");
  const [cutiType, setCutiType] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [jumlahHari, setJumlahHari] = useState(0);
  const [alamatSelamaCuti, setAlamatSelamaCuti] = useState("");
  const [nomorTeleponDarurat, setNomorTeleponDarurat] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [makerSignatureUrl, setMakerSignatureUrl] = useState("");
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: "info", title: "", message: "" });
  const [approveSub, setApproveSub] = useState(null);
  const [isApproveSignOpen, setIsApproveSignOpen] = useState(false);
  const [rejectSub, setRejectSub] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [revisionSub, setRevisionSub] = useState(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [apiCuti, setApiCuti] = useState([]);

  const getApiError = (error) => error?.response?.data?.message || error?.message || "Terjadi kesalahan saat menghubungi server.";
  const normalizeStatus = (item) => {
    const code = String(item?.status?.kode_status || "").toLowerCase();
    if (item?.status?.is_final === "Y" && (code.includes("reject") || code.includes("tolak"))) return "rejected";
    if (item?.status?.is_final === "Y") return "approved";
    if (code.includes("revision") || code.includes("revisi")) return "revision";
    if (item?.status?.is_initial === "Y" || code.includes("draft")) return "draft";
    return code ? `pending_${code}` : "pending_checker";
  };
  const mapCuti = (item) => ({
    ...item,
    ...resolveBackendFileFields(item),
    id: String(item.id_cuti),
    type: "cuti",
    nomorDokumen: item.no_cuti,
    employeeNip: item.petugas?.nip || item.petugas?.nik || String(item.id_petugas),
    employeeName: item.petugas?.nama || "-",
    employeeJabatan: item.petugas?.jabatan?.nama_jabatan || "-",
    unitUpt: item.petugas?.unit?.nama_unit || "-",
    tanggalPengajuan: item.tgl_pengajuan,
    cutiType: item.jenis_cuti,
    tanggalMulai: item.tgl_mulai,
    tanggalSelesai: item.tgl_selesai,
    jumlahHari: Number(item.lama_hari || 0),
    sisaCutiSebelumnya: item.sisa_cuti_sebelum == null ? null : Number(item.sisa_cuti_sebelum),
    sisaCutiSesudahnya: item.sisa_cuti_setelah == null ? null : Number(item.sisa_cuti_setelah),
    alamatSelamaCuti: item.contact_alamat || "",
    nomorTeleponDarurat: item.nomor_telepon_darurat || "",
    makerSignatureUrl: resolveBackendFileUrl(item.maker_signature),
    keterangan: item.perihal || "",
    status: normalizeStatus(item),
    isFinal: item.status?.is_final === "Y",
    currentApproverRole: item.status?.role?.kode_role?.toLowerCase() || "maker"
  });
  const loadCuti = async () => {
    try {
      const rows = await api.getCuti();
      setApiCuti((Array.isArray(rows) ? rows : []).map(mapCuti));
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Memuat Data Cuti", message: getApiError(error) });
    }
  };
  const refreshCuti = async () => {
    await loadCuti();
    if (onRefreshData) onRefreshData();
  };

  useEffect(() => { loadCuti(); }, []);

  const cutiSubmissions = apiCuti.filter((submission) =>
    matchesNavbarTransactionFilter(submission, { projectIds: navbarProjectIds, startDate, endDate })
  );

  const displaySubmissions = cutiSubmissions.filter((s) => {
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

  const editIdParam = searchParams.get("editId");
  const loggedInNip = currentUser?.petugas?.nip || currentUser?.nip;
  const loggedInStartDate = currentUser?.petugas?.tgl_masuk || currentUser?.tanggalMasuk;

  const currentAccrued = calculateAccruedCuti(
    loggedInStartDate,
    cutiSubmissions.filter((c) => c.employeeNip === loggedInNip && c.status?.toLowerCase() === "approved").reduce((a, b) => a + b.jumlahHari, 0),
    settings?.maxCutiTahunanPerTahun
  );

  useEffect(() => {
    if (editIdParam) {
      const sub = cutiSubmissions.find((s) => s.id === editIdParam);
      if (sub) {
        handleOpenEditModal(sub);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("editId");
          return next;
        }, { replace: true });
      }
    }
  }, [editIdParam, apiCuti]);

  useEffect(() => {
    if (tanggalMulai && tanggalSelesai) {
      const start = new Date(tanggalMulai + "T00:00:00");
      const end = new Date(tanggalSelesai + "T00:00:00");
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setJumlahHari(diffDays > 0 ? diffDays : 0);
      }
    }
  }, [tanggalMulai, tanggalSelesai]);

  if (!currentUser) return <LoadingSkeleton variant="dashboard" />;

  const appendDataUrl = (formData, field, dataUrl) => {
    if (!dataUrl?.startsWith("data:image/")) return;
    const [header, encoded] = dataUrl.split(",");
    const mime = header.match(/data:(.*?);base64/)?.[1] || "image/png";
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    formData.append(field, new Blob([bytes], { type: mime }), `${field}.png`);
  };
  const buildApiPayload = (tglPengajuan = new Date().toISOString().slice(0, 10)) => {
    const idPetugas = currentUser?.id_petugas || currentUser?.petugas?.id_petugas;
    if (!idPetugas) throw new Error("Akun login belum terhubung dengan data petugas (id_petugas).");
    const values = {
      id_petugas: Number(idPetugas),
      tgl_pengajuan: tglPengajuan,
      jenis_cuti: cutiType,
      perihal: keterangan,
      tgl_mulai: tanggalMulai,
      tgl_selesai: tanggalSelesai,
      contact_alamat: alamatSelamaCuti || null,
      nomor_telepon_darurat: nomorTeleponDarurat || null
    };
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, String(value));
    });
    appendDataUrl(formData, "maker_signature", makerSignatureUrl);
    return formData;
  };

  const handleOpenEditModal = (sub) => {
    setEditingSub(sub);
    setCutiType(sub.cutiType || "Cuti Tahunan");
    setTanggalMulai(sub.tanggalMulai || "");
    setTanggalSelesai(sub.tanggalSelesai || "");
    setJumlahHari(sub.jumlahHari || 1);
    setAlamatSelamaCuti(sub.alamatSelamaCuti || "");
    setNomorTeleponDarurat(sub.nomorTeleponDarurat || "");
    setKeterangan(sub.keterangan || "");
    setMakerSignatureUrl(sub.makerSignatureUrl || "");
    setIsNewModalOpen(true);
  };
  const handleOpenCreateModal = () => {
    if (currentAccrued.monthsOfService < 12) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Maaf anda belum dapat membuat pengajuan Cuti",
        message: "Maaf anda belum dapat membuat pengajuan Cuti, Masa Kerja Anda < 12 Bulan"
      });
      return;
    }
    setEditingSub(null);
    setCutiType("");
    setTanggalMulai("");
    setTanggalSelesai("");
    setJumlahHari(0);
    setAlamatSelamaCuti("");
    setNomorTeleponDarurat("");
    setKeterangan("");
    setMakerSignatureUrl("");
    setIsNewModalOpen(true);
  };

  const handleConfirmRevision = async (notes, targetRole) => {
    if (!revisionSub) return;
    try {
      await api.reviseCuti(revisionSub.id, notes, targetRole || "maker");
      setIsRevisionModalOpen(false);
      setRevisionSub(null);
      await refreshCuti();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Mengembalikan Pengajuan", message: getApiError(error) });
    }
  };
  const handleConfirmReject = async (notes) => {
    if (!rejectSub) return;
    try {
      await api.rejectCuti(rejectSub.id, notes);
      setIsRejectModalOpen(false);
      setRejectSub(null);
      await refreshCuti();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Menolak Pengajuan", message: getApiError(error) });
    }
  };
  const handleResubmit = async (sub) => {
    try {
      await api.nextCuti(sub.id);
      await refreshCuti();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Mengirim Pengajuan", message: getApiError(error) });
    }
  };
  const allUsers = AuthService.getUsers() || [];
  const makerHistory = cutiSubmissions.filter((s) => {
    if (s.employeeNip !== loggedInNip) return false;
    const subDate = new Date(s.tanggalPengajuan || s.tanggalMulai);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    return subDate >= twelveMonthsAgo;
  });

  const handleSaveDraftCuti = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentAccrued.monthsOfService < 12) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Simpan Draft Cuti",
        message: "Maaf anda belum dapat membuat pengajuan Cuti, Masa Kerja Anda < 12 Bulan"
      });
      return;
    }

    const currentYear = new Date().getFullYear();
    const approvedDaysThisYear = cutiSubmissions
      .filter((c) => 
        c.employeeNip === loggedInNip && 
        c.status?.toLowerCase() === "approved" &&
        new Date(c.tanggalMulai).getFullYear() === currentYear &&
        (!editingSub || c.id !== editingSub.id)
      )
      .reduce((a, b) => a + b.jumlahHari, 0);

    if (jumlahHari > 2) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Simpan Draft Cuti",
        message: `Maaf, durasi permohonan cuti maksimal adalah 2 hari per pengajuan. Durasi saat ini: ${jumlahHari} Hari.`
      });
      return;
    }

    if (approvedDaysThisYear + jumlahHari > 12) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Simpan Draft Cuti",
        message: `Maaf, total cuti Anda dalam 1 tahun maksimal 12 hari. Anda sudah memiliki ${approvedDaysThisYear} hari cuti disetujui, pengajuan tambahan ${jumlahHari} hari ini akan melebihi batas.`
      });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const valResult = validateCutiInput(tanggalMulai, todayStr);
    if (!valResult.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Simpan Draft Cuti",
        message: valResult.message
      });
      return;
    }

    try {
      const payload = buildApiPayload(editingSub?.tanggalPengajuan || todayStr);
      const response = editingSub
        ? await api.updateCuti(editingSub.id, payload)
        : await api.createCuti(payload);
      const saved = response?.data || response;
      setIsNewModalOpen(false);
      setEditingSub(null);
      setAlertModal({
        isOpen: true,
        type: "success",
        title: "Draft Berhasil Disimpan",
        message: `Draft pengajuan cuti (${saved?.no_cuti || editingSub?.nomorDokumen || "nomor dibuat server"}) berhasil disimpan. Anda dapat memperbarui atau mengirimkannya kapan saja.`
      });
      await refreshCuti();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Simpan Draft Cuti", message: getApiError(error) });
    }
  };

  const handleCreateCuti = async (e) => {
    e.preventDefault();
    if (!cutiType || !tanggalMulai || !tanggalSelesai || !alamatSelamaCuti || !nomorTeleponDarurat || !keterangan) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Cuti",
        message: "Semua kolom formulir (Jenis Cuti, Tanggal Mulai, Tanggal Selesai, Alamat Selama Cuti, Nomor Telepon Darurat, dan Alasan Cuti) harus terisi lengkap sebelum dikirim."
      });
      return;
    }
    if (!makerSignatureUrl) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Cuti",
        message: "Tandatangan Pemohon wajib dibubuhkan sebelum mengirim pengajuan."
      });
      return;
    }

    if (currentAccrued.monthsOfService < 12) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Cuti",
        message: "Maaf anda belum dapat membuat pengajuan Cuti, Masa Kerja Anda < 12 Bulan"
      });
      return;
    }

    const currentYear = new Date().getFullYear();
    const approvedDaysThisYear = cutiSubmissions
      .filter((c) => 
        c.employeeNip === loggedInNip && 
        c.status?.toLowerCase() === "approved" &&
        new Date(c.tanggalMulai).getFullYear() === currentYear &&
        (!editingSub || c.id !== editingSub.id)
      )
      .reduce((a, b) => a + b.jumlahHari, 0);

    if (jumlahHari > 2) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Cuti",
        message: `Maaf, durasi permohonan cuti maksimal adalah 2 hari per pengajuan. Durasi saat ini: ${jumlahHari} Hari.`
      });
      return;
    }

    if (approvedDaysThisYear + jumlahHari > 12) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Cuti",
        message: `Maaf, total cuti Anda dalam 1 tahun maksimal 12 hari. Anda sudah memiliki ${approvedDaysThisYear} hari cuti disetujui, pengajuan tambahan ${jumlahHari} hari ini akan melebihi batas.`
      });
      return;
    }

    if (jumlahHari > currentAccrued.remainingCuti) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Cuti",
        message: `Permohonan cuti (${jumlahHari} Hari) melebihi sisa hak cuti Anda (${currentAccrued.remainingCuti} Hari)!`
      });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const valResult = validateCutiInput(tanggalMulai, todayStr);
    if (!valResult.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Cuti",
        message: valResult.message
      });
      return;
    }

    try {
      const payload = buildApiPayload(editingSub?.tanggalPengajuan || todayStr);
      let id = editingSub?.id;
      if (id) {
        await api.updateCuti(id, payload);
      } else {
        const response = await api.createCuti(payload);
        id = response?.data?.id_cuti || response?.id_cuti;
      }
      if (!id) throw new Error("ID cuti tidak ditemukan pada respons server.");
      await api.nextCuti(id);
      setIsNewModalOpen(false);
      setEditingSub(null);
      setAlertModal({ isOpen: true, type: "success", title: "Pengajuan Berhasil Dikirim", message: "Pengajuan cuti berhasil dikirim ke tahap berikutnya." });
      await refreshCuti();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Kirim Pengajuan Cuti", message: getApiError(error) });
    }
  };

  const handleSubmitDraftDirectly = async (sub) => {
    if (!sub.cutiType || !sub.tanggalMulai || !sub.tanggalSelesai || !sub.alamatSelamaCuti || !sub.nomorTeleponDarurat || !sub.keterangan || !sub.makerSignatureUrl) {
      handleOpenEditModal(sub);
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Formulir Belum Lengkap",
        message: "Pengajuan cuti ini belum lengkap. Harap lengkapi semua kolom formulir (Jenis Cuti, Tanggal, Alamat, No. Telp, Alasan Cuti) dan tandatangan terlebih dahulu sebelum mengirim."
      });
      return;
    }

    if (currentAccrued.monthsOfService < 12) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Cuti",
        message: "Maaf anda belum dapat membuat pengajuan Cuti, Masa Kerja Anda < 12 Bulan"
      });
      return;
    }

    const currentYear = new Date().getFullYear();
    const approvedDaysThisYear = cutiSubmissions
      .filter((c) => 
        c.employeeNip === loggedInNip && 
        c.status?.toLowerCase() === "approved" &&
        new Date(c.tanggalMulai).getFullYear() === currentYear &&
        c.id !== sub.id
      )
      .reduce((a, b) => a + b.jumlahHari, 0);

    if (sub.jumlahHari > 2) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Cuti",
        message: `Maaf, durasi permohonan cuti maksimal adalah 2 hari per pengajuan. Durasi draft ini: ${sub.jumlahHari} Hari.`
      });
      return;
    }

    if (approvedDaysThisYear + sub.jumlahHari > 12) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Cuti",
        message: `Maaf, total cuti Anda dalam 1 tahun maksimal 12 hari. Anda sudah memiliki ${approvedDaysThisYear} hari cuti disetujui, pengajuan tambahan ${sub.jumlahHari} hari ini akan melebihi batas.`
      });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const valResult = validateCutiInput(sub.tanggalMulai, todayStr);
    if (!valResult.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Cuti",
        message: valResult.message
      });
      return;
    }
    try {
      await api.nextCuti(sub.id);
      setAlertModal({ isOpen: true, type: "success", title: "Pengajuan Berhasil Dikirim", message: `Draft pengajuan cuti (${sub.nomorDokumen}) berhasil dikirim ke tahap berikutnya.` });
      await refreshCuti();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Kirim Pengajuan Cuti", message: getApiError(error) });
    }
  };
  const handleApproveSignatureSave = async (dataUrl) => {
    if (!approveSub) return;
    try {
      const signatureByRole = {
        checker: "checker_signature",
        verification: "verification_signature",
        approved1: "approval_1_signature",
        approval1: "approval_1_signature",
        approved2: "approval_2_signature",
        approval2: "approval_2_signature",
        approved3: "approval_3_signature",
        approval3: "approval_3_signature"
      };
      const field = signatureByRole[currentUser.role];
      const workflowPayload = new FormData();
      if (field) appendDataUrl(workflowPayload, field, dataUrl);
      await api.approveCuti(approveSub.id, workflowPayload);
      setIsApproveSignOpen(false);
      setApproveSub(null);
      setAlertModal({ isOpen: true, type: "success", title: "Persetujuan Berhasil", message: `Pengajuan cuti ${approveSub.nomorDokumen || "Pengajuan"} berhasil diproses ke tahap berikutnya.` });
      await refreshCuti();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Memproses Persetujuan", message: getApiError(error) });
    }
  };

  const handleCancelCuti = async (sub) => {
    try {
      await api.deleteCuti(sub.id);
      await refreshCuti();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Membatalkan Cuti", message: getApiError(error) });
    }
  };
  return <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 select-none">
      {
    /* Page Title */
  }
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Palmtree className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" /> Manajemen Cuti Tenaga Kerja
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Maksimal 12 Hari / 12 Bulan dengan Perhitungan Tanggal Masuk Kerja Pegawai
          </p>
        </div>

        {currentUser?.role === "maker" && (
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-[#00A3E0] hover:bg-[#0082B3] active:bg-[#006A93] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#00A3E0]/30 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Ajukan Cuti Baru
          </button>
        )}
      </div>

      {
    /* User Leave Allowance Card Banner */
  }
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <p className="text-[11px] sm:text-xs font-bold text-amber-900 uppercase tracking-wider">
            HAK CUTI ANDA SAAT INI ({currentUser.name})
          </p>
          <p className="text-xs text-slate-700 font-medium">
            Tanggal Masuk Kerja: <strong className="text-slate-900">{formatDateIndonesian(loggedInStartDate)}</strong> ({currentAccrued.monthsOfService} Bulan Masa Kerja)
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto text-center">
          <div className="flex-1 sm:flex-initial px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">Maks Hak Cuti</p>
            <p className="text-base sm:text-lg font-black text-slate-800">{currentAccrued.eligibleTotal} Hari</p>
          </div>
          <div className="flex-1 sm:flex-initial px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">Sisa Kuota Cuti</p>
            <p className="text-base sm:text-lg font-black text-emerald-700">{currentAccrued.remainingCuti} Hari</p>
          </div>
        </div>
      </div>

      {
    /* Subtabs Bar */
  }
      <div className="flex border-b border-slate-200 text-xs font-bold gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
        <button
    onClick={() => setActiveSubTab("daftar")}
    className={`pb-2.5 sm:pb-3 border-b-2 transition cursor-pointer whitespace-nowrap min-h-[38px] ${activeSubTab === "daftar" ? "border-sky-500 text-sky-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"}`}
  >
          Daftar Pengajuan Cuti ({cutiSubmissions.length})
        </button>
        <button
    onClick={() => setActiveSubTab("hak_cuti")}
    className={`pb-2.5 sm:pb-3 border-b-2 transition cursor-pointer whitespace-nowrap min-h-[38px] ${activeSubTab === "hak_cuti" ? "border-sky-500 text-sky-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"}`}
  >
          Tabel Kuota Cuti Pegawai
        </button>
      </div>

      {
    /* SUBTAB 1: DAFTAR CUTI */
  }
      {activeSubTab === "daftar" && <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                DETAIL PENGAJUAN CUTI PEGAWAI
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Filter status dan detail approval berjenjang</p>
            </div>
            
            {/* Status Filter Tab Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "all" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Semua ({cutiSubmissions.length})
              </button>
              <button
                onClick={() => setFilterStatus("draft")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "draft" ? "bg-slate-700 border-slate-700 text-white" : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"}`}
              >
                Draft ({cutiSubmissions.filter(s => s.status && s.status.toLowerCase() === "draft").length})
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
                Perlu Perbaikan ({cutiSubmissions.filter(s => {
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
                Ditolak ({cutiSubmissions.filter(s => s.status && s.status.toLowerCase() === "rejected").length})
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "pending" ? "bg-sky-700 border-sky-700 text-white" : "bg-sky-50/50 border-sky-200 text-sky-800 hover:bg-sky-50"}`}
              >
                Menunggu ({cutiSubmissions.filter(s => s.status && s.status.toLowerCase().startsWith("pending_")).length})
              </button>
              <button
                onClick={() => setFilterStatus("approved")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "approved" ? "bg-emerald-700 border-emerald-700 text-white" : "bg-emerald-50/50 border-emerald-200 text-emerald-800 hover:bg-emerald-50"}`}
              >
                Disetujui ({cutiSubmissions.filter(s => s.status && s.status.toLowerCase() === "approved").length})
              </button>
            </div>
          </div>

          {
    /* Mobile Card List View */
  }
          <div className="block sm:hidden divide-y divide-slate-100">
            {displaySubmissions.length === 0 ? <div className="p-6 text-center text-slate-400 text-xs font-medium">Belum ada pengajuan cuti yang sesuai filter.</div> : displaySubmissions.map((sub) => {
    const sLower = sub.status ? sub.status.toLowerCase() : "";
    const isRevision = sLower === "revision" || sLower === "revision_required";
    const isRejected = sLower === "rejected";
    return <div key={sub.id} className={`p-3.5 space-y-2.5 hover:bg-slate-50 transition ${isRevision ? "bg-amber-50/80 border-l-4 border-l-amber-500" : isRejected ? "bg-rose-50/80 border-l-4 border-l-rose-500" : "bg-white"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{sub.employeeName}</h4>
                        <p className="font-mono text-[10px] text-slate-500">NIP: {sub.employeeNip}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeColor(sub.status)}`}>
                        {getStatusLabel(sub.status)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs space-y-1">
                      <p className="font-semibold text-sky-700">{sub.cutiType}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>Periode: {formatDateIndonesian(sub.tanggalMulai)} - {formatDateIndonesian(sub.tanggalSelesai)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 text-[10px] text-slate-600 font-medium">
                        <span>Durasi: <strong className="text-slate-900">{sub.jumlahHari} Hari</strong></span>
                        <span>Sisa Pasca: <strong className="text-sky-700 font-mono">{sub.sisaCutiSesudahnya ?? "-"} Hari</strong></span>
                      </div>
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
                      {isRevision && loggedInNip === sub.employeeNip && <>
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
                        </>}

                      {sub.status?.toLowerCase() === "draft" && (loggedInNip === sub.employeeNip || currentUser.role === "maker") && <>
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
                              if (window.confirm("Apakah Anda yakin ingin membatalkan draft cuti ini? Status akan diubah menjadi Dibatalkan.")) {
                                handleCancelCuti(sub);
                              }
                            }}
                            className="group/action relative w-9 h-9 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
                            aria-label="Batalkan"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" /><ActionTooltip text="Batalkan" />
                          </button>
                        </>}

                      <button
      onClick={() => setSelectedDocSub(sub)}
      className="group/action relative w-9 h-9 text-indigo-700 bg-indigo-50 active:bg-indigo-100 hover:bg-indigo-100 rounded-xl inline-flex items-center justify-center transition cursor-pointer"
      aria-label="Detail"
    >
                        <Eye className="w-4 h-4" /><ActionTooltip text="Detail" />
                      </button>
                    </div>
                  </div>;
  })}
          </div>

          {
    /* Desktop Table View */
  }
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-3">Nama Pegawai</th>
                  <th className="p-3">NIP</th>
                  <th className="p-3">Jenis Cuti</th>
                  <th className="p-3">Periode Tanggal</th>
                  <th className="p-3">Durasi</th>
                  <th className="p-3">Sisa Cuti Pasca</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displaySubmissions.map((sub) => {
    const sLower = sub.status ? sub.status.toLowerCase() : "";
    const isRevision = sLower === "revision" || sLower === "revision_required";
    const isRejected = sLower === "rejected";
    return <React.Fragment key={sub.id}>
                    <tr className={`hover:bg-slate-50 transition ${isRevision ? "bg-amber-50/50" : isRejected ? "bg-rose-50/50" : ""}`}>
                      <td className="p-3 font-bold text-slate-900">{sub.employeeName}</td>
                      <td className="p-3 font-mono text-slate-600">{sub.employeeNip}</td>
                      <td className="p-3 font-semibold text-slate-800">{sub.cutiType}</td>
                      <td className="p-3 text-slate-700">
                        {formatDateIndonesian(sub.tanggalMulai)} s/d {formatDateIndonesian(sub.tanggalSelesai)}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{sub.jumlahHari} Hari</td>
                      <td className="p-3 font-mono font-bold text-sky-700">{sub.sisaCutiSesudahnya ?? "-"} Hari</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeColor(sub.status)}`}>
                          {getStatusLabel(sub.status)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isRevision && loggedInNip === sub.employeeNip && <>
                              <button
      onClick={() => handleOpenEditModal(sub)}
      className="group/action relative w-9 h-9 text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg inline-flex items-center justify-center transition cursor-pointer"
      aria-label="Edit"
    >
                                <Edit3 className="w-4 h-4" /><ActionTooltip text="Edit" />
                              </button>
                              <button
      onClick={() => handleResubmit(sub)}
      className="group/action relative w-9 h-9 text-white bg-sky-600 hover:bg-sky-700 rounded-lg inline-flex items-center justify-center transition cursor-pointer shadow-xs"
      aria-label="Kirim Ulang"
    >
                                <RotateCcw className="w-4 h-4" /><ActionTooltip text="Kirim Ulang" />
                              </button>
                            </>}

                          {sub.status?.toLowerCase() === "draft" && (loggedInNip === sub.employeeNip || currentUser.role === "maker") && <>
                              <button
      onClick={() => handleOpenEditModal(sub)}
      className="group/action relative w-9 h-9 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg inline-flex items-center justify-center transition cursor-pointer"
      aria-label="Edit"
    >
                                <Edit3 className="w-4 h-4" /><ActionTooltip text="Edit" />
                              </button>
                              <button
      onClick={() => handleSubmitDraftDirectly(sub)}
      className="group/action relative w-9 h-9 text-white bg-sky-600 hover:bg-sky-700 rounded-lg inline-flex items-center justify-center transition cursor-pointer shadow-xs"
      aria-label="Kirim"
    >
                                <Send className="w-4 h-4" /><ActionTooltip text="Kirim" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("Apakah Anda yakin ingin membatalkan draft cuti ini? Status akan diubah menjadi Dibatalkan.")) {
                                    handleCancelCuti(sub);
                                  }
                                }}
                                className="group/action relative w-9 h-9 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg inline-flex items-center justify-center transition cursor-pointer"
                                aria-label="Batalkan"
                              >
                                <Trash2 className="w-4 h-4 text-rose-600" /><ActionTooltip text="Batalkan" />
                              </button>
                            </>}

                          <button
      onClick={() => setSelectedDocSub(sub)}
      className="group/action relative w-9 h-9 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg inline-flex items-center justify-center transition cursor-pointer"
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
                  </React.Fragment>;
  })}
              </tbody>
            </table>
          </div>
        </div>}

      {
        /* SUBTAB 2: DATABASE HAK CUTI PEGAWAI */
      }
      {activeSubTab === "hak_cuti" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-fade-in">
          {currentUser?.role === "maker" ? (
            <>
              <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Palmtree className="w-4 h-4 text-sky-600" />
                  TABEL KUOTA CUTI PEGAWAI - HISTORI PENGAJUAN (12 BULAN TERAKHIR)
                </h3>
                <p className="text-[10px] text-slate-600 font-medium">
                  Menampilkan riwayat pengajuan cuti Anda selama 12 bulan terakhir.
                </p>
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {makerHistory.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium">
                    Belum ada riwayat pengajuan cuti dalam 12 bulan terakhir.
                  </div>
                ) : (
                  makerHistory.map((sub) => (
                    <div key={sub.id} className="p-3.5 space-y-2 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{sub.nomorDokumen}</h4>
                          <p className="font-semibold text-[10px] text-sky-700">{sub.cutiType}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeColor(sub.status)}`}>
                          {getStatusLabel(sub.status)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 space-y-1">
                        <p>Tanggal Pengajuan: {formatDateIndonesian(sub.tanggalPengajuan)}</p>
                        <p>Periode: {formatDateIndonesian(sub.tanggalMulai)} s/d {formatDateIndonesian(sub.tanggalSelesai)}</p>
                        <div className="flex justify-between font-bold pt-1 border-t border-slate-100">
                          <span>Durasi: {sub.jumlahHari} Hari</span>
                          <span className="text-sky-700">Sisa Pasca: {sub.sisaCutiSesudahnya ?? "-"} Hari</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="p-3 w-12">No</th>
                      <th className="p-3">Nomor Dokumen</th>
                      <th className="p-3">Jenis Cuti</th>
                      <th className="p-3">Tanggal Pengajuan</th>
                      <th className="p-3">Periode Cuti</th>
                      <th className="p-3 text-center">Durasi</th>
                      <th className="p-3 text-center">Sisa Cuti Pasca</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {makerHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                          Belum ada riwayat pengajuan cuti dalam 12 bulan terakhir.
                        </td>
                      </tr>
                    ) : (
                      makerHistory.map((sub, index) => (
                        <tr key={sub.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-medium text-slate-500">{index + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{sub.nomorDokumen}</td>
                          <td className="p-3 font-semibold text-slate-800">{sub.cutiType}</td>
                          <td className="p-3 text-slate-600">{formatDateIndonesian(sub.tanggalPengajuan)}</td>
                          <td className="p-3 text-slate-700">
                            {formatDateIndonesian(sub.tanggalMulai)} s/d {formatDateIndonesian(sub.tanggalSelesai)}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800">{sub.jumlahHari} Hari</td>
                          <td className="p-3 text-center font-mono font-bold text-sky-700">{sub.sisaCutiSesudahnya ?? "-"} Hari</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeColor(sub.status)}`}>
                              {getStatusLabel(sub.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  DATABASE LENGKAP TANGGAL MASUK &amp; KUOTA CUTI PEGAWAI
                </h3>
                <p className="text-[10px] text-slate-600 font-medium">
                  Sesuai aturan PLN: Hak cuti maksimal 12 hari/tahun terhitung sejak tanggal masuk kerja tenaga kerja.
                </p>
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {(allUsers || []).map((u) => {
                  const approvedUsedCuti = cutiSubmissions
                    .filter((s) => s.type === "cuti" && s.employeeNip === u.nip && s.status?.toLowerCase() === "approved")
                    .reduce((acc, curr) => acc + curr.jumlahHari, 0);
                  const accrued = calculateAccruedCuti(u.tanggalMasuk, approvedUsedCuti, settings.maxCutiTahunanPerTahun);
                  return (
                    <div key={u.id} className="p-3.5 space-y-1.5 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{u.name}</h4>
                          <p className="font-mono text-[10px] text-slate-500">NIP: {u.nip} • {u.jabatan}</p>
                        </div>
                        <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Sisa: {accrued.remainingCuti} Hari
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                        <span>Masuk: {formatDateIndonesian(u.tanggalMasuk)} ({accrued.monthsOfService} Bkn)</span>
                        <span className="font-medium">Maks: {accrued.eligibleTotal} Hari</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="p-3">Nama Pegawai</th>
                      <th className="p-3">NIP</th>
                      <th className="p-3">Jabatan &amp; Unit</th>
                      <th className="p-3">Tanggal Masuk Kerja</th>
                      <th className="p-3">Masa Kerja</th>
                      <th className="p-3">Hak Cuti Maksimal</th>
                      <th className="p-3">Sisa Kuota Cuti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(allUsers || []).map((u) => {
                      const approvedUsedCuti = cutiSubmissions
                        .filter((s) => s.type === "cuti" && s.employeeNip === u.nip && s.status?.toLowerCase() === "approved")
                        .reduce((acc, curr) => acc + curr.jumlahHari, 0);
                      const accrued = calculateAccruedCuti(u.tanggalMasuk, approvedUsedCuti, settings.maxCutiTahunanPerTahun);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-900">{u.name}</td>
                          <td className="p-3 font-mono text-slate-600">{u.nip}</td>
                          <td className="p-3 text-slate-700">{u.jabatan} ({u.garduInduk})</td>
                          <td className="p-3 font-medium text-slate-800">
                            {formatDateIndonesian(u.tanggalMasuk)}
                          </td>
                          <td className="p-3 text-slate-600">
                            {accrued.monthsOfService} Bulan
                          </td>
                          <td className="p-3 font-bold text-slate-800">{accrued.eligibleTotal} Hari</td>
                          <td className="p-3 font-bold text-emerald-700 font-mono">
                            {accrued.remainingCuti} Hari
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {
    /* New Cuti Modal */
  }
      {isNewModalOpen && <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 md:p-6">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-md md:max-w-xl w-full p-4 sm:p-6 md:p-7 space-y-4 my-0 sm:my-8 max-h-[92vh] overflow-y-auto overscroll-y-contain">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Palmtree className="w-5 h-5 text-amber-600" /> {editingSub ? "Edit & Perbarui Pengajuan Cuti" : "Formulir Pengajuan Cuti Baru"}
            </h3>

            <form onSubmit={handleCreateCuti} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Jenis Cuti</label>
                  <select
                    value={cutiType}
                    onChange={(e) => setCutiType(e.target.value)}
                    required
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Pilih Jenis Cuti --</option>
                    <option value="Cuti Tahunan">Cuti Tahunan</option>
                    <option value="Cuti Besar">Cuti Besar</option>
                    <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                    <option value="Cuti Alasan Penting">Cuti Alasan Penting</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-800">Jumlah Hari Kerja Cuti</label>
                  <input
                    type="number"
                    value={jumlahHari}
                    readOnly
                    required
                    className="w-full h-11 px-3 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-500 focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Tanggal Mulai</label>
                  <input
    type="date"
    value={tanggalMulai}
    onChange={(e) => setTanggalMulai(e.target.value)}
    required
    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Tanggal Selesai</label>
                  <input
    type="date"
    value={tanggalSelesai}
    onChange={(e) => setTanggalSelesai(e.target.value)}
    required
    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Alamat Selama Cuti <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={alamatSelamaCuti}
                    onChange={(e) => setAlamatSelamaCuti(e.target.value)}
                    required
                    placeholder="Jl. Pemuda No. 45, Semarang"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-800">Nomor Telepon Darurat <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={nomorTeleponDarurat}
                    onChange={(e) => setNomorTeleponDarurat(e.target.value)}
                    required
                    placeholder="081234567890"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-800">Alasan / Keterangan Cuti <span className="text-rose-500">*</span></label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  required
                  placeholder="Masukkan alasan atau keperluan permohonan cuti..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {
    /* Digital Signature Canvas Trigger */
  }
              <div>
                <label className="block font-bold mb-1 text-slate-800">Tandatangan Canvas Digital Pemohon</label>
                {makerSignatureUrl ? <div className="p-3 border border-emerald-300 rounded-xl flex items-center justify-between bg-emerald-50">
                    <span className="text-emerald-800 font-bold">✓ TTD Terbubuh</span>
                    <button type="button" onClick={() => setIsSignModalOpen(true)} className="text-sky-700 underline font-semibold cursor-pointer">Ubah</button>
                  </div> : <button
    type="button"
    onClick={() => setIsSignModalOpen(true)}
    className="w-full h-11 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl font-bold text-slate-800 cursor-pointer transition flex items-center justify-center"
  >
                    + Bubuhkan Tandatangan Canvas
                  </button>}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 pb-safe">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2.5 min-h-[42px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                  Batal
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveDraftCuti(e)}
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
                  {editingSub && editingSub.status !== "draft" ? "Simpan & Ajukan Ulang" : "Lanjut Kirim ke TL PLN (Checker)"}
                </button>
              </div>
            </form>
          </div>
        </div>}

      {/* Alert / Notification Modal */}
      <AlertNotificationModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
      />

      {
    /* Signature Modals */
  }
      <SignatureModal
    isOpen={isSignModalOpen}
    onClose={() => setIsSignModalOpen(false)}
    onSave={(url) => setMakerSignatureUrl(url)}
    title="Tandatangan Pemohon Cuti"
  />

      <SignatureModal
    isOpen={isApproveSignOpen}
    onClose={() => setIsApproveSignOpen(false)}
    onSave={handleApproveSignatureSave}
    title={`Persetujuan Digital Cuti (${currentUser.jabatan})`}
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
        title={`Minta Revisi Cuti (${revisionSub?.nomorDokumen || ""})`}
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
        title={`Tolak Pengajuan Cuti (${rejectSub?.nomorDokumen || ""})`}
      />

      <DocumentViewerModal
    isOpen={!!selectedDocSub}
    submission={selectedDocSub}
    onClose={() => setSelectedDocSub(null)}
  />
    </div>;
};
