import React, { useState, useEffect, useRef, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "./Loader";
import { API_URL } from "../config";
import { Trash2 } from "react-feather"; // Import the Trash2 icon
import { useTheme } from "../ThemeContext";

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
}

const ExistingConnections: React.FC = () => {
  const { theme } = useTheme();
  const [connections, setConnections] = useState<Connection[]>([]);
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const fetchConnections = useCallback(async () => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post<{ connections: Connection[] }>(
        `${API_URL}/getuserconnections`,
        {
          userId,
        }
      );

      if (
        !response.data.connections ||
        response.data.connections.length === 0
      ) {
        setError("No connections found.");
        setLoading(false);
        return;
      }

      setConnections(response.data.connections);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        toast.error(
          `Error: ${axiosError.response?.data?.message ?? axiosError.message}`
        );
        setError(axiosError.response?.data?.message ?? axiosError.message);
      } else {
        toast.error(`Error: ${(error as Error).message}`);
        setError((error as Error).message);
      }
    }
  }, []);

  const handleDeleteConnection = async (connectionId: number) => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await axios.post(`${API_URL}/deleteuserconnection`, {
        userId,
        connectionId,
      });
      toast.success("Connection deleted successfully!");
      // Refresh connections after deletion
      fetchConnections();
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        toast.error(
          `Error: ${axiosError.response?.data?.message ?? axiosError.message}`
        );
        setError(axiosError.response?.data?.message ?? axiosError.message);
      } else {
        toast.error(`Error: ${(error as Error).message}`);
        setError((error as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchConnections();
  }, [fetchConnections]);

  return (
    <div
      className="p-6 rounded-lg shadow-md h-full overflow-y-auto"
      style={{
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.text}20`,
        borderRadius: theme.borderRadius.default,
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
            className="min-w-full mb-6 rounded-lg overflow-hidden shadow-sm"
            style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.text}20`,
              borderRadius: theme.borderRadius.default,
            }}
          >
            {connections.length > 0 && (
              <>
                <thead
                  style={{
                    backgroundColor: theme.colors.accent,
                  }}
                >
                  <tr>
                    <th className="py-2 px-3 text-left w-32 text-white">
                      Connection Name
                    </th>
                    <th className="py-2 px-3 text-left w-48 text-white">
                      Description
                    </th>
                    <th className="py-2 px-3 text-left w-32 text-white">
                      Hostname
                    </th>
                    <th className="py-2 px-3 text-left w-20 text-white">
                      Port
                    </th>
                    <th className="py-2 px-3 text-left w-32 text-white">
                      Database
                    </th>
                    <th className="py-2 px-3 text-left w-32 text-white">
                      Username
                    </th>
                    <th className="py-2 px-3 text-left w-32 text-white">
                      Command Timeout
                    </th>
                    <th className="py-2 px-3 text-left w-32 text-white">
                      Max Transport Objects
                    </th>
                    <th className="py-2 px-3 text-left w-32 text-white">
                      Selected DB
                    </th>
                    <th className="py-2 px-3 text-left w-40 text-white">
                      Created At
                    </th>
                    <th className="py-2 px-3 text-left w-20 sticky right-0 bg-inherit text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((connection, index) => (
                    <tr
                      key={connection.connectionName}
                      className="transition-colors duration-150"
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? `${theme.colors.background}80`
                            : theme.colors.surface,
                      }}
                    >
                      <td
                        className="py-2 px-3 w-32"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.connectionName}
                      </td>
                      <td
                        className="py-2 px-3 w-48"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.description}
                      </td>
                      <td
                        className="py-2 px-3 w-32"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.hostname}
                      </td>
                      <td
                        className="py-2 px-3 w-20"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.port}
                      </td>
                      <td
                        className="py-2 px-3 w-32"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.database}
                      </td>
                      <td
                        className="py-2 px-3 w-32"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.username}
                      </td>
                      <td
                        className="py-2 px-3 w-32"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.commandTimeout}
                      </td>
                      <td
                        className="py-2 px-3 w-32"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.maxTransportObjects}
                      </td>
                      <td
                        className="py-2 px-3 w-32"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.selectedDB}
                      </td>
                      <td
                        className="py-2 px-3 w-40"
                        style={{ color: theme.colors.text }}
                      >
                        {connection.created_at}
                      </td>
                      <td
                        className="py-2 px-3 w-20 sticky right-0 bg-inherit"
                        style={{ backgroundColor: "inherit" }}
                      >
                        <button
                          onClick={() => handleDeleteConnection(connection.id)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                          aria-label="Delete connection"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {loading && <Loader text={""} />}
          </table>
        </div>
        {connections.length === 0 && !loading && !error && (
          <div
            className="text-center mt-4"
            style={{ color: theme.colors.text }}
          >
            No connections available.
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ExistingConnections);
