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
import { validateSppdInput } from "../utils/submissionValidation";
import { Briefcase, Plus, Check, Eye, Trash2, XCircle, RotateCcw, Edit3, AlertTriangle, Save, Send } from "lucide-react";
import { formatRupiah, formatDateIndonesian, getStatusBadgeColor, getStatusLabel } from "../utils/formatters";

const ActionTooltip = ({ text }) => (
  <span className="pointer-events-none absolute bottom-full left-1/2 z-[80] mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover/action:opacity-100">
    {text}
  </span>
);
export const SppdPage = ({
  currentUser,
  submissions,
  onRefreshData
}) => {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDocSub, setSelectedDocSub] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState("all");
  const [nomorSuratTugas, setNomorSuratTugas] = useState("");
  const [maksudPerjalanan, setMaksudPerjalanan] = useState("");
  const [kotaAsal, setKotaAsal] = useState("");
  const [kotaTujuan, setKotaTujuan] = useState("");
  const [tanggalBerangkat, setTanggalBerangkat] = useState("");
  const [tanggalKembali, setTanggalKembali] = useState("");
  const [durasiHari, setDurasiHari] = useState(0);
  const [bebanAnggaranUnit, setBebanAnggaranUnit] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [makerSignatureUrl, setMakerSignatureUrl] = useState("");
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: "info", title: "", message: "" });

  const handleOpenEditModal = (sub) => {
    setEditingSub(sub);
    setNomorSuratTugas(sub.nomorSuratTugas || "");
    setMaksudPerjalanan(sub.maksudPerjalanan || "");
    setKotaAsal(sub.kotaAsal || "");
    setKotaTujuan(sub.kotaTujuan || "");
    setTanggalBerangkat(sub.tanggalBerangkat || "");
    setTanggalKembali(sub.tanggalKembali || "");
    setDurasiHari(sub.durasiHari || 0);
    setBebanAnggaranUnit(sub.bebanAnggaranUnit || "");
    setExpenses(sub.expenses || []);
    setMakerSignatureUrl(sub.makerSignatureUrl || "");
    setIsNewModalOpen(true);
  };
  const handleOpenCreateModal = () => {
    setEditingSub(null);
    setNomorSuratTugas("");
    setMaksudPerjalanan("");
    setKotaAsal("");
    setKotaTujuan("");
    setTanggalBerangkat("");
    setTanggalKembali("");
    setDurasiHari(0);
    setBebanAnggaranUnit("");
    setExpenses([]);
    setMakerSignatureUrl("");
    setIsNewModalOpen(true);
  };
  const [approveSub, setApproveSub] = useState(null);
  const [isApproveSignOpen, setIsApproveSignOpen] = useState(false);
  const [rejectSub, setRejectSub] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Checker Expense Management (Task 5)
  const [checkerExpenses, setCheckerExpenses] = useState([]);
  const [isCheckerSppdModalOpen, setIsCheckerSppdModalOpen] = useState(false);

  // Approver 2 Expense Nominal Management (Task 6)
  const [approver2Expenses, setApprover2Expenses] = useState([]);
  const [isApprover2SppdModalOpen, setIsApprover2SppdModalOpen] = useState(false);
  const [apiSppd, setApiSppd] = useState([]);

  const getApiError = (error) => error?.response?.data?.message || error?.message || "Terjadi kesalahan saat menghubungi server.";
  const normalizeStatus = (item) => {
    const code = String(item?.status?.kode_status || "").toLowerCase();
    if (item?.status?.is_final === "Y" && (code.includes("reject") || code.includes("tolak"))) return "rejected";
    if (item?.status?.is_final === "Y") return "approved";
    if (code.includes("revision") || code.includes("revisi")) return "revision";
    if (item?.status?.is_initial === "Y" || code.includes("draft")) return "draft";
    return code ? `pending_${code}` : "pending_checker";
  };
  const mapSppd = (item) => {
    const expensesData = [
      { id: "akomodasi", kategori: "Akomodasi", deskripsi: item.desc_akomodasi || "Biaya Akomodasi", nominal: Number(item.rp_akomodasi || 0) },
      { id: "transportasi", kategori: "Transportasi", deskripsi: item.desc_transportasi || "Biaya Transportasi", nominal: Number(item.rp_transportasi || 0) },
      { id: "lain-lain", kategori: "Lain-lain", deskripsi: item.desc_lain_lain || "Biaya Lain-lain", nominal: Number(item.rp_lain_lain || 0) }
    ].filter((entry) => entry.nominal > 0 || !entry.deskripsi.startsWith("Biaya "));
    return {
      ...item,
      id: String(item.id_sppd),
      type: "sppd",
      nomorDokumen: item.no_sppd,
      nomorSuratTugas: item.no_sppd,
      employeeNip: item.petugas?.nip || String(item.id_petugas),
      employeeName: item.petugas?.nama || "-",
      employeeJabatan: item.petugas?.jabatan?.nama_jabatan || "-",
      unitUpt: item.petugas?.unit?.nama_unit || "-",
      tanggalPengajuan: item.created_at?.slice?.(0, 10) || item.tgl_berangkat,
      maksudPerjalanan: item.maksud_dinas,
      kotaAsal: item.kota_asal || "",
      kotaTujuan: item.kota_tujuan,
      tanggalBerangkat: item.tgl_berangkat,
      tanggalKembali: item.tgl_kembali,
      durasiHari: Number(item.lama_dinas || 1),
      bebanAnggaranUnit: item.beban_anggaran || "",
      expenses: expensesData,
      totalEstimasiBiaya: expensesData.reduce((sum, entry) => sum + entry.nominal, 0),
      makerSignatureUrl: item.maker_signature || "",
      status: normalizeStatus(item),
      currentApproverRole: item.status?.role?.kode_role?.toLowerCase() || "maker"
    };
  };
  const loadSppd = async () => {
    try {
      const rows = await api.getSppd();
      setApiSppd((Array.isArray(rows) ? rows : []).map(mapSppd));
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Memuat Data SPPD", message: getApiError(error) });
    }
  };
  const refreshSppd = async () => {
    await loadSppd();
    if (onRefreshData) onRefreshData();
  };
  useEffect(() => { loadSppd(); }, []);

  // Auto calculate durasiHari SPPD
  useEffect(() => {
    if (tanggalBerangkat && tanggalKembali) {
      const start = new Date(tanggalBerangkat);
      const end = new Date(tanggalKembali);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)) + 1);
        setDurasiHari((prev) => (prev !== diffDays ? diffDays : prev));
      }
    }
  }, [tanggalBerangkat, tanggalKembali]);
  const sppdSubmissions = apiSppd;

  const displaySubmissions = sppdSubmissions.filter((s) => {
    const sLower = s.status ? s.status.toLowerCase() : "";
    if (filterStatus === "draft") {
      return sLower === "draft";
    }
    if (filterStatus === "revision") {
      return sLower === "revision" || sLower === "revision_required" || sLower === "rejected";
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

  useEffect(() => {
    if (editIdParam) {
      const sub = sppdSubmissions.find((s) => s.id === editIdParam);
      if (sub) {
        handleOpenEditModal(sub);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("editId");
          return next;
        }, { replace: true });
      }
    }
  }, [editIdParam, apiSppd]);

  if (!currentUser) return <LoadingSkeleton variant="dashboard" />;

  const loggedInNip = currentUser?.petugas?.nip || currentUser?.nip;
  const expenseByCategory = (category) => expenses.filter((item) => item.kategori === category);
  const expenseTotal = (category) => expenseByCategory(category).reduce((sum, item) => sum + Number(item.nominal || 0), 0);
  const expenseDescription = (category) => expenseByCategory(category).map((item) => item.deskripsi).filter(Boolean).join("; ") || null;
  const appendDataUrl = (formData, field, dataUrl) => {
    if (!dataUrl?.startsWith("data:")) return;
    const [header, encoded] = dataUrl.split(",");
    if (!encoded) return;
    const mime = header.match(/data:(.*?);base64/)?.[1] || "image/png";
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    formData.append(field, new Blob([bytes], { type: mime }), `${field}.png`);
  };
  const buildApiPayload = () => {
    const idPetugas = currentUser?.id_petugas || currentUser?.petugas?.id_petugas;
    if (!idPetugas) throw new Error("Akun login belum terhubung dengan data petugas (id_petugas).");
    const values = {
      id_petugas: Number(idPetugas),
      no_sppd: nomorSuratTugas,
      kota_asal: kotaAsal,
      kota_tujuan: kotaTujuan,
      maksud_dinas: maksudPerjalanan,
      tgl_berangkat: tanggalBerangkat,
      tgl_kembali: tanggalKembali,
      beban_anggaran: bebanAnggaranUnit,
      rp_akomodasi: expenseTotal("Akomodasi"),
      desc_akomodasi: expenseDescription("Akomodasi"),
      rp_transportasi: expenseTotal("Transportasi"),
      desc_transportasi: expenseDescription("Transportasi"),
      rp_lain_lain: expenseTotal("Lain-lain"),
      desc_lain_lain: expenseDescription("Lain-lain")
    };
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, String(value));
    });
    appendDataUrl(formData, "maker_signature", makerSignatureUrl);
    return formData;
  };

  const handleOpenApproveFlow = (sub) => {
    setApproveSub(sub);
    const effectiveRole = currentUser.role === "admin" ? sub.currentApproverRole : currentUser.role;

    if (effectiveRole === "checker") {
      setCheckerExpenses(
        sub.expenses && sub.expenses.length > 0
          ? sub.expenses.map((e) => ({
              ...e,
              kategori: ["Transportasi", "Akomodasi", "Lain-lain"].includes(e.kategori) ? e.kategori : "Lain-lain",
              nominal: 0
            }))
          : [
              { id: "exp-1", deskripsi: "Biaya Transportasi Perjalanan Dinas", kategori: "Transportasi", nominal: 0 }
            ]
      );
      setIsCheckerSppdModalOpen(true);
    } else if (effectiveRole === "approved1" || effectiveRole === "approved2") {
      setApprover2Expenses(
        sub.expenses && sub.expenses.length > 0
          ? sub.expenses.map((e) => ({ ...e, nominal: e.nominal || 0 }))
          : [
              { id: "exp-1", deskripsi: "Biaya Transportasi Perjalanan Dinas", kategori: "Transportasi", nominal: 0 }
            ]
      );
      setIsApprover2SppdModalOpen(true);
    } else {
      setIsApproveSignOpen(true);
    }
  };

  const [revisionSub, setRevisionSub] = useState(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

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
      await api.nextSppd(sub.id);
      await refreshSppd();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Mengirim SPPD", message: getApiError(error) });
    }
  };
  const totalEstimasiBiaya = expenses.reduce((a, b) => a + (b.nominal || 0), 0);
  const handleAddExpenseRow = () => {
    setExpenses([
      ...expenses,
      { id: "exp-" + Date.now(), deskripsi: "Komponen Biaya Baru", kategori: "Lain-lain", nominal: 25e4 }
    ]);
  };
  const handleRemoveExpenseRow = (id) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };
  const handleSaveDraftSppd = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!currentUser) return;

    try {
      const response = editingSub
        ? await api.updateSppd(editingSub.id, buildApiPayload())
        : await api.createSppd(buildApiPayload());
      const saved = response?.data || response;
      setIsNewModalOpen(false);
      setEditingSub(null);
      setAlertModal({
        isOpen: true,
        type: "success",
        title: "Draft Berhasil Disimpan",
        message: `Draft pengajuan SPPD (${saved?.no_sppd || nomorSuratTugas}) berhasil disimpan.`
      });
      await refreshSppd();
    } catch (err) {
      console.error("Error saving SPPD draft:", err);
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Simpan Draft SPPD",
        message: getApiError(err)
      });
    }
  };

  const handleCreateSppd = async (e) => {
    e.preventDefault();
    if (!nomorSuratTugas || !maksudPerjalanan || !kotaAsal || !kotaTujuan || !tanggalBerangkat || !tanggalKembali || !bebanAnggaranUnit) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan SPPD",
        message: "Semua kolom formulir (Nomor Surat Tugas, Maksud Perjalanan, Kota Asal, Kota Tujuan, Tanggal Berangkat, Tanggal Kembali, dan Beban Anggaran) harus terisi dan lengkap sebelum dikirim."
      });
      return;
    }
    if (!makerSignatureUrl) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan SPPD",
        message: "Tandatangan Pemohon wajib dibubuhkan sebelum mengirim pengajuan."
      });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const valResult = validateSppdInput(tanggalBerangkat, tanggalKembali, todayStr);
    if (!valResult.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan SPPD",
        message: valResult.message
      });
      return;
    }

    try {
      let id = editingSub?.id;
      if (id) {
        await api.updateSppd(id, buildApiPayload());
      } else {
        const response = await api.createSppd(buildApiPayload());
        id = response?.data?.id_sppd || response?.id_sppd;
      }
      if (!id) throw new Error("ID SPPD tidak ditemukan pada respons server.");
      await api.nextSppd(id);
      setIsNewModalOpen(false);
      setEditingSub(null);
      setAlertModal({ isOpen: true, type: "success", title: "Pengajuan Berhasil Dikirim", message: "Pengajuan SPPD berhasil dikirim ke tahap berikutnya." });
      await refreshSppd();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Kirim Pengajuan SPPD", message: getApiError(error) });
    }
  };

  const handleSubmitDraftDirectly = async (sub) => {
    if (!sub.nomorSuratTugas || !sub.maksudPerjalanan || !sub.kotaAsal || !sub.kotaTujuan || !sub.tanggalBerangkat || !sub.tanggalKembali || !sub.makerSignatureUrl) {
      handleOpenEditModal(sub);
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Formulir Belum Lengkap",
        message: "Pengajuan SPPD ini belum lengkap. Harap lengkapi semua kolom formulir dan tandatangan terlebih dahulu sebelum mengirim."
      });
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const valResult = validateSppdInput(sub.tanggalBerangkat, sub.tanggalKembali, todayStr);
    if (!valResult.isValid) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal Kirim Pengajuan SPPD",
        message: valResult.message
      });
      return;
    }
    try {
      await api.nextSppd(sub.id);
      setAlertModal({ isOpen: true, type: "success", title: "Pengajuan Berhasil Dikirim", message: `Draft pengajuan SPPD (${sub.nomorDokumen}) berhasil dikirim ke tahap berikutnya.` });
      await refreshSppd();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Kirim Pengajuan SPPD", message: getApiError(error) });
    }
  };

  const handleCancelSppd = async (sub) => {
    try {
      await api.deleteSppd(sub.id);
      await refreshSppd();
    } catch (error) {
      setAlertModal({ isOpen: true, type: "error", title: "Gagal Membatalkan SPPD", message: getApiError(error) });
    }
  };
  const handleApproveSignatureSave = (dataUrl) => {
    if (!approveSub) return;
    let extra = {};
    const role = currentUser.role === "admin" ? approveSub.currentApproverRole : currentUser.role;

    if (role === "checker") {
      extra = { expenses: checkerExpenses, totalEstimasiBiaya: 0 };
    } else if (role === "approved1" || role === "approved2") {
      const total = approver2Expenses.reduce((a, b) => a + (Number(b.nominal) || 0), 0);
      extra = { expenses: approver2Expenses, totalEstimasiBiaya: total };
    }

    const updatedSub = DataService.processApproval(approveSub.id, currentUser, "approve", dataUrl, undefined, extra);
    setIsApproveSignOpen(false);
    setIsCheckerSppdModalOpen(false);
    setIsApprover2SppdModalOpen(false);

    if (updatedSub) {
      if (updatedSub.status === "APPROVED" || role === "approved3") {
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
          message: `Pengajuan SPPD ${updatedSub.nomorDokumen || "Pengajuan"} berhasil disetujui! Lanjut Kirim ke role berikutnya: ${nextRoleTitle}.`
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
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" /> SPPD (Surat Perintah Perjalanan Dinas)
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Pengajuan Biaya Perjalanan Dinas Berdasar Surat Tugas Resmi PLN
          </p>
        </div>

        {currentUser?.role === "maker" && (
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-[#00A3E0] hover:bg-[#0082B3] active:bg-[#006A93] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#00A3E0]/30 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Ajukan SPPD Baru
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              DETAIL PENGAJUAN SPPD PEGAWAI
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Filter status dan detail approval berjenjang</p>
          </div>
          
          {/* Status Filter Tab Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "all" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              Semua ({sppdSubmissions.length})
            </button>
            <button
              onClick={() => setFilterStatus("draft")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "draft" ? "bg-slate-700 border-slate-700 text-white" : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"}`}
            >
              Draft ({sppdSubmissions.filter(s => s.status && s.status.toLowerCase() === "draft").length})
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
              Perlu Perbaikan ({sppdSubmissions.filter(s => {
                const sL = s.status ? s.status.toLowerCase() : "";
                return sL === "revision" || sL === "revision_required" || sL === "rejected";
              }).length})
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "pending" ? "bg-sky-700 border-sky-700 text-white" : "bg-sky-50/50 border-sky-200 text-sky-800 hover:bg-sky-50"}`}
            >
              Menunggu ({sppdSubmissions.filter(s => s.status && s.status.toLowerCase().startsWith("pending_")).length})
            </button>
            <button
              onClick={() => setFilterStatus("approved")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${filterStatus === "approved" ? "bg-emerald-700 border-emerald-700 text-white" : "bg-emerald-50/50 border-emerald-200 text-emerald-800 hover:bg-emerald-50"}`}
            >
              Disetujui ({sppdSubmissions.filter(s => s.status && s.status.toLowerCase() === "approved").length})
            </button>
          </div>
        </div>

        {/* Mobile View Card List */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {displaySubmissions.length === 0 ? <div className="p-6 text-center text-slate-400 text-xs font-medium">Belum ada pengajuan SPPD yang sesuai filter.</div> : displaySubmissions.map((sub) => {
    const sLower = sub.status ? sub.status.toLowerCase() : "";
    const isRevision = sLower === "revision" || sLower === "revision_required" || sLower === "rejected";
    return <div key={sub.id} className={`p-3.5 space-y-2.5 hover:bg-slate-50 transition ${isRevision ? "bg-amber-50/80 border-l-4 border-l-amber-500" : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{sub.employeeName}</h4>
                      <p className="font-mono text-[10px] text-slate-500">No. Surat: {sub.nomorSuratTugas}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeColor(sub.status)}`}>
                      {getStatusLabel(sub.status)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs space-y-1">
                    <p className="font-semibold text-sky-800">{sub.kotaAsal} &rarr; {sub.kotaTujuan}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>{formatDateIndonesian(sub.tanggalBerangkat)}</span>
                      <strong className="text-slate-900">{sub.durasiHari} Hari</strong>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 text-[11px] font-bold">
                      <span className="text-slate-600">Total Biaya:</span>
                      <span className={`font-mono ${(sub.totalEstimasiBiaya > 0 || sub.expenses?.some(e => Number(e.nominal) > 0)) ? "text-emerald-700" : "text-slate-500"}`}>
                        {formatRupiah(
                          sub.totalEstimasiBiaya && Number(sub.totalEstimasiBiaya) > 0
                            ? sub.totalEstimasiBiaya
                            : (sub.expenses || []).reduce((acc, e) => acc + (Number(e.nominal) || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>

                  {isRevision && (
                    <div className="p-2.5 bg-amber-100/80 border border-amber-300 rounded-xl text-amber-900 text-xs flex flex-col gap-1">
                      <p className="font-extrabold flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                        <span>Catatan Perbaikan dari Peninjau:</span>
                      </p>
                      <p className="font-semibold italic text-[11px] bg-white/75 p-1.5 rounded border border-amber-200/80">
                        {sub.revisionNote || sub.rejectionReason || "Harap perbaiki pengajuan sesuai catatan."}
                      </p>
                      {sub.revisedByName && (
                        <p className="text-[10px] text-amber-800 font-extrabold self-end mt-0.5">
                          Diminta oleh: {sub.revisedByName} ({sub.revisedByRole ? sub.revisedByRole.toUpperCase() : "Checker"})
                        </p>
                      )}
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
                            if (window.confirm("Apakah Anda yakin ingin membatalkan draft SPPD ini? Status akan diubah menjadi Dibatalkan.")) {
                              handleCancelSppd(sub);
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
                </div>;
  })}
        </div>

        {
    /* Desktop View Table */
  }
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <th className="p-3">Nama Pegawai</th>
                <th className="p-3">No. Surat Tugas</th>
                <th className="p-3">Kota Tujuan</th>
                <th className="p-3">Periode Dinas</th>
                <th className="p-3">Total Biaya SPPD</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displaySubmissions.map((sub) => {
    const sLower = sub.status ? sub.status.toLowerCase() : "";
    const isRevision = sLower === "revision" || sLower === "revision_required" || sLower === "rejected";
    return <React.Fragment key={sub.id}>
                    <tr className={`hover:bg-slate-50 transition ${isRevision ? "bg-amber-50/50" : ""}`}>
                    <td className="p-3 font-bold text-slate-900">{sub.employeeName}</td>
                    <td className="p-3 font-mono text-slate-600">{sub.nomorSuratTugas}</td>
                    <td className="p-3 font-semibold text-slate-800">{sub.kotaAsal} &rarr; {sub.kotaTujuan}</td>
                    <td className="p-3 text-slate-700">
                      {formatDateIndonesian(sub.tanggalBerangkat)} ({sub.durasiHari} Hari)
                    </td>
                    <td className={`p-3 font-mono font-bold ${(sub.totalEstimasiBiaya > 0 || sub.expenses?.some(e => Number(e.nominal) > 0)) ? "text-emerald-700" : "text-slate-500"}`}>
                      {formatRupiah(
                        sub.totalEstimasiBiaya && Number(sub.totalEstimasiBiaya) > 0
                          ? sub.totalEstimasiBiaya
                          : (sub.expenses || []).reduce((acc, e) => acc + (Number(e.nominal) || 0), 0)
                      )}
                    </td>
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

                        {sub.status?.toLowerCase() === "draft" && (loggedInNip === sub.employeeNip || currentUser.role === "maker") && (
                          <>
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
                                if (window.confirm("Apakah Anda yakin ingin membatalkan draft SPPD ini? Status akan diubah menjadi Dibatalkan.")) {
                                  handleCancelSppd(sub);
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
      </div>

      {
    /* New SPPD Modal */
  }
      {isNewModalOpen && <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 md:p-6">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-lg md:max-w-2xl w-full p-4 sm:p-6 md:p-7 space-y-4 my-0 sm:my-8 max-h-[92vh] overflow-y-auto overscroll-y-contain">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-5 h-5 text-sky-600" /> {editingSub ? "Edit & Perbarui SPPD Perjalanan Dinas" : "Formulir Pengajuan SPPD Perjalanan Dinas"}
            </h3>

            <form onSubmit={handleCreateSppd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Nomor Dasar Surat Tugas PLN</label>
                <input
                  type="text"
                  value={nomorSuratTugas}
                  onChange={(e) => setNomorSuratTugas(e.target.value)}
                  placeholder="Contoh: ST/098/PLN-UPT/VII/2026"
                  required
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Maksud &amp; Tujuan Perjalanan Dinas</label>
                <input
                  type="text"
                  value={maksudPerjalanan}
                  onChange={(e) => setMaksudPerjalanan(e.target.value)}
                  placeholder="Deskripsikan maksud & tujuan perjalanan dinas..."
                  required
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kota Asal</label>
                  <input
                    type="text"
                    value={kotaAsal}
                    onChange={(e) => setKotaAsal(e.target.value)}
                    placeholder="Kota asal..."
                    required
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kota Tujuan</label>
                  <input
                    type="text"
                    value={kotaTujuan}
                    onChange={(e) => setKotaTujuan(e.target.value)}
                    placeholder="Kota tujuan..."
                    required
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Tanggal Berangkat</label>
                  <input
    type="date"
    value={tanggalBerangkat}
    onChange={(e) => setTanggalBerangkat(e.target.value)}
    required
    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Tanggal Kembali</label>
                  <input
    type="date"
    value={tanggalKembali}
    onChange={(e) => setTanggalKembali(e.target.value)}
    required
    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
  />
                </div>
              </div>

              {/* Info Note: Expense items are managed by Checker & Approved 2 */}
              <div className="p-3.5 bg-sky-50/80 border border-sky-200/80 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-sky-900 flex items-center gap-1.5 text-xs">
                  <Briefcase className="w-4 h-4 text-sky-600 shrink-0" />
                  Rincian Komponen Biaya SPPD
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
                  Rincian komponen biaya SPPD akan ditentukan oleh <strong>TL PLN (Checker)</strong> saat review, dan nominal biaya rupiah akan diisi oleh <strong>TL ES (Approved 2)</strong>.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Tandatangan Canvas Digital Pemohon</label>
                {makerSignatureUrl ? <div className="p-3 border border-emerald-300 rounded-xl flex items-center justify-between bg-emerald-50">
                    <span className="text-emerald-800 font-bold">✓ TTD Terbubuh</span>
                    <button type="button" onClick={() => setIsSignModalOpen(true)} className="text-sky-700 font-bold underline cursor-pointer">Ubah</button>
                  </div> : <button
    type="button"
    onClick={() => setIsSignModalOpen(true)}
    className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold transition cursor-pointer flex items-center justify-center"
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
                  onClick={(e) => handleSaveDraftSppd(e)}
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

      {/* Task 5: Checker SPPD Expenses Modal */}
      {isCheckerSppdModalOpen && approveSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sky-600" />
                Penentuan Rincian Komponen Biaya SPPD (Checker)
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 space-y-1">
                <p className="font-bold text-slate-900">{approveSub.employeeName} ({approveSub.employeeNip})</p>
                <p className="text-slate-700 font-semibold">{approveSub.maksudPerjalanan}</p>
                <p className="text-slate-600">Rute: {approveSub.kotaAsal} &rarr; {approveSub.kotaTujuan} ({approveSub.durasiHari} Hari)</p>
                <p className="text-sky-800 text-[11px] font-semibold pt-1 border-t border-sky-200/60 mt-1">
                  * Pilih kategori komponen biaya (Transportasi, Akomodasi, Lain-lain). Nominal bersifat Readonly (Rp 0) &amp; akan diisi oleh Approved 2.
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
                    className="px-3 py-1.5 text-[11px] font-extrabold bg-sky-100 text-sky-800 hover:bg-sky-200 active:bg-sky-300 rounded-xl transition cursor-pointer"
                  >
                    + Tambah Biaya
                  </button>
                </div>

                {checkerExpenses.map((exp, idx) => (
                  <div key={exp.id} className="grid grid-cols-12 gap-1.5 items-center">
                    <input
                      type="text"
                      value={exp.deskripsi}
                      onChange={(e) => {
                        const newExp = [...checkerExpenses];
                        newExp[idx].deskripsi = e.target.value;
                        setCheckerExpenses(newExp);
                      }}
                      placeholder="Deskripsi..."
                      className="col-span-5 h-10 px-2 border border-slate-300 rounded-xl bg-white text-slate-900 text-[11px] font-medium focus:outline-none"
                    />
                    <select
                      value={exp.kategori}
                      onChange={(e) => {
                        const newExp = [...checkerExpenses];
                        newExp[idx].kategori = e.target.value;
                        setCheckerExpenses(newExp);
                      }}
                      className="col-span-4 h-10 px-2 border border-slate-300 rounded-xl bg-white text-slate-900 text-[10.5px] font-semibold focus:outline-none cursor-pointer"
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
                      className="col-span-2 h-10 px-1 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-mono text-[10px] text-center focus:outline-none"
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

      {/* Task 6: Approver 2 SPPD Expense Nominal Modal */}
      {isApprover2SppdModalOpen && approveSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              Input Nominal Biaya SPPD (Approved 2)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 space-y-1">
                <p className="font-bold text-slate-900">{approveSub.employeeName} ({approveSub.employeeNip})</p>
                <p className="text-slate-700 font-semibold">{approveSub.maksudPerjalanan}</p>
                <p className="text-slate-600">Rute: {approveSub.kotaAsal} &rarr; {approveSub.kotaTujuan} ({approveSub.durasiHari} Hari)</p>
                <p className="text-emerald-800 text-[11px] font-bold pt-1 border-t border-emerald-200/60 mt-1">
                  * Wajib memasukkan nominal rupiah untuk setiap komponen biaya SPPD yang telah ditentukan Checker.
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
                  </div>
                ))}

                <div className="flex justify-between font-bold pt-2 border-t border-slate-200 text-slate-800">
                  <span>Total Anggaran SPPD:</span>
                  <span className="text-emerald-700 font-mono text-sm">
                    {formatRupiah(approver2Expenses.reduce((a, b) => a + (Number(b.nominal) || 0), 0))}
                  </span>
                </div>
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
                  const hasZero = approver2Expenses.some((e) => !e.nominal || Number(e.nominal) <= 0);
                  if (hasZero) {
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
                <Check className="w-4 h-4" /> Simpan Nominal &amp; Lanjut Tandatangan
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
    title="Tandatangan Pemohon SPPD"
  />

      <SignatureModal
    isOpen={isApproveSignOpen}
    onClose={() => setIsApproveSignOpen(false)}
    onSave={handleApproveSignatureSave}
    title={`Persetujuan Digital SPPD (${currentUser.jabatan})`}
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
        title={`Minta Revisi SPPD (${revisionSub?.nomorDokumen || ""})`}
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
    title={`Tolak Pengajuan SPPD (${rejectSub?.nomorDokumen || ""})`}
  />

      <DocumentViewerModal
    isOpen={!!selectedDocSub}
    submission={selectedDocSub}
    onClose={() => setSelectedDocSub(null)}
  />
    </div>;
};
