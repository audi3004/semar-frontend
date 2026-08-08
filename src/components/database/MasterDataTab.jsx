import { useState, useEffect } from "react";
import { MasterDataService, SCHEMAS } from "../../services/masterDataService";
import { AuthService } from "../../services/authService";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Building,
  Briefcase,
  Layers,
  CircleDollarSign,
  Coins,
  ShieldCheck,
  RefreshCw,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Database,
  CheckCircle,
  XCircle,
  FileCode,
  Check,
  AlertTriangle,
  Info,
  Clock,
  Calendar,
  Calculator,
  Loader2,
  CheckCheck,
  FileText
} from "lucide-react";

const MASTER_TABLES_INFO = [
  { key: "m_role", label: "Master Role", icon: ShieldCheck, color: "text-blue-600 bg-blue-50 border-blue-100", desc: "Master Role & Level Hak Akses System (/api/roles)" },
  { key: "m_user", label: "Master User", icon: ShieldCheck, color: "text-indigo-600 bg-indigo-50 border-indigo-100", desc: "Master User Account & Kredensial Login (/api/users)" },
  { key: "m_pegawai", label: "Tenaga Kerja", icon: Users, color: "text-sky-600 bg-sky-50 border-sky-100", desc: "Master Data Tenaga Kerja PLN UP2 JATENG DIY (/api/pegawai)" },
  { key: "m_petugas", label: "Master Petugas", icon: Users, color: "text-cyan-600 bg-cyan-50 border-cyan-100", desc: "Master Data Petugas Operasional (/api/petugas)" },
  { key: "m_unit_role", label: "Unit Role Otoritas", icon: Building, color: "text-teal-600 bg-teal-50 border-teal-100", desc: "Pemetaan Otoritas Unit & Role User (/api/unit-role)" },
  { key: "m_module", label: "Master Module", icon: Layers, color: "text-purple-600 bg-purple-50 border-purple-100", desc: "Master Fitur & Modul Aplikasi (/api/modules)" },
  { key: "m_access_module", label: "Hak Akses Modul", icon: ShieldCheck, color: "text-rose-600 bg-rose-50 border-rose-100", desc: "Matriks Hak Akses per Role (/api/access-modules)" },
  { key: "m_project", label: "Master Project", icon: Layers, color: "text-indigo-600 bg-indigo-50 border-indigo-100", desc: "Master Unit Project / Kontrak Pekerjaan (/api/projects)" },
  { key: "m_jabatan", label: "Master Jabatan", icon: Briefcase, color: "text-amber-600 bg-amber-50 border-amber-100", desc: "Master Jabatan Pegawai (/api/jabatan)" },
  { key: "m_umk", label: "Master UMK", icon: Coins, color: "text-teal-600 bg-teal-50 border-teal-100", desc: "Master Upah Minimum Regional (/api/umk)" },
  { key: "koef_tmk", label: "Koefisien TMK", icon: Calculator, color: "text-emerald-600 bg-emerald-50 border-emerald-100", desc: "Master Koefisien Masa Kerja (/api/koef-tmk)" },
  { key: "m_gaji", label: "Master Gaji", icon: CircleDollarSign, color: "text-rose-600 bg-rose-50 border-rose-100", desc: "Master Penetapan Gaji Pokok (/api/gaji)" },
  { key: "m_unit", label: "Master Unit", icon: Building, color: "text-emerald-600 bg-emerald-50 border-emerald-100", desc: "Master Unit Organisasi (/api/unit)" },
  { key: "m_hari_libur", label: "Master Hari Libur", icon: Calendar, color: "text-purple-600 bg-purple-50 border-purple-100", desc: "Master Tanggal Libur Nasional (/api/master/hari-libur)" },
  { key: "m_upah_dasar", label: "Master Upah Dasar", icon: Coins, color: "text-teal-600 bg-teal-50 border-teal-100", desc: "Master Nilai Nominal UMK & Upah Dasar (/api/master/upah-dasar)" },
  { key: "m_lembur", label: "Master Lembur", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100", desc: "Master Kategori Pekerjaan Lembur (/api/master/lembur)" },
  { key: "m_faktor_upah", label: "Master Faktor Upah", icon: Calculator, color: "text-emerald-600 bg-emerald-50 border-emerald-100", desc: "Master Koefisien & Faktor Pengali Upah (/api/master/faktor-upah)" },
  { key: "m_approver", label: "Approver PLN", icon: ShieldCheck, color: "text-purple-600 bg-purple-50 border-purple-100", desc: "Master Kunci Pihak Berwenang Penandatangan Dokumen (m_approver)" },
  { key: "m_status", label: "Master Workflow Status", icon: CheckCheck, color: "text-blue-600 bg-blue-50 border-blue-100", desc: "Master Status Workflow & Approval Pengajuan (m_status)" },
  { key: "t_lembur", label: "Transaksi Lembur", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100", desc: "Pengajuan & Approval Lembur Tenaga Kerja (t_lembur)" },
  { key: "t_cuti", label: "Transaksi Cuti", icon: Calendar, color: "text-emerald-600 bg-emerald-50 border-emerald-100", desc: "Pengajuan Cuti Tahunan & Alasan Penting (t_cuti)" },
  { key: "t_log_cuti", label: "Log Jatah Cuti", icon: Calendar, color: "text-teal-600 bg-teal-50 border-teal-100", desc: "Rekap & Sisa Jatah Cuti Pegawai (t_log_cuti)" },
  { key: "t_sppd", label: "Transaksi SPPD", icon: FileText, color: "text-indigo-600 bg-indigo-50 border-indigo-100", desc: "Surat Perintah Perjalanan Dinas (t_sppd)" },
  { key: "t_ijin", label: "Transaksi Izin", icon: FileText, color: "text-purple-600 bg-purple-50 border-purple-100", desc: "Permohonan Izin Menit/Jam/Hari (t_ijin)" },
  { key: "t_sakit", label: "Laporan Sakit", icon: FileText, color: "text-rose-600 bg-rose-50 border-rose-100", desc: "Laporan Sakit & Surat Dokter (t_sakit)" },
  { key: "t_mutasi", label: "Mutasi Pegawai", icon: RefreshCw, color: "text-orange-600 bg-orange-50 border-orange-100", desc: "Log Mutasi Wilayah Tugas Tenaga Kerja (t_mutasi)" },
  { key: "log_mutasi", label: "Log History Mutasi", icon: Clock, color: "text-indigo-600 bg-indigo-50 border-indigo-100", desc: "Riwayat Audit Perubahan Jabatan & Placement Pegawai (log_mutasi)" },
  { key: "m_jenis_lembur", label: "Jenis Lembur & Pekerjaan", icon: Clock, color: "text-pink-600 bg-pink-50 border-pink-100", desc: "Master Jenis Lembur, Pekerjaan & Evidence Requirement (m_jenis_lembur)" }
];

export const MasterDataTab = ({ currentUser: propCurrentUser, onRefreshData }) => {
  const currentUser = propCurrentUser || AuthService.getCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const [selectedTable, setSelectedTable] = useState("m_hari_libur");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [gridData, setGridData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedItem, setSelectedItem] = useState(null);
  const [formPayload, setFormPayload] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [fkOptions, setFkOptions] = useState({});
  const [showQueryAudit, setShowQueryAudit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiConnected, setIsApiConnected] = useState(false);
  useEffect(() => {
    MasterDataService.initLocalStorage();
    fetchGridData();
    loadFkOptions();
  }, [selectedTable, searchQuery, activeFilter, currentPage, sortBy, sortOrder]);
  const showFeedback = (type, text) => {
    setGlobalMessage({ type, text });
    setTimeout(() => setGlobalMessage(null), 5e3);
  };
  const fetchGridData = async () => {
    setIsLoading(true);
    try {
      const activeOnly = activeFilter === "Y" ? true : undefined;
      const params = {
        search: searchQuery,
        activeOnly,
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortBy || MasterDataService.getPrimaryKeyName(selectedTable),
        sortOrder
      };
      
      const result = await MasterDataService.fetchApiAll(selectedTable, params);
      if (result && Array.isArray(result.data)) {
        setGridData(result.data);
        setTotalCount(result.total ?? result.data.length);
        setIsApiConnected(Boolean(result.fromApi));
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Gagal memuat data grid: " + (err.message || "Terjadi kesalahan server"));
    } finally {
      setIsLoading(false);
    }
  };
  const loadFkOptions = () => {
    try {
      const jabatans = MasterDataService.getAll("m_jabatan", { limit: 9999 }).data.map((j) => ({
        value: j.id_jabatan,
        label: j.nama_jabatan
      }));
      const projects = MasterDataService.getAll("m_project", { limit: 9999 }).data.map((p) => ({
        value: p.id_project,
        label: p.nama_project
      }));
      const upahList = MasterDataService.getAll("m_upah_dasar", { limit: 9999 }).data;
      const umks = MasterDataService.getAll("m_umk", { limit: 9999 }).data.map((u) => {
        const matchUD = upahList.find((ud) => Number(ud.id_umk) === Number(u.id_umk));
        const kabStr = matchUD?.kab_kota ? ` (${matchUD.kab_kota})` : "";
        return {
          value: u.id_umk,
          label: `UMK ${u.tahun_umk}${kabStr} - Rp ${u.nominal_umk ? Number(u.nominal_umk).toLocaleString("id-ID") : 0}`
        };
      });
      const gajis = MasterDataService.getAll("m_gaji", { limit: 9999 }).data.map((g) => {
        const matchUmk = umks.find((u) => Number(u.value) === Number(g.id_umk));
        return {
          value: g.id_gaji,
          label: `Kelompok Gaji #${g.id_gaji} [${matchUmk ? matchUmk.label : `UMK ID ${g.id_umk}`}]`
        };
      });
      const pegawais = MasterDataService.getAll("m_pegawai", { limit: 9999 }).data.map((p) => ({
        value: p.id_pegawai,
        label: `${p.nama} (${p.nip})`
      }));
      const unitData = MasterDataService.getAll("m_unit", { limit: 9999 }).data;
      const unitGis = unitData.map((u) => ({
        value: u.id_unit_gi,
        label: `${u.gardu_induk} [${u.ultg} - ${u.upt}]`
      }));

      const unitUptsMap = new Map();
      const unitUltgsMap = new Map();
      const unitUitsMap = new Map();

      unitData.forEach((u) => {
        if (u.id_unit_upt && !unitUptsMap.has(String(u.id_unit_upt))) {
          unitUptsMap.set(String(u.id_unit_upt), { value: u.id_unit_upt, label: `${u.upt} (${u.uit})` });
        }
        if (u.id_unit_ultg && !unitUltgsMap.has(String(u.id_unit_ultg))) {
          unitUltgsMap.set(String(u.id_unit_ultg), { value: u.id_unit_ultg, label: `${u.ultg} (${u.upt})` });
        }
        if (u.id_unit_uit && !unitUitsMap.has(String(u.id_unit_uit))) {
          unitUitsMap.set(String(u.id_unit_uit), { value: u.id_unit_uit, label: u.uit });
        }
      });

      const meLemburs = MasterDataService.getAll("m_lembur", { limit: 9999 }).data.map((l) => ({
        value: l.id_lembur,
        label: `[Kat #${l.id_lembur}] ${l.kat_lembur}`
      }));

      const mutasis = MasterDataService.getAll("t_mutasi", { limit: 9999 }).data.map((m) => ({
        value: m.id_mutasi,
        label: `Mutasi #${m.id_mutasi} (Pegawai ID ${m.id_pegawai} - ${m.start_mutasi})`
      }));

      setFkOptions({
        id_jabatan: jabatans,
        id_project: projects,
        id_umk: umks,
        id_gaji: gajis,
        id_pegawai: pegawais,
        id_unit_gi: unitGis,
        id_unit_ultg: Array.from(unitUltgsMap.values()),
        id_unit_upt: Array.from(unitUptsMap.values()),
        id_unit_uit: Array.from(unitUitsMap.values()),
        id_lembur: meLemburs,
        id_mutasi: mutasis
      });
    } catch (err) {
      console.error("Error loading FK dependencies:", err);
    }
  };

  const handleFkSelectChange = (col, selectedVal) => {
    const numVal = isNaN(Number(selectedVal)) || selectedVal === "" ? selectedVal : Number(selectedVal);
    const nextPayload = { ...formPayload, [col]: numVal };

    // Cascading logic for m_gaji: selecting id_umk auto-populates tahun_umk
    if (selectedTable === "m_gaji" && col === "id_umk") {
      const umkList = MasterDataService.getAll("m_umk", { limit: 9999 }).data;
      const foundUmk = umkList.find(u => Number(u.id_umk) === Number(numVal));
      if (foundUmk) {
        nextPayload.tahun_umk = foundUmk.tahun_umk;
      }
    }

    // Cascading logic for m_pegawai / m_approver / t_mutasi: selecting id_unit_gi auto-populates unit hierarchy
    if (col === "id_unit_gi") {
      const unitList = MasterDataService.getAll("m_unit", { limit: 9999 }).data;
      const foundUnit = unitList.find(u => Number(u.id_unit_gi) === Number(numVal));
      if (foundUnit) {
        nextPayload.id_unit_ultg = foundUnit.id_unit_ultg;
        nextPayload.id_unit_upt = foundUnit.id_unit_upt;
        nextPayload.id_unit_uit = foundUnit.id_unit_uit;
      }
    }

    // Cascading logic for m_approver / t_mutasi: selecting id_pegawai auto-populates name/nip/unit
    if (col === "id_pegawai") {
      const pegList = MasterDataService.getAll("m_pegawai", { limit: 9999 }).data;
      const foundPeg = pegList.find(p => Number(p.id_pegawai) === Number(numVal));
      if (foundPeg) {
        if ("nama_peg" in formPayload || selectedTable === "m_approver") {
          nextPayload.nama_peg = foundPeg.nama;
          nextPayload.nip_peg = Number(String(foundPeg.nip).replace(/\D/g, "")) || 89123456;
        }
        if (selectedTable === "t_mutasi") {
          nextPayload.id_unit_upt = foundPeg.id_unit_upt;
          nextPayload.id_unit_ultg = foundPeg.id_unit_ultg;
          nextPayload.id_unit_gi = foundPeg.id_unit_gi;
        }
      }
    }

    setFormPayload(nextPayload);
  };
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };
  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedItem(null);
    setValidationErrors([]);
    const pkName2 = MasterDataService.getPrimaryKeyName(selectedTable);
    const existing = gridData;
    const maxPk = existing.reduce((max, item) => Math.max(max, Number(item[pkName2]) || 0), 0);
    const initialPayload = {
      [pkName2]: maxPk + 1
    };

    if (selectedTable === "m_role") {
      initialPayload.kode_role = "";
      initialPayload.nama_role = "";
      initialPayload.level_role = 50;
      initialPayload.is_super_admin = "N";
      initialPayload.is_active = "Y";
    } else if (selectedTable === "m_petugas") {
      initialPayload.nip = "";
      initialPayload.nama = "";
      initialPayload.id_unit = 1;
      initialPayload.id_jabatan = 1;
      initialPayload.id_gaji = 1;
      initialPayload.tgl_masuk = new Date().toISOString().split("T")[0];
      initialPayload.is_active = "Y";
    } else if (selectedTable === "m_user") {
      initialPayload.username = "";
      initialPayload.email = "";
      initialPayload.id_role = 2;
      initialPayload.id_pegawai = null;
      initialPayload.id_petugas = null;
      initialPayload.is_active = "Y";
    } else if (selectedTable === "m_unit_role") {
      initialPayload.id_user = 1;
      initialPayload.id_unit = 1;
      initialPayload.id_role = 2;
      initialPayload.is_active = "Y";
    } else if (selectedTable === "m_module") {
      initialPayload.kode_module = "";
      initialPayload.nama_module = "";
      initialPayload.deskripsi = "";
      initialPayload.is_active = "Y";
    } else if (selectedTable === "m_access_module") {
      initialPayload.id_role = 1;
      initialPayload.id_module = 1;
      initialPayload.can_create = "N";
      initialPayload.can_read = "Y";
      initialPayload.can_update = "N";
      initialPayload.can_delete = "N";
      initialPayload.can_approve = "N";
    } else if (selectedTable === "koef_tmk") {
      initialPayload.masa_kerja = "";
      initialPayload.koef = 10;
      initialPayload.tmk = 5;
      initialPayload.is_active = "Y";
    } else if (selectedTable === "m_hari_libur") {
      initialPayload.tgl_libur = new Date().toISOString().split("T")[0];
      initialPayload.ket_libur = "";
      initialPayload.tahun_libur = 2026;
    } else if (selectedTable === "m_upah_dasar") {
      initialPayload.nama_umk = "";
      initialPayload.kab_kota = "Kota Semarang";
      initialPayload.tahun_umk = 2026;
      initialPayload.nilai_umk = 3450000;
    } else if (selectedTable === "m_lembur") {
      initialPayload.kat_lembur = "";
    } else if (selectedTable === "m_faktor_upah") {
      initialPayload.koef_tmk = 1;
      initialPayload.koef = 173;
    } else if (selectedTable === "m_pegawai") {
      initialPayload.nip = "";
      initialPayload.nama = "";
      initialPayload.tgl_masuk = new Date().toISOString().split("T")[0];
      initialPayload.id_jabatan = fkOptions.id_jabatan?.[0]?.value || 1;
      initialPayload.id_unit_uit = 1;
      initialPayload.id_unit_upt = 10;
      initialPayload.id_unit_ultg = 100;
      initialPayload.id_unit_gi = 1001;
      initialPayload.active = "Y";
    } else if (selectedTable === "m_unit") {
      initialPayload.id_unit_upt = 10;
      initialPayload.id_unit_ultg = 100;
      initialPayload.id_unit_gi = 1001;
      initialPayload.uit = "UIT JBT";
      initialPayload.upt = "UPT Semarang";
      initialPayload.ultg = "ULTG Semarang";
      initialPayload.gardu_induk = "";
      initialPayload.id_gaji = 1;
    } else if (selectedTable === "m_jabatan") {
      initialPayload.nama_jabatan = "";
      initialPayload.id_project = fkOptions.id_project?.[0]?.value || 1;
    } else if (selectedTable === "m_project") {
      initialPayload.nama_project = "";
    } else if (selectedTable === "m_gaji") {
      initialPayload.id_umk = 101;
      initialPayload.id_koef_tmk = 1;
      initialPayload.gaji_pokok = 3450000;
      initialPayload.tahun_umk = 2026;
      initialPayload.is_active = "Y";
    } else if (selectedTable === "m_umk") {
      initialPayload.jenis_wilayah = "Kota";
      initialPayload.nama_wilayah = "Kota Semarang";
      initialPayload.tahun_umk = 2026;
      initialPayload.nominal_umk = 3450000;
      initialPayload.is_active = "Y";
    } else if (selectedTable === "m_approver") {
      initialPayload.id_unit_uit = 1;
      initialPayload.id_unit_upt = 10;
      initialPayload.id_unit_ultg = 100;
      initialPayload.id_unit_gi = 1001;
      initialPayload.nip_peg = 89001234;
      initialPayload.nama_peg = "";
      initialPayload.start_aktif = new Date().toISOString().split("T")[0];
      initialPayload.end_aktif = "2028-12-31";
    } else if (selectedTable === "t_mutasi") {
      initialPayload.id_pegawai = 1;
      initialPayload.start_mutasi = new Date().toISOString().split("T")[0];
      initialPayload.id_unit_upt = 10;
      initialPayload.id_unit_ultg = 100;
      initialPayload.id_unit_gi = 1001;
    } else if (selectedTable === "m_status") {
      initialPayload.kode_status = "";
      initialPayload.nama_status = "";
      initialPayload.deskripsi = "";
      initialPayload.is_active = "Y";
    } else if (selectedTable === "t_lembur") {
      initialPayload.id_pegawai = 1;
      initialPayload.id_app = 1;
      initialPayload.tgl_lembur = new Date().toISOString().split("T")[0];
      initialPayload.jam_mulai = "17:00";
      initialPayload.jam_selesai = "21:00";
      initialPayload.total_jam = 4;
      initialPayload.nominal_biaya = 250000;
      initialPayload.pekerjaan = "";
      initialPayload.status = "PENDING";
      initialPayload.id_jenis = "JNS-001";
    } else if (selectedTable === "t_cuti") {
      initialPayload.id_pegawai = 1;
      initialPayload.id_app = 1;
      initialPayload.jenis_cuti = "Tahunan";
      initialPayload.tgl_mulai = new Date().toISOString().split("T")[0];
      initialPayload.tgl_selesai = new Date().toISOString().split("T")[0];
      initialPayload.jumlah_hari = 1;
      initialPayload.alamat_cuti = "";
      initialPayload.telepon_darurat = "";
      initialPayload.status = "PENDING";
    } else if (selectedTable === "t_log_cuti") {
      initialPayload.id_pegawai = 1;
      initialPayload.tahun = 2026;
      initialPayload.jatah_cuti = 12;
      initialPayload.terpakai = 0;
      initialPayload.sisa_cuti = 12;
      initialPayload.keterangan = "Hak Cuti Tahunan";
    } else if (selectedTable === "t_sppd") {
      initialPayload.id_pegawai = 1;
      initialPayload.id_app = 1;
      initialPayload.no_sppd = "";
      initialPayload.kota_tujuan = "";
      initialPayload.maksud_dinas = "";
      initialPayload.tgl_berangkat = new Date().toISOString().split("T")[0];
      initialPayload.tgl_kembali = new Date().toISOString().split("T")[0];
      initialPayload.lama_dinas = 1;
      initialPayload.status = "PENDING";
    } else if (selectedTable === "t_ijin") {
      initialPayload.id_pegawai = 1;
      initialPayload.id_app = 1;
      initialPayload.alasan_ijin = "";
      initialPayload.tgl_mulai = new Date().toISOString().split("T")[0];
      initialPayload.tgl_selesai = new Date().toISOString().split("T")[0];
      initialPayload.jumlah_hari = 1;
      initialPayload.keterangan = "";
      initialPayload.status = "PENDING";
    } else if (selectedTable === "t_sakit") {
      initialPayload.id_pegawai = 1;
      initialPayload.id_app = 1;
      initialPayload.diagnosa = "";
      initialPayload.tgl_mulai = new Date().toISOString().split("T")[0];
      initialPayload.tgl_selesai = new Date().toISOString().split("T")[0];
      initialPayload.jumlah_hari = 1;
      initialPayload.file_surat_dokter = "";
      initialPayload.status = "APPROVED";
    }

    setFormPayload(initialPayload);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setModalMode("edit");
    setSelectedItem(item);
    setFormPayload({ ...item });
    setValidationErrors([]);
    setIsModalOpen(true);
  };

  const handleOpenDetailModal = (item) => {
    setModalMode("detail");
    setSelectedItem(item);
    setFormPayload({ ...item });
    setValidationErrors([]);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isAdmin) {
      showFeedback("error", "Akses Ditolak: Hanya Role Administrator yang berwenang memperbarui Data Master.");
      return;
    }
    setValidationErrors([]);
    setIsLoading(true);
    const pkName2 = MasterDataService.getPrimaryKeyName(selectedTable);
    const id = formPayload[pkName2];
    const castedPayload = { ...formPayload };

    Object.keys(castedPayload).forEach((key) => {
      if (
        (key.startsWith("id_") && key !== "id_jenis" && (selectedTable !== "m_jenis_lembur" || key !== "id_lembur")) ||
        key === "tahun_umk" ||
        key === "nominal_umk" ||
        key === "nilai_umk" ||
        key === "tahun_libur" ||
        key === "koef_tmk" ||
        key === "koef" ||
        key === "tmk" ||
        key === "pembagi_jam" ||
        key === "nip_peg"
      ) {
        if (castedPayload[key] !== null && castedPayload[key] !== undefined && castedPayload[key] !== "") {
          castedPayload[key] = Number(castedPayload[key]);
        }
      }
    });

    try {
      if (modalMode === "add") {
        const result = await MasterDataService.createApiRecord(selectedTable, castedPayload);
        if (result.success) {
          showFeedback("success", result.message || `Berhasil menambahkan data ke tabel ${selectedTable}!`);
          setIsModalOpen(false);
          await fetchGridData();
          loadFkOptions();

          // Sync m_pegawai to AuthService users
          if (selectedTable === "m_pegawai") {
            const matchedJabatan = fkOptions.id_jabatan?.find(j => Number(j.value) === Number(castedPayload.id_jabatan))?.label || "Teknisi Transmisi";
            AuthService.addOrUpdateUser({
              nip: String(castedPayload.nip),
              name: castedPayload.nama,
              email: `${String(castedPayload.nip).toLowerCase()}@pln.co.id`,
              role: "maker",
              jabatan: matchedJabatan,
              unitUpt: "UPT Semarang",
              unitUltg: "ULTG Semarang",
              garduInduk: "GI Krapyak",
              active: castedPayload.active || "Y"
            });
          }

          if (onRefreshData) onRefreshData();
        } else {
          setValidationErrors(result.error ? [result.error] : [result.message || "Gagal memvalidasi data"]);
        }
      } else if (modalMode === "edit") {
        const result = await MasterDataService.updateApiRecord(selectedTable, id, castedPayload);
        if (result.success) {
          showFeedback("success", result.message || `Berhasil memperbarui data ID ${id} pada tabel ${selectedTable}!`);
          setIsModalOpen(false);
          await fetchGridData();
          loadFkOptions();

          // Sync m_pegawai to AuthService users
          if (selectedTable === "m_pegawai") {
            const matchedJabatan = fkOptions.id_jabatan?.find(j => Number(j.value) === Number(castedPayload.id_jabatan))?.label || "Teknisi Transmisi";
            AuthService.addOrUpdateUser({
              nip: String(castedPayload.nip),
              name: castedPayload.nama,
              email: `${String(castedPayload.nip).toLowerCase()}@pln.co.id`,
              role: "maker",
              jabatan: matchedJabatan,
              unitUpt: "UPT Semarang",
              unitUltg: "ULTG Semarang",
              garduInduk: "GI Krapyak",
              active: castedPayload.active || "Y"
            });
          }

          if (onRefreshData) onRefreshData();
        } else {
          setValidationErrors(result.error ? [result.error] : [result.message || "Gagal memvalidasi data"]);
        }
      }
    } catch (err) {
      showFeedback("error", "Terjadi kesalahan saat memproses data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!isAdmin) {
      showFeedback("error", "Akses Ditolak: Hanya Role Administrator yang berwenang menghapus Data Master.");
      return;
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus/menonaktifkan data ID ${id} pada tabel ${selectedTable}?`)) {
      setIsLoading(true);
      try {
        const result = await MasterDataService.deleteApiRecord(selectedTable, id);
        if (result.success) {
          showFeedback("success", result.message || "Data berhasil dihapus dari database!");
          await fetchGridData();
          loadFkOptions();
          if (onRefreshData) onRefreshData();
        } else {
          showFeedback("error", result.error || result.message || "Gagal menghapus data.");
        }
      } catch (err) {
        showFeedback("error", "Terjadi kesalahan hapus data: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };
  const getTableColumns = () => {
    if (gridData.length === 0) {
      const schemaDef = SCHEMAS[selectedTable];
      if (schemaDef) {
        return Object.keys(schemaDef.shape);
      }
      return [];
    }
    return Object.keys(gridData[0]);
  };
  const columns = getTableColumns();
  const pkName = MasterDataService.getPrimaryKeyName(selectedTable);
  return <div className="space-y-5 text-xs select-none">
      {
    /* Dynamic Feedback Banner */
  }
      {globalMessage && <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-xs animate-fade-in ${globalMessage.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-rose-50 text-rose-900 border-rose-200"}`}>
          {globalMessage.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span className="font-extrabold">{globalMessage.text}</span>
        </div>}

      {
    /* Grid Subheader Option Panel */
  }
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col xl:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 scrollbar-none">
          {MASTER_TABLES_INFO.map((tbl) => {
    const Icon = tbl.icon;
    const isSelected = selectedTable === tbl.key;
    const isRelevant = currentUser && (
      currentUser.role === "admin" ||
      (currentUser.role === "maker" && tbl.key === "m_pegawai") ||
      (currentUser.role === "checker" && ["m_pegawai", "m_unit", "m_approver"].includes(tbl.key)) ||
      (!["admin", "maker", "checker"].includes(currentUser.role) && ["m_approver", "m_faktor_upah"].includes(tbl.key))
    );

    return <button
      key={tbl.key}
      onClick={() => {
        setSelectedTable(tbl.key);
        setCurrentPage(1);
        setSortBy("");
      }}
      className={`px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer text-[11px] border group relative ${
        isSelected
          ? "bg-emerald-50/70 text-emerald-700 border-emerald-600 shadow-xs shadow-emerald-600/10 font-extrabold"
          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-600"
      }`}
    >
                <Icon className={`w-4 h-4 transition-colors duration-200 ${
                  isSelected ? "text-emerald-600" : "text-slate-500 group-hover:text-amber-500"
                }`} />
                <span>{tbl.label}</span>
                {isRelevant && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? "bg-emerald-500 animate-pulse" : "bg-sky-400"
                  }`} title="Relevan dengan peran Anda" />
                )}
              </button>;
  })}
        </div>
        <button
          onClick={() => setShowQueryAudit(!showQueryAudit)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition border cursor-pointer whitespace-nowrap ${
            showQueryAudit
              ? "bg-amber-100 border-amber-300 text-amber-950"
              : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800"
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Matrix Relasi &amp; Validasi (Zod)</span>
        </button>
      </div>

      {
    /* MATRIX RELASI & VALIDATION INFO SHEET (TUGAS 1) */
  }
      {showQueryAudit && <div className="bg-slate-50 border border-amber-200 p-4 rounded-2xl space-y-4 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Matriks Pemetaan API &amp; Validasi Skema (Zod)</h3>
              <p className="text-slate-600 text-xs mt-0.5 font-semibold">
                Sistem validasi menggunakan Zod memastikan bahwa seluruh data masukan dari frontend sudah terverifikasi secara ketat (tipe data, format tanggal, constraints, dan batasan panjang string) sebelum diproses ke database.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs border-b border-slate-100 pb-2">
                <Database className="w-4 h-4 text-sky-600" />
                Query Pemetaan Transaksi (id_pegawai &amp; id_app)
              </h4>
              <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">
                Relasi transaksi harian wajib terikat secara eksklusif ke Tenaga Kerja (<code className="bg-slate-100 px-1 py-0.5 text-rose-600 rounded">id_pegawai</code>) serta Penanggung Jawab (<code className="bg-slate-100 px-1 py-0.5 text-rose-600 rounded">id_app</code>).
              </p>

              <div className="space-y-3 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                {MasterDataService.getQueryMappingMatrix().map((matrix, idx) => <div key={idx} className="pt-2.5 first:pt-0 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-800 font-mono text-[12px]">{matrix.table}</span>
                      <span className="bg-sky-50 text-sky-700 px-2 py-0.5 font-bold rounded-full text-[9px]">REST API SQL JOIN</span>
                    </div>
                    <p className="text-slate-500 font-medium">Kolom Relasi: <code className="text-slate-700 text-[10px] bg-slate-50 px-1 rounded">{matrix.fields}</code></p>
                    <div className="bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[10px] overflow-x-auto">
                      <pre>{matrix.sqlQuery}</pre>
                    </div>
                  </div>)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Contoh JSON Validasi Payload (Zod Schema)
              </h4>
              <p className="text-slate-500 text-[11px] font-semibold">
                Contoh backend validator untuk mencegah SQL Injection &amp; Type Mismatch pada payload <code className="bg-slate-100 px-1 text-slate-800 rounded">m_pegawai</code> &amp; <code className="bg-slate-100 px-1 text-slate-800 rounded">m_unit</code>:
              </p>

              <div className="bg-slate-900 text-sky-300 p-3 rounded-lg font-mono text-[10px] overflow-x-auto max-h-72">
                <pre>{`// Backend Validasi Middleware menggunakan Zod
import { z } from 'zod';

export const mPegawaiSchema = z.object({
  id_pegawai: z.number().int().positive(),
  nip: z.string().min(8).max(12),
  nama: z.string().min(3).max(100),
  tgl_masuk: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  id_jabatan: z.number().int(),
  id_unit_uit: z.number().int(),
  id_unit_upt: z.number().int(),
  id_unit_ultg: z.number().int(),
  id_unit_gi: z.number().int(),
  active: z.enum(['Y', 'N'])
});

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    req.validatedBody = result.data;
    next();
  };
};`}</pre>
              </div>
            </div>
          </div>
        </div>}

      {
    /* GRID CONTROL BAR */
  }
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {
    /* Search Input */
  }
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
    type="text"
    placeholder={`Cari di dalam tabel ${selectedTable}...`}
    value={searchQuery}
    onChange={(e) => {
      setSearchQuery(e.target.value);
      setCurrentPage(1);
    }}
    className="w-full h-11 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white transition"
  />
        </div>

        {
    /* Filter buttons & Actions */
  }
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/50">
            <button
              onClick={() => {
                setActiveFilter("ALL");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1 rounded-full font-bold cursor-pointer transition text-xs ${activeFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                setActiveFilter("Y");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1 rounded-full font-bold cursor-pointer transition text-xs ${activeFilter === "Y" ? "bg-white text-emerald-800 shadow-xs border border-slate-200/20" : "text-slate-500 hover:text-slate-900"}`}
            >
              Active (Y)
            </button>
            <button
              onClick={() => {
                setActiveFilter("N");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1 rounded-full font-bold cursor-pointer transition text-xs ${activeFilter === "N" ? "bg-white text-rose-800 shadow-xs border border-slate-200/20" : "text-slate-500 hover:text-slate-900"}`}
            >
              Inactive (N)
            </button>
          </div>

          {isAdmin ? (
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold rounded-full text-[11px] flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Akses Full CRUD Admin</span>
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 font-bold rounded-full text-[11px] flex items-center gap-1.5 shrink-0" title="Switch ke Peran Admin untuk Ubah/Hapus Data">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>Read-Only (Admin Only)</span>
            </span>
          )}

          <button
            onClick={() => {
              if (!isAdmin) {
                showFeedback("error", "Akses Ditolak: Hanya Role Administrator yang berwenang menambah Data Master Baru.");
                return;
              }
              handleOpenAddModal();
            }}
            className={`px-4 py-2 text-white font-extrabold rounded-full shadow-md flex items-center gap-1.5 transition cursor-pointer text-xs ${
              isAdmin ? "bg-[#00A3E0] hover:bg-[#0082B3] shadow-[#00A3E0]/10" : "bg-slate-400 opacity-70 cursor-not-allowed"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {
    /* CORE DATA GRID (TUGAS 2.A) */
  }
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-600" />
            <span className="font-extrabold text-slate-800 text-[11px] sm:text-xs">
              {MASTER_TABLES_INFO.find((t) => t.key === selectedTable)?.desc}
            </span>
          </div>
          <span className="text-[10px] bg-slate-200/80 px-2.5 py-0.5 rounded-full font-bold text-slate-700">
            Total Record: {totalCount}
          </span>
        </div>

        <div className="overflow-x-auto">
          {gridData.length === 0 ? <div className="p-12 text-center text-slate-500 font-bold space-y-1">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p>Tidak ada data master yang cocok dengan filter pencarian.</p>
              <p className="text-[10px] text-slate-400 font-semibold">Coba kata kunci lain atau tambahkan data baru!</p>
            </div> : <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  {columns.map((col) => <th
    key={col}
    onClick={() => handleSort(col)}
    className="py-2.5 px-4 font-mono font-bold text-slate-500 cursor-pointer hover:bg-slate-100/50 transition whitespace-nowrap"
  >
                      <div className="flex items-center gap-1.5">
                        <span>{col}</span>
                        {sortBy === col && <span className="text-[10px] text-sky-600">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span>}
                      </div>
                    </th>)}
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {gridData.map((row, idx) => {
    const idValue = row[pkName];
    return <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      {columns.map((col) => {
      const cellVal = row[col];
      if (col === "active") {
        return <td key={col} className="py-2.5 px-4">
                              {cellVal === "Y" ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                  <span>Active</span>
                                </span> : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                  <span>Inactive</span>
                                </span>}
                            </td>;
      }
      if (col === "nominal_umk") {
        return <td key={col} className="py-2.5 px-4 font-mono font-bold text-sky-800">
                              Rp {Number(cellVal).toLocaleString("id-ID")}
                            </td>;
      }
      if (col.startsWith("id_") && col !== pkName && fkOptions[col]) {
        const matchOpt = fkOptions[col].find((opt) => String(opt.value) === String(cellVal) || opt.value === Number(cellVal));
        return <td key={col} className="py-2.5 px-4 font-semibold whitespace-nowrap">
                              <span className="text-slate-950 font-bold">{cellVal ?? "-"}</span>
                              {matchOpt && <span className="ml-1.5 text-[10px] bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md font-bold max-w-xs truncate inline-block align-middle">
                                  {matchOpt.label}
                                </span>}
                            </td>;
      }
      return <td key={col} className={`py-2.5 px-4 ${col === pkName ? "font-mono font-bold text-slate-900" : "text-slate-600"}`}>
                            {cellVal === null || cellVal === void 0 ? "-" : String(cellVal)}
                          </td>;
    })}

                      {
      /* Row Action Buttons (TUGAS 2.A.2) */
    }
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
      onClick={() => handleOpenDetailModal(row)}
      className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
      title="Detail Record"
    >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
      onClick={() => handleOpenEditModal(row)}
      className="p-1.5 text-sky-600 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-lg transition cursor-pointer"
      title="Edit Record"
    >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
      onClick={() => handleDeleteItem(idValue)}
      className="p-1.5 text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer"
      title="Hapus / Switch Non-Aktif"
    >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>;
  })}
              </tbody>
            </table>}
        </div>

        {
    /* PAGINATION PANEL */
  }
        {totalCount > itemsPerPage && <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold">
              Menampilkan {Math.min(totalCount, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(totalCount, currentPage * itemsPerPage)} dari {totalCount} baris
            </span>

            <div className="flex items-center gap-1">
              <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(currentPage - 1)}
    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition"
  >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 text-[11px]">
                {currentPage}
              </span>

              <button
    disabled={currentPage * itemsPerPage >= totalCount}
    onClick={() => setCurrentPage(currentPage + 1)}
    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition"
  >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>}
      </div>

      {/* CORE CRUD FORM MODAL (TUGAS 2.A.3) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
            {
    /* Modal Header */
  }
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-600" />
                  <span>
                    {modalMode === "add" ? `Tambah Data Baru: ${MASTER_TABLES_INFO.find((t) => t.key === selectedTable)?.label}` : modalMode === "edit" ? `Edit Data ID #${selectedItem?.[pkName]}` : `Detail Record ID #${selectedItem?.[pkName]}`}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold font-mono mt-0.5">{selectedTable}</p>
              </div>
              <button
    onClick={() => setIsModalOpen(false)}
    className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition cursor-pointer"
  >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {
    /* Validation Errors Overlay */
  }
            {validationErrors.length > 0 && <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Kesalahan Validasi Payload:</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5 font-medium">
                  {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>}

            {/* Modal Form Fields */}
            <form id="master-data-form" onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {columns.map((col) => {
    const isPkColumn = col === pkName;
    const isFkColumn = col.startsWith("id_") && !isPkColumn && fkOptions[col];
    const value = formPayload[col] ?? "";
    const isReadonly = modalMode === "detail" || (modalMode === "edit" && isPkColumn) || (selectedTable === "m_pegawai" && col === "id_mutasi");
    if (col === "active") {
      return <div key={col} className="flex flex-col gap-1">
                        <label className="font-bold text-slate-800 capitalize">Status Active</label>
                        <select
        disabled={isReadonly}
        value={value}
        onChange={(e) => setFormPayload({ ...formPayload, active: e.target.value })}
        className="w-full h-10 px-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none"
      >
                          <option value="Y">Y (Active)</option>
                          <option value="N">N (Non-Active)</option>
                        </select>
                      </div>;
    }
    if (isFkColumn && fkOptions[col]) {
      return <div key={col} className="flex flex-col gap-1">
                        <label className="font-bold text-slate-800 capitalize">
                          {col.replace("id_", "Pilih ").replace("_", " ")}
                        </label>
                        <select
        disabled={isReadonly}
        value={value}
        onChange={(e) => handleFkSelectChange(col, e.target.value)}
        className="w-full h-10 px-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none"
      >
                          <option value="">-- Pilih Induk Data --</option>
                          {fkOptions[col].map((opt) => <option key={opt.value} value={opt.value}>
                              [{opt.value}] {opt.label}
                            </option>)}
                        </select>
                      </div>;
    }
    const isDate = col.startsWith("tgl_") || col.endsWith("_aktif") || col.endsWith("_mutasi");
    if (isDate) {
      return <div key={col} className="flex flex-col gap-1">
                        <label className="font-bold text-slate-800 capitalize">{col.replace("_", " ")}</label>
                        <input
        type="date"
        readOnly={isReadonly}
        value={value}
        onChange={(e) => setFormPayload({ ...formPayload, [col]: e.target.value })}
        className="w-full h-10 px-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none"
      />
                      </div>;
    }
    const isNumberInput =
      isPkColumn ||
      col === "tahun_umk" ||
      col === "nominal_umk" ||
      col === "nilai_umk" ||
      col === "tahun_libur" ||
      col === "koef_tmk" ||
      col === "koef" ||
      col === "nip_peg";
    return <div key={col} className="flex flex-col gap-1">
                      <label className="font-bold text-slate-800">
                        {col.toUpperCase()} {isPkColumn && <span className="text-amber-600">[PK]</span>}
                      </label>
                      <input
      type={isNumberInput ? "number" : "text"}
      readOnly={isReadonly}
      placeholder={isPkColumn ? "Auto Primary Key" : `Masukkan ${col}`}
      value={value}
      onChange={(e) => {
        const val = isNumberInput ? e.target.value === "" ? "" : Number(e.target.value) : e.target.value;
        setFormPayload({ ...formPayload, [col]: val });
      }}
      className={`w-full h-10 px-2.5 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none border ${isReadonly ? "bg-slate-100 border-slate-200 cursor-not-allowed" : "bg-slate-50 border-slate-300"}`}
    />
                    </div>;
  })}
              </div>

              {/* Cascade update info helper */}
              {selectedTable === "t_mutasi" && modalMode === "add" && <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl flex items-start gap-2 text-[10px]">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="font-medium">
                    <strong>Cascade Update:</strong> Menambahkan riwayat mutasi baru akan secara otomatis memindahkan unit penempatan dan gardu induk pegawai yang bersangkutan pada tabel master tenaga kerja (m_pegawai).
                  </p>
                </div>}
            </form>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>

              {modalMode !== "detail" && (
                <button
                  type="submit"
                  form="master-data-form"
                  onClick={handleFormSubmit}
                  disabled={isLoading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Simpan Perubahan</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>)}
      </AnimatePresence>
    </div>;
};
