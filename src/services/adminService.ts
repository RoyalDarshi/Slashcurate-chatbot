import { apiClient } from "./apiClient";

class AdminService {
  async getLdapConfig() {
    const response = await apiClient.post(
      "/get-ldap-config",
      {},
      { headers: { "X-Is-Admin": "true" } }
    );
    return response.data;
  }

  async storeLdapConfig(ldapConfig: object) {
    const response = await apiClient.post(
      "/ldap-config",
      { ldapConfig },
      { headers: { "X-Is-Admin": "true" } }
    );
    return response.data;
  }

  // --- User Management ---

  async getUsers() {
    const response = await apiClient.get("/api/admin/users", {
      headers: { "X-Is-Admin": "true" },
    });
    return response.data;
  }

  async createUser(userData: any) {
    const response = await apiClient.post("/api/admin/users", userData, {
      headers: { "X-Is-Admin": "true" },
    });
    return response.data;
  }

  async updateUser(userId: string, userData: any) {
    const response = await apiClient.put(`/api/admin/users/${userId}`, userData, {
      headers: { "X-Is-Admin": "true" },
    });
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await apiClient.delete(`/api/admin/users/${userId}`, {
      headers: { "X-Is-Admin": "true" },
    });
    return response.data;
  }

  async getGroups() {
    const response = await apiClient.get("/api/admin/groups", {
      headers: { "X-Is-Admin": "true" },
    });
    return response.data;
  }

  async createGroup(name: string) {
    const response = await apiClient.post("/api/admin/groups", { name }, {
      headers: { "X-Is-Admin": "true" },
    });
    return response.data;
  }

  async deleteGroup(groupId: string) {
    const response = await apiClient.delete(`/api/admin/groups/${groupId}`, {
      headers: { "X-Is-Admin": "true" },
    });
    return response.data;
  }

  async getGroupMapping(groupId: string) {
    const response = await apiClient.get(`/api/admin/groups/${groupId}/mapping`, {
      headers: { "X-Is-Admin": "true" },
    });
    return response.data;
  }

  async saveGroupMapping(groupId: string, payload: { users: string[]; connections: string[] }) {
    const response = await apiClient.put(`/api/admin/groups/${groupId}/mapping`, payload, {
      headers: { "X-Is-Admin": "true" },
    });
    return response.data;
  }
}

export const adminService = new AdminService();
