-- ==============================================================================
-- DATABASE SCHEMA MIGRATION SCRIPT FOR DIGITAL WORKFORCE MANAGEMENT
-- Target Database: MariaDB 10.5+ / MySQL 8.0+
-- Target Platform: PT PLN Electricity Services - Unit Pelaksana 2 JATENG & DIY
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. MASTER TABLES (Data Master Platform)
-- ------------------------------------------------------------------------------

-- Master Users / Employees (Tabel Master Tenaga Kerja / User Systems)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    nip VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role ENUM('maker', 'checker', 'verification', 'approved1', 'approved2', 'approved3', 'admin') NOT NULL DEFAULT 'maker',
    jabatan VARCHAR(150) NOT NULL,
    unit_upt VARCHAR(100) NOT NULL DEFAULT 'UPT Semarang',
    unit_ultg VARCHAR(100) NOT NULL DEFAULT 'ULTG Semarang',
    gardu_induk VARCHAR(100) NOT NULL DEFAULT 'GI Krapyak',
    tgl_lahir DATE NULL,
    tanggal_masuk DATE NULL,
    gaji_pokok DECIMAL(15, 2) DEFAULT 0.00,
    avatar_url TEXT NULL,
    password_hash VARCHAR(255) DEFAULT '123456',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_nip (nip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Master Unit UPT (Unit Pelaksana Transmisi)
CREATE TABLE IF NOT EXISTS master_unit_upt (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_upt VARCHAR(30) NOT NULL UNIQUE,
    nama_upt VARCHAR(150) NOT NULL,
    alamat TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Master Unit ULTG (Unit Layanan Transmisi & Gardu Induk)
CREATE TABLE IF NOT EXISTS master_unit_ultg (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_upt VARCHAR(30) NOT NULL,
    kode_ultg VARCHAR(30) NOT NULL UNIQUE,
    nama_ultg VARCHAR(150) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Master Gardu Induk (GI)
CREATE TABLE IF NOT EXISTS master_gardu_induk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_ultg VARCHAR(30) NOT NULL,
    kode_gi VARCHAR(30) NOT NULL UNIQUE,
    nama_gi VARCHAR(150) NOT NULL,
    kapasitas_mva VARCHAR(50) NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Master Hari Libur / Tanggal Merah (Master DPL)
CREATE TABLE IF NOT EXISTS master_hari_libur (
    id_hpl INT AUTO_INCREMENT PRIMARY KEY,
    tgl_libur DATE NOT NULL,
    ket_libur VARCHAR(255) NOT NULL,
    tahun_libur INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hpl_tahun (tahun_libur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Master Upah Dasar / UMK Kabupaten & Kota
CREATE TABLE IF NOT EXISTS master_upah_dasar (
    id_umk INT AUTO_INCREMENT PRIMARY KEY,
    jenis_wilayah VARCHAR(50) NOT NULL DEFAULT 'Kota',
    nama_umk VARCHAR(150) NOT NULL,
    kab_kota VARCHAR(150) NOT NULL,
    tahun_umk INT NOT NULL,
    nilai_umk DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_umk_tahun (tahun_umk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Master Kategori Lembur & Pekerjaan
CREATE TABLE IF NOT EXISTS master_kategori_lembur (
    id_lembur INT AUTO_INCREMENT PRIMARY KEY,
    kat_lembur VARCHAR(255) NOT NULL,
    keterangan TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Master Faktor Upah / Koefisien Lembur (TMK)
CREATE TABLE IF NOT EXISTS master_faktor_upah (
    id_tmk INT AUTO_INCREMENT PRIMARY KEY,
    tingkat_tmk VARCHAR(150) NOT NULL,
    koef_tmk INT NOT NULL,
    koef DECIMAL(8, 2) NOT NULL DEFAULT 10.00,
    tmk DECIMAL(8, 2) NOT NULL DEFAULT 5.00,
    pembagi_jam INT NOT NULL DEFAULT 173,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Settings & Operational Limits Configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    max_cuti_tahunan INT DEFAULT 12,
    max_ijin_tahunan INT DEFAULT 6,
    overtime_multiplier_first_hour DECIMAL(4, 2) DEFAULT 1.50,
    overtime_multiplier_subsequent DECIMAL(4, 2) DEFAULT 2.00,
    overtime_multiplier_holiday DECIMAL(4, 2) DEFAULT 2.00,
    overtime_max_hours_per_day INT DEFAULT 4,
    overtime_max_hours_per_month INT DEFAULT 56,
    overtime_salary_divisor INT DEFAULT 173,
    max_foto_size_kb INT DEFAULT 25,
    max_file_size_kb INT DEFAULT 250,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------------------------
-- 2. TRANSACTIONAL TABLES (Data Transaksi & Workflow Submission)
-- ------------------------------------------------------------------------------

-- Main Submissions Table (Lembur, Cuti, SPPD, Ijin, Sakit)
CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(50) PRIMARY KEY,
    nomor_dokumen VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('lembur', 'cuti', 'sppd', 'ijin', 'sakit') NOT NULL,
    employee_nip VARCHAR(30) NOT NULL,
    employee_name VARCHAR(150) NOT NULL,
    employee_jabatan VARCHAR(150) NOT NULL,
    unit_upt VARCHAR(100) NOT NULL,
    unit_ultg VARCHAR(100) NOT NULL,
    gardu_induk VARCHAR(100) NOT NULL,
    tanggal_pengajuan DATE NOT NULL,
    
    -- Specific fields for Lembur
    tanggal_lembur DATE NULL,
    jam_mulai VARCHAR(10) NULL,
    jam_selesai VARCHAR(10) NULL,
    durasi_jam DECIMAL(5, 2) NULL,
    jumlah_jam_koreksi DECIMAL(5, 2) NULL,
    catatan_koreksi TEXT NULL,
    kategori_lembur VARCHAR(150) NULL,
    jenis_pekerjaan VARCHAR(150) NULL,
    area_group VARCHAR(150) NULL,
    is_hari_libur TINYINT(1) DEFAULT 0,
    estimasi_biaya_rupiah DECIMAL(15, 2) DEFAULT 0.00,
    kegiatan_detail TEXT NULL,
    petugas_pendamping_nip VARCHAR(30) NULL,
    petugas_pendamping_nama VARCHAR(150) NULL,
    foto_dokumentasi_1_url LONGTEXT NULL, -- File upload max 25kB/250kB encoded/URL
    foto_dokumentasi_2_url LONGTEXT NULL,
    dasar_perintah_lembur_url LONGTEXT NULL,

    -- Specific fields for Cuti
    cuti_type VARCHAR(100) NULL,
    tanggal_mulai DATE NULL,
    tanggal_selesai DATE NULL,
    jumlah_hari INT NULL,
    sisa_cuti_sebelumnya INT NULL,
    sisa_cuti_sesudahnya INT NULL,
    alamat_selama_cuti TEXT NULL,
    nomor_telepon_darurat VARCHAR(50) NULL,

    -- Specific fields for SPPD
    nomor_surat_tugas VARCHAR(100) NULL,
    maksud_perjalanan TEXT NULL,
    kota_asal VARCHAR(100) NULL,
    kota_tujuan VARCHAR(100) NULL,
    tanggal_berangkat DATE NULL,
    tanggal_kembali DATE NULL,
    durasi_hari INT NULL,
    beban_anggaran_unit VARCHAR(150) NULL,
    total_estimasi_biaya DECIMAL(15, 2) DEFAULT 0.00,

    -- Specific fields for Ijin
    ijin_reason_type VARCHAR(150) NULL,
    jumlah_hari_disetujui INT NULL,

    -- Specific fields for Sakit
    instansi_klinik VARCHAR(150) NULL,
    nama_dokter VARCHAR(150) NULL,
    surat_keterangan_dokter_url LONGTEXT NULL,
    surat_keterangan_dokter_type VARCHAR(50) NULL,
    surat_keterangan_dokter_name VARCHAR(150) NULL,
    diagnosa_singkat TEXT NULL,

    -- Workflow Common Metadata
    maker_signature_url LONGTEXT NULL,
    keterangan TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    current_approver_role VARCHAR(30) NULL,
    rejection_reason TEXT NULL,
    revision_note TEXT NULL,
    revised_by_role VARCHAR(30) NULL,
    revised_by_name VARCHAR(150) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_nip) REFERENCES users(nip) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_submissions_type (type),
    INDEX idx_submissions_nip (employee_nip),
    INDEX idx_submissions_status (status),
    INDEX idx_submissions_approver (current_approver_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SPPD Expenses Detail Items (Breakdown Komponen Biaya SPPD)
CREATE TABLE IF NOT EXISTS sppd_expenses (
    id VARCHAR(50) PRIMARY KEY,
    submission_id VARCHAR(50) NOT NULL,
    deskripsi VARCHAR(255) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    nominal DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_sppd_exp_sub (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Approval Steps Trackers (Matriks 6-Tingkat Persetujuan)
CREATE TABLE IF NOT EXISTS approval_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id VARCHAR(50) NOT NULL,
    step_role VARCHAR(30) NOT NULL,
    step_label VARCHAR(100) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    action_by_name VARCHAR(150) NULL,
    action_by_nip VARCHAR(30) NULL,
    action_date DATETIME NULL,
    notes TEXT NULL,
    signature_url LONGTEXT NULL,

    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_approval_steps_sub (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Check-in Logs (E-Presensi Log)
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(50) PRIMARY KEY,
    employee_nip VARCHAR(30) NOT NULL,
    employee_name VARCHAR(150) NOT NULL,
    unit VARCHAR(150) NOT NULL,
    tanggal DATE NOT NULL,
    jam_masuk VARCHAR(10) NULL,
    jam_keluar VARCHAR(10) NULL,
    status VARCHAR(50) NOT NULL,
    lokasi_checkin TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_nip) REFERENCES users(nip) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_attendance_nip_date (employee_nip, tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Notifications Logs
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    submission_id VARCHAR(50) NULL,
    submission_type VARCHAR(30) NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    actor_name VARCHAR(150) NULL,
    actor_role VARCHAR(30) NULL,
    timestamp VARCHAR(50) NULL,
    is_read TINYINT(1) DEFAULT 0,
    target_roles_json TEXT NULL,
    target_nip VARCHAR(30) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_target (target_nip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
