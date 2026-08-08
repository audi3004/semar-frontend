import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function useDataPagination(items, resetKeys = [], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => setPage(1), [pageSize, ...resetKeys]);
  useEffect(() => setPage((current) => Math.min(current, totalPages)), [totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return { page, setPage, pageSize, setPageSize, totalItems, totalPages, paginatedItems };
}

export function DataPagination({ page, setPage, pageSize, setPageSize, totalItems, totalPages }) {
  if (totalItems === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const candidates = Array.from(new Set([1, page - 1, page, page + 1, totalPages]))
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 border-t-0 rounded-b-2xl text-xs">
      <div className="flex items-center gap-2 text-slate-500 font-semibold">
        <span>Menampilkan <strong className="text-slate-800">{start}–{end}</strong> dari <strong className="text-slate-800">{totalItems}</strong></span>
        <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700">
          {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size} / halaman</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Halaman sebelumnya"><ChevronLeft className="w-4 h-4" /></button>
        {candidates.map((number, index) => (
          <span key={number} className="contents">
            {index > 0 && number - candidates[index - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
            <button type="button" onClick={() => setPage(number)} className={`h-8 min-w-8 px-2 rounded-lg font-black transition ${page === number ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{number}</button>
          </span>
        ))}
        <button type="button" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Halaman berikutnya"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
