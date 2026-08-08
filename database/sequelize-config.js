/**
 * SEQUELIZE ORM CONFIGURATION & MODELS BINDING
 * Target Database: MariaDB 10.5+ / MySQL 8.0+
 * Client Language: JavaScript (Node.js ES Module / CommonJS)
 */

import { Sequelize, DataTypes } from 'sequelize';

// Initialize Sequelize Instance
export const sequelize = new Sequelize(
  process.env.DB_NAME || 'epresensi_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mariadb', // Compatible with MariaDB & MySQL
    dialectOptions: {
      connectTimeout: 60000,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

// 1. User Model (Master Tenaga Kerja)
export const User = sequelize.define('User', {
  id: { type: DataTypes.STRING(50), primaryKey: true },
  nip: { type: DataTypes.STRING(30), unique: true, allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(150), unique: true, allowNull: false },
  role: { 
    type: DataTypes.ENUM('maker', 'checker', 'verification', 'approved1', 'approved2', 'approved3', 'admin'),
    defaultValue: 'maker'
  },
  jabatan: { type: DataTypes.STRING(150), allowNull: false },
  unitUpt: { type: DataTypes.STRING(100), defaultValue: 'UPT Semarang', field: 'unit_upt' },
  unitUltg: { type: DataTypes.STRING(100), defaultValue: 'ULTG Semarang', field: 'unit_ultg' },
  garduInduk: { type: DataTypes.STRING(100), defaultValue: 'GI Krapyak', field: 'gardu_induk' },
  tglLahir: { type: DataTypes.DATEONLY, field: 'tgl_lahir' },
  tanggalMasuk: { type: DataTypes.DATEONLY, field: 'tanggal_masuk' },
  gajiPokok: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'gaji_pokok' },
  avatarUrl: { type: DataTypes.TEXT, field: 'avatar_url' },
  passwordHash: { type: DataTypes.STRING(255), defaultValue: '123456', field: 'password_hash' },
}, { tableName: 'users' });

// 2. Master Hari Libur / DPL Model
export const MasterHariLibur = sequelize.define('MasterHariLibur', {
  idHpl: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id_hpl' },
  tglLibur: { type: DataTypes.DATEONLY, allowNull: false, field: 'tgl_libur' },
  ketLibur: { type: DataTypes.STRING(255), allowNull: false, field: 'ket_libur' },
  tahunLibur: { type: DataTypes.INTEGER, allowNull: false, field: 'tahun_libur' },
}, { tableName: 'master_hari_libur' });

// 3. Master Upah Dasar / UMK Model
export const MasterUpahDasar = sequelize.define('MasterUpahDasar', {
  idUmk: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id_umk' },
  jenisWilayah: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Kota', field: 'jenis_wilayah' },
  namaUmk: { type: DataTypes.STRING(150), allowNull: false, field: 'nama_umk' },
  kabKota: { type: DataTypes.STRING(150), allowNull: false, field: 'kab_kota' },
  tahunUmk: { type: DataTypes.INTEGER, allowNull: false, field: 'tahun_umk' },
  nilaiUmk: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, field: 'nilai_umk' },
}, { tableName: 'master_upah_dasar' });

// 4. Master Kategori Lembur Model
export const MasterKategoriLembur = sequelize.define('MasterKategoriLembur', {
  idLembur: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id_lembur' },
  katLembur: { type: DataTypes.STRING(255), allowNull: false, field: 'kat_lembur' },
  keterangan: { type: DataTypes.TEXT },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, { tableName: 'master_kategori_lembur' });

// 5. Master Faktor Upah / TMK Model
export const MasterFaktorUpah = sequelize.define('MasterFaktorUpah', {
  idTmk: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id_tmk' },
  tingkatTmk: { type: DataTypes.STRING(150), allowNull: false, field: 'tingkat_tmk' },
  koefTmk: { type: DataTypes.INTEGER, allowNull: false, field: 'koef_tmk' },
  koef: { type: DataTypes.DECIMAL(8, 2), defaultValue: 10, field: 'koef' },
  tmk: { type: DataTypes.DECIMAL(8, 2), defaultValue: 5, field: 'tmk' },
  pembagiJam: { type: DataTypes.INTEGER, defaultValue: 173, field: 'pembagi_jam' },
}, { tableName: 'master_faktor_upah' });

// 6. Submissions Model (Main Workflow Transaction Table)
export const Submission = sequelize.define('Submission', {
  id: { type: DataTypes.STRING(50), primaryKey: true },
  nomorDokumen: { type: DataTypes.STRING(100), unique: true, allowNull: false, field: 'nomor_dokumen' },
  type: { type: DataTypes.ENUM('lembur', 'cuti', 'sppd', 'ijin', 'sakit'), allowNull: false },
  employeeNip: { type: DataTypes.STRING(30), allowNull: false, field: 'employee_nip' },
  employeeName: { type: DataTypes.STRING(150), allowNull: false, field: 'employee_name' },
  employeeJabatan: { type: DataTypes.STRING(150), allowNull: false, field: 'employee_jabatan' },
  unitUpt: { type: DataTypes.STRING(100), allowNull: false, field: 'unit_upt' },
  unitUltg: { type: DataTypes.STRING(100), allowNull: false, field: 'unit_ultg' },
  garduInduk: { type: DataTypes.STRING(100), allowNull: false, field: 'gardu_induk' },
  tanggalPengajuan: { type: DataTypes.DATEONLY, allowNull: false, field: 'tanggal_pengajuan' },
  status: { type: DataTypes.STRING(50), defaultValue: 'draft' },
  currentApproverRole: { type: DataTypes.STRING(30), field: 'current_approver_role' },
  keterangan: { type: DataTypes.TEXT },
}, { tableName: 'submissions' });

// 7. Attendance Log Model
export const Attendance = sequelize.define('Attendance', {
  id: { type: DataTypes.STRING(50), primaryKey: true },
  employeeNip: { type: DataTypes.STRING(30), allowNull: false, field: 'employee_nip' },
  employeeName: { type: DataTypes.STRING(150), allowNull: false, field: 'employee_name' },
  unit: { type: DataTypes.STRING(150), allowNull: false },
  tanggal: { type: DataTypes.DATEONLY, allowNull: false },
  jamMasuk: { type: DataTypes.STRING(10), field: 'jam_masuk' },
  jamKeluar: { type: DataTypes.STRING(10), field: 'jam_keluar' },
  status: { type: DataTypes.STRING(50), allowNull: false },
  lokasiCheckin: { type: DataTypes.TEXT, field: 'lokasi_checkin' },
}, { tableName: 'attendance' });

// Association Definitions
User.hasMany(Submission, { foreignKey: 'employeeNip', sourceKey: 'nip' });
Submission.belongsTo(User, { foreignKey: 'employeeNip', targetKey: 'nip' });

User.hasMany(Attendance, { foreignKey: 'employeeNip', sourceKey: 'nip' });
Attendance.belongsTo(User, { foreignKey: 'employeeNip', targetKey: 'nip' });

export default {
  sequelize,
  User,
  MasterHariLibur,
  MasterUpahDasar,
  MasterKategoriLembur,
  MasterFaktorUpah,
  Submission,
  Attendance,
};
