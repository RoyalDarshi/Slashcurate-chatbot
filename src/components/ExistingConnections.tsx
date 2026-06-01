import React, { useState, useEffect, useRef, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trash2, Edit2, X } from "react-feather";
import { ClipboardList, Activity, Database, Server, Globe, User, Clock, Layers, AlertTriangle, LayoutGrid, List } from "lucide-react";
import { useTheme } from "../ThemeContext";
import CustomTooltip from "./CustomTooltip";
import { connectionService } from "../services/connectionService";
import { handleApiError } from "../utils/errorHandler";
import Loader from "./Loader";
import ConnectionForm from "./ConnectionForm";
import { authService } from "../services/authService";
import SkeletonLoader from "./SkeletonLoader";

interface Connection {
  id: number;
  commandTimeout: string;
  connectionName: string;
  database: string;
  description: string;
  hostname: string;
  maxTransportObjects: string;
  password: string;
  port: string;
  selectedDB: string;
  username: string;
  created_at: string;
  isAdmin: boolean;
  uid?: string;
  isPublic?: boolean;
}

interface ExistingConnectionsProps {
  isAdmin: boolean;
  createConnection: () => void;
}

const getEngineDetails = (selectedDB: string) => {
  const db = String(selectedDB).toLowerCase();
  switch (db) {
    case "postgresql":
      return {
        label: "PostgreSQL",
        color: "#336791",
        bgColor: "rgba(51, 103, 145, 0.12)",
      };
    case "mysql":
      return {
        label: "MySQL",
        color: "#00758F",
        bgColor: "rgba(0, 117, 143, 0.12)",
      };
    case "mongodb":
      return {
        label: "MongoDB",
        color: "#47A248",
        bgColor: "rgba(71, 162, 72, 0.12)",
      };
    case "oracle":
      return {
        label: "Oracle",
        color: "#F80000",
        bgColor: "rgba(248, 0, 0, 0.12)",
      };
    case "sqlserver":
      return {
        label: "SQL Server",
        color: "#CC292B",
        bgColor: "rgba(204, 41, 43, 0.12)",
      };
    case "db2":
      return {
        label: "IBM DB2",
        color: "#055A92",
        bgColor: "rgba(5, 90, 146, 0.12)",
      };
    default:
      return {
        label: selectedDB || "Database",
        color: "#6366F1",
        bgColor: "rgba(99, 102, 241, 0.12)",
      };
  }
};

const ExistingConnections: React.FC<ExistingConnectionsProps> = ({
  isAdmin,
  createConnection,
}) => {
  const { theme } = useTheme();
  const [connections, setConnections] = useState<Connection[]>([]);
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading, please wait...");
  const [error, setError] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";
  const token = authService.getToken(isAdmin);
  const [viewFormat, setViewFormat] = useState<"tile" | "table">("tile");

  // State for deletion confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [connectionToDelete, setConnectionToDelete] =
    useState<Connection | null>(null);

  // State for edit modal
  const [editConnection, setEditConnection] = useState<Connection | null>(null);
  
  // State for create modal
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);

  const fetchConnections = useCallback(async () => {
    if (!token) {
      toast.error("Authentication token not found. Please log in again.", {
        theme: mode,
      });
      return;
    }

    try {
      setLoadingText("Loading connections, please wait...");
      setLoading(true);
      setError(null);

      let response = isAdmin
        ? await connectionService.getAdminConnections()
        : await connectionService.getUserConnections();

      if (
        !response.connections ||
        response.connections.length === 0
      ) {
        setError("No connections found.");
        setConnections([]);
      } else {
        setConnections(response.connections);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      handleApiError(error, "Failed to load connections", mode);
      setError("Failed to load connections");
    }
  }, [isAdmin, mode]);

  const confirmDeleteConnection = (connection: Connection) => {
    setConnectionToDelete(connection);
    setShowDeleteModal(true);
  };

  const handleDeleteConnection = useCallback(async () => {
    if (!connectionToDelete) return;
    if (!token) {
      toast.error("Authentication token not found. Please log in again.", {
        theme: mode,
      });
      return;
    }

    try {
      setLoadingText("Deleting connection, please wait...");
      setLoading(true);
      setError(null);
      await connectionService.deleteConnection(connectionToDelete.id, isAdmin);

      toast.success("Connection deleted successfully!", { theme: mode });
      setShowDeleteModal(false);
      setConnectionToDelete(null);
      fetchConnections();
    } catch (error) {
      setLoading(false);
      handleApiError(error, "Failed to delete connection", mode);
    }
  }, [connectionToDelete, mode, fetchConnections, isAdmin]);

  const handleReExtractMetadata = useCallback(
    async (connection: Connection) => {
      if (!token) {
        toast.error("Authentication token not found. Please log in again.", {
          theme: mode,
        });
        return;
      }

      try {
        setLoadingText("Re-extracting metadata, please wait...");
        setLoading(true);
        setError(null);

        const connData = {
          commandTimeout: connection.commandTimeout,
          connectionName: connection.connectionName,
          database: connection.database,
          description: connection.description,
          hostname: connection.hostname,
          port: connection.port,
          selectedDB: connection.selectedDB,
          username: connection.username,
          password: connection.password,
        };

        await connectionService.reExtractMetadata(connData);
        toast.success("Metadata re-extracted successfully!", { theme: mode });
      } catch (error) {
        handleApiError(error, "Failed to re-extract metadata", mode);
      } finally {
        setLoading(false);
      }
    },
    [mode, token],
  );

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchConnections();
  }, [fetchConnections]);

  // Delete confirmation modal
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal || !connectionToDelete) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div
          className="p-6 rounded-lg shadow-xl max-w-md w-full"
          style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.accent}40`,
            boxShadow:
              theme.colors.background === "#0F172A"
                ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div className="flex items-center mb-4">
            <AlertTriangle size={24} className="text-yellow-500 mr-2" />
            <h3
              className="text-xl font-bold"
              style={{ color: theme.colors.text }}
            >
              Confirm Deletion
            </h3>
          </div>

          <p className="mb-6" style={{ color: theme.colors.text }}>
            Are you sure you want to delete the connection{" "}
            <strong>{connectionToDelete.connectionName}</strong>?
            <br />
            <br />
            <span className="text-yellow-500 font-medium">
              Note: You will not be able to access chat history from this
              connection after deletion.
            </span>
          </p>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="py-2 px-4 transition-all duration-200"
              style={{
                color: theme.colors.text,
                backgroundColor: "transparent",
                border: `1px solid ${theme.colors.text}40`,
                borderRadius: theme.borderRadius.default,
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConnection}
              className="py-2 px-4 transition-all duration-200 text-white"
              style={{
                backgroundColor: "#EF4444",
                borderRadius: theme.borderRadius.default,
                opacity: loading ? 0.7 : 1,
                boxShadow:
                  theme.colors.background === "#0F172A"
                    ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
                    : "0 4px 6px -1px rgba(239, 68, 68, 0.2)",
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#DC2626";
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#EF4444";
                }
              }}
              disabled={loading}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSkeletonGrid = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((val) => (
          <div 
            key={val}
            className="p-5 rounded-2xl border flex flex-col justify-between h-[230px]"
            style={{ 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }}
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <SkeletonLoader variant="circular" width={40} height={40} />
                  <div className="space-y-2 animate-pulse" style={{ minWidth: '150px' }}>
                    <SkeletonLoader variant="text" width="80%" height="1rem" />
                    <SkeletonLoader variant="text" width="50%" height="0.75rem" />
                  </div>
                </div>
                <SkeletonLoader variant="rectangular" width={60} height={20} className="rounded-full" />
              </div>
              <div className="space-y-2 mb-4 animate-pulse">
                <SkeletonLoader variant="text" width="95%" height="0.75rem" />
                <SkeletonLoader variant="text" width="80%" height="0.75rem" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: theme.colors.border }}>
              <div className="flex gap-2">
                <SkeletonLoader variant="rectangular" width={55} height={18} className="rounded-md" />
                <SkeletonLoader variant="rectangular" width={55} height={18} className="rounded-md" />
              </div>
              <div className="flex gap-2">
                <SkeletonLoader variant="circular" width={28} height={28} />
                <SkeletonLoader variant="circular" width={28} height={28} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTableFormat = () => {
    return (
      <div 
        className="overflow-x-auto rounded-2xl border shadow-xs"
        style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr 
              className="border-b text-xs font-bold uppercase tracking-wider"
              style={{ 
                borderColor: theme.colors.border,
                color: theme.colors.textSecondary,
                backgroundColor: `${theme.colors.text}02`
              }}
            >
              <th className="px-6 py-4">Database</th>
              <th className="px-6 py-4">Host / Database</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Access Type</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm" style={{ divideColor: theme.colors.border }}>
            {connections.map((connection) => {
              const engine = getEngineDetails(connection.selectedDB);
              return (
                <tr 
                  key={connection.id}
                  className="transition-colors duration-150 hover:bg-black/[0.01] dark:hover:bg-white/[0.01]"
                  style={{ color: theme.colors.text }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-9 w-9 rounded-xl flex items-center justify-center border"
                        style={{ 
                          backgroundColor: engine.bgColor, 
                          borderColor: `${theme.colors.text}08` 
                        }}
                      >
                        <Database size={18} style={{ color: engine.color }} />
                      </div>
                      <div>
                        <div className="font-bold tracking-tight">{connection.connectionName}</div>
                        <div className="text-[10px] uppercase font-bold opacity-60 tracking-wider" style={{ color: engine.color }}>
                          {connection.selectedDB}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs opacity-85">{connection.hostname}:{connection.port}</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: theme.colors.textSecondary }}>
                      DB: {connection.database}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs opacity-75">
                    {connection.username}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {connection.isAdmin && (
                        <span 
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 text-blue-500 border border-blue-500/20"
                          style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)' }}
                        >
                          <Server size={8} />
                          System
                        </span>
                      )}
                      {connection.isPublic ? (
                        <span 
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 text-emerald-500 border border-emerald-500/20"
                          style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}
                        >
                          <Globe size={8} />
                          Public
                        </span>
                      ) : (
                        <span 
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 text-orange-500 border border-orange-500/20"
                          style={{ backgroundColor: 'rgba(249, 115, 22, 0.08)' }}
                        >
                          <User size={8} />
                          Private
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <CustomTooltip title={connection.isAdmin ? "Cannot re-extract metadata for default connections" : "Re-extract Metadata"} position="top">
                        <button
                          onClick={() => handleReExtractMetadata(connection)}
                          disabled={connection.isAdmin}
                          className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: connection.isAdmin ? theme.colors.disabledText : '#10B981' }}
                          onMouseOver={(e) => !connection.isAdmin && (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <ClipboardList size={16} />
                        </button>
                      </CustomTooltip>
                      
                      {(!connection.uid || connection.uid === localStorage.getItem("uid")) && !connection.isAdmin && (
                        <CustomTooltip title="Edit Connection" position="top">
                          <button
                            onClick={() => setEditConnection(connection)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: theme.colors.accent }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = `${theme.colors.accent}12`)}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Edit2 size={16} />
                          </button>
                        </CustomTooltip>
                      )}
                      
                      {(!connection.uid || connection.uid === localStorage.getItem("uid")) && (
                        <CustomTooltip title={connection.isAdmin ? "Cannot delete default connections" : "Delete Connection"} position="top">
                          <button
                            onClick={() => confirmDeleteConnection(connection)}
                            disabled={connection.isAdmin}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                            style={{ color: connection.isAdmin ? theme.colors.disabledText : theme.colors.error }}
                            onMouseOver={(e) => !connection.isAdmin && (e.currentTarget.style.backgroundColor = `${theme.colors.error}10`)}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </CustomTooltip>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      className="p-6 shadow-md h-full overflow-y-auto"
      style={{
        backgroundColor: theme.colors.background,
      }}
    >
      <ToastContainer
        toastStyle={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.text}20`,
        }}
      />
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-3xl font-bold"
          style={{ color: theme.colors.text }}
        >
          Connections
        </h2>
        
        <div className="flex items-center gap-3">
          {(connections.length > 0 || (loading && loadingText === "Loading connections, please wait...")) && (
            <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl gap-1 border" style={{ borderColor: theme.colors.border }}>
              <button
                onClick={() => setViewFormat("tile")}
                className="p-1.5 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: viewFormat === "tile" ? theme.colors.surface : "transparent",
                  color: viewFormat === "tile" ? theme.colors.accent : theme.colors.textSecondary,
                  boxShadow: viewFormat === "tile" ? theme.shadow.sm : "none",
                }}
                title="Tile Format"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewFormat("table")}
                className="p-1.5 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: viewFormat === "table" ? theme.colors.surface : "transparent",
                  color: viewFormat === "table" ? theme.colors.accent : theme.colors.textSecondary,
                  boxShadow: viewFormat === "table" ? theme.shadow.sm : "none",
                }}
                title="Table Format"
              >
                <List size={16} />
              </button>
            </div>
          )}

          {/* Render Add Connection button only if we have connections or list is loading */}
          {(connections.length > 0 || (loading && loadingText === "Loading connections, please wait...")) && (
            <button
              onClick={() => setIsCreatingConnection(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-xs animate-fade-in"
              style={{ backgroundColor: theme.colors.accent }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accentHover)}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accent)}
            >
              <Database size={16} />
              Add Connection
            </button>
          )}
        </div>
      </div>

      {loading && loadingText === "Loading connections, please wait..." ? (
        renderSkeletonGrid()
      ) : connections.length > 0 ? (
        viewFormat === "tile" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {connections.map((connection) => {
            const engine = getEngineDetails(connection.selectedDB);
            
            return (
              <div 
                key={connection.id}
                className="p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-md hover:-translate-y-1"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }}
              >
                <div>
                  {/* Top row: Engine Icon & Badges */}
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="p-3 rounded-xl flex items-center justify-center"
                      style={{ 
                        backgroundColor: engine.bgColor,
                        color: engine.color 
                      }}
                    >
                      <Database className="h-5 w-5" />
                    </div>
                    
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {connection.isAdmin && (
                        <span 
                          className="px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider" 
                          style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}
                        >
                          System
                        </span>
                      )}
                      {connection.isPublic ? (
                        <span 
                          className="px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider" 
                          style={{ backgroundColor: `${theme.colors.success}15`, color: theme.colors.success }}
                        >
                          Public
                        </span>
                      ) : (
                        <span 
                          className="px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider" 
                          style={{ backgroundColor: `${theme.colors.textSecondary}15`, color: theme.colors.textSecondary }}
                        >
                          Private
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Connection Title and Description */}
                  <div className="mb-4">
                    <h3 
                      className="font-extrabold text-base truncate"
                      style={{ color: theme.colors.text }}
                      title={connection.connectionName}
                    >
                      {connection.connectionName}
                    </h3>
                    <p 
                      className="text-xs font-semibold mt-1 line-clamp-2 leading-relaxed"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {connection.description || "No description provided."}
                    </p>
                  </div>

                  {/* Connection details pills */}
                  <div className="flex flex-col gap-2.5 mb-5 pb-4 border-b" style={{ borderColor: theme.colors.border }}>
                    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: theme.colors.textSecondary }}>
                      <Globe size={13} className="opacity-70 flex-shrink-0" />
                      <span className="truncate">
                        <span style={{ color: theme.colors.text }}>{connection.hostname}</span>
                        <span className="opacity-70 mx-0.5">:</span>
                        <span className="font-mono text-[11px]">{connection.port}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: theme.colors.textSecondary }}>
                      <Server size={13} className="opacity-70 flex-shrink-0" />
                      <span className="truncate">
                        Engine: <span className="font-bold" style={{ color: theme.colors.text }}>{engine.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: theme.colors.textSecondary }}>
                      <Activity size={13} className="opacity-70 flex-shrink-0" />
                      <span className="truncate">
                        Database: <span className="font-bold" style={{ color: theme.colors.text }}>{connection.database}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: theme.colors.textSecondary }}>
                      <User size={13} className="opacity-70 flex-shrink-0" />
                      <span className="truncate">
                        User: <span className="font-bold" style={{ color: theme.colors.text }}>{connection.username}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom parameters & Actions */}
                <div className="flex items-center justify-between mt-auto">
                  {/* Timeout / Object metrics */}
                  <div className="flex flex-wrap gap-1.5">
                    <span 
                      className="px-2 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1"
                      style={{ backgroundColor: `${theme.colors.text}05`, color: theme.colors.textSecondary }}
                    >
                      <Clock size={10} />
                      {connection.commandTimeout}s
                    </span>
                    <span 
                      className="px-2 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1"
                      style={{ backgroundColor: `${theme.colors.text}05`, color: theme.colors.textSecondary }}
                    >
                      <Layers size={10} />
                      {connection.maxTransportObjects} max
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <CustomTooltip title={connection.isAdmin ? "Cannot re-extract metadata for default connections" : "Re-extract Metadata"} position="top">
                      <button
                        onClick={() => handleReExtractMetadata(connection)}
                        disabled={connection.isAdmin}
                        className="p-2 rounded-lg transition-colors disabled:opacity-50"
                        style={{ color: connection.isAdmin ? theme.colors.disabledText : '#10B981' }}
                        onMouseOver={(e) => !connection.isAdmin && (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <ClipboardList size={16} />
                      </button>
                    </CustomTooltip>
                    
                    {(!connection.uid || connection.uid === localStorage.getItem("uid")) && !connection.isAdmin && (
                      <CustomTooltip title="Edit Connection" position="top">
                        <button
                          onClick={() => setEditConnection(connection)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: theme.colors.accent }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = `${theme.colors.accent}12`)}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Edit2 size={16} />
                        </button>
                      </CustomTooltip>
                    )}
                    
                    {(!connection.uid || connection.uid === localStorage.getItem("uid")) && (
                      <CustomTooltip title={connection.isAdmin ? "Cannot delete default connections" : "Delete Connection"} position="top">
                        <button
                          onClick={() => confirmDeleteConnection(connection)}
                          disabled={connection.isAdmin}
                          className="p-2 rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: connection.isAdmin ? theme.colors.disabledText : theme.colors.error }}
                          onMouseOver={(e) => !connection.isAdmin && (e.currentTarget.style.backgroundColor = `${theme.colors.error}10`)}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </CustomTooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="animate-fade-in">
            {renderTableFormat()}
          </div>
        )
      ) : (
        <div
          className="max-w-md mx-auto p-8 rounded-3xl border shadow-sm text-center flex flex-col items-center"
          style={{ 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border 
          }}
        >
          <div className="p-4 rounded-full mb-4 animate-bounce" style={{ backgroundColor: `${theme.colors.accent}12` }}>
            <Database size={32} style={{ color: theme.colors.accent }} />
          </div>
          <h2
            className="text-xl font-extrabold mb-2"
            style={{ color: theme.colors.text }}
          >
            No Connections Available
          </h2>
          <p className="text-xs font-medium mb-6 leading-relaxed max-w-xs" style={{ color: theme.colors.textSecondary }}>
            It looks like you haven’t configured any database repositories yet. Link a relational schema layer to start exploring insights!
          </p>
          <button
            onClick={() => setIsCreatingConnection(true)}
            disabled={loading}
            className="w-full py-3 text-xs font-bold transition duration-200 shadow-md text-white hover:scale-[1.01] active:scale-99"
            style={{
              background: theme.gradients.primary,
              borderRadius: '12px',
              boxShadow: `0 8px 20px -6px ${theme.colors.accent}80`
            }}
          >
            Create Your First Connection
          </button>
        </div>
      )}


      {/* Render confirmation modal */}
      <DeleteConfirmationModal />

      {/* Edit/Create Connection Modal - Right Slide-Over Drawer */}
      {(editConnection || isCreatingConnection) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Dark Overlay */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => {
              setEditConnection(null);
              setIsCreatingConnection(false);
            }} 
          />
          
          {/* Drawer Panel */}
          <div
            className="relative w-full max-w-[600px] h-full shadow-2xl flex flex-col animate-slide-in-right"
            style={{
              backgroundColor: theme.colors.background,
              borderLeft: `1px solid ${theme.colors.border}`,
            }}
          >
            {/* Drawer Header */}
            <div
              className="flex items-center justify-between px-6 py-5 flex-shrink-0"
              style={{
                backgroundColor: theme.colors.surface,
                borderBottom: `1px solid ${theme.colors.border}`,
              }}
            >
              <div>
                <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                  {isCreatingConnection ? "Create Connection" : "Edit Connection"}
                </h2>
                <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                  {isCreatingConnection 
                    ? "Add a new database connection to your workspace" 
                    : <>Editing settings for <strong>{editConnection?.connectionName}</strong></>}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditConnection(null);
                  setIsCreatingConnection(false);
                }}
                className="p-2 rounded-full transition-colors duration-200"
                style={{ color: theme.colors.textSecondary }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.hover)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Render ConnectionForm in Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              <ConnectionForm
                isAdmin={isAdmin}
                token={token || ""}
                editConnectionId={editConnection?.id}
                initialData={editConnection ? {
                  connectionName: editConnection.connectionName,
                  description: editConnection.description,
                  hostname: editConnection.hostname,
                  port: editConnection.port,
                  selectedDB: editConnection.selectedDB,
                  database: editConnection.database,
                  commandTimeout: editConnection.commandTimeout,
                  maxTransportObjects: editConnection.maxTransportObjects,
                  username: editConnection.username,
                  password: "",
                  originalPassword: editConnection.password,
                  isPublic: editConnection.isPublic || false,
                } : null}
                onSuccess={() => {
                  setEditConnection(null);
                  setIsCreatingConnection(false);
                  fetchConnections();
                }}
              />
            </div>
          </div>
        </div>
      )}
      {loading && loadingText !== "Loading connections, please wait..." && <Loader text={loadingText} />}
    </div>
  );
};

export default React.memo(ExistingConnections);
