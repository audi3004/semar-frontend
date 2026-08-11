import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { NotificationDrawer } from "../common/NotificationDrawer";
import { DataService } from "../../services/dataService";
import {
  Calendar,
  Filter,
  X,
  Building,
  RotateCcw,
  Check,
  Plus,
  Stethoscope,
  Clock,
  Palmtree,
  FileCheck2,
  Briefcase
} from "lucide-react";
import { formatDateIndonesian } from "../../utils/formatters";

export default function MainLayout({
  currentUser,
  onSwitchRole,
  onLogout,
  isSidebarOpen,
  setIsSidebarOpen,
  isNotificationOpen,
  setIsNotificationOpen,
  isQuickModalOpen,
  setIsQuickModalOpen,
  unreadCount,
  selectedProject,
  setSelectedProject,
  selectedUp,
  setSelectedUp,
  selectedUpt,
  setSelectedUpt,
  selectedUltg,
  setSelectedUltg,
  selectedGi,
  setSelectedGi,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onResetFilters,
  upList,
  uptList,
  ultgList,
  giList,
  projectList,
  projectReadOnly,
  upReadOnly,
  uptReadOnly,
  ultgReadOnly,
  giReadOnly,
  navbarScope,
  hasActiveFilters,
  isMobileFilterOpen,
  setIsMobileFilterOpen,
  notifications,
  refreshData,
  activeTab,
  setActiveTab
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const masterPaths = ["unit-kerja", "project", "jabatan", "pegawai", "umk", "faktor-upah", "hari-libur", "mutasi-pegawai", "users", "roles", "responsibilities", "unit-role", "pengaturan"];
  const routeRoot = location.pathname.split("/").filter(Boolean)[0] || "dashboard";
  const showGlobalFilters = !masterPaths.includes(routeRoot);

  const handleSelectNotification = (notifOrId) => {
    const notifObj = typeof notifOrId === "object" ? notifOrId : { submissionId: notifOrId };
    const allSubs = DataService.getSubmissions() || [];
    const matchedSub = allSubs.find(
      (s) =>
        s.id === notifObj.submissionId ||
        (s.nomorDokumen && notifObj.submissionId && s.nomorDokumen.includes(notifObj.submissionId))
    );

    const targetSearch = matchedSub ? matchedSub.nomorDokumen : (notifObj.submissionType || "");

    let targetPath = "/workflow";
    if (currentUser?.role === "checker") targetPath = "/workflow/checker";
    else if (currentUser?.role === "verification") targetPath = "/workflow/verification";
    else if (currentUser?.role === "approved1") targetPath = "/workflow/approval-1";
    else if (currentUser?.role === "approved2") targetPath = "/workflow/approval-2";
    else if (currentUser?.role === "approved3") targetPath = "/workflow/approval-3";
    else if (currentUser?.role === "maker") targetPath = "/workflow/maker";

    if (setActiveTab) {
      setActiveTab("workflow");
    }

    navigate(targetPath, {
      state: {
        searchQuery: targetSearch,
        typeFilter: notifObj.submissionType || ""
      }
    });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#F4F6F9] text-slate-800 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Sticky Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSwitchRole={onSwitchRole}
        onLogout={onLogout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        unreadNotificationCount={unreadCount}
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
        onResetFilters={onResetFilters}
        upList={upList}
        uptList={uptList}
        ultgList={ultgList}
        giList={giList}
        projectList={projectList}
        projectReadOnly={projectReadOnly}
        upReadOnly={upReadOnly}
        uptReadOnly={uptReadOnly}
        ultgReadOnly={ultgReadOnly}
        giReadOnly={giReadOnly}
        showGlobalFilters={showGlobalFilters}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Mobile Active Period & Filter Banner */}
      {showGlobalFilters && <div className="block md:hidden sticky top-[57px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2 shadow-xs">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
            <Calendar className="w-4 h-4 text-[#075369] shrink-0" />
            <div className="flex items-center gap-1 font-bold text-slate-900 text-[11px] truncate">
              <span className="shrink-0">Periode:</span>
              <span className="text-[#075369] font-black bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200/80 truncate">
                {startDate && endDate
                  ? `${formatDateIndonesian(startDate)} - ${formatDateIndonesian(endDate)}`
                  : startDate
                  ? `>= ${formatDateIndonesian(startDate)}`
                  : endDate
                  ? `<= ${formatDateIndonesian(endDate)}`
                  : "Semua Tanggal"}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="px-2.5 py-1 min-h-[34px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold rounded-xl text-[11px] flex items-center gap-1.5 shrink-0 border border-slate-300 transition cursor-pointer"
            >
            <Filter className="w-3.5 h-3.5 text-[#075369]" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
        </div>
      </div>}

      {/* Main App Container */}
      <div className="flex-1 flex w-full relative">
        {/* Sidebar for Desktop & Mobile Drawer */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentUser={currentUser}
          onCloseMobile={() => {
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Dynamic Main Workspace via React Router Outlet */}
        <main
          className={`flex-1 transition-all duration-300 px-3 py-3 sm:p-6 pb-24 md:pb-8 w-full max-w-none mx-auto overflow-x-hidden ${
            isSidebarOpen ? "md:pl-64" : "md:pl-16"
          }`}
          >
          <Outlet
            context={{
              currentUser,
              onRefreshData: refreshData,
              selectedProject,
              selectedUp,
              selectedUpt,
              selectedUltg,
              selectedGi,
              startDate,
              endDate,
              navbarScope
            }}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {showGlobalFilters && <div className="block md:hidden">
        <MobileNav
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenQuickCreate={() => setIsQuickModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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
          onResetFilters={onResetFilters}
          upList={upList}
          uptList={uptList}
          ultgList={ultgList}
          giList={giList}
          hasActiveFilters={hasActiveFilters}
          isMobileFilterOpen={isMobileFilterOpen}
          setIsMobileFilterOpen={setIsMobileFilterOpen}
        />
      </div>}

      {/* Quick Submission Selection Modal for Mobile */}
      {isQuickModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 my-0 sm:my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-100 text-[#00A3E0] rounded-xl">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Pilih Jenis Pengajuan</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Buat pengajuan baru sesuai kebutuhan Anda</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 text-xs">
              <button
                onClick={() => {
                  setActiveTab("sakit");
                  setIsQuickModalOpen(false);
                }}
                className="p-3 bg-rose-50 hover:bg-rose-100/80 active:bg-rose-200 border border-rose-200 rounded-2xl flex items-center justify-between transition cursor-pointer text-left"
                >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-xs">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Laporan Sakit & Surat Dokter</p>
                    <p className="text-[10px] text-rose-800 font-medium">Upload Surat Dokter (.PDF / Foto)</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-white px-2 py-1 rounded-lg border border-rose-200">Buat</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("lembur");
                  setIsQuickModalOpen(false);
                }}
                className="p-3 bg-sky-50 hover:bg-sky-100/80 active:bg-sky-200 border border-sky-200 rounded-2xl flex items-center justify-between transition cursor-pointer text-left"
                >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#00A3E0] text-white rounded-xl shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Pengajuan Lembur</p>
                    <p className="text-[10px] text-sky-800 font-medium">Surat Perintah Kerja Lembur</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-sky-700 bg-white px-2 py-1 rounded-lg border border-sky-200">Buat</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("cuti");
                  setIsQuickModalOpen(false);
                }}
                className="p-3 bg-amber-50 hover:bg-amber-100/80 active:bg-amber-200 border border-amber-200 rounded-2xl flex items-center justify-between transition cursor-pointer text-left"
                >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
                    <Palmtree className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Pengajuan Cuti</p>
                    <p className="text-[10px] text-amber-800 font-medium">Cuti Tahunan, Besar & Alasan Penting</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-white px-2 py-1 rounded-lg border border-amber-200">Buat</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("ijin");
                  setIsQuickModalOpen(false);
                }}
                className="p-3 bg-purple-50 hover:bg-purple-100/80 active:bg-purple-200 border border-purple-200 rounded-2xl flex items-center justify-between transition cursor-pointer text-left"
                >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Pengajuan Ijin</p>
                    <p className="text-[10px] text-purple-800 font-medium">Ijin Terlambat, Pulang Awal, Meninggalkan Tempat</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-1 rounded-lg border border-purple-200">Buat</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("sppd");
                  setIsQuickModalOpen(false);
                }}
                className="p-3 bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-200 border border-emerald-200 rounded-2xl flex items-center justify-between transition cursor-pointer text-left"
                >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Pengajuan SPPD</p>
                    <p className="text-[10px] text-emerald-800 font-medium">Surat Perintah Perjalanan Dinas</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">Buat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        currentUser={currentUser}
        notifications={notifications}
        onRefreshData={refreshData}
        onSelectSubmission={handleSelectNotification}
      />

      {/* Mobile Filter Modal */}
      {showGlobalFilters && isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                <Filter className="w-4 h-4 text-[#075369]" />
                <h3>Filter Periode Tanggal & Unit</h3>
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Project Filter Section */}
              <div className="space-y-1.5 pb-2 border-b border-slate-100">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#075369]" /> Pilih Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  disabled={projectReadOnly}
                  className="w-full h-10 px-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                  >
                  {!projectReadOnly && <option value="Semua Project">Semua Project</option>}
                  {projectReadOnly && !projectList?.some((p) => p.nama_project === selectedProject) && <option value={selectedProject}>{selectedProject}</option>}
                  {(projectList || []).map((p) => (
                    <option key={p.id_project} value={p.nama_project}>
                      {p.nama_project}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter Section */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#075369]" /> Filter Periode Tanggal
                </label>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = now.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const pad = (num) => String(num).padStart(2, "0");
                      setStartDate(`${year}-${pad(month + 1)}-01`);
                      setEndDate(`${year}-${pad(month + 1)}-${pad(lastDay.getDate())}`);
                    }}
                    className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-[#075369] font-bold rounded-lg text-[11px] border border-sky-200 transition cursor-pointer"
                    >
                    Bulan Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().slice(0, 10);
                      setStartDate(today);
                      setEndDate(today);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] border border-slate-300 transition cursor-pointer"
                    >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] border border-slate-300 transition cursor-pointer"
                    >
                    Semua Tanggal
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">Tanggal Awal</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-10 px-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">Tanggal Akhir</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-10 px-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Location Filter Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#075369]" /> Filter Unit Lokasi
                </label>

                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">UP</span>
                  <select
                    value={selectedUp}
                    onChange={(e) => {
                      setSelectedUp(e.target.value);
                      setSelectedUpt("Semua UPT");
                      setSelectedUltg("Semua ULTG");
                      setSelectedGi("Semua GI");
                    }}
                    disabled={upReadOnly}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-slate-50"
                  >
                    <option value="Semua UP">Semua UP</option>
                    {(upList || []).map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">UPT</span>
                  <select
                    value={selectedUpt}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedUpt(val);
                      setSelectedUltg("Semua ULTG");
                      setSelectedGi("Semua GI");
                    }}
                    disabled={uptReadOnly}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-slate-50"
                    >
                    <option value="Semua UPT">Semua UPT</option>
                    {(uptList || []).map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">ULTG</span>
                  <select
                    value={selectedUltg}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedUltg(val);
                      setSelectedGi("Semua GI");
                    }}
                    disabled={ultgReadOnly}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-slate-50"
                    >
                    <option value="Semua ULTG">Semua ULTG</option>
                    {(ultgList || []).map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">Gardu Induk (GI)</span>
                  <select
                    value={selectedGi}
                    onChange={(e) => setSelectedGi(e.target.value)}
                    disabled={giReadOnly}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-slate-50"
                    >
                    <option value="Semua GI">Semua GI</option>
                    {(giList || []).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onResetFilters}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1"
                >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="px-5 py-2.5 bg-[#075369] hover:bg-[#053d4d] text-white font-extrabold rounded-xl text-xs flex items-center gap-1 shadow-md"
                >
                <Check className="w-4 h-4" /> Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
