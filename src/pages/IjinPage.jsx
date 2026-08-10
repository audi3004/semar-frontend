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
import { validateIjinInput } from "../utils/submissionValidation";
import { resolveBackendFileFields, resolveBackendFileUrl } from "../utils/fileUrl";
import { FileCheck2, Plus, Check, Eye, Settings, Save, XCircle, RotateCcw, Edit3, AlertTriangle, Send, Trash2 } from "lucide-react";
import { formatDateIndonesian, getStatusBadgeColor, getStatusLabel } from "../utils/formatters";

const ActionTooltip = ({ text }) => (
  <span className="pointer-events-none absolute bottom-full left-1/2 z-[80] mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover/action:opacity-100">
    {text}
  </span>
);

export const IjinPage = ({
  currentUser,
  submissions,
  settings,
  onRefreshData
}) => {
  const [activeSubTab, setActiveSubTab] = useState("daftar");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDocSub, setSelectedDocSub] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState("all");
  const [maxIjinInput, setMaxIjinInput] = useState(settings?.maxIjinTahunan || 6);
  const [ijinReasonType, setIjinReasonType] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [jumlahHari, setJumlahHari] = useState(0);
  const [keterangan, setKeterangan] = useState("");
  const [makerSignatureUrl, setMakerSignatureUrl] = useState("");
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: "info", title: "", message: "" });
  const handleOpenEditModal = (sub) => {
    setEditingSub(sub);
    setIjinReasonType(sub.ijinReasonType || "");
    setTanggalMulai(sub.tanggalMulai || "");
    setTanggalSelesai(sub.tanggalSelesai || "");
    setJumlahHari(sub.jumlahHari || 0);
    setKeterangan(sub.keterangan || "");
    setMakerSignatureUrl(sub.makerSignatureUrl || "");
    setIsNewModalOpen(true);
  };
  const handleOpenCreateModal = () => {
    setEditingSub(null);
    setIjinReasonType("");
    setTanggalMulai("");
    setTanggalSelesai("");
    setJumlahHari(0);
    setKeterangan("");
    setMakerSignatureUrl("");
    setIsNewModalOpen(true);
  };
  const [approveSub, setApproveSub] = useState(null);
  const [isApproveSignOpen, setIsApproveSignOpen] = useState(false);
  const [rejectSub, setRejectSub] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [revisionSub, setRevisionSub] = useState(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [jumlahHariDisetujui, setJumlahHariDisetujui] = useState(1);
  const [isCheckerIjinModalOpen, setIsCheckerIjinModalOpen] = useState(false);
  const [apiIjin, setApiIjin] = useState([]);

  const getApiError = (error) => error?.response?.data?.message || error?.message || "Terjadi kesalahan saat menghubungi server.";
  const normalizeStatus = (item) => {
    const code = String(item?.status?.kode_status || "").toLowerCase();
    if (item?.status?.is_final === "Y" && (code.includes("reject") || code.includes("tolak"))) return "rejected";
    if (item?.status?.is_final === "Y") return "approved";
    if (code.includes("revision") || code.includes("revisi")) return "revision";
    if (item?.status?.is_initial === "Y" || code.includes("draft")) return "draft";
    return code ? `pending_${code}` : "pending_checker";
  };
  const mapIjin = (item) => ({
    ...item,
    ...resolveBackendFileFields(item),
    id: String(item.id_ijin),
    type: "ijin",
    nomorDokumen: item.nomor_dokumen || `IJIN-${item.id_ijin}`,
    employeeNip: item.petugas?.nip || String(item.id_petugas),
    employeeName: item.petugas?.nama || "-",
    employeeJabatan: item.petugas?.jabatan?.nama_jabatan || "-",
    unitUpt: item.petugas?.unit?.nama_unit || "-",
    tanggalPengajuan: item.created_at?.slice?.(0, 10) || item.tanggal,
    ijinReasonType: item.agenda,
    tanggalMulai: item.tanggal,
    tanggalSelesai: item.tgl_selesai,
    jumlahHari: Math.max(1, Math.round((new Date(item.tgl_selesai) - new Date(item.tanggal)) / 86400000) + 1),
    makerSignatureUrl: resolveBackendFileUrl(item.maker_signature),
    jumlahHariDisetujui: item.jumlah_hari_disetujui,
    keterangan: item.keterangan || "",
    status: normalizeStatus(item),
    currentApproverRole: item.status?.role?.kode_role?.toLowerCase() || "maker"
  });
  const loadIjin = async () => {
    try {
      const rows = await api.getIjin();
      setApiIjin((Array.isArray(rows) ? rows : []).map(mapIjin));
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Memuat Data Ijin", message: getApiError(error) });
    }
  };
  const refreshIjin = async () => {
    await loadIjin();
    if (onRefreshData) onRefreshData();
  };

  useEffect(() => { loadIjin(); }, []);

  // Task 2: Auto-calculate Jumlah Hari (Ijin) from Tanggal Mulai & Tanggal Selesai
  useEffect(() => {
    if (tanggalMulai && tanggalSelesai) {
      const start = new Date(tanggalMulai);
      const end = new Date(tanggalSelesai);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)) + 1);
        setJumlahHari((prev) => (prev !== diffDays ? diffDays : prev));
      }
    }
  }, [tanggalMulai, tanggalSelesai]);
  const ijinSubmissions = apiIjin;
  
  const displaySubmissions = ijinSubmissions.filter((s) => {
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

  useEffect(() => {
    if (editIdParam) {
      const sub = ijinSubmissions.find((s) => s.id === editIdParam);
      if (sub) {
        handleOpenEditModal(sub);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("editId");
          return next;
        }, { replace: true });
      }
    }
  }, [editIdParam, apiIjin]);

  if (!currentUser) return <LoadingSkeleton variant="dashboard" />;

  const appendDataUrl = (formData, field, dataUrl) => {
    if (!dataUrl?.startsWith("data:image/")) return;
    const [header, encoded] = dataUrl.split(",");
    const mime = header.match(/data:(.*?);base64/)?.[1] || "image/png";
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    formData.append(field, new Blob([bytes], { type: mime }), `${field}.png`);
  };
  const buildApiPayload = () => {
    const idPetugas = currentUser?.id_petugas || currentUser?.petugas?.id_petugas;
    if (!idPetugas) throw new Error("Akun login belum terhubung dengan data petugas (id_petugas).");
    const values = {
      id_petugas: Number(idPetugas),
      agenda: ijinReasonType,
      tanggal: tanggalMulai,
      tgl_selesai: tanggalSelesai,
      keterangan: keterangan || null
    };
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, String(value));
    });
    appendDataUrl(formData, "maker_signature", makerSignatureUrl);
    return formData;
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
    DataService.processApproval(rejectSub.id, currentUser, "reject", void 0, notes);
    setIsRejectModalOpen(false);
    setRejectSub(null);
    onRefreshData();
  };
  const handleResubmit = async (sub) => {
    try {
      await api.nextIjin(sub.id);
      await refreshIjin();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Mengirim Pengajuan", message: getApiError(error) });
    }
  };
  const handleSaveDraftIjin = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const valResult = validateIjinInput(tanggalMulai, todayStr);
    if (!valResult.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Simpan Draft Ijin",
        message: valResult.message
      });
      return;
    }

    try {
      const response = editingSub
        ? await api.updateIjin(editingSub.id, buildApiPayload())
        : await api.createIjin(buildApiPayload());
      const saved = response?.data || response;
      setIsNewModalOpen(false);
      setEditingSub(null);
      setAlertModal({ isOpen: true, type: "success", title: "Draft Berhasil Disimpan", message: `Draft pengajuan ijin (IJIN-${saved?.id_ijin || editingSub?.id || "baru"}) berhasil disimpan.` });
      await refreshIjin();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Simpan Draft Ijin", message: getApiError(error) });
    }
  };

  const handleCreateIjin = async (e) => {
    e.preventDefault();
    if (!ijinReasonType || !tanggalMulai || !tanggalSelesai || !keterangan) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Izin",
        message: "Semua kolom formulir (Jenis Izin, Tanggal Mulai, Tanggal Selesai, dan Alasan Izin) harus terisi dan lengkap sebelum dikirim."
      });
      return;
    }
    if (!makerSignatureUrl) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Izin",
        message: "Tandatangan Pemohon wajib dibubuhkan sebelum mengirim pengajuan."
      });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const valResult = validateIjinInput(tanggalMulai, todayStr);
    if (!valResult.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Ijin",
        message: valResult.message
      });
      return;
    }

    try {
      let id = editingSub?.id;
      if (id) {
        await api.updateIjin(id, buildApiPayload());
      } else {
        const response = await api.createIjin(buildApiPayload());
        id = response?.data?.id_ijin || response?.id_ijin;
      }
      if (!id) throw new Error("ID ijin tidak ditemukan pada respons server.");
      await api.nextIjin(id);
      setIsNewModalOpen(false);
      setEditingSub(null);
      setAlertModal({ isOpen: true, type: "success", title: "Pengajuan Berhasil Dikirim", message: "Pengajuan ijin berhasil dikirim ke tahap berikutnya." });
      await refreshIjin();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Kirim Pengajuan Ijin", message: getApiError(error) });
    }
  };

  const handleSubmitDraftDirectly = async (sub) => {
    if (!sub.ijinReasonType || !sub.tanggalMulai || !sub.tanggalSelesai || !sub.keterangan || !sub.makerSignatureUrl) {
      handleOpenEditModal(sub);
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Formulir Belum Lengkap",
        message: "Pengajuan izin ini belum lengkap. Harap lengkapi semua kolom formulir dan tandatangan terlebih dahulu sebelum mengirim."
      });
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const valResult = validateIjinInput(sub.tanggalMulai, todayStr);
    if (!valResult.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan Ijin",
        message: valResult.message
      });
      return;
    }
    try {
      await api.nextIjin(sub.id);
      setAlertModal({ isOpen: true, type: "success", title: "Pengajuan Berhasil Dikirim", message: `Draft pengajuan ijin (${sub.nomorDokumen}) berhasil dikirim ke tahap berikutnya.` });
      await refreshIjin();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Kirim Pengajuan Ijin", message: getApiError(error) });
    }
  };

  const handleCancelIjin = async (sub) => {
    try {
      await api.deleteIjin(sub.id);
      await refreshIjin();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Membatalkan Ijin", message: getApiError(error) });
    }
  };
  const handleSaveDynamicSettings = () => {
    const updatedSettings = { ...settings, maxIjinTahunan: maxIjinInput };
    DataService.saveSettings(updatedSettings);
    onRefreshData();
    alert("Pengaturan limit maksimal ijin berhasil diperbarui!");
  };

  const handleSaveCheckerDraftIjin = (e) => {
    if (e) e.preventDefault();
    if (!approveSub) return;
    const numDays = Number(jumlahHariDisetujui) || approveSub.jumlahHari || 1;
    const updatedFields = {
      jumlahHariDisetujui: numDays,
      checkerDraftCorrection: true,
      checkerDraftSavedAt: new Date().toLocaleString("id-ID")
    };
    DataService.saveCheckerDirectCorrection(approveSub.id, updatedFields, currentUser);
    setIsCheckerIjinModalOpen(false);
    setAlertModal({
      isOpen: true,
      type: "success",
      title: "Draft Koreksi Berhasil Disimpan",
      message: `Draft koreksi penentuan jumlah hari ijin (${numDays} Hari) untuk dokumen ${approveSub.nomorDokumen || approveSub.id} berhasil disimpan sebagai draft. Pengajuan belum dikirim ke Approval 1.`
    });
    onRefreshData();
  };

  const handleApproveSignatureSave = (dataUrl) => {
    if (!approveSub) return;
    const extra = approveSub.type === "ijin" ? { jumlahHariDisetujui: Number(jumlahHariDisetujui) || approveSub.jumlahHari || 1 } : {};
    const updatedSub = DataService.processApproval(approveSub.id, currentUser, "approve", dataUrl, undefined, extra);
    setIsApproveSignOpen(false);
    setIsCheckerIjinModalOpen(false);

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
          message: `Pengajuan ijin ${updatedSub.nomorDokumen || "Pengajuan"} berhasil disetujui! Lanjut Kirim ke role berikutnya: ${nextRoleTitle}.`
        });
      }
    }

    setApproveSub(null);
    onRefreshData();
  };
  return <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 select-none">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" /> Manajemen Ijin Karyawan
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Pengajuan Ijin Resmi dengan Persetujuan Berjenjang
          </p>
        </div>

        {currentUser?.role === "maker" && (
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-[#00A3E0] hover:bg-[#0082B3] active:bg-[#006A93] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#00A3E0]/30 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Ajukan Ijin Baru
          </button>
        )}
      </div>

      {/* Subtabs Bar */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab("daftar")}
          className={`pb-2.5 sm:pb-3 border-b-2 transition cursor-pointer whitespace-nowrap min-h-[38px] ${activeSubTab === "daftar" ? "border-sky-500 text-sky-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Daftar Pengajuan Ijin ({ijinSubmissions.length})
        </button>
        {/*<button
          onClick={() => setActiveSubTab("pengaturan")}
          className={`pb-2.5 sm:pb-3 border-b-2 transition cursor-pointer whitespace-nowrap min-h-[38px] ${activeSubTab === "pengaturan" ? "border-sky-500 text-sky-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Pengaturan Limit Ijin Dinamis
        </button> */}
      </div>

      {
    /* SUBTAB 1: DAFTAR IJIN */
  }
      {activeSubTab === "daftar" && <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                DETAIL PENGAJUAN IJIN PEGAWAI
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Filter status dan detail approval berjenjang</p>
            </div>
            
            {/* Status Filter Tab Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "all" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Semua ({ijinSubmissions.length})
              </button>
              <button
                onClick={() => setFilterStatus("draft")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "draft" ? "bg-slate-700 border-slate-700 text-white" : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"}`}
              >
                Draft ({ijinSubmissions.filter(s => s.status && s.status.toLowerCase() === "draft").length})
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
                Perlu Perbaikan ({ijinSubmissions.filter(s => {
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
                Ditolak ({ijinSubmissions.filter(s => s.status && s.status.toLowerCase() === "rejected").length})
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "pending" ? "bg-sky-700 border-sky-700 text-white" : "bg-sky-50/50 border-sky-200 text-sky-800 hover:bg-sky-50"}`}
              >
                Menunggu ({ijinSubmissions.filter(s => s.status && s.status.toLowerCase().startsWith("pending_")).length})
              </button>
              <button
                onClick={() => setFilterStatus("approved")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "approved" ? "bg-emerald-700 border-emerald-700 text-white" : "bg-emerald-50/50 border-emerald-200 text-emerald-800 hover:bg-emerald-50"}`}
              >
                Disetujui ({ijinSubmissions.filter(s => s.status && s.status.toLowerCase() === "approved").length})
              </button>
            </div>
          </div>

          {/* Mobile View Card List */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {displaySubmissions.length === 0 ? <div className="p-6 text-center text-slate-400 text-xs font-medium">Belum ada pengajuan ijin yang sesuai filter.</div> : displaySubmissions.map((sub) => {
            const sLower = sub.status ? sub.status.toLowerCase() : "";
            const isRevision = sLower === "revision" || sLower === "revision_required";
            const isRejected = sLower === "rejected";
    return <div key={sub.id} className={`p-3.5 space-y-2 hover:bg-slate-50 transition ${isRevision ? "bg-amber-50/80 border-l-4 border-l-amber-500" : isRejected ? "bg-rose-50/80 border-l-4 border-l-rose-500" : "bg-white"}`}>
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
                      <p className="font-semibold text-emerald-800">{sub.ijinReasonType}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200/40">
                        <span>Periode: {formatDateIndonesian(sub.tanggalMulai)} - {formatDateIndonesian(sub.tanggalSelesai)}</span>
                        <strong className="text-slate-900">{sub.jumlahHari} Hari</strong>
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
                              if (window.confirm("Apakah Anda yakin ingin membatalkan draft ijin ini? Status akan diubah menjadi Dibatalkan.")) {
                                handleCancelIjin(sub);
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

          {/* Desktop View Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-3">Nama Pegawai</th>
                  <th className="p-3">NIP</th>
                  <th className="p-3">Alasan Ijin</th>
                  <th className="p-3">Periode</th>
                  <th className="p-3">Jumlah Hari</th>
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
                      <td className="p-3 font-semibold text-slate-800">{sub.ijinReasonType}</td>
                      <td className="p-3 text-slate-700">
                        {formatDateIndonesian(sub.tanggalMulai)} s/d {formatDateIndonesian(sub.tanggalSelesai)}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{sub.jumlahHari} Hari</td>
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
                                  if (window.confirm("Apakah Anda yakin ingin membatalkan draft ijin ini? Status akan diubah menjadi Dibatalkan.")) {
                                    handleCancelIjin(sub);
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
                        <td colSpan={7} className="p-3 pt-0 border-t-0">
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

      {/* SUBTAB 2: PENGATURAN LIMIT IJIN DINAMIS */}
      {/* {activeSubTab === "pengaturan" && <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 max-w-xl space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-sky-600" /> Pengaturan Limit Akses Ijin Dinamis
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Ubah batas maksimal ijin kerja per tahun yang dapat diajukan oleh tenaga kerja.
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Batas Maksimal Ijin (Hari / Tahun)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={maxIjinInput}
                onChange={(e) => setMaxIjinInput(Number(e.target.value))}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sky-700 text-sm focus:bg-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveDynamicSettings}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" /> Simpan Perubahan Limit
            </button>
          </div>
        </div>}
        */}

      {/* New Ijin Modal */}
      {isNewModalOpen && <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 md:p-6">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-md md:max-w-xl w-full p-4 sm:p-6 md:p-7 space-y-4 my-0 sm:my-8 max-h-[92vh] overflow-y-auto overscroll-y-contain">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileCheck2 className="w-5 h-5 text-emerald-600" /> {editingSub ? "Edit & Perbarui Pengajuan Ijin" : "Formulir Pengajuan Ijin Baru"}
            </h3>

            <form onSubmit={handleCreateIjin} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Alasan Ijin</label>
                  <select
                    value={ijinReasonType}
                    onChange={(e) => setIjinReasonType(e.target.value)}
                    required
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Pilih Alasan Ijin --</option>
                    <option value="Keperluan Pribadi / Alasan Keluarga">Keperluan Pribadi / Alasan Keluarga</option>
                    <option value="Duka Cita Anggota Keluarga">Duka Cita Anggota Keluarga</option>
                    <option value="Pernikahan">Pernikahan</option>
                    <option value="Kebutuhan Urusan Resmi State">Kebutuhan Urusan Resmi State</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-800">Jumlah Hari (Ijin)</label>
                  <input
                    type="text"
                    readOnly
                    value={`${jumlahHari} Hari`}
                    className="w-full h-11 px-3 bg-slate-100 border border-slate-300 rounded-xl font-bold text-sky-700 focus:outline-none"
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

              <div>
                <label className="block font-bold mb-1 text-slate-800">Keterangan Tambahan</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  required
                  rows={2}
                  placeholder="Uraikan keperluan ijin..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

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
                    + Tandatangan Pemohon
                  </button>}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 pb-safe">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2.5 min-h-[42px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                  Batal
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveDraftIjin(e)}
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

      {/* Checker Review & Approve Days Modal */}
      {isCheckerIjinModalOpen && approveSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              Persetujuan &amp; Penentuan Jumlah Hari (di Setujui)
            </h3>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">{approveSub.employeeName}</p>
                <p className="text-slate-600">Alasan: {approveSub.ijinReasonType || approveSub.alasanIjin || "Ijin Resmi"}</p>
                <p className="text-slate-600">
                  Periode: {formatDateIndonesian(approveSub.tanggalMulai)} s/d {formatDateIndonesian(approveSub.tanggalSelesai)}
                </p>
                <p className="text-slate-700 font-semibold pt-1">
                  Jumlah Hari Pengajuan (Ijin): <span className="font-bold text-sky-700">{approveSub.jumlahHari} Hari</span>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Jumlah Hari (di Setujui)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={jumlahHariDisetujui}
                  onChange={(e) => setJumlahHariDisetujui(Number(e.target.value))}
                  className="w-full h-11 px-3 bg-white border border-emerald-400 rounded-xl font-extrabold text-emerald-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCheckerIjinModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCheckerDraftIjin}
                className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer transition"
              >
                <Save className="w-4 h-4 text-slate-600" /> Simpan Draft Koreksi
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCheckerIjinModalOpen(false);
                  setIsApproveSignOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
              >
                <Check className="w-4 h-4" /> Setujui &amp; Kirim ke Approval 1
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modals */}
      <SignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSave={(url) => setMakerSignatureUrl(url)}
        title="Tandatangan Pemohon Ijin"
        saveButtonText="Simpan Tandatangan"
      />

      <SignatureModal
        isOpen={isApproveSignOpen}
        onClose={() => setIsApproveSignOpen(false)}
        onSave={handleApproveSignatureSave}
        title={`Persetujuan Digital Ijin (${currentUser.jabatan})`}
        subtitle="Bubuhkan tandatangan Anda untuk menyetujui dan mengirimkan pengajuan ke Approval 1 / Verifikator."
        saveButtonText="Setujui & Kirim ke Approval 1"
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
        title={`Minta Revisi Pengajuan Ijin (${revisionSub?.nomorDokumen || ""})`}
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
        title={`Tolak Pengajuan Ijin (${rejectSub?.nomorDokumen || ""})`}
      />

      <DocumentViewerModal
        isOpen={!!selectedDocSub}
        submission={selectedDocSub}
        onClose={() => setSelectedDocSub(null)}
      />
    </div>;
};
