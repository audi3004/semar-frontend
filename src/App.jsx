import { useState, useEffect, useMemo, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthService } from "./services/authService";
import { DataService } from "./services/dataService";
import { MasterDataService } from "./services/masterDataService";
import { ResponsibilityService } from "./services/responsibilityService";
import { ShieldAlert } from "lucide-react";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LemburPage } from "./pages/LemburPage";
import { CutiPage } from "./pages/CutiPage";
import { IjinPage } from "./pages/IjinPage";
import { SakitPage } from "./pages/SakitPage";
import { SppdPage } from "./pages/SppdPage";
import { PegawaiPage } from "./pages/PegawaiPage";
import { UnitKerjaPage } from "./pages/UnitKerjaPage";
import { ProjectPage } from "./pages/ProjectPage";
import { JabatanPage } from "./pages/JabatanPage";
import { UmkPage } from "./pages/UmkPage";
import { FaktorUpahPage } from "./pages/FaktorUpahPage";
import { HariLiburPage } from "./pages/HariLiburPage";
import { MutasiPegawaiPage } from "./pages/MutasiPegawaiPage";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";
import UnitRolePage from "./pages/UnitRolePage";
import { ResponsibilitiesPage } from "./pages/ResponsibilitiesPage";
import MainLayout from "./components/layout/MainLayout";
import { WorkflowPage } from "./pages/WorkflowPage";
import { ReportPermohonanPage } from "./pages/ReportPermohonanPage";
import ListDokumenPage from "./pages/ListDokumenPage";
import WorkflowApprovalPage from "./pages/workflow/WorkflowApprovalPage";
import { ToastProvider } from "./components/common/ToastNotification";
import { toast } from "./utils/toast";
import AccessMatrixSettingsPage from "./pages/settings/AccessMatrixSettingsPage";

function RouteAccessGuard({ moduleId, currentUser, children }) {
  const navigate = useNavigate();
  const hasAccess = ResponsibilityService.hasAccess(currentUser?.role, moduleId, currentUser?.nip);

  if (!hasAccess) {
    return (
      <div className="p-6 max-w-lg mx-auto my-12 bg-white rounded-3xl shadow-xl border border-rose-100 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-900">Akses Modul Dibatasi</h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Peran Anda (<strong>{currentUser?.role || "Pengguna"}</strong>) tidak memiliki akses untuk membuka modul ini berdasarkan Matriks Responsibility. Hubungi Administrator untuk penyesuaian hak akses.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}

function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [submissions, setSubmissions] = useState([]);
  const [settings, setSettings] = useState(DataService.getSettings());
  const [isMobileMode, setIsMobileMode] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (window.innerWidth < 768) return false;
    return localStorage.getItem("epresensi_sidebar_open") !== "false";
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isAccessLoading, setIsAccessLoading] = useState(Boolean(currentUser));

  // Global Header Filter State
  const [selectedProject, setSelectedProject] = useState("Semua Project");
  const [selectedUpt, setSelectedUpt] = useState("Semua UPT");
  const [selectedUltg, setSelectedUltg] = useState("Semua ULTG");
  const [selectedGi, setSelectedGi] = useState("Semua GI");

  // Helper to get first and last day of current month as default
  const getFirstAndLastDayOfCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const pad = (num) => String(num).padStart(2, "0");
    return {
      startDate: `${year}-${pad(month + 1)}-01`,
      endDate: `${year}-${pad(month + 1)}-${pad(lastDay.getDate())}`
    };
  };

  const defaultDates = getFirstAndLastDayOfCurrentMonth();
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    AuthService.restoreSession()
      .then((user) => {
        if (!cancelled) setCurrentUser(user);
      })
      .finally(() => {
        if (!cancelled) setIsAuthInitializing(false);
      });
    return () => { cancelled = true; };
  }, []);

  const refreshData = () => {
    try {
      setFetchError(null);
      if (localStorage.getItem("epresensi_simulate_fetch_error") === "true") {
        throw new Error("Network Timeout: Hubungan ke server pusat PT PLN Electricity Services terputus (504 Gateway Timeout).");
      }
      setSubmissions(DataService.getSubmissions() || []);
      setSettings(DataService.getSettings() || {});
    } catch (err) {
      console.error("refreshData caught error:", err);
      setFetchError(err.message || "Gagal mengambil data profil.");
    }
  };

  useEffect(() => {
    refreshData();
    const handleResize = () => {
      setIsMobileMode(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      localStorage.setItem("epresensi_sidebar_open", String(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleExpiredSession = () => {
      setCurrentUser(null);
      navigate("/login?expired=true", { replace: true });
    };
    const handleRefreshedSession = () => {
      const user = AuthService.getCurrentUser();
      if (user) setCurrentUser(user);
    };
    window.addEventListener("auth:session-expired", handleExpiredSession);
    window.addEventListener("auth:session-refreshed", handleRefreshedSession);
    return () => {
      window.removeEventListener("auth:session-expired", handleExpiredSession);
      window.removeEventListener("auth:session-refreshed", handleRefreshedSession);
    };
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    if (!currentUser) {
      setIsAccessLoading(false);
      return undefined;
    }

    setIsAccessLoading(true);
    Promise.all([
      ResponsibilityService.loadBackendPermissions(currentUser),
      MasterDataService.syncMasterDataFromApi()
    ])
      .catch((error) => {
        if (!cancelled) {
          console.error("Gagal mengambil access module berdasarkan role:", error);
          toast.error(error.response?.data?.message || error.message || "Gagal mengambil data master atau hak akses menu.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsAccessLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id_user, currentUser?.id_role]);

  // Background check for session validity and user activity tracking to extend session
  useEffect(() => {
    if (!currentUser) return;

    // Periodically check for expiration
    const interval = setInterval(() => {
      if (AuthService.isSessionExpired()) {
        AuthService.logout();
        setCurrentUser(null);
        navigate("/login?expired=true", { replace: true });
      }
    }, 5000);

    // Track activity (clicks, keypresses, scroll) to extend session (throttled to max once per 30s)
    let lastActivityTime = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityTime > 30000) {
        lastActivityTime = now;
        AuthService.extendSession();
      }
    };

    window.addEventListener("click", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [currentUser, navigate]);

  // Sync Unit filters with logged in user / selected role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "superadmin" || currentUser.role === "approved3" || currentUser.role === "admin") {
        setSelectedUpt("Semua UPT");
        setSelectedUltg("Semua ULTG");
        setSelectedGi("Semua GI");
      } else if (
        currentUser.role === "approved2" ||
        currentUser.role === "approved1" ||
        currentUser.role === "verification"
      ) {
        setSelectedUpt(currentUser.unitUpt || "Semua UPT");
        setSelectedUltg("Semua ULTG");
        setSelectedGi("Semua GI");
      } else if (currentUser.role === "checker") {
        setSelectedUpt(currentUser.unitUpt || "Semua UPT");
        setSelectedUltg(currentUser.unitUltg || "Semua ULTG");
        setSelectedGi(currentUser.garduInduk || "Semua GI");
      } else {
        setSelectedUpt(currentUser.unitUpt || "Semua UPT");
        setSelectedUltg(currentUser.unitUltg || "Semua ULTG");
        setSelectedGi(currentUser.garduInduk || "Semua GI");
      }
    }
  }, [currentUser?.nip, currentUser?.role]);

  // Sync activeTab with pathname for visual feedback in Sidebar/MobileNav
  useEffect(() => {
    const path = location.pathname;
    const cleanPath = path.replace(/^\//, "");
    if (cleanPath) {
      setActiveTab(cleanPath.split("/")[0]);
    } else {
      setActiveTab("dashboard");
    }
  }, [location.pathname]);

  // Enforce auth state navigation
  useEffect(() => {
    if (isAuthInitializing) return;
    if (!currentUser && location.pathname !== "/login") {
      navigate("/login");
    } else if (currentUser && location.pathname === "/login") {
      navigate("/dashboard");
    }
  }, [currentUser, isAuthInitializing, location.pathname, navigate]);

  // Compute dynamic unit lists across database m_unit (UnitKerjaPage), registered users, settings, and submissions
  const allUsers = useMemo(() => {
    try {
      return AuthService.getUsers() || [];
    } catch {
      return [];
    }
  }, []);

  const masterUnits = useMemo(() => {
    try {
      return MasterDataService.getAll("m_unit", { limit: 1000 })?.data || [];
    } catch {
      return [];
    }
  }, []);
  
  const masterJabatans = useMemo(() => {
    try {
      return MasterDataService.getAll("m_jabatan", { limit: 1000 })?.data || [];
    } catch {
      return [];
    }
  }, []);

  const masterProjects = useMemo(() => {
    try {
      return MasterDataService.getAll("m_project", { limit: 1000 })?.data || [];
    } catch {
      return [];
    }
  }, []);

  const uptList = useMemo(() => {
    const fromMaster = masterUnits.map((u) => u.upt);
    const fromUsers = allUsers.map((u) => u.unitUpt || u.upt);
    const fromSubmissions = submissions.map((s) => s.unitUpt || s.upt);
    const combined = [...fromMaster, ...fromUsers, ...fromSubmissions].filter(Boolean);
    return Array.from(new Set(combined)).sort();
  }, [masterUnits, allUsers, submissions]);

  const ultgList = useMemo(() => {
    const fromMaster = masterUnits
      .filter((u) => selectedUpt === "Semua UPT" || u.upt === selectedUpt)
      .map((u) => u.ultg);
    const fromUsers = allUsers
      .filter((u) => selectedUpt === "Semua UPT" || (u.unitUpt || u.upt) === selectedUpt)
      .map((u) => u.unitUltg || u.ultg);
    const fromSubmissions = submissions
      .filter((s) => selectedUpt === "Semua UPT" || (s.unitUpt || s.upt) === selectedUpt)
      .map((s) => s.unitUltg || s.ultg);
    const combined = [...fromMaster, ...fromUsers, ...fromSubmissions].filter(Boolean);
    return Array.from(new Set(combined)).sort();
  }, [masterUnits, allUsers, submissions, selectedUpt]);

  const giList = useMemo(() => {
    const fromMaster = masterUnits
      .filter(
        (u) =>
          (selectedUpt === "Semua UPT" || u.upt === selectedUpt) &&
          (selectedUltg === "Semua ULTG" || u.ultg === selectedUltg)
      )
      .map((u) => u.gardu_induk);
    const fromUsers = allUsers
      .filter(
        (u) =>
          (selectedUpt === "Semua UPT" || (u.unitUpt || u.upt) === selectedUpt) &&
          (selectedUltg === "Semua ULTG" || (u.unitUltg || u.ultg) === selectedUltg)
      )
      .map((u) => u.garduInduk || u.gi);
    const fromSubmissions = submissions
      .filter(
        (s) =>
          (selectedUpt === "Semua UPT" || (s.unitUpt || s.upt) === selectedUpt) &&
          (selectedUltg === "Semua ULTG" || (s.unitUltg || s.ultg) === selectedUltg)
      )
      .map((s) => s.garduInduk || s.gi);
    const combined = [...fromMaster, ...fromUsers, ...fromSubmissions].filter(Boolean);
    return Array.from(new Set(combined)).sort();
  }, [masterUnits, allUsers, submissions, selectedUpt, selectedUltg]);

  const handleLogout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
    toast.success("Sesi Anda telah diakhiri. Berhasil keluar!");
    navigate("/login");
  };

  const handleSwitchRole = (roleOrUser) => {
    let targetRole = "maker";
    if (typeof roleOrUser === "string") {
      targetRole = roleOrUser;
    } else if (roleOrUser && roleOrUser.role) {
      targetRole = roleOrUser.role;
    }
    const updatedUser = AuthService.switchUserRole(targetRole);
    if (updatedUser) {
      setCurrentUser(updatedUser);
      toast.success(`Berhasil beralih peran ke: ${targetRole.toUpperCase()}`);
    } else {
      setCurrentUser(AuthService.getCurrentUser());
      toast.error("Gagal beralih peran.");
    }
    refreshData();
  };

  const getSubmissionPrimaryDate = (sub) => {
    if (sub.type === "lembur") return sub.tanggalLembur || sub.tanggalPengajuan || "";
    if (sub.type === "cuti") return sub.tanggalMulai || sub.tanggalPengajuan || "";
    if (sub.type === "ijin") return sub.tanggalMulai || sub.tanggalPengajuan || "";
    if (sub.type === "sakit") return sub.tanggalMulai || sub.tanggalPengajuan || "";
    if (sub.type === "sppd") return sub.tanggalBerangkat || sub.tanggalPengajuan || "";
    return sub.tanggalPengajuan || "";
  };

  const getProjectIdForSubmission = useCallback((sub, usersList, jabatans) => {
    const employee = (usersList || []).find((u) => u.nip === sub.employeeNip);
    if (employee) {
      const matchedJab = (jabatans || []).find(
        (j) => j.nama_jabatan?.toLowerCase() === (employee.jabatan || "").toLowerCase()
      );
      if (matchedJab) {
        return String(matchedJab.id_project);
      }
    }
    const matchedJab = (jabatans || []).find(
      (j) => j.nama_jabatan?.toLowerCase() === (sub.employeeJabatan || "").toLowerCase()
    );
    if (matchedJab) {
      return String(matchedJab.id_project);
    }
    return "1";
  }, []);

  const getProjectNameForSubmission = useCallback((sub, usersList, jabatans, projects) => {
    const employee = (usersList || []).find((u) => u.nip === sub.employeeNip);
    if (employee) {
      if (employee.multiProject && Array.isArray(employee.multiProject) && employee.multiProject.length > 0) {
        const firstProjId = employee.multiProject[0];
        const proj = (projects || []).find((p) => String(p.id_project) === String(firstProjId));
        if (proj) return proj.nama_project;
      }
      const matchedJab = (jabatans || []).find(
        (j) => j.nama_jabatan?.toLowerCase() === (employee.jabatan || "").toLowerCase()
      );
      if (matchedJab) {
        const proj = (projects || []).find((p) => Number(p.id_project) === Number(matchedJab.id_project));
        if (proj) return proj.nama_project;
      }
    }
    const matchedJab = (jabatans || []).find(
      (j) => j.nama_jabatan?.toLowerCase() === (sub.employeeJabatan || "").toLowerCase()
    );
    if (matchedJab) {
      const proj = (projects || []).find((p) => Number(p.id_project) === Number(matchedJab.id_project));
      if (proj) return proj.nama_project;
    }
    return (projects && projects[0]?.nama_project) || "Operator Gardu Induk";
  }, []);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Logged in Approver multiProject limits (Role approved2 & approved3)
      if (currentUser?.role === "approved2" || currentUser?.role === "approved3") {
        if (currentUser?.multiProject && Array.isArray(currentUser.multiProject)) {
          const subProjId = getProjectIdForSubmission(sub, allUsers, masterJabatans);
          if (!currentUser.multiProject.includes(String(subProjId))) {
            return false;
          }
        }
      }

      // 2. Global "Pilih Project" filter
      if (selectedProject && selectedProject !== "Semua Project") {
        const subProject = getProjectNameForSubmission(sub, allUsers, masterJabatans, masterProjects);
        if (subProject !== selectedProject) return false;
      }

      // 3. Global unit filters
      const emp = (allUsers || []).find((u) => u.nip === sub.employeeNip);
      if (selectedUpt && selectedUpt !== "Semua UPT") {
        const subUpt = sub.unitUpt || sub.upt || emp?.unitUpt;
        if (subUpt && subUpt !== selectedUpt) return false;
      }
      if (selectedUltg && selectedUltg !== "Semua ULTG") {
        const subUltg = sub.unitUltg || sub.ultg || emp?.unitUltg;
        if (subUltg && subUltg !== selectedUltg) return false;
      }
      if (selectedGi && selectedGi !== "Semua GI") {
        const subGi = sub.garduInduk || sub.gi || emp?.garduInduk;
        if (subGi && subGi !== selectedGi) return false;
      }

      const targetDate = getSubmissionPrimaryDate(sub);
      if (targetDate) {
        if (startDate && targetDate < startDate) return false;
        if (endDate && targetDate > endDate) return false;
      }

      return true;
    });
  }, [
    submissions,
    currentUser,
    selectedProject,
    selectedUpt,
    selectedUltg,
    selectedGi,
    startDate,
    endDate,
    allUsers,
    masterJabatans,
    masterProjects,
    getProjectIdForSubmission,
    getProjectNameForSubmission
  ]);

  const handleResetFilters = () => {
    setSelectedProject("Semua Project");
    setSelectedUpt("Semua UPT");
    setSelectedUltg("Semua ULTG");
    setSelectedGi("Semua GI");
    const defaultDates = getFirstAndLastDayOfCurrentMonth();
    setStartDate(defaultDates.startDate);
    setEndDate(defaultDates.endDate);
  };

  const handleTabChange = (tabId) => {
    const isMaker = currentUser?.role === "maker";
    if (!isMaker && ["lembur", "cuti", "ijin", "sakit", "sppd"].includes(tabId)) {
      const routeMap = {
        checker: "/workflow/checker",
        verification: "/workflow/verification",
        approved1: "/workflow/approval-1",
        approved2: "/workflow/approval-2",
        approved3: "/workflow/approval-3"
      };
      navigate(routeMap[currentUser?.role] || "/workflow", { state: { typeFilter: tabId } });
      setActiveTab(tabId);
      return;
    }
    if (tabId === "workflow") {
      const role = currentUser?.role || "maker";
      const routeMap = {
        maker: "maker",
        checker: "checker",
        verification: "verification",
        approved1: "approval-1",
        approved2: "approval-2",
        approved3: "approval-3"
      };
      const pathSuffix = routeMap[role] || "maker";
      navigate(`/workflow/${pathSuffix}`);
    } else {
      navigate(`/${tabId}`);
    }
  };

  const hasActiveFilters =
    selectedProject !== "Semua Project" ||
    selectedUpt !== "Semua UPT" ||
    selectedUltg !== "Semua ULTG" ||
    selectedGi !== "Semua GI" ||
    Boolean(startDate) ||
    Boolean(endDate);

  const notifications = currentUser ? DataService.getNotifications(currentUser.nip) : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isAuthInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-600">
        Memulihkan sesi Anda...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" id="fetch-error-fallback">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 max-w-lg w-full p-6 space-y-5 text-center">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-900">Gagal Memuat Profil & Pengaturan</h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Sistem mendeteksi adanya gangguan koneksi ke server PLN digital core atau data profile bermasalah.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
            <p className="text-[11px] font-mono font-bold text-rose-600 leading-normal break-words">
              Error NIP: {currentUser?.nip || "Guest"} - {fetchError}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                refreshData();
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition cursor-pointer"
            >
              Coba Hubungkan Kembali
            </button>
            {localStorage.getItem("epresensi_simulate_fetch_error") === "true" && (
              <button
                onClick={() => {
                  localStorage.removeItem("epresensi_simulate_fetch_error");
                  refreshData();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-700 transition cursor-pointer"
              >
                Matikan Simulasi Error
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={
          <LoginPage
            onLoginSuccess={() => {
              setCurrentUser(AuthService.getCurrentUser());
              refreshData();
              navigate("/dashboard");
            }}
          />
        }
      />

      {/* Protected Dashboard Routes wrapped in MainLayout */}
      <Route
        path="/"
        element={
          isAccessLoading ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-600">
              Memuat hak akses menu...
            </div>
          ) : <MainLayout
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            onLogout={handleLogout}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isNotificationOpen={isNotificationOpen}
            setIsNotificationOpen={setIsNotificationOpen}
            isQuickModalOpen={isQuickModalOpen}
            setIsQuickModalOpen={setIsQuickModalOpen}
            unreadCount={unreadCount}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            selectedUpt={selectedUpt}
            setSelectedUpt={setSelectedUpt}
            selectedUltg={selectedUltg}
            setSelectedUltg={setSelectedUltg}
            selectedGi={selectedGi}
            setSelectedGi={setSelectedGi}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onResetFilters={handleResetFilters}
            uptList={uptList}
            ultgList={ultgList}
            giList={giList}
            hasActiveFilters={hasActiveFilters}
            isMobileFilterOpen={isMobileFilterOpen}
            setIsMobileFilterOpen={setIsMobileFilterOpen}
            notifications={notifications}
            refreshData={refreshData}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />
        }
      >
        {/* Default Redirect */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Pages */}
        <Route
          path="dashboard"
          element={
            <DashboardPage
              currentUser={currentUser}
              submissions={filteredSubmissions}
              allSubmissions={submissions}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              selectedUpt={selectedUpt}
              selectedUltg={selectedUltg}
              selectedGi={selectedGi}
              onRefreshData={refreshData}
              onNavigateToTab={handleTabChange}
            />
          }
        />
        <Route
          path="lembur"
          element={
            currentUser?.role !== "maker" ? (
              <Navigate to="/workflow" state={{ typeFilter: "lembur" }} replace />
            ) : (
              <LemburPage
                currentUser={currentUser}
                submissions={filteredSubmissions}
                settings={settings}
                onRefreshData={refreshData}
              />
            )
          }
        />
        <Route
          path="cuti"
          element={
            currentUser?.role !== "maker" ? (
              <Navigate to="/workflow" state={{ typeFilter: "cuti" }} replace />
            ) : (
              <CutiPage
                currentUser={currentUser}
                submissions={filteredSubmissions}
                settings={settings}
                onRefreshData={refreshData}
              />
            )
          }
        />
        <Route
          path="ijin"
          element={
            currentUser?.role !== "maker" ? (
              <Navigate to="/workflow" state={{ typeFilter: "ijin" }} replace />
            ) : (
              <IjinPage
                currentUser={currentUser}
                submissions={filteredSubmissions}
                settings={settings}
                onRefreshData={refreshData}
              />
            )
          }
        />
        <Route
          path="sakit"
          element={
            currentUser?.role !== "maker" ? (
              <Navigate to="/workflow" state={{ typeFilter: "sakit" }} replace />
            ) : (
              <SakitPage
                currentUser={currentUser}
                submissions={filteredSubmissions}
                onRefreshData={refreshData}
              />
            )
          }
        />
        <Route
          path="sppd"
          element={
            currentUser?.role !== "maker" ? (
              <Navigate to="/workflow" state={{ typeFilter: "sppd" }} replace />
            ) : (
              <SppdPage
                currentUser={currentUser}
                submissions={filteredSubmissions}
                onRefreshData={refreshData}
              />
            )
          }
        />

        {/* Specific Workflow Pages */}
        <Route path="workflow" element={<WorkflowPage currentUser={currentUser} onRefreshData={refreshData} />} />
        {/* Report & Dokumen Routes */}
        <Route
          path="list-dokumen"
          element={
            <RouteAccessGuard moduleId="list-dokumen" currentUser={currentUser}>
              <ListDokumenPage
                currentUser={currentUser}
                submissions={filteredSubmissions}
                selectedProject={selectedProject}
                selectedUpt={selectedUpt}
                selectedUltg={selectedUltg}
                selectedGi={selectedGi}
                globalStartDate={startDate}
                globalEndDate={endDate}
              />
            </RouteAccessGuard>
          }
        />
        <Route
          path="report-permohonan"
          element={
            <RouteAccessGuard moduleId="report-permohonan" currentUser={currentUser}>
              <ReportPermohonanPage currentUser={currentUser} submissions={filteredSubmissions} />
            </RouteAccessGuard>
          }
        />
        <Route path="workflow/maker" element={<WorkflowApprovalPage stage="MAKER" />} />
        <Route path="workflow/checker" element={<WorkflowApprovalPage stage="CHECKER" />} />
        <Route path="workflow/verification" element={<WorkflowApprovalPage stage="VERIFICATION" />} />
        <Route path="workflow/approval-1" element={<WorkflowApprovalPage stage="APPROVAL_1" />} />
        <Route path="workflow/approval-2" element={<WorkflowApprovalPage stage="APPROVAL_2" />} />
        <Route path="workflow/approval-3" element={<WorkflowApprovalPage stage="APPROVAL_3" />} />

        {/* Master & Administrator Routes */}
        <Route
          path="unit-kerja"
          element={
            <RouteAccessGuard moduleId="unit-kerja" currentUser={currentUser}>
              <UnitKerjaPage currentUser={currentUser} />
            </RouteAccessGuard>
          }
        />
        <Route
          path="project"
          element={
            <RouteAccessGuard moduleId="project" currentUser={currentUser}>
              <ProjectPage currentUser={currentUser} onRefreshData={refreshData} />
            </RouteAccessGuard>
          }
        />
        <Route
          path="jabatan"
          element={
            <RouteAccessGuard moduleId="jabatan" currentUser={currentUser}>
              <JabatanPage currentUser={currentUser} onRefreshData={refreshData} />
            </RouteAccessGuard>
          }
        />

        <Route
          path="pegawai"
          element={
            <RouteAccessGuard moduleId="pegawai" currentUser={currentUser}>
              <PegawaiPage
                currentUser={currentUser}
                onRefreshData={refreshData}
                selectedUpt={selectedUpt}
                selectedUltg={selectedUltg}
                selectedGi={selectedGi}
              />
            </RouteAccessGuard>
          }
        />

        <Route
          path="umk"
          element={
            <RouteAccessGuard moduleId="umk" currentUser={currentUser}>
              <UmkPage currentUser={currentUser} onRefreshData={refreshData} />
            </RouteAccessGuard>
          }
        />
        <Route
          path="faktor-upah"
          element={
            <RouteAccessGuard moduleId="faktor-upah" currentUser={currentUser}>
              <FaktorUpahPage currentUser={currentUser} />
            </RouteAccessGuard>
          }
        />
        <Route
          path="hari-libur"
          element={
            <RouteAccessGuard moduleId="hari-libur" currentUser={currentUser}>
              <HariLiburPage currentUser={currentUser} onRefreshData={refreshData} />
            </RouteAccessGuard>
          }
        />
        <Route
          path="mutasi-pegawai"
          element={
            <RouteAccessGuard moduleId="mutasi-pegawai" currentUser={currentUser}>
              <MutasiPegawaiPage currentUser={currentUser} />
            </RouteAccessGuard>
          }
        />

        <Route
          path="users"
          element={
            <RouteAccessGuard moduleId="users" currentUser={currentUser}>
              <UsersPage currentUser={currentUser} onRefreshData={refreshData} />
            </RouteAccessGuard>
          }
        />
        <Route
          path="roles"
          element={
            <RouteAccessGuard moduleId="roles" currentUser={currentUser}>
              <RolesPage currentUser={currentUser} />
            </RouteAccessGuard>
          }
        />
        <Route
          path="responsibilities"
          element={
            <RouteAccessGuard moduleId="responsibilities" currentUser={currentUser}>
              <ResponsibilitiesPage currentUser={currentUser} />
            </RouteAccessGuard>
          }
        />
        <Route
          path="unit-role"
          element={
            <RouteAccessGuard moduleId="users" currentUser={currentUser}>
              <UnitRolePage currentUser={currentUser} />
            </RouteAccessGuard>
          }
        />

        {/* Pengaturan dinonaktifkan sementara; komponennya tetap disimpan. */}
        <Route path="pengaturan" element={<Navigate to="/dashboard" replace />} />
        
        {/* Redirect old access-matrix route directly to unified Responsibilities Page */}
        <Route path="pengaturan/access-matrix" element={<Navigate to="/responsibilities" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
