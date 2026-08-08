import { Activity, Check, Clock, RefreshCw, User, X, XCircle } from "lucide-react";

const ACTION_META = {
  CREATE: { label: "Dibuat", icon: Activity, color: "bg-blue-100 text-blue-700 border-blue-200" },
  UPDATE: { label: "Diperbarui", icon: RefreshCw, color: "bg-slate-100 text-slate-700 border-slate-200" },
  NEXT: { label: "Disetujui / Dilanjutkan", icon: Check, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  REVISION: { label: "Dikembalikan untuk Revisi", icon: RefreshCw, color: "bg-amber-100 text-amber-800 border-amber-200" },
  REJECT: { label: "Ditolak", icon: XCircle, color: "bg-rose-100 text-rose-700 border-rose-200" },
  DELETE: { label: "Dihapus", icon: XCircle, color: "bg-rose-100 text-rose-700 border-rose-200" }
};

const actorName = (log) =>
  log.createdBy?.pegawai?.nama || log.createdBy?.petugas?.nama || log.createdBy?.username || "System";

const actorRole = (log) =>
  log.createdBy?.role?.nama_role || log.createdBy?.role?.kode_role || "System";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

export const WorkflowHistoryModal = ({ submission, isLoading = false, onClose }) => {
  if (!submission) return null;
  const history = [...(submission.workflowHistory || [])].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-black text-slate-900"><Clock className="h-4 w-4 text-indigo-600" /> Audit Trail Transaksi</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{submission.nomorDokumen} • {submission.employeeName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900" aria-label="Tutup riwayat"><X className="h-4 w-4" /></button>
        </div>

        <div className="overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-8 text-xs font-semibold text-slate-600">
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" /> Mengambil history berdasarkan ID transaksi...
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs font-semibold text-slate-500">Belum ada history log untuk transaksi ini.</div>
          ) : (
            <div className="space-y-0">
              {history.map((log, index) => {
                const action = String(log.aksi || "UPDATE").toUpperCase();
                const meta = ACTION_META[action] || ACTION_META.UPDATE;
                const Icon = meta.icon;
                const highlighted = action === "REVISION" || action === "REJECT";
                return (
                  <div key={log.id_log_lembur || log.id_log_cuti || log.id_log_ijin || log.id_log_sakit || log.id_log_sppd || index} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < history.length - 1 && <span className="absolute left-[17px] top-9 h-[calc(100%-24px)] w-px bg-slate-200" />}
                    <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${meta.color}`}><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div><p className="text-xs font-black text-slate-900">{meta.label}</p><p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-slate-500"><User className="h-3 w-3" /> {actorName(log)} • {actorRole(log)}</p></div>
                        <p className="text-[10px] font-semibold text-slate-500">{formatDateTime(log.created_at)}</p>
                      </div>
                      {(log.id_status_sebelum || log.id_status_sesudah) && <p className="mt-2 text-[10px] font-semibold text-slate-500">Status #{log.id_status_sebelum || "-"} → #{log.id_status_sesudah || "-"}</p>}
                      {log.keterangan && (
                        <div className={`mt-2 rounded-lg border px-3 py-2 text-xs leading-relaxed ${highlighted ? action === "REVISION" ? "border-amber-200 bg-amber-50 font-semibold text-amber-900" : "border-rose-200 bg-rose-50 font-semibold text-rose-800" : "border-slate-100 bg-slate-50 text-slate-600"}`}>
                          {highlighted && <p className="mb-1 text-[9px] font-black uppercase tracking-wider">{action === "REVISION" ? "Catatan Revisi" : "Catatan Penolakan"}</p>}
                          {log.keterangan}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
