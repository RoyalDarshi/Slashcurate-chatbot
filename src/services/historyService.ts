import { apiClient } from "./apiClient";

export interface FetchSessionsOptions {
  filter?: string;
  connection_name?: string;
  con_id?: number;
}

class HistoryService {
  async fetchSessions(filter: string, connectionName?: string, conId?: number) {
    const payload: FetchSessionsOptions = { filter };
    if (connectionName) payload.connection_name = connectionName;
    if (conId !== undefined) payload.con_id = conId;
    const response = await apiClient.post("/api/fetchsessions", payload);
    return response.data;
  }

  async getSession(sessionId: string) {
    const response = await apiClient.get(`/api/sessions/${sessionId}`);
    return response.data;
  }

  async createSession(payload: any) {
    const response = await apiClient.post("/api/sessions", payload);
    return response.data;
  }

  async deleteSession(sessionId: string) {
    const response = await apiClient.delete(`/api/sessions/${sessionId}`);
    return response.data;
  }

  async togglePin(sessionId: string) {
    const response = await apiClient.post(`/api/sessions/${sessionId}/pin`);
    return response.data;
  }

  async bulkDelete(sessionIds: string[]) {
    const response = await apiClient.post("/api/sessions/bulk-delete", { session_ids: sessionIds });
    return response.data;
  }

  async fetchFavourites() {
    const response = await apiClient.post("/favorites", {});
    return response.data;
  }

  async deleteFavourite(questionId: string, connection: string | null) {
    const response = await apiClient.post("/favorite/delete", {
      questionId,
      selectedConnection: connection,
    });
    return response.data;
  }

  async updateSessionTitle(sessionId: string, title: string) {
    const response = await apiClient.put(`/api/sessions/${sessionId}`, { title });
    return response.data;
  }
}

export const historyService = new HistoryService();
