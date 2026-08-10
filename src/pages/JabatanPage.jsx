import { useState, useEffect } from "react";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { Award, Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";
import { SortableTableHeader, sortTableRows, toggleTableSort } from "../components/common/SortableTableHeader";

export const JabatanPage = ({ currentUser, onRefreshData }) => {
  const [jabatans, setJabatans] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nama_jabatan"); const [sortOrder, setSortOrder] = useState("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState("");

  const [namaJabatan, setNamaJabatan] = useState("");
  const [idProject, setIdProject] = useState(1);
  const [activeStatus, setActiveStatus] = useState("Y");

  const loadData = async () => {
    try {
      const [jabatanResponse, projectResponse] = await Promise.all([
        api.client.get("/jabatan", { params: { limit: 1000 } }),
        api.client.get("/projects", { params: { limit: 1000 } })
      ]);
      const jabatanRows = jabatanResponse.data?.data || [];
      const projectRows = projectResponse.data?.data || [];
      setJabatans(jabatanRows);
      setProjects(projectRows);
      if (projectRows.length > 0) setIdProject(projectRows[0].id_project);
    } catch (error) {
      setJabatans([]); setProjects([]);
      toast.error(error.response?.data?.message || "Gagal memuat Master Jabatan.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getProjectName = (projId) => {
    const found = projects.find((p) => Number(p.id_project) === Number(projId));
    return found ? found.nama_project : `Project #${projId}`;
  };

  const filteredJabatans = sortTableRows(jabatans.filter((j) => {
    if (projectFilter !== "all" && String(j.id_project) !== projectFilter) return false;
    if (statusFilter !== "all" && (j.is_active || j.active || "Y") !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchJab = j.nama_jabatan?.toLowerCase().includes(q);
    const matchProj = getProjectName(j.id_project)?.toLowerCase().includes(q);
    return matchJab || matchProj;
  }), sortBy, sortOrder, { id_jabatan: (j) => Number(j.id_jabatan), project: (j) => getProjectName(j.id_project), is_active: (j) => j.is_active || j.active || "Y" });
  const pagination = useDataPagination(filteredJabatans, [searchQuery, projectFilter, statusFilter, sortBy, sortOrder]);
  const handleSort = (field) => toggleTableSort(field, sortBy, sortOrder, setSortBy, setSortOrder);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setNamaJabatan("");
    if (projects.length > 0) setIdProject(projects[0].id_project);
    setActiveStatus("Y");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setNamaJabatan(item.nama_jabatan || "");
    setIdProject(item.id_project || 1);
    setActiveStatus(item.is_active || "Y");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaJabatan || namaJabatan.trim().length < 3) {
      setFormError("Nama Jabatan minimal 3 karakter.");
      return;
    }
    if (!idProject) {
      setFormError("Proyek Kerja wajib dipilih.");
      return;
    }

    const payload = {
      nama_jabatan: namaJabatan.trim(),
      id_project: Number(idProject),
      is_active: activeStatus
    };

    try {
      if (editingItem) await api.client.put(`/jabatan/${editingItem.id_jabatan}`, payload);
      else await api.client.post("/jabatan", payload);
      setIsModalOpen(false);
      await loadData();
      if (onRefreshData) onRefreshData();
      toast.success(`Jabatan berhasil ${editingItem ? "diperbarui" : "ditambahkan"}.`);
    } catch (error) {
      setFormError(error.response?.data?.message || "Gagal menyimpan data jabatan.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus Jabatan ini?")) {
      try {
        await api.client.delete(`/jabatan/${id}`);
        await loadData();
        if (onRefreshData) onRefreshData();
        toast.success("Jabatan berhasil dihapus.");
      } catch (error) {
        toast.error(error.response?.data?.message || "Jabatan masih digunakan dan tidak dapat dihapus.");
      }
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" /> Master Jabatan Pegawai
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Kelola daftar posisi, jabatan teknis, dan pemetaan ke proyek kerja PLN Electricity Services
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Jabatan Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari posisi / jabatan / project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2"><select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Project</option>{projects.map((project) => <option key={project.id_project} value={project.id_project}>{project.nama_project}</option>)}</select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Status</option><option value="Y">Aktif</option><option value="N">Nonaktif</option></select><span className="text-xs text-slate-500 font-bold">Total Jabatan: {filteredJabatans.length} Posisi</span></div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <SortableTableHeader field="id_jabatan" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="p-3.5 pl-5">ID Jabatan</SortableTableHeader>
                <SortableTableHeader field="nama_jabatan" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="p-3.5">Nama Jabatan / Posisi</SortableTableHeader>
                <SortableTableHeader field="project" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="p-3.5">Proyek Kerja (FK Project)</SortableTableHeader>
                <SortableTableHeader field="is_active" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="p-3.5">Status</SortableTableHeader>
                <th className="p-3.5 pr-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredJabatans.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">
                    Tidak ada data Jabatan yang ditemukan.
                  </td>
                </tr>
              ) : (
                pagination.paginatedItems.map((item, idx) => (
                  <tr key={item.id_jabatan ? `jab-${item.id_jabatan}-${idx}` : `jab-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-5 font-mono text-slate-500 font-bold">#{item.id_jabatan}</td>
                    <td className="p-3.5 font-bold text-slate-900">{item.nama_jabatan}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200 text-[11px]">
                        {getProjectName(item.id_project)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                          item.is_active !== "N"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {item.is_active !== "N" ? "Aktif" : "Non-Aktif"}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                          title="Edit Jabatan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id_jabatan)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                          title="Hapus Jabatan"
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
                  <Award className="w-4 h-4 text-indigo-600" />
                  {editingItem ? "Edit Jabatan" : "Tambah Jabatan Baru"}
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
                  <label className="block text-slate-600 font-bold mb-1">Nama Jabatan / Posisi *</label>
                  <input
                    type="text"
                    value={namaJabatan}
                    onChange={(e) => setNamaJabatan(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="misal: Teknisi Pemeliharaan GI"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Proyek Kerja (Master Project) *</label>
                  <select
                    value={idProject}
                    onChange={(e) => setIdProject(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id_project} value={p.id_project}>
                        {p.nama_project} (ID #{p.id_project})
                      </option>
                    ))}
                  </select>
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
                    Simpan Jabatan
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
