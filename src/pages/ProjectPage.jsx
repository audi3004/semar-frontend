import { useState, useEffect } from "react";
import { MasterDataService } from "../services/masterDataService";
import { FolderKanban, Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";

export const ProjectPage = ({ currentUser, onRefreshData }) => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState("");

  const [namaProject, setNamaProject] = useState("");
  const [activeStatus, setActiveStatus] = useState("Y");

  const loadData = () => {
    const res = MasterDataService.getAll("m_project", { limit: 1000 });
    setProjects(res.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    return p.nama_project?.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const pagination = useDataPagination(filteredProjects, [searchQuery]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setNamaProject("");
    setActiveStatus("Y");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setNamaProject(item.nama_project || "");
    setActiveStatus(item.active || "Y");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!namaProject || namaProject.trim().length < 3) {
      setFormError("Nama Project minimal 3 karakter.");
      return;
    }

    const newId = editingItem
      ? editingItem.id_project
      : projects.length > 0
      ? Math.max(...projects.map((p) => Number(p.id_project) || 0)) + 1
      : 1;

    const payload = {
      id_project: Number(newId),
      nama_project: namaProject.trim(),
      active: activeStatus
    };

    let result;
    if (editingItem) {
      result = MasterDataService.update("m_project", editingItem.id_project, payload);
    } else {
      result = MasterDataService.create("m_project", payload);
    }

    if (result.success) {
      setIsModalOpen(false);
      loadData();
      if (onRefreshData) onRefreshData();
    } else {
      setFormError(result.error || "Gagal menyimpan data project.");
    }
  };

  const handleDelete = (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus Project ini?")) {
      const res = MasterDataService.delete("m_project", id);
      if (res.success) {
        loadData();
        if (onRefreshData) onRefreshData();
      } else {
        alert(res.error);
      }
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" /> Master Project &amp; Lingkup Pekerjaan
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Kelola daftar program kerja, proyek pemeliharaan transmisi, dan kegiatan teknis PLN
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Project Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-bold">Total Project: {filteredProjects.length} Proyek</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="p-3.5 pl-5">ID Project</th>
                <th className="p-3.5">Nama Project / Program</th>
                <th className="p-3.5">Status Aktif</th>
                <th className="p-3.5 pr-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400 font-medium">
                    Tidak ada data Project yang ditemukan.
                  </td>
                </tr>
              ) : (
                pagination.paginatedItems.map((item, idx) => (
                  <tr key={item.id_project ? `proj-${item.id_project}-${idx}` : `proj-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-5 font-mono text-slate-500 font-bold">#{item.id_project}</td>
                    <td className="p-3.5 font-bold text-slate-900">{item.nama_project}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                          item.active !== "N"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {item.active !== "N" ? "Aktif" : "Non-Aktif"}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                          title="Edit Project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id_project)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                          title="Hapus Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <DataPagination {...pagination} />
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-indigo-600" />
                  {editingItem ? "Edit Project" : "Tambah Project Baru"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nama Project / Program Kerja *</label>
                  <input
                    type="text"
                    value={namaProject}
                    onChange={(e) => setNamaProject(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="misal: SUTT 150kV JATENG DIY"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Status Aktif</label>
                  <select
                    value={activeStatus}
                    onChange={(e) => setActiveStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Y">Aktif (Y)</option>
                    <option value="N">Non-Aktif (N)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                  >
                    Simpan Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
