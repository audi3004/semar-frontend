import { z } from "zod";
import axios from "axios";
import { api } from "./api";
import { AuthService } from "./authService";
import { toast } from "../utils/toast";

export const API_ENDPOINTS = {
  m_role: "/api/roles",
  m_project: "/api/projects",
  m_jabatan: "/api/jabatan",
  m_umk: "/api/umk",
  koef_tmk: "/api/koef-tmk",
  m_gaji: "/api/gaji",
  m_unit: "/api/unit",
  m_pegawai: "/api/pegawai",
  m_petugas: "/api/petugas",
  m_user: "/api/users",
  m_unit_role: "/api/unit-role",
  m_module: "/api/modules",
  m_access_module: "/api/access-modules",
  m_status: "/api/status",
  t_lembur: "/api/lembur",
  t_cuti: "/api/cuti",
  t_log_cuti: "/api/log-cuti",
  t_sppd: "/api/sppd",
  t_ijin: "/api/ijin",
  t_sakit: "/api/sakit",
  t_mutasi: "/api/mutasi",
  m_hari_libur: "/api/hari-libur",
  m_upah_dasar: "/api/master/upah-dasar",
  m_lembur: "/api/master/lembur",
  m_faktor_upah: "/api/koef-tmk"
};

const INITIAL_ROLES = [
  { id_role: 1, kode_role: "ADMIN", nama_role: "Administrator System", level_role: 1, is_super_admin: "Y", is_active: "Y" },
  { id_role: 2, kode_role: "MAKER", nama_role: "Tenaga Kerja / Maker", level_role: 5, is_super_admin: "N", is_active: "Y" },
  { id_role: 3, kode_role: "CHECKER", nama_role: "Pemeriksa / Checker", level_role: 4, is_super_admin: "N", is_active: "Y" },
  { id_role: 4, kode_role: "VERIFIKATOR", nama_role: "Verifikator Lapangan", level_role: 3, is_super_admin: "N", is_active: "Y" },
  { id_role: 5, kode_role: "APPROVER1", nama_role: "Approver 1 (Spv/Manager)", level_role: 2, is_super_admin: "N", is_active: "Y" }
];

const INITIAL_KOEF_TMK = [
  { id_koef_tmk: 1, masa_kerja: "0-2 Tahun", koef: 10, tmk: 1, is_active: "Y" },
  { id_koef_tmk: 2, masa_kerja: "3-4 Tahun", koef: 10, tmk: 2, is_active: "Y" },
  { id_koef_tmk: 3, masa_kerja: "5-6 Tahun", koef: 10, tmk: 3, is_active: "Y" }
];

const INITIAL_HARI_LIBUR = [
  { id_hpl: 1, tgl_libur: "2026-01-01", ket_libur: "Tahun Baru Masehi 2026", tahun_libur: 2026 },
  { id_hpl: 2, tgl_libur: "2026-05-01", ket_libur: "Hari Buruh Internasional", tahun_libur: 2026 },
  { id_hpl: 3, tgl_libur: "2026-08-17", ket_libur: "Hari Kemerdekaan Republik Indonesia", tahun_libur: 2026 },
  { id_hpl: 4, tgl_libur: "2026-12-25", ket_libur: "Hari Raya Natal", tahun_libur: 2026 }
];

const INITIAL_UPAH_DASAR = [
  // 2026
  { id_umk: 101, jenis_wilayah: "Kota", nama_umk: "UMK Kota Semarang 2026", kab_kota: "Kota Semarang", tahun_umk: 2026, nilai_umk: 3450000 },
  { id_umk: 102, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Semarang 2026", kab_kota: "Kab. Semarang", tahun_umk: 2026, nilai_umk: 2850000 },
  { id_umk: 103, jenis_wilayah: "Kota", nama_umk: "UMK Kota Surakarta 2026", kab_kota: "Kota Surakarta", tahun_umk: 2026, nilai_umk: 2500000 },
  { id_umk: 104, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Banyumas 2026", kab_kota: "Kab. Banyumas", tahun_umk: 2026, nilai_umk: 2300000 },
  { id_umk: 105, jenis_wilayah: "Kota", nama_umk: "UMK Kota Salatiga 2026", kab_kota: "Kota Salatiga", tahun_umk: 2026, nilai_umk: 2480000 },
  { id_umk: 106, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Kudus 2026", kab_kota: "Kab. Kudus", tahun_umk: 2026, nilai_umk: 2600000 },

  // 2025 UMK Data (26 Regencies & Cities)
  { id_umk: 201, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Banyumas 2025", kab_kota: "Kabupaten Banyumas", tahun_umk: 2025, nilai_umk: 2338410 },
  { id_umk: 202, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Blora 2025", kab_kota: "Kabupaten Blora", tahun_umk: 2025, nilai_umk: 2238431 },
  { id_umk: 203, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Boyolali 2025", kab_kota: "Kabupaten Boyolali", tahun_umk: 2025, nilai_umk: 2396598 },
  { id_umk: 204, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Brebes 2025", kab_kota: "Kabupaten Brebes", tahun_umk: 2025, nilai_umk: 2239802 },
  { id_umk: 205, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Cilacap 2025", kab_kota: "Kabupaten Cilacap", tahun_umk: 2025, nilai_umk: 2640248 },
  { id_umk: 206, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Demak 2025", kab_kota: "Kabupaten Demak", tahun_umk: 2025, nilai_umk: 2940716 },
  { id_umk: 207, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Grobogan 2025", kab_kota: "Kabupaten Grobogan", tahun_umk: 2025, nilai_umk: 2254090 },
  { id_umk: 208, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Gunung Kidul 2025", kab_kota: "Kabupaten Gunung Kidul", tahun_umk: 2025, nilai_umk: 2330264 },
  { id_umk: 209, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Karanganyar 2025", kab_kota: "Kabupaten Karanganyar", tahun_umk: 2025, nilai_umk: 2437110 },
  { id_umk: 210, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Kebumen 2025", kab_kota: "Kabupaten Kebumen", tahun_umk: 2025, nilai_umk: 2259874 },
  { id_umk: 211, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Kudus 2025", kab_kota: "Kabupaten Kudus", tahun_umk: 2025, nilai_umk: 2680486 },
  { id_umk: 212, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Magelang 2025", kab_kota: "Kabupaten Magelang", tahun_umk: 2025, nilai_umk: 2467488 },
  { id_umk: 213, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Pemalang 2025", kab_kota: "Kabupaten Pemalang", tahun_umk: 2025, nilai_umk: 2296140 },
  { id_umk: 214, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Purbalingga 2025", kab_kota: "Kabupaten Purbalingga", tahun_umk: 2025, nilai_umk: 2338283 },
  { id_umk: 215, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Rembang 2025", kab_kota: "Kabupaten Rembang", tahun_umk: 2025, nilai_umk: 2236169 },
  { id_umk: 216, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Semarang 2025", kab_kota: "Kabupaten Semarang", tahun_umk: 2025, nilai_umk: 2750136 },
  { id_umk: 217, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Sleman 2025", kab_kota: "Kabupaten Sleman", tahun_umk: 2025, nilai_umk: 2466515 },
  { id_umk: 218, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Sragen 2025", kab_kota: "Kabupaten Sragen", tahun_umk: 2025, nilai_umk: 2182200 },
  { id_umk: 219, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Tegal 2025", kab_kota: "Kabupaten Tegal", tahun_umk: 2025, nilai_umk: 2333586 },
  { id_umk: 220, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Temanggung 2025", kab_kota: "Kabupaten Temanggung", tahun_umk: 2025, nilai_umk: 2246850 },
  { id_umk: 221, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Wonogiri 2025", kab_kota: "Kabupaten Wonogiri", tahun_umk: 2025, nilai_umk: 2180588 },
  { id_umk: 222, jenis_wilayah: "Kabupaten", nama_umk: "UMK Kabupaten Wonosobo 2025", kab_kota: "Kabupaten Wonosobo", tahun_umk: 2025, nilai_umk: 2299521 },
  { id_umk: 223, jenis_wilayah: "Kota", nama_umk: "UMK Kota Salatiga 2025", kab_kota: "Kota Salatiga", tahun_umk: 2025, nilai_umk: 2533583 },
  { id_umk: 224, jenis_wilayah: "Kota", nama_umk: "UMK Kota Semarang 2025", kab_kota: "Kota Semarang", tahun_umk: 2025, nilai_umk: 3454827 },
  { id_umk: 225, jenis_wilayah: "Kota", nama_umk: "UMK Kota Surakarta 2025", kab_kota: "Kota Surakarta", tahun_umk: 2025, nilai_umk: 2416560 },
  { id_umk: 226, jenis_wilayah: "Kota", nama_umk: "UMK Kota Yogyakarta 2025", kab_kota: "Kota Yogyakarta", tahun_umk: 2025, nilai_umk: 2655042 }
];

const INITIAL_LEMBUR = [
  { id_lembur: 1, kat_lembur: "Pekerjaan Tower & Transmisi" },
  { id_lembur: 2, kat_lembur: "Perbantuan Validasi ROW" },
  { id_lembur: 3, kat_lembur: "Emergency / Pelacakan Gangguan" },
  { id_lembur: 4, kat_lembur: "Manuver Sistem & Pemeliharaan GI" },
  { id_lembur: 5, kat_lembur: "Piket Tanggal Merah / Cuti Pengganti" }
];

const INITIAL_FAKTOR_UPAH = [
  { id_tmk: 1, tingkat_tmk: "TMK Level 1 (0 - 2 Tahun)", koef_tmk: 1, koef: 10, tmk: 1, pembagi_jam: 173, id_project: 1 },
  { id_tmk: 2, tingkat_tmk: "TMK Level 2 (3 - 4 Tahun)", koef_tmk: 2, koef: 10, tmk: 2, pembagi_jam: 173, id_project: 1 },
  { id_tmk: 3, tingkat_tmk: "TMK Level 3 (5 - 6) Tahun)", koef_tmk: 3, koef: 10, tmk: 3, pembagi_jam: 173, id_project: 1 }
];

const INITIAL_PROJECTS = [
  { id_project: 1, nama_project: "Operator Gardu Induk" },
  { id_project: 2, nama_project: "Line Walker" }
];

const INITIAL_UMK = [
  // 2026
  { id_umk: 101, jenis_wilayah: "Kota", tahun_umk: 2026, nominal_umk: 3450000, active: "Y" },
  { id_umk: 102, jenis_wilayah: "Kabupaten", tahun_umk: 2026, nominal_umk: 2850000, active: "Y" },
  { id_umk: 103, jenis_wilayah: "Kota", tahun_umk: 2026, nominal_umk: 2500000, active: "Y" },
  { id_umk: 104, jenis_wilayah: "Kabupaten", tahun_umk: 2026, nominal_umk: 2300000, active: "Y" },
  { id_umk: 105, jenis_wilayah: "Kota", tahun_umk: 2026, nominal_umk: 2480000, active: "Y" },
  { id_umk: 106, jenis_wilayah: "Kabupaten", tahun_umk: 2026, nominal_umk: 2600000, active: "Y" },

  // 2025 UMK Data (26 Regencies & Cities)
  { id_umk: 201, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2338410, active: "Y" },
  { id_umk: 202, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2238431, active: "Y" },
  { id_umk: 203, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2396598, active: "Y" },
  { id_umk: 204, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2239802, active: "Y" },
  { id_umk: 205, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2640248, active: "Y" },
  { id_umk: 206, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2940716, active: "Y" },
  { id_umk: 207, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2254090, active: "Y" },
  { id_umk: 208, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2330264, active: "Y" },
  { id_umk: 209, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2437110, active: "Y" },
  { id_umk: 210, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2259874, active: "Y" },
  { id_umk: 211, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2680486, active: "Y" },
  { id_umk: 212, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2467488, active: "Y" },
  { id_umk: 213, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2296140, active: "Y" },
  { id_umk: 214, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2338283, active: "Y" },
  { id_umk: 215, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2236169, active: "Y" },
  { id_umk: 216, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2750136, active: "Y" },
  { id_umk: 217, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2466515, active: "Y" },
  { id_umk: 218, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2182200, active: "Y" },
  { id_umk: 219, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2333586, active: "Y" },
  { id_umk: 220, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2246850, active: "Y" },
  { id_umk: 221, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2180588, active: "Y" },
  { id_umk: 222, jenis_wilayah: "Kabupaten", tahun_umk: 2025, nominal_umk: 2299521, active: "Y" },
  { id_umk: 223, jenis_wilayah: "Kota", tahun_umk: 2025, nominal_umk: 2533583, active: "Y" },
  { id_umk: 224, jenis_wilayah: "Kota", tahun_umk: 2025, nominal_umk: 3454827, active: "Y" },
  { id_umk: 225, jenis_wilayah: "Kota", tahun_umk: 2025, nominal_umk: 2416560, active: "Y" },
  { id_umk: 226, jenis_wilayah: "Kota", tahun_umk: 2025, nominal_umk: 2655042, active: "Y" }
];
const INITIAL_GAJI = [
  { id_gaji: 1, id_umk: 101, tahun_umk: 2026 },
  { id_gaji: 2, id_umk: 102, tahun_umk: 2026 },
  { id_gaji: 3, id_umk: 103, tahun_umk: 2026 },
  { id_gaji: 4, id_umk: 201, tahun_umk: 2025 },
  { id_gaji: 5, id_umk: 202, tahun_umk: 2025 },
  { id_gaji: 6, id_umk: 203, tahun_umk: 2025 },
  { id_gaji: 7, id_umk: 204, tahun_umk: 2025 },
  { id_gaji: 8, id_umk: 205, tahun_umk: 2025 },
  { id_gaji: 9, id_umk: 206, tahun_umk: 2025 },
  { id_gaji: 10, id_umk: 207, tahun_umk: 2025 },
  { id_gaji: 11, id_umk: 208, tahun_umk: 2025 },
  { id_gaji: 12, id_umk: 209, tahun_umk: 2025 },
  { id_gaji: 13, id_umk: 210, tahun_umk: 2025 },
  { id_gaji: 14, id_umk: 211, tahun_umk: 2025 },
  { id_gaji: 15, id_umk: 212, tahun_umk: 2025 },
  { id_gaji: 16, id_umk: 213, tahun_umk: 2025 },
  { id_gaji: 17, id_umk: 214, tahun_umk: 2025 },
  { id_gaji: 18, id_umk: 215, tahun_umk: 2025 },
  { id_gaji: 19, id_umk: 216, tahun_umk: 2025 },
  { id_gaji: 20, id_umk: 217, tahun_umk: 2025 },
  { id_gaji: 21, id_umk: 218, tahun_umk: 2025 },
  { id_gaji: 22, id_umk: 219, tahun_umk: 2025 },
  { id_gaji: 23, id_umk: 220, tahun_umk: 2025 },
  { id_gaji: 24, id_umk: 221, tahun_umk: 2025 },
  { id_gaji: 25, id_umk: 222, tahun_umk: 2025 },
  { id_gaji: 26, id_umk: 223, tahun_umk: 2025 },
  { id_gaji: 27, id_umk: 224, tahun_umk: 2025 },
  { id_gaji: 28, id_umk: 225, tahun_umk: 2025 },
  { id_gaji: 29, id_umk: 226, tahun_umk: 2025 }
];
const INITIAL_UNITS = [
  { id_unit_uit: 1, id_unit_upt: 10, id_unit_ultg: 100, id_unit_gi: 1001, uit: "UIT JBT", upt: "UPT Semarang", ultg: "ULTG Semarang", gardu_induk: "GI Krapyak", id_gaji: 1 },
  { id_unit_uit: 1, id_unit_upt: 10, id_unit_ultg: 100, id_unit_gi: 1002, uit: "UIT JBT", upt: "UPT Semarang", ultg: "ULTG Semarang", gardu_induk: "GI Ungaran", id_gaji: 2 },
  { id_unit_uit: 1, id_unit_upt: 10, id_unit_ultg: 101, id_unit_gi: 1003, uit: "UIT JBT", upt: "UPT Semarang", ultg: "ULTG Salatiga", gardu_induk: "GI Tuntang", id_gaji: 1 },
  { id_unit_uit: 1, id_unit_upt: 10, id_unit_ultg: 103, id_unit_gi: 1005, uit: "UIT JBT", upt: "UPT Semarang", ultg: "ULTG Kudus", gardu_induk: "GI Tambakakrik", id_gaji: 1 },
  { id_unit_uit: 1, id_unit_upt: 11, id_unit_ultg: 102, id_unit_gi: 1004, uit: "UIT JBT", upt: "UPT Purwokerto", ultg: "ULTG Purwokerto", gardu_induk: "GI Kalisari", id_gaji: 3 },
  { id_unit_uit: 1, id_unit_upt: 12, id_unit_ultg: 104, id_unit_gi: 1006, uit: "UIT JBT", upt: "UPT Surakarta", ultg: "ULTG Surakarta", gardu_induk: "GI Solo Baru", id_gaji: 3 }
];
const INITIAL_JABATAN = [
  { id_jabatan: 1, nama_jabatan: "Operator Gardu Induk", id_project: 1 },
  { id_jabatan: 2, nama_jabatan: "Petugas Line Walker", id_project: 2 },
  { id_jabatan: 3, nama_jabatan: "Team Leader Gardu Induk", id_project: 1 },
  { id_jabatan: 4, nama_jabatan: "Manajer ULTG", id_project: 1 }
];
const INITIAL_PEGAWAI = [
  { id_pegawai: 1, nip: "8912345SMG", nama: "Budi Santoso", tgl_masuk: "2022-03-15", id_jabatan: 1, id_unit_uit: 1, id_unit_upt: 10, id_unit_ultg: 100, id_unit_gi: 1001, id_mutasi: null, active: "Y" },
  { id_pegawai: 2, nip: "9023456SMG", nama: "Bambang Pamungkas", tgl_masuk: "2021-06-01", id_jabatan: 1, id_unit_uit: 1, id_unit_upt: 10, id_unit_ultg: 100, id_unit_gi: 1002, id_mutasi: null, active: "Y" },
  { id_pegawai: 3, nip: "8534567Z", nama: "Ahmad Dani", tgl_masuk: "2018-01-10", id_jabatan: 3, id_unit_uit: 1, id_unit_upt: 10, id_unit_ultg: 100, id_unit_gi: 1001, id_mutasi: null, active: "Y" },
  { id_pegawai: 4, nip: "8112344L", nama: "Rahmat Hidayat", tgl_masuk: "2015-08-20", id_jabatan: 4, id_unit_uit: 1, id_unit_upt: 11, id_unit_ultg: 102, id_unit_gi: 1004, id_mutasi: null, active: "Y" },
  { id_pegawai: 5, nip: "9512345ZY", nama: "Kurnia Ramadhan", tgl_masuk: "2023-01-15", id_jabatan: 1, id_unit_uit: 1, id_unit_upt: 10, id_unit_ultg: 101, id_unit_gi: 1003, id_mutasi: 1, active: "Y" }
];
const INITIAL_APPROVER = [
  { id_app: 1, id_unit_uit: 1, id_unit_upt: 10, id_unit_ultg: 100, id_unit_gi: 1001, nip_peg: 85345678, nama_peg: "Ahmad Dani", start_aktif: "2025-01-01", end_aktif: "2027-12-31" },
  { id_app: 2, id_unit_uit: 1, id_unit_upt: 10, id_unit_ultg: 100, id_unit_gi: 1002, nip_peg: 81123442, nama_peg: "Rahmat Hidayat", start_aktif: "2025-01-01", end_aktif: "2027-12-31" },
  { id_app: 3, id_unit_uit: 1, id_unit_upt: 11, id_unit_ultg: 102, id_unit_gi: 1004, nip_peg: 78234110, nama_peg: "Ir. Bambang Suto", start_aktif: "2024-06-01", end_aktif: "2026-06-01" }
];
const INITIAL_MUTASI = [
  { id_mutasi: 1, id_pegawai: 5, start_mutasi: "2026-02-01", id_unit_upt: 10, id_unit_ultg: 101, id_unit_gi: 1003 }
];
const INITIAL_LOG_MUTASI = [
  {
    id_log: 1,
    id_mutasi: 1,
    id_pegawai: 5,
    nip: "9512345ZY",
    nama: "Kurnia Ramadhan",
    tgl_mutasi: "2026-02-01",
    old_upt: "UPT Semarang",
    old_ultg: "ULTG Semarang",
    old_gi: "GI Krapyak",
    old_role: "maker",
    new_upt: "UPT Semarang",
    new_ultg: "ULTG Semarang",
    new_gi: "GI Kalisari",
    new_role: "maker",
    status: "NON_AKTIF"
  }
];
const INITIAL_JENIS_LEMBUR = [
  {
    id_lembur: "001.",
    jenis_lembur: "Pekerjaan Tower",
    id_jenis: "001.001.",
    jenis_pekerjaan: "Perbaikan Anomali Pentanahan",
    pegawai_pengganti: "-",
    deskripsi: "Deskripsi Pekerjaan (Ruas, Span dan Tower)*",
    evidence: "Bukti Pelaksanaan/Laporan"
  },
  {
    id_lembur: "001.",
    jenis_lembur: "Pekerjaan Tower",
    id_jenis: "001.002.",
    jenis_pekerjaan: "Assesment Kondisi Tower",
    pegawai_pengganti: "-",
    deskripsi: "Deskripsi Pekerjaan (Ruas, Span dan Tower)*",
    evidence: "Bukti Pelaksanaan/Laporan"
  },
  {
    id_lembur: "001.",
    jenis_lembur: "Pekerjaan Tower",
    id_jenis: "001.003.",
    jenis_pekerjaan: "Pengukuran Pentanahan",
    pegawai_pengganti: "-",
    deskripsi: "Deskripsi Pekerjaan (Ruas, Span dan Tower)*",
    evidence: "Bukti Pelaksanaan/Laporan"
  },
  {
    id_lembur: "002.",
    jenis_lembur: "Perbantuan Validasi ROW",
    id_jenis: "002.",
    jenis_pekerjaan: "-",
    pegawai_pengganti: "-",
    deskripsi: "Deskripsi Pekerjaan (Ruas, Span dan Tower)*",
    evidence: "Bukti Pelaksanaan/Laporan"
  },
  {
    id_lembur: "003.",
    jenis_lembur: "Emergency / Pelacakan Gangguan",
    id_jenis: "003.",
    jenis_pekerjaan: "-",
    pegawai_pengganti: "-",
    deskripsi: "Deskripsi Pekerjaan (Ruas, Span dan Tower)*",
    evidence: "Bukti Pelaksanaan/Laporan"
  },
  {
    id_lembur: "004.",
    jenis_lembur: "Manuver",
    id_jenis: "004.001.",
    jenis_pekerjaan: "Manuver Konfigurasi",
    pegawai_pengganti: "-",
    deskripsi: "Deskripsi Pekerjaan Manuver*",
    evidence: "Bukti Pelaksanaan/Laporan"
  },
  {
    id_lembur: "004.",
    jenis_lembur: "Manuver",
    id_jenis: "004.002.",
    jenis_pekerjaan: "Manuver Pemeliharaan",
    pegawai_pengganti: "-",
    deskripsi: "Deskripsi Pekerjaan Manuver*",
    evidence: "Bukti Pelaksanaan/Laporan"
  },
  {
    id_lembur: "004.",
    jenis_lembur: "Manuver",
    id_jenis: "004.003.",
    jenis_pekerjaan: "Manuver Emergency",
    pegawai_pengganti: "-",
    deskripsi: "Deskripsi Pekerjaan Manuver*",
    evidence: "Bukti Pelaksanaan/Laporan"
  },
  {
    id_lembur: "005.",
    jenis_lembur: "Piket Tanggal Merah / Cuti Pengganti",
    id_jenis: "005.001.",
    jenis_pekerjaan: "Pengganti Piket (Operator sedang cuti)",
    pegawai_pengganti: "(harus terisi Pilihan Pegawai)",
    deskripsi: "Deskripsi Siaga/Libur Nasional*",
    evidence: "Bukti Pelaksanaan/Laporan"
  },
  {
    id_lembur: "005.",
    jenis_lembur: "Piket Tanggal Merah / Cuti Pengganti",
    id_jenis: "005.003.",
    jenis_pekerjaan: "Siaga / Libur Nasional",
    pegawai_pengganti: "-",
    deskripsi: "Deskripsi Siaga/Libur Nasional*",
    evidence: "Bukti Pelaksanaan/Laporan"
  }
];
const INITIAL_TRANSACTIONS = {
  t_lembur: [
    { id_lembur: 1, id_pegawai: 1, id_app: 1, tgl_lembur: "2026-07-18", jam_mulai: "18:00", jam_selesai: "22:00", total_jam: 4, nominal_biaya: 238439, pekerjaan: "Pemeliharaan Darurat Trafo #2 GI Krapyak", status: "PENDING" },
    { id_lembur: 2, id_pegawai: 2, id_app: 2, tgl_lembur: "2026-07-15", jam_mulai: "17:00", jam_selesai: "20:00", total_jam: 3, nominal_biaya: 178e3, pekerjaan: "Investigasi Gangguan SUTT", status: "APPROVED" }
  ],
  t_cuti: [
    { id_cuti: 1, id_pegawai: 2, id_app: 2, jenis_cuti: "Cuti Tahunan", tgl_mulai: "2026-07-20", tgl_selesai: "2026-07-22", jumlah_hari: 3, alamat_cuti: "Jl. Pemuda No. 45, Semarang", telepon_darurat: "081234567890", status: "PENDING" }
  ],
  t_ijin: [
    { id_ijin: 1, id_pegawai: 1, id_app: 1, alasan_ijin: "Keperluan Keluarga", tgl_mulai: "2026-07-24", tgl_selesai: "2026-07-24", jumlah_hari: 1, keterangan: "Urgent", status: "APPROVED" }
  ],
  t_sakit: [
    { id_sakit: 1, id_pegawai: 2, id_app: 2, diagnosa: "Demam Tinggi", tgl_mulai: "2026-07-15", tgl_selesai: "2026-07-16", jumlah_hari: 2, file_surat_dokter: "surat_dokter_siti.pdf", status: "APPROVED" }
  ],
  t_sppd: [
    { id_sppd: 1, id_pegawai: 3, id_app: 3, no_sppd: "SPPD-001/UPT-SMG/VII/2026", kota_tujuan: "Salatiga", maksud_dinas: "Supervisi Audit Menara Transmisi", tgl_berangkat: "2026-07-19", tgl_kembali: "2026-07-21", lama_dinas: 3, status: "PENDING" }
  ]
};
export const SCHEMAS = {
  m_role: z.object({
    id_role: z.number().int(),
    kode_role: z.string().min(1, "Kode role wajib diisi").max(50),
    nama_role: z.string().min(1, "Nama role wajib diisi").max(100),
    level_role: z.number().int().optional(),
    is_super_admin: z.enum(["Y", "N"]).optional(),
    is_active: z.enum(["Y", "N"]).optional()
  }),
  m_pegawai: z.object({
    id_pegawai: z.number().int(),
    id_jabatan: z.number().int().optional(),
    id_unit: z.number().int().optional(),
    nip: z.string().min(1, "NIP wajib diisi").max(20),
    nama: z.string().min(1, "Nama Pegawai wajib diisi").max(100),
    tgl_masuk: z.string().optional(),
    is_active: z.enum(["Y", "N"]).optional()
  }),
  m_petugas: z.object({
    id_petugas: z.number().int(),
    id_unit: z.number().int().optional(),
    id_jabatan: z.number().int().optional().nullable(),
    id_gaji: z.number().int().optional(),
    nip: z.string().min(1, "NIP wajib diisi").max(50),
    nama: z.string().min(1, "Nama Petugas wajib diisi").max(150),
    tgl_masuk: z.string().optional(),
    is_active: z.enum(["Y", "N"]).optional()
  }),
  m_user: z.object({
    id_user: z.number().int(),
    id_pegawai: z.number().int().optional().nullable(),
    id_petugas: z.number().int().optional().nullable(),
    id_role: z.number().int().optional(),
    username: z.string().min(1, "Username wajib diisi").max(50),
    password: z.string().optional(),
    email: z.string().email("Format email tidak valid").optional().nullable(),
    is_active: z.enum(["Y", "N"]).optional()
  }),
  m_unit_role: z.object({
    id_unit_role: z.number().int(),
    id_user: z.number().int(),
    id_unit: z.number().int(),
    id_role: z.number().int(),
    is_active: z.enum(["Y", "N"]).optional()
  }),
  m_module: z.object({
    id_module: z.number().int(),
    kode_module: z.string().min(1, "Kode module wajib diisi").max(50),
    nama_module: z.string().min(1, "Nama module wajib diisi").max(100),
    deskripsi: z.string().optional().nullable(),
    is_active: z.enum(["Y", "N"]).optional()
  }),
  m_access_module: z.object({
    id_access: z.number().int(),
    id_role: z.number().int(),
    id_module: z.number().int(),
    can_create: z.enum(["Y", "N"]).optional(),
    can_read: z.enum(["Y", "N"]).optional(),
    can_update: z.enum(["Y", "N"]).optional(),
    can_delete: z.enum(["Y", "N"]).optional(),
    can_approve: z.enum(["Y", "N"]).optional()
  }),
  m_hari_libur: z.object({
    id_hpl: z.number().int(),
    tgl_libur: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal wajib YYYY-MM-DD"),
    ket_libur: z.string().min(1, "Keterangan libur wajib diisi").max(100),
    tahun_libur: z.number().int()
  }),
  m_upah_dasar: z.object({
    id_umk: z.number().int(),
    jenis_wilayah: z.string().optional(),
    nama_umk: z.string().min(1, "Nama UMK wajib diisi").max(100),
    kab_kota: z.string().min(1, "Kab/Kota wajib diisi").max(100),
    tahun_umk: z.number().int(),
    nilai_umk: z.number().positive("Nilai UMK wajib berupa angka positif")
  }),
  m_lembur: z.object({
    id_lembur: z.number().int(),
    kat_lembur: z.string().min(1, "Kategori lembur wajib diisi").max(50)
  }),
  m_faktor_upah: z.object({
    id_tmk: z.number().int(),
    tingkat_tmk: z.string().optional(),
    koef_tmk: z.number().optional(),
    koef: z.number({ required_error: "KOEF (%) wajib diisi" }),
    tmk: z.number({ required_error: "TMK (%) wajib diisi" }),
    pembagi_jam: z.number().optional(),
    id_project: z.number().optional().nullable()
  }),
  koef_tmk: z.object({
    id_koef_tmk: z.number().int(),
    masa_kerja: z.string().min(1, "Masa kerja wajib diisi"),
    koef: z.number({ required_error: "KOEF wajib diisi" }),
    tmk: z.number({ required_error: "TMK wajib diisi" }),
    is_active: z.enum(["Y", "N"]).optional()
  }),
  m_project: z.object({
    id_project: z.number(),
    nama_project: z.string().min(3, "Nama Project minimal 3 karakter").max(100, "Maksimal 100 karakter"),
    active: z.enum(["Y", "N"]).optional()
  }),
  m_umk: z.object({
    id_umk: z.number(),
    jenis_wilayah: z.string().optional(),
    tahun_umk: z.number().int().min(2020).max(2050),
    nominal_umk: z.number().positive("Nominal UMK wajib berupa angka positif"),
    active: z.enum(["Y", "N"])
  }),
  m_gaji: z.object({
    id_gaji: z.number(),
    id_umk: z.number(),
    tahun_umk: z.number().int().min(2020).max(2050)
  }),
  m_unit: z.object({
    id_unit_uit: z.number(),
    id_unit_upt: z.number(),
    id_unit_ultg: z.number(),
    id_unit_gi: z.number(),
    uit: z.string().min(2).max(100),
    upt: z.string().min(2).max(100),
    ultg: z.string().min(2).max(100),
    gardu_induk: z.string().min(2).max(100),
    id_gaji: z.number().optional()
  }),
  m_jabatan: z.object({
    id_jabatan: z.number(),
    nama_jabatan: z.string().min(3, "Nama Jabatan minimal 3 karakter").max(100, "Maksimal 100 karakter"),
    id_project: z.number({ required_error: "Proyek Kerja wajib dipilih", invalid_type_error: "Proyek Kerja wajib dipilih" }),
    active: z.enum(["Y", "N"]).optional()
  }),
  m_pegawai: z.object({
    id_pegawai: z.number(),
    nip: z.string().min(6).max(12, "NIP maksimal 12 karakter"),
    nama: z.string().min(3, "Nama minimal 3 karakter").max(100),
    tgl_masuk: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal wajib YYYY-MM-DD"),
    id_jabatan: z.number(),
    id_unit_uit: z.number(),
    id_unit_upt: z.number(),
    id_unit_ultg: z.number(),
    id_unit_gi: z.number(),
    id_mutasi: z.number().nullable().optional(),
    active: z.enum(["Y", "N"])
  }),
  m_approver: z.object({
    id_app: z.number(),
    id_unit_uit: z.number(),
    id_unit_upt: z.number(),
    id_unit_ultg: z.number(),
    id_unit_gi: z.number(),
    nip_peg: z.number().int(),
    nama_peg: z.string().min(3).max(100),
    start_aktif: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_aktif: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  t_mutasi: z.object({
    id_mutasi: z.number(),
    id_pegawai: z.number(),
    start_mutasi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    id_unit_upt: z.number(),
    id_unit_ultg: z.number(),
    id_unit_gi: z.number()
  }),
  log_mutasi: z.object({
    id_log: z.number().int(),
    id_mutasi: z.number().int().optional().nullable(),
    id_pegawai: z.number().int(),
    nip: z.string().optional(),
    nama: z.string().optional(),
    tgl_mutasi: z.string().optional(),
    old_upt: z.string().optional().nullable(),
    old_ultg: z.string().optional().nullable(),
    old_gi: z.string().optional().nullable(),
    old_role: z.string().optional().nullable(),
    new_upt: z.string().optional(),
    new_ultg: z.string().optional(),
    new_gi: z.string().optional(),
    new_role: z.string().optional().nullable(),
    status: z.enum(["AKTIF", "NON_AKTIF"]).optional().default("NON_AKTIF")
  }),
  m_jenis_lembur: z.object({
    id_jenis: z.string().min(1, "Primary Key id_jenis wajib diisi"),
    id_lembur: z.string().min(1, "ID Lembur wajib diisi"),
    jenis_lembur: z.string().min(1, "Jenis Lembur wajib diisi"),
    jenis_pekerjaan: z.string().min(1, "Jenis Pekerjaan wajib diisi"),
    pegawai_pengganti: z.string().min(1, "Pegawai Pengganti wajib diisi"),
    deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
    evidence: z.string().min(1, "Evidence wajib diisi")
  })
};
const getStorageKey = (table) => `pln_master_${table}`;
export class MasterDataService {
  static normalizeApiRecords(table, records) {
    return (Array.isArray(records) ? records : []).map((item) => {
      const normalized = {
        ...item,
        active: item.active ?? item.is_active ?? "Y"
      };

      if (table === "m_faktor_upah" || table === "koef_tmk") {
        normalized.id_tmk = item.id_tmk ?? item.id_koef_tmk;
        normalized.tingkat_tmk = item.tingkat_tmk ?? item.masa_kerja ?? item.nama_koef_tmk;
        normalized.koef = item.koef ?? item.koef_tmk ?? 0;
      }
      if (table === "m_umk" || table === "m_upah_dasar") {
        normalized.nominal_umk = item.nominal_umk ?? item.nilai_umk ?? item.nominal;
        normalized.nilai_umk = item.nilai_umk ?? item.nominal_umk ?? item.nominal;
        normalized.kab_kota = item.kab_kota ?? item.nama_wilayah ?? item.nama_umk;
      }
      if (table === "m_hari_libur") {
        normalized.id_hpl = item.id_hpl ?? item.id_hari_libur;
        normalized.tgl_libur = item.tgl_libur ?? item.tanggal_libur;
        normalized.ket_libur = item.ket_libur ?? item.keterangan ?? item.nama_libur;
        normalized.tahun_libur = item.tahun_libur ?? (normalized.tgl_libur ? new Date(normalized.tgl_libur).getFullYear() : null);
      }
      return normalized;
    });
  }

  static async syncMasterDataFromApi() {
    const sources = [
      ["m_role", "/roles"],
      ["m_project", "/projects"],
      ["m_jabatan", "/jabatan"],
      ["m_umk", "/umk"],
      ["m_hari_libur", "/hari-libur"],
      ["m_faktor_upah", "/koef-tmk"],
      ["koef_tmk", "/koef-tmk"],
      ["m_gaji", "/gaji"],
      ["m_unit", "/unit"],
      ["m_pegawai", "/pegawai"],
      ["m_petugas", "/petugas"],
      ["m_user", "/users"],
      ["m_unit_role", "/unit-role"],
      ["m_module", "/modules"],
      ["m_access_module", "/access-modules"],
      ["m_status", "/status"],
      ["t_mutasi", "/mutasi"]
    ];

    const results = await Promise.allSettled(
      sources.map(async ([table, endpoint]) => {
        const response = await api.client.get(endpoint, { params: { limit: 1000 } });
        const records = this.normalizeApiRecords(table, response.data?.data || []);
        localStorage.setItem(getStorageKey(table), JSON.stringify(records));
        return { table, count: records.length };
      })
    );

    // UMK juga menjadi referensi upah dasar pada UI yang sudah ada.
    const umkRecords = this.safeParseList(localStorage.getItem(getStorageKey("m_umk")));
    localStorage.setItem(getStorageKey("m_upah_dasar"), JSON.stringify(this.normalizeApiRecords("m_upah_dasar", umkRecords)));

    const failed = results.filter((result) => result.status === "rejected");
    const succeeded = results.filter((result) => result.status === "fulfilled");
    if (succeeded.length === 0) throw failed[0]?.reason || new Error("Semua endpoint master gagal dimuat.");
    return { succeeded, failed };
  }

  static safeParseList(stored) {
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  // Initialize standard records if empty in localStorage
  static initLocalStorage() {
    const defaultData = {
      m_role: INITIAL_ROLES,
      koef_tmk: INITIAL_KOEF_TMK,
      m_hari_libur: INITIAL_HARI_LIBUR,
      m_upah_dasar: INITIAL_UPAH_DASAR,
      m_lembur: INITIAL_LEMBUR,
      m_faktor_upah: INITIAL_FAKTOR_UPAH,
      m_project: INITIAL_PROJECTS,
      m_umk: INITIAL_UMK,
      m_gaji: INITIAL_GAJI,
      m_unit: INITIAL_UNITS,
      m_jabatan: INITIAL_JABATAN,
      m_pegawai: INITIAL_PEGAWAI,
      m_approver: INITIAL_APPROVER,
      t_mutasi: INITIAL_MUTASI,
      log_mutasi: INITIAL_LOG_MUTASI,
      m_jenis_lembur: INITIAL_JENIS_LEMBUR
    };
    Object.keys(defaultData).forEach((key) => {
      const stored = localStorage.getItem(getStorageKey(key));
      if (!stored) {
        localStorage.setItem(getStorageKey(key), JSON.stringify(defaultData[key]));
      } else if (key === "m_umk" || key === "m_upah_dasar") {
        let parsed = this.safeParseList(stored);
        let updated = false;
        parsed = parsed.map((item) => {
          if (!item.jenis_wilayah) {
            updated = true;
            const seed = defaultData[key].find((s) => Number(s.id_umk) === Number(item.id_umk));
            const inferred = seed?.jenis_wilayah || (item.kab_kota?.toLowerCase().startsWith("kota") ? "Kota" : item.kab_kota?.toLowerCase().includes("prov") ? "Provinsi" : "Kabupaten");
            return { ...item, jenis_wilayah: inferred };
          }
          return item;
        });
        if (updated) {
          localStorage.setItem(getStorageKey(key), JSON.stringify(parsed));
        }
      } else if (key === "m_project") {
        let parsed = this.safeParseList(stored);
        let updated = false;
        const oldDefaultNames = [
          "SUTT 150kV JATENG DIY",
          "SUTT 275kV JATENG DIY",
          "SUTT 500kV JATENG DIY",
          "GARDU INDUK 150kV",
          "PEMELIHARAAN TRANSMISI"
        ];
        const hasOldDefaults = parsed.some((p) => oldDefaultNames.includes(p.nama_project));
        if (hasOldDefaults || parsed.length === 0) {
          localStorage.setItem(getStorageKey(key), JSON.stringify(INITIAL_PROJECTS));
        } else {
          INITIAL_PROJECTS.forEach((initP) => {
            const idx = parsed.findIndex((p) => Number(p.id_project) === Number(initP.id_project));
            if (idx !== -1) {
              if (parsed[idx].nama_project !== initP.nama_project) {
                parsed[idx].nama_project = initP.nama_project;
                updated = true;
              }
            } else {
              parsed.push(initP);
              updated = true;
            }
          });
          if (updated) {
            localStorage.setItem(getStorageKey(key), JSON.stringify(parsed));
          }
        }
      } else if (key === "m_unit") {
        let parsed = this.safeParseList(stored);
        let updated = false;
        INITIAL_UNITS.forEach((initU) => {
          const exists = parsed.some((u) => Number(u.id_unit_gi) === Number(initU.id_unit_gi));
          if (!exists) {
            parsed.push(initU);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(getStorageKey(key), JSON.stringify(parsed));
        }
      } else if (key === "m_jenis_lembur") {
        let parsed = this.safeParseList(stored);
        const originalLen = parsed.length;
        parsed = parsed.filter((item) => item.jenis_pekerjaan !== "Pengganti Piket" && item.id_jenis !== "005.002.");
        if (parsed.length !== originalLen) {
          localStorage.setItem(getStorageKey(key), JSON.stringify(parsed));
        }
      }
    });
    if (!localStorage.getItem("pln_transaksi_data")) {
      localStorage.setItem("pln_transaksi_data", JSON.stringify(INITIAL_TRANSACTIONS));
    }
  }
  // Retrieve Master List with Pagination, Search & Sorting capabilities (TUGAS 2.B)
  static getAll(table, params = {}) {
    this.initLocalStorage();
    const stored = localStorage.getItem(getStorageKey(table));
    let rawList = this.safeParseList(stored);
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      rawList = rawList.filter((item) => {
        return Object.entries(item).some(([key, val]) => {
          if (val === null || val === void 0) return false;
          return String(val).toLowerCase().includes(searchLower);
        });
      });
    }
    if (params.activeOnly) {
      rawList = rawList.filter((item) => item.active === "Y");
    }
    if (params.unitFilter) {
      rawList = rawList.filter((item) => {
        return item.id_unit_gi === params.unitFilter || item.id_unit_ultg === params.unitFilter || item.id_unit_upt === params.unitFilter;
      });
    }
    if (params.sortBy) {
      const field = params.sortBy;
      const order = params.sortOrder || "asc";
      rawList.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA < valB) return order === "asc" ? -1 : 1;
        return order === "asc" ? 1 : -1;
      });
    }
    const page = params.page || 1;
    const limit = params.limit || 10;
    const total = rawList.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = rawList.slice(startIndex, startIndex + limit);
    return {
      data: paginatedData,
      total,
      page,
      limit
    };
  }
  // Retrieve Single Record (TUGAS 2.B)
  static getById(table, id) {
    this.initLocalStorage();
    const stored = localStorage.getItem(getStorageKey(table));
    const rawList = this.safeParseList(stored);
    const pkName = this.getPrimaryKeyName(table);
    return rawList.find((item) => String(item[pkName]) === String(id));
  }
  // Create Data with Full Schemas Validation (TUGAS 1 & 2.B)
  static create(table, rawPayload) {
    this.initLocalStorage();
    const schema = SCHEMAS[table];
    const validation = schema.safeParse(rawPayload);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      const errMsg = `Validasi gagal: ${errorMsg}`;
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
    const payload = validation.data;
    const stored = localStorage.getItem(getStorageKey(table));
    const rawList = this.safeParseList(stored);
    const pkName = this.getPrimaryKeyName(table);
    if (rawList.some((item) => String(item[pkName]) === String(payload[pkName]))) {
      const errMsg = `Conflict: Primary Key '${pkName}' bernilai ${payload[pkName]} sudah terdaftar!`;
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
    rawList.push(payload);
    localStorage.setItem(getStorageKey(table), JSON.stringify(rawList));
    if (table === "t_mutasi") {
      const mut = payload;
      this.applyMutasiToPegawai(mut.id_pegawai, mut.id_mutasi, mut.id_unit_upt, mut.id_unit_ultg, mut.id_unit_gi);
    }
    const label = table.replace(/^m_/, "").replace(/^t_/, "").replace(/_/g, " ").toUpperCase();
    toast.success(`Data ${label} baru berhasil ditambahkan!`);
    return { success: true, data: payload };
  }
  // Update Data with validation & integrity check (TUGAS 2.B)
  static update(table, id, rawPayload) {
    this.initLocalStorage();
    const schema = SCHEMAS[table];
    const validation = schema.safeParse(rawPayload);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      const errMsg = `Validasi Gagal: ${errorMsg}`;
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
    const payload = validation.data;
    const stored = localStorage.getItem(getStorageKey(table));
    const rawList = this.safeParseList(stored);
    const pkName = this.getPrimaryKeyName(table);
    const index = rawList.findIndex((item) => String(item[pkName]) === String(id));
    if (index === -1) {
      const errMsg = `Not Found: Entitas dengan ID ${id} tidak ditemukan!`;
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
    rawList[index] = payload;
    localStorage.setItem(getStorageKey(table), JSON.stringify(rawList));
    const label = table.replace(/^m_/, "").replace(/^t_/, "").replace(/_/g, " ").toUpperCase();
    toast.success(`Data ${label} berhasil diperbarui!`);
    return { success: true, data: payload };
  }
  // Delete / Soft Delete with Foreign Key integrity check (TUGAS 2.B)
  static delete(table, id) {
    this.initLocalStorage();
    const stored = localStorage.getItem(getStorageKey(table));
    const rawList = this.safeParseList(stored);
    const pkName = this.getPrimaryKeyName(table);
    const itemToDelete = rawList.find((item) => String(item[pkName]) === String(id));
    if (!itemToDelete) {
      const errMsg = "Data tidak ditemukan.";
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
    const fkCheck = this.verifyForeignKeysIntegrity(table, id);
    if (!fkCheck.safe) {
      const errMsg = `Integrity Constraint Error: Data tidak boleh dihapus karena terhubung sebagai Foreign Key pada tabel '${fkCheck.referringTable}'!`;
      toast.error(errMsg);
      return {
        success: false,
        error: errMsg
      };
    }
    if ("active" in itemToDelete) {
      const updatedList = rawList.map((item) => {
        if (String(item[pkName]) === String(id)) {
          return { ...item, active: "N" };
        }
        return item;
      });
      localStorage.setItem(getStorageKey(table), JSON.stringify(updatedList));
    } else {
      const filtered = rawList.filter((item) => String(item[pkName]) !== String(id));
      localStorage.setItem(getStorageKey(table), JSON.stringify(filtered));
    }
    const label = table.replace(/^m_/, "").replace(/^t_/, "").replace(/_/g, " ").toUpperCase();
    toast.success(`Data ${label} berhasil dihapus!`);
    return { success: true };
  }
  // Fetch all transactions that map to id_pegawai or id_app
  static getTransactionsMapped(id_pegawai, id_app) {
    const rawTx = localStorage.getItem("pln_transaksi_data");
    let tx = INITIAL_TRANSACTIONS;
    if (rawTx) {
      try {
        tx = JSON.parse(rawTx) || INITIAL_TRANSACTIONS;
      } catch {
        tx = INITIAL_TRANSACTIONS;
      }
    }
    const result = {};
    Object.keys(tx).forEach((key) => {
      let list = tx[key];
      if (id_pegawai !== void 0) {
        list = list.filter((item) => item.id_pegawai === id_pegawai);
      }
      if (id_app !== void 0) {
        list = list.filter((item) => item.id_app === id_app);
      }
      result[key] = list;
    });
    return result;
  }
  // Primary Key helpers
  static getPrimaryKeyName(table) {
    switch (table) {
      case "m_role":
        return "id_role";
      case "koef_tmk":
        return "id_koef_tmk";
      case "m_hari_libur":
        return "id_hpl";
      case "m_upah_dasar":
        return "id_umk";
      case "m_lembur":
        return "id_lembur";
      case "m_faktor_upah":
        return "id_tmk";
      case "m_pegawai":
        return "id_pegawai";
      case "m_petugas":
        return "id_petugas";
      case "m_user":
        return "id_user";
      case "m_unit_role":
        return "id_unit_role";
      case "m_module":
        return "id_module";
      case "m_access_module":
        return "id_access";
      case "m_status":
        return "id_status";
      case "t_lembur":
        return "id_lembur";
      case "t_cuti":
        return "id_cuti";
      case "t_log_cuti":
        return "id_log_cuti";
      case "t_sppd":
        return "id_sppd";
      case "t_ijin":
        return "id_ijin";
      case "t_sakit":
        return "id_sakit";
      case "m_unit":
        return "id_unit_gi";
      case "m_jabatan":
        return "id_jabatan";
      case "m_project":
        return "id_project";
      case "m_gaji":
        return "id_gaji";
      case "m_umk":
        return "id_umk";
      case "m_approver":
        return "id_app";
      case "t_mutasi":
        return "id_mutasi";
      case "m_jenis_lembur":
        return "id_jenis";
      default:
        return "id";
    }
  }

  // Async REST API Integration methods using axios
  static async fetchApiAll(table, params = {}) {
    const endpoint = API_ENDPOINTS[table];
    if (endpoint) {
      try {
        const apiPath = endpoint.replace(/^\/api/, "");
        const res = await api.client.get(apiPath, { params });
        if (res.data && res.data.success) {
          return {
            data: this.normalizeApiRecords(table, res.data.data || []),
            total: res.data.total ?? res.data.data?.length ?? 0,
            page: res.data.page || 1,
            limit: res.data.limit || 10,
            fromApi: true
          };
        }
      } catch (err) {
        console.warn(`[API GET ${endpoint}] Exception, falling back to local dataset:`, err.message);
      }
    }
    return { ...this.getAll(table, params), fromApi: false };
  }

  static async createApiRecord(table, rawPayload) {
    const endpoint = API_ENDPOINTS[table];
    if (endpoint) {
      try {
        const res = await axios.post(endpoint, rawPayload);
        if (res.data && res.data.success) {
          return { success: true, data: res.data.data, message: res.data.message || "Data berhasil disimpan via REST API" };
        }
      } catch (err) {
        console.warn(`[API POST ${endpoint}] Failed, attempting local fallback:`, err.message);
      }
    }
    return this.create(table, rawPayload);
  }

  static async updateApiRecord(table, id, rawPayload) {
    const endpoint = API_ENDPOINTS[table];
    if (endpoint) {
      try {
        const res = await axios.put(`${endpoint}/${id}`, rawPayload);
        if (res.data && res.data.success) {
          return { success: true, data: res.data.data, message: res.data.message || "Data berhasil diperbarui via REST API" };
        }
      } catch (err) {
        console.warn(`[API PUT ${endpoint}/${id}] Failed, attempting local fallback:`, err.message);
      }
    }
    return this.update(table, id, rawPayload);
  }

  static async deleteApiRecord(table, id) {
    const endpoint = API_ENDPOINTS[table];
    if (endpoint) {
      try {
        const res = await axios.delete(`${endpoint}/${id}`);
        if (res.data && res.data.success) {
          return { success: true, message: res.data.message || "Data berhasil dihapus via REST API" };
        }
      } catch (err) {
        console.warn(`[API DELETE ${endpoint}/${id}] Failed, attempting local fallback:`, err.message);
      }
    }
    return this.delete(table, id);
  }
  static verifyForeignKeysIntegrity(table, id) {
    const idNum = Number(id);
    if (table === "m_project") {
      const jabatans = this.getAll("m_jabatan", { limit: 9999 }).data;
      if (jabatans.some((j) => Number(j.id_project) === idNum)) return { safe: false, referringTable: "m_jabatan (Master Jabatan)" };
    }
    if (table === "m_umk") {
      const gajis = this.getAll("m_gaji", { limit: 9999 }).data;
      if (gajis.some((g) => Number(g.id_umk) === idNum)) return { safe: false, referringTable: "m_gaji (Master Gaji)" };
    }
    if (table === "m_gaji") {
      const units = this.getAll("m_unit", { limit: 9999 }).data;
      if (units.some((u) => Number(u.id_gaji) === idNum)) return { safe: false, referringTable: "m_unit (Master Unit)" };
    }
    if (table === "m_unit") {
      const pegawais = this.getAll("m_pegawai", { limit: 9999 }).data;
      if (pegawais.some((p) => Number(p.id_unit_gi) === idNum || Number(p.id_unit_upt) === idNum)) {
        return { safe: false, referringTable: "m_pegawai (Master Pegawai)" };
      }
      const approvers = this.getAll("m_approver", { limit: 9999 }).data;
      if (approvers.some((a) => Number(a.id_unit_gi) === idNum || Number(a.id_unit_upt) === idNum)) {
        return { safe: false, referringTable: "m_approver (Master Approver)" };
      }
    }
    if (table === "m_lembur") {
      const jenisLemburList = this.getAll("m_jenis_lembur", { limit: 9999 }).data;
      if (jenisLemburList.some((jl) => String(jl.id_lembur) === String(id) || Number(jl.id_lembur) === idNum)) {
        return { safe: false, referringTable: "m_jenis_lembur (Master Jenis Lembur)" };
      }
    }
    if (table === "m_pegawai") {
      const tx = this.getTransactionsMapped(idNum, void 0);
      for (const [key, list] of Object.entries(tx)) {
        if (list.length > 0) return { safe: false, referringTable: `${key} (Transaksi)` };
      }
    }
    if (table === "m_approver") {
      const tx = this.getTransactionsMapped(void 0, idNum);
      for (const [key, list] of Object.entries(tx)) {
        if (list.length > 0) return { safe: false, referringTable: `${key} (Transaksi)` };
      }
    }
    return { safe: true };
  }
  static applyMutasiToPegawai(idPeg, idMut, upt, ultg, gi) {
    const stored = localStorage.getItem(getStorageKey("m_pegawai"));
    if (!stored) return;
    const pegawais = JSON.parse(stored);
    const index = pegawais.findIndex((p) => p.id_pegawai === idPeg);
    if (index !== -1) {
      pegawais[index].id_mutasi = idMut;
      pegawais[index].id_unit_upt = upt;
      pegawais[index].id_unit_ultg = ultg;
      pegawais[index].id_unit_gi = gi;
      localStorage.setItem(getStorageKey("m_pegawai"), JSON.stringify(pegawais));
    }
  }
  // TUGAS 1.A: ORM/SQL Mapping documentation for the five transaction tables
  static getQueryMappingMatrix() {
    return [
      {
        table: "t_lembur",
        fields: "id_lembur, id_pegawai [FK], id_app [FK], tgl_lembur, jam_mulai, jam_selesai, total_jam, nominal_biaya, pekerjaan, status",
        sqlQuery: `SELECT l.*, p.nama AS nama_pegawai, p.nip, a.nama_peg AS nama_approver 
                    FROM t_lembur l
                    JOIN m_pegawai p ON l.id_pegawai = p.id_pegawai
                    JOIN m_approver a ON l.id_app = a.id_app
                    WHERE l.id_pegawai = :idPegawai;`,
        ormDrizzle: `db.select().from(tLembur)
                      .innerJoin(mPegawai, eq(tLembur.idPegawai, mPegawai.idPegawai))
                      .innerJoin(mApprover, eq(tLembur.idApp, mApprover.idApp))`
      },
      {
        table: "t_cuti",
        fields: "id_cuti, id_pegawai [FK], id_app [FK], jenis_cuti, tgl_mulai, tgl_selesai, jumlah_hari, alamat_cuti, telepon_darurat, status",
        sqlQuery: `SELECT c.*, p.nama AS nama_pegawai, p.nip, a.nama_peg AS nama_approver 
                    FROM t_cuti c
                    JOIN m_pegawai p ON c.id_pegawai = p.id_pegawai
                    JOIN m_approver a ON c.id_app = a.id_app
                    WHERE c.id_pegawai = :idPegawai;`,
        ormDrizzle: `db.select().from(tCuti)
                      .innerJoin(mPegawai, eq(tCuti.idPegawai, mPegawai.idPegawai))
                      .innerJoin(mApprover, eq(tCuti.idApp, mApprover.idApp))`
      },
      {
        table: "t_ijin",
        fields: "id_ijin, id_pegawai [FK], id_app [FK], alasan_ijin, tgl_mulai, tgl_selesai, jumlah_hari, keterangan, status",
        sqlQuery: `SELECT i.*, p.nama AS nama_pegawai, p.nip, a.nama_peg AS nama_approver 
                    FROM t_ijin i
                    JOIN m_pegawai p ON i.id_pegawai = p.id_pegawai
                    JOIN m_approver a ON i.id_app = a.id_app
                    WHERE i.id_pegawai = :idPegawai;`,
        ormDrizzle: `db.select().from(tIjin)
                      .innerJoin(mPegawai, eq(tIjin.idPegawai, mPegawai.idPegawai))
                      .innerJoin(mApprover, eq(tIjin.idApp, mApprover.idApp))`
      },
      {
        table: "t_sakit",
        fields: "id_sakit, id_pegawai [FK], id_app [FK], diagnosa, tgl_mulai, tgl_selesai, jumlah_hari, file_surat_dokter, status",
        sqlQuery: `SELECT s.*, p.nama AS nama_pegawai, p.nip, a.nama_peg AS nama_approver 
                    FROM t_sakit s
                    JOIN m_pegawai p ON s.id_pegawai = p.id_pegawai
                    JOIN m_approver a ON s.id_app = a.id_app;`,
        ormDrizzle: `db.select().from(tSakit)
                      .innerJoin(mPegawai, eq(tSakit.idPegawai, mPegawai.idPegawai))
                      .innerJoin(mApprover, eq(tSakit.idApp, mApprover.idApp))`
      },
      {
        table: "t_sppd",
        fields: "id_sppd, id_pegawai [FK], id_app [FK], no_sppd, kota_tujuan, maksud_dinas, tgl_berangkat, tgl_kembali, lama_dinas, status",
        sqlQuery: `SELECT sp.*, p.nama AS nama_pegawai, p.nip, a.nama_peg AS nama_approver 
                    FROM t_sppd sp
                    JOIN m_pegawai p ON sp.id_pegawai = p.id_pegawai
                    JOIN m_approver a ON sp.id_app = a.id_app;`,
        ormDrizzle: `db.select().from(tSppd)
                    .innerJoin(mPegawai, eq(tSppd.idPegawai, mPegawai.idPegawai))
                    .innerJoin(mApprover, eq(tSppd.idApp, mApprover.idApp))`
                        }
    ];
  }

  // Active UMK Year & Salary Basis Generator Helpers (Task 1 & Task 2)
  static getActiveUmkYear() {
    return localStorage.getItem("pln_active_umk_year") || "2026";
  }

  static setActiveUmkYear(year) {
    localStorage.setItem("pln_active_umk_year", String(year));
  }

  static generateSalaryBasis(targetYear) {
    const year = String(targetYear || this.getActiveUmkYear());
    this.setActiveUmkYear(year);

    const users = AuthService.getUsers();
    const umkRes = this.getAll("m_umk", { limit: 1000 });
    const upahRes = this.getAll("m_upah_dasar", { limit: 1000 });
    const faktorRes = this.getAll("m_faktor_upah", { limit: 1000 });

    const umkList = umkRes.data || [];
    const upahList = upahRes.data || [];
    const faktorList = faktorRes.data || [];

    const umkForYear = umkList.filter((u) => String(u.tahun_umk) === String(year));
    const defaultUmk = umkForYear.length > 0 ? umkForYear[0] : (umkList[0] || { nominal_umk: 3450000, id_umk: 101 });

    let updatedCount = 0;
    const auditLogs = [];

    const updatedUsers = users.map((user) => {
      if (user.role !== "maker" && !user.gajiPokok) return user;

      // Find matching UMK for user's location or existing selectedUmkId
      let matchedUmk = null;
      if (user.selectedUmkId) {
        const currentSelected = upahList.find((u) => String(u.id_umk) === String(user.selectedUmkId));
        if (currentSelected && currentSelected.kab_kota) {
          matchedUmk = upahList.find(
            (u) => String(u.tahun_umk) === String(year) && u.kab_kota.toLowerCase().includes(currentSelected.kab_kota.toLowerCase())
          );
        }
      }

      if (!matchedUmk) {
        const userLoc = (user.garduInduk || user.unitUpt || "").toLowerCase();
        matchedUmk = upahList.find(
          (u) => String(u.tahun_umk) === String(year) && (userLoc.includes(u.kab_kota.toLowerCase()) || u.kab_kota.toLowerCase().includes(userLoc))
        );
      }

      if (!matchedUmk) {
        matchedUmk = umkForYear[0] || defaultUmk;
      }

      const umkRef = umkList.find((u) => String(u.id_umk) === String(matchedUmk.id_umk));
      const nominalUmk = Number(umkRef?.nominal_umk || matchedUmk.nilai_umk || matchedUmk.nominal_umk || 3450000);

      // Find matching Faktor Upah (KOEF & TMK)
      let matchedFaktor = null;
      if (user.selectedFaktorId) {
        matchedFaktor = faktorList.find((f) => String(f.id_tmk) === String(user.selectedFaktorId));
      }
      if (!matchedFaktor) {
        const startYear = user.tanggalMasuk ? new Date(user.tanggalMasuk).getFullYear() : 2022;
        const yearsWorked = Math.max(0, Number(year) - startYear);
        if (yearsWorked <= 2) {
          matchedFaktor = faktorList.find((f) => Number(f.id_tmk) === 1) || faktorList[0];
        } else if (yearsWorked <= 5) {
          matchedFaktor = faktorList.find((f) => Number(f.id_tmk) === 2) || faktorList[1];
        } else {
          matchedFaktor = faktorList.find((f) => Number(f.id_tmk) === 3) || faktorList[2];
        }
      }

      const koefPercent = matchedFaktor ? Number(matchedFaktor.koef ?? 10) : 10;
      const tmkPercent = matchedFaktor ? Number(matchedFaktor.tmk ?? 5) : 5;

      // Formula: Gaji Pokok = UMK + (UMK x KOEF%) + (UMK x TMK%)
      const calculatedGaji = Math.round(nominalUmk + (nominalUmk * (koefPercent / 100)) + (nominalUmk * (tmkPercent / 100)));

      updatedCount++;
      auditLogs.push({
        nip: user.nip,
        name: user.name,
        kabKota: matchedUmk.kab_kota || matchedUmk.nama_umk || "Kota Semarang",
        nominalUmk,
        koefPercent,
        tmkPercent,
        gajiPokokBaru: calculatedGaji,
        gajiPokokLama: user.gajiPokok || 0,
        activeUmkYear: Number(year)
      });

      return {
        ...user,
        gajiPokok: calculatedGaji,
        activeUmkYear: Number(year),
        selectedUmkId: String(matchedUmk.id_umk),
        selectedFaktorId: matchedFaktor ? String(matchedFaktor.id_tmk) : "1",
        lastGeneratedAt: new Date().toISOString()
      };
    });

    AuthService.saveUsers(updatedUsers);

    return {
      success: true,
      year,
      updatedCount,
      auditLogs,
      updatedUsers
    };
  }
}
