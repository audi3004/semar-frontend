import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_BASE = `${API_BASE_URL}/api`;

export const AUTH_STORAGE_KEYS = {
  currentUser: "epresensi_current_user"
};

const REFRESH_TOKEN_COOKIE = "epresensi_refresh_token";
let accessToken = null;

const readCookie = (name) => {
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
};

const writeRefreshTokenCookie = (token, expiresAt) => {
  if (!token) return;
  const expires = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax${secure}`;
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => readCookie(REFRESH_TOKEN_COOKIE);

export const persistAuthSession = (authData) => {
  if (!authData?.access_token) throw new Error("Access token tidak ditemukan pada respons autentikasi");
  accessToken = authData.access_token;
  if (authData.refresh_token) {
    writeRefreshTokenCookie(authData.refresh_token, authData.refresh_token_expires_at);
  }
  if (authData.user) localStorage.setItem(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(authData.user));
};

export const clearAuthStorage = () => {
  accessToken = null;
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  document.cookie = `${REFRESH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  // Bersihkan key token lama agar tidak digunakan kembali oleh versi terdahulu.
  localStorage.removeItem("epresensi_access_token");
  localStorage.removeItem("epresensi_refresh_token");
  localStorage.removeItem("epresensi_token");
  localStorage.removeItem("token");
};

// Create Axios Instance with Authorization Bearer token interceptor
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      // Browser harus membuat multipart boundary secara otomatis.
      delete config.headers["Content-Type"];
    }
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes("/auth/login") || originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status !== 401 || originalRequest?._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthStorage();
      window.dispatchEvent(new Event("auth:session-expired"));
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ||= axios
        .post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken }, {
          headers: { "Content-Type": "application/json" }
        })
        .then((response) => {
          const authData = response.data?.data;
          if (!authData?.access_token) throw new Error("Access token tidak ditemukan pada respons refresh");

          persistAuthSession(authData);
          window.dispatchEvent(new CustomEvent("auth:session-refreshed", { detail: authData.user }));
          return authData.access_token;
        })
        .finally(() => {
          refreshPromise = null;
        });

      const accessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAuthStorage();
      window.dispatchEvent(new Event("auth:session-expired"));
      return Promise.reject(refreshError);
    }
  }
);

export const api = {
  client: apiClient,

  // Reset cache / storage helper
  resetCache: async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      const res = await apiClient.post("/auth/reset-cache").catch(() => null);
      return res?.data || { success: true, message: "Storage cleared" };
    } catch {
      return { success: true };
    }
  },

  // Reset transactions only
  resetTransactions: async () => {
    try {
      const res = await apiClient.post("/dev/reset-transactions");
      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // Auth API
  login: async (username, password) => {
    const response = await apiClient.post("/auth/login", { username, password });
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
    return response.data;
  },

  restoreSession: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    const response = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken }, {
      headers: { "Content-Type": "application/json" }
    });
    const authData = response.data?.data;
    persistAuthSession(authData);
    return authData;
  },

  logout: async () => {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  },

  // Master Users (m_user)
  getUsers: async (params = {}) => {
    const res = await apiClient.get("/users", { params });
    const data = res.data?.data || res.data || [];
    return data.map(u => ({
      id: u.id || `usr-${u.id_user}`,
      id_user: u.id_user,
      id_pegawai: u.id_pegawai,
      id_petugas: u.id_petugas,
      id_role: u.id_role,
      username: u.username,
      nip: u.nip,
      name: u.nama || u.name,
      email: u.email,
      role: u.role || (u.kode_role === "SA" ? "superadmin" : "maker"),
      kodeRole: u.kode_role || u.kodeRole,
      jabatan: u.jabatan || u.nama_jabatan || "Pegawai Operasional",
      unitUpt: u.unitUpt || u.nama_unit || "UPT Semarang",
      unitUltg: u.unitUltg || "ULTG Semarang",
      garduInduk: u.garduInduk || "GI Krapyak",
      gajiPokok: u.gajiPokok || u.gaji_pokok || 0,
      isActive: u.is_active === "Y"
    }));
  },

  // Master Roles (m_role)
  getRoles: async () => {
    const res = await apiClient.get("/roles");
    return res.data?.data || [];
  },

  // Master Unit Role (m_unit_role)
  getUnitRoles: async () => {
    const res = await apiClient.get("/unit-role");
    return res.data?.data || [];
  },
  getMyUnitRoles: async () => {
    const res = await apiClient.get("/unit-role/me");
    return res.data?.data || [];
  },

  // Master Modules (m_module)
  getModules: async () => {
    const res = await apiClient.get("/modules");
    return res.data?.data || [];
  },

  // Master Access Module (m_access_module)
  getAccessModules: async () => {
    const res = await apiClient.get("/access-modules");
    return res.data?.data || [];
  },

  getAccessModulesByRole: async (roleId) => {
    const res = await apiClient.get(`/access-modules/role/${roleId}`);
    return res.data?.data || [];
  },

  // Master Pegawai (m_pegawai)
  getPegawai: async () => {
    const res = await apiClient.get("/pegawai");
    return res.data?.data || [];
  },

  // Master Petugas (m_petugas)
  getPetugas: async () => {
    const res = await apiClient.get("/petugas");
    return res.data?.data || [];
  },

  // Master Unit (m_unit)
  getUnits: async () => {
    const res = await apiClient.get("/unit");
    return res.data?.data || [];
  },

  // Master Status (m_status)
  getStatus: async () => {
    const res = await apiClient.get("/status");
    return res.data?.data || [];
  },

  // Generic Submissions Workflow API
  getSubmissions: async (params = {}) => {
    const res = await apiClient.get("/submissions", { params });
    return res.data?.data || [];
  },

  getSubmissionById: async (id) => {
    const res = await apiClient.get(`/submissions/${id}`);
    return res.data?.data || res.data;
  },

  processApproval: async (id, actionPayload) => {
    // actionPayload: { action: 'approve' | 'reject' | 'revision', signatureUrl, notes, extra }
    const res = await apiClient.post(`/submissions/${id}/approve`, actionPayload);
    return res.data;
  },

  // Transaksi Lembur (t_lembur)
  getLembur: async (params = {}) => {
    const res = await apiClient.get("/lembur", { params });
    return res.data?.data || [];
  },
  getLemburById: async (id) => {
    const res = await apiClient.get(`/lembur/${id}`);
    return res.data?.data || res.data;
  },
  getPendingLembur: async () => {
    const res = await apiClient.get("/lembur/pending");
    return res.data?.data || [];
  },
  getLemburByPetugas: async (id) => {
    const res = await apiClient.get(`/lembur/petugas/${id}`);
    return res.data?.data || [];
  },
  createLembur: async (payload) => {
    const res = await apiClient.post("/lembur", payload);
    return res.data;
  },
  updateLembur: async (id, payload) => {
    const res = await apiClient.put(`/lembur/${id}`, payload);
    return res.data;
  },
  releaseLembur: async (id, payload) => {
    const res = await apiClient.patch(`/lembur/${id}/next`, payload);
    return res.data;
  },
  approveLembur: async (id, payload = {}) => {
    const res = await apiClient.patch(`/lembur/${id}/next`, payload);
    return res.data;
  },
  rejectLembur: async (id, notes) => {
    const res = await apiClient.patch(`/lembur/${id}/reject`, { notes });
    return res.data;
  },
  reviseLembur: async (id, notes, targetRole = "maker") => {
    const res = await apiClient.patch(`/lembur/${id}/revision`, { notes, target_role: targetRole });
    return res.data;
  },
  cancelLembur: async (id, notes = "") => {
    const res = await apiClient.post(`/lembur/${id}/cancel`, { action: "cancel", notes });
    return res.data;
  },
  deleteLembur: async (id) => {
    const res = await apiClient.delete(`/lembur/${id}`);
    return res.data;
  },
  getLemburLogs: async (id) => {
    const res = await apiClient.get(`/log-lembur/lembur/${id}`);
    return res.data?.data || [];
  },
  getCutiLogs: async (id) => {
    const res = await apiClient.get(`/log-cuti/cuti/${id}`);
    return res.data?.data || [];
  },
  getIjinLogs: async (id) => {
    const res = await apiClient.get(`/log-ijin/ijin/${id}`);
    return res.data?.data || [];
  },
  getSakitLogs: async (id) => {
    const res = await apiClient.get(`/log-sakit/sakit/${id}`);
    return res.data?.data || [];
  },
  getSppdLogs: async (id) => {
    const res = await apiClient.get(`/log-sppd/sppd/${id}`);
    return res.data?.data || [];
  },

  // Transaksi Cuti (t_cuti)
  getCuti: async (params = {}) => {
    const res = await apiClient.get("/cuti", { params });
    return res.data?.data || [];
  },
  getCutiById: async (id) => {
    const res = await apiClient.get(`/cuti/${id}`);
    return res.data?.data || res.data;
  },
  getPendingCuti: async () => {
    const res = await apiClient.get("/cuti/pending");
    return res.data?.data || [];
  },
  createCuti: async (payload) => {
    const res = await apiClient.post("/cuti", payload);
    return res.data;
  },
  updateCuti: async (id, payload) => {
    const res = await apiClient.put(`/cuti/${id}`, payload);
    return res.data;
  },
  nextCuti: async (id, payload = {}) => {
    const res = await apiClient.patch(`/cuti/${id}/next`, payload);
    return res.data;
  },
  approveCuti: async (id, payload = {}) => {
    const res = await apiClient.patch(`/cuti/${id}/next`, payload);
    return res.data;
  },
  rejectCuti: async (id, notes) => {
    const res = await apiClient.patch(`/cuti/${id}/reject`, notes ? { notes } : {});
    return res.data;
  },
  reviseCuti: async (id, notes, targetRole = "maker") => {
    const res = await apiClient.patch(`/cuti/${id}/revision`, { notes, target_role: targetRole });
    return res.data;
  },
  cancelCuti: async (id, notes = "") => {
    const res = await apiClient.delete(`/cuti/${id}`, { data: notes ? { notes } : undefined });
    return res.data;
  },
  deleteCuti: async (id) => {
    const res = await apiClient.delete(`/cuti/${id}`);
    return res.data;
  },

  // Transaksi Ijin (t_ijin)
  getIjin: async (params = {}) => {
    const res = await apiClient.get("/ijin", { params });
    return res.data?.data || [];
  },
  getIjinById: async (id) => {
    const res = await apiClient.get(`/ijin/${id}`);
    return res.data?.data || res.data;
  },
  getPendingIjin: async () => {
    const res = await apiClient.get("/ijin/pending");
    return res.data?.data || [];
  },
  createIjin: async (payload) => {
    const res = await apiClient.post("/ijin", payload);
    return res.data;
  },
  updateIjin: async (id, payload) => {
    const res = await apiClient.put(`/ijin/${id}`, payload);
    return res.data;
  },
  nextIjin: async (id, payload = {}) => {
    const res = await apiClient.patch(`/ijin/${id}/next`, payload);
    return res.data;
  },
  approveIjin: async (id, payload = {}) => {
    const res = await apiClient.patch(`/ijin/${id}/next`, payload);
    return res.data;
  },
  rejectIjin: async (id, notes) => {
    const res = await apiClient.patch(`/ijin/${id}/reject`, notes ? { notes } : {});
    return res.data;
  },
  reviseIjin: async (id, notes, targetRole = "maker") => {
    const res = await apiClient.patch(`/ijin/${id}/revision`, { notes, target_role: targetRole });
    return res.data;
  },
  cancelIjin: async (id, notes = "") => {
    const res = await apiClient.delete(`/ijin/${id}`, { data: notes ? { notes } : undefined });
    return res.data;
  },
  deleteIjin: async (id) => {
    const res = await apiClient.delete(`/ijin/${id}`);
    return res.data;
  },

  // Transaksi Sakit (t_sakit)
  getSakit: async (params = {}) => {
    const res = await apiClient.get("/sakit", { params });
    return res.data?.data || [];
  },
  getSakitById: async (id) => {
    const res = await apiClient.get(`/sakit/${id}`);
    return res.data?.data || res.data;
  },
  getPendingSakit: async () => {
    const res = await apiClient.get("/sakit/pending");
    return res.data?.data || [];
  },
  createSakit: async (payload) => {
    const res = await apiClient.post("/sakit", payload);
    return res.data;
  },
  updateSakit: async (id, payload) => {
    const res = await apiClient.put(`/sakit/${id}`, payload);
    return res.data;
  },
  nextSakit: async (id, payload = {}) => {
    const res = await apiClient.patch(`/sakit/${id}/next`, payload);
    return res.data;
  },
  approveSakit: async (id, payload = {}) => {
    const res = await apiClient.patch(`/sakit/${id}/next`, payload);
    return res.data;
  },
  rejectSakit: async (id, notes) => {
    const res = await apiClient.patch(`/sakit/${id}/reject`, notes ? { notes } : {});
    return res.data;
  },
  reviseSakit: async (id, notes, targetRole = "maker") => {
    const res = await apiClient.patch(`/sakit/${id}/revision`, { notes, target_role: targetRole });
    return res.data;
  },
  cancelSakit: async (id, notes = "") => {
    const res = await apiClient.delete(`/sakit/${id}`, { data: notes ? { notes } : undefined });
    return res.data;
  },
  deleteSakit: async (id) => {
    const res = await apiClient.delete(`/sakit/${id}`);
    return res.data;
  },

  // Transaksi SPPD (t_sppd)
  getSppd: async (params = {}) => {
    const res = await apiClient.get("/sppd", { params });
    return res.data?.data || [];
  },
  getSppdById: async (id) => {
    const res = await apiClient.get(`/sppd/${id}`);
    return res.data?.data || res.data;
  },
  getPendingSppd: async () => {
    const res = await apiClient.get("/sppd/pending");
    return res.data?.data || [];
  },
  createSppd: async (payload) => {
    const res = await apiClient.post("/sppd", payload);
    return res.data;
  },
  updateSppd: async (id, payload) => {
    const res = await apiClient.put(`/sppd/${id}`, payload);
    return res.data;
  },
  nextSppd: async (id, payload = {}) => {
    const res = await apiClient.patch(`/sppd/${id}/next`, payload);
    return res.data;
  },
  approveSppd: async (id, payload = {}) => {
    const res = await apiClient.patch(`/sppd/${id}/next`, payload);
    return res.data;
  },
  rejectSppd: async (id, notes) => {
    const res = await apiClient.patch(`/sppd/${id}/reject`, notes ? { notes } : {});
    return res.data;
  },
  reviseSppd: async (id, notes, targetRole = "maker") => {
    const res = await apiClient.patch(`/sppd/${id}/revision`, { notes, target_role: targetRole });
    return res.data;
  },
  cancelSppd: async (id, notes = "") => {
    const res = await apiClient.delete(`/sppd/${id}`, { data: notes ? { notes } : undefined });
    return res.data;
  },
  deleteSppd: async (id) => {
    const res = await apiClient.delete(`/sppd/${id}`);
    return res.data;
  }
};

export default api;
