import { useState } from "react";
import { AlertTriangle, X, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { getFormattedDocNo } from "../../utils/formatters";
export const RejectModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Penolakan Dokumen",
  submissionDocNo
}) => {
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  if (!isOpen) return null;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      setErrorMsg("Alasan / Catatan Penolakan Wajib Diisi!");
      return;
    }
    onConfirm(notes.trim());
    setNotes("");
    setErrorMsg("");
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-xl border border-slate-200/80 max-w-md w-full p-5 space-y-4 overflow-hidden"
      >
        {
    /* Header */
  }
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="p-2 bg-rose-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
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
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed">
          <p className="font-bold flex items-center gap-1 text-[11px] text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> Catatan Alur Penolakan:
          </p>
          <p className="mt-1 text-[11px]">
            Pengajuan yang ditolak akan diubah statusnya menjadi <strong>REJECTED (Ditolak)</strong> dan seluruh proses pengajuan <strong>dibatalkan secara permanen</strong>. Pengajuan ini tidak dapat dilanjutkan kembali.
          </p>
        </div>

        {
    /* Form */
  }
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Alasan / Catatan Penolakan <span className="text-rose-500">*</span>
            </label>
            <textarea
    rows={3}
    value={notes}
    onChange={(e) => {
      setNotes(e.target.value);
      if (errorMsg) setErrorMsg("");
    }}
    placeholder="Tuliskan catatan detail penolakan (misal: dokumen kurang lengkap, jam lembur tidak sesuai, dll)..."
    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
  />
            {errorMsg && <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> {errorMsg}
              </p>}
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
    className="px-4 py-2 min-h-[38px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/30 cursor-pointer transition flex items-center gap-1.5"
  >
              <XCircle className="w-4 h-4" /> Tolak &amp; Kembalikan ke Maker
            </button>
          </div>
        </form>
      </motion.div>
    </div>;
};
