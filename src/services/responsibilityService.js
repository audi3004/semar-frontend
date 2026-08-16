import { api } from "./api";

const RESPONSIBILITY_STORAGE_KEY = "epresensi_responsibility_matrix";
const USER_RESPONSIBILITY_STORAGE_KEY = "epresensi_user_responsibility_matrix";

export const DEFAULT_ROLE_PERMISSIONS = {
  superadmin: {
    dashboard: true,
    "perintah-kerja-lembur": true,
    lembur: true,
    cuti: true,
    ijin: true,
    sakit: true,
    sppd: true,
    workflow: true,
    "list-dokumen": true,
    "report-permohonan": true,
    "unit-kerja": true,
    project: true,
    jabatan: true,
    pegawai: true,
    umk: true,
    "faktor-upah": true,
    "hari-libur": true,
    "mutasi-pegawai": true,
    users: true,
    roles: true,
    responsibilities: true,
    pengaturan: true
  },
  admin: {
    dashboard: true,
    "perintah-kerja-lembur": true,
    lembur: true,
    cuti: true,
    ijin: true,
    sakit: true,
    sppd: true,
    workflow: true,
    "list-dokumen": true,
    "report-permohonan": true,
    "unit-kerja": true,
    project: true,
    jabatan: true,
    pegawai: true,
    umk: true,
    "faktor-upah": true,
    "hari-libur": true,
    "mutasi-pegawai": true,
    users: true,
    roles: true,
    responsibilities: true,
    pengaturan: true
  },
  maker: {
    dashboard: true,
    "perintah-kerja-lembur": false,
    lembur: true,
    cuti: true,
    ijin: true,
    sakit: true,
    sppd: true,
    workflow: false,
    "list-dokumen": true,
    "report-permohonan": false,
    "unit-kerja": false,
    project: false,
    jabatan: false,
    pegawai: false,
    umk: false,
    "faktor-upah": false,
    "hari-libur": false,
    "mutasi-pegawai": false,
    users: false,
    roles: false,
    responsibilities: false,
    pengaturan: false
  },
  monitoring: {
    dashboard: true,
    "perintah-kerja-lembur": false,
    lembur: false,
    cuti: false,
    ijin: false,
    sakit: false,
    sppd: false,
    workflow: false,
    "list-dokumen": true,
    "report-permohonan": false,
    "unit-kerja": false,
    project: false,
    jabatan: false,
    pegawai: false,
    umk: false,
    "faktor-upah": false,
    "hari-libur": false,
    "mutasi-pegawai": false,
    users: false,
    roles: false,
    responsibilities: false,
    pengaturan: false
  },
  checker: {
    dashboard: true,
    "perintah-kerja-lembur": true,
    lembur: false,
    cuti: false,
    ijin: false,
    sakit: false,
    sppd: false,
    workflow: true,
    "list-dokumen": true,
    "report-permohonan": false,
    "unit-kerja": false,
    project: false,
    jabatan: false,
    pegawai: false,
    umk: false,
    "faktor-upah": false,
    "hari-libur": false,
    "mutasi-pegawai": false,
    users: false,
    roles: false,
    responsibilities: false,
    pengaturan: false
  },
  verification: {
    dashboard: true,
    "perintah-kerja-lembur": false,
    lembur: false,
    cuti: false,
    ijin: false,
    sakit: false,
    sppd: false,
    workflow: true,
    "list-dokumen": true,
    "report-permohonan": false,
    "unit-kerja": false,
    project: false,
    jabatan: false,
    pegawai: false,
    umk: false,
    "faktor-upah": false,
    "hari-libur": false,
    "mutasi-pegawai": false,
    users: false,
    roles: false,
    responsibilities: false,
    pengaturan: false
  },
  approved1: {
    dashboard: true,
    "perintah-kerja-lembur": true,
    lembur: false,
    cuti: false,
    ijin: false,
    sakit: false,
    sppd: false,
    workflow: true,
    "list-dokumen": true,
    "report-permohonan": false,
    "unit-kerja": false,
    project: false,
    jabatan: false,
    pegawai: false,
    umk: false,
    "faktor-upah": false,
    "hari-libur": false,
    "mutasi-pegawai": false,
    users: false,
    roles: false,
    responsibilities: false,
    pengaturan: false
  },
  approved2: {
    dashboard: true,
    "perintah-kerja-lembur": false,
    lembur: false,
    cuti: false,
    ijin: false,
    sakit: false,
    sppd: false,
    workflow: true,
    "list-dokumen": true,
    "report-permohonan": true,
    "unit-kerja": true,
    project: true,
    jabatan: true,
    pegawai: true,
    umk: true,
    "faktor-upah": true,
    "hari-libur": true,
    "mutasi-pegawai": true,
    users: true,
    roles: true,
    responsibilities: true,
    pengaturan: true
  },
  approved3: {
    dashboard: true,
    "perintah-kerja-lembur": false,
    lembur: false,
    cuti: false,
    ijin: false,
    sakit: false,
    sppd: false,
    workflow: true,
    "list-dokumen": true,
    "report-permohonan": true,
    "unit-kerja": true,
    project: true,
    jabatan: true,
    pegawai: true,
    umk: true,
    "faktor-upah": true,
    "hari-libur": true,
    "mutasi-pegawai": true,
    users: true,
    roles: true,
    responsibilities: true,
    pengaturan: true
  }
};

export const MENU_MODULES = [
  { id: "dashboard", name: "Dashboard Analisis & Grafik", category: "Operasional" },
  { id: "lembur", name: "Form Pengajuan Lembur", category: "Operasional" },
  { id: "perintah-kerja-lembur", name: "Surat Perintah Kerja Lembur", category: "Operasional" },
  { id: "cuti", name: "Form Pengajuan Cuti", category: "Operasional" },
  { id: "ijin", name: "Form Pengajuan Ijin", category: "Operasional" },
  { id: "sakit", name: "Form Pengajuan Sakit", category: "Operasional" },
  { id: "sppd", name: "Form Pengajuan SPPD", category: "Operasional" },
  { id: "workflow", name: "Workflow Approval & Verifikasi", category: "Operasional" },
  
  { id: "list-dokumen", name: "List Dokumen Approved", category: "Report & Dokumen" },
  { id: "report-permohonan", name: "Report Permohonan Selesai (Approved 3)", category: "Report & Dokumen" },

  { id: "unit-kerja", name: "Master Unit Kerja (UIT/UPT/ULTG)", category: "Administrator" },
  { id: "project", name: "Master Project & Kontrak", category: "Administrator" },
  { id: "jabatan", name: "Master Jabatan Pegawai", category: "Administrator" },
  { id: "pegawai", name: "Master Pegawai PLN ES", category: "Administrator" },
  { id: "umk", name: "Master UMK Daerah", category: "Administrator" },
  { id: "faktor-upah", name: "Master Faktor Upah (KOEF & TMK)", category: "Administrator" },
  { id: "hari-libur", name: "Master Hari Libur Nasional (DPL)", category: "Administrator" },
  { id: "mutasi-pegawai", name: "Riwayat Mutasi Pegawai", category: "Administrator" },
  { id: "users", name: "Manajemen Akun User", category: "Administrator" },
  { id: "roles", name: "Informasi Role User", category: "Administrator" },
  { id: "responsibilities", name: "Matriks Responsibility & Akses", category: "Administrator" },
  { id: "pengaturan", name: "Pengaturan Sistem", category: "Administrator" }
];

const MODULE_ID_TO_MENU_ID = {
  1: "dashboard",
  3: "project",
  4: "jabatan",
  5: "umk",
  6: "faktor-upah",
  10: "pegawai",
  17: "lembur",
  18: "cuti",
  19: "ijin",
  20: "sakit",
  21: "sppd",
  32: "workflow",
  39: "users",
  40: "roles",
  41: "responsibilities",
  42: "pengaturan",
  43: "list-dokumen",
  44: "report-permohonan",
  45: "unit-kerja",
  46: "hari-libur",
  47: "mutasi-pegawai"
};

const MODULE_CODE_TO_MENU_ID = {
  DASHBOARD: "dashboard",
  PROJECT: "project",
  JABATAN: "jabatan",
  UMK: "umk",
  KOEF_TMK: "faktor-upah",
  PEGAWAI: "pegawai",
  LEMBUR: "lembur",
  PERINTAH_KERJA_LEMBUR: "perintah-kerja-lembur",
  "PERINTAH-KERJA-LEMBUR": "perintah-kerja-lembur",
  CUTI: "cuti",
  IJIN: "ijin",
  SAKIT: "sakit",
  SPPD: "sppd",
  WORKFLOW: "workflow",
  USERS: "users",
  ROLES: "roles",
  RESPONSIBILITIES: "responsibilities",
  PENGATURAN: "pengaturan",
  LIST_DOKUMEN: "list-dokumen",
  REPORT_DOKUMEN: "report-permohonan",
  UNIT_KERJA: "unit-kerja",
  HARI_LIBUR: "hari-libur",
  MUTASI_PEGAWAI: "mutasi-pegawai"
};

const emptyMenuPermissions = () => Object.fromEntries(MENU_MODULES.map(({ id }) => [id, false]));

const isAllowed = (value) => value === true || value === 1 || value === "1" || String(value).toUpperCase() === "Y";

const WORKFLOW_APPROVAL_ROLES = new Set([
  "checker",
  "verification",
  "approved1",
  "approved2",
  "approved3"
]);

const WORKFLOW_TRANSACTION_MENUS = new Set([
  "lembur",
  "cuti",
  "ijin",
  "sakit",
  "sppd"
]);

export const ROLE_LABELS = {
  superadmin: { label: "Super Admin System", level: "Super Admin", color: "rose" },
  admin: { label: "Administrator (Admin)", level: "Level Admin", color: "sky" },
  maker: { label: "Maker (Tenaga Kerja)", level: "Level 0", color: "sky" },
  monitoring: { label: "Monitoring", level: "Read Only", color: "cyan" },
  checker: { label: "Checker (TL PLN)", level: "Level 1", color: "amber" },
  verification: { label: "Verifikasi (AMN PLN)", level: "Level 2", color: "indigo" },
  approved1: { label: "Approval 1 (MAN PLN)", level: "Level 3", color: "purple" },
  approved2: { label: "Approval 2 (TL ES)", level: "Level 4", color: "emerald" },
  approved3: { label: "Approval 3 (AMN ES)", level: "Level 5", color: "rose" }
};

export class ResponsibilityService {
  static shouldShowNavigationItem(roleKey, menuId, nip) {
    if (
      WORKFLOW_APPROVAL_ROLES.has(roleKey) &&
      WORKFLOW_TRANSACTION_MENUS.has(menuId)
    ) {
      return false;
    }

    return this.hasAccess(roleKey, menuId, nip);
  }

  static async loadBackendPermissions(user) {
    const roleId = user?.id_role || user?.roleDetail?.id_role;
    const userKey = user?.nip || user?.username;
    if (!roleId || !userKey) throw new Error("ID role user tidak tersedia pada respons login.");

    // Tutup seluruh akses terlebih dahulu agar menu lama tidak sempat tampil.
    this.saveUserPermissions(userKey, emptyMenuPermissions());

    const [accessRows, modules] = await Promise.all([
      api.getAccessModulesByRole(roleId),
      api.getModules().catch(() => [])
    ]);
    const modulesById = Object.fromEntries((modules || []).map((module) => [String(module.id_module), module]));
    const permissions = emptyMenuPermissions();

    (accessRows || []).forEach((access) => {
      const nestedModule = access.module || access.m_module || access.Module || {};
      const moduleId = access.id_module ?? nestedModule.id_module;
      const moduleRecord = modulesById[String(moduleId)] || nestedModule;
      const moduleCode = String(access.kode_module || moduleRecord.kode_module || "").toUpperCase();
      const menuId = MODULE_CODE_TO_MENU_ID[moduleCode] || MODULE_ID_TO_MENU_ID[moduleId];
      if (!menuId) return;

      // Menu hanya tampil bila role memiliki izin baca terhadap module aktif tersebut.
      const canRead = access.can_read ?? access.is_read ?? access.read ?? access.can_view;
      permissions[menuId] = isAllowed(canRead);
    });

    this.saveUserPermissions(userKey, permissions);
    return permissions;
  }

  static getPermissions() {
    const stored = globalThis.appStorage.getItem(RESPONSIBILITY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          // Merge with default in case new keys were added
          const merged = {};
          Object.keys(DEFAULT_ROLE_PERMISSIONS).forEach((role) => {
            merged[role] = {
              ...DEFAULT_ROLE_PERMISSIONS[role],
              ...(parsed[role] || {})
            };
          });
          return merged;
        }
      } catch {
        // fallback
      }
    }
    return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
  }

  static savePermissions(matrix) {
    globalThis.appStorage.setItem(RESPONSIBILITY_STORAGE_KEY, JSON.stringify(matrix));
    // Dispatch event so all components react immediately
    window.dispatchEvent(new CustomEvent("responsibility-updated", { detail: matrix }));
  }

  static resetToDefault() {
    globalThis.appStorage.removeItem(RESPONSIBILITY_STORAGE_KEY);
    const defaults = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    window.dispatchEvent(new CustomEvent("responsibility-updated", { detail: defaults }));
    return defaults;
  }

  static getUserPermissionsMap() {
    const stored = globalThis.appStorage.getItem(USER_RESPONSIBILITY_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) || {};
      } catch {
        return {};
      }
    }
    return {};
  }

  static getUserPermissions(nip) {
    if (!nip) return null;
    const map = this.getUserPermissionsMap();
    return map[String(nip)] || null;
  }

  static saveUserPermissions(nip, userPerms) {
    if (!nip) return;
    const map = this.getUserPermissionsMap();
    map[String(nip)] = userPerms;
    globalThis.appStorage.setItem(USER_RESPONSIBILITY_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("responsibility-updated", { detail: this.getPermissions() }));
  }

  static removeUserPermissions(nip) {
    if (!nip) return;
    const map = this.getUserPermissionsMap();
    delete map[String(nip)];
    globalThis.appStorage.setItem(USER_RESPONSIBILITY_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("responsibility-updated", { detail: this.getPermissions() }));
  }

  static hasAccess(roleKey, menuId, nip) {
    if (nip) {
      const userCustom = this.getUserPermissions(nip);
      if (userCustom && userCustom[menuId] !== undefined) {
        return !!userCustom[menuId];
      }
    }
    if (!roleKey) return false;
    const permissions = this.getPermissions();
    const roleObj = permissions[roleKey];
    if (!roleObj) return false; // Insecure default open fixed: Default deny if role unknown
    return !!roleObj[menuId];
  }
}
