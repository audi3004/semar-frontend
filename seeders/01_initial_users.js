import bcrypt from "bcryptjs";

// Hashing password default "password123"
const DEFAULT_PASSWORD = "password123";
const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

export const SEED_ROLES = [
  { id_role: 1, kode_role: "SA", nama_role: "SUPERADMIN", level_role: 100, is_super_admin: "Y", is_active: "Y" },
  { id_role: 2, kode_role: "MAKER", nama_role: "MAKER", level_role: 10, is_super_admin: "N", is_active: "Y" },
  { id_role: 3, kode_role: "CHECKER", nama_role: "CHECKER", level_role: 20, is_super_admin: "N", is_active: "Y" },
  { id_role: 4, kode_role: "APP1", nama_role: "APPROVAL_1", level_role: 30, is_super_admin: "N", is_active: "Y" },
  { id_role: 5, kode_role: "APP2", nama_role: "APPROVAL_2", level_role: 40, is_super_admin: "N", is_active: "Y" },
  { id_role: 6, kode_role: "APP3", nama_role: "APPROVAL_3", level_role: 50, is_super_admin: "N", is_active: "Y" }
];

export const SEED_UNITS = [
  { id_unit: 1, level: "UIT", nama_unit: "PLN UIT JBT (Induk)", is_active: "Y" },
  { id_unit: 2, level: "UPT", nama_unit: "PLN UPT Semarang", is_active: "Y" },
  { id_unit: 3, level: "ULTG", nama_unit: "ULTG Semarang Barat", is_active: "Y" },
  { id_unit: 4, level: "GI", nama_unit: "GI 150kV Krapyak", is_active: "Y" }
];

export const SEED_PEGAWAI = [
  { id_pegawai: 1, id_jabatan: 1, id_unit: 4, nip: "SA-001", nama: "Super Admin System", tgl_masuk: "2020-01-01", is_active: "Y" },
  { id_pegawai: 2, id_jabatan: 1, id_unit: 4, nip: "8912345Z", nama: "Budi Santoso (Maker)", tgl_masuk: "2022-03-15", is_active: "Y" },
  { id_pegawai: 3, id_jabatan: 2, id_unit: 4, nip: "8534567X", nama: "Ahmad Dani (Checker)", tgl_masuk: "2018-01-10", is_active: "Y" },
  { id_pegawai: 4, id_jabatan: 3, id_unit: 2, nip: "7823411V", nama: "Ir. Bambang Suto (Approval 1)", tgl_masuk: "2010-02-14", is_active: "Y" },
  { id_pegawai: 5, id_jabatan: 3, id_unit: 2, nip: "9112345W", nama: "Andi Prasetyo (Approval 2)", tgl_masuk: "2019-11-01", is_active: "Y" },
  { id_pegawai: 6, id_jabatan: 4, id_unit: 1, nip: "8876543A", nama: "Hendra Wijaya (Approval 3)", tgl_masuk: "2016-04-12", is_active: "Y" }
];

export const SEED_PETUGAS = [
  { id_petugas: 1, id_unit: 4, id_jabatan: 1, id_gaji: 1, nip: "PTG-001", nama: "Budi Santoso", tgl_masuk: "2022-03-15", is_active: "Y" },
  { id_petugas: 2, id_unit: 4, id_jabatan: 2, id_gaji: 2, nip: "PTG-002", nama: "Ahmad Dani", tgl_masuk: "2018-01-10", is_active: "Y" }
];

export const SEED_USERS = [
  {
    id_user: 1,
    id_pegawai: 1,
    id_petugas: null,
    id_role: 1,
    username: "superadmin",
    password: hashedPassword,
    rawPassword: DEFAULT_PASSWORD,
    email: "superadmin@pln.co.id",
    nama: "Super Admin System",
    nip: "SA-001",
    role: "superadmin",
    kode_role: "SA",
    jabatan: "Administrator System",
    unitUpt: "UPT Semarang",
    unitUltg: "ULTG Semarang",
    garduInduk: "GI Krapyak",
    is_active: "Y"
  },
  {
    id_user: 2,
    id_pegawai: 2,
    id_petugas: 1,
    id_role: 2,
    username: "maker",
    password: hashedPassword,
    rawPassword: DEFAULT_PASSWORD,
    email: "maker@pln.co.id",
    nama: "Budi Santoso (Maker)",
    nip: "8912345Z",
    role: "maker",
    kode_role: "MAKER",
    jabatan: "Teknisi Pemeliharaan GI",
    unitUpt: "UPT Semarang",
    unitUltg: "ULTG Semarang",
    garduInduk: "GI Krapyak",
    is_active: "Y"
  },
  {
    id_user: 3,
    id_pegawai: 3,
    id_petugas: 2,
    id_role: 3,
    username: "checker",
    password: hashedPassword,
    rawPassword: DEFAULT_PASSWORD,
    email: "checker@pln.co.id",
    nama: "Ahmad Dani (Checker)",
    nip: "8534567X",
    role: "checker",
    kode_role: "CHECKER",
    jabatan: "Team Leader (TL) PLN Pemeliharaan GI",
    unitUpt: "UPT Semarang",
    unitUltg: "ULTG Semarang",
    garduInduk: "GI Krapyak",
    is_active: "Y"
  },
  {
    id_user: 4,
    id_pegawai: 4,
    id_petugas: null,
    id_role: 4,
    username: "approval1",
    password: hashedPassword,
    rawPassword: DEFAULT_PASSWORD,
    email: "approval1@pln.co.id",
    nama: "Ir. Bambang Suto (Approval 1)",
    nip: "7823411V",
    role: "approved1",
    kode_role: "APPROVAL_1",
    jabatan: "Manager (MAN) UPT PLN JATENG DIY",
    unitUpt: "UPT Semarang",
    unitUltg: "ULTG Semarang",
    garduInduk: "GI Krapyak",
    is_active: "Y"
  },
  {
    id_user: 5,
    id_pegawai: 5,
    id_petugas: null,
    id_role: 5,
    username: "approval2",
    password: hashedPassword,
    rawPassword: DEFAULT_PASSWORD,
    email: "approval2@pln-es.co.id",
    nama: "Andi Prasetyo (Approval 2)",
    nip: "9112345W",
    role: "approved2",
    kode_role: "APPROVAL_2",
    jabatan: "Team Leader (TL) Electricity Services",
    unitUpt: "UPT Semarang",
    unitUltg: "ULTG Salatiga",
    garduInduk: "GI Ungaran",
    is_active: "Y"
  },
  {
    id_user: 6,
    id_pegawai: 6,
    id_petugas: null,
    id_role: 6,
    username: "approval3",
    password: hashedPassword,
    rawPassword: DEFAULT_PASSWORD,
    email: "approval3@pln-es.co.id",
    nama: "Hendra Wijaya (Approval 3)",
    nip: "8876543A",
    role: "approved3",
    kode_role: "APPROVAL_3",
    jabatan: "Assistant Manager (AMN) Electricity Services",
    unitUpt: "UPT Semarang",
    unitUltg: "ULTG Semarang",
    garduInduk: "GI Tuntang",
    is_active: "Y"
  }
];

export const SEED_UNIT_ROLES = [
  { id_unit_role: 1, id_user: 1, id_unit: 1, id_role: 1, is_active: "Y" },
  { id_unit_role: 2, id_user: 2, id_unit: 4, id_role: 2, is_active: "Y" },
  { id_unit_role: 3, id_user: 3, id_unit: 4, id_role: 3, is_active: "Y" },
  { id_unit_role: 4, id_user: 4, id_unit: 2, id_role: 4, is_active: "Y" },
  { id_unit_role: 5, id_user: 5, id_unit: 2, id_role: 5, is_active: "Y" },
  { id_unit_role: 6, id_user: 6, id_unit: 1, id_role: 6, is_active: "Y" }
];

export function runInitialSeeder() {
  console.log("Seeder initialized for initial users:");
  SEED_USERS.forEach((u) => {
    console.log(`- Username: ${u.username} | Role: ${u.kode_role} | Password: ${u.rawPassword}`);
  });
  return {
    roles: SEED_ROLES,
    units: SEED_UNITS,
    pegawai: SEED_PEGAWAI,
    petugas: SEED_PETUGAS,
    users: SEED_USERS,
    unitRoles: SEED_UNIT_ROLES
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runInitialSeeder();
}
