import { apiClient } from "./apiClient";

export interface LoginResponse {
  message: string;
  token: string;
  isAdmin: boolean;
  uid?: string;
  allowed_to_create_connection?: boolean;
  allowed_to_create_public_connection?: boolean;
}

class AuthService {
  private USER_TOKEN_KEY = "token";
  private ADMIN_TOKEN_KEY = "adminToken";

  // -- Login Methods --

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      `/login`,
      { email: username, password }
    );
    const { token, isAdmin, uid, allowed_to_create_connection, allowed_to_create_public_connection } = response.data;
    
    this.setToken(token, isAdmin);
    if (isAdmin) {
      localStorage.removeItem("uid");
      localStorage.removeItem("allowedToCreateConnection");
      localStorage.removeItem("allowedToCreatePublicConnection");
      sessionStorage.removeItem(this.USER_TOKEN_KEY);
    } else {
      localStorage.setItem("uid", String(uid));
      localStorage.setItem("allowedToCreateConnection", String(allowed_to_create_connection));
      localStorage.setItem("allowedToCreatePublicConnection", String(allowed_to_create_public_connection));
      sessionStorage.removeItem(this.ADMIN_TOKEN_KEY);
    }
    return response.data;
  }

  // -- Token Management --

  setToken(token: string, isAdmin: boolean) {
    sessionStorage.setItem(isAdmin ? this.ADMIN_TOKEN_KEY : this.USER_TOKEN_KEY, token);
  }

  getToken(isAdmin: boolean): string | null {
    return sessionStorage.getItem(isAdmin ? this.ADMIN_TOKEN_KEY : this.USER_TOKEN_KEY);
  }

  clearTokens() {
    sessionStorage.removeItem(this.USER_TOKEN_KEY);
    sessionStorage.removeItem(this.ADMIN_TOKEN_KEY);
    localStorage.removeItem("uid");
    localStorage.removeItem("allowedToCreateConnection");
    localStorage.removeItem("allowedToCreatePublicConnection");
  }

  logout() {
    this.clearTokens();
    window.location.href = "/";
  }

  // -- Validation Methods --

  async validateToken(token: string): Promise<{ valid: boolean; isAdmin: boolean }> {
    try {
      const response = await apiClient.post(
        `/validate-token`,
        { token }
      );
      return {
        valid: response.data.valid === true,
        isAdmin: response.data.isAdmin === true
      };
    } catch (error) {
      return { valid: false, isAdmin: false };
    }
  }
}

export const authService = new AuthService();
