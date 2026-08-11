import React, { useState } from "react";
import { createPortal } from "react-dom";
import { RoleSwitcher } from "../common/RoleSwitcher";
import { Bell, Calendar, LogOut, ChevronDown, Building, Lock, X, CheckCircle2, AlertCircle, Layers, Eye, EyeOff, Menu, Briefcase } from "lucide-react";
import { api } from "../../services/api";
import { DataService } from "../../services/dataService";
import { MasterDataService } from "../../services/masterDataService";
import { useNavigate } from "react-router-dom";
import plnLogo from "../../assets/plnes-logo.webp";
import semarLogo from "../../assets/logo_semar_trns.png";
import semarTeks from "../../assets/semar-teks-full.png";

export const Navbar = ({
  currentUser,
  onSwitchRole = () => {},
  onLogout = () => {},
  onOpenNotifications = () => {},
  unreadNotifCount,
  unreadNotificationCount,
  selectedProject = "Semua Project",
  setSelectedProject = (_v) => {},
  selectedUp = "Semua UP",
  setSelectedUp = (_v) => {},
  selectedUpt = "Semua UPT",
  setSelectedUpt = (_v) => {},
  selectedUltg = "Semua ULTG",
  setSelectedUltg = (_v) => {},
  selectedGi = "Semua GI",
  setSelectedGi = (_v) => {},
  startDate = "",
  setStartDate = (_v) => {},
  endDate = "",
  setEndDate = (_v) => {},
  onResetFilters = () => {},
  onToggleSidebar,
  isSidebarOpen = true,
  upList = [],
  uptList = ["UPT Semarang", "UPT Purwokerto", "UPT Surakarta"],
  ultgList = ["ULTG Semarang", "ULTG Salatiga", "ULTG Kudus", "ULTG Purwokerto"],
  giList = ["GI Krapyak", "GI Ungaran", "GI Tuntang", "GI Kalisari", "GI Tambakakrik"],
  projectList: scopedProjectList,
  projectReadOnly = true,
  upReadOnly = true,
  uptReadOnly = true,
  ultgReadOnly = true,
  giReadOnly = true,
  showGlobalFilters = true,
  activeTab = "dashboard",
  setActiveTab = (_v) => {}
}) => {
  const navigate = useNavigate();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const effectiveNotifications = React.useMemo(() => {
    return currentUser ? DataService.getNotifications(currentUser.nip) : [];
  }, [currentUser, showNotifMenu]);

  const localProjectList = React.useMemo(() => {
    try {
      return MasterDataService.getAll("m_project", { limit: 1000 })?.data || [];
    } catch (e) {
      console.warn("Failed to get projects in Navbar:", e);
      return [];
    }
  }, []);
  const projectList = scopedProjectList || localProjectList;

  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMessage, setPassMessage] = useState(null);
  const [showSuccessPass, setShowSuccessPass] = useState(false);
  const [showNewPassInput, setShowNewPassInput] = useState(false);
  const [showConfirmPassInput, setShowConfirmPassInput] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const effectiveUnreadCount = unreadNotifCount ?? unreadNotificationCount ?? 0;

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMessage(null);
    if (newPassword !== confirmPassword) {
      setPassMessage({ type: "error", text: "Konfirmasi kata sandi baru tidak cocok." });
      return;
    }
    if (!currentUser?.id_user) return;
    setIsChangingPassword(true);
    try {
      await api.client.patch(`/users/${currentUser.id_user}/password`, {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setPassMessage({ type: "success", text: "Password berhasil diperbarui. Silakan login kembali." });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => onLogout(), 1200);
    } catch (error) {
      setPassMessage({ type: "error", text: error.response?.data?.message || "Gagal memperbarui password." });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <header className={`sticky top-0 z-30 m-0 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] border-b border-slate-200/80 px-3 sm:px-6 py-2.5 flex flex-col select-none relative overflow-visible transition-[margin] duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-16"}`}>
      {/* Decorative Gradient Wave Accent */}
      <div className="absolute inset-y-0 left-0 w-72 bg-gradient-to-r from-sky-400/15 via-indigo-300/10 to-transparent pointer-events-none" />

      {/* Top Section: 3-Column Grid on Tablet/Desktop, Flex-row Header on Mobile */}
      <div className="flex flex-col md:grid md:grid-cols-3 items-center justify-between gap-3 md:gap-4 w-full relative z-30">
        
        {/* 1. Left Column: Logo & Subtitle Unit */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-start gap-1.5">
              {/* Task 1: semarLogo & plnLogo side-by-side, semarLogo on the left, uniform size */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <img
                  src={plnLogo}
                  alt="PLN Logo"
                  className="h-7 sm:h-8 lg:h-10 w-auto object-contain flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Task 2: Unit Pelaksana text below Task 1 */}
              <p className="text-[8px] sm:text-xs font-semibold text-slate-600 tracking-tight leading-snug">
                Unit Pelaksana 2 Jawa Tengah dan D.I Yogyakarta
              </p>
            </div>
          </div>

          {/* User Profile & Notifikasi - Mobile Positioned in Header Right next to Logo */}
          <div className="flex md:hidden items-center gap-2 shrink-0 relative z-50">
            {/* Notifikasi Button (Mobile) */}
            <button
              onClick={() => {
                const routeMap = {
                  checker: "checker",
                  verification: "verification",
                  approved1: "approval-1",
                  approved2: "approval-2",
                  approved3: "approval-3"
                };

                const suffix = routeMap[currentUser?.role] || "";
                const targetPath = suffix ? `/workflow/${suffix}` : "/workflow";

                if (setActiveTab) setActiveTab("workflow");
                if (navigate) navigate(targetPath);
                if (onOpenNotifications) onOpenNotifications();
              }}
              className="relative p-1.5 px-2.5 min-h-[36px] flex items-center gap-1 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 border border-slate-200/80 text-slate-700 rounded-full transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs text-xs font-semibold"
              title="Buka Halaman Eksekusi Workflow"
              aria-label="Direct Link to Workflow"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {effectiveUnreadCount > 0 && (
                <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {effectiveUnreadCount}
                </span>
              )}
            </button>

            {/* User Profile Avatar Button (Mobile) */}
            {currentUser && (
              <div className="relative z-50">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifMenu(false);
                  }}
                  className="flex items-center gap-1 p-1 pr-2 min-h-[36px] rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition duration-150 cursor-pointer active:scale-95 shadow-2xs relative z-50"
                >
                  <img
                    src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Center Column: Logo Teks */}
        <div className="hidden md:flex flex-col items-center justify-center px-2 lg:px-4 w-full h-full min-w-0 space-y-1">
          <img
            src={semarLogo}
            alt="SEMAR Logo"
            className="h-7 sm:h-8 lg:h-10 w-auto object-contain flex-shrink-0"
            referrerPolicy="no-referrer"
          />
          <img
            src={semarTeks}
            alt="Semar Teks"
            className="w-full h-auto max-h-10 md:max-h-12 lg:max-h-16 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* 3. Right Column: User Info & Notifikasi - Desktop View */}
        <div className="hidden md:flex flex-col items-end gap-2 w-full md:w-auto relative z-50">
          {/* Informasi User (Atas) */}
          {currentUser && (
            <div className="relative z-50">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifMenu(false);
                }}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 min-h-[38px] rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition duration-150 cursor-pointer active:scale-95 shadow-2xs relative z-50"
              >
                <img
                  src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
                />
                <div className="text-left text-xs leading-tight hidden sm:block">
                  <p className="font-bold text-slate-900">{currentUser.name}</p>
                  <p className="max-w-44 truncate text-[10px] font-semibold text-slate-500">
                    {currentUser.roleName || currentUser.role} • {currentUser.jabatan}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-[80]" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-[100] p-3 space-y-2 animate-in fade-in zoom-in duration-150">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500">NIP: {currentUser.nip}</p>
                      <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-[10px]">
                        <p><span className="font-bold text-slate-500">Role:</span> <span className="font-bold text-[#075369]">{currentUser.roleName || currentUser.role}</span></p>
                        <p><span className="font-bold text-slate-500">Jabatan:</span> <span className="font-semibold text-slate-700">{currentUser.jabatan || "-"}</span></p>
                        <p><span className="font-bold text-slate-500">Unit:</span> <span className="font-semibold text-slate-700">{currentUser.unit || currentUser.unitUpt || "-"}</span></p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setIsChangePassOpen(true);
                      }}
                      className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-[#075369]" /> Ubah Password Mandiri
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Keluar (Logout)
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notifikasi (Bawah) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const routeMap = {
                  checker: "checker",
                  verification: "verification",
                  approved1: "approval-1",
                  approved2: "approval-2",
                  approved3: "approval-3"
                };

                const suffix = routeMap[currentUser?.role] || "";
                const targetPath = suffix ? `/workflow/${suffix}` : "/workflow";

                if (setActiveTab) setActiveTab("workflow");
                if (navigate) navigate(targetPath);
                if (onOpenNotifications) onOpenNotifications();
              }}
              className="relative p-1.5 px-3 min-h-[32px] flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 border border-slate-200/80 text-slate-700 rounded-full transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs text-xs font-semibold"
              title="Buka Halaman Eksekusi Workflow"
              aria-label="Direct Link to Workflow"
            >
              <Bell className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-[11px] font-bold text-slate-700">Notifikasi</span>
              {effectiveUnreadCount > 0 && (
                <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {effectiveUnreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Seksi Filter Desktop */}
      {showGlobalFilters && <div className="hidden md:block w-full mt-3 pt-2.5 border-t border-slate-200/60 relative z-0">

        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 lg:gap-4 text-xs bg-gradient-to-r from-slate-100/90 to-sky-50/70 p-1.5 md:p-2 rounded-2xl md:rounded-full border border-slate-200/70 shadow-inner">
          
          {/* Text Label Pilih Project */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/70 rounded-full font-black text-[11px] text-slate-700 uppercase tracking-wider shrink-0">
            <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Pilih Project:</span>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full transition shadow-2xs">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={projectReadOnly}
              className="bg-transparent font-bold text-slate-800 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-600 cursor-pointer text-xs"
            >
              {!projectReadOnly && <option value="Semua Project">Semua Project</option>}
              {projectReadOnly && !projectList.some((p) => p.nama_project === selectedProject) && <option value={selectedProject}>{selectedProject}</option>}
              {(projectList || []).map((p) => (
                <option key={p.id_project} value={p.nama_project}>
                  {p.nama_project}
                </option>
              ))}
            </select>
          </div>

          {/* Text Label Filter Unit */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/70 rounded-full font-black text-[11px] text-slate-700 uppercase tracking-wider shrink-0">
            <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Filter Unit:</span>
          </div>

          {/* UPT Filter */}
          <div className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full transition shadow-2xs">
            <select
              value={selectedUp}
              onChange={(e) => {
                setSelectedUp(e.target.value);
                setSelectedUpt("Semua UPT");
                setSelectedUltg("Semua ULTG");
                setSelectedGi("Semua GI");
              }}
              disabled={upReadOnly}
              className="bg-transparent font-bold text-slate-800 focus:outline-none disabled:cursor-not-allowed cursor-pointer text-xs"
            >
              <option value="Semua UP">Semua UP</option>
              {(upList || []).map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </div>

          {/* UPT Filter */}
          <div className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full transition shadow-2xs">
            <select
              value={selectedUpt}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedUpt(val);
                setSelectedUltg("Semua ULTG");
                setSelectedGi("Semua GI");
              }}
              disabled={uptReadOnly}
              className="bg-transparent font-bold text-slate-800 focus:outline-none disabled:cursor-not-allowed cursor-pointer text-xs"
            >
              <option value="Semua UPT">Semua UPT</option>
              {(uptList || []).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* ULTG Filter */}
          <div className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full transition shadow-2xs">
            <select
              value={selectedUltg}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedUltg(val);
                setSelectedGi("Semua GI");
              }}
              disabled={ultgReadOnly}
              className="bg-transparent font-bold text-slate-800 focus:outline-none disabled:cursor-not-allowed cursor-pointer text-xs"
            >
              <option value="Semua ULTG">Semua ULTG</option>
              {(ultgList || []).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Gardu Induk Filter */}
          <div className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full transition shadow-2xs">
            <select
              value={selectedGi}
              onChange={(e) => setSelectedGi(e.target.value)}
              disabled={giReadOnly}
              className="bg-transparent font-bold text-slate-800 focus:outline-none disabled:cursor-not-allowed cursor-pointer text-xs"
            >
              <option value="Semua GI">Semua GI</option>
              {(giList || []).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Text Label Filter Tanggal */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/70 rounded-full font-black text-[11px] text-slate-700 uppercase tracking-wider shrink-0">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Periode/Tanggal:</span>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full text-slate-700 transition shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs w-[105px]"
                title="Tanggal Awal Periode Filter"
              />
              <span className="text-slate-400 font-bold text-[10px]">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs w-[105px]"
                title="Tanggal Akhir Periode Filter"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                title="Reset Filter Tanggal"
                className="p-0.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>}

      {/* Popup profil khusus mobile */}
      {showUserMenu && currentUser && createPortal(
        <div className="md:hidden fixed inset-0 z-[9998] flex items-start justify-end p-3 pt-16 bg-slate-950/30 backdrop-blur-[1px]" onClick={() => setShowUserMenu(false)}>
          <div
            className="w-[min(19rem,calc(100vw-1.5rem))] bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-300"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">NIP: {currentUser.nip}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 border-t border-slate-200 pt-2 text-[10px]">
                <p><span className="font-bold text-slate-500">Role:</span> <span className="font-bold text-[#075369]">{currentUser.roleName || currentUser.role}</span></p>
                <p><span className="font-bold text-slate-500">Jabatan:</span> <span className="font-semibold text-slate-700">{currentUser.jabatan || "-"}</span></p>
                <p><span className="font-bold text-slate-500">Unit:</span> <span className="font-semibold text-slate-700">{currentUser.unit || currentUser.unitUpt || "-"}</span></p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false);
                setPassMessage(null);
                setIsChangePassOpen(true);
              }}
              className="w-full text-left p-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 flex items-center gap-2 transition"
            >
              <Lock className="w-4 h-4 text-[#075369]" /> Ubah Password
            </button>

            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false);
                onLogout();
              }}
              className="w-full text-left p-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 active:bg-rose-100 flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" /> Keluar (Logout)
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Ubah Password Mandiri */}
      {isChangePassOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 sm:space-y-5 border border-slate-200 relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto my-auto">
            <button
              type="button"
              onClick={() => {
                setIsChangePassOpen(false);
                setPassMessage(null);
                setShowSuccessPass(false);
                setNewPassword("");
                setConfirmPassword("");
                setShowNewPassInput(false);
                setShowConfirmPassInput(false);
              }}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 pr-8">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">Ubah Kata Sandi</h3>
                <p className="text-xs text-slate-500 font-medium truncate">Akun NIP: {currentUser.nip} ({currentUser.name})</p>
              </div>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Kata Sandi Lama</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#075369] focus:ring-1 focus:ring-[#075369]/30"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Kata Sandi Baru (Min. 6 Karakter)</label>
                <div className="relative">
                  <input
                    type={showNewPassInput ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru"
                    className="w-full h-10 pl-3 pr-10 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#075369] focus:ring-1 focus:ring-[#075369]/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassInput(!showNewPassInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
                    title={showNewPassInput ? "Sembunyikan Password" : "Tampilkan Password"}
                  >
                    {showNewPassInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Konfirmasi Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    type={showConfirmPassInput ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full h-10 pl-3 pr-10 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#075369] focus:ring-1 focus:ring-[#075369]/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassInput(!showConfirmPassInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
                    title={showConfirmPassInput ? "Sembunyikan Password" : "Tampilkan Password"}
                  >
                    {showConfirmPassInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passMessage && (
                <div className={`p-3.5 sm:p-4 rounded-2xl text-xs font-semibold space-y-2.5 ${passMessage.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-rose-50 border border-rose-200 text-rose-800"}`}>
                  <div className="flex items-center gap-2">
                    {passMessage.type === "success" ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4.5 h-4.5 text-rose-600 flex-shrink-0" />}
                    <span className="font-bold">{passMessage.text}</span>
                  </div>
                  
                  {passMessage.type === "success" && passMessage.encryptedPassword && (
                    <div className="bg-white/85 border border-emerald-100 rounded-xl p-3 space-y-1.5 text-slate-800 animate-in fade-in zoom-in duration-150">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>DETAIL AKSES BARU</span>
                        <span className="text-emerald-600 uppercase font-black">Tersimpan ke Master</span>
                      </div>
                      <div className="text-xs font-medium">
                        <span className="text-slate-500 font-semibold">Akun NIP:</span> <span className="font-mono font-bold text-slate-900">{currentUser.nip}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="min-w-0 font-mono text-xs break-all">
                          <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase leading-none mb-1">
                            {showSuccessPass ? "KATA SANDI DEKRIPSI (PLAIN)" : "KATA SANDI TERENKRIPSI (BASE64)"}
                          </span>
                          <span className="font-black tracking-wide text-slate-800">
                            {showSuccessPass ? newPassword : passMessage.encryptedPassword}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSuccessPass(!showSuccessPass)}
                          className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
                          title={showSuccessPass ? "Tampilkan Terenkripsi" : "Tampilkan Plaintext"}
                        >
                          {showSuccessPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePassOpen(false);
                    setPassMessage(null);
                    setShowSuccessPass(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setShowNewPassInput(false);
                    setShowConfirmPassInput(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 bg-[#075369] hover:bg-[#053d4d] text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  {isChangingPassword ? "Menyimpan..." : "Simpan Password"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
