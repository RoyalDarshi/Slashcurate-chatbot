import React, { useState, useEffect, useRef, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trash2, Edit2, X } from "react-feather";
import { ClipboardList,Activity, Database, Server, Globe, User, Clock, Layers } from "lucide-react";
import { useTheme } from "../ThemeContext";
import CustomTooltip from "./CustomTooltip";
import { connectionService } from "../services/connectionService";
import { handleApiError } from "../utils/errorHandler";
import Loader from "./Loader";
import ConnectionForm from "./ConnectionForm";

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

import { authService } from "../services/authService";

const ExistingConnections: React.FC<ExistingConnectionsProps> = ({
  isAdmin,
  createConnection,
}) => {
  const { theme } = useTheme();
  const [connections, setConnections] = useState<Connection[]>([]);
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";
  const token = authService.getToken(isAdmin);

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
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
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
        
        {/* Render Add Connection button only if we have connections (empty state handles its own) */}
        {connections.length > 0 && (
          <button
            onClick={() => setIsCreatingConnection(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-xs"
            style={{ backgroundColor: theme.colors.accent }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accentHover)}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accent)}
          >
            <Database size={16} />
            Add Connection
          </button>
        )}
      </div>

      {connections.length > 0 ? (
        <div className="overflow-x-auto rounded-xl shadow-lg border pb-2" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface, boxShadow: theme.colors.background === "#0F172A" ? "0 4px 20px -2px rgba(0, 0, 0, 0.4)" : "0 4px 20px -2px rgba(0, 0, 0, 0.05)" }}>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr style={{ backgroundColor: theme.mode === 'light' ? '#F8FAFC' : `${theme.colors.surfaceGlass}` }}>
                <th className="p-4 font-semibold text-sm border-b" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>Connection Details</th>
                <th className="p-4 font-semibold text-sm border-b" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>Host & Database</th>
                <th className="p-4 font-semibold text-sm border-b" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>Credentials</th>
                <th className="p-4 font-semibold text-sm border-b" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>Settings</th>
                <th className="p-4 font-semibold text-sm border-b text-right" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((connection) => (
                <tr 
                  key={connection.id}
                  className="transition-colors border-b last:border-b-0"
                  style={{ borderColor: theme.colors.border }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = theme.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td className="p-4 align-top">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}>
                        <Database size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-base flex items-center gap-2 flex-wrap" style={{ color: theme.colors.text }}>
                          <span className="truncate max-w-[200px]">{connection.connectionName}</span>
                          {connection.isAdmin && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider" style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}>Default</span>
                          )}
                        </div>
                        <div className="text-xs font-medium mt-1 truncate max-w-[250px]" style={{ color: `${theme.colors.text}80` }}>
                          {connection.description || "No description provided"}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4 align-top text-sm" style={{ color: theme.colors.textSecondary }}>
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="opacity-70 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">
                          <span style={{ color: theme.colors.text }}>{connection.hostname}</span>
                          <span className="opacity-70 mx-0.5">:</span>
                          <span className="font-mono text-xs">{connection.port}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Server size={14} className="opacity-70 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">
                          <span className="opacity-70 mr-1">Engine:</span>
                          <span className="font-medium" style={{ color: theme.colors.text }}>{connection.selectedDB}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="opacity-70 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">
                          <span className="opacity-70 mr-1">DB:</span>
                          <span className="font-medium" style={{ color: theme.colors.text }}>{connection.database}</span>
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 align-top text-sm" style={{ color: theme.colors.textSecondary }}>
                    <div className="flex items-center gap-2 mt-1">
                      <User size={14} className="opacity-70 flex-shrink-0" />
                      <span className="truncate max-w-[120px] font-medium" style={{ color: theme.colors.text }}>{connection.username}</span>
                    </div>
                  </td>

                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 w-max" style={{ backgroundColor: `${theme.colors.text}08`, color: theme.colors.textSecondary }}>
                        <Clock size={12} />
                        <span>{connection.commandTimeout}s Timeout</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 w-max" style={{ backgroundColor: `${theme.colors.text}08`, color: theme.colors.textSecondary }}>
                        <Layers size={12} />
                        <span>{connection.maxTransportObjects} Max Objs</span>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 align-top text-right">
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <CustomTooltip title={connection.isAdmin ? "Cannot re-extract metadata for default connections" : "Re-extract Metadata"} position="top">
                        <button
                          onClick={() => handleReExtractMetadata(connection)}
                          disabled={connection.isAdmin}
                          className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                          style={{ color: connection.isAdmin ? theme.colors.disabledText : '#10B981' }}
                          onMouseOver={(e) => !connection.isAdmin && (e.currentTarget.style.backgroundColor = `${theme.colors.success}15`)}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <ClipboardList size={18} />
                        </button>
                      </CustomTooltip>
                      
                      {(!connection.uid || connection.uid === localStorage.getItem("uid")) && !connection.isAdmin && (
                        <CustomTooltip title="Edit Connection" position="top">
                          <button
                            onClick={() => setEditConnection(connection)}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: theme.colors.accent }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = `${theme.colors.accent}15`)}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Edit2 size={18} />
                          </button>
                        </CustomTooltip>
                      )}
                      
                      {(!connection.uid || connection.uid === localStorage.getItem("uid")) && (
                        <CustomTooltip title={connection.isAdmin ? "Cannot delete default connections" : "Delete Connection"} position="top">
                          <button
                            onClick={() => confirmDeleteConnection(connection)}
                            disabled={connection.isAdmin}
                            className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                            style={{ color: connection.isAdmin ? theme.colors.disabledText : theme.colors.error }}
                            onMouseOver={(e) => !connection.isAdmin && (e.currentTarget.style.backgroundColor = `${theme.colors.error}15`)}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Trash2 size={18} />
                          </button>
                        </CustomTooltip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="max-w-md mx-auto p-6 rounded-lg shadow-md text-center"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <div className="mb-4">
            {/* Optional placeholder icon with theme color */}
            <svg
              className="mx-auto h-12 w-12"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: theme.colors.accent }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v4h18V7M3 11v8h18v-8"
              />
            </svg>
          </div>
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: theme.colors.text }}
          >
            No Connections Found
          </h2>
          <p className="mb-4" style={{ color: theme.colors.text }}>
            It looks like you haven’t set up any connections yet. Let’s get
            started!
          </p>
          <button
            onClick={() => setIsCreatingConnection(true)}
            disabled={loading}
            className="w-full px-4 py-2 font-medium rounded-md transition duration-200 shadow-sm text-white"
            style={{
              backgroundColor: loading
                ? theme.colors.accentHover
                : theme.colors.accent,
            }}
            onMouseOver={(e) => {
              if (!loading)
                e.currentTarget.style.backgroundColor =
                  theme.colors.accentHover;
            }}
            onMouseOut={(e) => {
              if (!loading)
                e.currentTarget.style.backgroundColor = theme.colors.accent;
            }}
          >
            {"Create Connection"}
          </button>
        </div>
      )}
        {loading && (
          <div className="md:col-span-2 mt-4 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium opacity-70" style={{ color: theme.colors.text }}>Extracting metadata, please wait...</p>
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
    </div>
  );
};

export default React.memo(ExistingConnections);
