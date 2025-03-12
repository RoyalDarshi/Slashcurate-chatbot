import React, { useState, useEffect, useRef, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "./Loader";
import { API_URL } from "../config";
import { Trash2 } from "react-feather"; // Import the Trash2 icon

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
  const [connections, setConnections] = useState<Connection[]>([]);
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading, please wait...");
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
      setLoadingText("Fetching connections, please wait...");
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
      setLoadingText("Deleting connection, please wait...");
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
    <div className="p-6 bg-white dark:bg-gray-800">
      <ToastContainer />
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Existing Connections
      </h2>
      <div className="overflow-x-auto mb-40 relative">
        <div ref={tableContainerRef}>
          <table className="min-w-full mb-6 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
            {connections.length > 0 && (
              <>
                <thead className="bg-blue-600 dark:bg-blue-700">
                  <tr>
                    <th className="py-3 px-4 text-left text-white w-32">
                      Connection Name
                    </th>
                    <th className="py-3 px-4 text-left text-white w-48">
                      Description
                    </th>
                    <th className="py-3 px-4 text-left text-white w-32">
                      Hostname
                    </th>
                    <th className="py-3 px-4 text-left text-white w-20">
                      Port
                    </th>
                    <th className="py-3 px-4 text-left text-white w-32">
                      Database
                    </th>
                    <th className="py-3 px-4 text-left text-white w-32">
                      Username
                    </th>
                    <th className="py-3 px-4 text-left text-white w-32">
                      Command Timeout
                    </th>
                    <th className="py-3 px-4 text-left text-white w-32">
                      Max Transport Objects
                    </th>
                    <th className="py-3 px-4 text-left text-white w-32">
                      Selected DB
                    </th>
                    <th className="py-3 px-4 text-left text-white w-40">
                      Created At
                    </th>
                    <th className="py-3 px-4 text-left text-white w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((connection) => (
                    <tr
                      key={connection.connectionName}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 w-32">
                        {connection.connectionName}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 w-48">
                        {connection.description}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 w-32">
                        {connection.hostname}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 w-20">
                        {connection.port}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 w-32">
                        {connection.database}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 w-32">
                        {connection.username}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 w-32">
                        {connection.commandTimeout}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 w-32">
                        {connection.maxTransportObjects}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 w-32">
                        {connection.selectedDB}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 w-40">
                        {connection.created_at}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 w-20">
                        <button
                          onClick={() => handleDeleteConnection(connection.id)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {loading && <Loader text={loadingText} />}
          </table>
        </div>
        {connections.length === 0 && !loading && !error && (
          <div className="text-center mt-4">No connections available.</div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ExistingConnections);
