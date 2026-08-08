import React from "react";
import { getRoleLabel } from "../../utils/formatters";
import { Shield, ChevronDown, Check } from "lucide-react";
export const RoleSwitcher = ({ currentUser, onSwitchRole }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const rolesList = [
    { role: "superadmin", label: "Super Admin System", desc: "Akses penuh seluruh modul system & user", badgeColor: "bg-rose-600" },
    { role: "maker", label: "Maker (Pembuat)", desc: "Submit pengajuan & draft", badgeColor: "bg-emerald-500" },
    { role: "checker", label: "Checker (Pemeriksa)", desc: "Review kelengkapan data & verifikasi awal", badgeColor: "bg-sky-500" },
    { role: "approved1", label: "Approval 1 (MAN)", desc: "Approver 1: Persetujuan Manager UPT PLN", badgeColor: "bg-amber-500" },
    { role: "approved2", label: "Approval 2 (TL ES)", desc: "Approver 2: Persetujuan TL Electricity Services", badgeColor: "bg-purple-500" },
    { role: "approved3", label: "Approval 3 (AMN ES)", desc: "Approver 3: Otorisasi Final AMN ES", badgeColor: "bg-indigo-500" }
  ];
  return <div className="relative inline-block text-left select-none">
      <button
    onClick={() => setIsOpen(!isOpen)}
    className="flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold border border-slate-800 shadow-sm transition-all duration-150 cursor-pointer active:scale-95"
    aria-label="Role Switcher"
  >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        <span className="hidden md:inline text-slate-400 font-semibold">Akses:</span>
        <span className="text-[#FFD100] font-black max-w-[90px] sm:max-w-none truncate">{getRoleLabel(currentUser.role)}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      </button>

      {isOpen && <>
          <div className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-xs sm:bg-transparent sm:backdrop-blur-none" onClick={() => setIsOpen(false)} />
          <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-80 md:w-84 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 mb-1.5">
              <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#00A3E0]" /> Hak Akses Berjenjang
              </p>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">Pilih peran simulasi untuk alur persetujuan</p>
            </div>

            <div className="space-y-1 max-h-72 sm:max-h-80 overflow-y-auto overscroll-y-contain scrollbar-none">
              {rolesList.map((item) => {
    const isActive = currentUser.role === item.role;
    return <button
      key={item.role}
      onClick={() => {
        onSwitchRole(item.role);
        setIsOpen(false);
      }}
      className={`w-full text-left p-3 sm:p-2.5 rounded-xl flex items-start gap-2.5 transition duration-150 text-xs cursor-pointer active:scale-95 ${isActive ? "bg-[#00A3E0]/10 border border-[#00A3E0]/20 text-slate-900 font-extrabold" : "hover:bg-slate-50 text-slate-700 font-medium border border-transparent"}`}
    >
                    <div className={`w-2.5 h-2.5 rounded-full ${item.badgeColor} mt-1 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold flex items-center justify-between text-xs">
                        {item.label}
                        {isActive && <Check className="w-4 h-4 text-[#00A3E0]" />}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{item.desc}</p>
                    </div>
                  </button>;
  })}
            </div>
          </div>
        </>}
    </div>;
};
