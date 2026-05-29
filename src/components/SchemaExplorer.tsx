import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  Table2,
  ChevronRight,
  X,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Hash,
  Calendar,
  Check,
  List,
  Package,
  Clock,
  AlignJustify,
  Type,
  LineChart,
  Globe,
  Users,
  Mail,
  Key,
  Copy,
} from "lucide-react";
import { DatabaseSchema, Theme } from "../types";
import { useTheme } from "../ThemeContext";

interface SchemaExplorerProps {
  schemas: DatabaseSchema[] | null;
  onClose: () => void;
  onColumnClick: (columnName: string) => void;
  selectedConnection?: string;
  maxHeight?: string;
  theme?: Theme;
}

const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  schemas,
  onClose,
  onColumnClick,
  selectedConnection,
  maxHeight = "calc(90vh - 180px)",
  theme: propTheme,
}) => {
  const { theme } = useTheme();
  const [activeSchema, setActiveSchema] = useState<string | null>(
    schemas && schemas.length > 0 ? schemas[0].name : null
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
  const [isMobileView, setIsMobileView] = useState<boolean>(
    window.innerWidth < 768
  );
  const [mobileNavView, setMobileNavView] = useState<"tables" | "details">("tables");

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const tableListRef = useRef<HTMLDivElement>(null);
  const columnListRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setActiveTable(null);
    if (isMobileView) {
      setMobileNavView("tables");
    }
  }, [activeSchema, isMobileView]);

  useEffect(() => {
    if (activeTable) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 300);

      if (isMobileView) {
        setMobileNavView("details");
      }
    }
  }, [activeTable, isMobileView]);

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

  const handleMobileNavigation = (view: "tables" | "details") => {
    setMobileNavView(view);
  };

  const handleColumnClick = (columnName: string) => {
    onColumnClick(columnName);
    if (columnListRef.current) {
      const columnElement = columnListRef.current.querySelector(
        `[data-column="${columnName}"]`
      );
      columnElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(`${type}:${text}`);
      setTimeout(() => setCopiedText(null), 1500);
    });
  };

  const highlightText = (text: string, search: string) => {
    if (!search || !search.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-amber-500/25 dark:bg-amber-400/25 text-inherit rounded px-0.5 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  if (!schemas || schemas.length === 0) {
    return (
      <div
        className="p-0 text-center"
        style={{ color: theme.colors.text }}
      />
    );
  }

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

  const getTypeIcon = (type: string) => {
    if (!type || typeof type !== "string") return <Database size={13} />;

    switch (type.trim().toLowerCase()) {
      case "integer":
      case "int":
      case "bigint":
      case "smallint":
      case "number":
      case "numeric":
      case "float":
        return <Hash size={13} />;
      case "string":
      case "text":
      case "varchar":
      case "char":
        return <Type size={13} />;
      case "timestamp":
      case "datetime":
        return <Clock size={13} />;
      case "boolean":
      case "bool":
        return <Check size={13} />;
      case "json":
      case "jsonb":
        return <Package size={13} />;
      case "array":
        return <List size={13} />;
      case "geography":
      case "geometry":
        return <Globe size={13} />;
      case "date":
        return <Calendar size={13} />;
      default:
        return <Database size={13} />;
    }
  };

  const getColumnIcon = (name: string) => {
    const cleanName = name.toLowerCase();
    if (cleanName.includes("user") || cleanName.includes("name") || cleanName.includes("username"))
      return <Users size={14} />;
    if (cleanName.includes("email") || cleanName.includes("mail")) return <Mail size={14} />;
    if (cleanName.includes("id") || cleanName.includes("pk") || cleanName.includes("key")) return <Key size={14} />;
    if (cleanName.includes("count") || cleanName.includes("amount") || cleanName.includes("price") || cleanName.includes("total")) return <LineChart size={14} />;
    return <AlignJustify size={14} />;
  };

  const getTypeBadgeStyle = (type: string) => {
    const colors = theme.colors;
    const cleanType = type ? type.trim().toLowerCase() : "";

    if (cleanType.includes("int") || cleanType === "number" || cleanType === "float" || cleanType === "numeric") {
      return { 
        backgroundColor: `${colors.warning}12`, 
        color: theme.mode === "light" ? "#B45309" : "#F59E0B" // Amber-700 / Amber-500
      };
    }
    if (cleanType.includes("char") || cleanType === "string" || cleanType === "text") {
      return { 
        backgroundColor: `${colors.success}12`, 
        color: theme.mode === "light" ? "#047857" : "#34D399" // Emerald-700 / Emerald-400
      };
    }
    if (cleanType.includes("time") || cleanType.includes("date")) {
      return { 
        backgroundColor: `${colors.accent}12`, 
        color: colors.accent 
      };
    }
    if (cleanType === "boolean" || cleanType === "bool") {
      return { 
        backgroundColor: theme.mode === "light" ? "rgba(3, 105, 161, 0.08)" : "rgba(56, 189, 248, 0.12)", 
        color: theme.mode === "light" ? "#0369A1" : "#38BDF8" // Sky-700 / Sky-400
      };
    }
    if (cleanType.includes("json")) {
      return { 
        backgroundColor: `${colors.error}12`, 
        color: theme.mode === "light" ? "#B91C1C" : "#F87171" // Red-700 / Red-400
      };
    }
    return { 
      backgroundColor: theme.mode === "light" ? "rgba(100, 116, 139, 0.08)" : "rgba(148, 163, 184, 0.08)", 
      color: theme.colors.textSecondary 
    };
  };

  // Rendering the mobile breadcrumb navigation
  const renderMobileBreadcrumb = () => {
    return (
      <div className="flex items-center text-xs space-x-1.5 mb-2 md:hidden overflow-x-auto py-2.5 px-4 border-b" style={{ borderColor: theme.colors.border }}>
        <button
          onClick={() => handleMobileNavigation("tables")}
          className="flex items-center px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: theme.colors.accent }}
        >
          <Database size={13} />
          <span className="ml-1.5 font-medium">Explorer</span>
        </button>

        {activeSchema && (
          <>
            <ChevronRight
              size={12}
              style={{ color: theme.colors.textSecondary }}
            />
            <span className="text-slate-400 font-medium">{activeSchema}</span>
          </>
        )}

        {activeTable && (
          <>
            <ChevronRight
              size={12}
              style={{ color: theme.colors.textSecondary }}
            />
            <button
              onClick={() => handleMobileNavigation("details")}
              className="flex items-center px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors truncate max-w-[120px]"
              style={{
                color:
                  mobileNavView === "details"
                    ? theme.colors.accent
                    : theme.colors.textSecondary,
                fontWeight: mobileNavView === "details" ? 600 : 400,
              }}
            >
              {activeTable}
            </button>
          </>
        )}
      </div>
    );
  };

  const sqlSnippetText = activeSchema && activeTable 
    ? `SELECT * FROM ${activeSchema}.${activeTable} LIMIT 10;`
    : "";
  const isSqlCopied = copiedText === `sql:${sqlSnippetText}`;

  return (
    <div
      className="schema-explorer w-full max-w-full flex flex-col rounded-2xl border transition-all duration-300"
      style={{
        backgroundColor: theme.mode === "light" ? theme.colors.surface : theme.colors.surfaceGlass,
        borderColor: theme.colors.border,
        backdropFilter: theme.mode === "light" ? "none" : "blur(20px)",
        WebkitBackdropFilter: theme.mode === "light" ? "none" : "blur(20px)",
        boxShadow: theme.mode === "light" 
          ? "0 20px 40px -15px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.01)"
          : "0 20px 40px -15px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.01)",
        maxHeight: isMobileView ? "calc(100vh - 80px)" : maxHeight,
        height: isMobileView ? "calc(100vh - 80px)" : maxHeight,
        overflow: "hidden",
      }}
    >
      <style>
        {`
          .schema-explorer { 
            animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          @keyframes slideIn { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          
          /* Custom scrollbars */
          .explorer-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
          .explorer-scroll::-webkit-scrollbar-track { background: transparent; }
          .explorer-scroll::-webkit-scrollbar-thumb { background: ${theme.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}; border-radius: 99px; }
          .explorer-scroll::-webkit-scrollbar-thumb:hover { background: ${theme.mode === "light" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"}; }
          
          /* List items animation indices */
          .table-item { opacity: 0; transform: translateY(8px); animation: fadeInItem 0.25s forwards; animation-delay: calc(var(--item-index) * 0.03s); }
          .column-item { opacity: 0; transform: translateY(8px); animation: fadeInItem 0.25s forwards; animation-delay: calc(var(--item-index) * 0.02s); }
          @keyframes fadeInItem { to { opacity: 1; transform: translateY(0); } }
          
          /* Interaction transitions */
          .table-item { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border-left: 3px solid transparent; }
          .table-item:hover { background-color: ${theme.colors.hover}; transform: translateX(2px); }
          .table-item.active { border-left-color: ${theme.colors.accent}; border-top-left-radius: 0; border-bottom-left-radius: 0; }
          
          .column-item { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid ${theme.colors.border}; }
          .column-item:hover { 
            transform: translateY(-2px); 
            box-shadow: ${theme.mode === "light" ? "0 4px 12px rgba(0,0,0,0.03)" : "0 4px 12px rgba(0,0,0,0.2)"}; 
            border-color: ${theme.colors.accent}30;
            background-color: ${theme.mode === "light" ? "#FFFFFF" : `${theme.colors.surface}cf`};
          }
          
          .search-input { transition: all 0.2s ease; border: 1px solid ${theme.colors.border}; }
          .search-input:focus { border-color: ${theme.colors.accent}; box-shadow: 0 0 0 2px ${theme.colors.accent}12; }
          
          .filter-dropdown { 
            position: absolute; 
            right: 0; 
            top: 100%; 
            z-index: 20; 
            border: 1px solid ${theme.colors.border}; 
            border-radius: ${theme.borderRadius.default}; 
            width: 170px; 
            animation: dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); 
          }
          @keyframes dropdownFadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
          
          .sort-button { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 6px; font-size: 12px; transition: all 0.15s ease; cursor: pointer; }
          .sort-button:hover { background-color: ${theme.colors.hover}; }
          .sort-button.active { background-color: ${theme.colors.accent}0d; color: ${theme.colors.accent}; font-weight: 600; }
          
          .column-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; padding: 2px; }
          .database-count-badge { font-size: 10px; padding: 2px 6px; border-radius: 12px; background-color: ${theme.colors.accent}12; color: ${theme.colors.accent}; font-weight: 600; }
          
          .content-container { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
          .content-row { display: flex; flex: 1; overflow: hidden; }
          .details-container { flex: 1; overflow-y: auto; overflow-x: hidden; }
          
          .tab-button {
            flex: 1;
            text-align: center;
            padding: 5px 8px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
          }
          
          @media (max-width: 768px) {
            .schema-explorer { 
              max-height: calc(100vh - 80px) !important; 
              border-radius: 16px; 
              width: 100% !important; 
            }
            .column-grid {
              grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
              gap: 8px;
            }
          }
        `}
      </style>

      {/* Header */}
      <div
        className={`sticky top-0 z-10 px-4 py-3.5 sm:px-6 border-b flex items-center justify-between ${theme.mode === "light" ? "" : "backdrop-blur-md"}`}
        style={{
          backgroundColor: theme.mode === "light" ? theme.colors.surface : `${theme.colors.surface}c0`,
          borderColor: theme.colors.border,
        }}
      >
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
            <Database
              size={18}
              style={{ color: theme.colors.accent }}
              aria-hidden="true"
            />
          </div>
          <div>
            <h2
              className="text-base font-bold tracking-tight"
              style={{ color: theme.colors.text }}
            >
              Schema Explorer
            </h2>
          </div>
          {selectedConnection && !isMobileView && (
            <span
              className="text-xs px-2 py-0.5 rounded border font-medium ml-2 opacity-80"
              style={{ 
                color: theme.colors.textSecondary,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }}
            >
              {selectedConnection}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors border"
            style={{ color: theme.colors.textSecondary, borderColor: theme.colors.border }}
            aria-label="Close schema explorer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Breadcrumb Navigation */}
      {isMobileView && renderMobileBreadcrumb()}

      {/* Mobile Navigation Tabs */}
      {isMobileView && (
        <div className="px-4 py-2 md:hidden">
          <div className="flex p-0.5 rounded-full" style={{ backgroundColor: theme.colors.background }}>
            <button
              className={`tab-button ${
                mobileNavView === "tables" ? "active" : ""
              }`}
              style={{
                backgroundColor: mobileNavView === "tables" ? theme.colors.accent : "transparent",
                color: mobileNavView === "tables" ? "white" : theme.colors.textSecondary
              }}
              onClick={() => handleMobileNavigation("tables")}
            >
              Tables
            </button>
            <button
              className={`tab-button ${
                mobileNavView === "details" ? "active" : ""
              }`}
              style={{
                backgroundColor: mobileNavView === "details" ? theme.colors.accent : "transparent",
                color: mobileNavView === "details" ? "white" : theme.colors.textSecondary
              }}
              onClick={() => handleMobileNavigation("details")}
              disabled={!activeTable}
            >
              Details
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="content-container">
        <div className="content-row">
          {/* Left Sidebar (Pane 1) */}
          {(!isMobileView || (isMobileView && mobileNavView === "tables")) && (
            <div
              className="flex-none border-r flex flex-col"
              style={{
                borderColor: theme.colors.border,
                width: isMobileView ? "100%" : "240px",
                height: "100%",
                backgroundColor: `${theme.colors.background}25`
              }}
            >
              {/* Schema Selection Dropdown */}
              <div className="p-3 border-b" style={{ borderColor: theme.colors.border }}>
                <label className="text-[10px] font-bold tracking-wider uppercase opacity-65" style={{ color: theme.colors.textSecondary }}>Schema</label>
                <div className="relative mt-1">
                  <select
                    value={activeSchema || ""}
                    onChange={(e) => setActiveSchema(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 rounded-lg border text-xs font-semibold appearance-none bg-transparent cursor-pointer focus:outline-none focus:ring-1"
                    style={{
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(theme.colors.textSecondary)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                    }}
                  >
                    {schemas.map((schema) => (
                      <option key={schema.name} value={schema.name} style={{ background: theme.colors.surface }}>
                        {schema.name}
                      </option>
                    ))}
                  </select>
                  <Database size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Table search filter */}
              <div className="p-3 border-b" style={{ borderColor: theme.colors.border }}>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter tables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input w-full pl-8 pr-7 py-1.5 rounded-lg text-xs focus:outline-none"
                    style={{
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    }}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-650"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Sort tables row */}
              {activeSchemaData && (
                <div className="px-3 py-2 flex items-center justify-between opacity-80 border-b" style={{ backgroundColor: `${theme.colors.background}15`, borderColor: theme.colors.border }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Tables ({activeSchemaData.tables.length})</span>
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilterOptions(!showFilterOptions)}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors border"
                      style={{ color: theme.colors.textSecondary, borderColor: theme.colors.border }}
                      title="Sort Tables"
                    >
                      <Filter size={11} />
                    </button>
                    {showFilterOptions && (
                      <div 
                        className="filter-dropdown py-1 shadow-lg border backdrop-blur-md"
                        style={{ 
                          backgroundColor: theme.colors.surfaceGlass,
                          borderColor: theme.colors.border 
                        }}
                      >
                        <div
                          className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider border-b opacity-65"
                          style={{ color: theme.colors.textSecondary, borderColor: theme.colors.border }}
                        >
                          Sort by
                        </div>
                        <div className="p-1 flex flex-col gap-0.5">
                          <button
                            className={`sort-button w-full text-left ${
                              sortBy === "name" ? "active" : ""
                            }`}
                            onClick={() => handleSortByChange("name")}
                          >
                            <ArrowUpDown size={10} />
                            <span>Name</span>
                            {sortBy === "name" && (
                              <span className="ml-auto text-[9px]">
                                {sortDirection === "asc" ? "ASC" : "DESC"}
                              </span>
                            )}
                          </button>
                          <button
                            className={`sort-button w-full text-left ${
                              sortBy === "columns" ? "active" : ""
                            }`}
                            onClick={() => handleSortByChange("columns")}
                          >
                            <ArrowUpDown size={10} />
                            <span>Columns count</span>
                            {sortBy === "columns" && (
                              <span className="ml-auto text-[9px]">
                                {sortDirection === "asc" ? "ASC" : "DESC"}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scrollable table list */}
              <div 
                className="flex-1 overflow-y-auto explorer-scroll p-2 flex flex-col gap-0.5"
                ref={tableListRef}
              >
                {activeSchemaData && sortedTables(activeSchemaData).map((table, index) => (
                  <button
                    key={table.name}
                    className={`table-item rounded-lg cursor-pointer w-full text-left ${
                      activeTable === table.name ? "active" : ""
                    }`}
                    onClick={() => handleTableClick(table.name)}
                    style={{
                      backgroundColor: activeTable === table.name ? `${theme.colors.accent}10` : "transparent",
                      color: activeTable === table.name ? theme.colors.accent : theme.colors.text,
                      "--item-index": index,
                    }}
                    aria-label={`Select table ${table.name}`}
                  >
                    <div className="flex items-center justify-between p-2.5">
                      <div className="flex items-center space-x-2 overflow-hidden mr-2">
                        <Table2
                          size={14}
                          style={{ color: activeTable === table.name ? theme.colors.accent : "slate-400" }}
                          aria-hidden="true"
                        />
                        <span className="truncate text-[13px] font-medium">
                          {highlightText(table.name, searchTerm)}
                        </span>
                      </div>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
                        style={{
                          backgroundColor: activeTable === table.name ? `${theme.colors.accent}18` : `${theme.colors.text}08`,
                          color: activeTable === table.name ? theme.colors.accent : theme.colors.textSecondary,
                        }}
                      >
                        {table.columns.length}
                      </span>
                    </div>
                  </button>
                ))}
                {(!activeSchemaData || activeSchemaData.tables.length === 0) && (
                  <div className="no-results mt-10 text-center flex flex-col items-center p-4">
                    <Search size={18} className="opacity-40 mb-2" />
                    <p className="text-xs text-slate-400">No tables found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Pane (Pane 2 / Details View) */}
          {(!isMobileView || (isMobileView && mobileNavView === "details")) && (
            <div
              className="details-container flex-grow explorer-scroll"
              style={{
                height: "100%",
              }}
            >
              {activeTable && activeTableData ? (
                <div className="p-4 sm:p-5 flex flex-col gap-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="skeleton-loader h-6 w-32"></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="skeleton-loader h-12"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Breadcrumbs & Title details */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b pb-4 gap-3" style={{ borderColor: theme.colors.border }}>
                        <div className="flex flex-col min-w-0">
                          <span 
                            className="text-[9px] font-bold tracking-wider uppercase opacity-60"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Selected Table • {activeSchema}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <h3
                              className="text-lg font-bold truncate"
                              style={{ color: theme.colors.text }}
                            >
                              {activeTableData.name}
                            </h3>
                            <button
                              onClick={() => handleCopyText(activeTableData.name, "table")}
                              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0"
                              title="Copy table name"
                            >
                              {copiedText === `table:${activeTableData.name}` ? (
                                <Check size={13} className="text-emerald-500" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Tab Switcher */}
                        {activeTableData.sampleData && (
                          <div
                            className="relative inline-flex rounded-full p-0.5 max-w-[220px] w-full self-start sm:self-center border"
                            style={{
                              backgroundColor: theme.colors.background,
                              borderColor: theme.colors.border,
                            }}
                          >
                            {/* Sliding Background */}
                            <div
                              className={`
                                absolute top-0.5 bottom-0.5 rounded-full
                                transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                                ${
                                  activeView === "columns"
                                    ? "translate-x-0"
                                    : "translate-x-[98%]"
                                }
                              `}
                              style={{
                                width: "50%",
                                backgroundColor: theme.colors.accent,
                              }}
                            />

                            {/* Columns Button */}
                            <button
                              onClick={() => setActiveView("columns")}
                              className={`
                                relative z-10 flex-1 py-1 px-3 text-center rounded-full text-xs font-semibold
                                transition-all duration-300 whitespace-nowrap cursor-pointer
                                ${
                                  activeView === "columns"
                                    ? "text-white"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                }
                              `}
                              aria-label="View columns"
                            >
                              Columns
                            </button>

                            {/* Sample Data Button */}
                            <button
                              onClick={() => setActiveView("sampleData")}
                              className={`
                                relative z-10 flex-1 py-1 px-3 text-center rounded-full text-xs font-semibold
                                transition-all duration-300 whitespace-nowrap cursor-pointer
                                ${
                                  activeView === "sampleData"
                                    ? "text-white"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                }
                              `}
                              aria-label="View sample data"
                            >
                              Sample Data
                            </button>
                          </div>
                        )}
                      </div>                      {/* SQL Code Block */}
                      {sqlSnippetText && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: theme.colors.textSecondary }}>
                            Query Preview
                          </span>
                          <div 
                            className="flex items-center justify-between p-3 rounded-xl border text-xs font-mono group"
                            style={{
                              backgroundColor: theme.mode === "light" ? "#0F172A" : theme.colors.background,
                              borderColor: theme.colors.border,
                            }}
                          >
                            <div className="flex items-center min-w-0 overflow-hidden mr-2">
                              <span className="text-indigo-400 font-semibold mr-1.5">SELECT</span>
                              <span className="text-slate-300 mr-1.5">*</span>
                              <span className="text-indigo-400 font-semibold mr-1.5">FROM</span>
                              <span className="text-emerald-400 mr-1.5">{activeSchema}.{activeTable}</span>
                              <span className="text-indigo-400 font-semibold mr-1.5">LIMIT</span>
                              <span className="text-amber-400">10;</span>
                            </div>
                            <button
                              onClick={() => handleCopyText(sqlSnippetText, "sql")}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                              title="Copy SQL Query"
                            >
                              {isSqlCopied ? (
                                <Check size={13} className="text-emerald-400" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* View 1: Columns list grid */}
                      {activeView === "columns" && (
                        <div className="column-grid">
                          {activeTableData.columns.map((column, index) => {
                            const badgeStyle = getTypeBadgeStyle(column.type);
                            const leftBorderColor = badgeStyle.color || theme.colors.border;
                            
                            return (
                              <div
                                key={column.name}
                                className="column-item rounded-lg p-2.5 text-left w-full flex items-center justify-between shadow-xs group"
                                style={{
                                  "--item-index": index,
                                  backgroundColor: `${theme.colors.surface}40`,
                                  borderColor: theme.colors.border,
                                  borderLeft: `3px solid ${leftBorderColor}`,
                                }}
                                data-column={column.name}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0 flex-grow">
                                  <div
                                    className="flex-shrink-0 p-1.5 rounded-md text-slate-500 dark:text-slate-400 border"
                                    style={{
                                      backgroundColor: theme.colors.background,
                                      borderColor: theme.colors.border,
                                    }}
                                  >
                                    {getColumnIcon(column.name)}
                                  </div>
                                  <span
                                    className="font-semibold text-xs truncate"
                                    style={{ color: theme.colors.text }}
                                  >
                                    {highlightText(column.name, searchTerm)}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  <div
                                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold border"
                                    style={{
                                      ...badgeStyle,
                                      borderColor: "transparent"
                                    }}
                                  >
                                    {getTypeIcon(column.type)}
                                    <span className="truncate max-w-[100px] uppercase tracking-wider">
                                      {column.type}
                                    </span>
                                  </div>
                                  
                                  {/* Hover Copy Button */}
                                  <button
                                    onClick={() => handleCopyText(column.name, "column")}
                                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
                                    title="Copy column name"
                                  >
                                    {copiedText === `column:${column.name}` ? (
                                      <Check size={12} className="text-emerald-500" />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* View 2: Sample records spreadsheet */}
                      {activeView === "sampleData" &&
                        activeTableData.sampleData && (
                          <div 
                            className="sample-data-container border rounded-xl overflow-hidden shadow-xs" 
                            style={{ 
                              borderColor: theme.colors.border,
                              backgroundColor: theme.colors.background,
                            }}
                          >
                            <div className="table-data-scroll">
                              <div className="overflow-x-auto explorer-scroll"
                                style={{
                                  maxHeight: isMobileView
                                    ? "calc(100vh - 380px)"
                                    : "420px",
                                }}
                              >
                                <table
                                  className="w-full"
                                  style={{ borderCollapse: "collapse", minWidth: "max-content" }}
                                >
                                  <thead>
                                    <tr>
                                      <th 
                                        className="p-3 border-b border-r text-[10px] font-bold text-slate-400 text-center sticky top-0"
                                        style={{ 
                                          backgroundColor: theme.colors.background,
                                          borderColor: theme.colors.border,
                                          width: "40px",
                                          zIndex: 6
                                        }}
                                      >
                                        #
                                      </th>
                                      {activeTableData.columns.map(
                                        (column) => (
                                          <th
                                            key={column.name}
                                            className="text-left p-3 sticky top-0 backdrop-blur-md border-b border-r"
                                            style={{
                                              backgroundColor: theme.colors.background,
                                              borderColor: theme.colors.border,
                                              minWidth: "80px",
                                              zIndex: 5
                                            }}
                                            scope="col"
                                          >
                                            <div className="flex flex-col">
                                              <span 
                                                className="font-bold text-[11px] tracking-wide"
                                                style={{ color: theme.colors.text }}
                                              >
                                                {column.name}
                                              </span>
                                              <span 
                                                className="text-[9px] font-semibold tracking-wider uppercase mt-0.5 opacity-50"
                                                style={{ color: theme.colors.textSecondary }}
                                              >
                                                {column.type}
                                              </span>
                                            </div>
                                          </th>
                                        )
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeTableData.sampleData?.map(
                                      (row, idx) => (
                                        <tr
                                          key={idx}
                                          className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                          style={{
                                            backgroundColor:
                                              idx % 2 === 0
                                                ? "transparent"
                                                : `${theme.colors.background}15`,
                                            borderBottom: `1px solid ${theme.colors.border}`,
                                          }}
                                        >
                                          <td 
                                            className="p-3 text-center text-[11px] font-mono opacity-40 select-none border-r border-b"
                                            style={{ borderColor: theme.colors.border }}
                                          >
                                            {idx + 1}
                                          </td>
                                          {activeTableData.columns.map(
                                            (column) => (
                                              <td
                                                key={column.name}
                                                className="p-3 border-r border-b"
                                                style={{
                                                  color: theme.colors.text,
                                                  fontWeight: "normal",
                                                  fontSize: "12px",
                                                  whiteSpace: "nowrap",
                                                  minWidth: "80px",
                                                  maxWidth: "200px",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  borderColor: theme.colors.border,
                                                }}
                                              >
                                                {row[column.name] != null ? (
                                                  <span className="font-mono text-xs" style={{ color: theme.colors.text }}>
                                                    {String(row[column.name])}
                                                  </span>
                                                ) : (
                                                  <span className="italic opacity-35 font-normal text-xs">
                                                    null
                                                  </span>
                                                )}
                                              </td>
                                            )
                                          )}
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center max-w-xs flex flex-col items-center">
                    <div className="p-3 rounded-full bg-slate-500/10 text-slate-500 mb-3 border">
                      <Table2
                        size={24}
                        style={{
                          color: theme.colors.textSecondary,
                          opacity: 0.7,
                        }}
                        aria-hidden="true"
                      />
                    </div>
                    <h4 className="text-sm font-bold mb-1" style={{ color: theme.colors.text }}>Select a Table</h4>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                      {isMobileView
                        ? "Select a schema and table to view its structure and sample records"
                        : "Select any table from the sidebar to inspect its columns and records"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaExplorer;
