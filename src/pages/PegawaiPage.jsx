import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Edit2, Plus, Search, UserRound, UsersRound, X } from "lucide-react";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";
import { SortableTableHeader, sortTableRows, toggleTableSort } from "../components/common/SortableTableHeader";

const emptyForm = {
  id_unit: "",
  id_jabatan: "",
  id_umk: "",
  nip: "",
  nama: "",
  tgl_masuk: "",
  tgl_lahir: "",
  is_active: "Y"
};

const dateValue = (value) => value ? String(value).slice(0, 10) : "";

export const PegawaiPage = () => {
  const [activeTab, setActiveTab] = useState("pegawai");
  const [pegawai, setPegawai] = useState([]);
  const [petugas, setPetugas] = useState([]);
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);
  const [umkList, setUmkList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState("all"); const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nama"); const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pegawaiRes, petugasRes, jabatanRes, unitRes, umkRes] = await Promise.all([
        api.client.get("/pegawai", { params: { limit: 1000 } }),
        api.client.get("/petugas", { params: { limit: 1000 } }),
        api.client.get("/jabatan", { params: { limit: 1000 } }),
        api.client.get("/unit", { params: { limit: 1000 } }),
        api.client.get("/umk", { params: { limit: 1000 } })
      ]);
      setPegawai(pegawaiRes.data?.data || []);
      setPetugas(petugasRes.data?.data || []);
      setPositions(jabatanRes.data?.data || []);
      setUnits(unitRes.data?.data || []);
      setUmkList(umkRes.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengambil data Pegawai dan Petugas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const records = activeTab === "pegawai" ? pegawai : petugas;
  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = records.filter((item) => (unitFilter === "all" || String(item.id_unit) === unitFilter) && (statusFilter === "all" || (item.is_active || "Y") === statusFilter) && (!query || [
      item.nip,
      item.nama,
      item.jabatan?.nama_jabatan,
      item.jabatan?.project?.nama_project,
      item.unit?.nama_unit,
      item.umk?.nama_umk
    ].some((value) => String(value || "").toLowerCase().includes(query))));
    return sortTableRows(matches, sortBy, sortOrder, { id: (i) => Number(i.id_pegawai || i.id_petugas), jabatan: (i) => i.jabatan?.nama_jabatan || "", project: (i) => i.jabatan?.project?.nama_project || "", unit: (i) => i.unit?.nama_unit || "" });
  }, [records, searchQuery, unitFilter, statusFilter, sortBy, sortOrder]);
  const pagination = useDataPagination(filteredRecords, [searchQuery, activeTab, unitFilter, statusFilter, sortBy, sortOrder]);
  const handleSort = (field) => toggleTableSort(field, sortBy, sortOrder, setSortBy, setSortOrder);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const openCreateForm = () => {
    setEditingRecord(null);
    setForm({
      ...emptyForm,
      id_unit: units[0]?.id_unit ? String(units[0].id_unit) : "",
      id_jabatan: positions[0]?.id_jabatan ? String(positions[0].id_jabatan) : ""
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (record) => {
    setEditingRecord(record);
    setForm({
      id_unit: String(record.id_unit ?? ""),
      id_jabatan: String(record.id_jabatan ?? ""),
      id_umk: record.id_umk == null ? "" : String(record.id_umk),
      nip: record.nip || "",
      nama: record.nama || "",
      tgl_masuk: dateValue(record.tgl_masuk),
      tgl_lahir: dateValue(record.tgl_lahir),
      is_active: record.is_active || "Y"
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.id_unit || !form.id_jabatan || !form.nip.trim() || !form.nama.trim() || !form.tgl_masuk) {
      setFormError("Unit, jabatan, NIP, nama, dan tanggal masuk wajib diisi.");
      return;
    }

    const payload = {
      id_jabatan: Number(form.id_jabatan),
      id_unit: Number(form.id_unit),
      nip: form.nip.trim(),
      nama: form.nama.trim(),
      tgl_masuk: form.tgl_masuk,
      tgl_lahir: form.tgl_lahir || null
    };
    if (activeTab === "petugas") {
      payload.id_umk = form.id_umk === "" ? null : Number(form.id_umk);
      payload.is_active = form.is_active;
    } else if (editingRecord) {
      payload.is_active = form.is_active;
    }

    const endpoint = activeTab === "pegawai" ? "/pegawai" : "/petugas";
    const recordId = activeTab === "pegawai" ? editingRecord?.id_pegawai : editingRecord?.id_petugas;
    setIsSubmitting(true);
    setFormError("");
    try {
      if (editingRecord) await api.client.put(`${endpoint}/${recordId}`, payload);
      else await api.client.post(endpoint, payload);
      toast.success(`${activeTab === "pegawai" ? "Pegawai" : "Petugas"} berhasil ${editingRecord ? "diperbarui" : "ditambahkan"}.`);
      setIsFormOpen(false);
      await loadData();
    } catch (error) {
      const details = error.response?.data?.errors;
      setFormError(error.response?.data?.message || (details ? JSON.stringify(details) : "Gagal menyimpan data."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <UsersRound className="w-6 h-6 text-indigo-600" /> Master Pegawai dan Petugas
          </h1>
          <p className="text-xs text-slate-600 mt-1">Data Pegawai PLN dan Petugas operasional dari dua master berbeda.</p>
        </div>
        <button onClick={openCreateForm} className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Tambah {activeTab === "pegawai" ? "Pegawai" : "Petugas"}
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button onClick={() => { setActiveTab("pegawai"); setSearchQuery(""); }} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${activeTab === "pegawai" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}>
          <UserRound className="w-4 h-4" /> Pegawai ({pegawai.length})
        </button>
        <button onClick={() => { setActiveTab("petugas"); setSearchQuery(""); }} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${activeTab === "petugas" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}>
          <BriefcaseBusiness className="w-4 h-4" /> Petugas ({petugas.length})
        </button>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2"><div className="relative flex-1 min-w-64 max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Cari data ${activeTab}...`} className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100" />
      </div><select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Unit</option>{units.map((unit) => <option key={unit.id_unit} value={unit.id_unit}>{unit.nama_unit}</option>)}</select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Status</option><option value="Y">Aktif</option><option value="N">Nonaktif</option></select></div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
            <tr>
              <SortableTableHeader field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">ID</SortableTableHeader><SortableTableHeader field="nip" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">NIP</SortableTableHeader><SortableTableHeader field="nama" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Nama</SortableTableHeader>
              <SortableTableHeader field="jabatan" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Jabatan</SortableTableHeader><SortableTableHeader field="project" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Project</SortableTableHeader><SortableTableHeader field="unit" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Unit</SortableTableHeader>
              {activeTab === "petugas" && <th className="px-4 py-3 text-left">UMK</th>}
              <th className="px-4 py-3 text-left">Tanggal Masuk</th><th className="px-4 py-3 text-left">Tanggal Lahir</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagination.paginatedItems.map((item) => (
              <tr key={activeTab === "pegawai" ? item.id_pegawai : item.id_petugas} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-black">#{activeTab === "pegawai" ? item.id_pegawai : item.id_petugas}</td>
                <td className="px-4 py-3 font-mono font-bold text-indigo-700">{item.nip || "-"}</td><td className="px-4 py-3 font-bold text-slate-900">{item.nama || "-"}</td>
                <td className="px-4 py-3">{item.jabatan?.nama_jabatan || `#${item.id_jabatan}`}</td><td className="px-4 py-3">{item.jabatan?.project?.nama_project || "-"}</td><td className="px-4 py-3">{item.unit?.nama_unit || `#${item.id_unit}`}</td>
                {activeTab === "petugas" && <td className="px-4 py-3">{item.umk?.nama_umk || item.umk?.kab_kota || (item.id_umk ? `#${item.id_umk}` : "-")}</td>}
                <td className="px-4 py-3">{dateValue(item.tgl_masuk) || "-"}</td><td className="px-4 py-3">{dateValue(item.tgl_lahir) || "-"}</td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full font-bold ${item.is_active === "N" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{item.is_active === "N" ? "Nonaktif" : "Aktif"}</span></td>
                <td className="px-4 py-3 text-center"><button onClick={() => openEditForm(item)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"><Edit2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {!isLoading && filteredRecords.length === 0 && <tr><td colSpan={activeTab === "petugas" ? 11 : 10} className="px-4 py-12 text-center text-slate-500">Data tidak ditemukan.</td></tr>}
            {isLoading && <tr><td colSpan={activeTab === "petugas" ? 11 : 10} className="px-4 py-12 text-center text-slate-500">Memuat data...</td></tr>}
          </tbody>
        </table>
      </div>

      <DataPagination {...pagination} />

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <div><h2 className="text-base font-black">{editingRecord ? "Edit" : "Tambah"} {activeTab === "pegawai" ? "Pegawai" : "Petugas"}</h2><p className="text-xs text-slate-500">Form sesuai body API {activeTab}.</p></div>
              <button onClick={() => setIsFormOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="NIP" required><input value={form.nip} onChange={(e) => updateForm("nip", e.target.value)} className="form-input" required /></Field>
              <Field label="Nama" required><input value={form.nama} onChange={(e) => updateForm("nama", e.target.value)} className="form-input" required /></Field>
              <Field label="Jabatan" required><select value={form.id_jabatan} onChange={(e) => updateForm("id_jabatan", e.target.value)} className="form-input" required><option value="">Pilih jabatan</option>{positions.map((item) => <option key={item.id_jabatan} value={item.id_jabatan}>{item.nama_jabatan}</option>)}</select></Field>
              <Field label="Unit" required><select value={form.id_unit} onChange={(e) => updateForm("id_unit", e.target.value)} className="form-input" required><option value="">Pilih unit</option>{units.map((item) => <option key={item.id_unit} value={item.id_unit}>{item.nama_unit}</option>)}</select></Field>
              {activeTab === "petugas" && <Field label="UMK"><select value={form.id_umk} onChange={(e) => updateForm("id_umk", e.target.value)} className="form-input"><option value="">Tanpa UMK</option>{umkList.map((item) => <option key={item.id_umk} value={item.id_umk}>{item.nama_umk || item.kab_kota || `UMK #${item.id_umk}`}</option>)}</select></Field>}
              <Field label="Tanggal Masuk" required><input type="date" value={form.tgl_masuk} onChange={(e) => updateForm("tgl_masuk", e.target.value)} className="form-input" required /></Field>
              <Field label="Tanggal Lahir"><input type="date" value={form.tgl_lahir} onChange={(e) => updateForm("tgl_lahir", e.target.value)} className="form-input" /></Field>
              {(editingRecord || activeTab === "petugas") && <Field label="Status"><select value={form.is_active} onChange={(e) => updateForm("is_active", e.target.value)} className="form-input"><option value="Y">Aktif</option><option value="N">Nonaktif</option></select></Field>}
              {formError && <div className="sm:col-span-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 break-words">{formError}</div>}
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsFormOpen(false)} className="h-10 px-4 rounded-xl bg-slate-100 text-xs font-bold">Batal</button><button type="submit" disabled={isSubmitting} className="h-10 px-5 rounded-xl bg-indigo-600 text-white text-xs font-black disabled:opacity-60">{isSubmitting ? "Menyimpan..." : "Simpan"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, required = false, children }) => (
  <label className="space-y-1.5"><span className="block text-xs font-bold text-slate-700">{label}{required && <span className="text-rose-600"> *</span>}</span>{children}</label>
);
