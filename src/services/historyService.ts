import { apiClient } from "./apiClient";

class HistoryService {
  async fetchSessions(filter: string) {
    const response = await apiClient.post("/api/fetchsessions", { filter });
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
    // Some endpoints may still rely on Authorization header temporarily, 
    // but interceptor injects body. We pass empty config for now, interceptor does the rest.
    const response = await apiClient.delete(`/api/sessions/${sessionId}`);
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
