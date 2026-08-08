import { useState } from "react";
import {
  DATABASE_SCHEMAS,
  ERD_RELATIONS,
  MYSQL_MARIADB_DDL_SQL,
  ORACLE_DDL_SQL,
  MODULAR_FOLDER_STRUCTURE_TEXT,
  BACKEND_CONTROLLER_SAMPLE_CODE
} from "../../data/databaseSchemaData";
import {
  Database,
  Search,
  Key,
  Link as LinkIcon,
  Download,
  Copy,
  CheckCircle2,
  GitFork,
  FileCode,
  FolderTree,
  Table as TableIcon,
  Layers,
  ChevronRight,
  Sparkles
} from "lucide-react";
export const DatabaseSchemaViewer = () => {
  const [activeTab, setActiveTab] = useState("dictionary");
  const [selectedEngine, setSelectedEngine] = useState("mysql");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedTable, setSelectedTable] = useState(null);
  const [copiedStatus, setCopiedStatus] = useState(null);
  const filteredSchemas = DATABASE_SCHEMAS.filter((tbl) => {
    const matchesCategory = selectedCategory === "ALL" || tbl.category === selectedCategory;
    const matchesSearch = tbl.name.toLowerCase().includes(searchQuery.toLowerCase()) || tbl.alias.toLowerCase().includes(searchQuery.toLowerCase()) || tbl.columns.some(
      (col) => col.name.toLowerCase().includes(searchQuery.toLowerCase()) || col.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesCategory && matchesSearch;
  });
  const categories = ["ALL", "Master", "Transaksi", "HR & Mutasi"];
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(label);
    setTimeout(() => setCopiedStatus(null), 3e3);
  };
  const downloadFile = (content, fileName, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return <div className="space-y-5 text-xs select-none">
      {
    /* Top Banner Alert */
  }
      {copiedStatus && <div className="fixed top-4 right-4 z-50 p-3 bg-emerald-600 text-white font-extrabold rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{copiedStatus} berhasil disalin ke clipboard!</span>
        </div>}

      {
    /* Subtab Header Navigation */
  }
      <div className="bg-white p-2.5 rounded-full border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100/70 border border-slate-200/30 p-1 rounded-full overflow-x-auto w-full md:w-auto pb-1 md:pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("dictionary")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 ${activeTab === "dictionary" ? "bg-white text-slate-900 shadow-xs border border-slate-200/45 font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"}`}
          >
            <TableIcon className="w-3.5 h-3.5 text-sky-600" />
            <span>Data Dictionary</span>
            <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === "dictionary" ? "bg-slate-100 text-slate-800" : "bg-slate-200 text-slate-600"}`}>
              {DATABASE_SCHEMAS.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("erd")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 ${activeTab === "erd" ? "bg-white text-slate-900 shadow-xs border border-slate-200/45 font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"}`}
          >
            <GitFork className="w-3.5 h-3.5 text-sky-600" />
            <span>ERD &amp; Diagram Relasi</span>
          </button>

          <button
            onClick={() => setActiveTab("ddl")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 ${activeTab === "ddl" ? "bg-white text-slate-900 shadow-xs border border-slate-200/45 font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"}`}
          >
            <FileCode className="w-3.5 h-3.5 text-sky-600" />
            <span>DDL SQL Script</span>
          </button>

          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 ${activeTab === "architecture" ? "bg-white text-slate-900 shadow-xs border border-slate-200/45 font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"}`}
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
            <span>Struktur Backend &amp; API</span>
          </button>
        </div>

        {
    /* Global Export Buttons */
  }
        <div className="flex items-center gap-2 w-full md:w-auto justify-end px-2">
          <button
            onClick={() => downloadFile(
              JSON.stringify({ database: "PLN_E_PRESENSI", tables: DATABASE_SCHEMAS, relations: ERD_RELATIONS }, null, 2),
              "pln_epresensi_schema_dictionary.json",
              "application/json"
            )}
            className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold rounded-full flex items-center gap-1.5 transition cursor-pointer text-xs"
            title="Export JSON Data Dictionary"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => downloadFile(
              selectedEngine === "mysql" ? MYSQL_MARIADB_DDL_SQL : ORACLE_DDL_SQL,
              `pln_epresensi_ddl_${selectedEngine}.sql`,
              "text/plain"
            )}
            className="px-4 py-1.5 bg-[#00A3E0] hover:bg-[#0082B3] text-white font-extrabold rounded-full shadow-xs flex items-center gap-1.5 transition cursor-pointer text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download DDL (.sql)</span>
          </button>
        </div>
      </div>

      {
    /* TAB 1: DATA DICTIONARY TABULAR VIEW */
  }
      {activeTab === "dictionary" && <div className="space-y-4">
          {
    /* Search & Category Filter Bar */
  }
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
    type="text"
    placeholder="Cari nama tabel, kolom, atau keterangan..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white transition"
  />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <span className="font-bold text-slate-500 mr-1 hidden sm:inline">Kategori:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full font-bold transition text-[11px] cursor-pointer ${selectedCategory === cat ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {cat === "ALL" ? "Semua Tabel" : cat}
                </button>
              ))}
            </div>
          </div>

          {
    /* Table Cards List */
  }
          <div className="space-y-4">
            {filteredSchemas.map((schema) => <div
    key={schema.name}
    id={`table-${schema.name}`}
    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition hover:border-sky-300"
  >
                {
    /* Table Header */
  }
                <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-sky-100 text-sky-700 rounded-xl font-mono">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm font-mono text-slate-900">{schema.name}</h3>
                        <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${schema.category === "Master" ? "bg-amber-100 text-amber-800" : schema.category === "Transaksi" ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"}`}
  >
                          {schema.category}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] font-semibold">{schema.alias}</p>
                    </div>
                  </div>

                  <p className="text-slate-500 text-[11px] max-w-md italic">{schema.description}</p>
                </div>

                {
    /* Table Column Dictionary Grid */
  }
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <th className="py-2.5 px-3.5 w-12 text-center">Key</th>
                        <th className="py-2.5 px-3.5 w-44 font-mono">Nama Kolom</th>
                        <th className="py-2.5 px-3.5 w-36 font-mono">Tipe Data (MySQL)</th>
                        <th className="py-2.5 px-3.5 w-36 font-mono">Tipe Data (Oracle)</th>
                        <th className="py-2.5 px-3.5 w-24 text-center">Null?</th>
                        <th className="py-2.5 px-3.5 w-36">Default</th>
                        <th className="py-2.5 px-3.5">Keterangan / Referensi FK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {schema.columns.map((col) => <tr key={col.name} className="hover:bg-sky-50/40 transition">
                          <td className="py-2 px-3 text-center">
                            {col.isPk ? <span className="inline-flex items-center justify-center bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-extrabold text-[10px] font-mono gap-1" title="Primary Key">
                                <Key className="w-3 h-3 text-amber-600" /> PK
                              </span> : col.isFk ? <span className="inline-flex items-center justify-center bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-md font-extrabold text-[10px] font-mono gap-1" title={`Foreign Key -> ${col.fkRef}`}>
                                <LinkIcon className="w-3 h-3 text-sky-600" /> FK
                              </span> : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="py-2 px-3.5 font-bold font-mono text-slate-900">{col.name}</td>
                          <td className="py-2 px-3.5 font-mono text-sky-700 font-semibold">{col.type}</td>
                          <td className="py-2 px-3.5 font-mono text-purple-700 font-semibold">{col.oracleType}</td>
                          <td className="py-2 px-3.5 text-center font-bold">
                            {col.nullable ? <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">YES</span> : <span className="text-slate-400 text-[10px]">NO</span>}
                          </td>
                          <td className="py-2 px-3.5 font-mono text-slate-500">{col.defaultVal || "-"}</td>
                          <td className="py-2 px-3.5 text-slate-700">
                            <span>{col.description}</span>
                            {col.fkRef && <span className="ml-2 inline-block bg-sky-50 text-sky-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border border-sky-200">
                                🔗 {col.fkRef}
                              </span>}
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>)}
          </div>
        </div>}

      {
    /* TAB 2: INTERACTIVE ERD & CARD RELATIONS VIEW */
  }
      {activeTab === "erd" && <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <GitFork className="w-4 h-4 text-sky-600" /> Visualisasi Diagram Relasi Entitas (ERD)
              </h3>
              <p className="text-slate-500 text-xs">
                Hubungan relasi antar-tabel Master Data, Mutasi, dan 5 Tabel Transaksi Operasional PLN.
              </p>
            </div>
            {selectedTable && <button
    onClick={() => setSelectedTable(null)}
    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
  >
                Reset Highlight
              </button>}
          </div>

          {
    /* ERD Schema Grid Nodes */
  }
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DATABASE_SCHEMAS.map((tbl) => {
    const isSelected = selectedTable === tbl.name;
    const relatedEdges = ERD_RELATIONS.filter(
      (r) => r.fromTable === tbl.name || r.toTable === tbl.name
    );
    return <div
      key={tbl.name}
      onClick={() => setSelectedTable(selectedTable === tbl.name ? null : tbl.name)}
      className={`bg-white rounded-2xl border p-4 shadow-xs transition cursor-pointer relative overflow-hidden ${isSelected ? "border-sky-500 ring-2 ring-sky-400/30 bg-sky-50/20" : "border-slate-200 hover:border-slate-400"}`}
    >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-sky-600" />
                      <h4 className="font-mono font-black text-slate-900">{tbl.name}</h4>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">
                      {tbl.columns.length} Kolom
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-600 line-clamp-1 mb-2">{tbl.alias}</p>

                  <div className="space-y-1 font-mono text-[11px]">
                    {tbl.columns.map((c) => <div key={c.name} className="flex items-center justify-between text-slate-700 py-0.5 border-b border-slate-50">
                        <span className="flex items-center gap-1 font-bold">
                          {c.isPk && <Key className="w-3 h-3 text-amber-500" />}
                          {c.isFk && <LinkIcon className="w-3 h-3 text-sky-500" />}
                          <span className={c.isPk ? "text-amber-700 font-black" : c.isFk ? "text-sky-700" : "text-slate-800"}>
                            {c.name}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400">{c.type}</span>
                      </div>)}
                  </div>

                  {
      /* Related Tables Indicator */
    }
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Relasi: <strong>{relatedEdges.length} Keterkaitan</strong></span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>;
  })}
          </div>

          {
    /* Relations List Mapping */
  }
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Daftar Pemetaan Relasi Constraint Foreign Key
            </h4>

            <div className="divide-y divide-slate-100">
              {ERD_RELATIONS.map((rel, idx) => <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded text-[11px]">
                      {rel.fromTable}.{rel.fromCol}
                    </span>
                    <span className="text-slate-400 font-bold">--[{rel.type}]--&gt;</span>
                    <span className="bg-sky-100 text-sky-900 font-black px-2 py-0.5 rounded text-[11px]">
                      {rel.toTable}.{rel.toCol}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] italic">{rel.description}</p>
                </div>)}
            </div>
          </div>
        </div>}

      {
    /* TAB 3: DDL SQL SCRIPT VIEWER */
  }
      {activeTab === "ddl" && <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-extrabold text-slate-900 text-xs">Pilih Dialek Database:</span>
              <button
    onClick={() => setSelectedEngine("mysql")}
    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${selectedEngine === "mysql" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
  >
                MariaDB / MySQL 8.0
              </button>
              <button
    onClick={() => setSelectedEngine("oracle")}
    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${selectedEngine === "oracle" ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
  >
                Oracle 19c / 21c
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
    onClick={() => copyToClipboard(
      selectedEngine === "mysql" ? MYSQL_MARIADB_DDL_SQL : ORACLE_DDL_SQL,
      `Script DDL ${selectedEngine.toUpperCase()}`
    )}
    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
  >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Script SQL</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 text-slate-100 rounded-2xl p-4 sm:p-5 font-mono text-xs overflow-x-auto shadow-xl border border-slate-800 max-h-[600px] scrollbar-thin">
            <pre className="leading-relaxed">
              {selectedEngine === "mysql" ? MYSQL_MARIADB_DDL_SQL : ORACLE_DDL_SQL}
            </pre>
          </div>
        </div>}

      {
    /* TAB 4: ARCHITECTURE & BACKEND CONTROLLER */
  }
      {activeTab === "architecture" && <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {
    /* Folder Structure Card */
  }
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <FolderTree className="w-4 h-4 text-sky-600" /> Struktur Folder Backend &amp; Frontend Modular
              </h3>
              <p className="text-slate-600 text-xs font-medium">
                Sistem arsitektur modular terpisah (Separation of Concerns) siap pakai untuk integrasi REST API Express/NestJS &amp; React UI.
              </p>

              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-[420px] scrollbar-thin border border-slate-800">
                <pre>{MODULAR_FOLDER_STRUCTURE_TEXT}</pre>
              </div>
            </div>

            {
    /* Controller Sample Code */
  }
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileCode className="w-4 h-4 text-purple-600" /> Sample Code Express Controller (Backend)
              </h3>
              <p className="text-slate-600 text-xs font-medium">
                Contoh pengolahan data transaksi lembur, integrasi UMK, dan kalkulasi otomatis nominal rupiah.
              </p>

              <div className="bg-slate-900 text-sky-300 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-[420px] scrollbar-thin border border-slate-800">
                <pre>{BACKEND_CONTROLLER_SAMPLE_CODE}</pre>
              </div>
            </div>
          </div>
        </div>}
    </div>;
};
