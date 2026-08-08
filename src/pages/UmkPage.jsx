import { useEffect, useMemo, useState } from "react";
import { Coins, Edit2, Plus, Search, X } from "lucide-react";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";
import { SortableTableHeader, sortTableRows, toggleTableSort } from "../components/common/SortableTableHeader";

const initialForm = {
  jenis_wilayah: "KABUPATEN",
  nama_wilayah: "",
  tahun_umk: String(new Date().getFullYear()),
  nominal_umk: "",
  is_active: "Y"
};

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export const UmkPage = () => {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all"); const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("tahun_umk"); const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await api.client.get("/umk", { params: { limit: 1000 } });
      setRecords(response.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengambil data UMK.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const years = useMemo(
    () => [...new Set(records.map((item) => item.tahun_umk).filter(Boolean))].sort((a, b) => Number(b) - Number(a)),
    [records]
  );

  const allFilteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = records.filter((item) => {
      if (yearFilter !== "all" && String(item.tahun_umk) !== yearFilter) return false;
      if (regionFilter !== "all" && item.jenis_wilayah !== regionFilter) return false;
      if (statusFilter !== "all" && (item.is_active || "Y") !== statusFilter) return false;
      if (!query) return true;
      return [item.id_umk, item.jenis_wilayah, item.nama_wilayah, item.tahun_umk, item.nominal_umk]
        .some((value) => String(value ?? "").toLowerCase().includes(query));
    });
    return sortTableRows(matches, sortBy, sortOrder, { id_umk: (i) => Number(i.id_umk), tahun_umk: (i) => Number(i.tahun_umk), nominal_umk: (i) => Number(i.nominal_umk) });
  }, [records, searchQuery, yearFilter, regionFilter, statusFilter, sortBy, sortOrder]);
  const pagination = useDataPagination(allFilteredRecords, [searchQuery, yearFilter, regionFilter, statusFilter, sortBy, sortOrder]);
  const filteredRecords = pagination.paginatedItems;
  const handleSort = (field) => toggleTableSort(field, sortBy, sortOrder, setSortBy, setSortOrder);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const openCreateForm = () => {
    setEditingRecord(null);
    setForm(initialForm);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (record) => {
    setEditingRecord(record);
    setForm({
      jenis_wilayah: record.jenis_wilayah || "KABUPATEN",
      nama_wilayah: record.nama_wilayah || "",
      tahun_umk: String(record.tahun_umk ?? ""),
      nominal_umk: String(record.nominal_umk ?? ""),
      is_active: record.is_active || "Y"
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const year = Number(form.tahun_umk);
    const nominal = Number(form.nominal_umk);
    if (!form.nama_wilayah.trim() || !Number.isInteger(year) || year < 1900 || !Number.isFinite(nominal) || nominal <= 0) {
      setFormError("Nama wilayah, tahun UMK yang valid, dan nominal lebih dari 0 wajib diisi.");
      return;
    }

    const payload = {
      jenis_wilayah: form.jenis_wilayah,
      nama_wilayah: form.nama_wilayah.trim(),
      tahun_umk: year,
      nominal_umk: nominal,
      is_active: form.is_active
    };

    setIsSubmitting(true);
    setFormError("");
    try {
      if (editingRecord) await api.client.put(`/umk/${editingRecord.id_umk}`, payload);
      else await api.client.post("/umk", payload);
      toast.success(`UMK berhasil ${editingRecord ? "diperbarui" : "ditambahkan"}.`);
      setIsFormOpen(false);
      await loadData();
    } catch (error) {
      const details = error.response?.data?.errors;
      setFormError(error.response?.data?.message || (details ? JSON.stringify(details) : "Gagal menyimpan data UMK."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2"><Coins className="w-6 h-6 text-amber-600" /> Master UMK</h1>
          <p className="text-xs text-slate-600 mt-1">Upah Minimum berdasarkan jenis wilayah dan tahun dari backend.</p>
        </div>
        <button onClick={openCreateForm} className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Tambah UMK</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-lg"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari wilayah, jenis, tahun, atau nominal..." className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100" /></div>
        <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className="h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Tahun</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select><select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Wilayah</option><option value="PROVINSI">Provinsi</option><option value="KOTA">Kota</option><option value="KABUPATEN">Kabupaten</option></select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Status</option><option value="Y">Aktif</option><option value="N">Nonaktif</option></select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[850px] text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider"><tr><SortableTableHeader field="id_umk" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">ID</SortableTableHeader><SortableTableHeader field="jenis_wilayah" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Jenis Wilayah</SortableTableHeader><SortableTableHeader field="nama_wilayah" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Nama Wilayah</SortableTableHeader><SortableTableHeader field="tahun_umk" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" className="px-4 py-3">Tahun</SortableTableHeader><SortableTableHeader field="nominal_umk" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="right" className="px-4 py-3">Nominal UMK</SortableTableHeader><SortableTableHeader field="is_active" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" className="px-4 py-3">Status</SortableTableHeader><th className="px-4 py-3 text-center">Aksi</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((item) => <tr key={item.id_umk} className="hover:bg-slate-50"><td className="px-4 py-3 font-black">#{item.id_umk}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full font-black ${item.jenis_wilayah === "KOTA" ? "bg-sky-100 text-sky-700" : item.jenis_wilayah === "PROVINSI" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-800"}`}>{item.jenis_wilayah}</span></td><td className="px-4 py-3 font-bold text-slate-900">{item.nama_wilayah}</td><td className="px-4 py-3 text-center font-bold">{item.tahun_umk}</td><td className="px-4 py-3 text-right font-black text-emerald-700">{rupiah.format(Number(item.nominal_umk || 0))}</td><td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full font-bold ${item.is_active === "N" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{item.is_active === "N" ? "Nonaktif" : "Aktif"}</span></td><td className="px-4 py-3 text-center"><button onClick={() => openEditForm(item)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"><Edit2 className="w-4 h-4" /></button></td></tr>)}
            {isLoading && <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">Memuat data...</td></tr>}
            {!isLoading && filteredRecords.length === 0 && <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">Data UMK tidak ditemukan.</td></tr>}
          </tbody>
        </table>
      </div>
      <DataPagination {...pagination} />

      {isFormOpen && <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"><div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl"><div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"><div><h2 className="text-base font-black">{editingRecord ? "Edit" : "Tambah"} UMK</h2><p className="text-xs text-slate-500">Form sesuai body API UMK.</p></div><button onClick={() => setIsFormOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">Jenis Wilayah *</span><select value={form.jenis_wilayah} onChange={(e) => updateForm("jenis_wilayah", e.target.value)} className="form-input"><option value="PROVINSI">PROVINSI</option><option value="KABUPATEN">KABUPATEN</option><option value="KOTA">KOTA</option></select></label>
          <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">Nama Wilayah *</span><input value={form.nama_wilayah} onChange={(e) => updateForm("nama_wilayah", e.target.value)} placeholder="Contoh: Kabupaten Banyumas 2026" className="form-input" required /></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="space-y-1.5"><span className="text-xs font-bold text-slate-700">Tahun UMK *</span><input type="number" min="1900" value={form.tahun_umk} onChange={(e) => updateForm("tahun_umk", e.target.value)} className="form-input" required /></label><label className="space-y-1.5"><span className="text-xs font-bold text-slate-700">Nominal UMK *</span><input type="number" min="1" step="1" value={form.nominal_umk} onChange={(e) => updateForm("nominal_umk", e.target.value)} className="form-input" required /></label></div>
          <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">Status *</span><select value={form.is_active} onChange={(e) => updateForm("is_active", e.target.value)} className="form-input"><option value="Y">Aktif</option><option value="N">Nonaktif</option></select></label>
          {formError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 break-words">{formError}</div>}
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsFormOpen(false)} className="h-10 px-4 rounded-xl bg-slate-100 text-xs font-bold">Batal</button><button type="submit" disabled={isSubmitting} className="h-10 px-5 rounded-xl bg-indigo-600 text-white text-xs font-black disabled:opacity-60">{isSubmitting ? "Menyimpan..." : "Simpan"}</button></div>
        </form></div></div>}
    </div>
  );
};
