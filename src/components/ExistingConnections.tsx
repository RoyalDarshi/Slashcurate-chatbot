import React, { useState, useEffect, useRef, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trash2 } from "react-feather";
import { useTheme } from "../ThemeContext";
import {
  deleteConnection,
  getAdminConnections,
  getUserConnections,
} from "../api";
import CustomTooltip from "./CustomTooltip";

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

  const handleDeleteConnection = useCallback(
    async (connectionId: number) => {
      if (!token) {
        toast.error("Authentication token not found. Please log in again.", {
          theme: mode,
        });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await deleteConnection(token, connectionId);

        if (response.status === 200) {
          toast.success("Connection deleted successfully!", { theme: mode });
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
    },
    [isAdmin, mode, fetchConnections]
  );

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchConnections();
  }, [fetchConnections]);

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
      <div className="overflow-x-auto mb-40 relative">
        <div ref={tableContainerRef} className="relative">
          <table
            className="min-w-full mb-6 rounded-lg overflow-hidden"
            style={{
              backgroundColor: theme.colors.surface,
              // border: `1px solid ${theme.colors.text}20`,
              borderRadius: theme.borderRadius.default,
            }}
          >
            {connections.length > 0 ? (
              <>
                <thead style={{ backgroundColor: theme.colors.accent }}>
                  <tr>
                    <th className="py-2 px-3 text-left text-white">
                      Connection Name
                    </th>
                    <th className="py-2 px-3 text-left text-white">
                      Description
                    </th>
                    <th className="py-2 px-3 text-left text-white">Hostname</th>
                    <th className="py-2 px-3 text-left text-white">Port</th>
                    <th className="py-2 px-3 text-left text-white">Database</th>
                    <th className="py-2 px-3 text-left text-white">Username</th>
                    <th className="py-2 px-3 text-left text-white">
                      Command Timeout
                    </th>
                    <th className="py-2 px-3 text-left text-white">
                      Max Transport Objects
                    </th>
                    <th className="py-2 px-3 text-left text-white">
                      Selected DB
                    </th>
                    <th className="py-2 px-3 text-left text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((connection, index) => (
                    <tr
                      key={connection.id}
                      className="transition-colors duration-150"
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? `${theme.colors.background}80`
                            : theme.colors.surface,
                      }}
                    >
                      <td
                        className="py-2 px-3"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.connectionName}
                      </td>
                      <td
                        className="py-2 px-3"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.description}
                      </td>
                      <td
                        className="py-2 px-3"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.hostname}
                      </td>
                      <td
                        className="py-2 px-3"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.port}
                      </td>
                      <td
                        className="py-2 px-3"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.database}
                      </td>
                      <td
                        className="py-2 px-3"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.username}
                      </td>
                      <td
                        className="py-2 px-3"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.commandTimeout}
                      </td>
                      <td
                        className="py-2 px-3"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.maxTransportObjects}
                      </td>
                      <td
                        className="py-2 px-3"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.selectedDB}
                      </td>
                      <td className="py-2 px-3">
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
                              handleDeleteConnection(connection.id)
                            }
                            className="text-red-500 hover:text-red-700 disabled:cursor-not-allowed focus:outline-none"
                            aria-label="Delete connection"
                            disabled={connection.isAdmin}
                          >
                            <Trash2
                              size={18}
                              style={{
                                color: connection.isAdmin
                                  ? theme.colors.disabled
                                  : "",
                              }}
                            />
                          </button>
                        </CustomTooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <tbody
                style={{
                  backgroundColor: theme.colors.background,
                }}
              >
                <tr>
                  <td colSpan={10} className="text-center py-4 text-gray-500">
                    <p className="mb-2">
                      Oops! No connections here. Time to create one?
                    </p>
                    <button
                      onClick={createConnection}
                      className="w-40 mx-auto block py-1.5 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: theme.colors.text,
                        backgroundColor: "transparent",
                        border: `1px solid ${theme.colors.accent}`,
                        borderRadius: theme.borderRadius.pill,
                      }}
                      onMouseOver={(e) =>
                        !loading &&
                        (e.currentTarget.style.backgroundColor = `${theme.colors.accent}20`)
                      }
                      onMouseOut={(e) =>
                        !loading &&
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      Create Connection
                    </button>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ExistingConnections);
