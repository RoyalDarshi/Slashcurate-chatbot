import { apiClient, chatbotApiClient } from "./apiClient";

export interface MessagePayload {
  session_id?: string;
  content: string;
  isBot: boolean;
  isFavorited?: boolean;
  parentId?: string | null;
  status?: string;
  timestamp?: string;
}

class ChatService {
  async askChatbot(payload: any, controller?: AbortController) {
    const response = await chatbotApiClient.post("/ask", payload, {
      signal: controller?.signal,
    });
    return response.data;
  }

  async submitFeedback(payload: any) {
    const response = await chatbotApiClient.post("/feedback", payload);
    return response.data;
  }

  // --- Message Persistence ---

  async fetchMessages(sessionId: string) {
    const response = await apiClient.post("/api/fetchmessages", { session_id: sessionId });
    return response.data;
  }

  async getMessage(messageId: string) {
    const response = await apiClient.post(`/api/getmessages/${messageId}`, {});
    return response.data;
  }

  async createMessage(payload: MessagePayload) {
    const response = await apiClient.post("/api/messages", payload);
    return response.data;
  }

  async updateMessage(messageId: string, payload: Partial<MessagePayload>) {
    const response = await apiClient.put(`/api/messages/${messageId}`, payload);
    return response.data;
  }

  async updateReaction(messageId: string, payload: { token: string; reaction: "like" | "dislike" | null; isFeedbackPositive: boolean | null; dislike_reason?: string | null }) {
    const response = await apiClient.post(`/api/messages/${messageId}/reaction`, payload);
    return response.data;
  }

  // --- Favorites ---

  async favoriteMessage(payload: any) {
    const response = await apiClient.post("/favorite", payload);
    return response.data;
  }

  async unfavoriteMessage(payload: any) {
    const response = await apiClient.post("/unfavorite", payload);
    return response.data;
  }
}

export const chatService = new ChatService();
