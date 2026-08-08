import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Unlock,
  RefreshCw,
  HelpCircle,
  Sliders,
  Layers,
  Sparkles,
  // PhoneCall, (Removed: Auto-Forward Notification)
  // Mail, (Removed: Auto-Forward Notification)
  PenTool,
  Check,
  Eye,
  FileDown,
  Info,
  CheckSquare,
  Users
} from "lucide-react";

export default function AccessMatrixSettingsPage() {
  const [activeTab, setActiveTab] = useState("matrix"); // 'matrix', 'config'
  const [selectedEntity, setSelectedEntity] = useState("all"); // 'all', 'TAD', 'PLN', 'PLN_ES'
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Role Metadata with categories
  const roleMetadata = {
    maker: {
      label: "1. Maker (Pengaju)",
      category: "TAD",
      desc: "Tenaga Alih Daya yang membuat pengajuan lembur, cuti, ijin, sakit, atau SPPD",
      badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
    },
    checker: {
      label: "2. Checker (Team Leader PLN)",
      category: "PLN",
      desc: "Team Leader Unit Layanan yang memeriksa kelengkapan berkas fisik & data",
      badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20"
    },
    verification: {
      label: "3. Verifikator (Assistant Manager PLN)",
      category: "PLN",
      desc: "Asisten Manajer Bagian yang memverifikasi kesesuaian anggaran & kuota unit",
      badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    approved1: {
      label: "4. Approval 1 (Manager PLN)",
      category: "PLN",
      desc: "Manager Unit Pelaksana (UPT) pemberi persetujuan fungsional pertama",
      badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20"
    },
    approved2: {
      label: "5. Approval 2 (Team Ledaer PLN ES)",
      category: "PLN ES",
      desc: "Team Leader PLN Electricity Services pengelola penempatan TAD regional",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    approved3: {
      label: "6. Approval 3 (Assitant Manager PLN ES)",
      category: "PLN ES",
      desc: "Assistant Manager PLN Electricity Services pengelola penempatan TAD regional",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    }
  };

  // Initial access matrix permissions mapping
  const initialMatrix = {
    maker: {
      view: true,
      create_edit: true,
      approve: false,
      reject: false,
      export_pdf: true
    },
    checker: {
      view: true,
      create_edit: true,
      approve: true,
      reject: true,
      export_pdf: true
    },
    verification: {
      view: true,
      create_edit: false,
      approve: true,
      reject: true,
      export_pdf: true
    },
    approved1: {
      view: true,
      create_edit: false,
      approve: true,
      reject: true,
      export_pdf: true
    },
    approved2: {
      view: true,
      create_edit: false,
      approve: true,
      reject: true,
      export_pdf: true
    },
    approved3: {
      view: true,
      create_edit: true,
      approve: true,
      reject: true,
      export_pdf: true
    }
  };

  // Initial workflow configuration (Signature & Notification channels removed/remarked)
  const initialWorkflowConfig = {
    maker: {
      require_signature: true,
      /* REMARK: Notification channels disabled
      notify_wa: true,
      notify_email: false,
      */
      limit_nominal: "Sesuai Ketentuan"
    },
    checker: {
      require_signature: true,
      /* REMARK: Notification channels disabled
      notify_wa: true,
      notify_email: true,
      */
      limit_nominal: "Sesuai Ketentuan"
    },
    verification: {
      require_signature: false,
      /* REMARK: Notification channels disabled
      notify_wa: true,
      notify_email: false,
      */
      limit_nominal: "Sesuai Ketentuan"
    },
    approved1: {
      require_signature: true,
      /* REMARK: Notification channels disabled
      notify_wa: true,
      notify_email: true,
      */
      limit_nominal: "Sesuai Ketentuan"
    },
    approved2: {
      require_signature: true,
      /* REMARK: Notification channels disabled
      notify_wa: true,
      notify_email: false,
      */
      limit_nominal: "Sesuai Ketentuan"
    },
    approved3: {
      require_signature: true,
      /* REMARK: Notification channels disabled
      notify_wa: true,
      notify_email: true,
      */
      limit_nominal: "Semua Nominal & Kebijakan Khusus"
    }
  };

  const [matrix, setMatrix] = useState(() => {
    const saved = localStorage.getItem("pln_access_matrix_v2");
    return saved ? JSON.parse(saved) : initialMatrix;
  });

  const [workflowConfig, setWorkflowConfig] = useState(() => {
    const saved = localStorage.getItem("pln_workflow_config_v2");
    return saved ? JSON.parse(saved) : initialWorkflowConfig;
  });

  // State trackers for changes to trigger the floating save bar
  const [hasChanges, setHasChanges] = useState(false);

  // Check if state is different from saved state
  useEffect(() => {
    const savedMatrix = localStorage.getItem("pln_access_matrix_v2");
    const savedConfig = localStorage.getItem("pln_workflow_config_v2");
    
    const currentSavedMatrix = savedMatrix ? JSON.parse(savedMatrix) : initialMatrix;
    const currentSavedConfig = savedConfig ? JSON.parse(savedConfig) : initialWorkflowConfig;

    const isMatrixDiff = JSON.stringify(matrix) !== JSON.stringify(currentSavedMatrix);
    const isConfigDiff = JSON.stringify(workflowConfig) !== JSON.stringify(currentSavedConfig);

    setHasChanges(isMatrixDiff || isConfigDiff);
  }, [matrix, workflowConfig]);

  const handleTogglePermission = (role, permission) => {
    setMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: !prev[role][permission]
      }
    }));
  };

  const handleToggleConfig = (role, field) => {
    setWorkflowConfig((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: !prev[role][field]
      }
    }));
  };

  const handleUpdateLimit = (role, value) => {
    setWorkflowConfig((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        limit_nominal: value
      }
    }));
  };

  const handleSaveAll = () => {
    try {
      localStorage.setItem("pln_access_matrix_v2", JSON.stringify(matrix));
      localStorage.setItem("pln_workflow_config_v2", JSON.stringify(workflowConfig));
      setHasChanges(false);
      setSuccessMsg("Pengaturan matriks hak akses & workflow berhasil diperbarui secara permanen!");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg("Gagal menyimpan konfigurasi: " + err.message);
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("Apakah Anda yakin ingin mengembalikan semua hak akses & alur workflow ke pengaturan default pabrik PLN?")) {
      setMatrix(initialMatrix);
      setWorkflowConfig(initialWorkflowConfig);
      localStorage.setItem("pln_access_matrix_v2", JSON.stringify(initialMatrix));
      localStorage.setItem("pln_workflow_config_v2", JSON.stringify(initialWorkflowConfig));
      setHasChanges(false);
      setSuccessMsg("Konfigurasi hak akses berhasil direset ke standar operasional PLN JATENG DIY.");
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  };

  // Helper filter for categories
  const filteredRoles = Object.keys(roleMetadata).filter((roleKey) => {
    if (selectedEntity === "all") return true;
    if (selectedEntity === "TAD") return roleMetadata[roleKey].category === "TAD";
    if (selectedEntity === "PLN") return roleMetadata[roleKey].category === "PLN";
    if (selectedEntity === "PLN_ES") return roleMetadata[roleKey].category === "PLN ES";
    return true;
  });

  // Custom iOS Toggle Switch Component
  const IosToggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none ${
        checked ? "bg-emerald-500 shadow-emerald-500/20 shadow-sm" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6 select-none p-1 sm:p-3 pb-36">
      {/* Page Title Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-[#0F172A] text-[#FFD100] rounded-2xl shadow-xl border border-slate-800 shrink-0">
            <Shield className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Hak Akses & Otoritas Alur Kerja
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 tracking-wide uppercase">Active Matrix</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Konfigurasi pembagian wewenang, digital signature, dan alur kerja lintas entitas (TAD, PLN Persero, PLN ES).
            </p>
          </div>
        </div>

        {/* Action Button Headers (Visible when no changes or as quick utility) */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={handleResetToDefault}
            className="flex-1 lg:flex-none px-4 py-2.5 min-h-[44px] bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-300 shadow-sm cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Reset Standar</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="flex-1 lg:flex-none px-5 py-2.5 min-h-[44px] bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md hover:shadow-lg border border-slate-950 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 text-[#FFD100]" />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-3 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-emerald-900">Perubahan Disimpan</p>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">{successMsg}</p>
            </div>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-3 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-rose-900">Gagal Menyimpan</p>
              <p className="text-xs text-rose-700 font-medium mt-0.5">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-Dimensional Selector Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Navigation Tabs (Matrix vs Configuration Settings) */}
        <div className="bg-slate-200/60 backdrop-blur-md rounded-2xl p-1.5 border border-slate-300/50 flex gap-1 w-full max-w-sm">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-350 cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "matrix"
                ? "bg-[#0F172A] text-white shadow-md shadow-slate-900/10"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Matriks Otoritas</span>
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-350 cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "config"
                ? "bg-[#0F172A] text-white shadow-md shadow-slate-900/10"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Alur Kerja & TTD</span>
          </button>
        </div>

        {/* Entity Segment Toggle: [TAD], [PLN Persero], [PLN ES] */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-start md:justify-end">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
            Kategori Entitas:
          </span>
          <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-1 shadow-sm flex flex-wrap gap-1">
            {[
              { id: "all", label: "Semua Peran" },
              { id: "TAD", label: "TAD (Tenaga Alih Daya)" },
              { id: "PLN", label: "PLN Persero" },
              { id: "PLN_ES", label: "PLN ES" }
            ].map((segment) => (
              <button
                key={segment.id}
                onClick={() => setSelectedEntity(segment.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  selectedEntity === segment.id
                    ? "bg-[#FFD100]/10 text-slate-900 border border-[#FFD100] font-extrabold shadow-xs"
                    : "text-slate-500 hover:text-slate-800 border border-transparent"
                }`}
              >
                {segment.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === "matrix" ? (
          <motion.div
            key="matrix-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden"
          >
            {/* Tab Explanation Panel */}
            <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-600" /> Matriks Otoritas Tindakan Pengajuan
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Konfigurasikan aksi granular yang diizinkan untuk masing-masing level persetujuan.
                </p>
              </div>
              <div className="px-3.5 py-1.5 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFD100]" />
                <span>Interaktif Instant-Save</span>
              </div>
            </div>

            {/* Granular Action Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                    <th className="p-4 pl-6 min-w-[220px]">Level Peran & Kategori</th>
                    <th className="p-4 text-center min-w-[110px]">
                      <div className="flex flex-col items-center gap-1">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <span>View / Read</span>
                      </div>
                    </th>
                    <th className="p-4 text-center min-w-[110px]">
                      <div className="flex flex-col items-center gap-1">
                        <CheckSquare className="w-4 h-4 text-slate-400" />
                        <span>Create / Edit</span>
                      </div>
                    </th>
                    <th className="p-4 text-center min-w-[110px]">
                      <div className="flex flex-col items-center gap-1">
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                        <span>Approve</span>
                      </div>
                    </th>
                    <th className="p-4 text-center min-w-[110px]">
                      <div className="flex flex-col items-center gap-1">
                        <Lock className="w-4 h-4 text-rose-500" />
                        <span>Reject</span>
                      </div>
                    </th>
                    <th className="p-4 text-center min-w-[110px]">
                      <div className="flex flex-col items-center gap-1">
                        <FileDown className="w-4 h-4 text-slate-400" />
                        <span>Export PDF</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-xs text-slate-700">
                  {filteredRoles.map((roleKey) => {
                    const rMeta = roleMetadata[roleKey];
                    const permissions = matrix[roleKey] || {};

                    return (
                      <tr key={roleKey} className="hover:bg-slate-50/50 transition-colors">
                        {/* Role Details */}
                        <td className="p-4 pl-6">
                          <div className="space-y-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">{rMeta.label}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${rMeta.badgeClass}`}>
                                {rMeta.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-sm">
                              {rMeta.desc}
                            </p>
                          </div>
                        </td>

                        {/* Switch Columns */}
                        <td className="p-4 text-center">
                          <div className="flex justify-center">
                            <IosToggle
                              checked={permissions.view}
                              onChange={() => handleTogglePermission(roleKey, "view")}
                            />
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex justify-center">
                            <IosToggle
                              checked={permissions.create_edit}
                              onChange={() => handleTogglePermission(roleKey, "create_edit")}
                            />
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex justify-center">
                            <IosToggle
                              checked={permissions.approve}
                              onChange={() => handleTogglePermission(roleKey, "approve")}
                            />
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex justify-center">
                            <IosToggle
                              checked={permissions.reject}
                              onChange={() => handleTogglePermission(roleKey, "reject")}
                            />
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex justify-center">
                            <IosToggle
                              checked={permissions.export_pdf}
                              onChange={() => handleTogglePermission(roleKey, "export_pdf")}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRoles.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 font-bold">
                        Tidak ada peran yang cocok dengan filter kategori yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          /* Workflow Configurations and Channel Mapping Tab */
          <motion.div
            key="config-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Instructions */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-md">
              <h3 className="font-extrabold text-[#0F172A] text-sm flex items-center gap-2">
                <Sliders className="w-5 h-5 text-slate-600" /> Alur Validasi dan Tanda Tangan Digital
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Tentukan kebijakan kewajiban tanda tangan elektronik (Signature Canvas) dan batas limitasi nominal approval untuk setiap role.
              </p>
            </div>

            {/* Grid of Responsibility Map Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredRoles.map((roleKey) => {
                const rMeta = roleMetadata[roleKey];
                const cfg = workflowConfig[roleKey] || {};

                return (
                  <motion.div
                    key={roleKey}
                    layout
                    className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-900 text-sm">{rMeta.label}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${rMeta.badgeClass}`}>
                            {rMeta.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-normal">
                          {rMeta.desc}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full border border-sky-100">
                        <span className="text-[9px] font-black uppercase tracking-wider">Level {roleKey}</span>
                      </div>
                    </div>

                    {/* Card Body Options */}
                    <div className="grid grid-cols-1 gap-4 text-xs font-semibold text-slate-700">
                      
                      {/* Left: Signature & Limit Options */}
                      <div className="space-y-4">
                        {/* Signature Option */}
                        <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <PenTool className="w-4 h-4 text-indigo-500" />
                            <div>
                              <p className="text-[11px] font-black text-slate-800">Wajib TTD Digital</p>
                              <p className="text-[9px] text-slate-400 font-medium">Melalui canvas digital</p>
                            </div>
                          </div>
                          <IosToggle
                            checked={cfg.require_signature}
                            onChange={() => handleToggleConfig(roleKey, "require_signature")}
                          />
                        </div>

                        {/* Nominal Approval Limits */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            Batasan Otoritas Nominal SPPD & Lembur:
                          </label>
                          <input
                            type="text"
                            value={cfg.limit_nominal}
                            onChange={(e) => handleUpdateLimit(roleKey, e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200/80 focus:border-slate-800 rounded-xl text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD100]/30 transition"
                            placeholder="Contoh: Hingga Rp 50 Juta"
                          />
                        </div>
                      </div>

                      {/* REMARK: Auto Notification Triggers section disabled per request
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                          Notifikasi Auto-Forward:
                        </p>

                        <div className="flex items-center justify-between p-2.5 bg-emerald-500/[0.04] rounded-2xl border border-emerald-500/10">
                          <div className="flex items-center gap-2">
                            <PhoneCall className="w-4 h-4 text-emerald-500" />
                            <div>
                              <p className="text-[11px] font-black text-slate-800">WhatsApp Alert</p>
                              <p className="text-[9px] text-emerald-600/70 font-medium">Trigger WA API</p>
                            </div>
                          </div>
                          <IosToggle
                            checked={cfg.notify_wa}
                            onChange={() => handleToggleConfig(roleKey, "notify_wa")}
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-blue-500/[0.04] rounded-2xl border border-blue-500/10">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-[11px] font-black text-slate-800">Email SMTP Alert</p>
                              <p className="text-[9px] text-blue-600/70 font-medium">Trigger PDF Attachment</p>
                            </div>
                          </div>
                          <IosToggle
                            checked={cfg.notify_email}
                            onChange={() => handleToggleConfig(roleKey, "notify_email")}
                          />
                        </div>
                      </div>
                      */}

                    </div>
                  </motion.div>
                );
              })}
              {filteredRoles.length === 0 && (
                <div className="col-span-full p-8 text-center text-slate-400 font-bold">
                  Tidak ada data yang cocok dengan filter yang dipilih.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Informative Panel (Best Practices) */}
      <div className="bg-sky-500/[0.03] border border-sky-100 rounded-3xl p-5 flex gap-4 text-xs leading-relaxed text-slate-700">
        <div className="p-2 bg-sky-500/10 text-sky-600 rounded-xl shrink-0 h-fit">
          <Info className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="space-y-1.5">
          <p className="font-extrabold text-slate-900 text-sm">💡 Pedoman Konfigurasi Alur Otoritas PLN JATENG DIY:</p>
          <ul className="list-disc pl-4 space-y-1.5 font-semibold text-slate-600 text-xs">
            <li>
              <strong className="text-slate-900">Maker (TAD):</strong> Bersifat operasional murni. Disarankan <span className="text-emerald-600">Buat Pengajuan</span> aktif, namun wajib dinonaktifkan untuk <span className="text-rose-500">Approve</span> &amp; <span className="text-rose-500">Reject</span>.
            </li>
            <li>
              <strong className="text-slate-900">Checker &amp; Verifikator (PLN Persero):</strong> Otoritas fungsional tingkat menengah. Harus mengaktifkan persetujuan nominal berjenjang sesuai dengan wewenang anggaran UPT/ULTG masing-masing.
            </li>
            <li>
              <strong className="text-slate-900">Approval 2 &amp; 3 (PLN ES):</strong> Merupakan validasi strategis untuk Tenaga Alih Daya regional. Sangat disarankan mewajibkan <span className="text-slate-800">Tanda Tangan Digital</span> untuk efisiensi koordinasi lapangan.
            </li>
          </ul>
        </div>
      </div>

      {/* Modern Floating Bottom Action Bar with Glassmorphic design */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl bg-[#0F172A]/95 backdrop-blur-xl border border-slate-700/40 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FFD100]/10 text-[#FFD100] rounded-xl shrink-0">
                <Sliders className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-black text-white">Ada Perubahan yang Belum Disimpan</p>
                <p className="text-[10px] text-slate-400 font-medium">Klik Simpan Perubahan untuk mengaktifkan matriks operasional baru.</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  const savedMatrix = localStorage.getItem("pln_access_matrix_v2");
                  const savedConfig = localStorage.getItem("pln_workflow_config_v2");
                  setMatrix(savedMatrix ? JSON.parse(savedMatrix) : initialMatrix);
                  setWorkflowConfig(savedConfig ? JSON.parse(savedConfig) : initialWorkflowConfig);
                  setHasChanges(false);
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer active:scale-95"
              >
                Batalkan
              </button>
              <button
                onClick={handleSaveAll}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-[#FFD100] hover:bg-yellow-400 text-[#0F172A] rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
