import React, { useState } from "react";
import { AlertCircle, X, RotateCcw, XCircle, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { getFormattedDocNo } from "../../utils/formatters";

export const RevisionModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Minta Revisi / Perbaikan Dokumen",
  submissionDocNo,
  currentApproverRole = "checker"
}) => {
  const [notes, setNotes] = useState("");
  const [targetRole, setTargetRole] = useState("maker");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  // Normalize role string to handle statuses or uppercase roles
  const normalizeRole = (r) => {
    if (!r) return "checker";
    const lower = String(r).toLowerCase();
    if (lower.includes("checker") || lower === "pending_checker") return "checker";
    if (lower.includes("verification") || lower === "pending_verification") return "verification";
    if (lower.includes("app_1") || lower.includes("approved1") || lower === "pending_app_1") return "approved1";
    if (lower.includes("app_2") || lower.includes("approved2") || lower === "pending_app_2") return "approved2";
    if (lower.includes("app_3") || lower.includes("approved3") || lower === "pending_app_3") return "approved3";
    if (lower.includes("maker") || lower.includes("draft") || lower.includes("revision")) return "maker";
    if (lower === "admin") return "admin";
    return lower;
  };

  const effectiveApproverRole = normalizeRole(currentApproverRole);

  // Determine available previous roles based on currentApproverRole
  const allRoleList = [
    { value: "maker", label: "Maker / Pembuat (Tenaga Kerja)" },
    { value: "checker", label: "TL PLN (Checker)" },
    { value: "verification", label: "AMN PLN (Verifikasi)" },
    { value: "approved1", label: "MAN PLN (Approved 1)" },
    { value: "approved2", label: "TL ES (Approved 2)" },
    { value: "approved3", label: "AMN ES (Approved 3)" }
  ];

  const currentIdx = allRoleList.findIndex((r) => r.value === effectiveApproverRole);
  let availableRoles = [];
  if (effectiveApproverRole === "admin") {
    availableRoles = allRoleList.slice(0, 5);
  } else if (currentIdx > 0) {
    availableRoles = allRoleList.slice(0, currentIdx);
  } else {
    availableRoles = [allRoleList[0]];
  }

  // Ensure selected targetRole is valid
  const effectiveTargetRole = availableRoles.some((r) => r.value === targetRole)
    ? targetRole
    : availableRoles[0]?.value || "maker";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      setErrorMsg("Catatan perbaikan / revisi wajib diisi!");
      return;
    }
    onConfirm(notes.trim(), effectiveTargetRole);
    setNotes("");
    setErrorMsg("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 text-amber-600">
            <div className="p-2 bg-amber-100 rounded-xl">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{title}</h3>
              {submissionDocNo && <p className="text-[11px] text-slate-500 font-mono">No: {getFormattedDocNo(submissionDocNo)}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed space-y-1">
          <p className="font-bold flex items-center gap-1 text-[11px] text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /> Catatan Alur Revisi:
          </p>
          <p className="text-[11px]">
            Pengajuan akan dikembalikan ke tahap/role yang Anda pilih di bawah untuk diperbaiki dan diajukan ulang.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Kembalikan Ke Role / Tahap Sebelumnya <span className="text-amber-600">*</span>
            </label>
            <select
              value={effectiveTargetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 cursor-pointer"
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Catatan / Instruksi Perbaikan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Tuliskan poin perbaikan yang harus dilengkapi atau diperbaiki..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
            {errorMsg && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> {errorMsg}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[38px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 min-h-[38px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-600/30 cursor-pointer transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Kembalikan Untuk Revisi
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
