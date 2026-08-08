import React from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export const AlertNotificationModal = ({
  isOpen,
  onClose,
  type = "info",
  title,
  message
}) => {
  if (!isOpen) return null;

  const isError = type === "error";
  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 transform transition-all scale-100">
        {/* Header */}
        <div
          className={`p-5 flex items-center justify-between border-b ${
            isError
              ? "bg-rose-50 border-rose-100 text-rose-900"
              : isSuccess
              ? "bg-emerald-50 border-emerald-100 text-emerald-900"
              : "bg-sky-50 border-sky-100 text-sky-900"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl ${
                isError
                  ? "bg-rose-100 text-rose-600"
                  : isSuccess
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-sky-100 text-sky-600"
              }`}
            >
              {isError ? (
                <AlertTriangle className="w-6 h-6" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <Info className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-base font-bold">
              {title || (isError ? "Pengajuan Tidak Sesuai Ketentuan" : isSuccess ? "Notifikasi Berhasil" : "Notifikasi")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Action Button */}
        <div className="px-6 pb-6 pt-2 flex justify-end">
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all ${
              isError
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
                : isSuccess
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                : "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200"
            }`}
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
