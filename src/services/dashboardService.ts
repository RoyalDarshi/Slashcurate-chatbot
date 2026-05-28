import { chatbotApiClient } from "./apiClient";

class DashboardService {
  async getRecommendedQuestions(payload: any) {
    const response = await chatbotApiClient.post("/recommend_questions", payload);
    return response.data;
  }
}

export const dashboardService = new DashboardService();
