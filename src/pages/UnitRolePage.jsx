import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, ChevronDown, Edit2, Mail, Plus, Search, ShieldCheck, Trash2, UserRound, Users, X } from "lucide-react";
import { api } from "../services/api";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { toast } from "../utils/toast";

const roleColors = [
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-800 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200"
];

const UnitRolePage = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [query, setQuery] = useState("");
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form, setForm] = useState({ id_unit: "", id_role: "", scope_type: "SELF", is_active: "Y" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [usersResponse, unitsResponse, rolesResponse] = await Promise.all([
          api.client.get("/users", { params: { limit: 1000 } }),
          api.client.get("/unit", { params: { limit: 1000 } }),
          api.client.get("/roles", { params: { limit: 1000 } })
        ]);
        setUsers(usersResponse.data?.data || []);
        setUnits(unitsResponse.data?.data || []);
        setRoles((rolesResponse.data?.data || []).filter((role) =>
          ["CHECKER", "VERIFICATION", "APPROVAL_1", "APPROVAL_2", "APPROVAL_3"].includes(role.kode_role)
        ));
      } catch (error) {
        toast.error(error.response?.data?.message || "Gagal mengambil daftar user.");
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setAssignments([]);
      return;
    }
    let active = true;
    setIsAssignmentsLoading(true);
    api.getUnitRolesByUser(selectedUserId)
      .then((data) => { if (active) setAssignments(data); })
      .catch((error) => {
        if (active) {
          setAssignments([]);
          toast.error(error.response?.data?.message || "Gagal mengambil assignment unit role.");
        }
      })
      .finally(() => { if (active) setIsAssignmentsLoading(false); });
    return () => { active = false; };
  }, [selectedUserId]);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return users.filter((user) => {
      const identity = user.pegawai || user.petugas || {};
      return !keyword || [identity.nama, identity.nip, user.username, user.email, user.role?.nama_role]
        .some((value) => String(value || "").toLowerCase().includes(keyword));
    });
  }, [users, query]);

  const selectedUser = users.find((user) => String(user.id_user) === String(selectedUserId));
  const identity = selectedUser?.pegawai || selectedUser?.petugas || {};
  const activeAssignments = assignments.filter((item) => item.is_active === "Y");
  const canManage = ["admin", "superadmin"].includes(currentUser?.role);

  const unitTree = useMemo(() => {
    const activeUnits = units.filter((unit) => unit.is_active !== "N");
    const ids = new Set(activeUnits.map((unit) => Number(unit.id_unit)));
    const childrenByParent = new Map();
    activeUnits.forEach((unit) => {
      const parentId = unit.id_induk_unit == null ? null : Number(unit.id_induk_unit);
      const key = ids.has(parentId) ? parentId : null;
      if (!childrenByParent.has(key)) childrenByParent.set(key, []);
      childrenByParent.get(key).push(unit);
    });
    childrenByParent.forEach((children) => children.sort((a, b) =>
      String(a.nama_unit).localeCompare(String(b.nama_unit), "id")
    ));
    return { roots: childrenByParent.get(null) || [], childrenByParent };
  }, [units]);

  const effectiveUnitIds = useMemo(() => {
    if (!form.id_unit) return new Set();
    const selectedId = Number(form.id_unit);
    const result = new Set([selectedId]);
    if (form.scope_type !== "SELF_AND_DESCENDANTS") return result;
    const queue = [selectedId];
    while (queue.length) {
      const current = queue.shift();
      (unitTree.childrenByParent.get(current) || []).forEach((child) => {
        const childId = Number(child.id_unit);
        if (!result.has(childId)) {
          result.add(childId);
          queue.push(childId);
        }
      });
    }
    return result;
  }, [form.id_unit, form.scope_type, unitTree]);

  const refreshAssignments = async () => {
    if (!selectedUserId) return;
    const data = await api.getUnitRolesByUser(selectedUserId);
    setAssignments(data);
  };

  const openCreateForm = () => {
    setEditingAssignment(null);
    setForm({ id_unit: "", id_role: String(roles[0]?.id_role || ""), scope_type: "SELF", is_active: "Y" });
    setIsFormOpen(true);
  };

  const openEditForm = (assignment) => {
    setEditingAssignment(assignment);
    setForm({ id_unit: String(assignment.id_unit), id_role: String(assignment.id_role), scope_type: assignment.scope_type || "SELF", is_active: assignment.is_active || "Y" });
    setIsFormOpen(true);
  };

  const submitAssignment = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        id_user: Number(selectedUserId),
        id_unit: Number(form.id_unit),
        id_role: Number(form.id_role),
        scope_type: form.scope_type,
        is_active: form.is_active
      };
      if (editingAssignment) await api.client.put(`/unit-role/${editingAssignment.id_unit_role}`, payload);
      else await api.client.post("/unit-role", payload);
      await refreshAssignments();
      setIsFormOpen(false);
      toast.success(editingAssignment ? "Assignment Unit Role berhasil diperbarui." : "User berhasil di-assign ke unit.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyimpan assignment Unit Role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAssignment = async (assignment) => {
    if (!window.confirm(`Hapus assignment ${assignment.role?.nama_role || "role"} pada ${assignment.unit?.nama_unit || "unit"}?`)) return;
    try {
      await api.client.delete(`/unit-role/${assignment.id_unit_role}`);
      await refreshAssignments();
      toast.success("Assignment Unit Role berhasil dihapus.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menghapus assignment Unit Role.");
    }
  };

  const renderUnitNode = (unit, depth = 0) => {
    const id = Number(unit.id_unit);
    const children = unitTree.childrenByParent.get(id) || [];
    const isSelected = Number(form.id_unit) === id;
    const isInherited = !isSelected && effectiveUnitIds.has(id);
    return (
      <div key={unit.id_unit}>
        <button
          type="button"
          onClick={() => setForm((current) => ({ ...current, id_unit: String(unit.id_unit) }))}
          className={`w-full flex items-center gap-2 rounded-lg py-2 pr-3 text-left transition ${isSelected ? "bg-sky-100 text-sky-900" : isInherited ? "bg-emerald-50 text-emerald-800" : "hover:bg-slate-50 text-slate-700"}`}
          style={{ paddingLeft: `${12 + depth * 22}px` }}
        >
          <span className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${effectiveUnitIds.has(id) ? "bg-sky-600 border-sky-600 text-white" : "border-slate-300 bg-white"}`}>
            {effectiveUnitIds.has(id) && <CheckCircle2 className="w-3 h-3" />}
          </span>
          <Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span className="text-xs font-bold flex-1">{unit.nama_unit}</span>
          {isInherited && <span className="text-[9px] font-extrabold uppercase text-emerald-700">Turunan</span>}
        </button>
        {children.map((child) => renderUnitNode(child, depth + 1))}
      </div>
    );
  };

  if (isLoading) return <LoadingSkeleton variant="table" />;

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Unit Role</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Lihat matriks role dan unit yang di-assign kepada setiap user.</p>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <label className="block text-xs font-extrabold text-slate-700 mb-2">Pilih User</label>
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
          <input
            value={query}
            onFocus={() => setIsSelectorOpen(true)}
            onChange={(event) => { setQuery(event.target.value); setIsSelectorOpen(true); }}
            placeholder="Cari nama, NIP, username, email, atau role..."
            className="w-full h-10 pl-9 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
          />
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
          {isSelectorOpen && (
            <div className="absolute z-30 left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl p-1.5">
              {filteredUsers.length ? filteredUsers.map((user) => {
                const person = user.pegawai || user.petugas || {};
                return (
                  <button key={user.id_user} type="button" onClick={() => {
                    setSelectedUserId(String(user.id_user));
                    setQuery(person.nama || user.username || "");
                    setIsSelectorOpen(false);
                  }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-sky-50 transition flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">{person.nama || user.username}</p>
                      <p className="text-[10px] text-slate-500 truncate">{person.nip || user.username} · {user.email || "Tanpa email"}</p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 shrink-0">{user.role?.nama_role || "-"}</span>
                  </button>
                );
              }) : <p className="p-4 text-center text-xs text-slate-500">User tidak ditemukan.</p>}
            </div>
          )}
        </div>
      </section>

      {!selectedUser ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">Pilih user untuk melihat profil dan matriks Unit Role.</p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0"><UserRound className="w-6 h-6" /></div>
              <div className="min-w-0 space-y-1">
                <h2 className="text-base font-black text-slate-900">{identity.nama || selectedUser.username}</h2>
                <p className="text-xs text-slate-500">NIP/Username: <span className="font-bold text-slate-700">{identity.nip || selectedUser.username}</span></p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{selectedUser.email || "Email belum tersedia"}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Global / Primary Role</p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold">
                <ShieldCheck className="w-4 h-4" />{selectedUser.role?.nama_role || "Belum memiliki role"}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div><h2 className="text-sm font-black text-slate-900">Matriks Unit & Role</h2><p className="text-[11px] text-slate-500 mt-0.5">Assignment aktif dan historis user pada unit organisasi.</p></div>
              <div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-[10px] font-extrabold">{activeAssignments.length} Aktif</span>{canManage && <button type="button" onClick={openCreateForm} className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 text-[10px] font-extrabold"><Plus className="w-3.5 h-3.5" />Assign Unit</button>}</div>
            </div>
            {isAssignmentsLoading ? <div className="p-8"><LoadingSkeleton variant="table" /></div> : assignments.length === 0 ? (
              <div className="p-10 text-center"><Building2 className="w-9 h-9 text-slate-300 mx-auto mb-2" /><p className="text-xs font-bold text-slate-500">Belum ada Unit Role yang di-assign.</p></div>
            ) : (
              <div className="overflow-x-auto"><table className="w-full text-left text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-5 py-3">Unit</th><th className="px-5 py-3">Role pada Unit</th><th className="px-5 py-3">Level</th><th className="px-5 py-3 text-center">Status</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{assignments.map((item, index) => (
                  <tr key={item.id_unit_role} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5"><span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 font-bold"><Building2 className="w-3.5 h-3.5" />{item.unit?.nama_unit || `Unit #${item.id_unit}`}</span>{item.scope_type === "SELF_AND_DESCENDANTS" && <span className="block mt-1 text-[9px] font-bold text-emerald-700">Termasuk seluruh unit turunan</span>}</td>
                    <td className="px-5 py-3.5"><span className={`inline-flex rounded-full border px-2.5 py-1 font-extrabold ${roleColors[index % roleColors.length]}`}>{item.role?.nama_role || item.role?.kode_role || `Role #${item.id_role}`}</span></td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-600">{item.role?.level_role ?? "-"}</td>
                    <td className="px-5 py-3.5 text-center">{item.is_active === "Y" ? <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5" />Aktif</span> : <span className="text-slate-400 font-bold">Nonaktif</span>}</td>
                    <td className="px-5 py-3.5">{canManage ? <div className="flex justify-end gap-1.5"><button type="button" onClick={() => openEditForm(item)} title="Edit assignment" className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"><Edit2 className="w-3.5 h-3.5" /></button><button type="button" onClick={() => deleteAssignment(item)} title="Hapus assignment" className="p-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5" /></button></div> : <span className="block text-right text-[10px] font-bold text-slate-400">Read-only</span>}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </section>
        </>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={submitAssignment} className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between"><div><h3 className="text-sm font-black text-slate-900">{editingAssignment ? "Edit Unit Role" : "Assign Unit Role"}</h3><p className="text-[11px] text-slate-500 mt-0.5">{identity.nama || selectedUser.username}</p></div><button type="button" onClick={() => setIsFormOpen(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
            <div className="p-5 space-y-4">
              <label className="block"><span className="block text-xs font-bold text-slate-700 mb-1.5">Role pada Unit</span><select required value={form.id_role} onChange={(event) => setForm((current) => ({ ...current, id_role: event.target.value }))} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold"><option value="">Pilih role approval</option>{roles.map((role) => <option key={role.id_role} value={role.id_role}>{role.nama_role}</option>)}</select></label>
              <div>
                <span className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Unit dari Hierarchy</span>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 p-1.5 bg-white">
                  {unitTree.roots.map((unit) => renderUnitNode(unit))}
                  {!unitTree.roots.length && <p className="p-4 text-center text-xs text-slate-500">Data hierarchy unit tidak tersedia.</p>}
                </div>
              </div>
              <fieldset disabled={!form.id_unit} className="space-y-2">
                <legend className="text-xs font-bold text-slate-700 mb-1.5">Cakupan Assignment</legend>
                <label className="flex gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50"><input type="radio" name="scope_type" value="SELF" checked={form.scope_type === "SELF"} onChange={(event) => setForm((current) => ({ ...current, scope_type: event.target.value }))} /><span><strong className="block text-xs text-slate-800">Unit ini saja</strong><small className="text-[10px] text-slate-500">Otoritas hanya berlaku pada unit yang dipilih.</small></span></label>
                <label className="flex gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50"><input type="radio" name="scope_type" value="SELF_AND_DESCENDANTS" checked={form.scope_type === "SELF_AND_DESCENDANTS"} onChange={(event) => setForm((current) => ({ ...current, scope_type: event.target.value }))} /><span><strong className="block text-xs text-slate-800">Unit ini dan seluruh turunannya</strong><small className="text-[10px] text-slate-500">Unit baru di bawah parent ini otomatis ikut tercakup.</small></span></label>
              </fieldset>
              {form.id_unit && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11px] font-bold text-emerald-800">Cakupan efektif: {effectiveUnitIds.size} unit</div>}
              <label className="block"><span className="block text-xs font-bold text-slate-700 mb-1.5">Status</span><select value={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.value }))} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold"><option value="Y">Aktif</option><option value="N">Nonaktif</option></select></label>
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2"><button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold">Batal</button><button disabled={isSubmitting || !form.id_unit || !form.id_role} className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-extrabold disabled:opacity-60">{isSubmitting ? "Menyimpan..." : "Simpan Assignment"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UnitRolePage;
