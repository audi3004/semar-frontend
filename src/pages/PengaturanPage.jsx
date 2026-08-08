import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataService } from "../services/dataService";
import { Settings, Save, Calculator, Palmtree, Building2, CheckCircle2, Database, Sliders, FolderTree, Lock } from "lucide-react";
import { DatabaseSchemaViewer } from "../components/database/DatabaseSchemaViewer";
import { MasterDataTab } from "../components/database/MasterDataTab";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { toast } from "../utils/toast";

export const PengaturanPage = ({ currentUser, settings, onRefreshData }) => {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState("formula");
  const [formData, setFormData] = useState(settings);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  if (!currentUser) return <LoadingSkeleton variant="form" />;

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      DataService.saveSettings(formData);
      onRefreshData();
      setIsSavedAlert(true);
      toast.success("Pengaturan sistem berhasil diperbarui secara permanen!");
      setTimeout(() => setIsSavedAlert(false), 4e3);
    } catch (err) {
      toast.error("Gagal menyimpan pengaturan sistem.");
    }
  };
  return <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 select-none">
      {
    /* Page Title Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" /> Pengaturan Sistem &amp; Arsitektur Database
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Atur Kuota Cuti, Limit Ijin, Formula Lembur, serta Dokumentasi Skema &amp; Dictionary Database PLN
          </p>
        </div>

        {
    /* SubTab Toggle Bar */
  }
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 border border-slate-200/50 p-1 rounded-full w-full sm:w-auto self-start sm:self-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab("formula")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${activeSubTab === "formula" ? "bg-white text-slate-900 shadow-xs border border-slate-200/30 font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"}`}
          >
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            <span>Pengaturan &amp; Formula</span>
          </button>

          <button
            onClick={() => setActiveSubTab("database")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${activeSubTab === "database" ? "bg-white text-slate-900 shadow-xs border border-slate-200/30 font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"}`}
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
            <span>Skema &amp; Dictionary</span>
          </button>

          <button
            onClick={() => navigate("/responsibilities")}
            className="flex-1 sm:flex-none px-4 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"
          >
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Matriks Otoritas (Responsibility)</span>
          </button>
        </div>
      </div>

      {activeSubTab === "formula" ? <>
          {isSavedAlert && <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              Pengaturan sistem berhasil diperbarui secara permanen!
            </div>}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 text-xs pb-12 sm:pb-0">
            {
    /* Section 1: Instansi Metadata */
  }
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Building2 className="w-4 h-4 text-sky-600" /> Profil Unit Operasional &amp; Kop Surat
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nama Instansi Utama</label>
                  <input
    type="text"
    value={formData.appName}
    onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none"
  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Unit Pengatur Distribusi / UPT</label>
                  <input
    type="text"
    value={formData.unitName}
    onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none"
  />
                </div>
              </div>
            </div>

            {
    /* Section 2: Cuti & Ijin Rules */
  }
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Palmtree className="w-4 h-4 text-amber-600" /> Batas Maksimal Kuota Cuti &amp; Ijin
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Batas Cuti Tahunan (Hari / 12 Bulan)</label>
                  <input
    type="number"
    value={formData.maxCutiTahunanPerTahun}
    onChange={(e) => setFormData({ ...formData, maxCutiTahunanPerTahun: Number(e.target.value) })}
    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sky-700 focus:bg-white focus:outline-none"
  />
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">Dihitung dari tanggal masuk kerja masing-masing tenaga kerja</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Batas Maksimal Ijin Dinamis (Hari / Tahun)</label>
                  <input
    type="number"
    value={formData.maxIjinTahunan}
    onChange={(e) => setFormData({ ...formData, maxIjinTahunan: Number(e.target.value) })}
    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sky-700 focus:bg-white focus:outline-none"
  />
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">Dapat diubah secara dinamis sesuai instruksi manajemen UPT</span>
                </div>
              </div>
            </div>

            {
    /* Section 3: Overtime Formula */
  }
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Calculator className="w-4 h-4 text-emerald-600" /> Rumus Formula Biaya Lembur Rupiah PLN
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Pembagi Jam Kerja (Default 173)</label>
                  <input
    type="number"
    value={formData.overtimeFormula.monthlyHoursDivider}
    onChange={(e) => setFormData({
      ...formData,
      overtimeFormula: { ...formData.overtimeFormula, monthlyHoursDivider: Number(e.target.value) }
    })}
    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:bg-white focus:outline-none"
  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Batas Lembur/Hari (Jam)</label>
                  <input
    type="number"
    value={formData.overtimeFormula.maxHoursPerDay}
    onChange={(e) => setFormData({
      ...formData,
      overtimeFormula: { ...formData.overtimeFormula, maxHoursPerDay: Number(e.target.value) }
    })}
    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-rose-700 focus:bg-white focus:outline-none"
  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Multiplier Jam Pertama</label>
                  <input
    type="number"
    step="0.1"
    value={formData.overtimeFormula.workdayHour1Multiplier}
    onChange={(e) => setFormData({
      ...formData,
      overtimeFormula: { ...formData.overtimeFormula, workdayHour1Multiplier: Number(e.target.value) }
    })}
    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
  />
                </div>
              </div>
            </div>

            {
    /* Sticky Submit Button for Mobile / Desktop */
  }
            <div className="sticky sm:relative bottom-3 sm:bottom-0 pt-2 bg-slate-50/80 backdrop-blur-xs sm:backdrop-blur-none sm:bg-transparent">
              <button
    type="submit"
    className="w-full sm:w-auto px-6 py-3 min-h-[46px] bg-[#00A3E0] hover:bg-[#0082B3] active:bg-[#006A93] text-white font-extrabold rounded-xl shadow-lg shadow-[#00A3E0]/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
  >
                <Save className="w-4 h-4" /> Simpan Seluruh Pengaturan Sistem
              </button>
            </div>
          </form>
        </> : <DatabaseSchemaViewer />}
    </div>;
};
