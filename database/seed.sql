-- ==============================================================================
-- DATABASE SEED SCRIPT FOR SYSTEM E-PRESENSI & WORKFLOW MANAGEMENT
-- Initial Master & Sample Transaction Data
-- ==============================================================================

-- 1. SEED USERS
INSERT INTO users (id, nip, name, email, role, jabatan, unit_upt, unit_ultg, gardu_induk, tgl_lahir, tanggal_masuk, gaji_pokok, avatar_url, password_hash)
VALUES
('usr-1', '8912345Z', 'Budi Santoso', 'budi.santoso@pln.co.id', 'maker', 'Teknisi Pemeliharaan GI', 'UPT Semarang', 'ULTG Semarang', 'GI Krapyak', '1998-03-15', '2022-03-15', 5500000, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '123456'),
('usr-2', '9023456Y', 'Siti Aminah', 'siti.aminah@pln.co.id', 'maker', 'Operator Proteksi Transmisi', 'UPT Semarang', 'ULTG Semarang', 'GI Ungaran', '1999-06-01', '2021-06-01', 5800000, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', '123456'),
('usr-3', '8534567X', 'Ahmad Dani', 'ahmad.dani@pln.co.id', 'checker', 'Team Leader (TL) PLN Pemeliharaan GI', 'UPT Semarang', 'ULTG Semarang', 'GI Krapyak', '1993-01-10', '2018-01-10', 8500000, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '123456'),
('usr-4', '8112344W', 'Rahmat Hidayat', 'rahmat.hidayat@pln.co.id', 'verification', 'Assistant Manager (AMN) PLN Transmisi', 'UPT Semarang', 'ULTG Semarang', 'GI Krapyak', '1990-08-20', '2015-08-20', 12000000, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', '123456'),
('usr-5', '7823411V', 'Ir. Bambang Suto', 'bambang.suto@pln.co.id', 'approved1', 'Manager (MAN) UPT PLN JATENG DIY', 'UPT Semarang', 'ULTG Semarang', 'GI Krapyak', '1985-02-14', '2010-02-14', 18000000, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', '123456'),
('usr-6', '9112345W', 'Andi Prasetyo', 'andi.prasetyo@pln-es.co.id', 'approved2', 'Team Leader (TL) Electricity Services', 'UPT Semarang', 'ULTG Salatiga', 'GI Ungaran', '1994-11-01', '2019-11-01', 8000000, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', '123456'),
('usr-7', '8876543A', 'Hendra Wijaya', 'hendra.wijaya@pln-es.co.id', 'approved3', 'Assistant Manager (AMN) Electricity Services', 'UPT Semarang', 'ULTG Semarang', 'GI Tuntang', '1991-04-12', '2016-04-12', 13500000, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', '123456'),
('usr-8', '9999999ADM', 'Admin Sistem E-PRESENSI', 'admin.epresensi@pln.co.id', 'admin', 'Administrator Pengelola Tenaga Kerja', 'UPT Semarang', 'ULTG Semarang', 'GI Krapyak', '1988-01-01', '2020-01-01', 10000000, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', '123456')
ON CONFLICT (nip) DO NOTHING;

-- 2. SEED SYSTEM SETTINGS
INSERT INTO system_settings (id, max_cuti_tahunan, max_ijin_tahunan, overtime_multiplier_first_hour, overtime_multiplier_subsequent, overtime_multiplier_holiday, overtime_max_hours_per_day, overtime_max_hours_per_month, overtime_salary_divisor)
VALUES (1, 12, 6, 1.5, 2.0, 2.0, 4, 56, 173)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED MASTER HARI LIBUR
INSERT INTO master_hari_libur (id_hpl, tgl_libur, ket_libur, tahun_libur)
VALUES
(1, '2026-01-01', 'Tahun Baru Masehi 2026', 2026),
(2, '2026-05-01', 'Hari Buruh Internasional', 2026),
(3, '2026-08-17', 'Hari Kemerdekaan Republik Indonesia', 2026),
(4, '2026-12-25', 'Hari Raya Natal', 2026)
ON CONFLICT (id_hpl) DO NOTHING;

-- 4. SEED MASTER UPAH DASAR
INSERT INTO master_upah_dasar (id_umk, jenis_wilayah, nama_umk, kab_kota, tahun_umk, nilai_umk)
VALUES
(101, 'Kota', 'UMK Kota Semarang 2026', 'Kota Semarang', 2026, 3450000),
(102, 'Kabupaten', 'UMK Kabupaten Semarang 2026', 'Kab. Semarang', 2026, 2850000),
(103, 'Kota', 'UMK Kota Surakarta 2026', 'Kota Surakarta', 2026, 2500000),
(104, 'Kabupaten', 'UMK Kabupaten Banyumas 2026', 'Kab. Banyumas', 2026, 2300000)
ON CONFLICT (id_umk) DO NOTHING;

-- 5. SEED MASTER KATEGORI LEMBUR
INSERT INTO master_kategori_lembur (id_lembur, kat_lembur, keterangan)
VALUES
(1, 'Pekerjaan Tower & Transmisi', 'Kegiatan pemeliharaan tower & jaringan SUTT/SUTET'),
(2, 'Perbantuan Validasi ROW', 'Pengawasan dan perintisan ruang bebas jaringan transmisi'),
(3, 'Emergency / Pelacakan Gangguan', 'Penanganan cepat gangguan sistem kelistrikan & trip'),
(4, 'Manuver Sistem & Pemeliharaan GI', 'Pengujian peralatan Gardu Induk & manuver beban'),
(5, 'Piket Tanggal Merah / Cuti Pengganti', 'Tugas jaga dinas pada hari libur nasional')
ON CONFLICT (id_lembur) DO NOTHING;

-- 6. SEED MASTER FAKTOR UPAH
INSERT INTO master_faktor_upah (id_tmk, tingkat_tmk, koef_tmk, koef, tmk, pembagi_jam)
VALUES
(1, 'TMK Level 1 (0 - 2 Tahun)', 1, 10, 5, 173),
(2, 'TMK Level 2 (3 - 5 Tahun)', 2, 15, 10, 173),
(3, 'TMK Level 3 (> 5 Tahun)', 3, 20, 15, 173)
ON CONFLICT (id_tmk) DO NOTHING;

-- 7. SEED SUBMISSIONS
INSERT INTO submissions (
    id, nomor_dokumen, type, employee_nip, employee_name, employee_jabatan, unit_upt, unit_ultg, gardu_induk, tanggal_pengajuan,
    tanggal_lembur, jam_mulai, jam_selesai, durasi_jam, kategori_lembur, jenis_pekerjaan, area_group, is_hari_libur, estimasi_biaya_rupiah, kegiatan_detail,
    status, current_approver_role, keterangan
) VALUES (
    'sub-1', 'LMB/2026/07/8912345Z/001', 'lembur', '8912345Z', 'Budi Santoso', 'Teknisi Pemeliharaan GI', 'UPT Semarang', 'ULTG Semarang', 'GI Krapyak', '2026-07-18',
    '2026-07-18', '18:00', '22:00', 4.0, 'Pekerjaan Tower', 'Perbaikan Anomali Pentanahan', 'Area GI', FALSE, 238439, 'Pemeliharaan Darurat Trafo #2 GI Krapyak pasca pengujian berkala unit listrik.',
    'pending_checker', 'checker', 'Pekerjaan Tower - Perbaikan Anomali Pentanahan (4 Jam)'
) ON CONFLICT (id) DO NOTHING;

-- 8. SEED APPROVAL STEPS FOR SUB-1
INSERT INTO approval_steps (submission_id, step_role, step_label, status)
VALUES
('sub-1', 'checker', 'TL PLN (Checker)', 'pending'),
('sub-1', 'verification', 'AMN PLN (Verifikasi)', 'pending'),
('sub-1', 'approved1', 'MAN PLN (Approved 1)', 'pending'),
('sub-1', 'approved2', 'TL ES (Approved 2)', 'pending'),
('sub-1', 'approved3', 'AMN ES (Approved 3)', 'pending');

-- 9. SEED ATTENDANCE
INSERT INTO attendance (id, employee_nip, employee_name, unit, tanggal, jam_masuk, jam_keluar, status, lokasi_checkin)
VALUES
('att-1', '8912345Z', 'Budi Santoso', 'GI Krapyak', '2026-07-21', '07:25', '16:05', 'Hadir', 'GI Krapyak GPS OK'),
('att-2', '9023456Y', 'Siti Aminah', 'ULTG Semarang', '2026-07-21', '-', '-', 'Cuti', '-'),
('att-3', '8534567X', 'Ahmad Dani', 'GI Ungaran', '2026-07-21', '07:15', '-', 'Hadir', 'GI Ungaran GPS OK')
ON CONFLICT (id) DO NOTHING;

-- 10. SEED NOTIFICATIONS
INSERT INTO notifications (id, submission_id, submission_type, title, message, actor_name, actor_role, timestamp, is_read, target_roles_json)
VALUES
('notif-1', 'sub-1', 'lembur', 'Pengajuan Lembur Baru', 'Budi Santoso mengajukan lembur Pemeliharaan Trafo (4 Jam) pada 18 Jul 2026. Menunggu persetujuan Checker (TL PLN).', 'Budi Santoso', 'maker', '2026-07-18 18:05', FALSE, '["checker", "admin"]')
ON CONFLICT (id) DO NOTHING;
