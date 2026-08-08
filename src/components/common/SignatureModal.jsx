import { useRef, useState, useEffect } from "react";
import { X, RotateCcw, Check, PenTool, FileCheck } from "lucide-react";
import { motion } from "motion/react";

export const SignatureModal = ({
  isOpen,
  onClose,
  onSave,
  title = "Tandatangan Digital",
  subtitle = "Gunakan layar sentuh (mobile) atau mouse/trackpad (desktop) untuk membubuhkan tandatangan Anda pada area di bawah ini.",
  saveButtonText = "Simpan Draft"
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateResolution = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = "#0F172A";
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    };

    updateResolution();
    setIsEmpty(true);

    const handleTouchStart = (e) => {
      if (e.cancelable) e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (!touch) return;
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      setIsDrawing(true);
      isDrawingRef.current = true;
      setIsEmpty(false);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const handleTouchMove = (e) => {
      if (e.cancelable) e.preventDefault();
      if (!isDrawingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (!touch) return;
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handleTouchEnd = (e) => {
      if (e.cancelable) e.preventDefault();
      setIsDrawing(false);
      isDrawingRef.current = false;
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    window.addEventListener("resize", updateResolution);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", updateResolution);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e) => {
    setIsDrawing(true);
    isDrawingRef.current = true;
    setIsEmpty(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing && !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    isDrawingRef.current = false;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isEmpty) {
      alert("Silakan bubuhkan tandatangan terlebih dahulu pada area kanvas.");
      return;
    }
    try {
      // Scale down canvas for lightweight signature storage (~20-40KB)
      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = 350;
      scaledCanvas.height = 150;
      const ctx = scaledCanvas.getContext("2d");
      if (ctx) {
        // Fill white background to prevent transparency bugs in PDF renderers
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 350, 150);
        ctx.drawImage(canvas, 0, 0, 350, 150);
      }
      const dataUrl = scaledCanvas.toDataURL("image/png");
      onSave(dataUrl);
    } catch {
      try {
        // Fallback: full size canvas with white background
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.fillStyle = "#FFFFFF";
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(canvas, 0, 0);
        }
        const dataUrl = tempCanvas.toDataURL("image/png");
        onSave(dataUrl);
      } catch (err) {
        const dataUrl = canvas.toDataURL("image/png");
        onSave(dataUrl);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-5 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-2xl md:max-w-3xl w-full p-4 sm:p-6 md:p-8 relative max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-sky-100 text-sky-600 rounded-xl shadow-sm">
              <PenTool className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-extrabold text-slate-800">{title}</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer active:scale-95"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Large Sensitive Canvas Box */}
        <div className="my-3 sm:my-5 relative bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden flex-shrink-0 shadow-inner h-56 sm:h-64 md:h-72">
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none cursor-crosshair block"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          {isEmpty && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm italic font-medium px-4 text-center gap-2">
              <PenTool className="w-6 h-6 text-slate-300 animate-pulse" />
              <span>Goreskan tandatangan Anda di sini (Layar sentuh / Mouse)</span>
            </div>
          )}
        </div>

        {/* Action Buttons & Workflow Notice */}
        <div className="flex flex-col gap-3 pt-1 pb-safe border-t border-slate-100">
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <FileCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Tandatangan ini akan disimpan sebagai draft pada dokumen sebelum dikirimkan ke role approval berikutnya.</span>
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 min-h-[42px] text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Bersihkan Kanvas
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 min-h-[42px] text-xs font-semibold text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition cursor-pointer active:scale-95 text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 sm:flex-none px-6 py-2.5 min-h-[42px] text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" /> {saveButtonText}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

