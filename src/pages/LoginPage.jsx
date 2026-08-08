import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthService } from "../services/authService";
import { LogIn, Key, UserCheck, Lock, CheckCircle2, AlertCircle, X, Clock, Eye, EyeOff } from "lucide-react";
import plnLogo from "../assets/plnes-logo.webp";
import semarLogo from "../assets/logo_semar_trns.png";
import { toast } from "../utils/toast";

export const LoginPage = ({ onLoginSuccess }) => {
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get("expired") === "true";
  const users = AuthService.getUsers();
  const [identifierInput, setIdentifierInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [changePassNip, setChangePassNip] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMessage, setPassMessage] = useState(null);
  const [showSuccessPass, setShowSuccessPass] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showNewPassInput, setShowNewPassInput] = useState(false);
  const [showConfirmPassInput, setShowConfirmPassInput] = useState(false);

  const handleNormalLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!identifierInput.trim()) {
      setErrorMsg("Masukkan NIP, Email, atau Nama Pengguna.");
      toast.error("Masukkan NIP, Email, atau Nama Pengguna.");
      return;
    }
    setIsSubmitting(true);
    const res = await AuthService.login(identifierInput, passwordInput);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Login Berhasil! Selamat datang kembali.");
      onLoginSuccess();
    } else {
      const msg = res.message || "Login gagal. Periksa kembali NIP dan kata sandi Anda.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const handleQuickLogin = (user) => {
    setIdentifierInput(user.nip);
    setPasswordInput(user.password || "123456");
    const res = AuthService.login(user.nip, user.password || "123456");
    if (res.success) {
      toast.success(`Login Cepat Berhasil sebagai ${user.name}!`);
      onLoginSuccess();
    } else {
      toast.error(res.message || "Gagal melakukan login cepat.");
    }
  };

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    setPassMessage(null);
    const trimmedNip = (changePassNip || "").trim();
    if (!trimmedNip) {
      setPassMessage({ type: "error", text: "Silakan masukkan NIP Anda." });
      toast.error("Silakan masukkan NIP Anda.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMessage({ type: "error", text: "Konfirmasi kata sandi baru tidak cocok." });
      toast.error("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }
    const res = AuthService.changePassword(trimmedNip, null, newPassword);
    if (res.success) {
      setPassMessage({ 
        type: "success", 
        text: "Kata sandi berhasil diperbarui! Silakan gunakan untuk login.",
        encryptedPassword: res.encryptedPassword 
      });
      toast.success("Kata Sandi Berhasil Diperbarui!");
      setIdentifierInput(trimmedNip);
      setPasswordInput(newPassword);
    } else {
      setPassMessage({ type: "error", text: res.message });
      toast.error(res.message || "Gagal memperbarui kata sandi.");
    }
  };
  return <div id="login-page" className="min-h-dvh w-full flex flex-col md:flex-row bg-slate-50 font-sans select-none relative overflow-hidden">
      {/* Visual Left side Banner */}
      <div className="md:w-1/2 lg:w-5/12 xl:w-1/2 bg-slate-950 text-white p-6 sm:p-8 md:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden flex-shrink-0">
        {/* Background visual graphics with modern gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-[#00A3E0]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-[#FFD100]/10 rounded-full blur-[120px] pointer-events-none" />
        {/* Subtle grid pattern for Gen-Z tech aesthetic */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        {/* Mid descriptive content */}
        <div className="space-y-4 sm:space-y-6 max-w-lg z-10 my-6 md:my-14 lg:my-16">
          <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-[#FFD100] px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest border border-white/10 shadow-sm">
            <span className="w-1.5 h-1.5 bg-[#FFD100] rounded-full animate-pulse"></span>
            Platform Digital Management
          </span>
          <h2 className="text-1xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
            Sistem Elektronik Manajemen Aktivitas dan Real-Time approval 
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-semibold hidden sm:block">
            Pencatatan/Permohonan (Lembur, Cuti, Ijin, Sakit, SPPD), Monitoring real-Time, serta Persetujuan Berjenjang Terpadu.
          </p>
        </div>

        {
    /* Bottom copyright */
  }
        <div className="text-[10px] sm:text-xs text-slate-500 font-bold z-10 flex justify-between items-center border-t border-slate-900 pt-4">
          <span>SEMAR v1.0.0</span>
          <span>© 2026 PT PLN PLN Electricity Services Unit Pelaksana 2 Jawa Tengah &amp; D.I Yogyakarta</span>
        </div>
      </div>

      {/* Interactive Right side Form */}
      <div className="flex-1 md:w-1/2 lg:w-7/12 xl:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-10 lg:p-16 bg-slate-50/50 relative overflow-y-auto">
        {/* Subtle PLN Blue Gradient — Left Side Only */}
        <div
          className="
            absolute inset-0
            bg-[linear-gradient(110deg,rgba(0,163,224,0.30)_0%,rgba(0,163,224,0.20)_20%,rgba(0,163,224,0.10)_42%,rgba(0,163,224,0.04)_62%,transparent_80%)]
            pointer-events-none
          "
        />

        {/* Very Subtle Grid — Left Side */}
        <div
          className="
            absolute inset-0
            bg-[linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)]
            bg-[size:4rem_4rem]
            [mask-image:linear-gradient(to_right,black_0%,black_25%,transparent_65%)]
            opacity-30
            pointer-events-none
          "
        />

        <div className="absolute top-[-20%] left-[-20%] w-[400px] h-[400px] bg-[#00A3E0]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-md lg:max-w-lg space-y-6 sm:space-y-8 relative z-10 bg-white p-6 sm:p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40">
          {/* Top Brand Centered */}
          <div className="flex flex-col items-center text-center gap-2.5 pb-4.5 border-b border-slate-100">
            <div className="flex items-center justify-center gap-3">
              <img src={semarLogo} alt="SEMAR Logo" className="h-10 sm:h-12 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(0,163,224,0.15)] transition-transform duration-300 hover:scale-105" referrerPolicy="no-referrer" />
              <img src={plnLogo} alt="PLN Logo" className="h-8 sm:h-10 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(0,163,224,0.15)] transition-transform duration-300 hover:scale-105" referrerPolicy="no-referrer" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xs sm:text-sm font-black tracking-widest uppercase text-slate-900 leading-normal">Unit Pelaksana 2</h1>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Jawa Tengah & D.I Yogyakarta</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              Selamat Datang <span className="animate-bounce">👋</span>
            </h3>
            <p className="text-xs text-slate-500 font-bold">Silakan masuk menggunakan username dan kata sandi Anda</p>
          </div>

          {isExpired && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 animate-pulse" id="session-expired-notice">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">Sesi Anda Telah Berakhir</h4>
                <p className="text-[11px] text-amber-700 font-semibold leading-normal">
                  Untuk menjaga keamanan data Anda, sistem otomatis mengakhiri sesi setelah periode tidak aktif. Silakan masuk kembali.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleNormalLogin} className="space-y-4.5">
            {
    /* Direct Data Input for NIP / Username */
  }
            <div className="space-y-1.5">
              <label htmlFor="input-identifier" className="text-xs font-bold text-slate-800 block">
                Username
              </label>
              <div className="relative">
                <input
                  id="input-identifier"
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={identifierInput}
                  onChange={(e) => setIdentifierInput(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#00A3E0] focus:bg-white focus:ring-4 focus:ring-[#00A3E0]/10 transition duration-150"
                  required
                />
              </div>
            </div>

            {
    /* Quick Select Account Helper Dropdown */
  }
            <div className="hidden">
              <label htmlFor="user-select-helper" className="text-[11px] font-bold text-slate-400 flex justify-between">
                <span>PILIH DARI DAFTAR AKUN (OPSIONAL)</span>
              </label>
              <select
                id="user-select-helper"
                value={identifierInput}
                onChange={(e) => {
                  setIdentifierInput(e.target.value);
                  const selected = users.find((u) => u.nip === e.target.value);
                  if (selected) {
                    setPasswordInput(selected.password || "123456");
                  }
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/60 bg-slate-50/50 text-xs font-bold text-slate-750 cursor-pointer focus:outline-none focus:border-[#00A3E0] focus:ring-4 focus:ring-[#00A3E0]/5 transition duration-150"
              >
                {users.map((u) => <option key={u.id} value={u.nip}>
                    {u.nip} — {u.name} ({u.role.toUpperCase()})
                  </option>)}
              </select>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="user-password" className="text-xs font-bold text-slate-800">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setChangePassNip(identifierInput || users[0].nip);
                    setIsChangePassOpen(true);
                  }}
                  className="hidden text-[11px] text-[#00A3E0] hover:text-[#0077B6] font-extrabold p-1 cursor-pointer transition"
                >
                  Ubah Password
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  id="user-password"
                  type={showLoginPass ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full h-12 pl-10 pr-10 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#00A3E0] focus:ring-4 focus:ring-[#00A3E0]/10 transition duration-150"
                  placeholder="Masukkan kata sandi"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
                  title={showLoginPass ? "Sembunyikan Password" : "Tampilkan Password"}
                >
                  {showLoginPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {errorMsg && <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>}

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-slate-900 hover:bg-slate-850 active:bg-slate-950 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <LogIn className="h-4 w-4 text-[#FFD100]" />
              <span>{isSubmitting ? "Menghubungkan..." : "Login"}</span>
            </button>
          </form>

          {/* Quick Access Grid Section */}
          {/*div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
              Akses Cepat (Uji Simulasi)
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {users.map((user) => <button
              key={user.id}
              type="button"
              onClick={() => handleQuickLogin(user)}
              className="p-3 border border-slate-200/80 hover:border-[#00A3E0]/40 active:bg-[#00A3E0]/5 bg-white hover:bg-slate-50/50 text-left rounded-2xl transition duration-150 group flex flex-col justify-between cursor-pointer active:scale-95 shadow-xs hover:shadow-sm"
            >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase group-hover:text-[#00A3E0] transition">
                      {user.role}
                    </span>
                    <UserCheck className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#00A3E0] transition" />
                  </div>
                  <span className="text-[11px] font-black text-slate-900 truncate mt-1.5">
                    {user.name.split(" ")[0]}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold truncate leading-tight mt-0.5">
                    {user.jabatan}
                  </span>
                </button>)}
            </div>
          </div>
          */}
        </div>
      </div>

      {
    /* Modal Self Service Ubah Password Mandiri */
  }
      {isChangePassOpen && <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 border border-slate-200 relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto overscroll-y-contain">
            <button
              onClick={() => {
                setIsChangePassOpen(false);
                setPassMessage(null);
                setShowSuccessPass(false);
                setChangePassNip("");
                setNewPassword("");
                setConfirmPassword("");
                setShowNewPassInput(false);
                setShowConfirmPassInput(false);
              }}
              className="absolute top-4 right-4 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">Ubah Password Mandiri</h3>
                <p className="text-xs text-slate-500 font-medium">Perbarui kata sandi akun Anda</p>
              </div>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Masukan NIP</label>
                <input
                  type="text"
                  value={changePassNip}
                  onChange={(e) => setChangePassNip(e.target.value)}
                  placeholder="Masukkan NIP Anda (Contoh: 8912345Z)"
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
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
                    className="w-full h-11 pl-3 pr-10 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#075369]/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassInput(!showNewPassInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center justify-center"
                    title={showNewPassInput ? "Sembunyikan Password" : "Tampilkan Password"}
                  >
                    {showNewPassInput ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
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
                    className="w-full h-11 pl-3 pr-10 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#075369]/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassInput(!showConfirmPassInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center justify-center"
                    title={showConfirmPassInput ? "Sembunyikan Password" : "Tampilkan Password"}
                  >
                    {showConfirmPassInput ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {passMessage && (
                <div className={`p-4 rounded-2xl text-xs font-semibold space-y-2.5 ${passMessage.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-rose-50 border border-rose-200 text-rose-800"}`}>
                  <div className="flex items-center gap-2">
                    {passMessage.type === "success" ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4.5 h-4.5 text-rose-600 flex-shrink-0" />}
                    <span className="font-bold">{passMessage.text}</span>
                  </div>
                  
                  {passMessage.type === "success" && passMessage.encryptedPassword && (
                    <div className="bg-white/85 border border-emerald-100 rounded-xl p-3 space-y-1 text-slate-800 animate-in fade-in zoom-in duration-150">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>DETAIL AKSES BARU</span>
                        <span className="text-emerald-600 uppercase font-black">Tersimpan ke Master</span>
                      </div>
                      <div className="text-xs font-medium">
                        <span className="text-slate-500 font-semibold">Akun NIP:</span> <span className="font-mono font-bold text-slate-900">{changePassNip}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="truncate font-mono text-xs">
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
                          className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title={showSuccessPass ? "Tampilkan Terenkripsi" : "Tampilkan Plaintext"}
                        >
                          {showSuccessPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 pb-safe">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePassOpen(false);
                    setPassMessage(null);
                    setShowSuccessPass(false);
                    setChangePassNip("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setShowNewPassInput(false);
                    setShowConfirmPassInput(false);
                  }}
                  className="px-4 py-2.5 min-h-[42px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[42px] bg-[#075369] hover:bg-[#053d4d] text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
};
