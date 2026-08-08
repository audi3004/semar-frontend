import { useState, useEffect, useMemo } from "react";
import { MasterDataService } from "../services/masterDataService";
import { AuthService } from "../services/authService";
import {
  ArrowRightLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Calendar,
  History,
  FileText,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2
} from "lucide-react";
import { formatDateIndonesian } from "../utils/formatters";
import { motion, AnimatePresence } from "motion/react";

export const MutasiPegawaiPage = ({ currentUser, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState("sk"); // 'sk' | 'log'
  const [mutasiList, setMutasiList] = useState([]);
  const [logMutasiList, setLogMutasiList] = useState([]);
  const [pegawaiList, setPegawaiList] = useState([]);
  const [units, setUnits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState("");

  const [idPegawai, setIdPegawai] = useState("");
  const [startMutasi, setStartMutasi] = useState(new Date().toISOString().split("T")[0]);
  const [asalPegawai, setAsalPegawai] = useState("TAD"); // 'TAD' | 'NON_TAD'
  const [selectedRole, setSelectedRole] = useState("checker");

  // Origin (Asal)
  const [asalUpt, setAsalUpt] = useState("");
  const [asalUltg, setAsalUltg] = useState("");
  const [asalGi, setAsalGi] = useState("");

  // Destination (Tujuan)
  const [tujuanUpt, setTujuanUpt] = useState("");
  const [tujuanUltg, setTujuanUltg] = useState("");
  const [tujuanGi, setTujuanGi] = useState("");

  const loadData = () => {
    MasterDataService.initLocalStorage();
    const resMutasi = MasterDataService.getAll("t_mutasi", { limit: 1000 });
    const resLogMutasi = MasterDataService.getAll("log_mutasi", { limit: 1000 });
    const resPegawai = MasterDataService.getAll("m_pegawai", { limit: 1000 });
    const resUnit = MasterDataService.getAll("m_unit", { limit: 1000 });

    setMutasiList(resMutasi.data || []);
    setLogMutasiList(resLogMutasi.data || []);
    setPegawaiList(resPegawai.data || []);
    
    const unitData = resUnit.data || [];
    setUnits(unitData);

    // Initial default selected employee
    if (resPegawai.data && resPegawai.data.length > 0 && !idPegawai) {
      setIdPegawai(resPegawai.data[0].id_pegawai);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute master unit options directly from m_unit (UnitKerjaPage)
  const availableUpts = useMemo(() => {
    return Array.from(new Set(units.map((u) => u.upt).filter(Boolean)));
  }, [units]);

  const availableAsalUltgs = useMemo(() => {
    if (!asalUpt) return Array.from(new Set(units.map((u) => u.ultg).filter(Boolean)));
    return Array.from(new Set(units.filter((u) => u.upt === asalUpt).map((u) => u.ultg).filter(Boolean)));
  }, [units, asalUpt]);

  const availableAsalGis = useMemo(() => {
    let filtered = units;
    if (asalUpt) filtered = filtered.filter((u) => u.upt === asalUpt);
    if (asalUltg) filtered = filtered.filter((u) => u.ultg === asalUltg);
    return Array.from(new Set(filtered.map((u) => u.gardu_induk).filter(Boolean)));
  }, [units, asalUpt, asalUltg]);

  const availableTujuanUltgs = useMemo(() => {
    if (!tujuanUpt) return Array.from(new Set(units.map((u) => u.ultg).filter(Boolean)));
    return Array.from(new Set(units.filter((u) => u.upt === tujuanUpt).map((u) => u.ultg).filter(Boolean)));
  }, [units, tujuanUpt]);

  const availableTujuanGis = useMemo(() => {
    let filtered = units;
    if (tujuanUpt) filtered = filtered.filter((u) => u.upt === tujuanUpt);
    if (tujuanUltg) filtered = filtered.filter((u) => u.ultg === tujuanUltg);
    return Array.from(new Set(filtered.map((u) => u.gardu_induk).filter(Boolean)));
  }, [units, tujuanUpt, tujuanUltg]);

  // Reactive update of employee origin unit, status, and role when selected employee changes
  useEffect(() => {
    if (!idPegawai) return;

    const foundPeg = pegawaiList.find((p) => Number(p.id_pegawai) === Number(idPegawai));
    const allUsers = AuthService.getUsers();
    const foundUser = allUsers.find(
      (u) => String(u.id) === String(idPegawai) || String(u.nip) === String(foundPeg?.nip)
    );

    // Populate origin placement from master pegawai / auth user
    const curUpt = foundPeg?.unit_upt || foundPeg?.upt || foundUser?.unitUpt || availableUpts[0] || "UPT Semarang";
    const curUltg = foundPeg?.unit_ultg || foundPeg?.ultg || foundUser?.unitUltg || "ULTG Semarang";
    const curGi = foundPeg?.gardu_induk || foundPeg?.gi || foundUser?.garduInduk || "GI Krapyak";

    setAsalUpt(curUpt);
    setAsalUltg(curUltg);
    setAsalGi(curGi);

    // Populate role & asal_pegawai (TAD / NON_TAD)
    const curRole = foundPeg?.role || foundPeg?.role_sistem || foundUser?.role || "maker";
    const isOrganik =
      curRole !== "maker" ||
      foundPeg?.asal_pegawai === "NON_TAD" ||
      foundUser?.statusPegawai === "ORGANIK";

    setAsalPegawai(isOrganik ? "NON_TAD" : "TAD");
    setSelectedRole(curRole === "maker" ? "checker" : curRole);

    // Default destination unit if empty
    if (!tujuanUpt) {
      const otherUpt = availableUpts.find((u) => u !== curUpt) || availableUpts[0] || "UPT Surakarta";
      setTujuanUpt(otherUpt);
    }
  }, [idPegawai, pegawaiList, availableUpts]);

  // Adjust destination ULTG & GI when destination UPT changes
  useEffect(() => {
    if (availableTujuanUltgs.length > 0 && !availableTujuanUltgs.includes(tujuanUltg)) {
      setTujuanUltg(availableTujuanUltgs[0]);
    }
  }, [tujuanUpt, availableTujuanUltgs]);

  useEffect(() => {
    if (availableTujuanGis.length > 0 && !availableTujuanGis.includes(tujuanGi)) {
      setTujuanGi(availableTujuanGis[0]);
    }
  }, [tujuanUltg, availableTujuanGis]);

  const getPegawaiName = (idPeg) => {
    const found = pegawaiList.find((p) => Number(p.id_pegawai) === Number(idPeg));
    if (found) return `${found.nama} (${found.nip})`;
    const users = AuthService.getUsers();
    const uFound = users.find((u) => String(u.id) === String(idPeg) || String(u.nip) === String(idPeg));
    return uFound ? `${uFound.name} (${uFound.nip})` : `Pegawai #${idPeg}`;
  };

  const filteredMutasi = mutasiList.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const pegName = getPegawaiName(m.id_pegawai).toLowerCase();
    return (
      pegName.includes(q) ||
      String(m.id_mutasi).includes(q) ||
      m.start_mutasi?.includes(q) ||
      m.asal_upt?.toLowerCase().includes(q) ||
      m.tujuan_upt?.toLowerCase().includes(q)
    );
  });

  const filteredLogMutasi = logMutasiList.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.nama?.toLowerCase().includes(q) ||
      l.nip?.toLowerCase().includes(q) ||
      l.old_upt?.toLowerCase().includes(q) ||
      l.new_upt?.toLowerCase().includes(q) ||
      l.tgl_mutasi?.includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    if (pegawaiList.length > 0) {
      setIdPegawai(pegawaiList[0].id_pegawai);
    }
    setStartMutasi(new Date().toISOString().split("T")[0]);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIdPegawai(item.id_pegawai || "");
    setStartMutasi(item.start_mutasi || new Date().toISOString().split("T")[0]);
    setAsalPegawai(item.asal_pegawai || "TAD");
    setSelectedRole(item.role_sistem || "checker");

    setAsalUpt(item.asal_upt || availableUpts[0] || "UPT Semarang");
    setAsalUltg(item.asal_ultg || "ULTG Semarang");
    setAsalGi(item.asal_gi || "GI Krapyak");

    setTujuanUpt(item.tujuan_upt || availableUpts[1] || "UPT Surakarta");
    setTujuanUltg(item.tujuan_ultg || "ULTG Salatiga");
    setTujuanGi(item.tujuan_gi || "GI Ungaran");

    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idPegawai) {
      setFormError("Pegawai wajib dipilih.");
      return;
    }
    if (!tujuanUpt || !tujuanUltg || !tujuanGi) {
      setFormError("Pilihan Unit Penempatan Tujuan wajib lengkap.");
      return;
    }

    const matchedDestUnit = units.find(
      (u) => u.upt === tujuanUpt && u.ultg === tujuanUltg && u.gardu_induk === tujuanGi
    ) || units.find((u) => u.upt === tujuanUpt && u.gardu_induk === tujuanGi) || {};

    const mutasiId = editingItem ? editingItem.id_mutasi : Date.now();
    const finalRole = asalPegawai === "NON_TAD" ? selectedRole : "maker";

    const payload = {
      id_mutasi: mutasiId,
      id_pegawai: Number(idPegawai),
      asal_pegawai: asalPegawai,
      role_sistem: finalRole,
      start_mutasi: startMutasi,
      asal_upt: asalUpt,
      asal_ultg: asalUltg,
      asal_gi: asalGi,
      tujuan_upt: tujuanUpt,
      tujuan_ultg: tujuanUltg,
      tujuan_gi: tujuanGi,
      id_unit_upt: matchedDestUnit.id_unit_upt || 10,
      id_unit_ultg: matchedDestUnit.id_unit_ultg || 100,
      id_unit_gi: matchedDestUnit.id_unit_gi || 1001
    };

    let result;
    if (editingItem) {
      result = MasterDataService.update("t_mutasi", editingItem.id_mutasi, payload);
    } else {
      result = MasterDataService.create("t_mutasi", payload);
    }

    if (!result.success) {
      setFormError(result.error || "Gagal menyimpan transaksi mutasi.");
      return;
    }

    // Task 2: Create history log record into log_mutasi (recorded as status: NON_AKTIF)
    const targetPeg = pegawaiList.find((p) => Number(p.id_pegawai) === Number(idPegawai));
    const allUsers = AuthService.getUsers();
    const targetUser = allUsers.find(
      (u) => String(u.id) === String(idPegawai) || String(u.nip) === String(targetPeg?.nip)
    );

    const logPayload = {
      id_log: Date.now(),
      id_mutasi: mutasiId,
      id_pegawai: Number(idPegawai),
      nip: targetPeg?.nip || targetUser?.nip || "",
      nama: targetPeg?.nama || targetUser?.name || "",
      tgl_mutasi: startMutasi,
      old_upt: asalUpt,
      old_ultg: asalUltg,
      old_gi: asalGi,
      old_role: targetPeg?.role || targetUser?.role || "maker",
      new_upt: tujuanUpt,
      new_ultg: tujuanUltg,
      new_gi: tujuanGi,
      new_role: finalRole,
      status: "NON_AKTIF" // As requested: history logged as NON_AKTIF in log_mutasi
    };
    MasterDataService.create("log_mutasi", logPayload);

    // Task 2: Update active employee in PegawaiPage (m_pegawai) & AuthService
    if (targetPeg) {
      const updatedPeg = {
        ...targetPeg,
        unit_upt: tujuanUpt,
        unit_ultg: tujuanUltg,
        gardu_induk: tujuanGi,
        id_unit_upt: matchedDestUnit.id_unit_upt || targetPeg.id_unit_upt,
        id_unit_ultg: matchedDestUnit.id_unit_ultg || targetPeg.id_unit_ultg,
        id_unit_gi: matchedDestUnit.id_unit_gi || targetPeg.id_unit_gi,
        id_mutasi: mutasiId,
        role: finalRole,
        role_sistem: finalRole,
        asal_pegawai: asalPegawai,
        active: "Y"
      };
      MasterDataService.update("m_pegawai", targetPeg.id_pegawai, updatedPeg);
    }

    if (targetUser) {
      const updatedUser = {
        ...targetUser,
        unitUpt: tujuanUpt,
        unitUltg: tujuanUltg,
        garduInduk: tujuanGi,
        role: finalRole,
        statusPegawai: asalPegawai === "NON_TAD" ? "ORGANIK" : "TAD"
      };
      AuthService.addOrUpdateUser(updatedUser);
    }

    setIsModalOpen(false);
    loadData();
    if (typeof onRefreshData === "function") {
      onRefreshData();
    }
  };

  const handleDelete = (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus data mutasi pegawai ini?")) {
      const res = MasterDataService.delete("t_mutasi", id);
      if (res.success) {
        loadData();
        if (typeof onRefreshData === "function") onRefreshData();
      } else {
        alert(res.error);
      }
    }
  };

  const handleDeleteLog = (idLog) => {
    if (confirm("Apakah Anda yakin ingin menghapus record history log mutasi ini?")) {
      const res = MasterDataService.delete("log_mutasi", idLog);
      if (res.success) {
        loadData();
        if (typeof onRefreshData === "function") onRefreshData();
      } else {
        alert(res.error);
      }
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" /> Transaksi Mutasi &amp; Rotasi Pegawai
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Pencatatan riwayat perpindahan unit kerja pegawai antar UPT, ULTG, dan Gardu Induk terintegrasi
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah SK Mutasi
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("sk")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "sk"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" /> Dokumen SK Mutasi Aktif (t_mutasi)
        </button>
        <button
          onClick={() => setActiveTab("log")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "log"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <History className="w-4 h-4" /> Audit History Log Mutasi (log_mutasi)
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={activeTab === "sk" ? "Cari nama pegawai, NIP, tanggal..." : "Cari di history log mutasi..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span>{activeTab === "sk" ? `Total SK Mutasi: ${filteredMutasi.length}` : `Total Log History: ${filteredLogMutasi.length}`} Dokumen</span>
        </div>
      </div>

      {/* Info Card explaining Task 2 Integration */}
      <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs text-indigo-950 font-medium">
        <UserCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold block text-indigo-900">Integrasi Otomatis Data Mutasi & Master Pegawai:</span>
          <span>
            Setiap penambahan atau pembaruan SK Mutasi akan langsung memperbarui penempatan aktif dan role pada{" "}
            <strong>PegawaiPage.jsx (m_pegawai)</strong>. Riwayat posisi &amp; unit sebelumnya secara otomatis tercatat
            sebagai status <strong>NON-AKTIF</strong> di tabel <strong>log_mutasi</strong>.
          </span>
        </div>
      </div>

      {/* TAB 1: DOKUMEN SK MUTASI (t_mutasi) */}
      {activeTab === "sk" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="p-3.5 pl-5">ID SK</th>
                  <th className="p-3.5">Nama Pegawai / NIP</th>
                  <th className="p-3.5">TMT (Efektif Mutasi)</th>
                  <th className="p-3.5">Unit Penempatan ASAL</th>
                  <th className="p-3.5">Unit Penempatan TUJUAN</th>
                  <th className="p-3.5 pr-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredMutasi.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                      Tidak ada data Mutasi Pegawai yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredMutasi.map((item, idx) => {
                    const unitFound = units.find((u) => u.id_unit_gi === item.id_unit_gi) || {};
                    const asalUptDisp = item.asal_upt || unitFound.upt || "UPT Semarang";
                    const asalUltgDisp = item.asal_ultg || unitFound.ultg || "ULTG Semarang";
                    const asalGiDisp = item.asal_gi || unitFound.gardu_induk || "GI Krapyak";

                    const tujUptDisp = item.tujuan_upt || item.upt || "UPT Surakarta";
                    const tujUltgDisp = item.tujuan_ultg || item.ultg || "ULTG Salatiga";
                    const tujGiDisp = item.tujuan_gi || item.gi || "GI Ungaran";

                    return (
                      <tr key={item.id_mutasi ? `mut-${item.id_mutasi}-${idx}` : `mut-${idx}`} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 pl-5 font-mono text-slate-500 font-bold">#{item.id_mutasi}</td>
                        <td className="p-3.5 font-bold text-slate-900">
                          <div>{getPegawaiName(item.id_pegawai)}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                                item.asal_pegawai === "NON_TAD"
                                  ? "bg-indigo-100 text-indigo-900 border border-indigo-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {item.asal_pegawai === "NON_TAD" ? "NON-TAD (PLN)" : "TAD"}
                            </span>
                            {item.asal_pegawai === "NON_TAD" && item.role_sistem && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200">
                                Role: {item.role_sistem}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="flex items-center gap-1.5 font-extrabold text-indigo-700">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            {formatDateIndonesian(item.start_mutasi)}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-700">
                              {asalUptDisp} - {asalUltgDisp}
                            </p>
                            <p className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                              {asalGiDisp}
                            </p>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <p className="font-bold text-indigo-900">
                              {tujUptDisp} - {tujUltgDisp}
                            </p>
                            <p className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                              {tujGiDisp}
                            </p>
                          </div>
                        </td>
                        <td className="p-3.5 pr-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                              title="Edit Mutasi"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id_mutasi)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                              title="Hapus Mutasi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG HISTORY MUTASI (log_mutasi) */}
      {activeTab === "log" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="p-3.5 pl-5">ID Log</th>
                  <th className="p-3.5">Pegawai (NIP &amp; Nama)</th>
                  <th className="p-3.5">TMT Mutasi</th>
                  <th className="p-3.5">Posisi / Unit ASAL (Lama)</th>
                  <th className="p-3.5">Posisi / Unit TUJUAN (Baru)</th>
                  <th className="p-3.5 text-center">Status Record</th>
                  <th className="p-3.5 pr-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredLogMutasi.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">
                      Belum ada catatan history log mutasi tersimpan.
                    </td>
                  </tr>
                ) : (
                  filteredLogMutasi.map((log, idx) => (
                    <tr key={log.id_log ? `log-${log.id_log}-${idx}` : `log-${idx}`} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 pl-5 font-mono text-slate-500 font-bold">#{log.id_log}</td>
                      <td className="p-3.5 font-bold text-slate-900">
                        <div>{log.nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono">NIP: {log.nip || "-"}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {log.tgl_mutasi ? formatDateIndonesian(log.tgl_mutasi) : "-"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-600">{log.old_upt} - {log.old_ultg}</p>
                          <p className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            {log.old_gi || "-"} {log.old_role ? `(${log.old_role})` : ""}
                          </p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-indigo-900">{log.new_upt} - {log.new_ultg}</p>
                          <p className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                            {log.new_gi || "-"} {log.new_role ? `(${log.new_role})` : ""}
                          </p>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="text-[10px] px-2.5 py-1 rounded-full font-extrabold bg-slate-100 text-slate-600 border border-slate-300 inline-flex items-center gap-1">
                          <History className="w-3 h-3 text-slate-500" /> NON_AKTIF (HISTORY LOG)
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-center">
                        <button
                          onClick={() => handleDeleteLog(log.id_log)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Hapus History Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Mutasi */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                  {editingItem ? "Edit SK Mutasi Pegawai" : "Tambah SK Mutasi Pegawai"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {/* Status / Asal Pegawai & Role Integration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-extrabold mb-1">Status Ketenagakerjaan *</label>
                    <select
                      value={asalPegawai}
                      onChange={(e) => setAsalPegawai(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="TAD">TAD (Tenaga Alih Daya / Vendor / Maker)</option>
                      <option value="NON_TAD">Pegawai Organik PLN / Non-TAD (Struktural)</option>
                    </select>
                  </div>

                  {asalPegawai === "NON_TAD" ? (
                    <div>
                      <label className="block text-indigo-900 font-extrabold mb-1">Role Otoritas Sistem *</label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full px-3 py-2 bg-indigo-50 border border-indigo-300 rounded-xl font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="checker">Checker (Pemeriksa / Pengawas)</option>
                        <option value="verifikasi">Verifikator (Verifikasi Lapangan)</option>
                        <option value="approved1">Approval 1 (Spv / Manager Ultg)</option>
                        <option value="approved2">Approval 2 (Senior Manager Upt)</option>
                        <option value="approved3">Approval 3 (General Manager Uit)</option>
                        <option value="admin">Administrator Sistem</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center text-[11px] font-semibold text-slate-500 italic pt-2">
                      <span>Role otomatis diset sebagai Tenaga Kerja / Maker.</span>
                    </div>
                  )}
                </div>

                {/* Pegawai Dropdown */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Pegawai Yang Dimutasi *</label>
                  <select
                    value={idPegawai}
                    onChange={(e) => setIdPegawai(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {pegawaiList.map((p) => (
                      <option key={p.id_pegawai} value={p.id_pegawai}>
                        {p.nama} ({p.nip}) - [{p.unit_upt || "UPT"}] [{p.role || p.asal_pegawai || "TAD"}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* TMT Mutasi */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Tanggal Efektif Mutasi (TMT) *</label>
                  <input
                    type="date"
                    value={startMutasi}
                    onChange={(e) => setStartMutasi(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Task 1: Unit Penempatan ASAL (Diambil dari Master Unit m_unit) */}
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
                  <span className="block font-black text-amber-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-700" />
                    Unit Penempatan ASAL (Posisi Sekarang)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">UPT Asal *</label>
                      <select
                        value={asalUpt}
                        onChange={(e) => setAsalUpt(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold text-[11px] cursor-pointer"
                      >
                        {availableUpts.map((u) => (
                          <option key={`asal-upt-${u}`} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">ULTG Asal *</label>
                      <select
                        value={asalUltg}
                        onChange={(e) => setAsalUltg(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold text-[11px] cursor-pointer"
                      >
                        {availableAsalUltgs.map((u) => (
                          <option key={`asal-ultg-${u}`} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">GI Asal *</label>
                      <select
                        value={asalGi}
                        onChange={(e) => setAsalGi(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold text-[11px] cursor-pointer"
                      >
                        {availableAsalGis.map((u) => (
                          <option key={`asal-gi-${u}`} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Task 1: Unit Penempatan TUJUAN (Pilihan dari Master Unit m_unit) */}
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-2">
                  <span className="block font-black text-indigo-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                    Unit Penempatan TUJUAN (Lokasi Baru)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">UPT Tujuan *</label>
                      <select
                        value={tujuanUpt}
                        onChange={(e) => setTujuanUpt(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-[11px] cursor-pointer"
                      >
                        {availableUpts.map((u) => (
                          <option key={`tuj-upt-${u}`} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">ULTG Tujuan *</label>
                      <select
                        value={tujuanUltg}
                        onChange={(e) => setTujuanUltg(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-[11px] cursor-pointer"
                      >
                        {availableTujuanUltgs.map((u) => (
                          <option key={`tuj-ultg-${u}`} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">GI Tujuan *</label>
                      <select
                        value={tujuanGi}
                        onChange={(e) => setTujuanGi(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-[11px] cursor-pointer"
                      >
                        {availableTujuanGis.map((u) => (
                          <option key={`tuj-gi-${u}`} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Proyeksi Perpindahan Unit:</span>
                  <span className="text-indigo-700 font-extrabold">{asalGi || "GI Lama"} ➔ {tujuanGi || "GI Baru"}</span>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Simpan SK Mutasi
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
