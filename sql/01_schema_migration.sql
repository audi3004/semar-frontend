-- ============================================================================
-- WORKFORCE MANAGEMENT SYSTEM - DATABASE MIGRATION SCRIPT (DDL)
-- Target RDBMS : MySQL 8.0+ / MariaDB 10.4+
-- Database     : workforce_management
-- Timezone     : Asia/Jakarta (+07:00)
-- Engine       : InnoDB | Charset: utf8mb4 | Collate: utf8mb4_general_ci
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET TIME_ZONE = '+07:00';

-- ----------------------------------------------------------------------------
-- 1. MASTER CORE
-- ----------------------------------------------------------------------------

-- Table: m_role
DROP TABLE IF EXISTS `m_role`;
CREATE TABLE `m_role` (
  `id_role` INT(11) NOT NULL AUTO_INCREMENT,
  `kode_role` VARCHAR(50) NOT NULL,
  `nama_role` VARCHAR(100) NOT NULL,
  `level_role` INT(11) NOT NULL DEFAULT 0 COMMENT 'Tingkat hirarki role (10-100)',
  `is_super_admin` ENUM('Y','N') NOT NULL DEFAULT 'N',
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_role`),
  UNIQUE KEY `uk_role_kode_role` (`kode_role`),
  KEY `idx_role_nama_role` (`nama_role`),
  KEY `idx_role_level_role` (`level_role`),
  KEY `idx_role_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: m_project
DROP TABLE IF EXISTS `m_project`;
CREATE TABLE `m_project` (
  `id_project` INT(11) NOT NULL AUTO_INCREMENT,
  `nama_project` VARCHAR(100) NOT NULL,
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_project`),
  KEY `idx_project_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: m_jabatan
DROP TABLE IF EXISTS `m_jabatan`;
CREATE TABLE `m_jabatan` (
  `id_jabatan` INT(11) NOT NULL AUTO_INCREMENT,
  `id_project` INT(11) NOT NULL,
  `nama_jabatan` VARCHAR(100) NOT NULL,
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_jabatan`),
  KEY `idx_jabatan_project` (`id_project`),
  KEY `idx_jabatan_active` (`is_active`),
  CONSTRAINT `m_jabatan_ibfk_1` FOREIGN KEY (`id_project`) REFERENCES `m_project` (`id_project`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: m_umk
DROP TABLE IF EXISTS `m_umk`;
CREATE TABLE `m_umk` (
  `id_umk` INT(11) NOT NULL AUTO_INCREMENT,
  `jenis_wilayah` VARCHAR(20) NOT NULL,
  `nama_wilayah` VARCHAR(100) NOT NULL,
  `tahun_umk` INT(11) NOT NULL,
  `nominal_umk` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_umk`),
  UNIQUE KEY `uk_umk_wilayah_tahun` (`jenis_wilayah`,`nama_wilayah`,`tahun_umk`),
  KEY `idx_umk_tahun` (`tahun_umk`),
  KEY `idx_umk_wilayah` (`jenis_wilayah`,`nama_wilayah`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: koef_tmk
DROP TABLE IF EXISTS `koef_tmk`;
CREATE TABLE `koef_tmk` (
  `id_koef_tmk` INT(11) NOT NULL AUTO_INCREMENT,
  `masa_kerja` VARCHAR(100) NOT NULL,
  `koef` DECIMAL(8,4) NOT NULL DEFAULT 0.0000 COMMENT 'Nilai koefisien dalam persen',
  `tmk` DECIMAL(8,4) NOT NULL DEFAULT 0.0000 COMMENT 'Nilai TMK dalam persen',
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_koef_tmk`),
  UNIQUE KEY `uk_koef_tmk_masa_kerja` (`masa_kerja`),
  KEY `idx_koef_tmk_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: m_gaji
DROP TABLE IF EXISTS `m_gaji`;
CREATE TABLE `m_gaji` (
  `id_gaji` INT(11) NOT NULL AUTO_INCREMENT,
  `id_umk` INT(11) NOT NULL,
  `id_koef_tmk` INT(11) NOT NULL,
  `gaji_pokok` DECIMAL(15,2) DEFAULT 0.00,
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_gaji`),
  UNIQUE KEY `uk_gaji_umk_koef_tmk` (`id_umk`,`id_koef_tmk`),
  KEY `idx_gaji_umk` (`id_umk`),
  KEY `idx_gaji_koef_tmk` (`id_koef_tmk`),
  KEY `idx_gaji_active` (`is_active`),
  CONSTRAINT `m_gaji_ibfk_1` FOREIGN KEY (`id_umk`) REFERENCES `m_umk` (`id_umk`) ON UPDATE CASCADE,
  CONSTRAINT `m_gaji_ibfk_2` FOREIGN KEY (`id_koef_tmk`) REFERENCES `koef_tmk` (`id_koef_tmk`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: m_unit
DROP TABLE IF EXISTS `m_unit`;
CREATE TABLE `m_unit` (
  `id_unit` INT(11) NOT NULL AUTO_INCREMENT,
  `id_induk_unit` INT(11) DEFAULT NULL,
  `level` INT(11) NOT NULL COMMENT '1=UIT, 2=UPT, 3=ULTG, 4=GI',
  `nama_unit` VARCHAR(100) NOT NULL,
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_unit`),
  KEY `idx_unit_induk` (`id_induk_unit`),
  KEY `idx_unit_active` (`is_active`),
  CONSTRAINT `m_unit_ibfk_1` FOREIGN KEY (`id_induk_unit`) REFERENCES `m_unit` (`id_unit`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------------------------------------------------------
-- 2. USER, PEGAWAI & OTORITAS
-- ----------------------------------------------------------------------------

-- Table: m_pegawai
DROP TABLE IF EXISTS `m_pegawai`;
CREATE TABLE `m_pegawai` (
  `id_pegawai` INT(11) NOT NULL AUTO_INCREMENT,
  `id_jabatan` INT(11) NOT NULL,
  `id_unit` INT(11) NOT NULL,
  `nip` VARCHAR(12) NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `tgl_masuk` DATE NOT NULL,
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_pegawai`),
  UNIQUE KEY `uk_pegawai_nip` (`nip`),
  KEY `idx_pegawai_jabatan` (`id_jabatan`),
  KEY `idx_pegawai_unit` (`id_unit`),
  KEY `idx_pegawai_active` (`is_active`),
  CONSTRAINT `m_pegawai_ibfk_1` FOREIGN KEY (`id_jabatan`) REFERENCES `m_jabatan` (`id_jabatan`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `m_pegawai_ibfk_2` FOREIGN KEY (`id_unit`) REFERENCES `m_unit` (`id_unit`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: m_petugas
DROP TABLE IF EXISTS `m_petugas`;
CREATE TABLE `m_petugas` (
  `id_petugas` INT(11) NOT NULL AUTO_INCREMENT,
  `id_unit` INT(11) NOT NULL,
  `id_jabatan` INT(11) DEFAULT NULL,
  `id_gaji` INT(11) NOT NULL,
  `nip` VARCHAR(50) NOT NULL,
  `nama` VARCHAR(150) NOT NULL,
  `tgl_masuk` DATE NOT NULL,
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_petugas`),
  UNIQUE KEY `uk_petugas_nip` (`nip`),
  KEY `idx_petugas_unit` (`id_unit`),
  KEY `idx_petugas_jabatan` (`id_jabatan`),
  KEY `idx_petugas_gaji` (`id_gaji`),
  KEY `idx_petugas_active` (`is_active`),
  CONSTRAINT `m_petugas_ibfk_1` FOREIGN KEY (`id_unit`) REFERENCES `m_unit` (`id_unit`) ON UPDATE CASCADE,
  CONSTRAINT `m_petugas_ibfk_2` FOREIGN KEY (`id_jabatan`) REFERENCES `m_jabatan` (`id_jabatan`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `m_petugas_ibfk_3` FOREIGN KEY (`id_gaji`) REFERENCES `m_gaji` (`id_gaji`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: m_user
DROP TABLE IF EXISTS `m_user`;
CREATE TABLE `m_user` (
  `id_user` INT(11) NOT NULL AUTO_INCREMENT,
  `id_pegawai` INT(11) DEFAULT NULL,
  `id_petugas` INT(11) DEFAULT NULL,
  `id_role` INT(11) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `uk_user_username` (`username`),
  UNIQUE KEY `uk_user_pegawai` (`id_pegawai`),
  UNIQUE KEY `uk_user_petugas` (`id_petugas`),
  KEY `idx_user_role` (`id_role`),
  KEY `idx_user_active` (`is_active`),
  CONSTRAINT `m_user_ibfk_1` FOREIGN KEY (`id_pegawai`) REFERENCES `m_pegawai` (`id_pegawai`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `m_user_ibfk_2` FOREIGN KEY (`id_petugas`) REFERENCES `m_petugas` (`id_petugas`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `m_user_ibfk_3` FOREIGN KEY (`id_role`) REFERENCES `m_role` (`id_role`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: m_unit_role
DROP TABLE IF EXISTS `m_unit_role`;
CREATE TABLE `m_unit_role` (
  `id_unit_role` INT(11) NOT NULL AUTO_INCREMENT,
  `id_user` INT(11) NOT NULL,
  `id_unit` INT(11) NOT NULL,
  `id_role` INT(11) NOT NULL,
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_unit_role`),
  UNIQUE KEY `uk_unit_role_user_unit_role` (`id_user`,`id_unit`,`id_role`),
  KEY `idx_unit_role_user` (`id_user`),
  KEY `idx_unit_role_unit` (`id_unit`),
  KEY `idx_unit_role_role` (`id_role`),
  KEY `idx_unit_role_active` (`is_active`),
  CONSTRAINT `m_unit_role_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `m_user` (`id_user`) ON UPDATE CASCADE,
  CONSTRAINT `m_unit_role_ibfk_2` FOREIGN KEY (`id_unit`) REFERENCES `m_unit` (`id_unit`) ON UPDATE CASCADE,
  CONSTRAINT `m_unit_role_ibfk_3` FOREIGN KEY (`id_role`) REFERENCES `m_role` (`id_role`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: m_module
DROP TABLE IF EXISTS `m_module`;
CREATE TABLE `m_module` (
  `id_module` INT(11) NOT NULL AUTO_INCREMENT,
  `kode_module` VARCHAR(50) NOT NULL,
  `nama_module` VARCHAR(100) NOT NULL,
  `deskripsi` VARCHAR(255) DEFAULT NULL,
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_module`),
  UNIQUE KEY `uk_module_kode` (`kode_module`),
  KEY `idx_module_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: m_access_module
DROP TABLE IF EXISTS `m_access_module`;
CREATE TABLE `m_access_module` (
  `id_access` INT(11) NOT NULL AUTO_INCREMENT,
  `id_role` INT(11) NOT NULL,
  `id_module` INT(11) NOT NULL,
  `can_create` ENUM('Y','N') NOT NULL DEFAULT 'N',
  `can_read` ENUM('Y','N') NOT NULL DEFAULT 'N',
  `can_update` ENUM('Y','N') NOT NULL DEFAULT 'N',
  `can_delete` ENUM('Y','N') NOT NULL DEFAULT 'N',
  `can_approve` ENUM('Y','N') NOT NULL DEFAULT 'N',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_access`),
  UNIQUE KEY `uk_role_module` (`id_role`,`id_module`),
  KEY `idx_access_role` (`id_role`),
  KEY `idx_access_module` (`id_module`),
  CONSTRAINT `m_access_module_ibfk_1` FOREIGN KEY (`id_role`) REFERENCES `m_role` (`id_role`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `m_access_module_ibfk_2` FOREIGN KEY (`id_module`) REFERENCES `m_module` (`id_module`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------------------------------------------------------
-- 3. WORKFLOW STATUS & TRANSAKSI
-- ----------------------------------------------------------------------------

-- Table: m_status
DROP TABLE IF EXISTS `m_status`;
CREATE TABLE `m_status` (
  `id_status` INT(11) NOT NULL AUTO_INCREMENT,
  `id_role` INT(11) DEFAULT NULL,
  `kode_status` VARCHAR(100) NOT NULL,
  `nama_status` VARCHAR(150) NOT NULL,
  `urutan_status` INT(11) NOT NULL DEFAULT 0,
  `id_status_next` INT(11) DEFAULT NULL,
  `id_status_revision` INT(11) DEFAULT NULL,
  `id_status_rejected` INT(11) DEFAULT NULL,
  `is_initial` ENUM('Y','N') NOT NULL DEFAULT 'N',
  `is_final` ENUM('Y','N') NOT NULL DEFAULT 'N',
  `is_active` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_status`),
  UNIQUE KEY `uk_status_kode_status` (`kode_status`),
  KEY `idx_status_nama_status` (`nama_status`),
  KEY `idx_status_id_role` (`id_role`),
  KEY `idx_status_active` (`is_active`),
  CONSTRAINT `m_status_ibfk_1` FOREIGN KEY (`id_role`) REFERENCES `m_role` (`id_role`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: t_lembur
DROP TABLE IF EXISTS `t_lembur`;
CREATE TABLE `t_lembur` (
  `id_lembur` INT(11) NOT NULL AUTO_INCREMENT,
  `id_petugas` INT(11) NOT NULL,
  `id_status` INT(11) NOT NULL,
  `tgl_lembur` DATE NOT NULL,
  `jam_mulai` TIME NOT NULL,
  `jam_selesai` TIME NOT NULL,
  `total_jam` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `keperluan` VARCHAR(1000) NOT NULL,
  `lokasi` VARCHAR(300) DEFAULT NULL,
  `bukti` VARCHAR(500) DEFAULT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_lembur`),
  KEY `idx_lembur_petugas` (`id_petugas`),
  KEY `idx_lembur_status` (`id_status`),
  KEY `idx_lembur_tanggal` (`tgl_lembur`),
  CONSTRAINT `t_lembur_ibfk_1` FOREIGN KEY (`id_petugas`) REFERENCES `m_petugas` (`id_petugas`) ON UPDATE CASCADE,
  CONSTRAINT `t_lembur_ibfk_2` FOREIGN KEY (`id_status`) REFERENCES `m_status` (`id_status`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: t_cuti
DROP TABLE IF EXISTS `t_cuti`;
CREATE TABLE `t_cuti` (
  `id_cuti` INT(11) NOT NULL AUTO_INCREMENT,
  `id_petugas` INT(11) NOT NULL,
  `id_status` INT(11) NOT NULL,
  `no_cuti` VARCHAR(100) NOT NULL,
  `tgl_pengajuan` DATE NOT NULL,
  `jenis_cuti` VARCHAR(100) NOT NULL,
  `perihal` VARCHAR(500) NOT NULL,
  `tgl_mulai` DATE NOT NULL,
  `tgl_selesai` DATE NOT NULL,
  `lama_hari` INT(11) NOT NULL DEFAULT 1,
  `contact_alamat` VARCHAR(500) DEFAULT NULL,
  `pengganti` VARCHAR(150) DEFAULT NULL,
  `kode_divisi` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_cuti`),
  UNIQUE KEY `uk_cuti_no_cuti` (`no_cuti`),
  KEY `idx_cuti_petugas` (`id_petugas`),
  KEY `idx_cuti_status` (`id_status`),
  CONSTRAINT `t_cuti_ibfk_1` FOREIGN KEY (`id_petugas`) REFERENCES `m_petugas` (`id_petugas`) ON UPDATE CASCADE,
  CONSTRAINT `t_cuti_ibfk_2` FOREIGN KEY (`id_status`) REFERENCES `m_status` (`id_status`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: t_log_cuti
DROP TABLE IF EXISTS `t_log_cuti`;
CREATE TABLE `t_log_cuti` (
  `id_log_cuti` INT(11) NOT NULL AUTO_INCREMENT,
  `id_cuti` INT(11) NOT NULL,
  `id_status_sebelum` INT(11) DEFAULT NULL,
  `id_status_sesudah` INT(11) DEFAULT NULL,
  `aksi` ENUM('CREATE','UPDATE','NEXT','REVISION','REJECT','DELETE') NOT NULL,
  `keterangan` VARCHAR(500) DEFAULT NULL,
  `data_sebelum` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data_sebelum`)),
  `data_sesudah` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data_sesudah`)),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_log_cuti`),
  KEY `idx_log_cuti_cuti` (`id_cuti`),
  KEY `idx_log_cuti_aksi` (`aksi`),
  CONSTRAINT `t_log_cuti_ibfk_1` FOREIGN KEY (`id_status_sebelum`) REFERENCES `m_status` (`id_status`) ON UPDATE CASCADE,
  CONSTRAINT `t_log_cuti_ibfk_2` FOREIGN KEY (`id_status_sesudah`) REFERENCES `m_status` (`id_status`) ON UPDATE CASCADE,
  CONSTRAINT `t_log_cuti_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `m_user` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: t_sppd
DROP TABLE IF EXISTS `t_sppd`;
CREATE TABLE `t_sppd` (
  `id_sppd` INT(11) NOT NULL AUTO_INCREMENT,
  `id_petugas` INT(11) NOT NULL,
  `id_status` INT(11) NOT NULL,
  `no_sppd` VARCHAR(100) NOT NULL,
  `kota_tujuan` VARCHAR(150) NOT NULL,
  `maksud_dinas` TEXT NOT NULL,
  `tgl_berangkat` DATE NOT NULL,
  `tgl_kembali` DATE NOT NULL,
  `lama_dinas` INT(11) NOT NULL DEFAULT 1,
  `rp_akomodasi` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `desc_akomodasi` TEXT DEFAULT NULL,
  `rp_transportasi` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `desc_transportasi` TEXT DEFAULT NULL,
  `rp_lain_lain` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `desc_lain_lain` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_sppd`),
  UNIQUE KEY `uk_sppd_no_sppd` (`no_sppd`),
  KEY `idx_sppd_petugas` (`id_petugas`),
  KEY `idx_sppd_status` (`id_status`),
  CONSTRAINT `t_sppd_ibfk_1` FOREIGN KEY (`id_petugas`) REFERENCES `m_petugas` (`id_petugas`) ON UPDATE CASCADE,
  CONSTRAINT `t_sppd_ibfk_2` FOREIGN KEY (`id_status`) REFERENCES `m_status` (`id_status`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: t_ijin
DROP TABLE IF EXISTS `t_ijin`;
CREATE TABLE `t_ijin` (
  `id_ijin` INT(11) NOT NULL AUTO_INCREMENT,
  `id_petugas` INT(11) NOT NULL,
  `id_status` INT(11) NOT NULL,
  `agenda` VARCHAR(500) NOT NULL,
  `tanggal` DATE NOT NULL,
  `tgl_selesai` DATE NOT NULL,
  `foto` VARCHAR(500) DEFAULT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_ijin`),
  KEY `idx_ijin_petugas` (`id_petugas`),
  KEY `idx_ijin_status` (`id_status`),
  CONSTRAINT `t_ijin_ibfk_1` FOREIGN KEY (`id_petugas`) REFERENCES `m_petugas` (`id_petugas`) ON UPDATE CASCADE,
  CONSTRAINT `t_ijin_ibfk_2` FOREIGN KEY (`id_status`) REFERENCES `m_status` (`id_status`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: t_sakit
DROP TABLE IF EXISTS `t_sakit`;
CREATE TABLE `t_sakit` (
  `id_sakit` INT(11) NOT NULL AUTO_INCREMENT,
  `id_petugas` INT(11) NOT NULL,
  `id_status` INT(11) NOT NULL,
  `agenda` VARCHAR(500) NOT NULL,
  `tanggal` DATE NOT NULL,
  `tgl_selesai` DATE NOT NULL,
  `foto` VARCHAR(500) DEFAULT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_sakit`),
  KEY `idx_sakit_petugas` (`id_petugas`),
  KEY `idx_sakit_status` (`id_status`),
  CONSTRAINT `t_sakit_ibfk_1` FOREIGN KEY (`id_petugas`) REFERENCES `m_petugas` (`id_petugas`) ON UPDATE CASCADE,
  CONSTRAINT `t_sakit_ibfk_2` FOREIGN KEY (`id_status`) REFERENCES `m_status` (`id_status`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: t_mutasi
DROP TABLE IF EXISTS `t_mutasi`;
CREATE TABLE `t_mutasi` (
  `id_mutasi` INT(11) NOT NULL AUTO_INCREMENT,
  `id_pegawai` INT(11) NOT NULL,
  `id_unit` INT(11) NOT NULL,
  `start_mutasi` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT(11) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id_mutasi`),
  KEY `idx_mutasi_pegawai` (`id_pegawai`),
  KEY `idx_mutasi_unit` (`id_unit`),
  CONSTRAINT `t_mutasi_ibfk_1` FOREIGN KEY (`id_pegawai`) REFERENCES `m_pegawai` (`id_pegawai`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `t_mutasi_ibfk_2` FOREIGN KEY (`id_unit`) REFERENCES `m_unit` (`id_unit`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
