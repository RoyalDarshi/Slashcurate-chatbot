import React, { useState, useEffect, useRef, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trash2, AlertTriangle, Edit2, X } from "react-feather";
import { ClipboardList, Database, Server, Globe, User, Activity, Clock, Layers } from "lucide-react";
import { useTheme } from "../ThemeContext";
import {
  deleteConnection,
  getAdminConnections,
  getUserConnections,
} from "../api";
import CustomTooltip from "./CustomTooltip";
import { CHATBOT_API_URL } from "../config";
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
  const token = sessionStorage.getItem("token");

  // State for deletion confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [connectionToDelete, setConnectionToDelete] =
    useState<Connection | null>(null);

  // State for edit modal
  const [editConnection, setEditConnection] = useState<Connection | null>(null);

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
        ? await getAdminConnections(token)
        : await getUserConnections(token);

      if (
        !response.data.connections ||
        response.data.connections.length === 0
      ) {
        setError("No connections found.");
        setConnections([]);
      } else {
        setConnections(response.data.connections);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const errorMsg =
          axiosError.response?.data?.message ?? axiosError.message;
        toast.error(`Error: ${errorMsg}`, { theme: mode });
        setError(errorMsg);
      } else {
        const errorMsg = (error as Error).message;
        toast.error(`Error: ${errorMsg}`, { theme: mode });
        setError(errorMsg);
      }
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
      const response = await deleteConnection(token, connectionToDelete.id);

      if (response.status === 200) {
        toast.success("Connection deleted successfully!", { theme: mode });
        setShowDeleteModal(false);
        setConnectionToDelete(null);
        fetchConnections();
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const errorMsg =
          axiosError.response?.data?.message ?? axiosError.message;
        toast.error(`Error: ${errorMsg}`, { theme: mode });
        setError(errorMsg);
      } else {
        const errorMsg = (error as Error).message;
        toast.error(`Error: ${errorMsg}`, { theme: mode });
        setError(errorMsg);
      }
    }
  }, [connectionToDelete, mode, fetchConnections]);

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
          maxTransportObjects: connection.maxTransportObjects,
          password: connection.password,
          port: connection.port,
          selectedDB: connection.selectedDB,
          username: connection.username,
        };

        const response = await axios.post(`${CHATBOT_API_URL}/meta_data`, {
          connection: connData,
          isEncrypted: true,
        });

        if (response.status === 200) {
          toast.success("Metadata re-extracted successfully!", { theme: mode });
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<{ message?: string }>;
          const errorMsg =
            axiosError.response?.data?.message ?? axiosError.message;
          toast.error(`Error: ${errorMsg}`, { theme: mode });
          setError(errorMsg);
        } else {
          const errorMsg = (error as Error).message;
          toast.error(`Error: ${errorMsg}`, { theme: mode });
          setError(errorMsg);
        }
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
      <h2
        className="text-3xl font-bold mb-6"
        style={{ color: theme.colors.text }}
      >
        Existing Connections
      </h2>

      {connections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="flex flex-col rounded-xl shadow-lg overflow-hidden transition-all duration-200 group"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.colors.background === "#0F172A"
                  ? "0 4px 20px -2px rgba(0, 0, 0, 0.4)"
                  : "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = theme.colors.background === "#0F172A"
                  ? "0 12px 30px -4px rgba(0, 0, 0, 0.5)"
                  : "0 12px 30px -4px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.borderColor = `${theme.colors.accent}40`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = theme.colors.background === "#0F172A"
                  ? "0 4px 20px -2px rgba(0, 0, 0, 0.4)"
                  : "0 4px 20px -2px rgba(0, 0, 0, 0.05)";
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
            >
              {/* Card Header */}
              <div 
                className="p-5 border-b flex items-start justify-between gap-4"
                style={{ 
                  borderColor: theme.colors.border,
                  backgroundColor: theme.mode === 'light' ? '#F8FAFC' : `${theme.colors.surfaceGlass}`
                }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div 
                    className="p-2.5 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}
                  >
                    <Database size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate" style={{ color: theme.colors.text }}>
                      {connection.connectionName}
                    </h3>
                    <p className="text-xs truncate font-medium mt-0.5" style={{ color: `${theme.colors.text}80` }}>
                      {connection.description || "No description provided"}
                    </p>
                  </div>
                </div>
                
                {/* Actions Menu */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <CustomTooltip
                    title={connection.isAdmin ? "Cannot re-extract metadata for default connections" : "Re-extract Metadata"}
                    position="top"
                  >
                    <button
                      onClick={() => handleReExtractMetadata(connection)}
                      disabled={connection.isAdmin}
                      className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                      style={{ color: connection.isAdmin ? theme.colors.disabledText : '#10B981' }}
                      onMouseOver={(e) => !connection.isAdmin && (e.currentTarget.style.backgroundColor = `${theme.colors.success}15`)}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <ClipboardList size={16} />
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
                        <Edit2 size={16} />
                      </button>
                    </CustomTooltip>
                  )}
                  
                  {(!connection.uid || connection.uid === localStorage.getItem("uid")) && (
                    <CustomTooltip
                      title={connection.isAdmin ? "Cannot delete default connections" : "Delete Connection"}
                      position="top"
                    >
                      <button
                        onClick={() => confirmDeleteConnection(connection)}
                        disabled={connection.isAdmin}
                        className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                        style={{ color: connection.isAdmin ? theme.colors.disabledText : theme.colors.error }}
                        onMouseOver={(e) => !connection.isAdmin && (e.currentTarget.style.backgroundColor = `${theme.colors.error}15`)}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </CustomTooltip>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col gap-4 text-sm" style={{ color: theme.colors.textSecondary }}>
                
                <div className="flex items-center gap-3">
                  <Globe size={16} className="opacity-70 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold" style={{ color: theme.colors.text }}>{connection.hostname}</span>
                    <span className="opacity-70 mx-1">:</span>
                    <span className="font-mono text-xs">{connection.port}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Server size={16} className="opacity-70 flex-shrink-0" />
                  <div className="truncate">
                    <span className="opacity-70 mr-2">Engine:</span>
                    <span className="font-medium" style={{ color: theme.colors.text }}>{connection.selectedDB}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Activity size={16} className="opacity-70 flex-shrink-0" />
                  <div className="truncate">
                    <span className="opacity-70 mr-2">Database:</span>
                    <span className="font-medium" style={{ color: theme.colors.text }}>{connection.database}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User size={16} className="opacity-70 flex-shrink-0" />
                  <div className="truncate">
                    <span className="opacity-70 mr-2">User:</span>
                    <span className="font-medium" style={{ color: theme.colors.text }}>{connection.username}</span>
                  </div>
                </div>
                
              </div>

              {/* Card Footer (Badges) */}
              <div 
                className="p-4 pt-0 flex flex-wrap gap-2 mt-auto"
              >
                <div 
                  className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: `${theme.colors.text}08`, color: theme.colors.textSecondary }}
                >
                  <Clock size={12} />
                  <span>{connection.commandTimeout}s Timeout</span>
                </div>
                <div 
                  className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: `${theme.colors.text}08`, color: theme.colors.textSecondary }}
                >
                  <Layers size={12} />
                  <span>{connection.maxTransportObjects} Max Objects</span>
                </div>
                {connection.isAdmin && (
                  <div 
                    className="px-2.5 py-1 rounded-md text-xs font-bold ml-auto uppercase tracking-wider"
                    style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}
                  >
                    Default
                  </div>
                )}
              </div>
            </div>
          ))}
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
            onClick={createConnection}
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
        <div className="md:col-span-2 mt-4">
          <Loader text={"Extracting metadata, please wait..."} />
        </div>
      )}

      {/* Render confirmation modal */}
      <DeleteConfirmationModal />

      {/* Edit Connection Modal - Right Slide-Over Drawer */}
      {editConnection && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Dark Overlay */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setEditConnection(null)} 
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
                  Edit Connection
                </h2>
                <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                  Editing settings for <strong>{editConnection.connectionName}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditConnection(null)}
                className="p-2 rounded-full transition-colors duration-200"
                style={{ color: theme.colors.textSecondary }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.hover)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                aria-label="Close edit modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Render ConnectionForm in Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              <ConnectionForm
                isAdmin={isAdmin}
                token={token || ""}
                editConnectionId={editConnection.id}
                initialData={{
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
                }}
                onSuccess={() => {
                  setEditConnection(null);
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
