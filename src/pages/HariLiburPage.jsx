import { useState, useEffect } from "react";
import { MasterDataService } from "../services/masterDataService";
import { formatDateIndonesian } from "../utils/formatters";
import { Calendar, Plus, Search, Edit2, Trash2, AlertCircle, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";
import { SortableTableHeader, sortTableRows, toggleTableSort } from "../components/common/SortableTableHeader";

export const HariLiburPage = ({ currentUser, onRefreshData }) => {
  const [holidays, setHolidays] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [sortBy, setSortBy] = useState("tgl_libur"); const [sortOrder, setSortOrder] = useState("desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState("");

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => 2030 - i); // years 2020 to 2030

  const [tglLibur, setTglLibur] = useState(new Date().toISOString().split("T")[0]);
  const [ketLibur, setKetLibur] = useState("");
  const [tahunLibur, setTahunLibur] = useState(currentYear);
  const [autoIdHpl, setAutoIdHpl] = useState(1);

  const loadData = async () => {
    try {
      const res = await MasterDataService.fetchApiAll("m_hari_libur", { limit: 1000 });
      setHolidays(res.data || []);
    } catch (err) {
      console.error("Gagal memuat Hari Libur:", err);
      const resFallback = MasterDataService.getAll("m_hari_libur", { limit: 1000 });
      setHolidays(resFallback.data || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredHolidays = sortTableRows(holidays.filter((item) => {
    if (selectedYear !== "all" && String(item.tahun_libur) !== String(selectedYear)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.ket_libur?.toLowerCase().includes(q) ||
      item.tgl_libur?.includes(q) ||
      String(item.tahun_libur).includes(q) ||
      String(item.id_hpl).includes(q)
    );
  }), sortBy, sortOrder, { id_hpl: (h) => Number(h.id_hpl), tahun_libur: (h) => Number(h.tahun_libur) });
  const pagination = useDataPagination(filteredHolidays, [searchQuery, selectedYear, sortBy, sortOrder]);
  const handleSort = (field) => toggleTableSort(field, sortBy, sortOrder, setSortBy, setSortOrder);

  const handleOpenAdd = () => {
    setEditingItem(null);
    const maxId = holidays.reduce((max, h) => Math.max(max, Number(h.id_hpl) || 0), 0);
    setAutoIdHpl(maxId + 1);
    setTglLibur(new Date().toISOString().split("T")[0]);
    setKetLibur("");
    setTahunLibur(currentYear);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setAutoIdHpl(item.id_hpl);
    setTglLibur(item.tgl_libur || "");
    setKetLibur(item.ket_libur || "");
    setTahunLibur(item.tahun_libur || currentYear);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleTglLiburChange = (val) => {
    setTglLibur(val);
    if (val) {
      const year = new Date(val).getFullYear();
      if (!isNaN(year)) {
        setTahunLibur(year);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tglLibur) {
      setFormError("Tanggal Libur wajib dipilih.");
      return;
    }
    if (!ketLibur || !ketLibur.trim()) {
      setFormError("Keterangan Hari Libur wajib diisi.");
      return;
    }

    const targetId = editingItem ? editingItem.id_hpl : autoIdHpl;

    const payload = {
      id_hpl: Number(targetId),
      tgl_libur: tglLibur,
      ket_libur: ketLibur.trim(),
      tahun_libur: Number(tahunLibur)
    };

    let result;
    if (editingItem) {
      result = await MasterDataService.updateApiRecord("m_hari_libur", targetId, payload);
    } else {
      result = await MasterDataService.createApiRecord("m_hari_libur", payload);
    }

    if (result.success) {
      setIsModalOpen(false);
      loadData();
      if (onRefreshData) onRefreshData();
    } else {
      setFormError(result.error || "Gagal menyimpan data Hari Libur.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus Hari Libur Nasional ini?")) {
      const res = await MasterDataService.deleteApiRecord("m_hari_libur", id);
      if (res.success) {
        loadData();
        if (onRefreshData) onRefreshData();
      }
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 select-none" id="hari-libur-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" /> Master Hari Libur Nasional (DPL)
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Kelola daftar hari libur nasional untuk validasi pengerjaan lembur kategori Siaga / Libur Nasional
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Hari Libur
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari keterangan, tanggal, atau tahun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">Semua Tahun</option>
              {Array.from(new Set(holidays.map(h => h.tahun_libur).filter(Boolean))).sort((a,b) => b-a).map(yr => (
                <option key={yr} value={yr}>Tahun {yr}</option>
              ))}
              {!holidays.some(h => h.tahun_libur === 2026) && <option value="2026">Tahun 2026</option>}
            </select>
          </div>
        </div>
        <span className="text-xs text-slate-500 font-bold">Total Record: {filteredHolidays.length} Hari Libur</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <SortableTableHeader field="id_hpl" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="p-3.5 pl-5">ID</SortableTableHeader>
                <SortableTableHeader field="tgl_libur" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="p-3.5">Tanggal Libur</SortableTableHeader>
                <SortableTableHeader field="ket_libur" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="p-3.5">Keterangan</SortableTableHeader>
                <SortableTableHeader field="tahun_libur" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="p-3.5">Tahun</SortableTableHeader>
                <th className="p-3.5 pr-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">
                    Tidak ada data hari libur yang ditemukan.
                  </td>
                </tr>
              ) : (
                pagination.paginatedItems.map((item, idx) => (
                  <tr key={item.id_hpl ? `hpl-${item.id_hpl}-${idx}` : `hpl-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-5 font-mono text-slate-500 font-bold">#{item.id_hpl}</td>
                    <td className="p-3.5 font-bold text-slate-900">{formatDateIndonesian(item.tgl_libur)}</td>
                    <td className="p-3.5 text-slate-600 font-semibold">{item.ket_libur}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-800 font-extrabold rounded-lg border border-purple-200 text-[11px]">
                        {item.tahun_libur}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                          title="Edit Hari Libur"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id_hpl)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Hapus Hari Libur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <DataPagination {...pagination} />
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  {editingItem ? "Edit Data Hari Libur" : "Tambah Hari Libur Baru"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold mb-1 text-slate-800">ID Hari Libur (HPL)</label>
                    <input
                      type="number"
                      value={autoIdHpl}
                      onChange={(e) => setAutoIdHpl(Number(e.target.value))}
                      disabled={!!editingItem}
                      required
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Tanggal Hari Libur</label>
                    <input
                      type="date"
                      value={tglLibur}
                      onChange={(e) => handleTglLiburChange(e.target.value)}
                      required
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Keterangan Hari Libur</label>
                    <input
                      type="text"
                      placeholder="Contoh: Hari Raya Idul Fitri 1447 H"
                      value={ketLibur}
                      onChange={(e) => setKetLibur(e.target.value)}
                      required
                      maxLength={100}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-800">Tahun</label>
                    <select
                      value={tahunLibur}
                      onChange={(e) => setTahunLibur(Number(e.target.value))}
                      required
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none font-bold cursor-pointer"
                    >
                      {yearOptions.map((yr) => (
                        <option key={yr} value={yr}>
                          Tahun {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {editingItem ? "Simpan Perubahan" : "Simpan Hari Libur"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple inline XIcon component to avoid extra imports
const XIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
