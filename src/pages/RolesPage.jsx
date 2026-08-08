import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";
import { SortableTableHeader, sortTableRows, toggleTableSort } from "../components/common/SortableTableHeader";

export const RolesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roles, setRoles] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("level_role");
  const [sortOrder, setSortOrder] = useState("asc");
  useEffect(() => {
    api.client.get("/roles", { params: { limit: 1000 } })
      .then((response) => setRoles(response.data?.data || []))
      .catch(() => setRoles([]));
  }, []);
  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = roles.filter((role) =>
      (statusFilter === "all" || (role.is_active || "Y") === statusFilter) &&
      (!query ||
      [role.id_role, role.kode_role, role.nama_role, role.level_role]
        .some((value) => String(value ?? "").toLowerCase().includes(query))
      )
    );
    return sortTableRows(matches, sortBy, sortOrder, { id_role: (r) => Number(r.id_role), level_role: (r) => Number(r.level_role) });
  }, [roles, searchQuery, statusFilter, sortBy, sortOrder]);
  const pagination = useDataPagination(filteredRoles, [searchQuery, statusFilter, sortBy, sortOrder]);
  const handleSort = (field) => toggleTableSort(field, sortBy, sortOrder, setSortBy, setSortOrder);

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-600" /> Master Roles
        </h1>
        <p className="text-xs text-slate-600 mt-1">Data role pengguna dari endpoint backend.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2"><div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cari kode atau nama role..."
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100"
        />
      </div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"><option value="all">Semua Status</option><option value="Y">Aktif</option><option value="N">Nonaktif</option></select></div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
            <tr>
              <SortableTableHeader field="id_role" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">ID</SortableTableHeader>
              <SortableTableHeader field="kode_role" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Kode Role</SortableTableHeader>
              <SortableTableHeader field="nama_role" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-4 py-3">Nama Role</SortableTableHeader>
              <SortableTableHeader field="level_role" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" className="px-4 py-3">Level</SortableTableHeader>
              <SortableTableHeader field="is_super_admin" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" className="px-4 py-3">Super Admin</SortableTableHeader>
              <SortableTableHeader field="is_active" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" className="px-4 py-3">Status</SortableTableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagination.paginatedItems.map((role) => (
              <tr key={role.id_role} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold">{role.id_role}</td>
                <td className="px-4 py-3 font-black text-indigo-700">{role.kode_role}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{role.nama_role}</td>
                <td className="px-4 py-3 text-center">{role.level_role ?? "-"}</td>
                <td className="px-4 py-3 text-center">{role.is_super_admin ?? "N"}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full font-bold ${role.is_active === "N" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {role.is_active === "N" ? "Nonaktif" : "Aktif"}
                  </span>
                </td>
              </tr>
            ))}
            {filteredRoles.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-500">Data role tidak ditemukan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <DataPagination {...pagination} />
    </div>
  );
};
