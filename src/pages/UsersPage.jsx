import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, UserCog, X } from "lucide-react";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";
import { SortableTableHeader, sortTableRows, toggleTableSort } from "../components/common/SortableTableHeader";

const emptyForm = { identity_type: "petugas", identity_id: "", id_role: "", username: "", password: "", email: "", is_active: "Y" };

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("username"); const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, employeeRes, officerRes, roleRes] = await Promise.all([
        api.client.get("/users", { params: { limit: 1000 } }),
        api.client.get("/pegawai", { params: { limit: 1000 } }),
        api.client.get("/petugas", { params: { limit: 1000 } }),
        api.client.get("/roles", { params: { limit: 1000 } })
      ]);
      setUsers(usersRes.data?.data || []);
      setEmployees(employeeRes.data?.data || []);
      setOfficers(officerRes.data?.data || []);
      setRoles(roleRes.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengambil data user.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const allFilteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = users.filter((user) => {
      if (roleFilter !== "all" && String(user.id_role) !== roleFilter) return false;
      if (statusFilter !== "all" && (user.is_active || "Y") !== statusFilter) return false;
      if (sourceFilter === "pegawai" && !user.pegawai) return false;
      if (sourceFilter === "petugas" && !user.petugas) return false;
      const identity = user.pegawai || user.petugas;
      if (!query) return true;
      return [user.id_user, user.username, user.email, user.role?.nama_role, identity?.nip, identity?.nama, identity?.jabatan?.nama_jabatan, identity?.unit?.nama_unit]
        .some((value) => String(value ?? "").toLowerCase().includes(query));
    });
    return sortTableRows(matches, sortBy, sortOrder, { id_user: (u) => Number(u.id_user), role: (u) => u.role?.nama_role || "", name: (u) => (u.pegawai || u.petugas)?.nama || "", unit: (u) => (u.pegawai || u.petugas)?.unit?.nama_unit || "" });
  }, [users, searchQuery, roleFilter, statusFilter, sourceFilter, sortBy, sortOrder]);
  const pagination = useDataPagination(allFilteredUsers, [searchQuery, roleFilter, statusFilter, sourceFilter, sortBy, sortOrder]);
  const filteredUsers = pagination.paginatedItems;
  const handleSort = (field) => toggleTableSort(field, sortBy, sortOrder, setSortBy, setSortOrder);

  const identityOptions = form.identity_type === "pegawai" ? employees : officers;
  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const openCreateForm = () => {
    setEditingUser(null);
    setForm({ ...emptyForm, identity_id: officers[0]?.id_petugas ? String(officers[0].id_petugas) : "", id_role: roles[0]?.id_role ? String(roles[0].id_role) : "" });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (user) => {
    const identityType = user.id_pegawai ? "pegawai" : user.id_petugas ? "petugas" : "none";
    setEditingUser(user);
    setForm({
      identity_type: identityType,
      identity_id: String(user.id_pegawai || user.id_petugas || ""),
      id_role: String(user.id_role || ""),
      username: user.username || "",
      password: "",
      email: user.email || "",
      is_active: user.is_active || "Y"
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const changeIdentityType = (type) => {
    const options = type === "pegawai" ? employees : type === "petugas" ? officers : [];
    setForm((current) => ({ ...current, identity_type: type, identity_id: options[0] ? String(type === "pegawai" ? options[0].id_pegawai : options[0].id_petugas) : "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.id_role || !form.username.trim() || (!editingUser && !form.password)) {
      setFormError("Role, username, dan password untuk user baru wajib diisi.");
      return;
    }
    const payload = {
      id_pegawai: form.identity_type === "pegawai" && form.identity_id ? Number(form.identity_id) : null,
      id_petugas: form.identity_type === "petugas" && form.identity_id ? Number(form.identity_id) : null,
      id_role: Number(form.id_role),
      username: form.username.trim(),
      email: form.email.trim() || null
    };
    if (editingUser) payload.is_active = form.is_active;
    else payload.password = form.password;

    setIsSubmitting(true);
    setFormError("");
    try {
      if (editingUser) await api.client.put(`/users/${editingUser.id_user}`, payload);
      else await api.client.post("/users", payload);
      toast.success(`User berhasil ${editingUser ? "diperbarui" : "ditambahkan"}.`);
      setIsFormOpen(false);
      await loadData();
    } catch (error) {
      const details = error.response?.data?.errors;
      setFormError(error.response?.data?.message || (details ? JSON.stringify(details) : "Gagal menyimpan user."));
    } finally { setIsSubmitting(false); }
  };

  return <div className="p-3 sm:p-6 space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"><div><h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2"><UserCog className="w-6 h-6 text-indigo-600" /> Master User</h1><p className="text-xs text-slate-600 mt-1">Akun aplikasi dan relasinya dengan Pegawai atau Petugas.</p></div><button onClick={openCreateForm} className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Tambah User</button></div>

    <div className="flex flex-col sm:flex-row flex-wrap gap-2"><div className="relative flex-1 min-w-64 max-w-lg"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari username, nama, NIP, role, unit..." className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100" /></div><select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Role</option>{roles.map((role) => <option key={role.id_role} value={role.id_role}>{role.nama_role}</option>)}</select><select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Sumber</option><option value="pegawai">Pegawai</option><option value="petugas">Petugas</option></select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Status</option><option value="Y">Aktif</option><option value="N">Nonaktif</option></select></div>

    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[1100px] text-xs"><thead className="bg-slate-50 text-slate-600 uppercase tracking-wider"><tr><SortableTableHeader field="id_user" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">ID</SortableTableHeader><SortableTableHeader field="username" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Username</SortableTableHeader><SortableTableHeader field="email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Email</SortableTableHeader><SortableTableHeader field="role" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Role</SortableTableHeader><th className="px-4 py-3 text-left">Sumber</th><SortableTableHeader field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">NIP / Nama</SortableTableHeader><th className="px-4 py-3 text-left">Jabatan</th><SortableTableHeader field="unit" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Unit</SortableTableHeader><SortableTableHeader field="is_active" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" className="px-4 py-3">Status</SortableTableHeader><th className="px-4 py-3 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">
      {filteredUsers.map((user) => { const identity = user.pegawai || user.petugas; const source = user.pegawai ? "Pegawai" : user.petugas ? "Petugas" : "Tanpa relasi"; return <tr key={user.id_user} className="hover:bg-slate-50"><td className="px-4 py-3 font-black">#{user.id_user}</td><td className="px-4 py-3 font-mono font-black text-indigo-700">{user.username}</td><td className="px-4 py-3">{user.email || "-"}</td><td className="px-4 py-3 font-bold">{user.role?.nama_role || `#${user.id_role}`}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full font-bold ${source === "Pegawai" ? "bg-sky-100 text-sky-700" : source === "Petugas" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{source}</span></td><td className="px-4 py-3"><div className="font-mono font-bold">{identity?.nip || "-"}</div><div className="font-semibold text-slate-600 mt-0.5">{identity?.nama || "-"}</div></td><td className="px-4 py-3">{identity?.jabatan?.nama_jabatan || "-"}</td><td className="px-4 py-3">{identity?.unit?.nama_unit || "-"}</td><td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full font-bold ${user.is_active === "N" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{user.is_active === "N" ? "Nonaktif" : "Aktif"}</span></td><td className="px-4 py-3 text-center"><button onClick={() => openEditForm(user)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"><Edit2 className="w-4 h-4" /></button></td></tr>; })}
      {isLoading && <tr><td colSpan="10" className="px-4 py-12 text-center text-slate-500">Memuat data...</td></tr>}{!isLoading && filteredUsers.length === 0 && <tr><td colSpan="10" className="px-4 py-12 text-center text-slate-500">Data user tidak ditemukan.</td></tr>}
    </tbody></table></div>
    <DataPagination {...pagination} />

    {isFormOpen && <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"><div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"><div className="sticky top-0 z-10 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between"><div><h2 className="text-base font-black">{editingUser ? "Edit" : "Tambah"} User</h2><p className="text-xs text-slate-500">Form sesuai body API Users.</p></div><button onClick={() => setIsFormOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button></div><form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Jenis Identitas"><select value={form.identity_type} onChange={(e) => changeIdentityType(e.target.value)} className="form-input"><option value="pegawai">Pegawai</option><option value="petugas">Petugas</option><option value="none">Tanpa relasi</option></select></Field>
      <Field label="Pegawai / Petugas"><select value={form.identity_id} onChange={(e) => updateForm("identity_id", e.target.value)} disabled={form.identity_type === "none"} className="form-input disabled:bg-slate-100"><option value="">Pilih data</option>{identityOptions.map((item) => { const id = form.identity_type === "pegawai" ? item.id_pegawai : item.id_petugas; return <option key={id} value={id}>{item.nip} — {item.nama}</option>; })}</select></Field>
      <Field label="Role" required><select value={form.id_role} onChange={(e) => updateForm("id_role", e.target.value)} className="form-input" required><option value="">Pilih role</option>{roles.map((role) => <option key={role.id_role} value={role.id_role}>{role.nama_role}</option>)}</select></Field>
      <Field label="Username" required><input value={form.username} onChange={(e) => updateForm("username", e.target.value)} className="form-input" required /></Field>
      {!editingUser && <Field label="Password" required><input type="password" value={form.password} onChange={(e) => updateForm("password", e.target.value)} autoComplete="new-password" className="form-input" required /></Field>}
      <Field label="Email"><input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="Opsional" className="form-input" /></Field>
      {editingUser && <Field label="Status"><select value={form.is_active} onChange={(e) => updateForm("is_active", e.target.value)} className="form-input"><option value="Y">Aktif</option><option value="N">Nonaktif</option></select></Field>}
      {formError && <div className="sm:col-span-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 break-words">{formError}</div>}
      <div className="sm:col-span-2 flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsFormOpen(false)} className="h-10 px-4 rounded-xl bg-slate-100 text-xs font-bold">Batal</button><button type="submit" disabled={isSubmitting} className="h-10 px-5 rounded-xl bg-indigo-600 text-white text-xs font-black disabled:opacity-60">{isSubmitting ? "Menyimpan..." : "Simpan"}</button></div>
    </form></div></div>}
  </div>;
};

const Field = ({ label, required = false, children }) => <label className="space-y-1.5"><span className="block text-xs font-bold text-slate-700">{label}{required && <span className="text-rose-600"> *</span>}</span>{children}</label>;
