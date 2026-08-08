import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, Save, Search, ShieldCheck, Sliders, X } from "lucide-react";
import { api } from "../services/api";
import { AuthService } from "../services/authService";
import { ResponsibilityService } from "../services/responsibilityService";
import { toast } from "../utils/toast";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";
import { SortableTableHeader, sortTableRows, toggleTableSort } from "../components/common/SortableTableHeader";

const permissionFields = [
  ["can_create", "Create"], ["can_read", "Read"], ["can_update", "Update"], ["can_delete", "Delete"], ["can_approve", "Approve"]
];
const emptyPermissions = { can_create: "N", can_read: "N", can_update: "N", can_delete: "N", can_approve: "N" };

export const ResponsibilitiesPage = () => {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [accessByModule, setAccessByModule] = useState({});
  const [dirtyModuleIds, setDirtyModuleIds] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nama_module"); const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.client.get("/roles", { params: { limit: 1000 } }),
      api.client.get("/modules", { params: { limit: 1000 } })
    ]).then(([roleResponse, moduleResponse]) => {
      const roleData = roleResponse.data?.data || [];
      setRoles(roleData);
      setModules(moduleResponse.data?.data || []);
      if (roleData[0]) setSelectedRoleId(String(roleData[0].id_role));
    }).catch((error) => toast.error(error.response?.data?.message || "Gagal mengambil role dan module."));
  }, []);

  const loadRoleAccess = async (roleId) => {
    if (!roleId) return;
    setIsLoading(true);
    try {
      const response = await api.client.get(`/access-modules/role/${roleId}`);
      const rows = response.data?.data || [];
      setAccessByModule(Object.fromEntries(rows.map((row) => [String(row.id_module), { ...emptyPermissions, ...row }])));
      setDirtyModuleIds(new Set());
    } catch (error) {
      if (error.response?.status === 404) {
        setAccessByModule({});
        setDirtyModuleIds(new Set());
      } else toast.error(error.response?.data?.message || "Gagal mengambil access module berdasarkan role.");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { loadRoleAccess(selectedRoleId); }, [selectedRoleId]);

  const selectedRole = roles.find((role) => String(role.id_role) === selectedRoleId);
  const allVisibleModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = modules.filter((module) => (statusFilter === "all" || (module.is_active || "Y") === statusFilter) && (!query || [module.id_module, module.kode_module, module.nama_module, module.deskripsi]
      .some((value) => String(value ?? "").toLowerCase().includes(query))));
    return sortTableRows(matches, sortBy, sortOrder, { id_module: (m) => Number(m.id_module) });
  }, [modules, searchQuery, statusFilter, sortBy, sortOrder]);
  const pagination = useDataPagination(allVisibleModules, [searchQuery, selectedRoleId, statusFilter, sortBy, sortOrder]);
  const visibleModules = pagination.paginatedItems;
  const handleSort = (field) => toggleTableSort(field, sortBy, sortOrder, setSortBy, setSortOrder);

  const togglePermission = (moduleId, field) => {
    const key = String(moduleId);
    setAccessByModule((current) => {
      const row = current[key] || { ...emptyPermissions, id_role: Number(selectedRoleId), id_module: Number(moduleId) };
      return { ...current, [key]: { ...row, [field]: row[field] === "Y" ? "N" : "Y" } };
    });
    setDirtyModuleIds((current) => new Set(current).add(key));
  };

  const setAllForModule = (moduleId, enabled) => {
    const key = String(moduleId);
    const value = enabled ? "Y" : "N";
    setAccessByModule((current) => ({ ...current, [key]: { ...(current[key] || {}), id_role: Number(selectedRoleId), id_module: Number(moduleId), ...Object.fromEntries(permissionFields.map(([field]) => [field, value])) } }));
    setDirtyModuleIds((current) => new Set(current).add(key));
  };

  const handleSave = async () => {
    if (dirtyModuleIds.size === 0) return;
    setIsSaving(true);
    try {
      await Promise.all([...dirtyModuleIds].map((moduleId) => {
        const row = accessByModule[moduleId];
        const payload = {
          id_role: Number(selectedRoleId), id_module: Number(moduleId),
          ...Object.fromEntries(permissionFields.map(([field]) => [field, row?.[field] || "N"]))
        };
        return row?.id_access
          ? api.client.put(`/access-modules/${row.id_access}`, payload)
          : api.client.post("/access-modules", payload);
      }));
      toast.success(`Hak akses ${selectedRole?.nama_role || "role"} berhasil disimpan.`);
      await loadRoleAccess(selectedRoleId);

      const currentUser = AuthService.getCurrentUser();
      if (String(currentUser?.id_role) === selectedRoleId) {
        await ResponsibilityService.loadBackendPermissions(currentUser);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Sebagian hak akses gagal disimpan.");
    } finally { setIsSaving(false); }
  };

  const grantedReadCount = modules.filter((module) => accessByModule[String(module.id_module)]?.can_read === "Y").length;

  return <div className="p-3 sm:p-6 space-y-5 max-w-[1500px] mx-auto">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"><div><h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2"><Sliders className="w-6 h-6 text-indigo-600" /> Responsibility &amp; Access Module</h1><p className="text-xs text-slate-600 mt-1">Atur izin module berdasarkan role langsung melalui backend.</p></div><button onClick={handleSave} disabled={isSaving || dirtyModuleIds.size === 0} className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-black flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {isSaving ? "Menyimpan..." : `Simpan Perubahan (${dirtyModuleIds.size})`}</button></div>

    <div className="grid grid-cols-1 md:grid-cols-[minmax(240px,360px)_1fr] gap-3">
      <label className="space-y-1.5"><span className="text-xs font-bold text-slate-700">Pilih Role</span><select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} className="form-input">{roles.map((role) => <option key={role.id_role} value={role.id_role}>{role.nama_role} — {role.kode_role || `ID ${role.id_role}`}</option>)}</select></label>
      <div className="flex gap-2 self-end"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari module..." className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100" /></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Status</option><option value="Y">Aktif</option><option value="N">Nonaktif</option></select></div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Summary label="Role Aktif" value={selectedRole?.nama_role || "-"} icon={ShieldCheck} /><Summary label="Module Bisa Dibaca" value={`${grantedReadCount} / ${modules.length}`} icon={Check} /><Summary label="Perubahan Belum Disimpan" value={dirtyModuleIds.size} icon={Save} /></div>

    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[1000px] text-xs"><thead className="bg-slate-50 text-slate-600 uppercase tracking-wider"><tr><SortableTableHeader field="nama_module" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Module</SortableTableHeader>{permissionFields.map(([, label]) => <th key={label} className="px-3 py-3 text-center w-24">{label}</th>)}<th className="px-3 py-3 text-center w-28">Semua</th></tr></thead><tbody className="divide-y divide-slate-100">
      {isLoading && <tr><td colSpan="7" className="px-4 py-14 text-center text-slate-500"><LoaderCircle className="w-5 h-5 animate-spin inline mr-2" />Memuat akses role...</td></tr>}
      {!isLoading && visibleModules.map((module) => { const row = accessByModule[String(module.id_module)] || emptyPermissions; const allEnabled = permissionFields.every(([field]) => row[field] === "Y"); const dirty = dirtyModuleIds.has(String(module.id_module)); return <tr key={module.id_module} className={dirty ? "bg-amber-50/60" : "hover:bg-slate-50"}><td className="px-4 py-3"><div className="flex items-start gap-3"><span className="mt-0.5 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black">#{module.id_module}</span><div><div className="font-black text-slate-900">{module.nama_module}</div><div className="text-[10px] font-mono text-indigo-600 mt-0.5">{module.kode_module}</div><div className="text-[11px] text-slate-500 mt-1 max-w-2xl">{module.deskripsi || "-"}</div></div></div></td>{permissionFields.map(([field, label]) => <td key={field} className="px-3 py-3 text-center"><PermissionButton active={row[field] === "Y"} label={label} onClick={() => togglePermission(module.id_module, field)} /></td>)}<td className="px-3 py-3 text-center"><button onClick={() => setAllForModule(module.id_module, !allEnabled)} className={`px-3 py-2 rounded-lg font-black ${allEnabled ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}>{allEnabled ? "Matikan" : "Aktifkan"}</button></td></tr>; })}
      {!isLoading && visibleModules.length === 0 && <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">Module tidak ditemukan.</td></tr>}
    </tbody></table></div>
    <DataPagination {...pagination} />
    <p className="text-[11px] text-slate-500">Menu frontend ditampilkan berdasarkan izin <strong>Read</strong>. Izin lain dipersiapkan untuk membatasi aksi create, update, delete, dan approve pada tahap integrasi berikutnya.</p>
  </div>;
};

const PermissionButton = ({ active, label, onClick }) => <button type="button" onClick={onClick} title={`${label}: ${active ? "Diizinkan" : "Ditolak"}`} className={`mx-auto w-9 h-9 rounded-xl flex items-center justify-center transition ${active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-600"}`}>{active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}</button>;
const Summary = ({ label, value, icon: Icon }) => <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Icon className="w-5 h-5" /></div><div><div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</div><div className="text-sm font-black text-slate-900 mt-0.5">{value}</div></div></div>;
