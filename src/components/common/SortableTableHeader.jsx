import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

export const sortTableRows = (rows, sortBy, sortOrder = "asc", selectors = {}) => {
  if (!sortBy) return rows;
  const selector = selectors[sortBy] || ((row) => row?.[sortBy]);
  const direction = sortOrder === "desc" ? -1 : 1;
  return [...rows].sort((left, right) => {
    const a = selector(left);
    const b = selector(right);
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === "number" && typeof b === "number") return (a - b) * direction;
    return String(a).localeCompare(String(b), "id", { numeric: true, sensitivity: "base" }) * direction;
  });
};

export const toggleTableSort = (field, sortBy, sortOrder, setSortBy, setSortOrder) => {
  if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  else {
    setSortBy(field);
    setSortOrder("asc");
  }
};

export const SortableTableHeader = ({ field, sortBy, sortOrder, onSort, children, className = "", align = "left" }) => {
  const Icon = sortBy === field ? (sortOrder === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <th className={className}>
      <button type="button" onClick={() => onSort(field)} className={`w-full inline-flex items-center gap-1.5 hover:text-indigo-700 transition ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"}`}>
        <span>{children}</span><Icon className={`w-3.5 h-3.5 ${sortBy === field ? "text-indigo-600" : "text-slate-300"}`} />
      </button>
    </th>
  );
};
