-- ============================================================================
-- WORKFORCE MANAGEMENT SYSTEM - INITIAL DATA SEEDER (DML)
-- RDBMS        : MySQL 8.0+ / MariaDB 10.4+
-- Database     : workforce_management
-- Timezone     : Asia/Jakarta (+07:00)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET TIME_ZONE = '+07:00';

-- 1. SEED MASTER ROLE
INSERT INTO `m_role` (`id_role`, `kode_role`, `nama_role`, `level_role`, `is_super_admin`, `is_active`) VALUES
(1, 'SUPERADMIN', 'Super Admin System', 100, 'Y', 'Y'),
(2, 'ADMIN_UPT', 'Admin UPT PLN UP2', 80, 'N', 'Y'),
(3, 'SUPERVISOR', 'Supervisor / Manager Unit', 60, 'N', 'Y'),
(4, 'OPERATOR', 'Operator / Staff Input', 40, 'N', 'Y'),
(5, 'PETUGAS', 'Petugas Operasional Lapangan', 20, 'N', 'Y');

-- 2. SEED MASTER STATUS WORKFLOW
INSERT INTO `m_status` (`id_status`, `id_role`, `kode_status`, `nama_status`, `urutan_status`, `id_status_next`, `id_status_revision`, `id_status_rejected`, `is_initial`, `is_final`, `is_active`) VALUES
(1, 5, 'DRAFT', 'Draft Pengajuan', 1, 2, NULL, 6, 'Y', 'N', 'Y'),
(2, 4, 'SUBMITTED', 'Diajukan (Menunggu Verification)', 2, 3, 1, 6, 'N', 'N', 'Y'),
(3, 3, 'CHECKED', 'Verified (Checker Lapangan)', 3, 4, 1, 6, 'N', 'N', 'Y'),
(4, 2, 'APPROVED_SPV', 'Disetujui Supervisor / MAN', 4, 5, 2, 6, 'N', 'N', 'Y'),
(5, 1, 'APPROVED_FINAL', 'Disetujui Final SDM & Payroll', 5, 7, 2, 6, 'N', 'Y', 'Y'),
(6, NULL, 'REJECTED', 'Ditolak / Dikembalikan', 99, NULL, NULL, NULL, 'N', 'Y', 'Y'),
(7, NULL, 'COMPLETED', 'Selesai Diproses Payroll', 100, NULL, NULL, NULL, 'N', 'Y', 'Y');

-- 3. SEED MASTER PROJECT
INSERT INTO `m_project` (`id_project`, `nama_project`, `is_active`) VALUES
(1, 'Pengoperasian & Pemeliharaan GI / SUTT 150kV Jateng DIY', 'Y'),
(2, 'Layanan Operasional Kontrak Jasa Tenaga Kerja', 'Y');

-- 4. SEED MASTER JABATAN
INSERT INTO `m_jabatan` (`id_jabatan`, `id_project`, `nama_jabatan`, `is_active`) VALUES
(1, 1, 'Operator Gardu Induk 150kV', 'Y'),
(2, 1, 'Teknisi Pemeliharaan Proteksi & Meter', 'Y'),
(3, 1, 'Supervisor Operasional Sistem UPT', 'Y'),
(4, 2, 'Petugas K2/K3 Lingkungan PLN', 'Y');

-- 5. SEED MASTER UMK
INSERT INTO `m_umk` (`id_umk`, `jenis_wilayah`, `nama_wilayah`, `tahun_umk`, `nominal_umk`, `is_active`) VALUES
(1, 'KOTA', 'Kota Semarang', 2026, 3250000.00, 'Y'),
(2, 'KABUPATEN', 'Kabupaten Surakarta', 2026, 2450000.00, 'Y'),
(3, 'KOTA', 'Kota Yogyakarta', 2026, 2600000.00, 'Y');

-- 6. SEED KOEF TMK
INSERT INTO `koef_tmk` (`id_koef_tmk`, `masa_kerja`, `koef`, `tmk`, `is_active`) VALUES
(1, '0 - 1 Tahun', 1.0000, 0.0000, 'Y'),
(2, '1 - 3 Tahun', 1.0500, 5.0000, 'Y'),
(3, '3 - 5 Tahun', 1.1000, 10.0000, 'Y'),
(4, '> 5 Tahun', 1.2000, 20.0000, 'Y');

-- 7. SEED MASTER GAJI POKOK
INSERT INTO `m_gaji` (`id_gaji`, `id_umk`, `id_koef_tmk`, `gaji_pokok`, `is_active`) VALUES
(1, 1, 1, 3250000.00, 'Y'),
(2, 1, 2, 3412500.00, 'Y'),
(3, 2, 1, 2450000.00, 'Y'),
(4, 3, 2, 2730000.00, 'Y');

-- 8. SEED MASTER UNIT HIERARKI PLN
INSERT INTO `m_unit` (`id_unit`, `id_induk_unit`, `level`, `nama_unit`, `is_active`) VALUES
(1, NULL, 1, 'PLN UIT JBT (Induk Transmisi)', 'Y'),
(2, 1, 2, 'PLN UPT Semarang', 'Y'),
(3, 1, 2, 'PLN UPT Surakarta', 'Y'),
(4, 2, 3, 'ULTG Semarang Barat', 'Y'),
(5, 2, 3, 'ULTG Semarang Timur', 'Y'),
(6, 4, 4, 'GI 150kV Krapyak', 'Y'),
(7, 4, 4, 'GI 150kV Ungaran', 'Y');

-- 9. SEED MASTER MODULE APLIKASI
INSERT INTO `m_module` (`id_module`, `kode_module`, `nama_module`, `deskripsi`, `is_active`) VALUES
(1, 'LEMBUR', 'Modul Pengajuan Lembur', 'Manajemen pengajuan dan approval jam lembur kerja', 'Y'),
(2, 'CUTI', 'Modul Permohonan Cuti', 'Manajemen jatah, pengajuan, dan approval cuti pegawai', 'Y'),
(3, 'SPPD', 'Modul Perjalanan Dinas', 'Pengurusan SPPD dan pertanggungjawaban klaim dinas', 'Y'),
(4, 'IZIN_SAKIT', 'Modul Izin & Sakit', 'Pengajuan izin harian dan surat dokter pegawai', 'Y'),
(5, 'MUTASI', 'Modul Mutasi Placement', 'Pencatatan riwayat mutasi unit tugas pegawai', 'Y'),
(6, 'MASTER_DATA', 'Modul Master Data System', 'Pengelolaan master user, role, unit, umk, dan jabatan', 'Y');

-- 10. SEED MASTER ACCESS MODULE
INSERT INTO `m_access_module` (`id_access`, `id_role`, `id_module`, `can_create`, `can_read`, `can_update`, `can_delete`, `can_approve`) VALUES
(1, 1, 1, 'Y', 'Y', 'Y', 'Y', 'Y'),
(2, 1, 2, 'Y', 'Y', 'Y', 'Y', 'Y'),
(3, 1, 3, 'Y', 'Y', 'Y', 'Y', 'Y'),
(4, 1, 4, 'Y', 'Y', 'Y', 'Y', 'Y'),
(5, 1, 5, 'Y', 'Y', 'Y', 'Y', 'Y'),
(6, 1, 6, 'Y', 'Y', 'Y', 'Y', 'Y'),
(7, 2, 1, 'Y', 'Y', 'Y', 'N', 'Y'),
(8, 2, 2, 'Y', 'Y', 'Y', 'N', 'Y'),
(9, 3, 1, 'N', 'Y', 'Y', 'N', 'Y'),
(10, 5, 1, 'Y', 'Y', 'N', 'N', 'N');

-- 11. SEED MASTER PEGAWAI / TENAGA KERJA
INSERT INTO `m_pegawai` (`id_pegawai`, `id_jabatan`, `id_unit`, `nip`, `nama`, `tgl_masuk`, `is_active`) VALUES
(1, 1, 6, '9218201PLN', 'Budi Santoso', '2022-03-15', 'Y'),
(2, 2, 6, '9218202PLN', 'Siti Nurhaliza', '2023-01-10', 'Y'),
(3, 3, 4, '9117105PLN', 'Ahmad Dahlan', '2020-08-01', 'Y');

-- 12. SEED MASTER PETUGAS
INSERT INTO `m_petugas` (`id_petugas`, `id_unit`, `id_jabatan`, `id_gaji`, `nip`, `nama`, `tgl_masuk`, `is_active`) VALUES
(1, 6, 1, 1, '8820101PTG', 'Rian Hidayat', '2024-02-01', 'Y'),
(2, 7, 1, 2, '8820102PTG', 'Dedi Kurniawan', '2023-06-15', 'Y');

-- 13. SEED MASTER USER SYSTEM
-- Password default: "Admin123!" (hash bcrypt/argon2 siap diganti pada backend)
INSERT INTO `m_user` (`id_user`, `id_pegawai`, `id_petugas`, `id_role`, `username`, `password`, `email`, `is_active`) VALUES
(1, 3, NULL, 1, 'superadmin', '$2b$10$w6x7uE.p7cR.B2k9T1j/1eL3Hk0uW0A2Y3Z4X5W6V7U8T9S0R1Q2P', 'admin.workforce@pln.co.id', 'Y'),
(2, 1, NULL, 3, 'supervisor_krapyak', '$2b$10$w6x7uE.p7cR.B2k9T1j/1eL3Hk0uW0A2Y3Z4X5W6V7U8T9S0R1Q2P', 'spv.krapyak@pln.co.id', 'Y'),
(3, NULL, 1, 5, 'petugas_rian', '$2b$10$w6x7uE.p7cR.B2k9T1j/1eL3Hk0uW0A2Y3Z4X5W6V7U8T9S0R1Q2P', 'rian.hidayat@gmail.com', 'Y');

-- 14. SEED UNIT ROLE OTORITAS USER
INSERT INTO `m_unit_role` (`id_unit_role`, `id_user`, `id_unit`, `id_role`, `is_active`) VALUES
(1, 1, 1, 1, 'Y'),
(2, 2, 4, 3, 'Y'),
(3, 3, 6, 5, 'Y');

SET FOREIGN_KEY_CHECKS = 1;
