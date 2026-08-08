import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // Expose as global helper for simple access outside react components if needed
  useEffect(() => {
    window.showToast = showToast;
    return () => {
      delete window.showToast;
    };
  }, [showToast]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Portal/Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === "success";
            const isError = toast.type === "error" || toast.type === "danger";
            const isWarning = toast.type === "warning";

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border ${
                  isSuccess
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-500/5"
                    : isError
                    ? "bg-rose-50 border-rose-200 text-rose-900 shadow-rose-500/5"
                    : "bg-amber-50 border-amber-200 text-amber-900 shadow-amber-500/5"
                }`}
              >
                {/* Icon */}
                <div className="shrink-0 mt-0.5">
                  {isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className={`w-5 h-5 ${isError ? "text-rose-600" : "text-amber-600"}`} />
                  )}
                </div>

                {/* Message */}
                <div className="flex-1">
                  <p className="text-xs font-bold leading-normal">
                    {toast.message}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className={`shrink-0 p-1 rounded-lg transition-colors ${
                    isSuccess
                      ? "hover:bg-emerald-100/80 text-emerald-600"
                      : isError
                      ? "hover:bg-rose-100/80 text-rose-600"
                      : "hover:bg-amber-100/80 text-amber-600"
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
