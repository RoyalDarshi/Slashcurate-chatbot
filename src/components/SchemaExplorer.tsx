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
} from "lucide-react";
import { DatabaseSchema, Theme } from "../types";
import { useTheme } from "../ThemeContext";
import { backgroundClip } from "html2canvas/dist/types/css/property-descriptors/background-clip";

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
  const [mobileNavView, setMobileNavView] = useState<
    "schemas" | "tables" | "details"
  >("schemas");

  const tableListRef = useRef<HTMLDivElement>(null);
  const columnListRef = useRef<HTMLDivElement>(null);
  const schemaTabsRef = useRef<HTMLDivElement>(null);
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

  const handleMobileNavigation = (view: "schemas" | "tables" | "details") => {
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

  if (!schemas || schemas.length === 0) {
    return (
      <div
        className="p-0 text-center"
        style={{ color: theme.colors.text }}
      ></div>
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
    if (!type || typeof type !== "string") return <Database size={16} />;

    switch (type.trim().toLowerCase()) {
      case "integer":
      case "int":
        return <Hash size={16} />;
      case "string":
      case "text":
      case "varchar":
        return <Type size={16} />;
      case "timestamp":
      case "datetime":
        return <Clock size={16} />;
      case "boolean":
      case "bool":
        return <Check size={16} />;
      case "json":
        return <Package size={16} />;
      case "array":
        return <List size={16} />;
      case "geography":
      case "geometry":
        return <Globe size={16} />;
      case "date":
        return <Calendar size={16} />;
      default:
        return <Database size={16} />;
    }
  };

  const getColumnIcon = (name: string) => {
    if (name.includes("user") || name.includes("name"))
      return <Users size={16} />;
    if (name.includes("email")) return <Mail size={16} />;
    if (name.includes("id")) return <Key size={16} />;
    if (name.includes("count")) return <LineChart size={16} />;
    return <AlignJustify size={16} />;
  };

  const getTypeColor = (type: string) => {
    const colors = theme.colors;

    switch (type.toLowerCase()) {
      case "integer":
        return { background: colors.warning, color: "white" };
      case "string":
        return { background: colors.success, color: "white" };
      case "timestamp":
        return { background: colors.accent, color: "white" };
      case "boolean":
        return { background: colors.bubbleUser, color: colors.bubbleUserText };
      case "json":
        return { background: colors.error, color: "white" };
      case "array":
        return { background: colors.bubbleBot, color: colors.bubbleBotText };
      case "geography":
        return { background: colors.success, color: colors.textSecondary };
      case "date":
        return { background: colors.accentHover, color: "white" };
      default:
        return { background: colors.disabled, color: colors.disabledText };
    }
  };

  // Rendering the mobile breadcrumb navigation
  const renderMobileBreadcrumb = () => {
    return (
      <div className="flex items-center text-sm space-x-1.5 mb-2 md:hidden overflow-x-auto py-1.5">
        <button
          onClick={() => handleMobileNavigation("schemas")}
          className="flex items-center px-2 py-1 rounded hover:bg-gray-100"
          style={{ color: theme.colors.accent }}
        >
          <Database size={14} />
          <span className="ml-1.5">Schemas</span>
        </button>

        {activeSchema && (
          <>
            <ChevronRight
              size={14}
              style={{ color: theme.colors.textSecondary }}
            />
            <button
              onClick={() => handleMobileNavigation("tables")}
              className="flex items-center px-2 py-1 rounded hover:bg-gray-100"
              style={{
                color:
                  mobileNavView === "tables"
                    ? theme.colors.accent
                    : theme.colors.text,
                fontWeight: mobileNavView === "tables" ? 500 : 400,
              }}
            >
              {activeSchema}
            </button>
          </>
        )}

        {activeTable && (
          <>
            <ChevronRight
              size={14}
              style={{ color: theme.colors.textSecondary }}
            />
            <button
              onClick={() => handleMobileNavigation("details")}
              className="flex items-center px-2 py-1 rounded hover:bg-gray-100"
              style={{
                color:
                  mobileNavView === "details"
                    ? theme.colors.accent
                    : theme.colors.text,
                fontWeight: mobileNavView === "details" ? 500 : 400,
              }}
            >
              {activeTable}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className="schema-explorer w-full max-w-full rounded-lg flex flex-col"
      style={{
        background: theme.colors.surface,
        // boxShadow: `0 8px 32px ${theme.colors.text}15`,
        maxHeight: isMobileView ? "calc(100vh - 80px)" : maxHeight,
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
          .schema-close-btn:hover { background-color: ${theme.colors.error}20; }
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
          .mobile-nav-button {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s;
          }
          .mobile-nav-button.active {
            background-color: ${theme.colors.accent};
            color: white;
          }
          .mobile-nav-button:not(.active) {
            background-color: ${theme.colors.accent}10;
            color: ${theme.colors.accent};
          }
          .responsive-tab-switcher {
            display: flex;
            border-radius: 9999px;
            background-color: ${theme.colors.background};
            padding: 0.25rem;
            margin-bottom: 1rem;
          }
          .tab-button {
            flex: 1;
            text-align: center;
            padding: 0.5rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s;
          }
          .tab-button.active {
            background-color: ${theme.colors.accent};
            color: white;
          }
          .tab-button:not(.active) {
            color: ${theme.colors.text};
          }
          
          @media (max-width: 768px) {
            .schema-explorer { 
              max-height: calc(100vh - 80px) !important; 
              border-radius: 12px; 
              width: 100% !important; 
            }
            .schema-tabs-horizontal {
              display: flex;
              overflow-x: auto;
              overflow-y: hidden;
              white-space: nowrap;
              padding: 0.5rem;
              border-bottom: 1px solid ${theme.colors.border};
              gap: 0.5rem;
              scroll-snap-type: x mandatory;
            }
            .schema-tab-horizontal {
              display: inline-flex;
              padding: 0.5rem 0.75rem;
              border-radius: 9999px;
              scroll-snap-align: start;
              flex-shrink: 0;
            }
            .search-input { padding: 8px 12px; font-size: 14px; }
            .column-item-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
              gap: 0.5rem;
              margin-top: 1rem;
            }
            .table-data-scroll {
              max-width: 100%;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }
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
          <Database
            size={20}
            style={{ color: theme.colors.accent }}
            aria-hidden="true"
          />
          <h2
            className="text-lg font-semibold"
            style={{ color: theme.colors.text }}
          >
            Schema Explorer
          </h2>
          {selectedConnection && !isMobileView && (
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
              <Search
                size={14}
                style={{ color: theme.colors.textSecondary }}
                aria-hidden="true"
              />
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
              aria-label="Search tables and columns"
            />
          </div>
          <button
            onClick={onClose}
            className="schema-close-btn p-2 rounded-full hover:bg-gray-100"
            style={{ color: theme.colors.text }}
            aria-label="Close schema explorer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="px-4 py-2 sm:hidden">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              size={14}
              style={{ color: theme.colors.textSecondary }}
              aria-hidden="true"
            />
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
            aria-label="Search tables and columns"
          />
        </div>
      </div>

      {/* Mobile Breadcrumb Navigation */}
      {isMobileView && renderMobileBreadcrumb()}

      {/* Mobile Navigation Tabs */}
      {isMobileView && (
        <div className="px-4 py-2 md:hidden">
          <div className="responsive-tab-switcher">
            <button
              className={`tab-button ${
                mobileNavView === "schemas" ? "active" : ""
              }`}
              onClick={() => handleMobileNavigation("schemas")}
            >
              Schemas
            </button>
            <button
              className={`tab-button ${
                mobileNavView === "tables" ? "active" : ""
              }`}
              onClick={() => handleMobileNavigation("tables")}
              disabled={!activeSchema}
            >
              Tables
            </button>
            <button
              className={`tab-button ${
                mobileNavView === "details" ? "active" : ""
              }`}
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
        <div className={`content-row ${isMobileView ? "flex-col" : ""}`}>
          {/* Schema tabs */}
          {(!isMobileView || (isMobileView && mobileNavView === "schemas")) && (
            <div
              className={
                isMobileView
                  ? "schema-tabs-horizontal"
                  : "schema-tabs flex-none sm:flex-col border-b sm:border-b-0 sm:border-r"
              }
              style={{
                borderColor: theme.colors.border,
                minWidth: isMobileView ? "auto" : "120px",
                maxWidth: isMobileView ? "100%" : "200px",
                height: isMobileView ? "auto" : "300px",
                display: "flex",
                flexDirection: isMobileView ? "row" : "column",
                overflowY: isMobileView ? "hidden" : "auto",
                overflowX: isMobileView ? "auto" : "hidden",
              }}
              ref={schemaTabsRef}
            >
              <div className={isMobileView ? "flex" : "schema-tabs-container"}>
                {filteredSchemas.map((schema, index) => (
                  <button
                    key={schema.name}
                    className={`${
                      isMobileView ? "schema-tab-horizontal" : "schema-tab"
                    } schema-item flex items-center justify-between p-3 ${
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
                    aria-label={`Select schema ${schema.name}`}
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <Database
                        size={16}
                        style={{ color: theme.colors.accent }}
                        aria-hidden="true"
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
          )}

          {/* Tables and details */}
          <div
            className={`flex-1 ${
              isMobileView ? "" : "flex flex-col sm:flex-row"
            } overflow-hidden`}
          >
            {/* Table list */}
            {activeSchema &&
              activeSchemaData &&
              (!isMobileView ||
                (isMobileView && mobileNavView === "tables")) && (
                <div
                  className={`table-list h-full flex-none ${
                    isMobileView ? "w-full" : "sm:w-1/3"
                  } border-b sm:border-b-0 sm:border-r`}
                  style={{
                    borderColor: theme.colors.border,
                    overflow: "auto",
                    height: isMobileView ? "calc(100vh - 230px)" : "auto",
                  }}
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
                      <span className="ml-2 text-xs opacity-75">
                        ({activeSchemaData.tables.length})
                      </span>
                    </h3>
                    <div
                      className="flex items-center space-x-2"
                      ref={filterRef}
                    >
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowFilterOptions(!showFilterOptions)
                          }
                          className="p-1.5 rounded-m"
                          style={{ color: theme.colors.text }}
                          aria-label="Filter options"
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
                        className="p-1.5 rounded-md"
                        style={{ color: theme.colors.text }}
                        aria-label="Clear search"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-0.5 p-2">
                    {sortedTables(activeSchemaData).map((table, index) => (
                      <button
                        key={table.name}
                        className="table-item rounded-lg cursor-pointer w-full text-left"
                        onClick={() => handleTableClick(table.name)}
                        style={{
                          backgroundColor:
                            activeTable === table.name
                              ? `${theme.colors.accent}10`
                              : "transparent",
                          transition: "background-color 0.2s ease",
                          "--item-index": index,
                        }}
                        aria-label={`Select table ${table.name}`}
                      >
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <Table2
                              size={16}
                              style={{ color: theme.colors.accent }}
                              aria-hidden="true"
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
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      </button>
                    ))}
                    {activeSchemaData.tables.length === 0 && (
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
            {(!isMobileView ||
              (isMobileView && mobileNavView === "details")) && (
              <div
                className="details-container flex-1"
                style={{
                  height: isMobileView ? "calc(100vh - 230px)" : "auto",
                }}
              >
                {activeTable && activeTableData ? (
                  <div className="p-4">
                    {isLoading ? (
                      <div className="space-y-4">
                        <div className="skeleton-loader h-6 w-32"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className="skeleton-loader h-10"></div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <h3
                            className="text-lg font-semibold mb-3 sm:mb-0"
                            style={{ color: theme.colors.text }}
                          >
                            {activeTableData.name}
                          </h3>
                          {activeTableData.sampleData && (
                            <div
                              className="relative inline-flex rounded-full p-1 max-w-xs w-full"
                              style={{
                                backgroundColor: theme.colors.hover,
                              }}
                            >
                              {/* Sliding Background */}
                              <div
                                className={`
                                absolute top-1 bottom-1 rounded-full bg-accent
                                transition-transform duration-400 ease-in-out
                                ${
                                  activeView === "columns"
                                    ? "translate-x-0"
                                    : "translate-x-full"
                                }
                              `}
                                style={{
                                  width: "48.5%", // Exactly half the container width
                                  backgroundColor: theme.colors.accent,
                                }}
                              />

                              {/* Columns Button */}
                              <button
                                onClick={() => setActiveView("columns")}
                                className={`
                                relative z-10 flex-1 py-1.5 px-3 text-center rounded-full text-sm font-medium
                                transition-all duration-400 ease-in-out whitespace-nowrap
                                ${
                                  activeView === "columns"
                                    ? "text-white"
                                    : "text-gray-400"
                                }
                              `}
                                style={{
                                  flex: "1 1 0", // Ensure equal widths
                                  willChange: "color, transform",
                                  transform:
                                    activeView === "columns"
                                      ? "scale(1.02)"
                                      : "scale(1)",
                                }}
                                aria-label="View columns"
                              >
                                Columns
                              </button>

                              {/* Sample Data Button */}
                              <button
                                onClick={() => setActiveView("sampleData")}
                                className={`
                                relative z-10 flex-1 py-1.5 px-3 text-center rounded-full text-sm font-medium
                                transition-all duration-400 ease-in-out whitespace-nowrap
                                ${
                                  activeView === "sampleData"
                                    ? "text-white"
                                    : "text-gray-400"
                                }
                              `}
                                style={{
                                  flex: "1 1 0", // Ensure equal widths
                                  willChange: "color, transform",
                                  transform:
                                    activeView === "sampleData"
                                      ? "scale(1.02)"
                                      : "scale(1)",
                                }}
                                aria-label="View sample data"
                              >
                                Sample Data
                              </button>
                            </div>
                          )}
                        </div>
                        {activeView === "columns" && (
                          <div className="column-item-grid">
                            {activeTableData.columns.map((column, index) => (
                              <button
                                key={column.name}
                                className="column-item rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden my-1 text-left w-full"
                                style={{
                                  "--item-index": index,
                                  backgroundColor: `${theme.colors.accent}10`,
                                }}
                                onClick={() => handleColumnClick(column.name)}
                                data-column={column.name}
                              >
                                <div
                                  className={`p-3 ${
                                    isMobileView ? "" : "grid grid-cols-2"
                                  }`}
                                >
                                  <div className="flex items-center mb-2 sm:mb-0">
                                    <div
                                      className="mr-2 flex-shrink-0 p-1.5 rounded-full"
                                      style={{
                                        backgroundColor:
                                          theme.colors.bubbleUser,
                                      }}
                                    >
                                      {getColumnIcon(column.name)}
                                    </div>
                                    <div className="truncate">
                                      <p
                                        className="font-medium text-sm"
                                        style={{ color: theme.colors.text }}
                                      >
                                        {column.name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <div
                                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs`}
                                      style={getTypeColor(column.type)}
                                    >
                                      {getTypeIcon(column.type)}
                                      <span className="font-medium truncate max-w-[80px]">
                                        {column.type}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {activeView === "sampleData" &&
                          activeTableData.sampleData && (
                            <div className="sample-data-container">
                              <div className="table-data-scroll">
                                <div
                                  style={{
                                    backgroundColor: theme.colors.surface,
                                    borderRadius: theme.borderRadius.default,
                                    boxShadow: theme.shadow.sm,
                                    border: `1px solid ${theme.colors.border}`,
                                  }}
                                >
                                  <div
                                    className="overflow-x-auto"
                                    style={{
                                      maxHeight: isMobileView
                                        ? "calc(100vh - 300px)"
                                        : "400px",
                                    }}
                                  >
                                    <table
                                      className="w-full"
                                      style={{ borderCollapse: "collapse" }}
                                    >
                                      <thead>
                                        <tr>
                                          {activeTableData.columns.map(
                                            (column) => (
                                              <th
                                                key={column.name}
                                                className="text-left p-3 sticky top-0"
                                                style={{
                                                  backgroundColor:
                                                    theme.colors.accent,
                                                  color: "white",
                                                  borderBottom: `1px solid ${theme.colors.border}`,
                                                  fontWeight: "500",
                                                  fontSize: isMobileView
                                                    ? "12px"
                                                    : "14px",
                                                  whiteSpace: "nowrap",
                                                }}
                                                scope="col"
                                              >
                                                {column.name}
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
                                              style={{
                                                backgroundColor:
                                                  idx % 2 === 0
                                                    ? theme.colors.surface
                                                    : theme.colors.background,
                                                borderBottom: `1px solid ${theme.colors.border}`,
                                              }}
                                            >
                                              {activeTableData.columns.map(
                                                (column) => (
                                                  <td
                                                    key={column.name}
                                                    className="p-2 sm:p-3"
                                                    style={{
                                                      color: theme.colors.text,
                                                      fontWeight: "normal",
                                                      fontSize: isMobileView
                                                        ? "12px"
                                                        : "14px",
                                                      whiteSpace: "nowrap",
                                                      maxWidth: "200px",
                                                      overflow: "hidden",
                                                      textOverflow: "ellipsis",
                                                    }}
                                                  >
                                                    {row[column.name] != null
                                                      ? String(row[column.name])
                                                      : "NULL"}
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
                            </div>
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
                        aria-hidden="true"
                      />
                      <p style={{ color: theme.colors.textSecondary }}>
                        {isMobileView
                          ? "Select a schema and table to view details"
                          : "Select a table to view details"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaExplorer;
