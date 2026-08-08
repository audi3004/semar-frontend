import express from "express";
import path from "path";
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(express.json());

// In-Memory Database for Master Data REST API
let masterHariLibur = [
  { id_hpl: 1, tgl_libur: "2026-01-01", ket_libur: "Tahun Baru Masehi 2026", tahun_libur: 2026 },
  { id_hpl: 2, tgl_libur: "2026-05-01", ket_libur: "Hari Buruh Internasional", tahun_libur: 2026 },
  { id_hpl: 3, tgl_libur: "2026-08-17", ket_libur: "Hari Kemerdekaan Republik Indonesia", tahun_libur: 2026 },
  { id_hpl: 4, tgl_libur: "2026-12-25", ket_libur: "Hari Raya Natal", tahun_libur: 2026 }
];

let masterUpahDasar = [
  { id_umk: 101, jenis_wilayah: "Kota", nama_wilayah: "Kota Semarang", nama_umk: "UMK Kota Semarang 2026", kab_kota: "Kota Semarang", tahun_umk: 2026, nilai_umk: 3450000, nominal_umk: 3450000, is_active: "Y" },
  { id_umk: 102, jenis_wilayah: "Kabupaten", nama_wilayah: "Kabupaten Semarang", nama_umk: "UMK Kabupaten Semarang 2026", kab_kota: "Kab. Semarang", tahun_umk: 2026, nilai_umk: 2850000, nominal_umk: 2850000, is_active: "Y" },
  { id_umk: 103, jenis_wilayah: "Kota", nama_wilayah: "Kota Surakarta", nama_umk: "UMK Kota Surakarta 2026", kab_kota: "Kota Surakarta", tahun_umk: 2026, nilai_umk: 2500000, nominal_umk: 2500000, is_active: "Y" },
  { id_umk: 104, jenis_wilayah: "Kabupaten", nama_wilayah: "Kabupaten Banyumas", nama_umk: "UMK Kabupaten Banyumas 2026", kab_kota: "Kab. Banyumas", tahun_umk: 2026, nilai_umk: 2300000, nominal_umk: 2300000, is_active: "Y" }
];

let masterLembur = [
  { id_lembur: 1, kat_lembur: "Pekerjaan Tower & Transmisi" },
  { id_lembur: 2, kat_lembur: "Perbantuan Validasi ROW" },
  { id_lembur: 3, kat_lembur: "Emergency / Pelacakan Gangguan" },
  { id_lembur: 4, kat_lembur: "Manuver Sistem & Pemeliharaan GI" },
  { id_lembur: 5, kat_lembur: "Piket Tanggal Merah / Cuti Pengganti" }
];

let masterFaktorUpah = [
  { id_koef_tmk: 1, id_tmk: 1, masa_kerja: "TMK Level 1 (0 - 2 Tahun)", tingkat_tmk: "TMK Level 1 (0 - 2 Tahun)", koef_tmk: 1, koef: 10, tmk: 5, pembagi_jam: 173, is_active: "Y" },
  { id_koef_tmk: 2, id_tmk: 2, masa_kerja: "TMK Level 2 (3 - 5 Tahun)", tingkat_tmk: "TMK Level 2 (3 - 5 Tahun)", koef_tmk: 2, koef: 15, tmk: 10, pembagi_jam: 173, is_active: "Y" },
  { id_koef_tmk: 3, id_tmk: 3, masa_kerja: "TMK Level 3 (> 5 Tahun)", tingkat_tmk: "TMK Level 3 (> 5 Tahun)", koef_tmk: 3, koef: 20, tmk: 15, pembagi_jam: 173, is_active: "Y" }
];

let masterRoles = [
  { id_role: 1, kode_role: "ADMIN", nama_role: "Administrator System", level_role: 1, is_super_admin: "Y", is_active: "Y" },
  { id_role: 2, kode_role: "MAKER", nama_role: "Tenaga Kerja / Maker", level_role: 5, is_super_admin: "N", is_active: "Y" },
  { id_role: 3, kode_role: "CHECKER", nama_role: "Pemeriksa / Checker", level_role: 4, is_super_admin: "N", is_active: "Y" },
  { id_role: 4, kode_role: "VERIFIKATOR", nama_role: "Verifikator Lapangan", level_role: 3, is_super_admin: "N", is_active: "Y" },
  { id_role: 5, kode_role: "APPROVER1", nama_role: "Approver 1 (Spv/Manager)", level_role: 2, is_super_admin: "N", is_active: "Y" }
];

let masterProjects = [
  { id_project: 1, nama_project: "SUTT 150kV JATENG DIY", is_active: "Y" },
  { id_project: 2, nama_project: "Pemeliharaan GI Terpadu", is_active: "Y" },
  { id_project: 3, nama_project: "Relay & Protection Upgrade", is_active: "Y" }
];

let masterJabatan = [
  { id_jabatan: 1, id_project: 2, nama_jabatan: "Teknisi Pemeliharaan GI", is_active: "Y" },
  { id_jabatan: 2, id_project: 1, nama_jabatan: "Operator Proteksi Transmisi", is_active: "Y" },
  { id_jabatan: 3, id_project: 2, nama_jabatan: "Team Leader GI", is_active: "Y" },
  { id_jabatan: 4, id_project: 3, nama_jabatan: "Supervisor Gardu Induk", is_active: "Y" }
];

let masterGaji = [
  { id_gaji: 1, id_umk: 101, id_koef_tmk: 1, gaji_pokok: 3450000, tahun_umk: 2026, is_active: "Y" },
  { id_gaji: 2, id_umk: 102, id_koef_tmk: 2, gaji_pokok: 2850000, tahun_umk: 2026, is_active: "Y" },
  { id_gaji: 3, id_umk: 103, id_koef_tmk: 3, gaji_pokok: 2500000, tahun_umk: 2026, is_active: "Y" }
];

let masterUnit = [
  { id_unit: 1, id_unit_uit: 1, id_induk_unit: null, level: "UIT", nama_unit: "UIT JBT", id_unit_upt: 10, id_unit_ultg: 100, id_unit_gi: 1001, uit: "UIT JBT", upt: "UPT Semarang", ultg: "ULTG Semarang", gardu_induk: "GI Krapyak", id_gaji: 1, is_active: "Y" },
  { id_unit: 2, id_unit_uit: 1, id_induk_unit: 1, level: "UPT", nama_unit: "UPT Semarang", id_unit_upt: 10, id_unit_ultg: 100, id_unit_gi: 1002, uit: "UIT JBT", upt: "UPT Semarang", ultg: "ULTG Semarang", gardu_induk: "GI Ungaran", id_gaji: 2, is_active: "Y" },
  { id_unit: 3, id_unit_uit: 1, id_induk_unit: 2, level: "ULTG", nama_unit: "ULTG Salatiga", id_unit_upt: 10, id_unit_ultg: 101, id_unit_gi: 1003, uit: "UIT JBT", upt: "UPT Semarang", ultg: "ULTG Salatiga", gardu_induk: "GI Tuntang", id_gaji: 1, is_active: "Y" },
  { id_unit: 4, id_unit_uit: 1, id_induk_unit: 2, level: "ULTG", nama_unit: "ULTG Purwokerto", id_unit_upt: 11, id_unit_ultg: 102, id_unit_gi: 1004, uit: "UIT JBT", upt: "UPT Purwokerto", ultg: "ULTG Purwokerto", gardu_induk: "GI Kalisari", id_gaji: 3, is_active: "Y" }
];

// Data Store Opsi B (User, Pegawai, Petugas, Unit Role, Module, Access Module)
let masterPegawai = [
  { id_pegawai: 1, id_jabatan: 1, id_unit: 1, nip: "8912345Z", nama: "Budi Santoso", tgl_masuk: "2022-03-15", is_active: "Y" },
  { id_pegawai: 2, id_jabatan: 2, id_unit: 2, nip: "9023456Y", nama: "Siti Aminah", tgl_masuk: "2021-06-01", is_active: "Y" },
  { id_pegawai: 3, id_jabatan: 3, id_unit: 3, nip: "8534567X", nama: "Ahmad Dani", tgl_masuk: "2018-01-10", is_active: "Y" }
];

let masterPetugas = [
  { id_petugas: 1, id_unit: 1, id_jabatan: 1, id_gaji: 1, nip: "PTG-001", nama: "Budi Santoso", tgl_masuk: "2022-03-15", is_active: "Y" },
  { id_petugas: 2, id_unit: 2, id_jabatan: 2, id_gaji: 2, nip: "PTG-002", nama: "Siti Aminah", tgl_masuk: "2021-06-01", is_active: "Y" },
  { id_petugas: 3, id_unit: 3, id_jabatan: 3, id_gaji: 1, nip: "PTG-003", nama: "Ahmad Dani", tgl_masuk: "2018-01-10", is_active: "Y" }
];

let masterUnitRole = [
  { id_unit_role: 1, id_user: 1, id_unit: 1, id_role: 2, is_active: "Y" },
  { id_unit_role: 2, id_user: 2, id_unit: 2, id_role: 3, is_active: "Y" },
  { id_unit_role: 3, id_user: 8, id_unit: 1, id_role: 1, is_active: "Y" }
];

let masterModule = [
  { id_module: 1, kode_module: "MOD_LEMBUR", nama_module: "Modul Pengajuan Lembur", deskripsi: "Manajemen lembur pegawai dan approval", is_active: "Y" },
  { id_module: 2, kode_module: "MOD_CUTI", nama_module: "Modul Pengajuan Cuti", deskripsi: "Manajemen cuti pegawai dan approval", is_active: "Y" },
  { id_module: 3, kode_module: "MOD_SPPD", nama_module: "Modul Perjalanan Dinas", deskripsi: "Manajemen SPPD dan biaya dinas", is_active: "Y" }
];

let masterAccessModule = [
  { id_access: 1, id_role: 1, id_module: 1, can_create: "Y", can_read: "Y", can_update: "Y", can_delete: "Y", can_approve: "Y" },
  { id_access: 2, id_role: 2, id_module: 1, can_create: "Y", can_read: "Y", can_update: "Y", can_delete: "N", can_approve: "N" },
  { id_access: 3, id_role: 5, id_module: 1, can_create: "N", can_read: "Y", can_update: "Y", can_delete: "N", can_approve: "Y" }
];

// Data Store Opsi C (Workflow Status & Transaksi Pengajuan)
let masterStatus = [
  { id_status: 1, kode_status: "DRAFT", nama_status: "Draft Pengajuan", deskripsi: "Pengajuan baru dibuat dan belum disubmit ke sistem", is_active: "Y" },
  { id_status: 2, kode_status: "SUBMITTED", nama_status: "Diajukan (Menunggu Verification)", deskripsi: "Pengajuan telah disubmit dan menunggu verifikasi petugas", is_active: "Y" },
  { id_status: 3, kode_status: "CHECKED", nama_status: "Verified (Checker)", deskripsi: "Telah diperiksa dan disetujui verifikator lapangan", is_active: "Y" },
  { id_status: 4, kode_status: "APPROVED_SPV", nama_status: "Disetujui Supervisor / MAN", deskripsi: "Disetujui pejabat struktural berwenang", is_active: "Y" },
  { id_status: 5, kode_status: "APPROVED_FINAL", nama_status: "Disetujui Final / SDM", deskripsi: "Persetujuan akhir oleh bagian SDM & Keuangan", is_active: "Y" },
  { id_status: 6, kode_status: "REJECTED", nama_status: "Ditolak / Dikembalikan", deskripsi: "Pengajuan ditolak oleh verifikator/pejabat", is_active: "Y" },
  { id_status: 7, kode_status: "COMPLETED", nama_status: "Selesai Diproses", deskripsi: "Selesai direkap dan dicairkan dalam sistem payroll", is_active: "Y" }
];

let transaksiLembur = [
  { id_lembur: 1, id_lembur_trans: 1, id_pegawai: 1, id_app: 1, tgl_lembur: "2026-07-20", jam_mulai: "17:00", jam_selesai: "21:00", total_jam: 4, nominal_biaya: 250000, pekerjaan: "Pemeliharaan Darurat Trafo GI Krapyak", status: "APPROVED", id_jenis: "JNS-001" },
  { id_lembur: 2, id_lembur_trans: 2, id_pegawai: 2, id_app: 1, tgl_lembur: "2026-07-22", jam_mulai: "18:00", jam_selesai: "22:00", total_jam: 4, nominal_biaya: 275000, pekerjaan: "Inspeksi Proteksi Transmisi GI Ungaran", status: "PENDING", id_jenis: "JNS-002" },
  { id_lembur: 3, id_lembur_trans: 3, id_pegawai: 3, id_app: 2, tgl_lembur: "2026-07-25", jam_mulai: "16:30", jam_selesai: "20:30", total_jam: 4, nominal_biaya: 320000, pekerjaan: "Penanganan Gangguan SUTT 150kV", status: "APPROVED", id_jenis: "JNS-003" }
];

let transaksiCuti = [
  { id_cuti: 1, id_pegawai: 1, id_app: 1, jenis_cuti: "Tahunan", tgl_mulai: "2026-08-01", tgl_selesai: "2026-08-03", jumlah_hari: 3, alamat_cuti: "Jl. Pemuda No. 12 Semarang", telepon_darurat: "08123456789", status: "APPROVED" },
  { id_cuti: 2, id_pegawai: 2, id_app: 1, jenis_cuti: "Tahunan", tgl_mulai: "2026-08-10", tgl_selesai: "2026-08-12", jumlah_hari: 3, alamat_cuti: "Jl. Pandanaran No. 45 Semarang", telepon_darurat: "08234567890", status: "PENDING" }
];

let transaksiLogCuti = [
  { id_log_cuti: 1, id_pegawai: 1, tahun: 2026, jatah_cuti: 12, terpakai: 3, sisa_cuti: 9, keterangan: "Hak cuti tahunan reguler 2026" },
  { id_log_cuti: 2, id_pegawai: 2, tahun: 2026, jatah_cuti: 12, terpakai: 0, sisa_cuti: 12, keterangan: "Hak cuti tahunan reguler 2026" },
  { id_log_cuti: 3, id_pegawai: 3, tahun: 2026, jatah_cuti: 12, terpakai: 2, sisa_cuti: 10, keterangan: "Hak cuti tahunan reguler 2026" }
];

let transaksiSppd = [
  { id_sppd: 1, id_pegawai: 1, id_app: 1, no_sppd: "SPPD/2026/07/001", kota_tujuan: "Surakarta", maksud_dinas: "Koordinasi Sistem Proteksi UPT Surakarta", tgl_berangkat: "2026-07-15", tgl_kembali: "2026-07-17", lama_dinas: 3, status: "APPROVED" },
  { id_sppd: 2, id_pegawai: 3, id_app: 2, no_sppd: "SPPD/2026/07/002", kota_tujuan: "Yogyakarta", maksud_dinas: "Audit Mutu Peralatan GI Wirobrajan", tgl_berangkat: "2026-07-28", tgl_kembali: "2026-07-30", lama_dinas: 3, status: "PENDING" }
];

let transaksiIjin = [
  { id_ijin: 1, id_pegawai: 1, id_app: 1, alasan_ijin: "Urusan Keluarga Penting", tgl_mulai: "2026-07-10", tgl_selesai: "2026-07-10", jumlah_hari: 1, keterangan: "Izin menghadiri acara keluarga di Magelang", status: "APPROVED" },
  { id_ijin: 2, id_pegawai: 2, id_app: 1, alasan_ijin: "Ijin Kepentingan Pribadi", tgl_mulai: "2026-07-18", tgl_selesai: "2026-07-18", jumlah_hari: 1, keterangan: "Izin pengurusan dokumen resmi di Kendal", status: "PENDING" }
];

let transaksiSakit = [
  { id_sakit: 1, id_pegawai: 1, id_app: 1, diagnosa: "Ispat & Demam Tinggi", tgl_mulai: "2026-06-12", tgl_selesai: "2026-06-14", jumlah_hari: 3, file_surat_dokter: "/uploads/surat_sakit_001.pdf", status: "APPROVED" },
  { id_sakit: 2, id_pegawai: 3, id_app: 1, diagnosa: "Gejala Tipes", tgl_mulai: "2026-07-02", tgl_selesai: "2026-07-04", jumlah_hari: 3, file_surat_dokter: "/uploads/surat_sakit_002.pdf", status: "APPROVED" }
];

let transaksiMutasi = [
  { id_mutasi: 1, id_pegawai: 1, start_mutasi: "2026-01-01", id_unit_upt: 1, id_unit_ultg: 1, id_unit_gi: 1, status: "APPROVED" },
  { id_mutasi: 2, id_pegawai: 2, start_mutasi: "2026-04-15", id_unit_upt: 1, id_unit_ultg: 2, id_unit_gi: 2, status: "APPROVED" }
];

// Helper for filtering, sorting, pagination
function handleQuery(dataList, pkName, reqQuery) {
  let list = [...dataList];
  const { search, page, limit, sortBy, sortOrder } = reqQuery;

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((item) =>
      Object.values(item).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }

  if (sortBy) {
    const order = sortOrder === "desc" ? -1 : 1;
    list.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA === valB) return 0;
      return valA < valB ? -order : order;
    });
  }

  const p = Number(page) || 1;
  const l = Number(limit) || 10;
  const total = list.length;
  const startIndex = (p - 1) * l;
  const paginatedData = list.slice(startIndex, startIndex + l);

  return { data: paginatedData, total, page: p, limit: l };
}

// REST API 1: Master Hari Libur (/api/master/hari-libur)
app.get("/api/master/hari-libur", (req, res) => {
  try {
    const result = handleQuery(masterHariLibur, "id_hpl", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Hari Libur" });
  }
});

app.post("/api/master/hari-libur", (req, res) => {
  try {
    const { id_hpl, tgl_libur, ket_libur, tahun_libur } = req.body;
    if (!tgl_libur || !ket_libur) {
      return res.status(400).json({ success: false, message: "Field tgl_libur dan ket_libur wajib diisi" });
    }
    const newId = Number(id_hpl) || (masterHariLibur.length > 0 ? Math.max(...masterHariLibur.map(x => x.id_hpl)) + 1 : 1);
    const newItem = {
      id_hpl: newId,
      tgl_libur: String(tgl_libur),
      ket_libur: String(ket_libur),
      tahun_libur: Number(tahun_libur) || new Date(tgl_libur).getFullYear() || 2026
    };
    masterHariLibur.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Master Hari Libur berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Hari Libur" });
  }
});

app.put("/api/master/hari-libur/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterHariLibur.findIndex(item => item.id_hpl === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Data Hari Libur tidak ditemukan" });
    }
    const { tgl_libur, ket_libur, tahun_libur } = req.body;
    masterHariLibur[index] = {
      ...masterHariLibur[index],
      ...(tgl_libur && { tgl_libur: String(tgl_libur) }),
      ...(ket_libur && { ket_libur: String(ket_libur) }),
      ...(tahun_libur !== undefined && { tahun_libur: Number(tahun_libur) })
    };
    res.json({ success: true, data: masterHariLibur[index], message: "Master Hari Libur berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Hari Libur" });
  }
});

app.delete("/api/master/hari-libur/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterHariLibur.length;
    masterHariLibur = masterHariLibur.filter(item => item.id_hpl !== id);
    if (masterHariLibur.length === initialLen) {
      return res.status(404).json({ success: false, message: "Data Hari Libur tidak ditemukan" });
    }
    res.json({ success: true, message: "Master Hari Libur berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Hari Libur" });
  }
});

// REST API 2: Master Upah Dasar (/api/master/upah-dasar)
app.get("/api/master/upah-dasar", (req, res) => {
  try {
    const result = handleQuery(masterUpahDasar, "id_umk", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Upah Dasar" });
  }
});

app.post("/api/master/upah-dasar", (req, res) => {
  try {
    const { id_umk, jenis_wilayah, nama_umk, kab_kota, tahun_umk, nilai_umk } = req.body;
    if (!nama_umk || !nilai_umk) {
      return res.status(400).json({ success: false, message: "Field nama_umk dan nilai_umk wajib diisi" });
    }
    const newId = Number(id_umk) || (masterUpahDasar.length > 0 ? Math.max(...masterUpahDasar.map(x => x.id_umk)) + 1 : 101);
    const newItem = {
      id_umk: newId,
      jenis_wilayah: String(jenis_wilayah || "Kota"),
      nama_umk: String(nama_umk),
      kab_kota: String(kab_kota || "Semarang"),
      tahun_umk: Number(tahun_umk) || 2026,
      nilai_umk: Number(nilai_umk) || 0
    };
    masterUpahDasar.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Master Upah Dasar berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Upah Dasar" });
  }
});

app.put("/api/master/upah-dasar/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterUpahDasar.findIndex(item => item.id_umk === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Data Upah Dasar tidak ditemukan" });
    }
    const { jenis_wilayah, nama_umk, kab_kota, tahun_umk, nilai_umk } = req.body;
    masterUpahDasar[index] = {
      ...masterUpahDasar[index],
      ...(jenis_wilayah && { jenis_wilayah: String(jenis_wilayah) }),
      ...(nama_umk && { nama_umk: String(nama_umk) }),
      ...(kab_kota && { kab_kota: String(kab_kota) }),
      ...(tahun_umk !== undefined && { tahun_umk: Number(tahun_umk) }),
      ...(nilai_umk !== undefined && { nilai_umk: Number(nilai_umk) })
    };
    res.json({ success: true, data: masterUpahDasar[index], message: "Master Upah Dasar berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Upah Dasar" });
  }
});

app.delete("/api/master/upah-dasar/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterUpahDasar.length;
    masterUpahDasar = masterUpahDasar.filter(item => item.id_umk !== id);
    if (masterUpahDasar.length === initialLen) {
      return res.status(404).json({ success: false, message: "Data Upah Dasar tidak ditemukan" });
    }
    res.json({ success: true, message: "Master Upah Dasar berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Upah Dasar" });
  }
});

// REST API 3: Master Lembur (/api/master/lembur)
app.get("/api/master/lembur", (req, res) => {
  try {
    const result = handleQuery(masterLembur, "id_lembur", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Master Lembur" });
  }
});

app.post("/api/master/lembur", (req, res) => {
  try {
    const { id_lembur, kat_lembur } = req.body;
    if (!kat_lembur) {
      return res.status(400).json({ success: false, message: "Field kat_lembur wajib diisi" });
    }
    const newId = Number(id_lembur) || (masterLembur.length > 0 ? Math.max(...masterLembur.map(x => x.id_lembur)) + 1 : 1);
    const newItem = {
      id_lembur: newId,
      kat_lembur: String(kat_lembur)
    };
    masterLembur.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Master Lembur berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Master Lembur" });
  }
});

app.put("/api/master/lembur/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterLembur.findIndex(item => item.id_lembur === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Data Master Lembur tidak ditemukan" });
    }
    const { kat_lembur } = req.body;
    masterLembur[index] = {
      ...masterLembur[index],
      ...(kat_lembur && { kat_lembur: String(kat_lembur) })
    };
    res.json({ success: true, data: masterLembur[index], message: "Master Lembur berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Master Lembur" });
  }
});

app.delete("/api/master/lembur/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterLembur.length;
    masterLembur = masterLembur.filter(item => item.id_lembur !== id);
    if (masterLembur.length === initialLen) {
      return res.status(404).json({ success: false, message: "Data Master Lembur tidak ditemukan" });
    }
    res.json({ success: true, message: "Master Lembur berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Master Lembur" });
  }
});

// REST API 4: Master Faktor Upah (/api/master/faktor-upah)
app.get("/api/master/faktor-upah", (req, res) => {
  try {
    const result = handleQuery(masterFaktorUpah, "id_tmk", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Faktor Upah" });
  }
});

app.post("/api/master/faktor-upah", (req, res) => {
  try {
    const { id_tmk, tingkat_tmk, koef_tmk, koef, tmk, pembagi_jam } = req.body;
    const newId = Number(id_tmk) || (masterFaktorUpah.length > 0 ? Math.max(...masterFaktorUpah.map(x => x.id_tmk)) + 1 : 1);
    const newItem = {
      id_tmk: newId,
      tingkat_tmk: String(tingkat_tmk || `TMK Level #${newId}`),
      koef_tmk: Number(koef_tmk) || 1,
      koef: Number(koef) || 10,
      tmk: Number(tmk) || 5,
      pembagi_jam: Number(pembagi_jam) || 173
    };
    masterFaktorUpah.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Master Faktor Upah berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Faktor Upah" });
  }
});

app.put("/api/master/faktor-upah/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterFaktorUpah.findIndex(item => item.id_tmk === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Data Faktor Upah tidak ditemukan" });
    }
    const { tingkat_tmk, koef_tmk, koef, tmk, pembagi_jam } = req.body;
    masterFaktorUpah[index] = {
      ...masterFaktorUpah[index],
      ...(tingkat_tmk !== undefined && { tingkat_tmk: String(tingkat_tmk) }),
      ...(koef_tmk !== undefined && { koef_tmk: Number(koef_tmk) }),
      ...(koef !== undefined && { koef: Number(koef) }),
      ...(tmk !== undefined && { tmk: Number(tmk) }),
      ...(pembagi_jam !== undefined && { pembagi_jam: Number(pembagi_jam) })
    };
    res.json({ success: true, data: masterFaktorUpah[index], message: "Master Faktor Upah berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Faktor Upah" });
  }
});

app.delete("/api/master/faktor-upah/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterFaktorUpah.length;
    masterFaktorUpah = masterFaktorUpah.filter(item => item.id_tmk !== id && item.id_koef_tmk !== id);
    if (masterFaktorUpah.length === initialLen) {
      return res.status(404).json({ success: false, message: "Data Faktor Upah tidak ditemukan" });
    }
    res.json({ success: true, message: "Master Faktor Upah berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Faktor Upah" });
  }
});

// REST API Option A: Master Core & Keuangan Endpoints

// 1. Roles (/api/roles & /api/master/roles)
const handleGetRoles = (req, res) => {
  try {
    const result = handleQuery(masterRoles, "id_role", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Role" });
  }
};
app.get("/api/roles", handleGetRoles);
app.get("/api/master/roles", handleGetRoles);

app.post("/api/roles", (req, res) => {
  try {
    const { id_role, kode_role, nama_role, level_role, is_super_admin, is_active } = req.body;
    if (!kode_role || !nama_role) {
      return res.status(400).json({ success: false, message: "kode_role dan nama_role wajib diisi" });
    }
    const newId = Number(id_role) || (masterRoles.length > 0 ? Math.max(...masterRoles.map(x => x.id_role)) + 1 : 1);
    const newItem = {
      id_role: newId,
      kode_role: String(kode_role),
      nama_role: String(nama_role),
      level_role: Number(level_role) || 5,
      is_super_admin: is_super_admin === "Y" ? "Y" : "N",
      is_active: is_active === "N" ? "N" : "Y"
    };
    masterRoles.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Role berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Role" });
  }
});

app.put("/api/roles/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterRoles.findIndex(x => x.id_role === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Role tidak ditemukan" });
    masterRoles[index] = { ...masterRoles[index], ...req.body };
    res.json({ success: true, data: masterRoles[index], message: "Role berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Role" });
  }
});

app.delete("/api/roles/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterRoles.length;
    masterRoles = masterRoles.filter(x => x.id_role !== id);
    if (masterRoles.length === initialLen) return res.status(404).json({ success: false, message: "Role tidak ditemukan" });
    res.json({ success: true, message: "Role berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Role" });
  }
});

// 2. Projects (/api/projects & /api/master/projects)
const handleGetProjects = (req, res) => {
  try {
    const result = handleQuery(masterProjects, "id_project", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Project" });
  }
};
app.get("/api/projects", handleGetProjects);
app.get("/api/master/projects", handleGetProjects);

app.post("/api/projects", (req, res) => {
  try {
    const { id_project, nama_project, is_active } = req.body;
    if (!nama_project) return res.status(400).json({ success: false, message: "nama_project wajib diisi" });
    const newId = Number(id_project) || (masterProjects.length > 0 ? Math.max(...masterProjects.map(x => x.id_project)) + 1 : 1);
    const newItem = { id_project: newId, nama_project: String(nama_project), is_active: is_active === "N" ? "N" : "Y" };
    masterProjects.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Project berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Project" });
  }
});

app.put("/api/projects/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterProjects.findIndex(x => x.id_project === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Project tidak ditemukan" });
    masterProjects[index] = { ...masterProjects[index], ...req.body };
    res.json({ success: true, data: masterProjects[index], message: "Project berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Project" });
  }
});

app.delete("/api/projects/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterProjects.length;
    masterProjects = masterProjects.filter(x => x.id_project !== id);
    if (masterProjects.length === initialLen) return res.status(404).json({ success: false, message: "Project tidak ditemukan" });
    res.json({ success: true, message: "Project berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Project" });
  }
});

// 3. Jabatan (/api/jabatan & /api/master/jabatan)
const handleGetJabatan = (req, res) => {
  try {
    const result = handleQuery(masterJabatan, "id_jabatan", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Jabatan" });
  }
};
app.get("/api/jabatan", handleGetJabatan);
app.get("/api/master/jabatan", handleGetJabatan);

app.post("/api/jabatan", (req, res) => {
  try {
    const { id_jabatan, id_project, nama_jabatan, is_active } = req.body;
    if (!nama_jabatan) return res.status(400).json({ success: false, message: "nama_jabatan wajib diisi" });
    const newId = Number(id_jabatan) || (masterJabatan.length > 0 ? Math.max(...masterJabatan.map(x => x.id_jabatan)) + 1 : 1);
    const newItem = {
      id_jabatan: newId,
      id_project: Number(id_project) || 1,
      nama_jabatan: String(nama_jabatan),
      is_active: is_active === "N" ? "N" : "Y"
    };
    masterJabatan.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Jabatan berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Jabatan" });
  }
});

app.put("/api/jabatan/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterJabatan.findIndex(x => x.id_jabatan === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Jabatan tidak ditemukan" });
    masterJabatan[index] = { ...masterJabatan[index], ...req.body };
    res.json({ success: true, data: masterJabatan[index], message: "Jabatan berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Jabatan" });
  }
});

app.delete("/api/jabatan/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterJabatan.length;
    masterJabatan = masterJabatan.filter(x => x.id_jabatan !== id);
    if (masterJabatan.length === initialLen) return res.status(404).json({ success: false, message: "Jabatan tidak ditemukan" });
    res.json({ success: true, message: "Jabatan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Jabatan" });
  }
});

// 4. UMK (/api/umk & /api/master/umk)
const handleGetUMK = (req, res) => {
  try {
    const result = handleQuery(masterUpahDasar, "id_umk", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data UMK" });
  }
};
app.get("/api/umk", handleGetUMK);
app.get("/api/master/umk", handleGetUMK);

const handlePostUMK = (req, res) => {
  try {
    const { id_umk, jenis_wilayah, nama_wilayah, nama_umk, kab_kota, tahun_umk, nominal_umk, nilai_umk, is_active } = req.body;
    const newId = Number(id_umk) || (masterUpahDasar.length > 0 ? Math.max(...masterUpahDasar.map(x => x.id_umk)) + 1 : 101);
    const nominal = Number(nominal_umk !== undefined ? nominal_umk : nilai_umk) || 0;
    const wilName = nama_wilayah || kab_kota || "Wilayah Baru";
    const newItem = {
      id_umk: newId,
      jenis_wilayah: jenis_wilayah || "Kota",
      nama_wilayah: wilName,
      nama_umk: nama_umk || `UMK ${wilName} ${tahun_umk || 2026}`,
      kab_kota: wilName,
      tahun_umk: Number(tahun_umk) || 2026,
      nilai_umk: nominal,
      nominal_umk: nominal,
      is_active: is_active === "N" ? "N" : "Y"
    };
    masterUpahDasar.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Data UMK berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan UMK" });
  }
};
app.post("/api/umk", handlePostUMK);
app.post("/api/master/umk", handlePostUMK);

const handlePutUMK = (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterUpahDasar.findIndex(x => x.id_umk === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Data UMK tidak ditemukan" });
    const body = req.body;
    if (body.nominal_umk !== undefined) body.nilai_umk = Number(body.nominal_umk);
    if (body.nilai_umk !== undefined) body.nominal_umk = Number(body.nilai_umk);
    masterUpahDasar[index] = { ...masterUpahDasar[index], ...body };
    res.json({ success: true, data: masterUpahDasar[index], message: "Data UMK berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate UMK" });
  }
};
app.put("/api/umk/:id", handlePutUMK);
app.put("/api/master/umk/:id", handlePutUMK);

const handleDeleteUMK = (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterUpahDasar.length;
    masterUpahDasar = masterUpahDasar.filter(x => x.id_umk !== id);
    if (masterUpahDasar.length === initialLen) return res.status(404).json({ success: false, message: "Data UMK tidak ditemukan" });
    res.json({ success: true, message: "Data UMK berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus UMK" });
  }
};
app.delete("/api/umk/:id", handleDeleteUMK);
app.delete("/api/master/umk/:id", handleDeleteUMK);

// 5. Koef TMK (/api/koef-tmk & /api/master/koef-tmk)
const handleGetKoefTMK = (req, res) => {
  try {
    const result = handleQuery(masterFaktorUpah, "id_koef_tmk", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Koef TMK" });
  }
};
app.get("/api/koef-tmk", handleGetKoefTMK);
app.get("/api/master/koef-tmk", handleGetKoefTMK);

const handlePostKoefTMK = (req, res) => {
  try {
    const { id_koef_tmk, id_tmk, masa_kerja, tingkat_tmk, koef, tmk, is_active } = req.body;
    const newId = Number(id_koef_tmk || id_tmk) || (masterFaktorUpah.length > 0 ? Math.max(...masterFaktorUpah.map(x => x.id_koef_tmk || x.id_tmk || 0)) + 1 : 1);
    const mk = masa_kerja || tingkat_tmk || "Masa Kerja Baru";
    const newItem = {
      id_koef_tmk: newId,
      id_tmk: newId,
      masa_kerja: mk,
      tingkat_tmk: mk,
      koef_tmk: newId,
      koef: Number(koef) || 0,
      tmk: Number(tmk) || 0,
      pembagi_jam: 173,
      is_active: is_active === "N" ? "N" : "Y"
    };
    masterFaktorUpah.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Koef TMK berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Koef TMK" });
  }
};
app.post("/api/koef-tmk", handlePostKoefTMK);
app.post("/api/master/koef-tmk", handlePostKoefTMK);

const handlePutKoefTMK = (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterFaktorUpah.findIndex(x => x.id_koef_tmk === id || x.id_tmk === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Koef TMK tidak ditemukan" });
    masterFaktorUpah[index] = { ...masterFaktorUpah[index], ...req.body };
    res.json({ success: true, data: masterFaktorUpah[index], message: "Koef TMK berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Koef TMK" });
  }
};
app.put("/api/koef-tmk/:id", handlePutKoefTMK);
app.put("/api/master/koef-tmk/:id", handlePutKoefTMK);

const handleDeleteKoefTMK = (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterFaktorUpah.length;
    masterFaktorUpah = masterFaktorUpah.filter(x => x.id_koef_tmk !== id && x.id_tmk !== id);
    if (masterFaktorUpah.length === initialLen) return res.status(404).json({ success: false, message: "Koef TMK tidak ditemukan" });
    res.json({ success: true, message: "Koef TMK berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Koef TMK" });
  }
};
app.delete("/api/koef-tmk/:id", handleDeleteKoefTMK);
app.delete("/api/master/koef-tmk/:id", handleDeleteKoefTMK);

// 6. Gaji (/api/gaji & /api/master/gaji)
const handleGetGaji = (req, res) => {
  try {
    const result = handleQuery(masterGaji, "id_gaji", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Gaji" });
  }
};
app.get("/api/gaji", handleGetGaji);
app.get("/api/master/gaji", handleGetGaji);

app.post("/api/gaji", (req, res) => {
  try {
    const { id_gaji, id_umk, id_koef_tmk, gaji_pokok, tahun_umk, is_active } = req.body;
    const newId = Number(id_gaji) || (masterGaji.length > 0 ? Math.max(...masterGaji.map(x => x.id_gaji)) + 1 : 1);
    const newItem = {
      id_gaji: newId,
      id_umk: Number(id_umk) || 101,
      id_koef_tmk: Number(id_koef_tmk) || 1,
      gaji_pokok: Number(gaji_pokok) || 3450000,
      tahun_umk: Number(tahun_umk) || 2026,
      is_active: is_active === "N" ? "N" : "Y"
    };
    masterGaji.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Data Gaji berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Data Gaji" });
  }
});

app.put("/api/gaji/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterGaji.findIndex(x => x.id_gaji === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Data Gaji tidak ditemukan" });
    masterGaji[index] = { ...masterGaji[index], ...req.body };
    res.json({ success: true, data: masterGaji[index], message: "Data Gaji berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Data Gaji" });
  }
});

app.delete("/api/gaji/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterGaji.length;
    masterGaji = masterGaji.filter(x => x.id_gaji !== id);
    if (masterGaji.length === initialLen) return res.status(404).json({ success: false, message: "Data Gaji tidak ditemukan" });
    res.json({ success: true, message: "Data Gaji berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Data Gaji" });
  }
});

// 7. Unit (/api/unit & /api/master/unit)
const handleGetUnit = (req, res) => {
  try {
    const result = handleQuery(masterUnit, "id_unit", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Unit" });
  }
};
app.get("/api/unit", handleGetUnit);
app.get("/api/master/unit", handleGetUnit);

app.post("/api/unit", (req, res) => {
  try {
    const { id_unit, id_induk_unit, level, nama_unit, is_active } = req.body;
    if (!nama_unit) return res.status(400).json({ success: false, message: "nama_unit wajib diisi" });
    const newId = Number(id_unit) || (masterUnit.length > 0 ? Math.max(...masterUnit.map(x => x.id_unit)) + 1 : 1);
    const newItem = {
      id_unit: newId,
      id_unit_uit: newId,
      id_induk_unit: id_induk_unit ? Number(id_induk_unit) : null,
      level: level || "UPT",
      nama_unit: String(nama_unit),
      is_active: is_active === "N" ? "N" : "Y"
    };
    masterUnit.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Unit berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Unit" });
  }
});

app.put("/api/unit/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterUnit.findIndex(x => x.id_unit === id || x.id_unit_uit === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Unit tidak ditemukan" });
    masterUnit[index] = { ...masterUnit[index], ...req.body };
    res.json({ success: true, data: masterUnit[index], message: "Unit berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Unit" });
  }
});

app.delete("/api/unit/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterUnit.length;
    masterUnit = masterUnit.filter(x => x.id_unit !== id && x.id_unit_uit !== id);
    if (masterUnit.length === initialLen) return res.status(404).json({ success: false, message: "Unit tidak ditemukan" });
    res.json({ success: true, message: "Unit berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Unit" });
  }
});

// REST API Opsi B: User, Pegawai, Petugas, Unit Role, Module, Access Module

// 1. Pegawai (/api/pegawai & /api/master/pegawai)
const handleGetPegawai = (req, res) => {
  try {
    const result = handleQuery(masterPegawai, "id_pegawai", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Pegawai" });
  }
};
app.get("/api/pegawai", handleGetPegawai);
app.get("/api/master/pegawai", handleGetPegawai);

app.post("/api/pegawai", (req, res) => {
  try {
    const { id_pegawai, id_jabatan, id_unit, nip, nama, tgl_masuk, is_active } = req.body;
    if (!nip || !nama) return res.status(400).json({ success: false, message: "NIP dan Nama Pegawai wajib diisi" });
    const newId = Number(id_pegawai) || (masterPegawai.length > 0 ? Math.max(...masterPegawai.map(x => x.id_pegawai)) + 1 : 1);
    const newItem = {
      id_pegawai: newId,
      id_jabatan: Number(id_jabatan) || 1,
      id_unit: Number(id_unit) || 1,
      nip: String(nip),
      nama: String(nama),
      tgl_masuk: tgl_masuk || new Date().toISOString().split("T")[0],
      is_active: is_active === "N" ? "N" : "Y"
    };
    masterPegawai.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Pegawai berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Pegawai" });
  }
});

app.put("/api/pegawai/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterPegawai.findIndex(x => x.id_pegawai === id || x.nip === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: "Pegawai tidak ditemukan" });
    masterPegawai[index] = { ...masterPegawai[index], ...req.body };
    res.json({ success: true, data: masterPegawai[index], message: "Pegawai berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Pegawai" });
  }
});

app.delete("/api/pegawai/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterPegawai.length;
    masterPegawai = masterPegawai.filter(x => x.id_pegawai !== id && x.nip !== req.params.id);
    if (masterPegawai.length === initialLen) return res.status(404).json({ success: false, message: "Pegawai tidak ditemukan" });
    res.json({ success: true, message: "Pegawai berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Pegawai" });
  }
});

// 2. Petugas (/api/petugas & /api/master/petugas)
const handleGetPetugas = (req, res) => {
  try {
    const result = handleQuery(masterPetugas, "id_petugas", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Petugas" });
  }
};
app.get("/api/petugas", handleGetPetugas);
app.get("/api/master/petugas", handleGetPetugas);

app.post("/api/petugas", (req, res) => {
  try {
    const { id_petugas, id_unit, id_jabatan, id_gaji, nip, nama, tgl_masuk, is_active } = req.body;
    if (!nip || !nama) return res.status(400).json({ success: false, message: "NIP dan Nama Petugas wajib diisi" });
    const newId = Number(id_petugas) || (masterPetugas.length > 0 ? Math.max(...masterPetugas.map(x => x.id_petugas)) + 1 : 1);
    const newItem = {
      id_petugas: newId,
      id_unit: Number(id_unit) || 1,
      id_jabatan: id_jabatan ? Number(id_jabatan) : null,
      id_gaji: Number(id_gaji) || 1,
      nip: String(nip),
      nama: String(nama),
      tgl_masuk: tgl_masuk || new Date().toISOString().split("T")[0],
      is_active: is_active === "N" ? "N" : "Y"
    };
    masterPetugas.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Petugas berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Petugas" });
  }
});

app.put("/api/petugas/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterPetugas.findIndex(x => x.id_petugas === id || x.nip === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: "Petugas tidak ditemukan" });
    masterPetugas[index] = { ...masterPetugas[index], ...req.body };
    res.json({ success: true, data: masterPetugas[index], message: "Petugas berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Petugas" });
  }
});

app.delete("/api/petugas/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterPetugas.length;
    masterPetugas = masterPetugas.filter(x => x.id_petugas !== id && x.nip !== req.params.id);
    if (masterPetugas.length === initialLen) return res.status(404).json({ success: false, message: "Petugas tidak ditemukan" });
    res.json({ success: true, message: "Petugas berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Petugas" });
  }
});

// 3. Unit Role (/api/unit-role & /api/master/unit-role) + Authority Check, Approvers, Bulk
const handleGetUnitRole = (req, res) => {
  try {
    const result = handleQuery(masterUnitRole, "id_unit_role", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Unit Role" });
  }
};
app.get("/api/unit-role", handleGetUnitRole);
app.get("/api/master/unit-role", handleGetUnitRole);

// Authority Check Endpoint (/api/unit-role/authority/check)
app.get("/api/unit-role/authority/check", (req, res) => {
  try {
    const { id_user, id_unit, id_role } = req.query;
    const match = masterUnitRole.find(ur => 
      (!id_user || ur.id_user === Number(id_user)) &&
      (!id_unit || ur.id_unit === Number(id_unit)) &&
      (!id_role || ur.id_role === Number(id_role)) &&
      ur.is_active === "Y"
    );
    res.json({
      success: true,
      authorized: !!match,
      data: match || null
    });
  } catch (err) {
    res.status(500).json({ success: false, authorized: false, message: err.message });
  }
});

// Approvers Lookup Endpoint (/api/unit-role/approvers)
app.get("/api/unit-role/approvers", (req, res) => {
  try {
    const { id_unit, id_role } = req.query;
    const approverUnitRoles = masterUnitRole.filter(ur => 
      (!id_unit || ur.id_unit === Number(id_unit)) &&
      (!id_role || ur.id_role === Number(id_role)) &&
      ur.is_active === "Y"
    );
    res.json({ success: true, data: approverUnitRoles, total: approverUnitRoles.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk Unit Role Endpoint (/api/unit-role/bulk)
app.post("/api/unit-role/bulk", (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body.items || [];
    let addedCount = 0;
    items.forEach(item => {
      const newId = (masterUnitRole.length > 0 ? Math.max(...masterUnitRole.map(x => x.id_unit_role)) + 1 : 1);
      masterUnitRole.push({
        id_unit_role: newId,
        id_user: Number(item.id_user) || 1,
        id_unit: Number(item.id_unit) || 1,
        id_role: Number(item.id_role) || 1,
        is_active: item.is_active === "N" ? "N" : "Y"
      });
      addedCount++;
    });
    res.status(201).json({ success: true, count: addedCount, message: `${addedCount} unit role berhasil disimpan secara bulk` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal memproses bulk Unit Role" });
  }
});

app.post("/api/unit-role", (req, res) => {
  try {
    const { id_unit_role, id_user, id_unit, id_role, is_active } = req.body;
    const newId = Number(id_unit_role) || (masterUnitRole.length > 0 ? Math.max(...masterUnitRole.map(x => x.id_unit_role)) + 1 : 1);
    const newItem = {
      id_unit_role: newId,
      id_user: Number(id_user) || 1,
      id_unit: Number(id_unit) || 1,
      id_role: Number(id_role) || 1,
      is_active: is_active === "N" ? "N" : "Y"
    };
    masterUnitRole.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Unit Role berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Unit Role" });
  }
});

app.put("/api/unit-role/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterUnitRole.findIndex(x => x.id_unit_role === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Unit Role tidak ditemukan" });
    masterUnitRole[index] = { ...masterUnitRole[index], ...req.body };
    res.json({ success: true, data: masterUnitRole[index], message: "Unit Role berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Unit Role" });
  }
});

app.delete("/api/unit-role/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterUnitRole.length;
    masterUnitRole = masterUnitRole.filter(x => x.id_unit_role !== id);
    if (masterUnitRole.length === initialLen) return res.status(404).json({ success: false, message: "Unit Role tidak ditemukan" });
    res.json({ success: true, message: "Unit Role berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Unit Role" });
  }
});

// 4. Module (/api/modules & /api/master/modules)
const handleGetModule = (req, res) => {
  try {
    const result = handleQuery(masterModule, "id_module", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Module" });
  }
};
app.get("/api/modules", handleGetModule);
app.get("/api/master/modules", handleGetModule);

app.post("/api/modules", (req, res) => {
  try {
    const { id_module, kode_module, nama_module, deskripsi, is_active } = req.body;
    if (!kode_module || !nama_module) return res.status(400).json({ success: false, message: "kode_module dan nama_module wajib diisi" });
    const newId = Number(id_module) || (masterModule.length > 0 ? Math.max(...masterModule.map(x => x.id_module)) + 1 : 1);
    const newItem = {
      id_module: newId,
      kode_module: String(kode_module),
      nama_module: String(nama_module),
      deskripsi: deskripsi || "",
      is_active: is_active === "N" ? "N" : "Y"
    };
    masterModule.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Module berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Module" });
  }
});

app.put("/api/modules/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterModule.findIndex(x => x.id_module === id || x.kode_module === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: "Module tidak ditemukan" });
    masterModule[index] = { ...masterModule[index], ...req.body };
    res.json({ success: true, data: masterModule[index], message: "Module berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Module" });
  }
});

app.delete("/api/modules/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterModule.length;
    masterModule = masterModule.filter(x => x.id_module !== id && x.kode_module !== req.params.id);
    if (masterModule.length === initialLen) return res.status(404).json({ success: false, message: "Module tidak ditemukan" });
    res.json({ success: true, message: "Module berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Module" });
  }
});

// 5. Access Module (/api/access-modules & /api/master/access-modules)
const handleGetAccessModule = (req, res) => {
  try {
    const result = handleQuery(masterAccessModule, "id_access", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Access Module" });
  }
};
app.get("/api/access-modules", handleGetAccessModule);
app.get("/api/master/access-modules", handleGetAccessModule);

app.post("/api/access-modules", (req, res) => {
  try {
    const { id_access, id_role, id_module, can_create, can_read, can_update, can_delete, can_approve } = req.body;
    const newId = Number(id_access) || (masterAccessModule.length > 0 ? Math.max(...masterAccessModule.map(x => x.id_access)) + 1 : 1);
    const newItem = {
      id_access: newId,
      id_role: Number(id_role) || 1,
      id_module: Number(id_module) || 1,
      can_create: can_create === "Y" ? "Y" : "N",
      can_read: can_read === "N" ? "N" : "Y",
      can_update: can_update === "Y" ? "Y" : "N",
      can_delete: can_delete === "Y" ? "Y" : "N",
      can_approve: can_approve === "Y" ? "Y" : "N"
    };
    masterAccessModule.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Access Module berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Access Module" });
  }
});

app.put("/api/access-modules/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterAccessModule.findIndex(x => x.id_access === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Access Module tidak ditemukan" });
    masterAccessModule[index] = { ...masterAccessModule[index], ...req.body };
    res.json({ success: true, data: masterAccessModule[index], message: "Access Module berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Access Module" });
  }
});

app.delete("/api/access-modules/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterAccessModule.length;
    masterAccessModule = masterAccessModule.filter(x => x.id_access !== id);
    if (masterAccessModule.length === initialLen) return res.status(404).json({ success: false, message: "Access Module tidak ditemukan" });
    res.json({ success: true, message: "Access Module berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Access Module" });
  }
});

// REST API 5: Master Users / Pegawai (/api/users & /api/master/users)
let masterUsers = [
  { id_user: 1, id: "usr-0", id_pegawai: 1, id_petugas: null, id_role: 1, username: "superadmin", nip: "SA-001", name: "Super Admin System", email: "superadmin@pln.co.id", role: "superadmin", kode_role: "SA", jabatan: "Administrator System", unitUpt: "UPT Semarang", unitUltg: "ULTG Semarang", garduInduk: "GI Krapyak", tglLahir: "1988-01-01", tanggalMasuk: "2020-01-01", gajiPokok: 10000000, is_active: "Y" },
  { id_user: 2, id: "usr-1", id_pegawai: 2, id_petugas: 1, id_role: 2, username: "maker", nip: "8912345Z", name: "Budi Santoso (Maker)", email: "budi.santoso@pln.co.id", role: "maker", kode_role: "MAKER", jabatan: "Teknisi Pemeliharaan GI", unitUpt: "UPT Semarang", unitUltg: "ULTG Semarang", garduInduk: "GI Krapyak", tglLahir: "1998-03-15", tanggalMasuk: "2022-03-15", gajiPokok: 5500000, is_active: "Y" },
  { id_user: 3, id: "usr-2", id_pegawai: 3, id_petugas: 2, id_role: 3, username: "checker", nip: "8534567X", name: "Ahmad Dani (Checker)", email: "ahmad.dani@pln.co.id", role: "checker", kode_role: "CHECKER", jabatan: "Team Leader (TL) PLN Pemeliharaan GI", unitUpt: "UPT Semarang", unitUltg: "ULTG Semarang", garduInduk: "GI Krapyak", tglLahir: "1993-01-10", tanggalMasuk: "2018-01-10", gajiPokok: 8500000, is_active: "Y" },
  { id_user: 4, id: "usr-3", id_pegawai: 4, id_petugas: null, id_role: 4, username: "approval1", nip: "7823411V", name: "Ir. Bambang Suto (Approval 1)", email: "bambang.suto@pln.co.id", role: "approved1", kode_role: "APPROVAL_1", jabatan: "Manager (MAN) UPT PLN JATENG DIY", unitUpt: "UPT Semarang", unitUltg: "ULTG Semarang", garduInduk: "GI Krapyak", tglLahir: "1985-02-14", tanggalMasuk: "2010-02-14", gajiPokok: 18000000, is_active: "Y" },
  { id_user: 5, id: "usr-4", id_pegawai: 5, id_petugas: null, id_role: 5, username: "approval2", nip: "9112345W", name: "Andi Prasetyo (Approval 2)", email: "andi.prasetyo@pln-es.co.id", role: "approved2", kode_role: "APPROVAL_2", jabatan: "Team Leader (TL) Electricity Services", unitUpt: "UPT Semarang", unitUltg: "ULTG Salatiga", garduInduk: "GI Ungaran", tglLahir: "1994-11-01", tanggalMasuk: "2019-11-01", gajiPokok: 8000000, is_active: "Y" },
  { id_user: 6, id: "usr-5", id_pegawai: 6, id_petugas: null, id_role: 6, username: "approval3", nip: "8876543A", name: "Hendra Wijaya (Approval 3)", email: "hendra.wijaya@pln-es.co.id", role: "approved3", kode_role: "APPROVAL_3", jabatan: "Assistant Manager (AMN) Electricity Services", unitUpt: "UPT Semarang", unitUltg: "ULTG Semarang", garduInduk: "GI Tuntang", tglLahir: "1991-04-12", tanggalMasuk: "2016-04-12", gajiPokok: 13500000, is_active: "Y" }
];

const handleGetUsers = (req, res) => {
  try {
    const result = handleQuery(masterUsers, "id_user", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data User" });
  }
};
app.get("/api/users", handleGetUsers);
app.get("/api/master/users", handleGetUsers);

app.post("/api/users", (req, res) => {
  try {
    const { nip, name, email, role, jabatan, unitUpt, unitUltg, garduInduk, tglLahir, tanggalMasuk, gajiPokok } = req.body;
    if (!nip || !name || !email) {
      return res.status(400).json({ success: false, message: "Field NIP, Nama, dan Email wajib diisi" });
    }
    const newUser = {
      id: "usr-" + Date.now(),
      nip,
      name,
      email,
      role: role || "maker",
      jabatan: jabatan || "Teknisi Transmisi",
      unitUpt: unitUpt || "UPT Semarang",
      unitUltg: unitUltg || "ULTG Semarang",
      garduInduk: garduInduk || "GI Krapyak",
      tglLahir: tglLahir || "",
      tanggalMasuk: tanggalMasuk || "",
      gajiPokok: Number(gajiPokok) || 0
    };
    masterUsers.unshift(newUser);
    res.status(201).json({ success: true, data: newUser, message: "Data Pegawai berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan data Pegawai" });
  }
});

app.put("/api/users/:id", (req, res) => {
  try {
    const id = req.params.id;
    const index = masterUsers.findIndex(u => u.id === id || u.nip === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Data Pegawai tidak ditemukan" });
    }
    masterUsers[index] = {
      ...masterUsers[index],
      ...req.body
    };
    res.json({ success: true, data: masterUsers[index], message: "Data Pegawai berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal memperbarui data Pegawai" });
  }
});

app.delete("/api/users/:id", (req, res) => {
  try {
    const id = req.params.id;
    const initialLen = masterUsers.length;
    masterUsers = masterUsers.filter(u => u.id !== id && u.nip !== id);
    if (masterUsers.length === initialLen) {
      return res.status(404).json({ success: false, message: "Data Pegawai tidak ditemukan" });
    }
    res.json({ success: true, message: "Data Pegawai berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus data Pegawai" });
  }
});

// REST API OPSI C: WORKFLOW STATUS & TRANSAKSI PENGAJUAN

// C1. Master Status (/api/status & /api/master/status)
const handleGetStatus = (req, res) => {
  try {
    const result = handleQuery(masterStatus, "id_status", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Master Status" });
  }
};
app.get("/api/status", handleGetStatus);
app.get("/api/master/status", handleGetStatus);

const handlePostStatus = (req, res) => {
  try {
    const { id_status, kode_status, nama_status, deskripsi, is_active } = req.body;
    if (!kode_status || !nama_status) {
      return res.status(400).json({ success: false, message: "kode_status dan nama_status wajib diisi" });
    }
    const newId = Number(id_status) || (masterStatus.length > 0 ? Math.max(...masterStatus.map(x => x.id_status)) + 1 : 1);
    const newItem = {
      id_status: newId,
      kode_status: String(kode_status),
      nama_status: String(nama_status),
      deskripsi: deskripsi || "",
      is_active: is_active === "N" ? "N" : "Y"
    };
    masterStatus.push(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Master Status berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Master Status" });
  }
};
app.post("/api/status", handlePostStatus);
app.post("/api/master/status", handlePostStatus);

const handlePutStatus = (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = masterStatus.findIndex(x => x.id_status === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Status tidak ditemukan" });
    masterStatus[index] = { ...masterStatus[index], ...req.body };
    res.json({ success: true, data: masterStatus[index], message: "Status berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Status" });
  }
};
app.put("/api/status/:id", handlePutStatus);
app.put("/api/master/status/:id", handlePutStatus);

const handleDeleteStatus = (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = masterStatus.length;
    masterStatus = masterStatus.filter(x => x.id_status !== id);
    if (masterStatus.length === initialLen) return res.status(404).json({ success: false, message: "Status tidak ditemukan" });
    res.json({ success: true, message: "Status berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Status" });
  }
};
app.delete("/api/status/:id", handleDeleteStatus);
app.delete("/api/master/status/:id", handleDeleteStatus);

// C2. Transaksi Lembur (/api/lembur & /api/transaksi/lembur)
const handleGetLemburTrans = (req, res) => {
  try {
    const result = handleQuery(transaksiLembur, "id_lembur", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Lembur" });
  }
};
app.get("/api/lembur", handleGetLemburTrans);
app.get("/api/transaksi/lembur", handleGetLemburTrans);

const handlePostLemburTrans = (req, res) => {
  try {
    const { id_lembur, id_pegawai, id_app, tgl_lembur, jam_mulai, jam_selesai, total_jam, nominal_biaya, pekerjaan, status, id_jenis } = req.body;
    const newId = Number(id_lembur) || (transaksiLembur.length > 0 ? Math.max(...transaksiLembur.map(x => x.id_lembur)) + 1 : 1);
    const newItem = {
      id_lembur: newId,
      id_lembur_trans: newId,
      id_pegawai: Number(id_pegawai) || 1,
      id_app: Number(id_app) || 1,
      tgl_lembur: tgl_lembur || new Date().toISOString().split("T")[0],
      jam_mulai: jam_mulai || "17:00",
      jam_selesai: jam_selesai || "21:00",
      total_jam: Number(total_jam) || 4,
      nominal_biaya: Number(nominal_biaya) || 250000,
      pekerjaan: pekerjaan || "Pekerjaan lembur operasional PLN",
      status: status || "PENDING",
      id_jenis: id_jenis || "JNS-001"
    };
    transaksiLembur.unshift(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Pengajuan Lembur berhasil dibuat" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal membuat Pengajuan Lembur" });
  }
};
app.post("/api/lembur", handlePostLemburTrans);
app.post("/api/transaksi/lembur", handlePostLemburTrans);

const handlePutLemburTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = transaksiLembur.findIndex(x => x.id_lembur === id || x.id_lembur_trans === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Data Lembur tidak ditemukan" });
    transaksiLembur[index] = { ...transaksiLembur[index], ...req.body };
    res.json({ success: true, data: transaksiLembur[index], message: "Data Lembur berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Data Lembur" });
  }
};
app.put("/api/lembur/:id", handlePutLemburTrans);
app.put("/api/transaksi/lembur/:id", handlePutLemburTrans);

const handleDeleteLemburTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = transaksiLembur.length;
    transaksiLembur = transaksiLembur.filter(x => x.id_lembur !== id && x.id_lembur_trans !== id);
    if (transaksiLembur.length === initialLen) return res.status(404).json({ success: false, message: "Data Lembur tidak ditemukan" });
    res.json({ success: true, message: "Data Lembur berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Data Lembur" });
  }
};
app.delete("/api/lembur/:id", handleDeleteLemburTrans);
app.delete("/api/transaksi/lembur/:id", handleDeleteLemburTrans);

// C3. Transaksi Cuti (/api/cuti & /api/transaksi/cuti)
const handleGetCutiTrans = (req, res) => {
  try {
    const result = handleQuery(transaksiCuti, "id_cuti", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Cuti" });
  }
};
app.get("/api/cuti", handleGetCutiTrans);
app.get("/api/transaksi/cuti", handleGetCutiTrans);

const handlePostCutiTrans = (req, res) => {
  try {
    const { id_cuti, id_pegawai, id_app, jenis_cuti, tgl_mulai, tgl_selesai, jumlah_hari, alamat_cuti, telepon_darurat, status } = req.body;
    const newId = Number(id_cuti) || (transaksiCuti.length > 0 ? Math.max(...transaksiCuti.map(x => x.id_cuti)) + 1 : 1);
    const newItem = {
      id_cuti: newId,
      id_pegawai: Number(id_pegawai) || 1,
      id_app: Number(id_app) || 1,
      jenis_cuti: jenis_cuti || "Tahunan",
      tgl_mulai: tgl_mulai || new Date().toISOString().split("T")[0],
      tgl_selesai: tgl_selesai || new Date().toISOString().split("T")[0],
      jumlah_hari: Number(jumlah_hari) || 1,
      alamat_cuti: alamat_cuti || "-",
      telepon_darurat: telepon_darurat || "-",
      status: status || "PENDING"
    };
    transaksiCuti.unshift(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Pengajuan Cuti berhasil disimpan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Pengajuan Cuti" });
  }
};
app.post("/api/cuti", handlePostCutiTrans);
app.post("/api/transaksi/cuti", handlePostCutiTrans);

const handlePutCutiTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = transaksiCuti.findIndex(x => x.id_cuti === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Data Cuti tidak ditemukan" });
    transaksiCuti[index] = { ...transaksiCuti[index], ...req.body };
    res.json({ success: true, data: transaksiCuti[index], message: "Data Cuti berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Data Cuti" });
  }
};
app.put("/api/cuti/:id", handlePutCutiTrans);
app.put("/api/transaksi/cuti/:id", handlePutCutiTrans);

const handleDeleteCutiTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = transaksiCuti.length;
    transaksiCuti = transaksiCuti.filter(x => x.id_cuti !== id);
    if (transaksiCuti.length === initialLen) return res.status(404).json({ success: false, message: "Data Cuti tidak ditemukan" });
    res.json({ success: true, message: "Data Cuti berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Data Cuti" });
  }
};
app.delete("/api/cuti/:id", handleDeleteCutiTrans);
app.delete("/api/transaksi/cuti/:id", handleDeleteCutiTrans);

// C4. Transaksi Log Cuti (/api/log-cuti & /api/transaksi/log-cuti)
const handleGetLogCutiTrans = (req, res) => {
  try {
    const result = handleQuery(transaksiLogCuti, "id_log_cuti", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Log Cuti" });
  }
};
app.get("/api/log-cuti", handleGetLogCutiTrans);
app.get("/api/transaksi/log-cuti", handleGetLogCutiTrans);

const handlePostLogCutiTrans = (req, res) => {
  try {
    const { id_log_cuti, id_pegawai, tahun, jatah_cuti, terpakai, sisa_cuti, keterangan } = req.body;
    const newId = Number(id_log_cuti) || (transaksiLogCuti.length > 0 ? Math.max(...transaksiLogCuti.map(x => x.id_log_cuti)) + 1 : 1);
    const newItem = {
      id_log_cuti: newId,
      id_pegawai: Number(id_pegawai) || 1,
      tahun: Number(tahun) || 2026,
      jatah_cuti: Number(jatah_cuti) || 12,
      terpakai: Number(terpakai) || 0,
      sisa_cuti: Number(sisa_cuti) || 12,
      keterangan: keterangan || "Hak cuti tahunan"
    };
    transaksiLogCuti.unshift(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Log Cuti berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Log Cuti" });
  }
};
app.post("/api/log-cuti", handlePostLogCutiTrans);
app.post("/api/transaksi/log-cuti", handlePostLogCutiTrans);

const handlePutLogCutiTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = transaksiLogCuti.findIndex(x => x.id_log_cuti === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Log Cuti tidak ditemukan" });
    transaksiLogCuti[index] = { ...transaksiLogCuti[index], ...req.body };
    res.json({ success: true, data: transaksiLogCuti[index], message: "Log Cuti berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Log Cuti" });
  }
};
app.put("/api/log-cuti/:id", handlePutLogCutiTrans);
app.put("/api/transaksi/log-cuti/:id", handlePutLogCutiTrans);

const handleDeleteLogCutiTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = transaksiLogCuti.length;
    transaksiLogCuti = transaksiLogCuti.filter(x => x.id_log_cuti !== id);
    if (transaksiLogCuti.length === initialLen) return res.status(404).json({ success: false, message: "Log Cuti tidak ditemukan" });
    res.json({ success: true, message: "Log Cuti berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Log Cuti" });
  }
};
app.delete("/api/log-cuti/:id", handleDeleteLogCutiTrans);
app.delete("/api/transaksi/log-cuti/:id", handleDeleteLogCutiTrans);

// C5. Transaksi SPPD (/api/sppd & /api/transaksi/sppd)
const handleGetSppdTrans = (req, res) => {
  try {
    const result = handleQuery(transaksiSppd, "id_sppd", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data SPPD" });
  }
};
app.get("/api/sppd", handleGetSppdTrans);
app.get("/api/transaksi/sppd", handleGetSppdTrans);

const handlePostSppdTrans = (req, res) => {
  try {
    const { id_sppd, id_pegawai, id_app, no_sppd, kota_tujuan, maksud_dinas, tgl_berangkat, tgl_kembali, lama_dinas, status } = req.body;
    const newId = Number(id_sppd) || (transaksiSppd.length > 0 ? Math.max(...transaksiSppd.map(x => x.id_sppd)) + 1 : 1);
    const newItem = {
      id_sppd: newId,
      id_pegawai: Number(id_pegawai) || 1,
      id_app: Number(id_app) || 1,
      no_sppd: no_sppd || `SPPD/2026/07/${String(newId).padStart(3, "0")}`,
      kota_tujuan: kota_tujuan || "Semarang",
      maksud_dinas: maksud_dinas || "Tugas Perjalanan Dinas",
      tgl_berangkat: tgl_berangkat || new Date().toISOString().split("T")[0],
      tgl_kembali: tgl_kembali || new Date().toISOString().split("T")[0],
      lama_dinas: Number(lama_dinas) || 1,
      status: status || "PENDING"
    };
    transaksiSppd.unshift(newItem);
    res.status(201).json({ success: true, data: newItem, message: "SPPD berhasil dibuat" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan SPPD" });
  }
};
app.post("/api/sppd", handlePostSppdTrans);
app.post("/api/transaksi/sppd", handlePostSppdTrans);

const handlePutSppdTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = transaksiSppd.findIndex(x => x.id_sppd === id);
    if (index === -1) return res.status(404).json({ success: false, message: "SPPD tidak ditemukan" });
    transaksiSppd[index] = { ...transaksiSppd[index], ...req.body };
    res.json({ success: true, data: transaksiSppd[index], message: "SPPD berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate SPPD" });
  }
};
app.put("/api/sppd/:id", handlePutSppdTrans);
app.put("/api/transaksi/sppd/:id", handlePutSppdTrans);

const handleDeleteSppdTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = transaksiSppd.length;
    transaksiSppd = transaksiSppd.filter(x => x.id_sppd !== id);
    if (transaksiSppd.length === initialLen) return res.status(404).json({ success: false, message: "SPPD tidak ditemukan" });
    res.json({ success: true, message: "SPPD berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus SPPD" });
  }
};
app.delete("/api/sppd/:id", handleDeleteSppdTrans);
app.delete("/api/transaksi/sppd/:id", handleDeleteSppdTrans);

// C6. Transaksi Ijin (/api/ijin & /api/transaksi/ijin)
const handleGetIjinTrans = (req, res) => {
  try {
    const result = handleQuery(transaksiIjin, "id_ijin", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Ijin" });
  }
};
app.get("/api/ijin", handleGetIjinTrans);
app.get("/api/transaksi/ijin", handleGetIjinTrans);

const handlePostIjinTrans = (req, res) => {
  try {
    const { id_ijin, id_pegawai, id_app, alasan_ijin, tgl_mulai, tgl_selesai, jumlah_hari, keterangan, status } = req.body;
    const newId = Number(id_ijin) || (transaksiIjin.length > 0 ? Math.max(...transaksiIjin.map(x => x.id_ijin)) + 1 : 1);
    const newItem = {
      id_ijin: newId,
      id_pegawai: Number(id_pegawai) || 1,
      id_app: Number(id_app) || 1,
      alasan_ijin: alasan_ijin || "Ijin Kepentingan Pribadi",
      tgl_mulai: tgl_mulai || new Date().toISOString().split("T")[0],
      tgl_selesai: tgl_selesai || new Date().toISOString().split("T")[0],
      jumlah_hari: Number(jumlah_hari) || 1,
      keterangan: keterangan || "-",
      status: status || "PENDING"
    };
    transaksiIjin.unshift(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Pengajuan Ijin berhasil disimpan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Pengajuan Ijin" });
  }
};
app.post("/api/ijin", handlePostIjinTrans);
app.post("/api/transaksi/ijin", handlePostIjinTrans);

const handlePutIjinTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = transaksiIjin.findIndex(x => x.id_ijin === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Data Ijin tidak ditemukan" });
    transaksiIjin[index] = { ...transaksiIjin[index], ...req.body };
    res.json({ success: true, data: transaksiIjin[index], message: "Data Ijin berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Data Ijin" });
  }
};
app.put("/api/ijin/:id", handlePutIjinTrans);
app.put("/api/transaksi/ijin/:id", handlePutIjinTrans);

const handleDeleteIjinTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = transaksiIjin.length;
    transaksiIjin = transaksiIjin.filter(x => x.id_ijin !== id);
    if (transaksiIjin.length === initialLen) return res.status(404).json({ success: false, message: "Data Ijin tidak ditemukan" });
    res.json({ success: true, message: "Data Ijin berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Data Ijin" });
  }
};
app.delete("/api/ijin/:id", handleDeleteIjinTrans);
app.delete("/api/transaksi/ijin/:id", handleDeleteIjinTrans);

// C7. Transaksi Sakit (/api/sakit & /api/transaksi/sakit)
const handleGetSakitTrans = (req, res) => {
  try {
    const result = handleQuery(transaksiSakit, "id_sakit", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Sakit" });
  }
};
app.get("/api/sakit", handleGetSakitTrans);
app.get("/api/transaksi/sakit", handleGetSakitTrans);

const handlePostSakitTrans = (req, res) => {
  try {
    const { id_sakit, id_pegawai, id_app, diagnosa, tgl_mulai, tgl_selesai, jumlah_hari, file_surat_dokter, status } = req.body;
    const newId = Number(id_sakit) || (transaksiSakit.length > 0 ? Math.max(...transaksiSakit.map(x => x.id_sakit)) + 1 : 1);
    const newItem = {
      id_sakit: newId,
      id_pegawai: Number(id_pegawai) || 1,
      id_app: Number(id_app) || 1,
      diagnosa: diagnosa || "Sakit Biasa / Demam",
      tgl_mulai: tgl_mulai || new Date().toISOString().split("T")[0],
      tgl_selesai: tgl_selesai || new Date().toISOString().split("T")[0],
      jumlah_hari: Number(jumlah_hari) || 1,
      file_surat_dokter: file_surat_dokter || "",
      status: status || "APPROVED"
    };
    transaksiSakit.unshift(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Laporan Sakit berhasil disimpan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Laporan Sakit" });
  }
};
app.post("/api/sakit", handlePostSakitTrans);
app.post("/api/transaksi/sakit", handlePostSakitTrans);

const handlePutSakitTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = transaksiSakit.findIndex(x => x.id_sakit === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Data Sakit tidak ditemukan" });
    transaksiSakit[index] = { ...transaksiSakit[index], ...req.body };
    res.json({ success: true, data: transaksiSakit[index], message: "Data Sakit berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Data Sakit" });
  }
};
app.put("/api/sakit/:id", handlePutSakitTrans);
app.put("/api/transaksi/sakit/:id", handlePutSakitTrans);

const handleDeleteSakitTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = transaksiSakit.length;
    transaksiSakit = transaksiSakit.filter(x => x.id_sakit !== id);
    if (transaksiSakit.length === initialLen) return res.status(404).json({ success: false, message: "Data Sakit tidak ditemukan" });
    res.json({ success: true, message: "Data Sakit berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Data Sakit" });
  }
};
app.delete("/api/sakit/:id", handleDeleteSakitTrans);
app.delete("/api/transaksi/sakit/:id", handleDeleteSakitTrans);

// C8. Transaksi Mutasi (/api/mutasi & /api/transaksi/mutasi)
const handleGetMutasiTrans = (req, res) => {
  try {
    const result = handleQuery(transaksiMutasi, "id_mutasi", req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Mutasi" });
  }
};
app.get("/api/mutasi", handleGetMutasiTrans);
app.get("/api/transaksi/mutasi", handleGetMutasiTrans);

const handlePostMutasiTrans = (req, res) => {
  try {
    const { id_mutasi, id_pegawai, start_mutasi, id_unit_upt, id_unit_ultg, id_unit_gi, status } = req.body;
    const newId = Number(id_mutasi) || (transaksiMutasi.length > 0 ? Math.max(...transaksiMutasi.map(x => x.id_mutasi)) + 1 : 1);
    const newItem = {
      id_mutasi: newId,
      id_pegawai: Number(id_pegawai) || 1,
      start_mutasi: start_mutasi || new Date().toISOString().split("T")[0],
      id_unit_upt: Number(id_unit_upt) || 1,
      id_unit_ultg: Number(id_unit_ultg) || 1,
      id_unit_gi: Number(id_unit_gi) || 1,
      status: status || "APPROVED"
    };
    transaksiMutasi.unshift(newItem);
    res.status(201).json({ success: true, data: newItem, message: "Transaksi Mutasi berhasil disimpan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menyimpan Transaksi Mutasi" });
  }
};
app.post("/api/mutasi", handlePostMutasiTrans);
app.post("/api/transaksi/mutasi", handlePostMutasiTrans);

const handlePutMutasiTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = transaksiMutasi.findIndex(x => x.id_mutasi === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Transaksi Mutasi tidak ditemukan" });
    transaksiMutasi[index] = { ...transaksiMutasi[index], ...req.body };
    res.json({ success: true, data: transaksiMutasi[index], message: "Transaksi Mutasi berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengupdate Transaksi Mutasi" });
  }
};
app.put("/api/mutasi/:id", handlePutMutasiTrans);
app.put("/api/transaksi/mutasi/:id", handlePutMutasiTrans);

const handleDeleteMutasiTrans = (req, res) => {
  try {
    const id = Number(req.params.id);
    const initialLen = transaksiMutasi.length;
    transaksiMutasi = transaksiMutasi.filter(x => x.id_mutasi !== id);
    if (transaksiMutasi.length === initialLen) return res.status(404).json({ success: false, message: "Transaksi Mutasi tidak ditemukan" });
    res.json({ success: true, message: "Transaksi Mutasi berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal menghapus Transaksi Mutasi" });
  }
};
app.delete("/api/mutasi/:id", handleDeleteMutasiTrans);
app.delete("/api/transaksi/mutasi/:id", handleDeleteMutasiTrans);

// REST API for List Dokumen & Arsip Approved (/api/documents)
app.get("/api/documents", (req, res) => {
  try {
    const {
      project_id,
      nama_project,
      unit_upt,
      unit_ultg,
      gardu_induk,
      unit_id,
      start_date,
      end_date,
      category,
      type,
      search,
      status
    } = req.query;

    const targetStatus = (status || "APPROVED").toUpperCase();
    let docs = [];

    // 1. Lembur
    transaksiLembur
      .filter((t) => !targetStatus || (t.status && t.status.toUpperCase() === targetStatus))
      .forEach((t) => {
        const peg = masterPegawai.find((p) => p.id_pegawai === t.id_pegawai) || {};
        const unit = masterUnit.find((u) => u.id_unit === peg.id_unit) || {};
        docs.push({
          id: `doc-lembur-${t.id_lembur}`,
          docNo: `PLN/UP2/LEMBUR/2026/${String(t.id_lembur).padStart(3, '0')}`,
          type: "lembur",
          categoryLabel: "Formulir Perintah Lembur",
          employeeName: peg.nama || "Pegawai",
          employeeNip: peg.nip || "",
          employeeJabatan: "Teknisi Pemeliharaan GI",
          unitUpt: unit.upt || "UPT Semarang",
          unitUltg: unit.ultg || "ULTG Semarang",
          garduInduk: unit.gardu_induk || "GI Krapyak",
          tanggalPengajuan: t.tgl_lembur,
          tanggalLembur: t.tgl_lembur,
          jamMulai: t.jam_mulai,
          jamSelesai: t.jam_selesai,
          durasiJam: t.total_jam,
          kegiatanDetail: t.pekerjaan,
          status: t.status || "APPROVED",
          id_project: 1,
          nama_project: "SUTT 150kV JATENG DIY"
        });
      });

    // 2. Cuti
    transaksiCuti
      .filter((t) => !targetStatus || (t.status && t.status.toUpperCase() === targetStatus))
      .forEach((t) => {
        const peg = masterPegawai.find((p) => p.id_pegawai === t.id_pegawai) || {};
        const unit = masterUnit.find((u) => u.id_unit === peg.id_unit) || {};
        docs.push({
          id: `doc-cuti-${t.id_cuti}`,
          docNo: `PLN/UP2/CUTI/2026/${String(t.id_cuti).padStart(3, '0')}`,
          type: "cuti",
          categoryLabel: "Formulir Cuti Tahunan",
          employeeName: peg.nama || "Pegawai",
          employeeNip: peg.nip || "",
          employeeJabatan: "Teknisi Pemeliharaan GI",
          unitUpt: unit.upt || "UPT Semarang",
          unitUltg: unit.ultg || "ULTG Semarang",
          garduInduk: unit.gardu_induk || "GI Krapyak",
          tanggalPengajuan: t.tgl_mulai,
          tanggalMulai: t.tgl_mulai,
          tanggalSelesai: t.tgl_selesai,
          jumlahHari: t.jumlah_hari,
          cutiType: t.jenis_cuti,
          status: t.status || "APPROVED",
          id_project: 1,
          nama_project: "SUTT 150kV JATENG DIY"
        });
      });

    // 3. SPPD
    transaksiSppd
      .filter((t) => !targetStatus || (t.status && t.status.toUpperCase() === targetStatus))
      .forEach((t) => {
        const peg = masterPegawai.find((p) => p.id_pegawai === t.id_pegawai) || {};
        const unit = masterUnit.find((u) => u.id_unit === peg.id_unit) || {};
        docs.push({
          id: `doc-sppd-${t.id_sppd}`,
          docNo: t.no_sppd || `PLN/UP2/SPPD/2026/${String(t.id_sppd).padStart(3, '0')}`,
          type: "sppd",
          categoryLabel: "Formulir SPPD Perjalanan Dinas",
          employeeName: peg.nama || "Pegawai",
          employeeNip: peg.nip || "",
          employeeJabatan: "Teknisi Pemeliharaan GI",
          unitUpt: unit.upt || "UPT Semarang",
          unitUltg: unit.ultg || "ULTG Semarang",
          garduInduk: unit.gardu_induk || "GI Krapyak",
          tanggalPengajuan: t.tgl_berangkat,
          tanggalBerangkat: t.tgl_berangkat,
          tanggalKembali: t.tgl_kembali,
          kotaTujuan: t.kota_tujuan,
          durasiHari: t.lama_dinas,
          status: t.status || "APPROVED",
          id_project: 2,
          nama_project: "Pemeliharaan GI Terpadu"
        });
      });

    // 4. Ijin
    transaksiIjin
      .filter((t) => !targetStatus || (t.status && t.status.toUpperCase() === targetStatus))
      .forEach((t) => {
        const peg = masterPegawai.find((p) => p.id_pegawai === t.id_pegawai) || {};
        const unit = masterUnit.find((u) => u.id_unit === peg.id_unit) || {};
        docs.push({
          id: `doc-ijin-${t.id_ijin}`,
          docNo: `PLN/UP2/IJIN/2026/${String(t.id_ijin).padStart(3, '0')}`,
          type: "ijin",
          categoryLabel: "Formulir Ijin Kerja",
          employeeName: peg.nama || "Pegawai",
          employeeNip: peg.nip || "",
          employeeJabatan: "Teknisi Pemeliharaan GI",
          unitUpt: unit.upt || "UPT Purwokerto",
          unitUltg: unit.ultg || "ULTG Purwokerto",
          garduInduk: unit.gardu_induk || "GI Kalisari",
          tanggalPengajuan: t.tgl_mulai,
          tanggalMulai: t.tgl_mulai,
          tanggalSelesai: t.tgl_selesai,
          jumlahHari: t.jumlah_hari,
          keterangan: t.keterangan,
          status: t.status || "APPROVED",
          id_project: 1,
          nama_project: "SUTT 150kV JATENG DIY"
        });
      });

    // 5. Sakit
    transaksiSakit
      .filter((t) => !targetStatus || (t.status && t.status.toUpperCase() === targetStatus))
      .forEach((t) => {
        const peg = masterPegawai.find((p) => p.id_pegawai === t.id_pegawai) || {};
        const unit = masterUnit.find((u) => u.id_unit === peg.id_unit) || {};
        docs.push({
          id: `doc-sakit-${t.id_sakit}`,
          docNo: `PLN/UP2/SAKIT/2026/${String(t.id_sakit).padStart(3, '0')}`,
          type: "sakit",
          categoryLabel: "Formulir Laporan Sakit",
          employeeName: peg.nama || "Pegawai",
          employeeNip: peg.nip || "",
          employeeJabatan: "Teknisi Pemeliharaan GI",
          unitUpt: unit.upt || "UPT Semarang",
          unitUltg: unit.ultg || "ULTG Semarang",
          garduInduk: unit.gardu_induk || "GI Krapyak",
          tanggalPengajuan: t.tgl_mulai,
          tanggalMulai: t.tgl_mulai,
          tanggalSelesai: t.tgl_selesai,
          jumlahHari: t.jumlah_hari,
          diagnosaSingkat: t.diagnosa,
          status: t.status || "APPROVED",
          id_project: 1,
          nama_project: "SUTT 150kV JATENG DIY"
        });
      });

    let filtered = docs;

    if (project_id) {
      filtered = filtered.filter((d) => String(d.id_project) === String(project_id));
    }
    if (nama_project && nama_project !== "Semua Project") {
      filtered = filtered.filter((d) => d.nama_project === nama_project);
    }

    if (unit_upt && unit_upt !== "Semua UPT") {
      filtered = filtered.filter((d) => d.unitUpt === unit_upt);
    }
    if (unit_ultg && unit_ultg !== "Semua ULTG") {
      filtered = filtered.filter((d) => d.unitUltg === unit_ultg);
    }
    if (gardu_induk && gardu_induk !== "Semua GI") {
      filtered = filtered.filter((d) => d.garduInduk === gardu_induk);
    }

    const targetType = category || type;
    if (targetType && targetType !== "ALL") {
      filtered = filtered.filter((d) => d.type === targetType);
    }

    if (start_date) {
      filtered = filtered.filter((d) => {
        const dt = d.tanggalPengajuan || d.tanggalMulai || d.tanggalLembur || d.tanggalBerangkat || "";
        return dt >= start_date;
      });
    }
    if (end_date) {
      filtered = filtered.filter((d) => {
        const dt = d.tanggalPengajuan || d.tanggalMulai || d.tanggalLembur || d.tanggalBerangkat || "";
        return dt <= end_date;
      });
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter((d) =>
        (d.docNo && d.docNo.toLowerCase().includes(q)) ||
        (d.employeeName && d.employeeName.toLowerCase().includes(q)) ||
        (d.employeeNip && d.employeeNip.toLowerCase().includes(q)) ||
        (d.type && d.type.toLowerCase().includes(q)) ||
        (d.unitUpt && d.unitUpt.toLowerCase().includes(q)) ||
        (d.unitUltg && d.unitUltg.toLowerCase().includes(q)) ||
        (d.garduInduk && d.garduInduk.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data dokumen" });
  }
});

// REST API for Pareto Overtime Analysis (80/20 Rule Analysis) (/api/dashboard/pareto-lembur)
app.get("/api/dashboard/pareto-lembur", (req, res) => {
  try {
    const {
      group_by = "pekerjaan", // "pekerjaan" | "unit" | "pegawai" | "kategori"
      start_date,
      end_date,
      unit_upt,
      unit_ultg,
      gardu_induk,
      status
    } = req.query;

    const targetStatus = status ? status.toUpperCase() : null;

    let categoryMap = {};

    transaksiLembur.forEach((t) => {
      if (targetStatus && targetStatus !== "ALL") {
        if (!t.status || t.status.toUpperCase() !== targetStatus) return;
      }
      if (start_date && t.tgl_lembur < start_date) return;
      if (end_date && t.tgl_lembur > end_date) return;

      const peg = masterPegawai.find((p) => p.id_pegawai === t.id_pegawai) || {};
      const unit = masterUnit.find((u) => u.id_unit === peg.id_unit) || {};

      if (unit_upt && unit_upt !== "Semua UPT" && (unit.upt || "UPT Semarang") !== unit_upt) return;
      if (unit_ultg && unit_ultg !== "Semua ULTG" && (unit.ultg || "ULTG Semarang") !== unit_ultg) return;
      if (gardu_induk && gardu_induk !== "Semua GI" && (unit.gardu_induk || "GI Krapyak") !== gardu_induk) return;

      let key = "Lainnya";
      if (group_by === "unit") {
        key = unit.ultg || unit.upt || unit.gardu_induk || "Unit Semarang";
      } else if (group_by === "pegawai") {
        key = peg.nama || `Pegawai #${t.id_pegawai}`;
      } else {
        key = t.pekerjaan || "Pekerjaan Pemeliharaan";
      }

      const hours = Number(t.total_jam) || 0;
      const cost = Number(t.nominal_biaya) || hours * 62500;

      if (!categoryMap[key]) {
        categoryMap[key] = { category: key, total_jam: 0, total_biaya: 0, count: 0 };
      }
      categoryMap[key].total_jam += hours;
      categoryMap[key].total_biaya += cost;
      categoryMap[key].count += 1;
    });

    const sortedList = Object.values(categoryMap).sort((a, b) => b.total_jam - a.total_jam);
    const total_overall_hours = sortedList.reduce((acc, curr) => acc + curr.total_jam, 0);
    const total_overall_cost = sortedList.reduce((acc, curr) => acc + curr.total_biaya, 0);

    let runningCumulativeHours = 0;
    const paretoData = sortedList.map((item) => {
      runningCumulativeHours += item.total_jam;
      const contributionPct = total_overall_hours > 0 ? (item.total_jam / total_overall_hours) * 100 : 0;
      const cumulativePct = total_overall_hours > 0 ? (runningCumulativeHours / total_overall_hours) * 100 : 0;

      return {
        category: item.category,
        total_jam: Math.round(item.total_jam * 10) / 10,
        total_biaya: item.total_biaya,
        count: item.count,
        contribution_pct: Math.round(contributionPct * 10) / 10,
        cumulative_pct: Math.min(100, Math.round(cumulativePct * 10) / 10)
      };
    });

    res.json({
      success: true,
      total_overall_hours,
      total_overall_cost,
      data: paretoData
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil data Pareto" });
  }
});

// REST API for Overtime Trend Analytics (/api/dashboard/trend-lembur)
app.get("/api/dashboard/trend-lembur", (req, res) => {
  try {
    const { start_date, end_date, unit_upt, unit_ultg } = req.query;

    const dateMap = {};
    transaksiLembur.forEach((t) => {
      if (start_date && t.tgl_lembur < start_date) return;
      if (end_date && t.tgl_lembur > end_date) return;

      const peg = masterPegawai.find((p) => p.id_pegawai === t.id_pegawai) || {};
      const unit = masterUnit.find((u) => u.id_unit === peg.id_unit) || {};

      if (unit_upt && unit_upt !== "Semua UPT" && (unit.upt || "UPT Semarang") !== unit_upt) return;
      if (unit_ultg && unit_ultg !== "Semua ULTG" && (unit.ultg || "ULTG Semarang") !== unit_ultg) return;

      const dt = t.tgl_lembur || "2026-07-20";
      if (!dateMap[dt]) {
        dateMap[dt] = { date: dt, approved: 0, pending: 0, rejected: 0, total_jam: 0, total_biaya: 0 };
      }

      const hours = Number(t.total_jam) || 0;
      const cost = Number(t.nominal_biaya) || hours * 62500;
      const st = (t.status || "APPROVED").toUpperCase();

      if (st === "APPROVED" || st === "APPROVED_FINAL") dateMap[dt].approved += hours;
      else if (st === "REJECTED") dateMap[dt].rejected += hours;
      else dateMap[dt].pending += hours;

      dateMap[dt].total_jam += hours;
      dateMap[dt].total_biaya += cost;
    });

    const trendData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: trendData
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil Trend Lembur" });
  }
});

// REST API for Cost Overtime Analysis (/api/dashboard/cost-lembur)
app.get("/api/dashboard/cost-lembur", (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const unitCostMap = {};
    transaksiLembur.forEach((t) => {
      if (start_date && t.tgl_lembur < start_date) return;
      if (end_date && t.tgl_lembur > end_date) return;

      const peg = masterPegawai.find((p) => p.id_pegawai === t.id_pegawai) || {};
      const unit = masterUnit.find((u) => u.id_unit === peg.id_unit) || {};
      const unitName = unit.ultg || unit.upt || "UPT Semarang";

      if (!unitCostMap[unitName]) {
        unitCostMap[unitName] = { unit: unitName, total_jam: 0, total_biaya: 0, total_dokumen: 0 };
      }

      const hours = Number(t.total_jam) || 0;
      const cost = Number(t.nominal_biaya) || hours * 62500;

      unitCostMap[unitName].total_jam += hours;
      unitCostMap[unitName].total_biaya += cost;
      unitCostMap[unitName].total_dokumen += 1;
    });

    res.json({
      success: true,
      data: Object.values(unitCostMap)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Gagal mengambil Cost Lembur" });
  }
});

// Dev Utility: Reset hanya tabel transaksi
app.post('/api/dev/reset-transactions', async (req, res) => {
  try {
    transaksiLembur = [];
    transaksiCuti = [];
    transaksiLogCuti = [];
    transaksiSppd = [];
    transaksiIjin = [];
    transaksiSakit = [];
    transaksiMutasi = [];

    res.status(200).json({ success: true, message: 'Data transaksi berhasil dikosongkan. Master Data tetap aman.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
