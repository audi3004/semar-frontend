import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CircleDollarSign, Search } from "lucide-react";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const today = () => new Date().toISOString().slice(0, 10);
const percent = (value) => `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 }).format(Number(value || 0) * 100)}%`;

export const UpahPegawaiTab = () => {
  const [records, setRecords] = useState([]);
  const [asOfDate, setAsOfDate] = useState(today);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await api.client.get("/gaji/upah-petugas", {
          params: { as_of_date: asOfDate }
        });
        if (active) setRecords(response.data?.data || []);
      } catch (error) {
        if (active) {
          setRecords([]);
          toast.error(error.response?.data?.message || "Gagal menghitung upah petugas.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadData();
    return () => { active = false; };
  }, [asOfDate]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return records;
    return records.filter((item) => [
      item.nip,
      item.nama,
      item.unit?.nama_unit,
      item.umk?.nama_wilayah,
      item.keterangan_koef_tmk,
      item.status_perhitungan
    ].some((value) => String(value ?? "").toLowerCase().includes(query)));
  }, [records, searchQuery]);

  const pagination = useDataPagination(filteredRecords, [searchQuery, asOfDate]);
  const calculatedCount = records.filter((item) => item.status_perhitungan === "OK").length;

  return <div className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2"><CircleDollarSign className="w-6 h-6 text-emerald-600" /> Upah Pegawai</h1>
        <p className="text-xs text-slate-600 mt-1">Perhitungan dinamis: UMK + (UMK × KOEF) + (Rata-rata Tahunan × TMK).</p>
      </div>
      <div className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2">Terhitung: <span className="text-emerald-700">{calculatedCount}</span> / {records.length} petugas</div>
    </div>

    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1 max-w-lg"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari NIP, nama, unit, atau wilayah UMK..." className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100" /></div>
      <label className="relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} className="h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-bold" title="Tanggal perhitungan" /></label>
    </div>

    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[1250px] text-xs">
        <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider"><tr><th className="px-4 py-3 text-left">Petugas</th><th className="px-4 py-3 text-left">Unit / UMK</th><th className="px-4 py-3 text-center">Masa Kerja</th><th className="px-4 py-3 text-center">Tier Minimum</th><th className="px-4 py-3 text-right">UMK</th><th className="px-4 py-3 text-right">Rata-rata</th><th className="px-4 py-3 text-right">KOEF</th><th className="px-4 py-3 text-right">TMK</th><th className="px-4 py-3 text-right">Total Upah</th><th className="px-4 py-3 text-right">Tarif Lembur</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {pagination.paginatedItems.map((item) => <tr key={item.id_petugas} className="hover:bg-slate-50/80"><td className="px-4 py-3"><div className="font-mono font-black text-indigo-700">{item.nip}</div><div className="font-bold text-slate-900 mt-0.5">{item.nama}</div></td><td className="px-4 py-3"><div className="font-semibold text-slate-800">{item.unit?.nama_unit || "-"}</div><div className="text-[11px] text-slate-500 mt-0.5">{item.umk?.nama_wilayah || "UMK belum ditentukan"}</div></td><td className="px-4 py-3 text-center font-bold">{item.masa_kerja_tahun} tahun</td><td className="px-4 py-3 text-center"><span className="inline-flex px-2 py-1 rounded-full bg-sky-100 text-sky-700 font-black">{item.id_koef_tmk ? `≥ ${item.tier_masa_kerja} tahun` : "-"}</span></td><td className="px-4 py-3 text-right font-bold">{item.umk ? rupiah.format(Number(item.umk.nominal_umk)) : "-"}</td><td className="px-4 py-3 text-right"><div className="font-bold text-amber-700">{item.nilai_rata_rata ? rupiah.format(item.nilai_rata_rata) : "-"}</div><div className="text-[10px] text-slate-400">{item.tahun_parameter_upah || ""}</div></td><td className="px-4 py-3 text-right"><div className="font-bold text-indigo-700">{item.id_koef_tmk ? percent(item.koef) : "-"}</div><div className="text-[10px] text-slate-400">{item.id_koef_tmk ? rupiah.format(item.nilai_koef) : ""}</div></td><td className="px-4 py-3 text-right"><div className="font-bold text-emerald-700">{item.id_koef_tmk ? percent(item.tmk) : "-"}</div><div className="text-[10px] text-slate-400">{item.id_koef_tmk ? rupiah.format(item.nilai_tmk) : ""}</div></td><td className="px-4 py-3 text-right font-black text-slate-900">{item.status_perhitungan === "OK" ? rupiah.format(item.total_gaji) : <span className="text-rose-600">{item.status_perhitungan}</span>}</td><td className="px-4 py-3 text-right font-black text-amber-700">{item.status_perhitungan === "OK" ? rupiah.format(item.tarif_lembur ?? item.tarif_lembur_per_jam) : "-"}</td></tr>)}
          {isLoading && <tr><td colSpan="10" className="px-4 py-12 text-center text-slate-500">Menghitung upah petugas...</td></tr>}
          {!isLoading && filteredRecords.length === 0 && <tr><td colSpan="10" className="px-4 py-12 text-center text-slate-500">Data upah petugas tidak ditemukan.</td></tr>}
        </tbody>
      </table>
    </div>
    <DataPagination {...pagination} />
  </div>;
};
