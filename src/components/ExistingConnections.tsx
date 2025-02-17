import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ExistingConnections: React.FC = () => {
  interface Connection {
    applicationName: string;
    clientAccountingInformation: string;
    clientHostname: string;
    clientUser: string;
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
  }

  const [connections, setConnections] = useState<Connection[]>([]);
  const fetched = useRef(false); // Prevents duplicate API calls

  useEffect(() => {
    if (fetched.current) return; // If already fetched, do nothing
    fetched.current = true;

    const fetchConnections = async () => {
      const userId = sessionStorage.getItem("userId");
      if (!userId) {
        toast.error("User ID not found. Please log in again.");
        return;
      }

      try {
        const response = await axios.post(
          "http://localhost:5000/getuserconnections",
          {
            userId,
          }
        );
        setConnections(response.data.connections);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(
            `Error: ${error.response?.data?.message || error.message}`
          );
        } else {
          toast.error(`Error: ${(error as Error).message}`);
        }
      }
    };

    fetchConnections();
  }, []); // Runs only once due to useRef

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <ToastContainer />
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Existing Connections
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Connection Name
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Description
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Hostname
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Port
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Database
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Username
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Application Name
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Client Accounting Information
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Client Hostname
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Client User
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Command Timeout
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Max Transport Objects
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                Selected DB
              </th>
            </tr>
          </thead>
          <tbody>
            {connections.map((connection) => (
              <tr
                key={connection.connectionName}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.connectionName}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.description}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.hostname}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.port}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.database}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.username}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.applicationName}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.clientAccountingInformation}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.clientHostname}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.clientUser}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.commandTimeout}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.maxTransportObjects}
                </td>
                <td className="py-3 px-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {connection.selectedDB}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(ExistingConnections);
