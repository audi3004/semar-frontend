import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { MasterDataService } from "../services/masterDataService";
import { DataPagination, useDataPagination } from "../components/common/DataPagination";

export const RolesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const roles = MasterDataService.getAll("m_role", { limit: 1000 }).data || [];
  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) =>
      [role.id_role, role.kode_role, role.nama_role, role.level_role]
        .some((value) => String(value ?? "").toLowerCase().includes(query))
    );
  }, [roles, searchQuery]);
  const pagination = useDataPagination(filteredRoles, [searchQuery]);

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-600" /> Master Roles
        </h1>
        <p className="text-xs text-slate-600 mt-1">Data role pengguna dari endpoint backend.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cari kode atau nama role..."
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Kode Role</th>
              <th className="px-4 py-3 text-left">Nama Role</th>
              <th className="px-4 py-3 text-center">Level</th>
              <th className="px-4 py-3 text-center">Super Admin</th>
              <th className="px-4 py-3 text-center">Status</th>
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
