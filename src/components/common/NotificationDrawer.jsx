import { X, Bell, Check, Clock } from "lucide-react";
import { DataService } from "../../services/dataService";
export const NotificationDrawer = ({
  isOpen,
  onClose,
  currentUser,
  notifications,
  onRefresh,
  onRefreshData,
  onSelectSubmission
}) => {
  if (!isOpen) return null;
  const rawNotifs = notifications || DataService.getNotifications(currentUser?.nip);
  const triggerRefresh = () => {
    if (onRefresh) onRefresh();
    if (onRefreshData) onRefreshData();
  };
  const userNotifs = (rawNotifs || []).filter((n) => {
    if (currentUser?.role === "admin") return true;
    if (n.targetNip && n.targetNip === currentUser?.nip) return true;
    if (n.targetRoles && currentUser?.role && n.targetRoles.includes(currentUser.role)) return true;
    return false;
  });
  const unreadCount = userNotifs.filter((n) => !n.isRead).length;
  const handleMarkAllRead = () => {
    DataService.markAllNotificationsRead();
    triggerRefresh();
  };
  const handleNotifClick = (notif) => {
    DataService.markNotificationAsRead(notif.id);
    triggerRefresh();
    if (onSelectSubmission) {
      onSelectSubmission(notif);
      onClose();
    }
  };
  return <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md md:max-w-lg bg-white shadow-2xl border-l border-slate-100 flex flex-col h-dvh">
          {
    /* Header */
  }
          <div className="p-4 sm:p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-850 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 bg-[#00A3E0]/15 text-[#00A3E0] rounded-xl border border-[#00A3E0]/10">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center glow-coral">
                    {unreadCount}
                  </span>}
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm tracking-wide text-white">Notifikasi Push Sistem</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold mt-0.5">Transisi Status Workflow 6-Tingkat</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && <button
    onClick={handleMarkAllRead}
    className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-xs text-[#00A3E0] hover:text-sky-300 hover:bg-slate-900 active:bg-slate-850 rounded-xl transition cursor-pointer"
    title="Tandai semua dibaca"
  >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </button>}
              <button
    onClick={onClose}
    className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 active:bg-slate-850 transition cursor-pointer"
    aria-label="Tutup"
  >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {
    /* List */
  }
          <div className="flex-1 overflow-y-auto overscroll-y-contain p-3.5 sm:p-4 space-y-3 pb-safe scrollbar-none">
              {userNotifs.length === 0 ? <div className="text-center py-16 text-slate-400 space-y-3">
                  <Bell className="w-12 h-12 mx-auto opacity-20" />
                  <p className="text-xs font-black text-slate-500">Belum ada notifikasi baru untuk peran Anda.</p>
                </div> : userNotifs.map((notif) => <div
    key={notif.id}
    onClick={() => handleNotifClick(notif)}
    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] ${!notif.isRead ? "bg-sky-50/50 border-sky-100 shadow-xs" : "bg-slate-50/70 border-slate-200/80 opacity-90"}`}
  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00A3E0] inline-block" />
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {notif.timestamp}
                      </span>
                    </div>

                    <p className="text-slate-600 font-semibold leading-relaxed my-1.5">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-150 text-[10px] text-slate-400 font-bold">
                      <span>Oleh: <strong className="text-slate-700 font-black">{notif.actorName}</strong></span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-700 uppercase font-bold text-[9px] tracking-wide">
                        {notif.submissionType}
                      </span>
                    </div>
                  </div>)}
            </div>
          </div>
      </div>
    </div>;
};
