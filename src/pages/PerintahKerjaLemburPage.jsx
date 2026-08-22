import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays, CheckCircle2, ClipboardList, Edit2, Eye, FileText,
  Loader2, MapPin, Plus, Search, Trash2, Users, X
} from "lucide-react";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { formatDateIndonesian } from "../utils/formatters";

const FALLBACK_OVERTIME_MAPPING = {
  "Pekerjaan Tower": ["Perbaikan Anomali Pentanahan", "Assesment Kondisi Tower", "Pengukuran Pentanahan"],
  "Perbantuan Validasi ROW": ["-"],
  "Emergency / Pelacakan Gangguan": ["-"],
  Manuver: ["Manuver Konfigurasi", "Manuver Pemeliharaan", "Manuver Emergency"],
  "Siaga Hari Libur": ["Siaga / Libur Nasional"]
};

const emptyForm = {
  id_unit: "", tgl_lembur: "", kategori_lembur: "", jenis_pekerjaan: "",
  id_kategori_lembur: "", id_jenis_pekerjaan_lembur: null,
  kode_jenis_pekerjaan: "REGULAR", area_group: "", detail_pekerjaan: "",
  status_spkl: "ACTIVE", id_petugas: []
};

const statusStyle = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  COMPLETED: "bg-sky-50 text-sky-700 ring-sky-200",
  DRAFT: "bg-amber-50 text-amber-700 ring-amber-200",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-200"
};

const normalizeAreaGroup = (value = "") => {
  const normalized = String(value).toLowerCase();
  if (normalized.includes("transmisi") || normalized.includes("sutt")) return "Area Transmisi";
  if (normalized.includes("gardu induk") || normalized === "area gi" || normalized.startsWith("gi ")) return "Area GI";
  return "";
};
const displayAreaGroup = (value) => normalizeAreaGroup(value) === "Area Transmisi" ? "Area Transmisi / SUTT" : normalizeAreaGroup(value) === "Area GI" ? "Area Gardu Induk" : value;

const actionButton = "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50";

export const PerintahKerjaLemburPage = ({ currentUser, navbarScope, startDate, endDate }) => {
  const canWrite = ["checker", "admin", "superadmin"].includes(currentUser?.role);
  const [rows, setRows] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [expandedLemburId, setExpandedLemburId] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [officerAvailability, setOfficerAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [masterCategories, setMasterCategories] = useState([]);

  const allowedIds = navbarScope?.activeFilterUnitIds || navbarScope?.allowedUnitIds || [];
  const allowedKey = allowedIds.join(",");
  const units = useMemo(
    () => (navbarScope?.selectableUnits || []).filter((unit) => !allowedIds.length || allowedIds.includes(Number(unit.id_unit))),
    [navbarScope?.selectableUnits, allowedKey]
  );

  const overtimeMapping = useMemo(() => masterCategories.length
    ? Object.fromEntries(masterCategories.map((category) => [category.nama_kategori, (category.jenisPekerjaan || []).map((item) => item.nama_jenis)]))
    : FALLBACK_OVERTIME_MAPPING, [masterCategories]);
  const categoryMaster = masterCategories.find((item) => item.nama_kategori === form.kategori_lembur);

  const categoryOptions = useMemo(() => {
    if (form.kode_jenis_pekerjaan === "SIAGA_HARI_LIBUR") return ["Siaga Hari Libur"];
    return Object.keys(overtimeMapping).filter((category) => !["Piket Tanggal Merah / Cuti Pengganti", "005 - Piket Tanggal Merah / Cuti Pengganti", "Siaga Hari Libur"].includes(category));
  }, [form.kode_jenis_pekerjaan, overtimeMapping]);
  const jobOptions = form.kode_jenis_pekerjaan === "SIAGA_HARI_LIBUR"
    ? ["Siaga / Libur Nasional"]
    : overtimeMapping[form.kategori_lembur] || [];
  const selectedHoliday = useMemo(
    () => holidays.find((item) => item.is_active === "Y" && item.tanggal === form.tgl_lembur),
    [holidays, form.tgl_lembur]
  );
  const holidayDateInvalid = form.kode_jenis_pekerjaan === "SIAGA_HARI_LIBUR" && Boolean(form.tgl_lembur) && !selectedHoliday;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [spkl, petugas, hari, master] = await Promise.all([
        api.getSpkl({ tgl_awal: startDate, tgl_akhir: endDate }),
        api.getPetugas(),
        api.client.get("/hari-libur", { params: { limit: 1000 } }),
        api.client.get("/master-lembur", { params: { is_active: "Y" } })
      ]);
      setRows(spkl.map((row) => ({
        ...row,
        assignments: (row.assignments || []).map((assignment) => ({
          ...assignment,
          lembur: assignment.lembur ? {
            ...assignment.lembur,
            detail_pekerjaan_lembur: !assignment.lembur.detail_pekerjaan_lembur || assignment.lembur.detail_pekerjaan_lembur.trim() === "-"
              ? `Realisasi lembur ${assignment.lembur.jumlah_jam_koreksi ?? assignment.lembur.total_jam ?? 0} jam pada ${formatDateIndonesian(assignment.lembur.tgl_lembur)}.`
              : assignment.lembur.detail_pekerjaan_lembur
          } : null
        }))
      })));
      setOfficers(petugas);
      setHolidays(hari.data?.data || []);
      setMasterCategories(master.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal memuat data SPKL.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      const isAllowed = !allowedIds.length || allowedIds.includes(Number(row.id_unit));
      const searchable = `${row.nomor_dokumen} ${row.unit?.nama_unit} ${row.kategori_lembur} ${row.jenis_pekerjaan}`.toLowerCase();
      return isAllowed && (!keyword || searchable.includes(keyword));
    });
  }, [rows, query, allowedKey]);

  const availableOfficers = useMemo(
    () => officers.filter((item) => String(item.id_unit) === String(form.id_unit) && item.is_active !== "N"),
    [officers, form.id_unit]
  );
  const availabilityByOfficer = useMemo(
    () => new Map(officerAvailability.map((item) => [Number(item.id_petugas), item])),
    [officerAvailability]
  );

  useEffect(() => {
    if (!open || !form.id_unit || !form.tgl_lembur) {
      setOfficerAvailability([]);
      return;
    }
    let active = true;
    setAvailabilityLoading(true);
    api.getSpklOfficerAvailability({
      id_unit: form.id_unit,
      tgl_lembur: form.tgl_lembur,
      exclude_id_spkl: editing?.id_spkl || undefined
    }).then((data) => {
      if (!active) return;
      setOfficerAvailability(data);
      const allowed = new Set(data.filter((item) => item.can_assign).map((item) => Number(item.id_petugas)));
      setForm((current) => ({ ...current, id_petugas: current.id_petugas.filter((id) => allowed.has(Number(id))) }));
    }).catch((error) => {
      if (active) toast.error(error.response?.data?.message || "Gagal memuat beban lembur petugas.");
    }).finally(() => { if (active) setAvailabilityLoading(false); });
    return () => { active = false; };
  }, [open, form.id_unit, form.tgl_lembur, editing?.id_spkl]);
  const completedCount = visible.filter((row) => row.status_spkl === "COMPLETED").length;
  const assignmentCount = visible.reduce((total, row) => total + (row.assignments?.length || 0), 0);

  const closeModal = () => { setOpen(false); setViewing(null); setExpandedLemburId(null); setEditing(null); };
  const startAdd = () => {
    setEditing(null);
    setViewing(null);
    setForm({ ...emptyForm, id_unit: units.length === 1 ? String(units[0].id_unit) : "" });
    setOpen(true);
  };
  const startEdit = (row) => {
    setEditing(row);
    setViewing(null);
    setForm({
      id_unit: String(row.id_unit), tgl_lembur: row.tgl_lembur,
      id_kategori_lembur: row.id_kategori_lembur || "", id_jenis_pekerjaan_lembur: row.id_jenis_pekerjaan_lembur || null,
      kategori_lembur: row.kode_jenis_pekerjaan === "SIAGA_HARI_LIBUR" ? "Siaga Hari Libur" : row.kategori_lembur,
      jenis_pekerjaan: row.kode_jenis_pekerjaan === "SIAGA_HARI_LIBUR" ? "Siaga / Libur Nasional" : row.jenis_pekerjaan,
      kode_jenis_pekerjaan: row.kode_jenis_pekerjaan || "REGULAR",
      area_group: normalizeAreaGroup(row.area_group), detail_pekerjaan: row.detail_pekerjaan || "",
      status_spkl: row.status_spkl, id_petugas: row.assignments?.map((item) => Number(item.id_petugas)) || []
    });
    setOpen(true);
  };
  const changeWorkType = (value) => {
    const isHolidayStandby = value === "SIAGA_HARI_LIBUR";
    setForm((current) => ({
      ...current,
      kode_jenis_pekerjaan: value,
      kategori_lembur: isHolidayStandby ? "Siaga Hari Libur" : "",
      jenis_pekerjaan: isHolidayStandby ? "Siaga / Libur Nasional" : "",
      id_kategori_lembur: isHolidayStandby ? masterCategories.find((item) => item.kode_kategori === "SIAGA_HARI_LIBUR")?.id_kategori_lembur || "" : "",
      id_jenis_pekerjaan_lembur: isHolidayStandby ? masterCategories.find((item) => item.kode_kategori === "SIAGA_HARI_LIBUR")?.jenisPekerjaan?.[0]?.id_jenis_pekerjaan_lembur || null : null
    }));
  };
  const changeCategory = (value) => {
    const options = overtimeMapping[value] || [];
    const category = masterCategories.find((item) => item.nama_kategori === value);
    const selectedType = options.length === 1 ? category?.jenisPekerjaan?.find((item) => item.nama_jenis === options[0]) : null;
    setForm((current) => ({ ...current, kategori_lembur: value, id_kategori_lembur: category?.id_kategori_lembur || "", jenis_pekerjaan: options.length === 1 ? options[0] : "", id_jenis_pekerjaan_lembur: selectedType?.id_jenis_pekerjaan_lembur || null }));
  };
  const toggleOfficer = (id) => {
    const availability = availabilityByOfficer.get(Number(id));
    if (availability && !availability.can_assign) return;
    setForm((current) => ({
      ...current,
      id_petugas: current.id_petugas.includes(id) ? current.id_petugas.filter((value) => value !== id) : [...current.id_petugas, id]
    }));
  };
  const toggleAllOfficers = () => setForm((current) => ({
    ...current,
    id_petugas: current.id_petugas.length === availableOfficers.filter((item) => availabilityByOfficer.get(Number(item.id_petugas))?.can_assign).length
      ? []
      : availableOfficers.filter((item) => availabilityByOfficer.get(Number(item.id_petugas))?.can_assign).map((item) => Number(item.id_petugas))
  }));

  const save = async (event) => {
    event.preventDefault();
    if (!form.id_petugas.length) return toast.error("Pilih minimal satu petugas.");
    if (form.kode_jenis_pekerjaan === "SIAGA_HARI_LIBUR" && !selectedHoliday) {
      return toast.error("Tanggal Siaga tidak terdaftar pada Master Hari Libur aktif.");
    }
    setSaving(true);
    try {
      const payload = { ...form, id_unit: Number(form.id_unit) };
      if (editing) await api.updateSpkl(editing.id_spkl, payload);
      else await api.createSpkl(payload);
      closeModal();
      await load();
      toast.success(`SPKL berhasil ${editing ? "diperbarui" : "dibuat"}.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyimpan SPKL.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!confirm(`Hapus ${row.nomor_dokumen}?`)) return;
    setDeletingId(row.id_spkl);
    try {
      await api.deleteSpkl(row.id_spkl);
      await load();
      toast.success("SPKL berhasil dihapus.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menghapus SPKL.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5 p-3 sm:p-6">
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/60 to-sky-50 shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-200"><ClipboardList className="h-6 w-6" /></div>
            <div><h1 className="text-xl font-black text-slate-900 sm:text-2xl">Surat Perintah Kerja Lembur</h1><p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">Kelola dasar penugasan lembur berdasarkan scope Unit Role dan filter Navbar aktif.</p></div>
          </div>
          {canWrite && <button type="button" onClick={startAdd} className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-black text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-200"><Plus className="h-4 w-4" /> Buat SPKL</button>}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[[FileText, "SPKL pada filter", visible.length, "text-indigo-600 bg-indigo-50"], [Users, "Petugas ditugaskan", assignmentCount, "text-sky-600 bg-sky-50"], [CheckCircle2, "Selesai direalisasi", completedCount, "text-emerald-600 bg-emerald-50"]].map(([Icon, label, value, tone]) => <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div><div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="text-xl font-black text-slate-900">{value}</p></div></div>)}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-black text-slate-900">Daftar SPKL</h2><p className="mt-0.5 text-[11px] text-slate-500">Klik ikon aksi untuk melihat atau mengelola surat perintah.</p></div>
          <div className="relative w-full sm:max-w-md"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nomor, unit, kategori, atau pekerjaan..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-semibold transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs">
            <thead className="bg-slate-50/80 text-left uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Nomor SPKL</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Unit</th><th className="px-4 py-3">Pekerjaan</th><th className="px-4 py-3 text-center">Realisasi</th><th className="px-4 py-3 text-center">Jam / Koreksi</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan="8" className="px-4 py-16 text-center"><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-indigo-600" /><span className="font-semibold text-slate-500">Memuat data SPKL...</span></td></tr> : visible.map((row) => {
                const realized = row.assignments?.filter((item) => item.lembur).length || 0;
                const total = row.assignments?.length || 0;
                const realizedAssignments = row.assignments?.filter((item) => item.lembur) || [];
                const submittedHours = realizedAssignments.reduce((sum, item) => sum + Number(item.lembur.total_jam || 0), 0);
                const correctedHours = realizedAssignments.reduce((sum, item) => sum + Number(item.lembur.jumlah_jam_koreksi ?? item.lembur.total_jam ?? 0), 0);
                return <tr key={row.id_spkl} className="transition-colors hover:bg-indigo-50/30"><td className="px-4 py-3.5"><p className="font-mono font-black text-indigo-700">{row.nomor_dokumen}</p><p className="mt-1 text-[10px] text-slate-400">{row.kode_jenis_pekerjaan === "SIAGA_HARI_LIBUR" ? "Siaga Hari Libur" : "Reguler"}</p></td><td className="px-4 py-3.5 font-semibold text-slate-700"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-slate-400" />{formatDateIndonesian(row.tgl_lembur)}</span></td><td className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 font-semibold text-slate-700"><MapPin className="h-3.5 w-3.5 text-rose-400" />{row.unit?.nama_unit || "-"}</span></td><td className="max-w-xs px-4 py-3.5"><p className="font-bold text-slate-800">{row.kategori_lembur}</p><p className="mt-0.5 truncate text-slate-500">{row.jenis_pekerjaan}</p></td><td className="px-4 py-3.5 text-center"><span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-black text-slate-700">{realized}/{total}</span></td><td className="px-4 py-3.5 text-center"><p className="font-black text-slate-800">{realized ? `${submittedHours} jam` : "-"}</p>{realized > 0 && <p className={`mt-1 text-[10px] font-bold ${correctedHours !== submittedHours ? "text-purple-700" : "text-slate-400"}`}>Koreksi: {correctedHours} jam</p>}</td><td className="px-4 py-3.5 text-center"><span className={`inline-flex rounded-full px-2.5 py-1 font-black ring-1 ${statusStyle[row.status_spkl] || statusStyle.CANCELLED}`}>{row.status_spkl}</span></td><td className="px-4 py-3.5"><div className="flex justify-center gap-1.5"><button type="button" onClick={() => setViewing(row)} title="Lihat detail" className={`${actionButton} bg-slate-100 text-slate-600 hover:bg-slate-200 focus:ring-slate-200`}><Eye className="h-4 w-4" /></button>{canWrite && <><button type="button" onClick={() => startEdit(row)} title="Edit SPKL" className={`${actionButton} bg-indigo-50 text-indigo-600 hover:bg-indigo-100 focus:ring-indigo-100`}><Edit2 className="h-4 w-4" /></button><button type="button" disabled={deletingId === row.id_spkl} onClick={() => remove(row)} title="Hapus SPKL" className={`${actionButton} bg-rose-50 text-rose-600 hover:bg-rose-100 focus:ring-rose-100`}>{deletingId === row.id_spkl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></>}</div></td></tr>;
              })}
              {!loading && !visible.length && <tr><td colSpan="8" className="px-4 py-16 text-center"><ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="font-bold text-slate-600">Belum ada SPKL</p><p className="mt-1 text-[11px] text-slate-400">Tidak ada data pada filter atau pencarian aktif.</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {(open || viewing) && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}><div className="max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"><div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4"><div><h2 className="text-base font-black text-slate-900">{viewing ? "Detail SPKL" : editing ? "Edit SPKL" : "Buat SPKL Baru"}</h2><p className="mt-0.5 text-[11px] text-slate-500">{viewing ? viewing.nomor_dokumen : "Lengkapi penugasan lembur dan petugas pelaksana."}</p></div><button type="button" onClick={closeModal} className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"><X className="h-5 w-5" /></button></div>
        <div className="max-h-[calc(94vh-72px)] overflow-y-auto p-5">
          {viewing ? <div className="space-y-4"><div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">{[["Nomor Dokumen", viewing.nomor_dokumen], ["Tanggal Lembur", formatDateIndonesian(viewing.tgl_lembur)], ["Unit", viewing.unit?.nama_unit], ["Kategori", viewing.kategori_lembur], ["Jenis Pekerjaan", viewing.jenis_pekerjaan], ["Area / Group", displayAreaGroup(viewing.area_group)], ["Tipe", viewing.kode_jenis_pekerjaan === "SIAGA_HARI_LIBUR" ? "Siaga Hari Libur" : "Reguler"], ["Status", viewing.status_spkl], ["Petugas", viewing.assignments?.map((item) => item.petugas?.nama).join(", ")]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span><p className="mt-1.5 font-bold leading-relaxed text-slate-800">{value || "-"}</p></div>)}</div>{viewing.detail_pekerjaan && <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">Detail pekerjaan</p><p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{viewing.detail_pekerjaan}</p></div>}<section className="rounded-2xl border border-emerald-100 p-4"><div className="mb-3"><p className="text-xs font-black text-slate-800">Realisasi Lembur Petugas</p><p className="mt-0.5 text-[10px] text-slate-500">Pantau lembur yang sudah diinisiasi dari SPKL ini.</p></div><div className="space-y-2">{viewing.assignments?.map((assignment) => { const lembur = assignment.lembur; const expanded = lembur && expandedLemburId === lembur.id_lembur; return <div key={assignment.id_spkl_petugas} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-800">{assignment.petugas?.nama || "Petugas"}</p><p className="font-mono text-[10px] text-slate-500">{assignment.petugas?.nip || "-"} · {assignment.status_penugasan}</p></div>{lembur ? <button type="button" onClick={() => setExpandedLemburId(expanded ? null : lembur.id_lembur)} className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[10px] font-black text-white transition hover:bg-emerald-700"><Eye className="h-3.5 w-3.5" />{expanded ? "Tutup" : "Lihat Lembur"}</button> : <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">Belum diinisiasi</span>}</div>{expanded && <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 text-[11px] sm:grid-cols-3"><p><span className="block text-[9px] uppercase text-slate-400">Nomor Lembur</span><b className="font-mono text-indigo-700">{lembur.nomor_dokumen || `Lembur #${lembur.id_lembur}`}</b></p><p><span className="block text-[9px] uppercase text-slate-400">Jam Lembur</span><b>{String(lembur.jam_mulai || "").slice(0, 5)} - {String(lembur.jam_selesai || "").slice(0, 5)} ({lembur.total_jam || 0} jam)</b></p><p><span className="block text-[9px] uppercase text-slate-400">Koreksi Jam</span><b className={Number(lembur.jumlah_jam_koreksi ?? lembur.total_jam ?? 0) !== Number(lembur.total_jam || 0) ? "text-purple-700" : ""}>{lembur.jumlah_jam_koreksi ?? lembur.total_jam ?? 0} jam</b></p><p><span className="block text-[9px] uppercase text-slate-400">Status Workflow</span><b>{lembur.status?.nama_status || `Status #${lembur.id_status}`}</b></p><p className="sm:col-span-3"><span className="block text-[9px] uppercase text-slate-400">Detail</span><b>{lembur.detail_pekerjaan_lembur || "-"}</b></p></div>}</div>; })}</div></section></div> :
          <form onSubmit={save} className="space-y-5 text-xs">
            <section><p className="mb-3 font-black text-slate-800">Informasi Perintah Kerja</p><div className="grid gap-4 sm:grid-cols-2">
              <label className="font-bold text-slate-700">Unit <span className="text-rose-500">*</span><select required value={form.id_unit} onChange={(event) => setForm({ ...form, id_unit: event.target.value, id_petugas: [] })} className="form-input mt-1.5 cursor-pointer"><option value="">Pilih unit</option>{units.map((unit) => <option key={unit.id_unit} value={unit.id_unit}>{unit.nama_unit}</option>)}</select></label>
              <label className="font-bold text-slate-700">Tanggal Lembur <span className="text-rose-500">*</span><input required type="date" value={form.tgl_lembur} onChange={(event) => setForm({ ...form, tgl_lembur: event.target.value })} className={`form-input mt-1.5 cursor-pointer ${holidayDateInvalid ? "border-rose-400 focus:ring-rose-100" : ""}`} />{form.kode_jenis_pekerjaan === "SIAGA_HARI_LIBUR" && form.tgl_lembur && <span className={`mt-1.5 block text-[10px] font-bold ${selectedHoliday ? "text-emerald-600" : "text-rose-600"}`}>{selectedHoliday ? `Hari libur terkonfirmasi: ${selectedHoliday.nama_hari_libur || selectedHoliday.keterangan || formatDateIndonesian(form.tgl_lembur)}` : "Tanggal ini tidak terdaftar pada Master Hari Libur aktif dan tidak dapat dilanjutkan."}</span>}</label>
              <label className="font-bold text-slate-700">Tipe Pekerjaan <span className="text-rose-500">*</span><select value={form.kode_jenis_pekerjaan} onChange={(event) => changeWorkType(event.target.value)} className="form-input mt-1.5 cursor-pointer"><option value="REGULAR">Reguler</option><option value="SIAGA_HARI_LIBUR">Siaga Hari Libur</option></select></label>
              <label className="font-bold text-slate-700">Kategori Lembur <span className="text-rose-500">*</span><select required value={form.kategori_lembur} onChange={(event) => changeCategory(event.target.value)} className="form-input mt-1.5 cursor-pointer"><option value="">Pilih kategori lembur</option>{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <label className="font-bold text-slate-700">Jenis Pekerjaan Lembur {categoryMaster?.jenis_mode === "REQUIRED" && <span className="text-rose-500">*</span>}<select required={categoryMaster?.jenis_mode === "REQUIRED"} value={form.jenis_pekerjaan || ""} onChange={(event) => { const type = categoryMaster?.jenisPekerjaan?.find((item) => item.nama_jenis === event.target.value); setForm({ ...form, jenis_pekerjaan: event.target.value || null, id_jenis_pekerjaan_lembur: type?.id_jenis_pekerjaan_lembur || null }); }} disabled={!form.kategori_lembur || categoryMaster?.jenis_mode === "NONE"} className="form-input mt-1.5 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100"><option value="">{categoryMaster?.jenis_mode === "NONE" ? "Tidak diperlukan" : form.kategori_lembur ? "Pilih jenis pekerjaan" : "Pilih kategori terlebih dahulu"}</option>{jobOptions.map((job) => <option key={job} value={job}>{job}</option>)}</select></label>
              <label className="font-bold text-slate-700">Area / Group <span className="text-rose-500">*</span><select required value={form.area_group} onChange={(event) => setForm({ ...form, area_group: event.target.value })} className="form-input mt-1.5 cursor-pointer"><option value="">Pilih Area / Group</option><option value="Area GI">Area Gardu Induk</option><option value="Area Transmisi">Area Transmisi / SUTT</option></select></label>
            </div></section>
            <label className="block font-bold text-slate-700">Detail Pekerjaan<textarea value={form.detail_pekerjaan} onChange={(event) => setForm({ ...form, detail_pekerjaan: event.target.value })} placeholder="Jelaskan lokasi, objek, dan ruang lingkup pekerjaan..." className="form-input mt-1.5 min-h-24 resize-y" /></label>
            <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="font-black text-slate-800">Petugas Pelaksana <span className="text-rose-500">*</span></p><p className="mt-0.5 text-[10px] text-slate-500">Batas 4 jam/hari dan 18 jam/minggu. Periode Senin–Minggu dipotong saat pergantian bulan.</p></div>{availableOfficers.length > 0 && <button type="button" disabled={availabilityLoading || !form.tgl_lembur} onClick={toggleAllOfficers} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[10px] font-black text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50">Pilih petugas tersedia</button>}</div>
              {!form.id_unit ? <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-400">Pilih unit terlebih dahulu.</div> : !form.tgl_lembur ? <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-8 text-center font-semibold text-indigo-600">Pilih tanggal lembur untuk melihat ketersediaan petugas.</div> : availabilityLoading ? <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-8 font-semibold text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Memeriksa beban lembur...</div> : !availableOfficers.length ? <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-8 text-center font-semibold text-amber-700">Tidak ada Petugas aktif pada unit ini.</div> : <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">{availableOfficers.map((officer) => { const checked = form.id_petugas.includes(Number(officer.id_petugas)); const info = availabilityByOfficer.get(Number(officer.id_petugas)); const unavailable = !info?.can_assign; return <label key={officer.id_petugas} className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${unavailable ? "cursor-not-allowed border-rose-200 bg-rose-50/70 opacity-75" : "cursor-pointer border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm"} ${checked ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200" : ""}`}><input type="checkbox" disabled={unavailable} checked={checked} onChange={() => toggleOfficer(Number(officer.id_petugas))} className="mt-0.5 h-4 w-4 cursor-pointer accent-indigo-600 disabled:cursor-not-allowed" /><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span><b className="block truncate text-slate-800">{officer.nama}</b><span className="font-mono text-[10px] text-slate-500">{officer.nip}</span></span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${info?.assigned_on_date ? "bg-rose-100 text-rose-700" : unavailable ? "bg-amber-100 text-amber-700" : Number(info?.daily_hours || 0) > 0 ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"}`}>{info?.assigned_on_date ? "Sudah ter-assign" : unavailable ? "Batas tercapai" : Number(info?.daily_hours || 0) > 0 ? "Sudah lembur" : "Tersedia"}</span></span><span className="mt-2 grid grid-cols-2 gap-1.5"><span className="rounded-lg bg-white/80 px-2 py-1 text-[9px] font-bold text-slate-600">Hari ini <b className="block text-[11px] text-slate-900">{info?.daily_hours || 0}/4 jam</b></span><span className="rounded-lg bg-white/80 px-2 py-1 text-[9px] font-bold text-slate-600">Minggu ini <b className="block text-[11px] text-slate-900">{info?.weekly_hours || 0}/18 jam</b></span></span></span></label>; })}</div>}
            </section>
            <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-2 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur"><button type="button" onClick={closeModal} className="h-10 cursor-pointer rounded-xl bg-slate-100 px-4 font-bold text-slate-700 transition hover:bg-slate-200">Batal</button><button disabled={saving || holidayDateInvalid} title={holidayDateInvalid ? "Pilih tanggal yang terdaftar pada Master Hari Libur" : undefined} className="inline-flex h-10 min-w-32 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 font-black text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Menyimpan..." : "Simpan SPKL"}</button></div>
          </form>}
        </div>
      </div></div>}
    </div>
  );
};
