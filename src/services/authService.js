import { INITIAL_USERS } from "../master/initialData";
import { formatDateDDMMYYYY } from "../utils/formatters";
import { api, AUTH_STORAGE_KEYS, clearAuthStorage, getAccessToken, getRefreshToken, persistAuthSession } from "./api";
const CURRENT_USER_KEY = "epresensi_current_user_nip";
const USERS_LIST_KEY = "epresensi_users_list";
export class AuthService {
  static encrypt(text) {
    if (!text) return "";
    if (text.startsWith("ENC:")) return text;
    try {
      return "ENC:" + btoa(text);
    } catch {
      return text;
    }
  }

  static decrypt(cipher) {
    if (!cipher) return "";
    if (cipher.startsWith("ENC:")) {
      try {
        return atob(cipher.slice(4));
      } catch {
        return cipher.slice(4);
      }
    }
    return cipher;
  }

  static resetLocalState() {
    localStorage.clear();
    sessionStorage.clear();
    console.log("Local state & session storage cleared for fresh install test.");
  }

  static getUsers() {
    const stored = localStorage.getItem(USERS_LIST_KEY);
    let usersList = INITIAL_USERS;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          usersList = parsed;
        } else {
          usersList = INITIAL_USERS;
        }
      } catch {
        usersList = INITIAL_USERS;
      }
    }
    const updatedUsers = usersList.map((u) => {
      const dob = u.tglLahir || u.tanggalLahir || "1998-03-15";
      const defaultPass = u.password || "password123";
      return {
        ...u,
        tglLahir: dob,
        password: this.decrypt(u.password || defaultPass)
      };
    });
    return updatedUsers;
  }

  static saveUsers(users) {
    const encryptedUsers = users.map((u) => ({
      ...u,
      password: this.encrypt(u.password)
    }));
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(encryptedUsers));
  }

  static getCurrentUser() {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEYS.currentUser);
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    if (!storedUser || (!accessToken && !refreshToken)) return null;

    try {
      return this.normalizeUser(JSON.parse(storedUser));
    } catch {
      clearAuthStorage();
      return null;
    }
  }

  static isSessionExpired() {
    return !getRefreshToken();
  }

  static extendSession() {
    // Masa aktif sesi ditentukan backend melalui access token dan refresh token.
  }

  static simulateSessionExpiry() {
    localStorage.setItem("epresensi_session_expiry", (Date.now() - 5000).toString());
  }

  static failedAttempts = {};

  static normalizeUser(user) {
    const roleObject = typeof user?.role === "object" ? user.role : user?.roleDetail;
    const roleCode = roleObject?.kode_role || user?.kode_role || user?.kodeRole || "";
    const person = user?.pegawai || user?.petugas || {};
    const fullName = person?.nama || user?.full_name || user?.nama || user?.name || user?.username;
    const jabatanName = person?.jabatan?.nama_jabatan || user?.jabatan || "-";
    const unitName = person?.unit?.nama_unit || user?.unit || user?.unitUpt || "-";
    const frontendRole = {
      SUPER_ADMIN: "superadmin",
      APPROVAL_1: "approved1",
      APPROVAL_2: "approved2",
      APPROVAL_3: "approved3"
    }[roleCode] || roleCode.toLowerCase();
    return {
      ...user,
      nip: person?.nip || user.nip || user.username,
      name: fullName,
      full_name: fullName,
      jabatan: jabatanName,
      unit: unitName,
      unitUpt: unitName,
      roleName: roleObject?.nama_role || user?.roleName || roleCode || "-",
      roleDetail: roleObject || null,
      role: frontendRole || (typeof user.role === "string" ? user.role : "maker")
    };
  }

  static async login(identifier, passwordInput) {
    try {
      const response = await api.login(identifier.trim(), passwordInput);
      const authData = response?.data;
      if (!response?.success || !authData?.access_token || !authData?.refresh_token || !authData?.user) {
        throw new Error(response?.message || "Respons login backend tidak lengkap.");
      }

      const user = this.normalizeUser(authData.user);
      persistAuthSession({ ...authData, user });
      return { success: true, user };
    } catch (error) {
      clearAuthStorage();
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Tidak dapat terhubung ke server."
      };
    }
  }
  static changePassword(nip, oldPass, newPass) {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.nip === nip);
    if (userIndex === -1) {
      return { success: false, message: "Pengguna tidak ditemukan." };
    }
    const currentPass = users[userIndex].password || "123456";
    if (oldPass !== null && oldPass !== undefined && currentPass !== oldPass) {
      return { success: false, message: "Kata sandi lama tidak sesuai." };
    }
    if (newPass.length < 6) {
      return { success: false, message: "Kata sandi baru minimal 6 karakter." };
    }
    users[userIndex].password = newPass;
    this.saveUsers(users);
    return { success: true, message: "Kata sandi berhasil diperbarui!", encryptedPassword: this.encrypt(newPass) };
  }
  static switchUserRole(role) {
    const users = this.getUsers();
    const found = users.find((u) => u.role === role);
    if (found) {
      localStorage.removeItem("epresensi_explicit_logout");
      localStorage.setItem(CURRENT_USER_KEY, found.nip);
      localStorage.setItem("epresensi_session_expiry", (Date.now() + 1000 * 60 * 60).toString());
      return found;
    }
    return this.getCurrentUser();
  }
  static async logout() {
    try {
      if (getAccessToken()) await api.logout();
    } catch {
      // Sesi lokal tetap dibersihkan jika token telah kedaluwarsa/server tidak tersedia.
    } finally {
      clearAuthStorage();
    }
  }

  static async restoreSession() {
    try {
      const authData = await api.restoreSession();
      if (!authData?.user) return null;
      const user = this.normalizeUser(authData.user);
      localStorage.setItem(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(user));
      return user;
    } catch {
      clearAuthStorage();
      return null;
    }
  }
  static addOrUpdateUser(user) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.nip === user.nip);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.saveUsers(users);
  }
  static deleteUser(nip) {
    const users = this.getUsers().filter((u) => u.nip !== nip);
    this.saveUsers(users);
  }
}
