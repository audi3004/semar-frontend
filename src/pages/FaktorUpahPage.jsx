import { useEffect, useMemo, useState } from "react";
import { Calculator, Edit2, Plus, Search, X } from "lucide-react";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";

const emptyForm = { masa_kerja: "", koef: "", tmk: "", keterangan: "", is_active: "Y" };
const percent = (value) => `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 }).format(Number(value || 0) * 100)}%`;

export const FaktorUpahPage = () => {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await api.client.get("/koef-tmk", { params: { limit: 1000 } });
      setRecords(response.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengambil data KOEF dan TMK.");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const allFilteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return records;
    return records.filter((item) => [item.id_koef_tmk, item.masa_kerja, item.koef, item.tmk, item.keterangan]
      .some((value) => String(value ?? "").toLowerCase().includes(query)));
  }, [records, searchQuery]);
  const pagination = useDataPagination(allFilteredRecords, [searchQuery]);
  const filteredRecords = pagination.paginatedItems;

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const openCreateForm = () => { setEditingRecord(null); setForm(emptyForm); setFormError(""); setIsFormOpen(true); };
  const openEditForm = (record) => {
    setEditingRecord(record);
    setForm({ masa_kerja: String(record.masa_kerja ?? ""), koef: String(record.koef ?? ""), tmk: String(record.tmk ?? ""), keterangan: record.keterangan || "", is_active: record.is_active || "Y" });
    setFormError(""); setIsFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const koef = Number(form.koef);
    const tmk = Number(form.tmk);
    if (!form.masa_kerja.trim() || !form.keterangan.trim() || !Number.isFinite(koef) || koef < 0 || !Number.isFinite(tmk) || tmk < 0) {
      setFormError("Masa kerja, keterangan, KOEF, dan TMK yang valid wajib diisi."); return;
    }
    const payload = { masa_kerja: form.masa_kerja.trim(), koef, tmk, keterangan: form.keterangan.trim(), is_active: form.is_active };
    setIsSubmitting(true); setFormError("");
    try {
      if (editingRecord) await api.client.put(`/koef-tmk/${editingRecord.id_koef_tmk}`, payload);
      else await api.client.post("/koef-tmk", payload);
      toast.success(`KOEF & TMK berhasil ${editingRecord ? "diperbarui" : "ditambahkan"}.`);
      setIsFormOpen(false); await loadData();
    } catch (error) {
      const details = error.response?.data?.errors;
      setFormError(error.response?.data?.message || (details ? JSON.stringify(details) : "Gagal menyimpan KOEF & TMK."));
    } finally { setIsSubmitting(false); }
  };

  return <div className="p-3 sm:p-6 space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"><div><h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2"><Calculator className="w-6 h-6 text-indigo-600" /> Faktor Upah — KOEF &amp; TMK</h1><p className="text-xs text-slate-600 mt-1">Master koefisien dan tunjangan masa kerja dari backend.</p></div><button onClick={openCreateForm} className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Tambah KOEF &amp; TMK</button></div>
    <div className="relative max-w-lg"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari masa kerja, keterangan, KOEF, atau TMK..." className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100" /></div>
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[820px] text-xs"><thead className="bg-slate-50 text-slate-600 uppercase tracking-wider"><tr><th className="px-4 py-3 text-left">ID</th><th className="px-4 py-3 text-left">Masa Kerja Mulai</th><th className="px-4 py-3 text-left">Keterangan</th><th className="px-4 py-3 text-right">KOEF</th><th className="px-4 py-3 text-right">TMK</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">
      {filteredRecords.map((item) => <tr key={item.id_koef_tmk} className="hover:bg-slate-50"><td className="px-4 py-3 font-black">#{item.id_koef_tmk}</td><td className="px-4 py-3 font-bold">{item.masa_kerja} tahun</td><td className="px-4 py-3 font-semibold text-slate-800">{item.keterangan}</td><td className="px-4 py-3 text-right"><div className="font-mono font-black text-indigo-700">{item.koef}</div><div className="text-[10px] text-slate-400">{percent(item.koef)}</div></td><td className="px-4 py-3 text-right"><div className="font-mono font-black text-emerald-700">{item.tmk}</div><div className="text-[10px] text-slate-400">{percent(item.tmk)}</div></td><td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full font-bold ${item.is_active === "N" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{item.is_active === "N" ? "Nonaktif" : "Aktif"}</span></td><td className="px-4 py-3 text-center"><button onClick={() => openEditForm(item)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"><Edit2 className="w-4 h-4" /></button></td></tr>)}
      {isLoading && <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">Memuat data...</td></tr>}{!isLoading && filteredRecords.length === 0 && <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">Data KOEF &amp; TMK tidak ditemukan.</td></tr>}
    </tbody></table></div>
    <DataPagination {...pagination} />
    {isFormOpen && <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"><div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl"><div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"><div><h2 className="text-base font-black">{editingRecord ? "Edit" : "Tambah"} KOEF &amp; TMK</h2><p className="text-xs text-slate-500">Form sesuai body API koef-tmk.</p></div><button onClick={() => setIsFormOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button></div><form onSubmit={handleSubmit} className="p-5 space-y-4">
      <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">Masa Kerja *</span><input value={form.masa_kerja} onChange={(e) => updateForm("masa_kerja", e.target.value)} placeholder="Contoh: 3" className="form-input" required /></label>
      <div className="grid grid-cols-2 gap-4"><label className="space-y-1.5"><span className="text-xs font-bold text-slate-700">KOEF *</span><input type="number" min="0" step="any" value={form.koef} onChange={(e) => updateForm("koef", e.target.value)} placeholder="0.1" className="form-input" required /><span className="text-[10px] text-slate-500">Contoh 0.1 = 10%</span></label><label className="space-y-1.5"><span className="text-xs font-bold text-slate-700">TMK *</span><input type="number" min="0" step="any" value={form.tmk} onChange={(e) => updateForm("tmk", e.target.value)} placeholder="0.01" className="form-input" required /><span className="text-[10px] text-slate-500">Contoh 0.01 = 1%</span></label></div>
      <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">Keterangan *</span><input value={form.keterangan} onChange={(e) => updateForm("keterangan", e.target.value)} placeholder="TMK 1 (0-2 Tahun)" className="form-input" required /></label>
      <label className="space-y-1.5 block"><span className="text-xs font-bold text-slate-700">Status *</span><select value={form.is_active} onChange={(e) => updateForm("is_active", e.target.value)} className="form-input"><option value="Y">Aktif</option><option value="N">Nonaktif</option></select></label>
      {formError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 break-words">{formError}</div>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsFormOpen(false)} className="h-10 px-4 rounded-xl bg-slate-100 text-xs font-bold">Batal</button><button type="submit" disabled={isSubmitting} className="h-10 px-5 rounded-xl bg-indigo-600 text-white text-xs font-black disabled:opacity-60">{isSubmitting ? "Menyimpan..." : "Simpan"}</button></div>
    </form></div></div>}
  </div>;
};
