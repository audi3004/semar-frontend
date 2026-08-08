import { Signal, Wifi, Battery, ChevronLeft, Bell } from "lucide-react";

export const MobileFrame = ({
  children,
  title = "SEMAR MOBILE",
  activeTabTitle = "Beranda",
  onBack,
  onOpenNotif,
  unreadCount = 0
}) => {
  return (
    <div className="min-h-dvh bg-slate-950 flex items-center justify-center p-0 sm:p-4 md:p-6 select-none">
      {/* Smartphone Device Mockup Shell */}
      <div className="w-full sm:max-w-md md:max-w-lg bg-white sm:rounded-[36px] shadow-2xl border-0 sm:border-[8px] border-slate-900 overflow-hidden flex flex-col h-dvh sm:h-[840px] md:h-[880px] relative transition-all">
        {/* Status Bar */}
        <div className="bg-slate-900 text-white px-5 py-2 flex items-center justify-between text-xs font-semibold flex-shrink-0">
          <span className="text-[11px] tracking-tight">09:41</span>
          <div className="w-20 h-3.5 bg-slate-950 rounded-full mx-auto hidden sm:block shadow-inner" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Mobile Header Bar */}
        <div className="bg-gradient-to-r from-[#075369] to-[#00A3E0] text-white px-4 py-3 flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-white/10 active:bg-white/20 rounded-xl cursor-pointer transition"
                aria-label="Kembali"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="w-7 h-7 bg-[#FFE500] rounded-lg flex items-center justify-center font-black text-slate-900 text-xs shadow-xs">
              ⚡
            </div>
            <div>
              <h2 className="text-xs font-extrabold leading-none tracking-wide text-white uppercase">
                {title}
              </h2>
              <p className="text-[10px] text-sky-100 font-medium capitalize mt-0.5">
                {activeTabTitle}
              </p>
            </div>
          </div>

          {onOpenNotif && (
            <button
              onClick={onOpenNotif}
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-xl relative cursor-pointer transition"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Mobile Viewport Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain scrollbar-hide bg-slate-50 pb-20">
          {children}
        </div>
      </div>
    </div>
  );
};

