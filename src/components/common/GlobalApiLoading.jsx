import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getActiveRequestCount } from "../../services/api";

export const GlobalApiLoading = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const handler = (event) => setCount(Number(event.detail?.count || 0));
    window.addEventListener("api:activity", handler);
    setCount(getActiveRequestCount());
    return () => window.removeEventListener("api:activity", handler);
  }, []);

  if (count < 1) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/25 backdrop-blur-[1px] cursor-wait" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-2xl border border-slate-200 text-slate-800">
        <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
        <span className="text-sm font-bold">Memproses data...</span>
      </div>
    </div>
  );
};
