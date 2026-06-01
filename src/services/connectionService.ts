import { apiClient } from "./apiClient";
import { DatabaseSchema } from "../types";

export interface ConnectionDetails {
  connectionName: string;
  description?: string;
  hostname: string;
  port: string;
  database: string;
  username: string;
  password?: string;
  selectedDB: string;
}

export interface Connection {
  id: number;
  connectionName: string;
  description: string | null;
  user_email?: string;
  isAdmin: boolean;
  uid?: string;
  isPublic?: boolean;
}

class ConnectionService {
  async getUserConnections() {
    const response = await apiClient.post<{ connections: Connection[] }>(
      "/connections/user/list",
      {}
    );
    return response.data;
  }

  async getAdminConnections() {
    const response = await apiClient.post<{ connections: Connection[] }>(
      "/connections/admin/list",
      {},
      { headers: { "X-Is-Admin": "true" } }
    );
    return response.data;
  }

  async createUserConnection(connectionDetails: ConnectionDetails) {
    const response = await apiClient.post(
      "/connections/user/create",
      { connectionDetails }
    );
    return response.data;
  }

  async createAdminConnection(connectionDetails: ConnectionDetails) {
    const response = await apiClient.post(
      "/connections/admin/create",
      { connectionDetails },
      { headers: { "X-Is-Admin": "true" } }
    );
    return response.data;
  }

  async updateConnection(connectionId: number, connectionDetails: ConnectionDetails, isAdmin: boolean) {
    const response = await apiClient.post(
      "/connections/update",
      { connectionId, connectionDetails },
      { headers: isAdmin ? { "X-Is-Admin": "true" } : {} }
    );
    return response.data;
  }

  async deleteConnection(connectionId: number, isAdmin: boolean) {
    const response = await apiClient.post(
      "/connections/delete",
      { connectionId },
      { headers: isAdmin ? { "X-Is-Admin": "true" } : {} }
    );
    return response.data;
  }

  async downloadDataAtlas(connectionName: string) {
    const response = await apiClient.get(`/api/data-atlas/${connectionName}`, {
      responseType: "blob",
    });
    return response.data;
  }

  async testConnection(connectionDetails: ConnectionDetails, isAdmin: boolean) {
    const response = await apiClient.post(
      "/testdbcon",
      { connectionDetails },
      { headers: isAdmin ? { "X-Is-Admin": "true" } : {} }
    );
    return response.data;
  }

  async reExtractMetadata(connectionDetails: ConnectionDetails) {
    const { chatbotApiClient } = await import("./apiClient");
    const response = await chatbotApiClient.post(
      "/meta_data",
      {
        connection: connectionDetails,
        isEncrypted: true,
      }
    );
    return response.data;
  }

  /**
   * Fetch the real database schema (schemas → tables → columns) for a saved connection.
   * @param connectionId - The numeric ID of the connection stored in the DB
   */
  async getSchema(connectionId: number | string): Promise<DatabaseSchema[]> {
    const response = await apiClient.post<{ schemas: DatabaseSchema[] }>(
      "/api/schema",
      { connectionId }
    );
    return response.data.schemas;
  }
}

export const connectionService = new ConnectionService();
