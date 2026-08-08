export const DATABASE_SCHEMAS = [
  {
    name: "m_status",
    alias: "Master Status Workflow & Approval",
    category: "Master",
    description: "Tabel master status workflow pengajuan (Draft, Diajukan, Approved, Rejected, Selesai).",
    columns: [
      { name: "id_status", type: "INT(11)", oracleType: "NUMBER(11)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Status" },
      { name: "kode_status", type: "VARCHAR(50)", oracleType: "VARCHAR2(50)", isPk: false, isFk: false, nullable: false, description: "Kode Status Unik (DRAFT, SUBMITTED, APPROVED_SPV, REJECTED, dll)" },
      { name: "nama_status", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Label Status Display" },
      { name: "deskripsi", type: "VARCHAR(255)", oracleType: "VARCHAR2(255)", isPk: false, isFk: false, nullable: true, description: "Deskripsi Tahapan Status" },
      { name: "is_active", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'Y'", description: "Status Keaktifan Status" }
    ]
  },
  {
    name: "t_log_cuti",
    alias: "Log History Hak & Pemakaian Cuti",
    category: "HR & Cuti",
    description: "Tabel pencatatan alokasi jatah cuti tahunan, cuti terpakai, dan sisa saldo cuti pegawai.",
    columns: [
      { name: "id_log_cuti", type: "INT(11)", oracleType: "NUMBER(11)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Log Cuti" },
      { name: "id_pegawai", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_pegawai.id_pegawai", nullable: false, description: "Foreign Key ID Pegawai" },
      { name: "tahun", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: false, nullable: false, description: "Tahun Periode Cuti" },
      { name: "jatah_cuti", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: false, nullable: false, defaultVal: "12", description: "Jatah Hak Cuti Tahunan (Hari)" },
      { name: "terpakai", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: false, nullable: false, defaultVal: "0", description: "Cuti Terpakai (Hari)" },
      { name: "sisa_cuti", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: false, nullable: false, defaultVal: "12", description: "Sisa Saldo Cuti (Hari)" },
      { name: "keterangan", type: "VARCHAR(255)", oracleType: "VARCHAR2(255)", isPk: false, isFk: false, nullable: true, description: "Keterangan Penyesuaian Saldo Cuti" }
    ]
  },
  {
    name: "m_role",
    alias: "Master Role & Level Hak Akses",
    category: "Master",
    description: "Tabel master hirarki role dan kewenangan hak akses pengguna sistem.",
    columns: [
      { name: "id_role", type: "INT(11)", oracleType: "NUMBER(11)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Role" },
      { name: "kode_role", type: "VARCHAR(50)", oracleType: "VARCHAR2(50)", isPk: false, isFk: false, nullable: false, description: "Kode Role Unik (ADMIN, MAKER, CHECKER, dll)" },
      { name: "nama_role", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Jabatan/Kewenangan Role" },
      { name: "level_role", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: false, nullable: false, defaultVal: "0", description: "Tingkat Hirarki Role" },
      { name: "is_super_admin", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'N'", description: "Flag Super Admin" },
      { name: "is_active", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'Y'", description: "Status Keaktifan Role" }
    ]
  },
  {
    name: "koef_tmk",
    alias: "Master Koefisien TMK (Masa Kerja)",
    category: "Master",
    description: "Tabel koefisien pengali tingkat masa kerja (TMK) tenaga kerja PLN.",
    columns: [
      { name: "id_koef_tmk", type: "INT(11)", oracleType: "NUMBER(11)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Koef TMK" },
      { name: "masa_kerja", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Kategori Masa Kerja (misal: 0 - 2 Tahun)" },
      { name: "koef", type: "DECIMAL(8,4)", oracleType: "NUMBER(8,4)", isPk: false, isFk: false, nullable: false, defaultVal: "0.0000", description: "Nilai Koefisien (%)" },
      { name: "tmk", type: "DECIMAL(8,4)", oracleType: "NUMBER(8,4)", isPk: false, isFk: false, nullable: false, defaultVal: "0.0000", description: "Nilai TMK (%)" },
      { name: "is_active", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'Y'", description: "Status Keaktifan" }
    ]
  },
  {
    name: "m_project",
    alias: "Master Project / Kontrak Pekerjaan",
    category: "Master",
    description: "Tabel master untuk menyimpan unit project dan klasifikasi pekerjaan PLN.",
    columns: [
      { name: "id_project", type: "INT(10)", oracleType: "NUMBER(10)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Project" },
      { name: "nama_project", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama project / paket pekerjaan PLN" }
    ]
  },
  {
    name: "m_jabatan",
    alias: "Master Jabatan Pegawai",
    category: "Master",
    description: "Tabel master data struktur jabatan tenaga kerja operasional.",
    columns: [
      { name: "id_jabatan", type: "INT(10)", oracleType: "NUMBER(10)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Jabatan" },
      { name: "nama_jabatan", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Jabatan (misal: Dispatcher, Operator GI, Teknisi Utilitas)" },
      { name: "id_project", type: "INT(10)", oracleType: "NUMBER(10)", isPk: false, isFk: true, fkRef: "m_project.id_project", nullable: false, description: "Foreign Key ID Project" }
    ]
  },
  {
    name: "m_umk",
    alias: "Master Upah Minimum Regional / Dasar",
    category: "Master",
    description: "Tabel acuan nominal UMK / Upah Dasar regional wilayah Jateng & DIY.",
    columns: [
      { name: "id_umk", type: "INT(4)", oracleType: "NUMBER(4)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID UMK" },
      { name: "jenis_wilayah", type: "VARCHAR(20)", oracleType: "VARCHAR2(20)", isPk: false, isFk: false, nullable: false, defaultVal: "'Kota'", description: "Jenis Wilayah (Provinsi / Kota / Kabupaten)" },
      { name: "tahun_umk", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: false, nullable: false, description: "Tahun berlaku UMK (misal: 2026)" },
      { name: "nominal_umk", type: "BIGINT", oracleType: "NUMBER(20)", isPk: false, isFk: false, nullable: false, description: "Nominal Upah Minimum Regional (Rupiah)" },
      { name: "active", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'Y'", description: "Status Keaktifan UMK" }
    ]
  },
  {
    name: "m_faktor_upah",
    alias: "Master Faktor Upah / Koefisien Lembur (TMK)",
    category: "Master",
    description: "Tabel acuan tingkat masa kerja (TMK), koefisien pengali (KOEF) dan pembagi jam lembur.",
    columns: [
      { name: "id_tmk", type: "INT(4)", oracleType: "NUMBER(4)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID TMK" },
      { name: "tingkat_tmk", type: "VARCHAR(150)", oracleType: "VARCHAR2(150)", isPk: false, isFk: false, nullable: false, description: "Kategori / Level Masa Kerja" },
      { name: "koef_tmk", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: false, nullable: false, description: "Faktor Koefisien Masa Kerja" },
      { name: "koef", type: "DECIMAL(8,2)", oracleType: "NUMBER(8,2)", isPk: false, isFk: false, nullable: false, description: "KOEF (%)" },
      { name: "tmk", type: "DECIMAL(8,2)", oracleType: "NUMBER(8,2)", isPk: false, isFk: false, nullable: false, description: "TMK (%)" },
      { name: "pembagi_jam", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: false, nullable: false, description: "Pembagi Jam Standar (misal: 173)" },
      { name: "id_project", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_project.id_project", nullable: true, description: "Foreign Key Proyek Kerja (m_project)" }
    ]
  },
  {
    name: "m_hari_libur",
    alias: "Master Hari Libur Nasional (DPL)",
    category: "Master",
    description: "Tabel acuan tanggal-tanggal hari libur nasional untuk validasi pengerjaan siaga lembur.",
    columns: [
      { name: "id_hpl", type: "INT(10)", oracleType: "NUMBER(10)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Hari Libur" },
      { name: "tgl_libur", type: "DATEONLY", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Libur Nasional (YYYY-MM-DD)" },
      { name: "ket_libur", type: "VARCHAR(255)", oracleType: "VARCHAR2(255)", isPk: false, isFk: false, nullable: false, description: "Keterangan / Deskripsi Hari Libur Nasional" },
      { name: "tahun_libur", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: false, nullable: false, description: "Tahun berlaku libur (misal: 2026)" }
    ]
  },
  {
    name: "m_gaji",
    alias: "Master Gaji & Komponen",
    category: "Master",
    description: "Tabel pengait acuan gaji berdasarkan UMK dan tahun berlaku.",
    columns: [
      { name: "id_gaji", type: "INT(4)", oracleType: "NUMBER(4)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Gaji" },
      { name: "id_umk", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_umk.id_umk", nullable: false, description: "Foreign Key ID UMK" },
      { name: "tahun_umk", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: false, nullable: false, description: "Tahun acuan penetapan gaji" }
    ]
  },
  {
    name: "m_unit",
    alias: "Master Unit Struktural PLN (UIT/UPT/ULTG/GI)",
    category: "Master",
    description: "Hierarki lokasi unit operasional PLN (UIT, UPT, ULTG, Gardu Induk).",
    columns: [
      { name: "id_unit_uit", type: "INT(4)", oracleType: "NUMBER(4)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Unit UIT (Level Induk)" },
      { name: "id_unit_upt", type: "INT(8)", oracleType: "NUMBER(8)", isPk: false, isFk: false, nullable: false, description: "Kode Identifikasi UPT" },
      { name: "id_unit_ultg", type: "INT(12)", oracleType: "NUMBER(12)", isPk: false, isFk: false, nullable: false, description: "Kode Identifikasi ULTG" },
      { name: "id_unit_gi", type: "INT(16)", oracleType: "NUMBER(16)", isPk: false, isFk: false, nullable: false, description: "Kode Identifikasi Gardu Induk" },
      { name: "uit", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Unit Induk Transmisi (UIT)" },
      { name: "upt", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Unit Pelaksana Transmisi (UPT)" },
      { name: "ultg", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Unit Layanan Transmisi & GI (ULTG)" },
      { name: "gardu_induk", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Lokasi Gardu Induk (GI)" },
      { name: "id_gaji", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_gaji.id_gaji", nullable: false, description: "Foreign Key Skema Gaji Unit" }
    ]
  },
  {
    name: "m_petugas",
    alias: "Master Data Petugas Operasional",
    category: "Master",
    description: "Tabel master data petugas operasional penugasan dan pengayoman kerja.",
    columns: [
      { name: "id_petugas", type: "INT(11)", oracleType: "NUMBER(11)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Petugas" },
      { name: "id_unit", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_unit.id_unit", nullable: false, description: "Foreign Key ID Unit" },
      { name: "id_jabatan", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_jabatan.id_jabatan", nullable: true, description: "Foreign Key ID Jabatan" },
      { name: "id_gaji", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_gaji.id_gaji", nullable: false, description: "Foreign Key ID Gaji Pokok" },
      { name: "nip", type: "VARCHAR(50)", oracleType: "VARCHAR2(50)", isPk: false, isFk: false, nullable: false, description: "NIP Unik Petugas" },
      { name: "nama", type: "VARCHAR(150)", oracleType: "VARCHAR2(150)", isPk: false, isFk: false, nullable: false, description: "Nama Lengkap Petugas" },
      { name: "tgl_masuk", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Masuk Petugas" },
      { name: "is_active", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'Y'", description: "Status Keaktifan" }
    ]
  },
  {
    name: "m_user",
    alias: "Master Account User System",
    category: "Master",
    description: "Tabel akun kredensial login dan pemetaan relasi user ke pegawai/petugas.",
    columns: [
      { name: "id_user", type: "INT(11)", oracleType: "NUMBER(11)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID User" },
      { name: "id_pegawai", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_pegawai.id_pegawai", nullable: true, description: "Foreign Key Pegawai Terkait" },
      { name: "id_petugas", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_petugas.id_petugas", nullable: true, description: "Foreign Key Petugas Terkait" },
      { name: "id_role", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_role.id_role", nullable: false, description: "Foreign Key Primary Role" },
      { name: "username", type: "VARCHAR(50)", oracleType: "VARCHAR2(50)", isPk: false, isFk: false, nullable: false, description: "Username Unik" },
      { name: "password", type: "VARCHAR(255)", oracleType: "VARCHAR2(255)", isPk: false, isFk: false, nullable: false, description: "Password Hash" },
      { name: "email", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: true, description: "Alamat Email" },
      { name: "is_active", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'Y'", description: "Status Keaktifan User" }
    ]
  },
  {
    name: "m_unit_role",
    alias: "Pemetaan Otoritas Unit & Role User",
    category: "Master",
    description: "Tabel otoritas penugasan role user pada unit kerja tertentu.",
    columns: [
      { name: "id_unit_role", type: "INT(11)", oracleType: "NUMBER(11)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Unit Role" },
      { name: "id_user", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_user.id_user", nullable: false, description: "Foreign Key User" },
      { name: "id_unit", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_unit.id_unit", nullable: false, description: "Foreign Key Unit Kerja" },
      { name: "id_role", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_role.id_role", nullable: false, description: "Foreign Key Role Otoritas" },
      { name: "is_active", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'Y'", description: "Status Keaktifan" }
    ]
  },
  {
    name: "m_module",
    alias: "Master Modul Aplikasi",
    category: "Master",
    description: "Daftar seluruh modul aplikasi dan fitur sistem.",
    columns: [
      { name: "id_module", type: "INT(11)", oracleType: "NUMBER(11)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Module" },
      { name: "kode_module", type: "VARCHAR(50)", oracleType: "VARCHAR2(50)", isPk: false, isFk: false, nullable: false, description: "Kode Modul Unik" },
      { name: "nama_module", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Fitur/Modul Sistem" },
      { name: "deskripsi", type: "VARCHAR(255)", oracleType: "VARCHAR2(255)", isPk: false, isFk: false, nullable: true, description: "Deskripsi Kegunaan Modul" },
      { name: "is_active", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'Y'", description: "Status Keaktifan" }
    ]
  },
  {
    name: "m_access_module",
    alias: "Matriks Hak Akses Modul per Role",
    category: "Master",
    description: "Tabel matriks ijin operasi CRUD & Approve modul berdasarkan role pengguna.",
    columns: [
      { name: "id_access", type: "INT(11)", oracleType: "NUMBER(11)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Access" },
      { name: "id_role", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_role.id_role", nullable: false, description: "Foreign Key Role" },
      { name: "id_module", type: "INT(11)", oracleType: "NUMBER(11)", isPk: false, isFk: true, fkRef: "m_module.id_module", nullable: false, description: "Foreign Key Module" },
      { name: "can_create", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'N'", description: "Ijin Tambah Data" },
      { name: "can_read", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'N'", description: "Ijin Lihat Data" },
      { name: "can_update", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'N'", description: "Ijin Ubah Data" },
      { name: "can_delete", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'N'", description: "Ijin Hapus Data" },
      { name: "can_approve", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'N'", description: "Ijin Persetujuan/Approval" }
    ]
  },
  {
    name: "m_pegawai",
    alias: "Master Data Pegawai / Tenaga Kerja (TK)",
    category: "Master",
    description: "Tabel utama menyimpan biodata dan status tenaga kerja PLN UP2.",
    columns: [
      { name: "id_pegawai", type: "INT(4)", oracleType: "NUMBER(4)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Pegawai (Auto Increment)" },
      { name: "nip", type: "VARCHAR(12)", oracleType: "VARCHAR2(12)", isPk: false, isFk: false, nullable: false, description: "Nomor Induk Pegawai (NIP/NIPSP)" },
      { name: "nama", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Lengkap Pegawai" },
      { name: "tgl_masuk", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Masuk Kerja (Acuan Cuti Tahunan)" },
      { name: "id_jabatan", type: "INT(10)", oracleType: "NUMBER(10)", isPk: false, isFk: true, fkRef: "m_jabatan.id_jabatan", nullable: false, description: "Foreign Key Jabatan" },
      { name: "id_unit_uit", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_unit.id_unit_uit", nullable: false, description: "Foreign Key Unit Induk" },
      { name: "id_unit_upt", type: "INT(8)", oracleType: "NUMBER(8)", isPk: false, isFk: false, nullable: false, description: "ID UPT penempatan" },
      { name: "id_unit_ultg", type: "INT(12)", oracleType: "NUMBER(12)", isPk: false, isFk: false, nullable: false, description: "ID ULTG penempatan" },
      { name: "id_unit_gi", type: "INT(16)", oracleType: "NUMBER(16)", isPk: false, isFk: false, nullable: false, description: "ID Gardu Induk penempatan" },
      { name: "id_mutasi", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "t_mutasi.id_mutasi", nullable: true, description: "Foreign Key Status Mutasi Terakhir (Nullable)" },
      { name: "active", type: "ENUM('Y','N')", oracleType: "VARCHAR2(1)", isPk: false, isFk: false, nullable: false, defaultVal: "'Y'", description: "Status Aktif Pegawai" }
    ]
  },
  {
    name: "m_approver",
    alias: "Master Pejabat / Approver PLN",
    category: "Master",
    description: "Daftar pejabat struktural penanggung jawab persetujuan presensi.",
    columns: [
      { name: "id_app", type: "INT(4)", oracleType: "NUMBER(4)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Approver" },
      { name: "id_unit_uit", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: false, nullable: false, description: "ID Unit UIT" },
      { name: "id_unit_upt", type: "INT(8)", oracleType: "NUMBER(8)", isPk: false, isFk: false, nullable: false, description: "ID Unit UPT" },
      { name: "id_unit_ultg", type: "INT(12)", oracleType: "NUMBER(12)", isPk: false, isFk: false, nullable: false, description: "ID Unit ULTG" },
      { name: "id_unit_gi", type: "INT(16)", oracleType: "NUMBER(16)", isPk: false, isFk: false, nullable: false, description: "ID Gardu Induk" },
      { name: "nip_peg", type: "INT(10)", oracleType: "NUMBER(10)", isPk: false, isFk: false, nullable: false, description: "NIP Pejabat Penyetuju" },
      { name: "nama_peg", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Lengkap Pejabat Penyetuju" },
      { name: "start_aktif", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Mulai Berlaku Jabatan Approval" },
      { name: "end_aktif", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Selesai Masa Berlaku Approval" }
    ]
  },
  {
    name: "t_mutasi",
    alias: "Transaksi Mutasi Pegawai",
    category: "HR & Mutasi",
    description: "Riwayat pemindahan unit / rotasi kerja pegawai.",
    columns: [
      { name: "id_mutasi", type: "INT(4)", oracleType: "NUMBER(4)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Mutasi" },
      { name: "id_pegawai", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_pegawai.id_pegawai", nullable: false, description: "Foreign Key Pegawai Dimutasi" },
      { name: "start_mutasi", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Efektif Mutasi" },
      { name: "id_unit_upt", type: "INT(8)", oracleType: "NUMBER(8)", isPk: false, isFk: false, nullable: false, description: "ID UPT Tujuan" },
      { name: "id_unit_ultg", type: "INT(12)", oracleType: "NUMBER(12)", isPk: false, isFk: false, nullable: false, description: "ID ULTG Tujuan" },
      { name: "id_unit_gi", type: "INT(16)", oracleType: "NUMBER(16)", isPk: false, isFk: false, nullable: false, description: "ID GI Tujuan" }
    ]
  },
  {
    name: "log_mutasi",
    alias: "Log History Mutasi & Perubahan Jabatan Pegawai",
    category: "HR & Mutasi",
    description: "Tabel log simpanan riwayat unit asal, unit tujuan, dan posisi sebelumnya (non-aktif di log, aktif di PegawaiPage).",
    columns: [
      { name: "id_log", type: "INT(10)", oracleType: "NUMBER(10)", isPk: true, isFk: false, nullable: false, description: "Primary Key ID Log Mutasi" },
      { name: "id_mutasi", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "t_mutasi.id_mutasi", nullable: true, description: "Foreign Key ID Mutasi Terkait" },
      { name: "id_pegawai", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_pegawai.id_pegawai", nullable: false, description: "Foreign Key Pegawai Dimutasi" },
      { name: "nip", type: "VARCHAR(12)", oracleType: "VARCHAR2(12)", isPk: false, isFk: false, nullable: false, description: "NIP Pegawai" },
      { name: "nama", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Lengkap Pegawai" },
      { name: "tgl_mutasi", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Efektif Mutasi (TMT)" },
      { name: "old_upt", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: true, description: "UPT Asal / Lama" },
      { name: "old_ultg", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: true, description: "ULTG Asal / Lama" },
      { name: "old_gi", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: true, description: "Gardu Induk Asal / Lama" },
      { name: "old_role", type: "VARCHAR(50)", oracleType: "VARCHAR2(50)", isPk: false, isFk: false, nullable: true, description: "Role Sistem Lama" },
      { name: "new_upt", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "UPT Tujuan / Baru" },
      { name: "new_ultg", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "ULTG Tujuan / Baru" },
      { name: "new_gi", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Gardu Induk Tujuan / Baru" },
      { name: "new_role", type: "VARCHAR(50)", oracleType: "VARCHAR2(50)", isPk: false, isFk: false, nullable: true, description: "Role Sistem Baru" },
      { name: "status", type: "ENUM('AKTIF','NON_AKTIF')", oracleType: "VARCHAR2(10)", isPk: false, isFk: false, nullable: false, defaultVal: "'NON_AKTIF'", description: "Status History Record (NON_AKTIF di log_mutasi, AKTIF di PegawaiPage)" }
    ]
  },
  {
    name: "t_lembur",
    alias: "Transaksi Surat Perintah Lembur (SPL)",
    category: "Transaksi",
    description: "Pencatatan jam kerja lembur dan perhitungan biaya rupiah.",
    columns: [
      { name: "id_lembur", type: "INT(10)", oracleType: "NUMBER(10)", isPk: true, isFk: false, nullable: false, description: "Primary Key SPL" },
      { name: "id_pegawai", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_pegawai.id_pegawai", nullable: false, description: "Foreign Key Pegawai Lembur" },
      { name: "id_app", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_approver.id_app", nullable: false, description: "Foreign Key Approver PLN" },
      { name: "tgl_lembur", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Pelaksanaan Lembur" },
      { name: "jam_mulai", type: "TIME", oracleType: "TIMESTAMP", isPk: false, isFk: false, nullable: false, description: "Jam Mulai Kerja Lembur" },
      { name: "jam_selesai", type: "TIME", oracleType: "TIMESTAMP", isPk: false, isFk: false, nullable: false, description: "Jam Selesai Kerja Lembur" },
      { name: "total_jam", type: "DECIMAL(4,2)", oracleType: "NUMBER(4,2)", isPk: false, isFk: false, nullable: false, description: "Total Durasi Jam Lembur" },
      { name: "nominal_biaya", type: "BIGINT", oracleType: "NUMBER(20)", isPk: false, isFk: false, nullable: false, description: "Kalkulasi Biaya Lembur (Rp)" },
      { name: "pekerjaan", type: "TEXT", oracleType: "VARCHAR2(1000)", isPk: false, isFk: false, nullable: false, description: "Deskripsi Uraian Pekerjaan Lembur" },
      { name: "status", type: "ENUM('PENDING','APPROVED','REJECTED')", oracleType: "VARCHAR2(20)", isPk: false, isFk: false, nullable: false, defaultVal: "'PENDING'", description: "Status Persetujuan" },
      { name: "id_jenis", type: "VARCHAR(12)", oracleType: "VARCHAR2(12)", isPk: false, isFk: true, fkRef: "m_jenis_lembur.id_jenis", nullable: true, description: "Foreign Key Jenis Lembur & Pekerjaan" }
    ]
  },
  {
    name: "t_cuti",
    alias: "Transaksi Pengajuan Cuti Pegawai",
    category: "Transaksi",
    description: "Pencatatan permohonan cuti tahunan / alasan khusus.",
    columns: [
      { name: "id_cuti", type: "INT(10)", oracleType: "NUMBER(10)", isPk: true, isFk: false, nullable: false, description: "Primary Key Cuti" },
      { name: "id_pegawai", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_pegawai.id_pegawai", nullable: false, description: "Foreign Key Pegawai" },
      { name: "id_app", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_approver.id_app", nullable: false, description: "Foreign Key Approver" },
      { name: "jenis_cuti", type: "VARCHAR(50)", oracleType: "VARCHAR2(50)", isPk: false, isFk: false, nullable: false, description: "Kategori Cuti (Tahunan, Besar, Melahirkan, Alasan Penting)" },
      { name: "tgl_mulai", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Mulai Cuti" },
      { name: "tgl_selesai", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Selesai Cuti" },
      { name: "jumlah_hari", type: "INT(3)", oracleType: "NUMBER(3)", isPk: false, isFk: false, nullable: false, description: "Jumlah Hari Kerja Cuti" },
      { name: "alamat_cuti", type: "VARCHAR(255)", oracleType: "VARCHAR2(255)", isPk: false, isFk: false, nullable: false, description: "Alamat Selama Jalani Cuti" },
      { name: "telepon_darurat", type: "VARCHAR(20)", oracleType: "VARCHAR2(20)", isPk: false, isFk: false, nullable: false, description: "No HP Darurat Bisa Dihubungi" },
      { name: "status", type: "ENUM('PENDING','APPROVED','REJECTED')", oracleType: "VARCHAR2(20)", isPk: false, isFk: false, nullable: false, defaultVal: "'PENDING'", description: "Status Approval" }
    ]
  },
  {
    name: "t_ijin",
    alias: "Transaksi Permohonan Ijin Non-Cuti",
    category: "Transaksi",
    description: "Permohonan ijin tidak masuk karena alasan tertentu.",
    columns: [
      { name: "id_ijin", type: "INT(10)", oracleType: "NUMBER(10)", isPk: true, isFk: false, nullable: false, description: "Primary Key Ijin" },
      { name: "id_pegawai", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_pegawai.id_pegawai", nullable: false, description: "Foreign Key Pegawai" },
      { name: "id_app", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_approver.id_app", nullable: false, description: "Foreign Key Approver" },
      { name: "alasan_ijin", type: "VARCHAR(150)", oracleType: "VARCHAR2(150)", isPk: false, isFk: false, nullable: false, description: "Kategori Alasan Ijin" },
      { name: "tgl_mulai", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Mulai Ijin" },
      { name: "tgl_selesai", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Selesai Ijin" },
      { name: "jumlah_hari", type: "INT(3)", oracleType: "NUMBER(3)", isPk: false, isFk: false, nullable: false, description: "Durasi Hari Ijin" },
      { name: "keterangan", type: "TEXT", oracleType: "VARCHAR2(500)", isPk: false, isFk: false, nullable: false, description: "Detail Penjelasan Ijin" },
      { name: "status", type: "ENUM('PENDING','APPROVED','REJECTED')", oracleType: "VARCHAR2(20)", isPk: false, isFk: false, nullable: false, defaultVal: "'PENDING'", description: "Status Approval" }
    ]
  },
  {
    name: "t_sakit",
    alias: "Transaksi Laporan Sakit & Surat Dokter",
    category: "Transaksi",
    description: "Pencatatan ketidakhadiran karena sakit beserta bukti dokumen.",
    columns: [
      { name: "id_sakit", type: "INT(10)", oracleType: "NUMBER(10)", isPk: true, isFk: false, nullable: false, description: "Primary Key Sakit" },
      { name: "id_pegawai", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_pegawai.id_pegawai", nullable: false, description: "Foreign Key Pegawai" },
      { name: "id_app", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_approver.id_app", nullable: false, description: "Foreign Key Approver" },
      { name: "diagnosa", type: "VARCHAR(150)", oracleType: "VARCHAR2(150)", isPk: false, isFk: false, nullable: false, description: "Diagnosa Penyakit / Keterangan Dokter" },
      { name: "tgl_mulai", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Mulai Istirahat Sakit" },
      { name: "tgl_selesai", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Selesai Istirahat Sakit" },
      { name: "jumlah_hari", type: "INT(3)", oracleType: "NUMBER(3)", isPk: false, isFk: false, nullable: false, description: "Total Hari Sakit" },
      { name: "file_surat_dokter", type: "VARCHAR(255)", oracleType: "VARCHAR2(255)", isPk: false, isFk: false, nullable: true, description: "Path/URL Lampiran Surat Dokter" },
      { name: "status", type: "ENUM('PENDING','APPROVED','REJECTED')", oracleType: "VARCHAR2(20)", isPk: false, isFk: false, nullable: false, defaultVal: "'APPROVED'", description: "Status Verifikasi" }
    ]
  },
  {
    name: "t_sppd",
    alias: "Transaksi Surat Perintah Perjalanan Dinas (SPPD)",
    category: "Transaksi",
    description: "Pencatatan penugasan dinas ke luar kota / luar unit.",
    columns: [
      { name: "id_sppd", type: "INT(10)", oracleType: "NUMBER(10)", isPk: true, isFk: false, nullable: false, description: "Primary Key SPPD" },
      { name: "id_pegawai", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_pegawai.id_pegawai", nullable: false, description: "Foreign Key Pegawai Tugas Dinas" },
      { name: "id_app", type: "INT(4)", oracleType: "NUMBER(4)", isPk: false, isFk: true, fkRef: "m_approver.id_app", nullable: false, description: "Foreign Key Pejabat Pemberi Tugas" },
      { name: "no_sppd", type: "VARCHAR(50)", oracleType: "VARCHAR2(50)", isPk: false, isFk: false, nullable: false, description: "Nomor Surat SPPD Resmi PLN" },
      { name: "kota_tujuan", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Kota / Lokasi Tujuan Perjalanan" },
      { name: "maksud_dinas", type: "TEXT", oracleType: "VARCHAR2(1000)", isPk: false, isFk: false, nullable: false, description: "Tujuan / Agenda Kegiatan Perjalanan Dinas" },
      { name: "tgl_berangkat", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Keberangkatan" },
      { name: "tgl_kembali", type: "DATE", oracleType: "DATE", isPk: false, isFk: false, nullable: false, description: "Tanggal Kepulangan" },
      { name: "lama_dinas", type: "INT(3)", oracleType: "NUMBER(3)", isPk: false, isFk: false, nullable: false, description: "Lama Perjalanan (Hari)" },
      { name: "status", type: "ENUM('PENDING','APPROVED','REJECTED')", oracleType: "VARCHAR2(20)", isPk: false, isFk: false, nullable: false, defaultVal: "'PENDING'", description: "Status Persetujuan SPPD" }
    ]
  },
  {
    name: "m_jenis_lembur",
    alias: "Master Jenis & Detail Pekerjaan Lembur",
    category: "Master",
    description: "Tabel acuan jenis lembur, detail pekerjaan, kebutuhan pegawai pengganti, deskripsi dan bukti pelaksanaan lembur.",
    columns: [
      { name: "id_jenis", type: "VARCHAR(12)", oracleType: "VARCHAR2(12)", isPk: true, isFk: false, nullable: false, description: "Primary Key Kode Detail Jenis Pekerjaan" },
      { name: "id_lembur", type: "VARCHAR(12)", oracleType: "VARCHAR2(12)", isPk: false, isFk: false, nullable: false, description: "Kode Pengelompokan Jenis Lembur Utama" },
      { name: "jenis_lembur", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Kategori Lembur Utama" },
      { name: "jenis_pekerjaan", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Nama Detail Pekerjaan Lembur" },
      { name: "pegawai_pengganti", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Syarat/Kebutuhan Pegawai Pengganti" },
      { name: "deskripsi", type: "VARCHAR(255)", oracleType: "VARCHAR2(255)", isPk: false, isFk: false, nullable: false, description: "Deskripsi format/ketentuan detail kegiatan" },
      { name: "evidence", type: "VARCHAR(100)", oracleType: "VARCHAR2(100)", isPk: false, isFk: false, nullable: false, description: "Jenis bukti pelaksanaan / laporan wajib" }
    ]
  }
];
export const ERD_RELATIONS = [
  { fromTable: "m_project", fromCol: "id_project", toTable: "m_jabatan", toCol: "id_project", type: "1:N", description: "Satu project dapat menampung banyak jenis jabatan pekerjaan." },
  { fromTable: "m_umk", fromCol: "id_umk", toTable: "m_gaji", toCol: "id_umk", type: "1:N", description: "Acuan UMK regional digunakan pada skema penetapan gaji." },
  { fromTable: "m_gaji", fromCol: "id_gaji", toTable: "m_unit", toCol: "id_gaji", type: "1:N", description: "Setiap unit operasional PLN terikat pada satu kelompok UMK/Gaji." },
  { fromTable: "m_jabatan", fromCol: "id_jabatan", toTable: "m_pegawai", toCol: "id_jabatan", type: "1:N", description: "Pegawai mengacu pada satu jabatan spesifik." },
  { fromTable: "m_unit", fromCol: "id_unit_uit", toTable: "m_pegawai", toCol: "id_unit_uit", type: "1:N", description: "Pegawai bertugas pada unit operasional PLN." },
  { fromTable: "t_mutasi", fromCol: "id_mutasi", toTable: "m_pegawai", toCol: "id_mutasi", type: "1:1", description: "Status mutasi aktif pegawai mengacu pada tabel t_mutasi." },
  { fromTable: "m_pegawai", fromCol: "id_pegawai", toTable: "t_mutasi", toCol: "id_pegawai", type: "1:N", description: "Satu pegawai memiliki rekam jejak riwayat mutasi." },
  { fromTable: "t_mutasi", fromCol: "id_mutasi", toTable: "log_mutasi", toCol: "id_mutasi", type: "1:N", description: "Setiap mutasi mencatat riwayat ke tabel log_mutasi." },
  { fromTable: "m_pegawai", fromCol: "id_pegawai", toTable: "t_lembur", toCol: "id_pegawai", type: "1:N", description: "Pegawai dapat mengajukan banyak Surat Perintah Lembur." },
  { fromTable: "m_approver", fromCol: "id_app", toTable: "t_lembur", toCol: "id_app", type: "1:N", description: "Pejabat PLN memvalidasi lembur pegawai." },
  { fromTable: "m_pegawai", fromCol: "id_pegawai", toTable: "t_cuti", toCol: "id_pegawai", type: "1:N", description: "Pegawai dapat mengajukan permohonan cuti." },
  { fromTable: "m_approver", fromCol: "id_app", toTable: "t_cuti", toCol: "id_app", type: "1:N", description: "Approver menyetujui/menolak pengajuan cuti." },
  { fromTable: "m_pegawai", fromCol: "id_pegawai", toTable: "t_ijin", toCol: "id_pegawai", type: "1:N", description: "Pegawai dapat mengajukan ijin tidak masuk kerja." },
  { fromTable: "m_approver", fromCol: "id_app", toTable: "t_ijin", toCol: "id_app", type: "1:N", description: "Approver menyetujui/menolak ijin pegawai." },
  { fromTable: "m_pegawai", fromCol: "id_pegawai", toTable: "t_sakit", toCol: "id_pegawai", type: "1:N", description: "Pegawai melaporkan ketidakhadiran sakit." },
  { fromTable: "m_approver", fromCol: "id_app", toTable: "t_sakit", toCol: "id_app", type: "1:N", description: "Approver memverifikasi laporan sakit." },
  { fromTable: "m_pegawai", fromCol: "id_pegawai", toTable: "t_sppd", toCol: "id_pegawai", type: "1:N", description: "Pegawai melaksanakan perjalanan dinas SPPD." },
  { fromTable: "m_approver", fromCol: "id_app", toTable: "t_sppd", toCol: "id_app", type: "1:N", description: "Pejabat menyetujui surat tugas perjalanan dinas." },
  { fromTable: "m_jenis_lembur", fromCol: "id_jenis", toTable: "t_lembur", toCol: "id_jenis", type: "1:N", description: "Transaksi lembur mengacu pada tipe pekerjaan dan ketentuan laporan di m_jenis_lembur." }
];
export const MYSQL_MARIADB_DDL_SQL = `-- ==============================================================================
-- DATABASE SCHEMA DDL SCRIPT (MariaDB / MySQL 8.0 Compatible)
-- Aplikasi E-Presensi Kinerja & Kehadiran Pegawai PLN UP2 JATENG & DIY
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Master Project
CREATE TABLE IF NOT EXISTS \`m_project\` (
  \`id_project\` INT(10) NOT NULL AUTO_INCREMENT,
  \`nama_project\` VARCHAR(100) NOT NULL,
  PRIMARY KEY (\`id_project\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Master Jabatan
CREATE TABLE IF NOT EXISTS \`m_jabatan\` (
  \`id_jabatan\` INT(10) NOT NULL AUTO_INCREMENT,
  \`nama_jabatan\` VARCHAR(100) NOT NULL,
  \`id_project\` INT(10) NOT NULL,
  PRIMARY KEY (\`id_jabatan\`),
  KEY \`idx_jabatan_project\` (\`id_project\`),
  CONSTRAINT \`fk_jabatan_project\` FOREIGN KEY (\`id_project\`) REFERENCES \`m_project\` (\`id_project\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Master Upah Dasar (UMK)
CREATE TABLE IF NOT EXISTS \`m_umk\` (
  \`id_umk\` INT(4) NOT NULL AUTO_INCREMENT,
  \`jenis_wilayah\` VARCHAR(20) NOT NULL DEFAULT 'Kota',
  \`tahun_umk\` INT(4) NOT NULL,
  \`nominal_umk\` BIGINT NOT NULL,
  \`active\` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  PRIMARY KEY (\`id_umk\`),
  KEY \`idx_umk_tahun_active\` (\`tahun_umk\`, \`active\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Master Gaji
CREATE TABLE IF NOT EXISTS \`m_gaji\` (
  \`id_gaji\` INT(4) NOT NULL AUTO_INCREMENT,
  \`id_umk\` INT(4) NOT NULL,
  \`tahun_umk\` INT(4) NOT NULL,
  PRIMARY KEY (\`id_gaji\`),
  KEY \`idx_gaji_umk\` (\`id_umk\`),
  CONSTRAINT \`fk_gaji_umk\` FOREIGN KEY (\`id_umk\`) REFERENCES \`m_umk\` (\`id_umk\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Master Unit (UIT / UPT / ULTG / GI)
CREATE TABLE IF NOT EXISTS \`m_unit\` (
  \`id_unit_uit\` INT(4) NOT NULL AUTO_INCREMENT,
  \`id_unit_upt\` INT(8) NOT NULL,
  \`id_unit_ultg\` INT(12) NOT NULL,
  \`id_unit_gi\` INT(16) NOT NULL,
  \`uit\` VARCHAR(100) NOT NULL,
  \`upt\` VARCHAR(100) NOT NULL,
  \`ultg\` VARCHAR(100) NOT NULL,
  \`gardu_induk\` VARCHAR(100) NOT NULL,
  \`id_gaji\` INT(4) NOT NULL,
  PRIMARY KEY (\`id_unit_uit\`),
  KEY \`idx_unit_gaji\` (\`id_gaji\`),
  KEY \`idx_unit_upt_ultg_gi\` (\`id_unit_upt\`, \`id_unit_ultg\`, \`id_unit_gi\`),
  CONSTRAINT \`fk_unit_gaji\` FOREIGN KEY (\`id_gaji\`) REFERENCES \`m_gaji\` (\`id_gaji\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Master Mutasi Pegawai
CREATE TABLE IF NOT EXISTS \`t_mutasi\` (
  \`id_mutasi\` INT(4) NOT NULL AUTO_INCREMENT,
  \`id_pegawai\` INT(4) NOT NULL,
  \`start_mutasi\` DATE NOT NULL,
  \`id_unit_upt\` INT(8) NOT NULL,
  \`id_unit_ultg\` INT(12) NOT NULL,
  \`id_unit_gi\` INT(16) NOT NULL,
  PRIMARY KEY (\`id_mutasi\`),
  KEY \`idx_mutasi_pegawai\` (\`id_pegawai\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Master Pegawai
CREATE TABLE IF NOT EXISTS \`m_pegawai\` (
  \`id_pegawai\` INT(4) NOT NULL AUTO_INCREMENT,
  \`nip\` VARCHAR(12) NOT NULL,
  \`nama\` VARCHAR(100) NOT NULL,
  \`tgl_masuk\` DATE NOT NULL,
  \`id_jabatan\` INT(10) NOT NULL,
  \`id_unit_uit\` INT(4) NOT NULL,
  \`id_unit_upt\` INT(8) NOT NULL,
  \`id_unit_ultg\` INT(12) NOT NULL,
  \`id_unit_gi\` INT(16) NOT NULL,
  \`id_mutasi\` INT(4) DEFAULT NULL,
  \`active\` ENUM('Y','N') NOT NULL DEFAULT 'Y',
  PRIMARY KEY (\`id_pegawai\`),
  UNIQUE KEY \`uk_pegawai_nip\` (\`nip\`),
  KEY \`idx_pegawai_jabatan\` (\`id_jabatan\`),
  KEY \`idx_pegawai_unit\` (\`id_unit_uit\`),
  KEY \`idx_pegawai_mutasi\` (\`id_mutasi\`),
  CONSTRAINT \`fk_pegawai_jabatan\` FOREIGN KEY (\`id_jabatan\`) REFERENCES \`m_jabatan\` (\`id_jabatan\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT \`fk_pegawai_unit\` FOREIGN KEY (\`id_unit_uit\`) REFERENCES \`m_unit\` (\`id_unit_uit\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT \`fk_pegawai_mutasi\` FOREIGN KEY (\`id_mutasi\`) REFERENCES \`t_mutasi\` (\`id_mutasi\`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cyclic FK reference for t_mutasi -> m_pegawai
ALTER TABLE \`t_mutasi\` 
  ADD CONSTRAINT \`fk_mutasi_pegawai\` FOREIGN KEY (\`id_pegawai\`) REFERENCES \`m_pegawai\` (\`id_pegawai\`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Master Approver PLN
CREATE TABLE IF NOT EXISTS \`m_approver\` (
  \`id_app\` INT(4) NOT NULL AUTO_INCREMENT,
  \`id_unit_uit\` INT(4) NOT NULL,
  \`id_unit_upt\` INT(8) NOT NULL,
  \`id_unit_ultg\` INT(12) NOT NULL,
  \`id_unit_gi\` INT(16) NOT NULL,
  \`nip_peg\` INT(10) NOT NULL,
  \`nama_peg\` VARCHAR(100) NOT NULL,
  \`start_aktif\` DATE NOT NULL,
  \`end_aktif\` DATE NOT NULL,
  PRIMARY KEY (\`id_app\`),
  KEY \`idx_approver_nip\` (\`nip_peg\`),
  KEY \`idx_approver_periode\` (\`start_aktif\`, \`end_aktif\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Transaksi Lembur
CREATE TABLE IF NOT EXISTS \`t_lembur\` (
  \`id_lembur\` INT(10) NOT NULL AUTO_INCREMENT,
  \`id_pegawai\` INT(4) NOT NULL,
  \`id_app\` INT(4) NOT NULL,
  \`tgl_lembur\` DATE NOT NULL,
  \`jam_mulai\` TIME NOT NULL,
  \`jam_selesai\` TIME NOT NULL,
  \`total_jam\` DECIMAL(4,2) NOT NULL,
  \`nominal_biaya\` BIGINT NOT NULL DEFAULT 0,
  \`pekerjaan\` TEXT NOT NULL,
  \`status\` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (\`id_lembur\`),
  KEY \`idx_lembur_pegawai\` (\`id_pegawai\`),
  KEY \`idx_lembur_app\` (\`id_app\`),
  KEY \`idx_lembur_tgl_status\` (\`tgl_lembur\`, \`status\`),
  CONSTRAINT \`fk_lembur_pegawai\` FOREIGN KEY (\`id_pegawai\`) REFERENCES \`m_pegawai\` (\`id_pegawai\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_lembur_app\` FOREIGN KEY (\`id_app\`) REFERENCES \`m_approver\` (\`id_app\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Transaksi Cuti
CREATE TABLE IF NOT EXISTS \`t_cuti\` (
  \`id_cuti\` INT(10) NOT NULL AUTO_INCREMENT,
  \`id_pegawai\` INT(4) NOT NULL,
  \`id_app\` INT(4) NOT NULL,
  \`jenis_cuti\` VARCHAR(50) NOT NULL,
  \`tgl_mulai\` DATE NOT NULL,
  \`tgl_selesai\` DATE NOT NULL,
  \`jumlah_hari\` INT(3) NOT NULL,
  \`alamat_cuti\` VARCHAR(255) NOT NULL,
  \`telepon_darurat\` VARCHAR(20) NOT NULL,
  \`status\` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (\`id_cuti\`),
  KEY \`idx_cuti_pegawai\` (\`id_pegawai\`),
  KEY \`idx_cuti_app\` (\`id_app\`),
  KEY \`idx_cuti_periode\` (\`tgl_mulai\`, \`tgl_selesai\`),
  CONSTRAINT \`fk_cuti_pegawai\` FOREIGN KEY (\`id_pegawai\`) REFERENCES \`m_pegawai\` (\`id_pegawai\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_cuti_app\` FOREIGN KEY (\`id_app\`) REFERENCES \`m_approver\` (\`id_app\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Transaksi Ijin
CREATE TABLE IF NOT EXISTS \`t_ijin\` (
  \`id_ijin\` INT(10) NOT NULL AUTO_INCREMENT,
  \`id_pegawai\` INT(4) NOT NULL,
  \`id_app\` INT(4) NOT NULL,
  \`alasan_ijin\` VARCHAR(150) NOT NULL,
  \`tgl_mulai\` DATE NOT NULL,
  \`tgl_selesai\` DATE NOT NULL,
  \`jumlah_hari\` INT(3) NOT NULL,
  \`keterangan\` TEXT NOT NULL,
  \`status\` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (\`id_ijin\`),
  KEY \`idx_ijin_pegawai\` (\`id_pegawai\`),
  KEY \`idx_ijin_app\` (\`id_app\`),
  CONSTRAINT \`fk_ijin_pegawai\` FOREIGN KEY (\`id_pegawai\`) REFERENCES \`m_pegawai\` (\`id_pegawai\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_ijin_app\` FOREIGN KEY (\`id_app\`) REFERENCES \`m_approver\` (\`id_app\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Transaksi Sakit
CREATE TABLE IF NOT EXISTS \`t_sakit\` (
  \`id_sakit\` INT(10) NOT NULL AUTO_INCREMENT,
  \`id_pegawai\` INT(4) NOT NULL,
  \`id_app\` INT(4) NOT NULL,
  \`diagnosa\` VARCHAR(150) NOT NULL,
  \`tgl_mulai\` DATE NOT NULL,
  \`tgl_selesai\` DATE NOT NULL,
  \`jumlah_hari\` INT(3) NOT NULL,
  \`file_surat_dokter\` VARCHAR(255) DEFAULT NULL,
  \`status\` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'APPROVED',
  PRIMARY KEY (\`id_sakit\`),
  KEY \`idx_sakit_pegawai\` (\`id_pegawai\`),
  KEY \`idx_sakit_app\` (\`id_app\`),
  CONSTRAINT \`fk_sakit_pegawai\` FOREIGN KEY (\`id_pegawai\`) REFERENCES \`m_pegawai\` (\`id_pegawai\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_sakit_app\` FOREIGN KEY (\`id_app\`) REFERENCES \`m_approver\` (\`id_app\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Transaksi SPPD
CREATE TABLE IF NOT EXISTS \`t_sppd\` (
  \`id_sppd\` INT(10) NOT NULL AUTO_INCREMENT,
  \`id_pegawai\` INT(4) NOT NULL,
  \`id_app\` INT(4) NOT NULL,
  \`no_sppd\` VARCHAR(50) NOT NULL,
  \`kota_tujuan\` VARCHAR(100) NOT NULL,
  \`maksud_dinas\` TEXT NOT NULL,
  \`tgl_berangkat\` DATE NOT NULL,
  \`tgl_kembali\` DATE NOT NULL,
  \`lama_dinas\` INT(3) NOT NULL,
  \`status\` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (\`id_sppd\`),
  UNIQUE KEY \`uk_sppd_no\` (\`no_sppd\`),
  KEY \`idx_sppd_pegawai\` (\`id_pegawai\`),
  KEY \`idx_sppd_app\` (\`id_app\`),
  CONSTRAINT \`fk_sppd_pegawai\` FOREIGN KEY (\`id_pegawai\`) REFERENCES \`m_pegawai\` (\`id_pegawai\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_sppd_app\` FOREIGN KEY (\`id_app\`) REFERENCES \`m_approver\` (\`id_app\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
`;
export const ORACLE_DDL_SQL = `-- ==============================================================================
-- ORACLE DATABASE SCHEMA DDL SCRIPT (Oracle 19c/21c Compatible)
-- Aplikasi E-Presensi Kinerja & Kehadiran Pegawai PLN UP2 JATENG & DIY
-- ==============================================================================

-- 1. Master Project
CREATE TABLE m_project (
  id_project NUMBER(10) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nama_project VARCHAR2(100) NOT NULL
);

-- 2. Master Jabatan
CREATE TABLE m_jabatan (
  id_jabatan NUMBER(10) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nama_jabatan VARCHAR2(100) NOT NULL,
  id_project NUMBER(10) NOT NULL,
  CONSTRAINT fk_jbt_prj FOREIGN KEY (id_project) REFERENCES m_project(id_project)
);

-- 3. Master Upah Dasar (UMK)
CREATE TABLE m_umk (
  id_umk NUMBER(4) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  jenis_wilayah VARCHAR2(20) DEFAULT 'Kota' NOT NULL,
  tahun_umk NUMBER(4) NOT NULL,
  nominal_umk NUMBER(20) NOT NULL,
  active VARCHAR2(1) DEFAULT 'Y' NOT NULL,
  CONSTRAINT chk_umk_active CHECK (active IN ('Y','N'))
);

-- 4. Master Gaji
CREATE TABLE m_gaji (
  id_gaji NUMBER(4) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_umk NUMBER(4) NOT NULL,
  tahun_umk NUMBER(4) NOT NULL,
  CONSTRAINT fk_gji_umk FOREIGN KEY (id_umk) REFERENCES m_umk(id_umk)
);

-- 5. Master Unit (UIT/UPT/ULTG/GI)
CREATE TABLE m_unit (
  id_unit_uit NUMBER(4) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_unit_upt NUMBER(8) NOT NULL,
  id_unit_ultg NUMBER(12) NOT NULL,
  id_unit_gi NUMBER(16) NOT NULL,
  uit VARCHAR2(100) NOT NULL,
  upt VARCHAR2(100) NOT NULL,
  ultg VARCHAR2(100) NOT NULL,
  gardu_induk VARCHAR2(100) NOT NULL,
  id_gaji NUMBER(4) NOT NULL,
  CONSTRAINT fk_unt_gji FOREIGN KEY (id_gaji) REFERENCES m_gaji(id_gaji)
);

-- 6. Master Mutasi Pegawai (Pre-declare)
CREATE TABLE t_mutasi (
  id_mutasi NUMBER(4) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_pegawai NUMBER(4) NOT NULL,
  start_mutasi DATE NOT NULL,
  id_unit_upt NUMBER(8) NOT NULL,
  id_unit_ultg NUMBER(12) NOT NULL,
  id_unit_gi NUMBER(16) NOT NULL
);

-- 7. Master Pegawai
CREATE TABLE m_pegawai (
  id_pegawai NUMBER(4) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nip VARCHAR2(12) NOT NULL CONSTRAINT uk_pgw_nip UNIQUE,
  nama VARCHAR2(100) NOT NULL,
  tgl_masuk DATE NOT NULL,
  id_jabatan NUMBER(10) NOT NULL,
  id_unit_uit NUMBER(4) NOT NULL,
  id_unit_upt NUMBER(8) NOT NULL,
  id_unit_ultg NUMBER(12) NOT NULL,
  id_unit_gi NUMBER(16) NOT NULL,
  id_mutasi NUMBER(4) NULL,
  active VARCHAR2(1) DEFAULT 'Y' NOT NULL,
  CONSTRAINT chk_pgw_act CHECK (active IN ('Y','N')),
  CONSTRAINT fk_pgw_jbt FOREIGN KEY (id_jabatan) REFERENCES m_jabatan(id_jabatan),
  CONSTRAINT fk_pgw_unt FOREIGN KEY (id_unit_uit) REFERENCES m_unit(id_unit_uit),
  CONSTRAINT fk_pgw_mts FOREIGN KEY (id_mutasi) REFERENCES t_mutasi(id_mutasi)
);

ALTER TABLE t_mutasi ADD CONSTRAINT fk_mts_pgw FOREIGN KEY (id_pegawai) REFERENCES m_pegawai(id_pegawai);

-- 8. Master Approver PLN
CREATE TABLE m_approver (
  id_app NUMBER(4) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_unit_uit NUMBER(4) NOT NULL,
  id_unit_upt NUMBER(8) NOT NULL,
  id_unit_ultg NUMBER(12) NOT NULL,
  id_unit_gi NUMBER(16) NOT NULL,
  nip_peg NUMBER(10) NOT NULL,
  nama_peg VARCHAR2(100) NOT NULL,
  start_aktif DATE NOT NULL,
  end_aktif DATE NOT NULL
);

-- 9. Transaksi Lembur
CREATE TABLE t_lembur (
  id_lembur NUMBER(10) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_pegawai NUMBER(4) NOT NULL,
  id_app NUMBER(4) NOT NULL,
  tgl_lembur DATE NOT NULL,
  jam_mulai TIMESTAMP NOT NULL,
  jam_selesai TIMESTAMP NOT NULL,
  total_jam NUMBER(4,2) NOT NULL,
  nominal_biaya NUMBER(20) DEFAULT 0 NOT NULL,
  pekerjaan VARCHAR2(1000) NOT NULL,
  status VARCHAR2(20) DEFAULT 'PENDING' NOT NULL,
  CONSTRAINT chk_lmb_sts CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  CONSTRAINT fk_lmb_pgw FOREIGN KEY (id_pegawai) REFERENCES m_pegawai(id_pegawai),
  CONSTRAINT fk_lmb_app FOREIGN KEY (id_app) REFERENCES m_approver(id_app)
);

-- 10. Transaksi Cuti
CREATE TABLE t_cuti (
  id_cuti NUMBER(10) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_pegawai NUMBER(4) NOT NULL,
  id_app NUMBER(4) NOT NULL,
  jenis_cuti VARCHAR2(50) NOT NULL,
  tgl_mulai DATE NOT NULL,
  tgl_selesai DATE NOT NULL,
  jumlah_hari NUMBER(3) NOT NULL,
  alamat_cuti VARCHAR2(255) NOT NULL,
  telepon_darurat VARCHAR2(20) NOT NULL,
  status VARCHAR2(20) DEFAULT 'PENDING' NOT NULL,
  CONSTRAINT chk_cut_sts CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  CONSTRAINT fk_cut_pgw FOREIGN KEY (id_pegawai) REFERENCES m_pegawai(id_pegawai),
  CONSTRAINT fk_cut_app FOREIGN KEY (id_app) REFERENCES m_approver(id_app)
);

-- 11. Transaksi Ijin
CREATE TABLE t_ijin (
  id_ijin NUMBER(10) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_pegawai NUMBER(4) NOT NULL,
  id_app NUMBER(4) NOT NULL,
  alasan_ijin VARCHAR2(150) NOT NULL,
  tgl_mulai DATE NOT NULL,
  tgl_selesai DATE NOT NULL,
  jumlah_hari NUMBER(3) NOT NULL,
  keterangan VARCHAR2(500) NOT NULL,
  status VARCHAR2(20) DEFAULT 'PENDING' NOT NULL,
  CONSTRAINT chk_ijn_sts CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  CONSTRAINT fk_ijn_pgw FOREIGN KEY (id_pegawai) REFERENCES m_pegawai(id_pegawai),
  CONSTRAINT fk_ijn_app FOREIGN KEY (id_app) REFERENCES m_approver(id_app)
);

-- 12. Transaksi Sakit
CREATE TABLE t_sakit (
  id_sakit NUMBER(10) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_pegawai NUMBER(4) NOT NULL,
  id_app NUMBER(4) NOT NULL,
  diagnosa VARCHAR2(150) NOT NULL,
  tgl_mulai DATE NOT NULL,
  tgl_selesai DATE NOT NULL,
  jumlah_hari NUMBER(3) NOT NULL,
  file_surat_dokter VARCHAR2(255) NULL,
  status VARCHAR2(20) DEFAULT 'APPROVED' NOT NULL,
  CONSTRAINT chk_skt_sts CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  CONSTRAINT fk_skt_pgw FOREIGN KEY (id_pegawai) REFERENCES m_pegawai(id_pegawai),
  CONSTRAINT fk_skt_app FOREIGN KEY (id_app) REFERENCES m_approver(id_app)
);

-- 13. Transaksi SPPD
CREATE TABLE t_sppd (
  id_sppd NUMBER(10) GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_pegawai NUMBER(4) NOT NULL,
  id_app NUMBER(4) NOT NULL,
  no_sppd VARCHAR2(50) NOT NULL CONSTRAINT uk_spd_no UNIQUE,
  kota_tujuan VARCHAR2(100) NOT NULL,
  maksud_dinas VARCHAR2(1000) NOT NULL,
  tgl_berangkat DATE NOT NULL,
  tgl_kembali DATE NOT NULL,
  lama_dinas NUMBER(3) NOT NULL,
  status VARCHAR2(20) DEFAULT 'PENDING' NOT NULL,
  CONSTRAINT chk_spd_sts CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  CONSTRAINT fk_spd_pgw FOREIGN KEY (id_pegawai) REFERENCES m_pegawai(id_pegawai),
  CONSTRAINT fk_spd_app FOREIGN KEY (id_app) REFERENCES m_approver(id_app)
);
`;
export const MODULAR_FOLDER_STRUCTURE_TEXT = `
\u{1F4C1} pln-epresensi-system/
\u251C\u2500\u2500 \u{1F4C1} backend/                        # Backend REST API (Node.js / Express / TypeScript / TypeORM / Prisma)
\u2502   \u251C\u2500\u2500 \u{1F4C1} src/
\u2502   \u2502   \u251C\u2500\u2500 \u{1F4C1} config/                 # Database Connection & Environment Configs
\u2502   \u2502   \u2502   \u251C\u2500\u2500 database.ts            # MariaDB / MySQL / Oracle Connection Pool
\u2502   \u2502   \u2502   \u2514\u2500\u2500 env.ts                 # Environment variables parser
\u2502   \u2502   \u251C\u2500\u2500 \u{1F4C1} controllers/            # Controller Handlers (HTTP Request/Response)
\u2502   \u2502   \u2502   \u251C\u2500\u2500 PegawaiController.ts   # CRUD & Query Master TK
\u2502   \u2502   \u2502   \u251C\u2500\u2500 UnitController.ts      # Hierarki UIT/UPT/ULTG/GI
\u2502   \u2502   \u2502   \u251C\u2500\u2500 LemburController.ts    # Transaksi SPL & Formula Rupiah
\u2502   \u2502   \u2502   \u251C\u2500\u2500 CutiController.ts      # Validasi Kuota 12 Bulan & Submisi Cuti
\u2502   \u2502   \u2502   \u251C\u2500\u2500 IjinController.ts      # Transaksi Ijin Dinamis
\u2502   \u2502   \u2502   \u251C\u2500\u2500 SakitController.ts     # Upload Surat Dokter & Laporan Sakit
\u2502   \u2502   \u2502   \u2514\u2500\u2500 SppdController.ts      # Penugasan Perjalanan Dinas
\u2502   \u2502   \u251C\u2500\u2500 \u{1F4C1} models/                 # Database Entities / Models (TypeORM / Knex / Sequelize)
\u2502   \u2502   \u2502   \u251C\u2500\u2500 m_pegawai.entity.ts
\u2502   \u2502   \u2502   \u251C\u2500\u2500 m_unit.entity.ts
\u2502   \u2502   \u2502   \u251C\u2500\u2500 m_jabatan.entity.ts
\u2502   \u2502   \u2502   \u251C\u2500\u2500 m_umk.entity.ts
\u2502   \u2502   \u2502   \u251C\u2500\u2500 t_lembur.entity.ts
\u2502   \u2502   \u2502   \u251C\u2500\u2500 t_cuti.entity.ts
\u2502   \u2502   \u2502   \u2514\u2500\u2500 t_sppd.entity.ts
\u2502   \u2502   \u251C\u2500\u2500 \u{1F4C1} services/               # Business Logic & Payroll Calculations
\u2502   \u2502   \u2502   \u251C\u2500\u2500 OvertimeCalculatorService.ts  # Rumus Lembur PLN (1/173 x UMK)
\u2502   \u2502   \u2502   \u251C\u2500\u2500 LeaveAccrualService.ts        # Masa Kerja Pegawai & Sisa Cuti
\u2502   \u2502   \u2502   \u2514\u2500\u2500 ApprovalWorkflowService.ts    # Escalation & Approver Validation
\u2502   \u2502   \u251C\u2500\u2500 \u{1F4C1} middlewares/            # Auth & Validation Middlewares
\u2502   \u2502   \u2502   \u251C\u2500\u2500 authMiddleware.ts
\u2502   \u2502   \u2502   \u2514\u2500\u2500 errorHandler.ts
\u2502   \u2502   \u2514\u2500\u2500 \u{1F4C1} routes/                 # REST API Router Endpoints
\u2502   \u2502       \u251C\u2500\u2500 apiRouter.ts
\u2502   \u2502       \u2514\u2500\u2500 masterRouter.ts
\u2502   \u251C\u2500\u2500 \u{1F4C1} migrations/                 # DDL Migration Scripts (.sql / .ts)
\u2502   \u2514\u2500\u2500 package.json
\u2502
\u2514\u2500\u2500 \u{1F4C1} frontend/                       # React 18 + Vite + Tailwind CSS App
    \u251C\u2500\u2500 \u{1F4C1} src/
    \u2502   \u251C\u2500\u2500 \u{1F4C1} components/             # Reusable UI Components
    \u2502   \u2502   \u251C\u2500\u2500 \u{1F4C1} database/           # Subtab Skema & Dictionary Database
    \u2502   \u2502   \u2502   \u251C\u2500\u2500 DatabaseSchemaViewer.tsx
    \u2502   \u2502   \u2502   \u2514\u2500\u2500 databaseSchemaData.ts
    \u2502   \u2502   \u251C\u2500\u2500 \u{1F4C1} layout/             # Shell, Navbar, Sidebar, MobileNav
    \u2502   \u2502   \u2514\u2500\u2500 \u{1F4C1} common/             # Modals, Badges, Search Inputs
    \u2502   \u251C\u2500\u2500 \u{1F4C1} pages/                  # Page Views
    \u2502   \u2502   \u251C\u2500\u2500 DashboardPage.tsx      # Overview Widget & Trend Analytics
    \u2502   \u2502   \u251C\u2500\u2500 PegawaiPage.tsx        # Master Pegawai & Filter Unit
    \u2502   \u2502   \u251C\u2500\u2500 LemburPage.tsx         # Manajemen Lembur & Formula Rupiah
    \u2502   \u2502   \u251C\u2500\u2500 CutiPage.tsx           # Form Cuti & Digital Canvas Approval
    \u2502   \u2502   \u251C\u2500\u2500 IjinPage.tsx           # Pengajuan Ijin Dinamis
    \u2502   \u2502   \u251C\u2500\u2500 SakitPage.tsx          # Upload Surat Dokter
    \u2502   \u2502   \u251C\u2500\u2500 SppdPage.tsx           # Perjalanan Dinas SPPD
    \u2502   \u2502   \u2514\u2500\u2500 PengaturanPage.tsx     # System Settings & Database Dictionary
    \u2502   \u251C\u2500\u2500 \u{1F4C1} services/               # Client Services & API Proxy
    \u2502   \u2502   \u251C\u2500\u2500 authService.ts
    \u2502   \u2502   \u2514\u2500\u2500 dataService.ts
    \u2502   \u251C\u2500\u2500 \u{1F4C1} types/                  # TypeScript Interface Definitions
    \u2502   \u2502   \u2514\u2500\u2500 index.ts
    \u2502   \u251C\u2500\u2500 App.jsx
    \u2502   \u2514\u2500\u2500 main.jsx
    \u2514\u2500\u2500 package.json
`;
export const BACKEND_CONTROLLER_SAMPLE_CODE = `// ==============================================================================
// BACKEND CONTROLLER SAMPLE (TypeScript Express / Clean Architecture)
// File: backend/src/controllers/LemburController.ts
// ==============================================================================

import { Request, Response } from 'express';
import { OvertimeCalculatorService } from '../services/OvertimeCalculatorService';

export class LemburController {
  
  /**
   * POST /api/lembur/create
   * Membuat transaksi SPL baru dengan kalkulasi otomatis biaya lembur rupiah
   */
  public async createLembur(req: Request, res: Response): Promise<Response> {
    try {
      const { id_pegawai, id_app, tgl_lembur, jam_mulai, jam_selesai, total_jam, pekerjaan } = req.body;

      // 1. Fetch data pegawai beserta UMK regional unitnya
      // SQL JOIN: m_pegawai -> m_unit -> m_gaji -> m_umk
      const pegawaiInfo = await OvertimeCalculatorService.getPegawaiWithUMK(id_pegawai);

      if (!pegawaiInfo) {
        return res.status(404).json({ success: false, message: 'Data Pegawai / UMK tidak ditemukan' });
      }

      // 2. Hitung nominal rupiah lembur sesuai formula PLN
      // Rumus: (1 / 173) * Nominal UMK * Multiplier Jam Kerja
      const nominalRupiah = OvertimeCalculatorService.calculateOvertimeCost({
        nominalUmk: pegawaiInfo.nominal_umk,
        totalHours: total_jam,
        isHoliday: false
      });

      // 3. Insert ke database transaksi t_lembur
      const insertResult = await OvertimeCalculatorService.saveLemburTransaction({
        id_pegawai,
        id_app,
        tgl_lembur,
        jam_mulai,
        jam_selesai,
        total_jam,
        nominal_biaya: nominalRupiah,
        pekerjaan,
        status: 'PENDING'
      });

      return res.status(201).json({
        success: true,
        message: 'Pengajuan Lembur (SPL) berhasil dibuat',
        data: {
          id_lembur: insertResult.id_lembur,
          calculatedCost: nominalRupiah
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
`;
