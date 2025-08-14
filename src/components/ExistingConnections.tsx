import React, { useState, useEffect, useRef, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trash2, AlertTriangle } from "react-feather";
import { ClipboardList } from "lucide-react";
import { useTheme } from "../ThemeContext";
import {
  deleteConnection,
  getAdminConnections,
  getUserConnections,
} from "../api";
import CustomTooltip from "./CustomTooltip";
import { CHATBOT_API_URL } from "../config";
import Loader from "./Loader";

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
    [mode, token]
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
        <div
          className="rounded-lg shadow-lg mb-40 relative overflow-hidden"
          style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.text}30`,
            boxShadow:
              theme.colors.background === "#0F172A"
                ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          {/* Table with sticky header and scrollable content */}
          <div className="max-h-[70vh] overflow-y-auto rounded-lg">
            <div className="overflow-x-auto" style={{ minWidth: "100%" }}>
              <table
                className="min-w-full"
                style={{
                  tableLayout: "fixed",
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  borderColor: theme.colors.text + "20",
                }}
              >
                <thead
                  className="sticky top-0 z-10"
                  style={{ backgroundColor: theme.colors.accent }}
                >
                  <tr>
                    <th
                      className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider"
                      style={{ width: "150px" }}
                    >
                      Connection Name
                    </th>
                    <th
                      className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider"
                      style={{ width: "200px" }}
                    >
                      Description
                    </th>
                    <th
                      className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider"
                      style={{ width: "150px" }}
                    >
                      Hostname
                    </th>
                    <th
                      className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider"
                      style={{ width: "80px" }}
                    >
                      Port
                    </th>
                    <th
                      className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider"
                      style={{ width: "150px" }}
                    >
                      Database
                    </th>
                    <th
                      className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider"
                      style={{ width: "120px" }}
                    >
                      Username
                    </th>
                    <th
                      className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider"
                      style={{ width: "140px" }}
                    >
                      Command Timeout
                    </th>
                    <th
                      className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider"
                      style={{ width: "170px" }}
                    >
                      Max Transport Objects
                    </th>
                    <th
                      className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider"
                      style={{ width: "120px" }}
                    >
                      Selected DB
                    </th>
                    <th
                      className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider"
                      style={{ width: "140px" }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y divide-gray-200"
                  style={{
                    backgroundColor: theme.colors.surface,
                  }}
                  ref={tableContainerRef}
                >
                  {connections.map((connection, index) => (
                    <tr
                      key={connection.id}
                      className="transition-colors duration-150"
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? `${theme.colors.background}90`
                            : theme.colors.surface,
                        "&:hover": {
                          backgroundColor: `${theme.colors.accent}15`,
                        },
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = `${theme.colors.accent}15`;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor =
                          index % 2 === 0
                            ? `${theme.colors.background}90`
                            : theme.colors.surface;
                      }}
                    >
                      <td
                        className="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: theme.colors.text }}
                      >
                        <div className="font-medium">
                          {connection.connectionName}
                        </div>
                      </td>
                      <td
                        className="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.description}
                      </td>
                      <td
                        className="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.hostname}
                      </td>
                      <td
                        className="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.port}
                      </td>
                      <td
                        className="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.database}
                      </td>
                      <td
                        className="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.username}
                      </td>
                      <td
                        className="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.commandTimeout}
                      </td>
                      <td
                        className="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.maxTransportObjects}
                      </td>
                      <td
                        className="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.selectedDB}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex justify-center space-x-3">
                          <CustomTooltip
                            title={
                              connection.isAdmin
                                ? "Cannot re-extract metadata for default connections"
                                : "Re-extract Metadata"
                            }
                            position="top"
                            variant="dark"
                          >
                            <button
                              onClick={() =>
                                handleReExtractMetadata(connection)
                              }
                              className="p-1.5 rounded-full focus:outline-none disabled:cursor-not-allowed transition-colors duration-200"
                              aria-label="Re-extract metadata"
                              disabled={connection.isAdmin}
                              style={{
                                color: connection.isAdmin
                                  ? theme.colors.disabled
                                  : "#10B981",
                                backgroundColor: "transparent",
                              }}
                              onMouseOver={(e) => {
                                if (!connection.isAdmin) {
                                  e.currentTarget.style.backgroundColor =
                                    theme.colors.background === "#0F172A"
                                      ? "rgba(16, 185, 129, 0.2)"
                                      : "rgba(220, 252, 231, 1)";
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                            >
                              <ClipboardList
                                size={18}
                                style={{
                                  color: connection.isAdmin
                                    ? theme.colors.disabled
                                    : "#10B981",
                                }}
                              />
                            </button>
                          </CustomTooltip>
                          <CustomTooltip
                            title={
                              connection.isAdmin
                                ? "Cannot delete default connections"
                                : "Delete Connection"
                            }
                            position="top"
                            variant="dark"
                          >
                            <button
                              onClick={() =>
                                confirmDeleteConnection(connection)
                              }
                              className="p-1.5 rounded-full focus:outline-none disabled:cursor-not-allowed transition-colors duration-200"
                              aria-label="Delete connection"
                              disabled={connection.isAdmin}
                              style={{
                                color: connection.isAdmin
                                  ? theme.colors.disabled
                                  : "#EF4444",
                                backgroundColor: "transparent",
                              }}
                              onMouseOver={(e) => {
                                if (!connection.isAdmin) {
                                  e.currentTarget.style.backgroundColor =
                                    theme.colors.background === "#0F172A"
                                      ? "rgba(239, 68, 68, 0.2)"
                                      : "rgba(254, 226, 226, 1)";
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                            >
                              <Trash2
                                size={18}
                                style={{
                                  color: connection.isAdmin
                                    ? theme.colors.disabled
                                    : "#EF4444",
                                }}
                              />
                            </button>
                          </CustomTooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
    </div>
  );
};

export default React.memo(ExistingConnections);