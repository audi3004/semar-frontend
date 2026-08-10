import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronRight, Edit2, Network, Plus, Search, X } from "lucide-react";
import { MasterDataService } from "../services/masterDataService";
import { api } from "../services/api";
import { toast } from "../utils/toast";

const getUnitKind = (name = "") => {
  const value = name.toUpperCase();
  if (value.startsWith("GI ")) return "GI";
  if (value.startsWith("ULTG ")) return "ULTG";
  if (value.startsWith("UPT ")) return "UPT";
  if (value.startsWith("UP ")) return "UP";
  return "UNIT";
};

const kindStyle = {
  UP: "bg-purple-100 text-purple-700",
  UPT: "bg-indigo-100 text-indigo-700",
  ULTG: "bg-sky-100 text-sky-700",
  GI: "bg-amber-100 text-amber-800",
  UNIT: "bg-slate-100 text-slate-700"
};

export const UnitKerjaPage = () => {
  const [units, setUnits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [parentId, setParentId] = useState("");
  const [unitName, setUnitName] = useState("");
  const [activeStatus, setActiveStatus] = useState("Y");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUnits = async () => {
    try {
      const response = await api.client.get("/unit", { params: { limit: 1000 } });
      const records = response.data?.data || [];
      setUnits(records);
      setExpandedIds(new Set(records.map((unit) => String(unit.id_unit))));
    } catch (error) {
      const fallback = MasterDataService.getAll("m_unit", { limit: 1000 }).data || [];
      setUnits(fallback);
      toast.error(error.response?.data?.message || "Gagal mengambil data unit dari server.");
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const unitTree = useMemo(() => {
    const nodesById = new Map(
      units.map((unit) => [String(unit.id_unit), { ...unit, children: [] }])
    );
    const roots = [];

    nodesById.forEach((node) => {
      const parentId = node.id_induk_unit == null ? null : String(node.id_induk_unit);
      const parent = parentId ? nodesById.get(parentId) : null;
      if (parent) parent.children.push(node);
      else roots.push(node);
    });

    const sortNodes = (nodes) => {
      nodes.sort((a, b) => String(a.nama_unit || "").localeCompare(String(b.nama_unit || ""), "id"));
      nodes.forEach((node) => sortNodes(node.children));
    };
    sortNodes(roots);
    return roots;
  }, [units]);

  const visibleRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const rows = [];

    const hasMatch = (node) => {
      if (!query) return true;
      return (
        String(node.id_unit).includes(query) ||
        String(node.nama_unit || "").toLowerCase().includes(query) ||
        String(node.indukUnit?.nama_unit || "").toLowerCase().includes(query) ||
        node.children.some(hasMatch)
      );
    };

    const flatten = (nodes, depth = 0) => {
      nodes.forEach((node) => {
        if (!hasMatch(node)) return;
        rows.push({ ...node, depth });
        const isExpanded = query || expandedIds.has(String(node.id_unit));
        if (isExpanded) flatten(node.children, depth + 1);
      });
    };
    flatten(unitTree);
    return rows.filter((unit) => (kindFilter === "all" || getUnitKind(unit.nama_unit) === kindFilter) && (statusFilter === "all" || (unit.is_active || "Y") === statusFilter));
  }, [unitTree, expandedIds, searchQuery, kindFilter, statusFilter]);

  const toggleExpanded = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const unavailableParentIds = useMemo(() => {
    if (!editingUnit) return new Set();
    const unavailable = new Set([String(editingUnit.id_unit)]);
    const collectChildren = (id) => {
      units.filter((unit) => String(unit.id_induk_unit) === String(id)).forEach((child) => {
        unavailable.add(String(child.id_unit));
        collectChildren(child.id_unit);
      });
    };
    collectChildren(editingUnit.id_unit);
    return unavailable;
  }, [editingUnit, units]);

  const parentOptions = useMemo(
    () => units
      .filter((unit) => !unavailableParentIds.has(String(unit.id_unit)))
      .sort((a, b) => String(a.nama_unit || "").localeCompare(String(b.nama_unit || ""), "id")),
    [units, unavailableParentIds]
  );

  const openCreateForm = () => {
    setEditingUnit(null);
    setParentId("");
    setUnitName("");
    setActiveStatus("Y");
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (unit) => {
    setEditingUnit(unit);
    setParentId(unit.id_induk_unit == null ? "" : String(unit.id_induk_unit));
    setUnitName(unit.nama_unit || "");
    setActiveStatus(unit.is_active || "Y");
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedName = unitName.trim();
    if (!normalizedName) {
      setFormError("Nama unit wajib diisi.");
      return;
    }

    const payload = {
      id_induk_unit: parentId === "" ? null : Number(parentId),
      nama_unit: normalizedName
    };
    if (editingUnit) payload.is_active = activeStatus;

    setIsSubmitting(true);
    setFormError("");
    try {
      if (editingUnit) {
        await api.client.put(`/unit/${editingUnit.id_unit}`, payload);
        toast.success("Unit berhasil diperbarui.");
      } else {
        await api.client.post("/unit", payload);
        toast.success("Unit berhasil ditambahkan.");
      }
      setIsFormOpen(false);
      await loadUnits();
    } catch (error) {
      setFormError(error.response?.data?.message || "Gagal menyimpan data unit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Network className="w-6 h-6 text-indigo-600" /> Master Unit Kerja
          </h1>
          <p className="text-xs text-slate-600 mt-1">Hierarki unit berdasarkan relasi induk dari backend.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2">
            Total: <span className="text-indigo-700">{units.length}</span> unit
          </div>
          <button onClick={openCreateForm} className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Tambah Unit
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2"><div className="relative flex-1 max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cari ID, nama unit, atau unit induk..."
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100"
        />
      </div><select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Jenis</option><option value="UP">UP</option><option value="UPT">UPT</option><option value="ULTG">ULTG</option><option value="GI">GI</option></select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Status</option><option value="Y">Aktif</option><option value="N">Nonaktif</option></select></div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 w-24 text-left">ID</th>
              <th className="px-4 py-3 text-left">Hierarki Unit</th>
              <th className="px-4 py-3 text-left">Unit Induk</th>
              <th className="px-4 py-3 w-28 text-center">Jenis</th>
              <th className="px-4 py-3 w-28 text-center">Status</th>
              <th className="px-4 py-3 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRows.map((unit) => {
              const hasChildren = unit.children.length > 0;
              const expanded = expandedIds.has(String(unit.id_unit));
              const kind = getUnitKind(unit.nama_unit);
              return (
                <tr key={unit.id_unit} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-black text-slate-700">#{unit.id_unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${unit.depth * 24}px` }}>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(unit.id_unit)}
                          className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-slate-500 hover:bg-indigo-100 hover:text-indigo-700"
                          aria-label={expanded ? "Tutup cabang" : "Buka cabang"}
                        >
                          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      ) : <span className="w-7 shrink-0" />}
                      <Building2 className={`w-4 h-4 shrink-0 ${hasChildren ? "text-indigo-600" : "text-slate-400"}`} />
                      <span className="font-bold text-slate-900">{unit.nama_unit || "-"}</span>
                      {hasChildren && <span className="text-[10px] text-slate-400">({unit.children.length})</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {unit.indukUnit?.nama_unit || (unit.id_induk_unit ? `Unit #${unit.id_induk_unit}` : "—")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full font-black ${kindStyle[kind]}`}>{kind}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full font-bold ${unit.is_active === "N" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {unit.is_active === "N" ? "Nonaktif" : "Aktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openEditForm(unit)} className="inline-flex w-8 h-8 items-center justify-center rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100" title="Edit unit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-500">Data unit tidak ditemukan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">{editingUnit ? "Edit Unit" : "Tambah Unit"}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Data dikirim langsung ke API Master Unit.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Tutup form">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="unit-name" className="block text-xs font-bold text-slate-700 mb-1.5">Nama Unit <span className="text-rose-600">*</span></label>
                <input
                  id="unit-name"
                  value={unitName}
                  onChange={(event) => setUnitName(event.target.value)}
                  placeholder="Contoh: ULTG SEMARANG"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label htmlFor="parent-unit" className="block text-xs font-bold text-slate-700 mb-1.5">Unit Induk</label>
                <select
                  id="parent-unit"
                  value={parentId}
                  onChange={(event) => setParentId(event.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="">Tanpa unit induk (root)</option>
                  {parentOptions.map((unit) => (
                    <option key={unit.id_unit} value={unit.id_unit}>#{unit.id_unit} — {unit.nama_unit}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">Pilihan ini berasal dari GET /api/unit.</p>
              </div>

              {editingUnit && (
                <div>
                  <label htmlFor="unit-status" className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                  <select
                    id="unit-status"
                    value={activeStatus}
                    onChange={(event) => setActiveStatus(event.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="Y">Aktif</option>
                    <option value="N">Nonaktif</option>
                  </select>
                </div>
              )}

              {formError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">{formError}</div>}

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">Batal</button>
                <button type="submit" disabled={isSubmitting} className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-black">
                  {isSubmitting ? "Menyimpan..." : editingUnit ? "Simpan Perubahan" : "Tambah Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
