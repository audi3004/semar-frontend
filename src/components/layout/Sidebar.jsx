import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  Palmtree,
  FileCheck2,
  Stethoscope,
  Briefcase,
  GitPullRequest,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Users,
  Building2,
  FolderKanban,
  Award,
  Coins,
  Calculator,
  Calendar,
  ArrowRightLeft,
  UserPlus,
  ShieldCheck,
  Sliders,
  LogOut,
  X,
  PanelLeft,
  Network
} from "lucide-react";
import { ResponsibilityService } from "../../services/responsibilityService";

export const Sidebar = ({
  activeTab,
  setActiveTab,
  isOpen,
  onLogout,
  currentUser,
  pendingCount = 0,
  onCloseMobile,
  onToggleSidebar
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMaker = currentUser?.role === "maker";
  const [permissions, setPermissions] = useState(() => ResponsibilityService.getPermissions());

  useEffect(() => {
    const handleUpdate = () => {
      setPermissions(ResponsibilityService.getPermissions());
    };
    window.addEventListener("responsibility-updated", handleUpdate);
    return () => window.removeEventListener("responsibility-updated", handleUpdate);
  }, []);

  const userRole = currentUser?.role || "maker";

  const allOperasionalItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "perintah-kerja-lembur", label: "Surat Perintah Kerja Lembur", icon: FileText },
    { id: "lembur", label: "Lembur", icon: Clock },
    { id: "cuti", label: "Cuti", icon: Palmtree },
    { id: "ijin", label: "Ijin", icon: FileCheck2 },
    { id: "sakit", label: "Sakit", icon: Stethoscope },
    { id: "sppd", label: "SPPD", icon: Briefcase },
    { id: "workflow", label: "Workflow Approval", icon: GitPullRequest }
  ];

  const operasionalItems = allOperasionalItems.filter((item) => {
    return ResponsibilityService.shouldShowNavigationItem(userRole, item.id, currentUser?.nip);
  });

  const allReportDokumenItems = [
    { id: "list-dokumen", label: "List Dokumen", icon: FolderArchive },
    { id: "report-permohonan", label: "Report Permohonan", icon: FileSpreadsheet }
  ];

  const reportDokumenItems = allReportDokumenItems.filter((item) => {
    return ResponsibilityService.hasAccess(userRole, item.id, currentUser?.nip);
  });

  const allAdministratorItems = [
    { id: "unit-kerja", label: "Unit Kerja", icon: Building2 },
    { id: "project", label: "Project", icon: FolderKanban },
    { id: "jabatan", label: "Jabatan", icon: Award },
    { id: "pegawai", label: "Pegawai & Petugas", icon: Users },
    { id: "umk", label: "UMK", icon: Coins },
    { id: "faktor-upah", label: "Faktor Upah - KOEF & TMK", icon: Calculator },
    { id: "mutasi-pegawai", label: "Mutasi Pegawai", icon: ArrowRightLeft },
    { id: "users", label: "Daftar User", icon: UserPlus },
    { id: "roles", label: "Roles", icon: ShieldCheck },
    { id: "unit-role", label: "Unit Role", icon: Network },
    { id: "hari-libur", label: "Hari Libur", icon: Calendar },
    { id: "responsibilities", label: "Responsibility & Role User", icon: Sliders }
  ];

  const administratorItems = allAdministratorItems.filter((item) => {
    const permissionId = item.id === "unit-role" ? "users" : item.id;
    return ResponsibilityService.hasAccess(userRole, permissionId, currentUser?.nip);
  });

  const handleTabClick = (id) => {
    if (!isMaker && ["lembur", "cuti", "ijin", "sakit", "sppd"].includes(id)) {
      const routeMap = {
        checker: "/workflow/checker",
        verification: "/workflow/verification",
        approved1: "/workflow/approval-1",
        approved2: "/workflow/approval-2",
        approved3: "/workflow/approval-3"
      };
      setActiveTab(id);
      navigate(routeMap[userRole] || "/workflow", { state: { typeFilter: id } });
    } else {
      setActiveTab(id);
      navigate(`/${id}`);
    }
    if (onCloseMobile && window.innerWidth < 768) onCloseMobile();
  };

  const renderMenuItem = (item, theme = "indigo", categoryLabel = "MENU") => {
    const Icon = item.icon;
    const isActive =
      activeTab === item.id ||
      location.pathname === `/${item.id}` ||
      (item.id !== "dashboard" && location.pathname.startsWith(`/${item.id}`));

    const activeBg = theme === "emerald"
      ? "bg-emerald-50/90 text-emerald-700 font-extrabold shadow-2xs border border-emerald-100/80"
      : "bg-indigo-50/90 text-indigo-700 font-extrabold shadow-2xs border border-indigo-100/80";

    const activeIcon = theme === "emerald"
      ? "text-emerald-600 stroke-[2.5]"
      : "text-indigo-600 stroke-[2.5]";

    return (
      <div key={item.id} className="relative group">
        <button
          type="button"
          onClick={() => handleTabClick(item.id)}
          title={!isOpen ? item.label : undefined}
          className={`w-full flex items-center transition-all duration-200 cursor-pointer ${
            isOpen
              ? "justify-between px-3.5 py-2 rounded-xl text-xs font-bold"
              : "justify-center p-2.5 rounded-xl text-xs font-bold md:justify-center md:px-2 md:py-2.5"
          } ${
            isActive
              ? activeBg
              : "text-slate-600 hover:bg-orange-100 hover:text-black"
          }`}
          >
          <div className="flex items-center gap-2.5 truncate min-w-0">
            <div className="relative shrink-0 flex items-center justify-center">
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? activeIcon : "text-slate-400"}`} />
              
              {!isOpen && item.id === "dashboard" && pendingCount > 0 && (
                <span className="hidden md:block absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white" />
              )}
            </div>

            {isOpen && <span className="truncate">{item.label}</span>}
          </div>

          {isOpen && item.id === "dashboard" && pendingCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 transition-all ${
                isActive ? "bg-indigo-600 text-white" : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
              >
              {pendingCount}
            </span>
          )}
        </button>

        {/* Flyout Submenu / Card Label saat Sidebar Tertutup pada Desktop */}
        {!isOpen && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleTabClick(item.id);
            }}
            className="hidden md:group-hover:flex absolute left-[4.5rem] top-1/2 -translate-y-1/2 bg-slate-500/95 text-slate-800 rounded-xl shadow-xl shadow-slate-200/50 z-[100] flex-col p-3 min-w-[200px] border border-slate-200/80 backdrop-blur-md cursor-pointer pointer-events-auto transition-all duration-200 animate-in fade-in slide-in-from-left-2 active:scale-95 group/flyout before:absolute before:content-[''] before:top-0 before:bottom-0 before:-left-4 before:w-4 before:bg-transparent"
            >
            {/* Panah Indikator Kiri Menunjuk ke Icon */}
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[8px] border-r-slate-50/95" />

            {/* Sub-Header Kategori Menu */}
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1 opacity-90 border-b border-slate-200/80 pb-1">
              {categoryLabel}
            </span>

            {/* Label Menu Utama & Pending Badge */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs font-bold text-slate-800 group-hover/flyout:text-indigo-600 transition truncate">
                {item.label}
              </span>

              {item.id === "dashboard" && pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white shadow-xs shrink-0">
                  {pendingCount}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSectionHeader = (title, subtitle, colorClass) => {
    if (isOpen) {
      return (
        <div className="px-3 py-1 flex flex-col gap-0.5 mb-1 border-b border-slate-100 pb-1.5">
          <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>
            {title}
          </span>
          <span className="text-[9px] text-slate-400 font-medium leading-tight">
            {subtitle}
          </span>
        </div>
      );
    }

    return <div className="hidden md:block my-2 border-b border-slate-100/80" />;
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`bg-white/95 backdrop-blur-xl text-slate-800 border-r border-slate-200/80 flex-shrink-0 flex flex-col select-none fixed left-0 top-0 z-40 transition-all duration-300 shadow-[8px_0_30px_rgba(15,23,42,0.05)] h-dvh overflow-hidden ${
          isOpen
            ? "translate-x-0 w-64 p-3.5"
            : "-translate-x-full w-64 p-3.5 md:translate-x-0 md:w-16 md:p-2"
        }`}
        >
        <div className="flex flex-col h-full min-h-0">
          {/* Desktop Toggle Button - Paling Atas Sidebar */}
          {onToggleSidebar && (
            <div
              className={`hidden md:flex shrink-0 items-center pb-2.5 mb-2.5 border-b border-slate-100 ${
                isOpen ? "justify-between px-2" : "justify-center"
              }`}
              >
              {isOpen && (
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider truncate">
                  Menu Navigasi
                </span>
              )}
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-slate-700 transition duration-150 cursor-pointer active:scale-95 shadow-2xs shrink-0"
                title={isOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
                aria-label="Toggle Sidebar"
                >
                <PanelLeft className="w-4 h-4 text-slate-900" />
              </button>
            </div>
          )}

          {/* Mobile Drawer Header dengan Tombol Close */}
          <div className="flex md:hidden shrink-0 items-center justify-between px-2 pb-2 mb-2.5 border-b border-slate-200/80">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Menu Navigasi</span>
            <button
              onClick={onCloseMobile}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Tutup Menu"
              >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hanya daftar menu yang bergulir; kontrol sidebar tetap di atas. */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-none space-y-3 pr-0.5">
          {/* Layer 1: Operasional / Transaksional */}
          <div className="space-y-1">
            {renderSectionHeader(
              "OPERASIONAL & TRANSAKSIONAL",
              "Formulir Permohonan & Approval",
              "text-indigo-700"
            )}
            {operasionalItems.map((item) =>
              renderMenuItem(item, "indigo", "OPERASIONAL")
            )}
          </div>

          {/* Layer 2: Report & Dokumen */}
          {reportDokumenItems.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-100 md:border-t-0">
              {renderSectionHeader(
                "REPORT & DOKUMEN",
                "List Dokumen & Laporan Permohonan",
                "text-emerald-600"
              )}
              {reportDokumenItems.map((item) =>
                renderMenuItem(item, "emerald", "REPORT & DOKUMEN")
              )}
            </div>
          )}

          {/* Layer 3: Administrator */}
          {administratorItems.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-100 md:border-t-0">
              {renderSectionHeader(
                "ADMINISTRATOR",
                "Setup Informasi Data Master & Pengaturan User",
                "text-slate-700"
              )}
              {administratorItems.map((item) =>
                renderMenuItem(item, "indigo", "ADMINISTRATOR")
              )}
            </div>
          )}
          </div>
        </div>
      </aside>
    </>
  );
};
