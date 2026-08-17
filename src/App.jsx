import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthService } from "./services/authService";
import { DataService } from "./services/dataService";
import { MasterDataService } from "./services/masterDataService";
import { api } from "./services/api";
import { ResponsibilityService } from "./services/responsibilityService";
import { ShieldAlert } from "lucide-react";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LemburPage } from "./pages/LemburPage";
import { PerintahKerjaLemburPage } from "./pages/PerintahKerjaLemburPage";
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
    return globalThis.appStorage.getItem("epresensi_sidebar_open") !== "false";
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isAccessLoading, setIsAccessLoading] = useState(Boolean(currentUser));

  // Global Header Filter State
  const [selectedProject, setSelectedProject] = useState("Semua Project");
  const [selectedUp, setSelectedUp] = useState("Semua UP");
  const [selectedUpt, setSelectedUpt] = useState("Semua UPT");
  const [selectedUltg, setSelectedUltg] = useState("Semua ULTG");
  const [selectedGi, setSelectedGi] = useState("Semua GI");
  const [filterMasterData, setFilterMasterData] = useState({ units: [], projects: [], jabatans: [], unitRoles: [] });

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
      if (globalThis.appStorage.getItem("epresensi_simulate_fetch_error") === "true") {
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
      globalThis.appStorage.setItem("epresensi_sidebar_open", String(isSidebarOpen));
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

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    Promise.all([
      api.client.get("/unit", { params: { limit: 1000 } }),
      api.client.get("/projects", { params: { limit: 1000 } }),
      api.client.get("/jabatan", { params: { limit: 1000 } }),
      ["admin", "superadmin"].includes(currentUser.role)
        ? Promise.resolve([])
        : api.getMyUnitRoles()
    ]).then(([unitResponse, projectResponse, jabatanResponse, unitRoles]) => {
      if (!active) return;
      setFilterMasterData({
        units: unitResponse.data?.data || [],
        projects: projectResponse.data?.data || [],
        jabatans: jabatanResponse.data?.data || [],
        unitRoles: unitRoles || []
      });
    }).catch((error) => console.error("Gagal memuat scope filter Navbar:", error));
    return () => { active = false; };
  }, [currentUser?.id_user, currentUser?.nip]);

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
    if (filterMasterData.units.length) return filterMasterData.units;
    try {
      return MasterDataService.getAll("m_unit", { limit: 1000 })?.data || [];
    } catch {
      return [];
    }
  }, [filterMasterData.units]);
  
  const masterJabatans = useMemo(() => {
    try {
      return MasterDataService.getAll("m_jabatan", { limit: 1000 })?.data || [];
    } catch {
      return [];
    }
  }, [filterMasterData.jabatans]);

  const masterProjects = useMemo(() => {
    if (filterMasterData.projects.length) return filterMasterData.projects;
    try {
      return MasterDataService.getAll("m_project", { limit: 1000 })?.data || [];
    } catch {
      return [];
    }
  }, [filterMasterData.projects]);

  const navbarScope = useMemo(() => {
    const person = currentUser?.petugas || currentUser?.pegawai || {};
    const isAdministrator = ["admin", "superadmin"].includes(currentUser?.role);
    const unitById = new Map(masterUnits.map((unit) => [Number(unit.id_unit), unit]));
    const childrenByParent = new Map();
    masterUnits.forEach((unit) => {
      const parentId = unit.id_induk_unit == null ? null : Number(unit.id_induk_unit);
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(unit);
    });
    const collectDescendants = (rootId) => {
      const result = [];
      const queue = [Number(rootId)];
      const visited = new Set();
      while (queue.length) {
        const id = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        const unit = unitById.get(id);
        if (unit) result.push(unit);
        (childrenByParent.get(id) || []).forEach((child) => queue.push(Number(child.id_unit)));
      }
      return result;
    };

    const ownUnitId = Number(person.id_unit || person.unit?.id_unit || currentUser?.id_unit || 0);
    const ownUnit = unitById.get(ownUnitId) || person.unit;
    const path = [];
    let cursor = ownUnit;
    const visited = new Set();
    while (cursor && !visited.has(Number(cursor.id_unit))) {
      visited.add(Number(cursor.id_unit));
      path.push(cursor);
      cursor = unitById.get(Number(cursor.id_induk_unit));
    }
    const getUnitKind = (unit) => {
      const name = String(unit?.nama_unit || "").trim().toUpperCase();
      if (/^(GI\b|GARDU INDUK\b)/.test(name)) return "GI";
      if (/^ULTG\b/.test(name)) return "ULTG";
      if (/^(UPT\b|UNIT PELAKSANA\b)/.test(name)) return "UPT";
      if (/^UP(?:\s*\d|\b)/.test(name)) return "UP";
      return "UNIT";
    };
    const findPath = (kind) => path.find((unit) => getUnitKind(unit) === kind);
    const up = findPath("UP");
    const upt = findPath("UPT");
    const ultg = findPath("ULTG");
    const gi = findPath("GI");
    const ownChildren = ownUnitId ? collectDescendants(ownUnitId) : [];
    const activeAssignments = filterMasterData.unitRoles
      .filter((assignment) => assignment.is_active === "Y" && Number(assignment.id_unit));
    const scopedUnits = isAdministrator
      ? masterUnits
      : Array.from(new Map(
          (activeAssignments.length
            ? activeAssignments.flatMap((assignment) => assignment.scope_type === "SELF_AND_DESCENDANTS"
                ? collectDescendants(assignment.id_unit)
                : [unitById.get(Number(assignment.id_unit))].filter(Boolean))
            : ownChildren)
            .map((unit) => [Number(unit.id_unit), unit])
        ).values());
    const scopedIds = new Set(scopedUnits.map((unit) => Number(unit.id_unit)));
    const selectableIds = new Set(scopedIds);
    scopedUnits.forEach((unit) => {
      let parent = unitById.get(Number(unit.id_induk_unit));
      const visitedParentIds = new Set();
      while (parent) {
        const parentId = Number(parent.id_unit);
        if (visitedParentIds.has(parentId)) break;
        visitedParentIds.add(parentId);
        selectableIds.add(parentId);
        parent = unitById.get(Number(parent.id_induk_unit));
      }
    });
    const selectableUnits = masterUnits.filter((unit) => selectableIds.has(Number(unit.id_unit)));

    const selectedName = selectedGi !== "Semua GI" ? selectedGi
      : selectedUltg !== "Semua ULTG" ? selectedUltg
        : selectedUpt !== "Semua UPT" ? selectedUpt
          : selectedUp !== "Semua UP" ? selectedUp : "";
    const selectedUnit = masterUnits.find((unit) => unit.nama_unit === selectedName);
    const activeFilterUnitIds = selectedUnit
      ? collectDescendants(selectedUnit.id_unit)
          .map((unit) => Number(unit.id_unit))
          .filter((id) => isAdministrator || scopedIds.has(id))
      : scopedUnits.map((unit) => Number(unit.id_unit));

    const isPetugasAccount = Boolean(currentUser?.id_petugas || currentUser?.petugas?.id_petugas);
    const pegawaiProjects = Array.isArray(currentUser?.pegawai?.projects)
      ? currentUser.pegawai.projects
      : Array.isArray(currentUser?.projects) ? currentUser.projects : [];
    const petugasProjectId = Number(
      currentUser?.petugas?.id_project || currentUser?.petugas?.project?.id_project ||
      person.id_project || person.project?.id_project || currentUser?.id_project || 0
    );
    const assignedProjectIds = isPetugasAccount
      ? [petugasProjectId].filter(Boolean)
      : pegawaiProjects
          .filter((project) => project.is_active !== "N" && project.PegawaiProject?.is_active !== "N")
          .map((project) => Number(project.id_project))
          .filter(Boolean);
    const allowedProjectIds = isAdministrator
      ? masterProjects.map((project) => Number(project.id_project))
      : [...new Set(assignedProjectIds)].filter((id) =>
          masterProjects.some((project) => Number(project.id_project) === id)
        );
    const projectNames = masterProjects
      .filter((project) => allowedProjectIds.includes(Number(project.id_project)))
      .map((project) => project.nama_project);

    return {
      isAdministrator,
      projectId: allowedProjectIds[0] || null,
      allowedProjectIds,
      projectLabel: isAdministrator || allowedProjectIds.length > 1
        ? "Semua Project"
        : (projectNames[0] || "Project tidak ditemukan"),
      upName: isAdministrator ? "Semua UP" : (up?.nama_unit || "Semua UP"),
      uptName: isAdministrator ? "Semua UPT" : (upt?.nama_unit || "Semua UPT"),
      ultgName: isAdministrator ? "Semua ULTG" : (ultg?.nama_unit || "Semua ULTG"),
      giName: isAdministrator ? "Semua GI" : (gi?.nama_unit || "Semua GI"),
      canSelectUnit: isAdministrator || selectableUnits.length > 1,
      allowedUnitIds: scopedUnits.map((unit) => Number(unit.id_unit)),
      activeFilterUnitIds,
      selectableUnits,
      unitKindById: Object.fromEntries(masterUnits.map((unit) => [unit.id_unit, getUnitKind(unit)]))
    };
  }, [currentUser, masterUnits, masterJabatans, masterProjects, filterMasterData.unitRoles, selectedUp, selectedUpt, selectedUltg, selectedGi]);

  useEffect(() => {
    if (!currentUser || !masterUnits.length) return;
    setSelectedProject(navbarScope.projectLabel);
    setSelectedUp(navbarScope.upName);
    setSelectedUpt(navbarScope.uptName);
    setSelectedUltg(navbarScope.ultgName);
    setSelectedGi(navbarScope.giName);
  }, [currentUser?.nip, currentUser?.role, masterUnits.length]);

  const hierarchicalUnitLists = useMemo(() => {
    const units = navbarScope.selectableUnits || [];
    const byId = new Map(masterUnits.map((unit) => [Number(unit.id_unit), unit]));
    const kindOf = (unit) => navbarScope.unitKindById?.[unit.id_unit] || "UNIT";
    const hasAncestor = (unit, selectedName) => {
      if (!selectedName || selectedName.startsWith("Semua ")) return true;
      let cursor = unit;
      const visitedUnitIds = new Set();
      while (cursor) {
        if (cursor.nama_unit === selectedName) return true;
        const cursorId = Number(cursor.id_unit);
        if (visitedUnitIds.has(cursorId)) break;
        visitedUnitIds.add(cursorId);
        cursor = byId.get(Number(cursor.id_induk_unit));
      }
      return false;
    };
    const names = (kind, ...parents) => units
      .filter((unit) => kindOf(unit) === kind && parents.every((parent) => hasAncestor(unit, parent)))
      .map((unit) => unit.nama_unit)
      .sort((a, b) => String(a).localeCompare(String(b), "id"));
    return {
      upList: names("UP"),
      uptList: names("UPT", selectedUp),
      ultgList: names("ULTG", selectedUp, selectedUpt),
      giList: names("GI", selectedUp, selectedUpt, selectedUltg)
    };
  }, [masterUnits, navbarScope.selectableUnits, navbarScope.unitKindById, selectedUp, selectedUpt, selectedUltg]);

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
      // Project selalu mengikuti project user. Project ID 1 mendapat cakupan kedua project.
      if (!navbarScope.isAdministrator && navbarScope.allowedProjectIds.length) {
        const subProjectId = Number(getProjectIdForSubmission(sub, allUsers, masterJabatans));
        if (!navbarScope.allowedProjectIds.includes(subProjectId)) return false;
      }

      // 3. Global unit filters
      const emp = (allUsers || []).find((u) => u.nip === sub.employeeNip);
      const submissionUnitId = Number(sub.id_unit || emp?.id_unit || emp?.petugas?.id_unit || 0);
      const hasSpecificUnitFilter = [selectedUp, selectedUpt, selectedUltg, selectedGi]
        .some((value) => value && !value.startsWith("Semua "));
      if ((!navbarScope.isAdministrator || hasSpecificUnitFilter) && navbarScope.activeFilterUnitIds?.length) {
        if (!submissionUnitId || !navbarScope.activeFilterUnitIds.includes(submissionUnitId)) return false;
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
    selectedUp,
    selectedUpt,
    selectedUltg,
    selectedGi,
    startDate,
    endDate,
    allUsers,
    masterJabatans,
    masterProjects,
    getProjectIdForSubmission,
    getProjectNameForSubmission,
    navbarScope
  ]);

  const activeNavbarProjectIds = useMemo(() => {
    const selected = masterProjects.find((project) => project.nama_project === selectedProject);
    if (selected) return [Number(selected.id_project)];
    return navbarScope.isAdministrator ? [] : navbarScope.allowedProjectIds;
  }, [masterProjects, selectedProject, navbarScope.isAdministrator, navbarScope.allowedProjectIds]);

  const navbarProjectList = useMemo(() => navbarScope.isAdministrator
    ? masterProjects
    : masterProjects.filter((project) => navbarScope.allowedProjectIds.includes(Number(project.id_project))),
  [masterProjects, navbarScope.isAdministrator, navbarScope.allowedProjectIds]);

  const handleResetFilters = () => {
    setSelectedProject(navbarScope.projectLabel);
    setSelectedUp(navbarScope.upName);
    setSelectedUpt(navbarScope.uptName);
    setSelectedUltg(navbarScope.ultgName);
    setSelectedGi(navbarScope.giName);
    const defaultDates = getFirstAndLastDayOfCurrentMonth();
    setStartDate(defaultDates.startDate);
    setEndDate(defaultDates.endDate);
  };

  const previousRouteRef = useRef(location.pathname);
  useEffect(() => {
    if (previousRouteRef.current === location.pathname) return;
    previousRouteRef.current = location.pathname;
    handleResetFilters();
  }, [location.pathname]);

  const selectNavbarGi = useCallback((unitName) => {
    if (!unitName) {
      setSelectedUpt(navbarScope.uptName);
      setSelectedUltg(navbarScope.ultgName);
      setSelectedGi(navbarScope.giName);
      return;
    }
    const byId = new Map(masterUnits.map((unit) => [Number(unit.id_unit), unit]));
    let cursor = masterUnits.find((unit) => unit.nama_unit === unitName);
    const path = [];
    const visited = new Set();
    while (cursor && !visited.has(Number(cursor.id_unit))) {
      visited.add(Number(cursor.id_unit));
      path.push(cursor);
      cursor = byId.get(Number(cursor.id_induk_unit));
    }
    setSelectedUpt(path.find((unit) => /^UPT\b/i.test(unit.nama_unit))?.nama_unit || navbarScope.uptName);
    setSelectedUltg(path.find((unit) => /^ULTG\b/i.test(unit.nama_unit))?.nama_unit || navbarScope.ultgName);
    setSelectedGi(unitName);
  }, [masterUnits, navbarScope.uptName, navbarScope.ultgName, navbarScope.giName]);

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
    selectedUp !== "Semua UP" ||
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
            {globalThis.appStorage.getItem("epresensi_simulate_fetch_error") === "true" && (
              <button
                onClick={() => {
                  globalThis.appStorage.removeItem("epresensi_simulate_fetch_error");
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
            onLoginSuccess={(user) => {
              setCurrentUser(user || AuthService.getCurrentUser());
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
            selectedUp={selectedUp}
            setSelectedUp={setSelectedUp}
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
            upList={hierarchicalUnitLists.upList}
            uptList={hierarchicalUnitLists.uptList}
            ultgList={hierarchicalUnitLists.ultgList}
            giList={hierarchicalUnitLists.giList}
            projectList={navbarProjectList}
            projectReadOnly={!navbarScope.isAdministrator && navbarScope.allowedProjectIds.length <= 1}
            upReadOnly={!navbarScope.canSelectUnit}
            uptReadOnly={!navbarScope.canSelectUnit}
            ultgReadOnly={!navbarScope.canSelectUnit}
            giReadOnly={!navbarScope.canSelectUnit}
            navbarScope={navbarScope}
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
              setSelectedUpt={setSelectedUpt}
              setSelectedUltg={setSelectedUltg}
              setSelectedGi={setSelectedGi}
              navbarScope={navbarScope}
              navbarProjectIds={activeNavbarProjectIds}
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
                navbarProjectIds={activeNavbarProjectIds}
                startDate={startDate}
                endDate={endDate}
              />
            )
          }
        />
        <Route path="perintah-kerja-lembur" element={<RouteAccessGuard moduleId="perintah-kerja-lembur" currentUser={currentUser}><PerintahKerjaLemburPage currentUser={currentUser} navbarScope={navbarScope} startDate={startDate} endDate={endDate} /></RouteAccessGuard>} />
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
                navbarProjectIds={activeNavbarProjectIds}
                startDate={startDate}
                endDate={endDate}
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
                navbarProjectIds={activeNavbarProjectIds}
                startDate={startDate}
                endDate={endDate}
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
                navbarProjectIds={activeNavbarProjectIds}
                startDate={startDate}
                endDate={endDate}
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
                navbarProjectIds={activeNavbarProjectIds}
                startDate={startDate}
                endDate={endDate}
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
                navbarProjectIds={activeNavbarProjectIds}
              />
            </RouteAccessGuard>
          }
        />
        <Route
          path="report-permohonan"
          element={
            <RouteAccessGuard moduleId="report-permohonan" currentUser={currentUser}>
              <ReportPermohonanPage
                currentUser={currentUser}
                submissions={filteredSubmissions}
                navbarProjectIds={activeNavbarProjectIds}
                selectedProject={selectedProject}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                selectedUpt={selectedUpt}
                selectedUltg={selectedUltg}
                selectedGi={selectedGi}
                onSelectGi={selectNavbarGi}
              />
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
