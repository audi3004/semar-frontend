import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowRightLeft, Building2, Calendar, FileText, History, Plus, Search, UserRound, X } from "lucide-react";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { formatDateIndonesian } from "../utils/formatters";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";
import { SortableTableHeader, sortTableRows, toggleTableSort } from "../components/common/SortableTableHeader";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = { person_type: "pegawai", person_id: "", id_unit_sesudah: "", tanggal_mutasi: today(), keterangan: "" };

export const MutasiPegawaiPage = () => {
  const [mutations, setMutations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [units, setUnits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [personFilter, setPersonFilter] = useState("all");
  const [originUnitFilter, setOriginUnitFilter] = useState("all");
  const [destinationUnitFilter, setDestinationUnitFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("tanggal_mutasi");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mutationRes, employeeRes, officerRes, unitRes] = await Promise.all([
        api.client.get("/mutasi"),
        api.client.get("/pegawai", { params: { limit: 1000 } }),
        api.client.get("/petugas", { params: { limit: 1000 } }),
        api.client.get("/unit", { params: { limit: 1000 } })
      ]);
      setMutations(mutationRes.data?.data || []);
      setEmployees(employeeRes.data?.data || []);
      setOfficers(officerRes.data?.data || []);
      setUnits(unitRes.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengambil data mutasi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const activeUnits = useMemo(
    () => units.filter((unit) => unit.is_active === "Y").sort((a, b) => String(a.nama_unit).localeCompare(String(b.nama_unit), "id")),
    [units]
  );
  const people = form.person_type === "pegawai" ? employees : officers;
  const selectedPerson = people.find((person) => String(person[form.person_type === "pegawai" ? "id_pegawai" : "id_petugas"]) === form.person_id);

  const filteredMutations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const rows = mutations.filter((mutation) => {
      const person = mutation.pegawai || mutation.petugas;
      const type = mutation.id_pegawai ? "pegawai" : "petugas";
      if (personFilter !== "all" && type !== personFilter) return false;
      if (originUnitFilter !== "all" && String(mutation.id_unit_sebelum) !== originUnitFilter) return false;
      if (destinationUnitFilter !== "all" && String(mutation.id_unit_sesudah) !== destinationUnitFilter) return false;
      const mutationDate = String(mutation.tanggal_mutasi || "").slice(0, 10);
      if (startDate && mutationDate < startDate) return false;
      if (endDate && mutationDate > endDate) return false;
      if (!query) return true;
      return [mutation.id_mutasi, person?.nip, person?.nama, person?.jabatan?.nama_jabatan, mutation.unitSebelum?.nama_unit, mutation.unitSesudah?.nama_unit, mutation.keterangan]
        .some((value) => String(value || "").toLowerCase().includes(query));
    });
    return sortTableRows(rows, sortBy, sortOrder, {
      id_mutasi: (item) => Number(item.id_mutasi),
      person: (item) => (item.pegawai || item.petugas)?.nama || "",
      person_type: (item) => item.id_pegawai ? "Pegawai" : "Petugas",
      unit_before: (item) => item.unitSebelum?.nama_unit || "",
      unit_after: (item) => item.unitSesudah?.nama_unit || ""
    });
  }, [mutations, searchQuery, personFilter, originUnitFilter, destinationUnitFilter, startDate, endDate, sortBy, sortOrder]);

  const pagination = useDataPagination(filteredMutations, [searchQuery, personFilter, originUnitFilter, destinationUnitFilter, startDate, endDate, sortBy, sortOrder]);
  const handleSort = (field) => toggleTableSort(field, sortBy, sortOrder, setSortBy, setSortOrder);

  const openForm = () => {
    const initialPerson = employees.find((person) => person.is_active === "Y");
    const destination = activeUnits.find((unit) => Number(unit.id_unit) !== Number(initialPerson?.id_unit));
    setForm({
      ...emptyForm,
      person_id: initialPerson?.id_pegawai ? String(initialPerson.id_pegawai) : "",
      id_unit_sesudah: destination?.id_unit ? String(destination.id_unit) : ""
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const changePersonType = (personType) => {
    const list = personType === "pegawai" ? employees : officers;
    const person = list.find((item) => item.is_active === "Y");
    const idField = personType === "pegawai" ? "id_pegawai" : "id_petugas";
    const destination = activeUnits.find((unit) => Number(unit.id_unit) !== Number(person?.id_unit));
    setForm((current) => ({ ...current, person_type: personType, person_id: person?.[idField] ? String(person[idField]) : "", id_unit_sesudah: destination?.id_unit ? String(destination.id_unit) : "" }));
  };

  const submitMutation = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!selectedPerson) return setFormError("Pegawai atau Petugas wajib dipilih.");
    if (Number(selectedPerson.id_unit) === Number(form.id_unit_sesudah)) return setFormError("Unit tujuan harus berbeda dari unit saat ini.");
    setIsSubmitting(true);
    try {
      const payload = {
        [form.person_type === "pegawai" ? "id_pegawai" : "id_petugas"]: Number(form.person_id),
        id_unit_sesudah: Number(form.id_unit_sesudah),
        tanggal_mutasi: form.tanggal_mutasi,
        keterangan: form.keterangan.trim() || null
      };
      await api.client.post("/mutasi", payload);
      await loadData();
      setIsFormOpen(false);
      toast.success("Mutasi berhasil dicatat dan unit personel telah diperbarui.");
    } catch (error) {
      setFormError(error.response?.data?.message || "Gagal menyimpan mutasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && mutations.length === 0) return <LoadingSkeleton variant="table" />;

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div><h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2"><ArrowRightLeft className="w-6 h-6 text-indigo-600" /> Mutasi Pegawai &amp; Petugas</h1><p className="text-xs text-slate-600 mt-1">Riwayat perpindahan unit personel yang tercatat secara transaksional di backend.</p></div>
        <button type="button" onClick={openForm} className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Tambah Mutasi</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Summary icon={History} label="Total Riwayat" value={mutations.length} color="indigo" />
        <Summary icon={UserRound} label="Mutasi Pegawai" value={mutations.filter((item) => item.id_pegawai).length} color="sky" />
        <Summary icon={Building2} label="Mutasi Petugas" value={mutations.filter((item) => item.id_petugas).length} color="emerald" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1 min-w-64"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari nama, NIP, jabatan, unit, atau keterangan..." className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200" /></div>
          <select value={personFilter} onChange={(event) => setPersonFilter(event.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Personel</option><option value="pegawai">Pegawai</option><option value="petugas">Petugas</option></select>
          <select value={originUnitFilter} onChange={(event) => setOriginUnitFilter(event.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Unit Asal</option>{units.map((unit) => <option key={`from-${unit.id_unit}`} value={unit.id_unit}>{unit.nama_unit}</option>)}</select>
          <select value={destinationUnitFilter} onChange={(event) => setDestinationUnitFilter(event.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Unit Tujuan</option>{units.map((unit) => <option key={`to-${unit.id_unit}`} value={unit.id_unit}>{unit.nama_unit}</option>)}</select>
        </div>
        <div className="flex flex-wrap items-center gap-2"><label className="text-[10px] font-bold text-slate-500">Dari <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="ml-1 h-9 px-2 rounded-lg border border-slate-200 text-xs" /></label><label className="text-[10px] font-bold text-slate-500">Sampai <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="ml-1 h-9 px-2 rounded-lg border border-slate-200 text-xs" /></label>{(searchQuery || personFilter !== "all" || originUnitFilter !== "all" || destinationUnitFilter !== "all" || startDate || endDate) && <button type="button" onClick={() => { setSearchQuery(""); setPersonFilter("all"); setOriginUnitFilter("all"); setDestinationUnitFilter("all"); setStartDate(""); setEndDate(""); }} className="h-9 px-3 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-extrabold">Reset Filter</button>}</div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1050px] text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider"><tr>
            <SortableTableHeader field="id_mutasi" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">ID</SortableTableHeader>
            <SortableTableHeader field="person" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Personel</SortableTableHeader>
            <SortableTableHeader field="person_type" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Jenis</SortableTableHeader>
            <SortableTableHeader field="tanggal_mutasi" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Tanggal Mutasi</SortableTableHeader>
            <SortableTableHeader field="unit_before" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Unit Sebelum</SortableTableHeader>
            <SortableTableHeader field="unit_after" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Unit Sesudah</SortableTableHeader>
            <th className="px-4 py-3 text-left">Keterangan</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">{pagination.paginatedItems.map((mutation) => {
            const person = mutation.pegawai || mutation.petugas;
            const isEmployee = Boolean(mutation.id_pegawai);
            return <tr key={mutation.id_mutasi} className="hover:bg-slate-50/70">
              <td className="px-4 py-3 font-mono font-black text-slate-600">#{mutation.id_mutasi}</td>
              <td className="px-4 py-3"><p className="font-black text-slate-900">{person?.nama || "-"}</p><p className="text-[10px] font-mono text-slate-500 mt-0.5">{person?.nip || "-"} · {person?.jabatan?.nama_jabatan || "Tanpa jabatan"}</p></td>
              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 font-extrabold ${isEmployee ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>{isEmployee ? "Pegawai" : "Petugas"}</span></td>
              <td className="px-4 py-3 font-bold text-slate-700"><span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-500" />{formatDateIndonesian(mutation.tanggal_mutasi)}</span></td>
              <td className="px-4 py-3"><UnitBadge name={mutation.unitSebelum?.nama_unit} tone="amber" /></td>
              <td className="px-4 py-3"><div className="flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5 text-slate-300" /><UnitBadge name={mutation.unitSesudah?.nama_unit} tone="indigo" /></div></td>
              <td className="px-4 py-3 max-w-xs text-slate-600"><span className="inline-flex items-start gap-1.5"><FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />{mutation.keterangan || "-"}</span></td>
            </tr>;
          })}{!isLoading && filteredMutations.length === 0 && <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">Riwayat mutasi tidak ditemukan.</td></tr>}</tbody>
        </table>
      </div>
      <DataPagination {...pagination} />

      {isFormOpen && <div className="fixed inset-0 z-[120] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"><form onSubmit={submitMutation} className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between"><div><h2 className="text-sm font-black text-slate-900">Tambah Mutasi Personel</h2><p className="text-[11px] text-slate-500 mt-0.5">Mutasi akan langsung memperbarui unit personel dan tersimpan sebagai histori.</p></div><button type="button" onClick={() => setIsFormOpen(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
        <div className="p-5 space-y-4">
          {formError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">{formError}</div>}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100"><button type="button" onClick={() => changePersonType("pegawai")} className={`h-9 rounded-lg text-xs font-extrabold ${form.person_type === "pegawai" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>Pegawai</button><button type="button" onClick={() => changePersonType("petugas")} className={`h-9 rounded-lg text-xs font-extrabold ${form.person_type === "petugas" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Petugas</button></div>
          <label className="block"><span className="block text-xs font-bold text-slate-700 mb-1.5">Personel yang dimutasi</span><select required value={form.person_id} onChange={(event) => setForm((current) => ({ ...current, person_id: event.target.value, id_unit_sesudah: activeUnits.find((unit) => Number(unit.id_unit) !== Number(people.find((person) => String(person[form.person_type === "pegawai" ? "id_pegawai" : "id_petugas"]) === event.target.value)?.id_unit))?.id_unit?.toString() || "" }))} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold"><option value="">Pilih personel aktif</option>{people.filter((person) => person.is_active === "Y").map((person) => { const id = person[form.person_type === "pegawai" ? "id_pegawai" : "id_petugas"]; return <option key={id} value={id}>{person.nip} — {person.nama}</option>; })}</select></label>
          {selectedPerson && <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4"><p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700">Posisi Saat Ini — Read Only</p><div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"><p><span className="text-slate-500">Jabatan:</span> <strong>{selectedPerson.jabatan?.nama_jabatan || "-"}</strong></p><p><span className="text-slate-500">Unit asal:</span> <strong>{selectedPerson.unit?.nama_unit || `Unit #${selectedPerson.id_unit}`}</strong></p></div></div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label><span className="block text-xs font-bold text-slate-700 mb-1.5">Unit tujuan</span><select required value={form.id_unit_sesudah} onChange={(event) => setForm((current) => ({ ...current, id_unit_sesudah: event.target.value }))} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold"><option value="">Pilih unit aktif</option>{activeUnits.filter((unit) => Number(unit.id_unit) !== Number(selectedPerson?.id_unit)).map((unit) => <option key={unit.id_unit} value={unit.id_unit}>{unit.nama_unit}</option>)}</select></label><label><span className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal efektif mutasi</span><input required type="date" value={form.tanggal_mutasi} onChange={(event) => setForm((current) => ({ ...current, tanggal_mutasi: event.target.value }))} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-semibold" /></label></div>
          <label className="block"><span className="block text-xs font-bold text-slate-700 mb-1.5">Keterangan <span className="font-normal text-slate-400">(opsional, maksimal 500 karakter)</span></span><textarea maxLength={500} rows={4} value={form.keterangan} onChange={(event) => setForm((current) => ({ ...current, keterangan: event.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold resize-none" placeholder="Tuliskan alasan atau dasar perpindahan unit..." /><p className="text-right text-[10px] text-slate-400 mt-1">{form.keterangan.length}/500</p></label>
        </div>
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2"><button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold">Batal</button><button disabled={isSubmitting} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold disabled:opacity-60">{isSubmitting ? "Memproses..." : "Simpan Mutasi"}</button></div>
      </form></div>}
    </div>
  );
};

const Summary = ({ icon: Icon, label, value, color }) => <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3 shadow-xs"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === "sky" ? "bg-sky-100 text-sky-700" : color === "emerald" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}><Icon className="w-5 h-5" /></div><div><p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">{label}</p><p className="text-lg font-black text-slate-900">{value}</p></div></div>;
const UnitBadge = ({ name, tone }) => <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-bold ${tone === "amber" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-indigo-50 border-indigo-200 text-indigo-700"}`}><Building2 className="w-3.5 h-3.5" />{name || "-"}</span>;
