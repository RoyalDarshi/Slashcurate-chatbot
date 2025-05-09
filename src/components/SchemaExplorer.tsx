import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  Table2,
  Columns,
  ChevronRight,
  Code,
  X,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { DatabaseSchema } from "../types";
import { Theme } from "../ThemeContext";

interface SchemaExplorerProps {
  schemas: DatabaseSchema[];
  onClose: () => void;
  theme: Theme;
  onColumnClick: (columnName: string) => void;
  selectedConnection?: string;
  maxHeight?: string;
}

const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  schemas,
  onClose,
  theme,
  onColumnClick,
  selectedConnection,
  maxHeight = "calc(90vh - 180px)",
}) => {
  const [activeSchema, setActiveSchema] = useState<string | null>(
    schemas[0]?.name || null
  );
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "columns">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilterOptions, setShowFilterOptions] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"columns" | "sampleData">(
    "columns"
  );

  const tableListRef = useRef<HTMLDivElement>(null);
  const columnListRef = useRef<HTMLDivElement>(null);
  const schemaTabsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTable(null);
  }, [activeSchema]);

  useEffect(() => {
    if (activeTable) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [activeTable]);

  useEffect(() => {
    setActiveView("columns");
  }, [activeTable]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilterOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterRef]);

  const handleTableClick = (tableName: string) => {
    setActiveTable(activeTable === tableName ? null : tableName);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleSortByChange = (sortType: "name" | "columns") => {
    if (sortBy === sortType) {
      toggleSortDirection();
    } else {
      setSortBy(sortType);
      setSortDirection("asc");
    }
  };

  const scrollToColumnIfNeeded = (columnName: string) => {
    if (columnListRef.current) {
      const columnElement = columnListRef.current.querySelector(
        `[data-column="${columnName}"]`
      );
      columnElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const filteredSchemas = schemas
    .filter((schema) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const schemaNameMatch = schema.name.toLowerCase().includes(searchLower);
      const hasMatchingTable = schema.tables.some(
        (table) =>
          table.name.toLowerCase().includes(searchLower) ||
          table.columns.some(
            (col) =>
              col.name.toLowerCase().includes(searchLower) ||
              col.type.toLowerCase().includes(searchLower)
          )
      );
      return schemaNameMatch || hasMatchingTable;
    })
    .map((schema) => {
      if (!searchTerm) return schema;
      const searchLower = searchTerm.toLowerCase();
      const schemaNameMatch = schema.name.toLowerCase().includes(searchLower);
      if (schemaNameMatch) {
        return schema;
      } else {
        const filteredTables = schema.tables.filter(
          (table) =>
            table.name.toLowerCase().includes(searchLower) ||
            table.columns.some(
              (col) =>
                col.name.toLowerCase().includes(searchLower) ||
                col.type.toLowerCase().includes(searchLower)
            )
        );
        return { ...schema, tables: filteredTables };
      }
    });

  const sortedTables = (schema: DatabaseSchema) => {
    if (!schema) return [];
    return [...schema.tables].sort((a, b) => {
      if (sortBy === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortDirection === "asc"
          ? a.columns.length - b.columns.length
          : b.columns.length - a.columns.length;
      }
    });
  };

  const activeSchemaData = filteredSchemas.find((s) => s.name === activeSchema);
  const activeTableData = activeSchemaData?.tables.find(
    (t) => t.name === activeTable
  );

  return (
    <div
      className="schema-explorer w-full max-w-full rounded-lg flex flex-col"
      style={{
        background: theme.colors.surface,
        boxShadow: `0 8px 32px ${theme.colors.text}15`,
        maxHeight: maxHeight,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <style>
        {`
          .schema-explorer { animation: slideIn 0.3s ease-out forwards; }
          @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .schema-item, .table-item, .column-item { opacity: 0; transform: translateY(10px); transition: all 0.2s ease-out; animation: fadeInItem 0.3s forwards; animation-delay: calc(var(--item-index) * 0.05s); }
          @keyframes fadeInItem { to { opacity: 1; transform: translateY(0); } }
          .appear { opacity: 1; transform: translateY(0); }
          .table-row:hover { background-color: ${theme.colors.accent}10; }
          .schema-tab { transition: all 0.2s ease; position: relative; overflow: hidden; }
          .schema-tab::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 2px; background-color: ${theme.colors.accent}; transition: width 0.3s ease; }
          .schema-tab.active::after { width: 100%; }
          .column-item { transition: all 0.2s ease; }
          .column-item:hover { background-color: ${theme.colors.accent}15; transform: translateX(5px); }
          .sample-data-container { animation: fadeIn 0.3s ease-out forwards; max-height: 350px; overflow-y: auto; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .search-input { transition: all 0.2s ease; border: 1px solid ${theme.colors.border}; }
          .search-input:focus { border-color: ${theme.colors.accent}; box-shadow: 0 0 0 2px ${theme.colors.accent}20; }
          .schema-close-btn { transition: all 0.2s ease; }
          .schema-close-btn:hover { background-color: ${theme.colors.error}20; transform: rotate(90deg); }
          .schema-tabs, .table-list, .column-list { scrollbar-width: thin; scrollbar-color: ${theme.colors.accent}40 transparent; -webkit-overflow-scrolling: touch; scroll-behavior: smooth; }
          .schema-tabs::-webkit-scrollbar, .table-list::-webkit-scrollbar, .column-list::-webkit-scrollbar { width: 6px; height: 6px; }
          .schema-tabs::-webkit-scrollbar-track, .table-list::-webkit-scrollbar-track, .column-list::-webkit-scrollbar-track { background: transparent; }
          .schema-tabs::-webkit-scrollbar-thumb, .table-list::-webkit-scrollbar-thumb, .column-list::-webkit-scrollbar-thumb { background-color: ${theme.colors.accent}40; border-radius: 20px; }
          .filter-dropdown { position: absolute; right: 0; top: 100%; z-index: 20; background: ${theme.colors.surface}; border: 1px solid ${theme.colors.border}; border-radius: ${theme.borderRadius.default}; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 180px; animation: dropdownFadeIn 0.2s ease-out; }
          @keyframes dropdownFadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          .sort-button { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: ${theme.borderRadius.default}; font-size: ${theme.typography.size.sm}; transition: all 0.2s ease; }
          .sort-button:hover { background-color: ${theme.colors.accent}10; }
          .sort-button.active { background-color: ${theme.colors.accent}15; font-weight: 500; }
          .no-results { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; color: ${theme.colors.textSecondary}; }
          .skeleton-loader { background: linear-gradient(90deg, ${theme.colors.border}20, ${theme.colors.border}30, ${theme.colors.border}20); background-size: 200% 100%; animation: loadingGradient 1.5s ease-in-out infinite; border-radius: ${theme.borderRadius.default}; }
          @keyframes loadingGradient { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          .column-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
          .database-count-badge { font-size: 10px; padding: 2px 6px; border-radius: 12px; background-color: ${theme.colors.accent}20; color: ${theme.colors.accent}; font-weight: 500; }
          .content-container { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
          .content-row { display: flex; flex: 1; overflow: hidden; }
          .details-container { flex: 1; overflow-y: auto; overflow-x: hidden; }
          @media (max-width: 768px) {
            .schema-explorer { max-height: calc(100vh - 160px) !important; border-radius: 12px 12px 0 0; width: 100vw !important; margin-left: -16px; }
            .content-row { flex-direction: column; }
            .schema-tabs { flex-direction: row !important; max-width: 100% !important; border-right: none !important; border-bottom: 1px solid ${theme.colors.border}; overflow-x: auto; overflow-y: hidden !important; }
            .table-list { width: 100% !important; height: 40vh !important; }
            .details-container { height: 50vh !important; }
            .column-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
          }
        `}
      </style>

      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 sm:px-6 border-b flex items-center justify-between"
        style={{
          background: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <div className="flex items-center space-x-2">
          <Database size={20} style={{ color: theme.colors.accent }} />
          <h2
            className="text-lg font-semibold"
            style={{ color: theme.colors.text }}
          >
            Schema Explorer
          </h2>
          {selectedConnection && (
            <span
              className="text-sm ml-2 opacity-75"
              style={{ color: theme.colors.textSecondary }}
            >
              • {selectedConnection}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} style={{ color: theme.colors.textSecondary }} />
            </div>
            <input
              type="text"
              placeholder="Search tables, columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input pl-9"
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                paddingLeft: "32px",
                borderRadius: theme.borderRadius.default,
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                fontSize: theme.typography.size.sm,
                width: "220px",
              }}
            />
          </div>
          <button
            onClick={onClose}
            className="schema-close-btn p-2 rounded-full hover:bg-gray-100"
            style={{ color: theme.colors.text }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="px-4 py-2 sm:hidden">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} style={{ color: theme.colors.textSecondary }} />
          </div>
          <input
            type="text"
            placeholder="Search tables, columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input w-full pl-9"
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              paddingLeft: "32px",
              borderRadius: theme.borderRadius.default,
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              fontSize: theme.typography.size.sm,
            }}
          />
        </div>
      </div>

      {/* Content area */}
      <div className="content-container">
        <div className="content-row">
          {/* Schema tabs */}
          <div
            className="schema-tabs flex-none sm:flex-col border-b sm:border-b-0 sm:border-r"
            style={{
              borderColor: theme.colors.border,
              minWidth: "120px",
              maxWidth: "200px",
              height: "300px",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              overflowX: "hidden",
            }}
            ref={schemaTabsRef}
          >
            <div className="schema-tabs-container">
              {filteredSchemas.map((schema, index) => (
                <button
                  key={schema.name}
                  className={`schema-tab schema-item flex items-center justify-between p-3 min-w-[120px] sm:min-w-[160px] ${
                    activeSchema === schema.name ? "active bg-opacity-10" : ""
                  }`}
                  onClick={() => setActiveSchema(schema.name)}
                  style={{
                    backgroundColor:
                      activeSchema === schema.name
                        ? `${theme.colors.accent}10`
                        : "transparent",
                    color: theme.colors.text,
                    "--item-index": index,
                  }}
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <Database
                      size={16}
                      style={{ color: theme.colors.accent }}
                    />
                    <span className="truncate">{schema.name}</span>
                  </div>
                  <span className="database-count-badge ml-2 flex-shrink-0">
                    {schema.tables.length}
                  </span>
                </button>
              ))}
              {filteredSchemas.length === 0 && (
                <div
                  className="p-4 text-sm text-center"
                  style={{ color: theme.colors.textSecondary }}
                >
                  No schemas found
                </div>
              )}
            </div>
          </div>

          {/* Tables and details */}
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
            {/* Table list */}
            {activeSchema && (
              <div
                className="table-list h-full flex-none sm:w-1/3 border-b sm:border-b-0 sm:border-r"
                style={{ borderColor: theme.colors.border, overflow: "auto" }}
                ref={tableListRef}
              >
                <div
                  className="p-3 sticky top-0 z-10 border-b flex items-center justify-between"
                  style={{
                    background: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }}
                >
                  <h3
                    className="text-sm font-medium"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Tables
                    {activeSchemaData && (
                      <span className="ml-2 text-xs opacity-75">
                        ({activeSchemaData.tables.length})
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center space-x-2" ref={filterRef}>
                    <div className="relative">
                      <button
                        onClick={() => setShowFilterOptions(!showFilterOptions)}
                        className="p-1.5 rounded-md hover:bg-gray-100"
                        style={{ color: theme.colors.text }}
                      >
                        <Filter size={14} />
                      </button>
                      {showFilterOptions && (
                        <div className="filter-dropdown">
                          <div className="py-2">
                            <div
                              className="px-3 py-1 text-xs font-medium"
                              style={{ color: theme.colors.textSecondary }}
                            >
                              Sort by
                            </div>
                            <button
                              className={`sort-button w-full text-left ${
                                sortBy === "name" ? "active" : ""
                              }`}
                              onClick={() => handleSortByChange("name")}
                              style={{ color: theme.colors.text }}
                            >
                              <ArrowUpDown size={12} />
                              Name
                              {sortBy === "name" && (
                                <span className="ml-auto">
                                  {sortDirection === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </button>
                            <button
                              className={`sort-button w-full text-left ${
                                sortBy === "columns" ? "active" : ""
                              }`}
                              onClick={() => handleSortByChange("columns")}
                              style={{ color: theme.colors.text }}
                            >
                              <ArrowUpDown size={12} />
                              Column Count
                              {sortBy === "columns" && (
                                <span className="ml-auto">
                                  {sortDirection === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="p-1.5 rounded-md hover:bg-gray-100"
                      style={{ color: theme.colors.text }}
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-0.5 p-2">
                  {activeSchemaData &&
                    sortedTables(activeSchemaData).map((table, index) => (
                      <div
                        key={table.name}
                        className="table-item rounded-lg cursor-pointer"
                        onClick={() => handleTableClick(table.name)}
                        style={{
                          backgroundColor:
                            activeTable === table.name
                              ? `${theme.colors.accent}10`
                              : "transparent",
                          transition: "background-color 0.2s ease",
                          "--item-index": index,
                        }}
                      >
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <Table2
                              size={16}
                              style={{ color: theme.colors.accent }}
                            />
                            <span
                              style={{ color: theme.colors.text }}
                              className="truncate"
                            >
                              {table.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${theme.colors.accent}15`,
                                color: theme.colors.accent,
                              }}
                            >
                              {table.columns.length}
                            </span>
                            <ChevronRight
                              size={16}
                              style={{
                                color: theme.colors.textSecondary,
                                transform:
                                  activeTable === table.name
                                    ? "rotate(90deg)"
                                    : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  {activeSchemaData && activeSchemaData.tables.length === 0 && (
                    <div className="no-results">
                      <Search
                        size={24}
                        style={{
                          color: theme.colors.textSecondary,
                          opacity: 0.7,
                        }}
                      />
                      <p className="mt-2">No tables found</p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="mt-2 text-sm"
                          style={{ color: theme.colors.accent }}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Table details */}
            <div className="details-container flex-1">
              {activeTable ? (
                <div className="p-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="skeleton-loader h-6 w-32"></div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="skeleton-loader h-10"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeTableData && (
                        <div className="mb-4 flex justify-between items-center">
                          <h3
                            className="text-lg font-semibold"
                            style={{ color: theme.colors.text }}
                          >
                            {activeTableData.name}
                          </h3>
                          {activeTableData.sampleData && (
                            <div className="relative inline-flex rounded-full bg-gray-200 p-1">
                              {/* Sliding background */}
                              <div
                                className="absolute top-1 left-1 h-8 w-[130px] rounded-full transition-transform duration-300"
                                style={{
                                  backgroundColor: theme.colors.accent,
                                  transform:
                                    activeView === "columns"
                                      ? "translateX(0)"
                                      : "translateX(134px)",
                                }}
                              ></div>

                              {/* Columns Button */}
                              <button
                                onClick={() => setActiveView("columns")}
                                className={`relative z-10 w-[130px] py-1.5 text-center rounded-full text-sm font-medium transition-all duration-300 ${
                                  activeView === "columns"
                                    ? "text-white"
                                    : "text-gray-700"
                                }`}
                              >
                                Columns
                              </button>

                              {/* Sample Data Button */}
                              <button
                                onClick={() => setActiveView("sampleData")}
                                className={`relative z-10 w-[135px] py-1.5 text-center rounded-full text-sm font-medium transition-all duration-300 ${
                                  activeView === "sampleData"
                                    ? "text-white"
                                    : "text-gray-700"
                                }`}
                              >
                                Sample Data
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {activeView === "columns" ? (
                        <div>
                          <h3
                            className="text-sm font-medium mb-3 flex items-center space-x-2"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            <Columns size={16} />
                            <span>Columns</span>
                            {activeTableData && (
                              <span className="text-xs">
                                ({activeTableData.columns.length})
                              </span>
                            )}
                          </h3>
                          <div
                            className="column-list column-grid"
                            ref={columnListRef}
                          >
                            {activeTableData?.columns.map((column, index) => (
                              <div
                                key={column.name}
                                data-column={column.name}
                                onClick={() => {
                                  onColumnClick(column.name);
                                  scrollToColumnIfNeeded(column.name);
                                }}
                                className="column-item p-2 rounded cursor-pointer"
                                style={{
                                  backgroundColor: theme.colors.background,
                                  border: `1px solid ${theme.colors.border}`,
                                  "--item-index": index,
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <Code
                                    size={14}
                                    style={{ color: theme.colors.accent }}
                                  />
                                  <div className="flex flex-col">
                                    <span
                                      className="text-sm font-medium"
                                      style={{ color: theme.colors.text }}
                                    >
                                      {column.name}
                                    </span>
                                    <span
                                      className="text-xs"
                                      style={{
                                        color: theme.colors.textSecondary,
                                      }}
                                    >
                                      {column.type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        activeTableData?.sampleData && (
                          <div className="sample-data-container">
                            <h3
                              className="text-sm font-medium mb-3 sticky top-0 z-10"
                              style={{
                                color: theme.colors.textSecondary,
                                backgroundColor: theme.colors.surface,
                              }}
                            >
                              Sample Data
                            </h3>
                            <div
                              className="overflow-x-auto"
                              style={{
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: theme.borderRadius.default,
                              }}
                            >
                              <table
                                className="w-full"
                                style={{ borderCollapse: "collapse" }}
                              >
                                <thead>
                                  <tr>
                                    {activeTableData.columns.map((col) => (
                                      <th
                                        key={col.name}
                                        className="text-left text-sm p-2"
                                        style={{
                                          backgroundColor:
                                            theme.colors.background,
                                          color: theme.colors.text,
                                          borderBottom: `1px solid ${theme.colors.border}`,
                                          position: "sticky",
                                          top: 0,
                                          zIndex: 10,
                                        }}
                                      >
                                        {col.name}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {activeTableData.sampleData?.map(
                                    (row, idx) => (
                                      <tr key={idx} className="table-row">
                                        {activeTableData.columns.map((col) => (
                                          <td
                                            key={col.name}
                                            className="text-sm p-2"
                                            style={{
                                              color: theme.colors.textSecondary,
                                              borderBottom: `1px solid ${theme.colors.border}`,
                                            }}
                                          >
                                            {row[col.name] != null
                                              ? String(row[col.name])
                                              : "NULL"}
                                          </td>
                                        ))}
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <Table2
                      size={32}
                      style={{
                        color: theme.colors.textSecondary,
                        opacity: 0.5,
                        margin: "0 auto",
                        marginBottom: "12px",
                      }}
                    />
                    <p style={{ color: theme.colors.textSecondary }}>
                      Select a table to view details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaExplorer;
