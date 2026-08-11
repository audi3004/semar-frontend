import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Mail,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  Users
} from "lucide-react";
import { api } from "../services/api";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { toast } from "../utils/toast";

const UnitRolePage = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [checkedUnitIds, setCheckedUnitIds] = useState(new Set());
  const [query, setQuery] = useState("");
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [expandedUnitIds, setExpandedUnitIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = ["admin", "superadmin"].includes(currentUser?.role);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [usersResponse, unitsResponse] = await Promise.all([
          api.client.get("/users", { params: { limit: 1000 } }),
          api.client.get("/unit", { params: { limit: 1000 } })
        ]);
        setUsers(usersResponse.data?.data || []);
        setUnits(unitsResponse.data?.data || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Gagal mengambil data user dan unit.");
      } finally {
        setIsLoading(false);
      }
    };
    loadMasterData();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setAssignments([]);
      setCheckedUnitIds(new Set());
      return undefined;
    }

    let active = true;
    setIsAssignmentsLoading(true);
    api.getUnitRolesByUser(selectedUserId)
      .then((data) => {
        if (!active) return;
        setAssignments(data);
        setCheckedUnitIds(new Set(
          data.filter((item) => item.is_active === "Y").map((item) => Number(item.id_unit))
        ));
      })
      .catch((error) => {
        if (!active) return;
        setAssignments([]);
        setCheckedUnitIds(new Set());
        toast.error(error.response?.data?.message || "Gagal mengambil penugasan unit user.");
      })
      .finally(() => { if (active) setIsAssignmentsLoading(false); });

    return () => { active = false; };
  }, [selectedUserId]);

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id_user) === String(selectedUserId)),
    [users, selectedUserId]
  );
  const identity = selectedUser?.pegawai || selectedUser?.petugas || {};

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return users.filter((user) => {
      const person = user.pegawai || user.petugas || {};
      return !keyword || [person.nama, person.nip, user.username, user.email, user.role?.nama_role]
        .some((value) => String(value || "").toLowerCase().includes(keyword));
    });
  }, [users, query]);

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

  useEffect(() => {
    setExpandedUnitIds(new Set(unitTree.roots.map((unit) => Number(unit.id_unit))));
  }, [unitTree]);

  const savedUnitIds = useMemo(() => new Set(
    assignments.filter((item) => item.is_active === "Y").map((item) => Number(item.id_unit))
  ), [assignments]);

  const isDirty = checkedUnitIds.size !== savedUnitIds.size
    || [...checkedUnitIds].some((id) => !savedUnitIds.has(id));

  const toggleUnit = (unitId) => {
    if (!canManage || isAssignmentsLoading || isSubmitting) return;
    setCheckedUnitIds((current) => {
      const next = new Set(current);
      const shouldCheck = !next.has(unitId);
      const queue = [unitId];

      while (queue.length) {
        const currentUnitId = queue.shift();
        if (shouldCheck) next.add(currentUnitId);
        else next.delete(currentUnitId);

        (unitTree.childrenByParent.get(currentUnitId) || []).forEach((child) => {
          queue.push(Number(child.id_unit));
        });
      }

      return next;
    });
  };

  const toggleExpanded = (unitId) => {
    setExpandedUnitIds((current) => {
      const next = new Set(current);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  const saveAssignments = async () => {
    if (!selectedUser || !isDirty || !canManage) return;
    if (!selectedUser.id_role) {
      toast.error("User belum memiliki default role sehingga penugasan unit tidak dapat disimpan.");
      return;
    }

    const activeByUnit = new Map();
    const inactiveByUnit = new Map();
    assignments.forEach((assignment) => {
      const map = assignment.is_active === "Y" ? activeByUnit : inactiveByUnit;
      const unitId = Number(assignment.id_unit);
      if (!map.has(unitId)) map.set(unitId, assignment);
    });

    const removed = [...savedUnitIds].filter((id) => !checkedUnitIds.has(id));
    const added = [...checkedUnitIds].filter((id) => !savedUnitIds.has(id));
    setIsSubmitting(true);
    try {
      await Promise.all([
        ...removed.map((unitId) => api.client.put(
          `/unit-role/${activeByUnit.get(unitId).id_unit_role}`,
          { is_active: "N" }
        )),
        ...added.map((unitId) => {
          const inactive = inactiveByUnit.get(unitId);
          const payload = {
            id_user: Number(selectedUser.id_user),
            id_unit: unitId,
            id_role: Number(selectedUser.id_role),
            scope_type: "SELF",
            is_active: "Y"
          };
          return inactive
            ? api.client.put(`/unit-role/${inactive.id_unit_role}`, payload)
            : api.client.post("/unit-role", payload);
        })
      ]);

      const refreshed = await api.getUnitRolesByUser(selectedUser.id_user);
      setAssignments(refreshed);
      setCheckedUnitIds(new Set(
        refreshed.filter((item) => item.is_active === "Y").map((item) => Number(item.id_unit))
      ));
      toast.success("Penugasan unit berhasil disimpan.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyimpan penugasan unit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUnitNode = (unit, depth = 0) => {
    const unitId = Number(unit.id_unit);
    const children = unitTree.childrenByParent.get(unitId) || [];
    const expanded = expandedUnitIds.has(unitId);
    const checked = checkedUnitIds.has(unitId);

    return (
      <div key={unit.id_unit}>
        <div
          className={`flex items-center gap-2 py-2.5 pr-3 rounded-xl transition ${checked ? "bg-sky-50" : "hover:bg-slate-50"}`}
          style={{ paddingLeft: `${10 + depth * 22}px` }}
        >
          {children.length ? (
            <button type="button" onClick={() => toggleExpanded(unitId)} className="p-0.5 rounded hover:bg-slate-200" aria-label={expanded ? "Tutup unit turunan" : "Buka unit turunan"}>
              {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
            </button>
          ) : <span className="w-5" />}
          <label className={`flex flex-1 min-w-0 items-center gap-2.5 ${canManage ? "cursor-pointer" : "cursor-default"}`}>
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              disabled={!canManage || isAssignmentsLoading || isSubmitting}
              onChange={() => toggleUnit(unitId)}
            />
            <span className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition ${checked ? "bg-sky-600 border-sky-600 text-white" : "border-slate-300 bg-white"}`}>
              {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </span>
            <Building2 className={`w-4 h-4 shrink-0 ${checked ? "text-sky-600" : "text-slate-400"}`} />
            <span className={`text-xs font-bold truncate ${checked ? "text-sky-900" : "text-slate-700"}`}>{unit.nama_unit}</span>
          </label>
        </div>
        {expanded && children.map((child) => renderUnitNode(child, depth + 1))}
      </div>
    );
  };

  if (isLoading) return <LoadingSkeleton variant="table" />;

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Penugasan Unit User</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Pilih user, lalu atur unit yang menjadi cakupan penugasannya.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={saveAssignments}
            disabled={!selectedUser || !isDirty || isAssignmentsLoading || isSubmitting}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        )}
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
          <p className="text-sm font-bold text-slate-600">Pilih user untuk melihat role dan hierarchy unit.</p>
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
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Default Role</p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold">
                <ShieldCheck className="w-4 h-4" />{selectedUser.role?.nama_role || "Belum memiliki role"}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Role mengikuti profil user dan bersifat read-only.</p>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Hierarchy Unit</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Centang unit yang ditugaskan kepada user ini.</p>
              </div>
              <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 text-[10px] font-extrabold">{checkedUnitIds.size} Unit Dipilih</span>
            </div>
            {isAssignmentsLoading ? (
              <div className="p-8"><LoadingSkeleton variant="table" /></div>
            ) : (
              <div className="p-2 sm:p-3 max-h-[560px] overflow-y-auto">
                {unitTree.roots.map((unit) => renderUnitNode(unit))}
                {!unitTree.roots.length && <p className="p-8 text-center text-xs text-slate-500">Data hierarchy unit tidak tersedia.</p>}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default UnitRolePage;
