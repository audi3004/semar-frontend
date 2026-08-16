import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  Palmtree,
  Stethoscope,
  FileCheck2,
  Briefcase,
  GitPullRequest,
  Menu,
  Filter
  ,FileText
} from "lucide-react";
import { ResponsibilityService } from "../../services/responsibilityService";

export const MobileNav = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenQuickCreate,
  onToggleSidebar,
  selectedProject = "Semua Project",
  selectedUpt = "Semua UPT",
  selectedUltg = "Semua ULTG",
  selectedGi = "Semua GI",
  startDate = "",
  endDate = "",
  hasActiveFilters = false,
  isMobileFilterOpen,
  setIsMobileFilterOpen
}) => {
  const navigate = useNavigate();
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

  const allTabs = [
    { id: "dashboard", label: "Beranda", icon: LayoutDashboard },
    { id: "perintah-kerja-lembur", label: "SPKL", icon: FileText },
    { id: "lembur", label: "Lembur", icon: Clock },
    { id: "cuti", label: "Cuti", icon: Palmtree },
    { id: "sakit", label: "Sakit", icon: Stethoscope },
    { id: "ijin", label: "Ijin", icon: FileCheck2 },
    { id: "sppd", label: "SPPD", icon: Briefcase },
    { id: "workflow", label: "Workflow", icon: GitPullRequest }
  ];

  const tabs = allTabs.filter((tab) => {
    return ResponsibilityService.shouldShowNavigationItem(userRole, tab.id, currentUser?.nip);
  });

  const handleOpenFilter = () => {
    if (setIsMobileFilterOpen) {
      setIsMobileFilterOpen(true);
    }
  };

  const isFilterActive =
    hasActiveFilters ||
    selectedProject !== "Semua Project" ||
    selectedUpt !== "Semua UPT" ||
    selectedUltg !== "Semua ULTG" ||
    selectedGi !== "Semua GI" ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-1.5 pt-1.5 pb-safe flex items-center justify-between md:hidden shadow-xl select-none">
      {/* Scrollable / Flexible Tabs Container */}
      <div className="flex-1 flex items-center justify-around overflow-x-auto scrollbar-none gap-0.5 pr-1">
        {/* Menu Toggle Drawer Button for Mobile Navigation */}
        <button
          onClick={onToggleSidebar}
          className="flex flex-col items-center justify-center min-w-[46px] min-h-[44px] py-1 px-1 rounded-2xl text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
          title="Buka Menu Lengkap"
          >
          <div className="p-1 rounded-xl bg-slate-100 text-slate-700">
            <Menu className="w-4 h-4" />
          </div>
          <span className="leading-none mt-0.5 font-medium">Menu</span>
        </button>

        {/* Tab Menu Toggle Drawer Button for Mobile Navigation */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isMaker && ["lembur", "cuti", "ijin", "sakit", "sppd"].includes(tab.id)) {
                  const routeMap = {
                    checker: "/workflow/checker",
                    verification: "/workflow/verification",
                    approved1: "/workflow/approval-1",
                    approved2: "/workflow/approval-2",
                    approved3: "/workflow/approval-3"
                  };
                  setActiveTab(tab.id);
                  navigate(routeMap[userRole] || "/workflow", { state: { typeFilter: tab.id } });
                } else {
                  setActiveTab(tab.id);
                  navigate(`/${tab.id}`);
                }
              }}
              className={`flex flex-col items-center justify-center min-w-[46px] min-h-[44px] py-1 px-1 rounded-2xl text-[10px] font-bold transition-all duration-150 active:scale-95 cursor-pointer shrink-0 ${
                isActive
                  ? "text-[#00A3E0]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? "bg-[#00A3E0]/15 text-[#00A3E0] scale-110" : ""
                }`}
                >
                <Icon className="w-4 h-4" />
              </div>
              <span className={`leading-none mt-0.5 ${isActive ? "font-black" : "font-medium"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Filter Trigger Button */}
        {/*<button
          onClick={handleOpenFilter}
          className={`relative flex flex-col items-center justify-center min-w-[46px] min-h-[44px] py-1 px-1 rounded-2xl text-[10px] font-bold transition-all duration-150 active:scale-95 cursor-pointer shrink-0 ${
            isFilterActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
          }`}
          title="Buka Filter Data"
          >
          <div className={`p-1 rounded-xl transition-all relative ${isFilterActive ? "bg-indigo-100 text-indigo-700 font-bold" : "bg-slate-100 text-slate-700"}`}>
            <Filter className="w-4 h-4" />
            {isFilterActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className={`leading-none mt-0.5 ${isFilterActive ? "font-black text-indigo-700" : "font-medium"}`}>
            Filter
          </span>
        </button> */}        
      </div>
    </nav>
  );
};
