import axios from "axios";
import { API_URL } from "../config";

interface UserLoginResponse {
  message: string;
  token: string;
  uid: string;
  allowed_to_create_connection: boolean;
  allowed_to_create_public_connection: boolean;
}

interface AdminLoginResponse {
  token: string;
  isAdmin: boolean;
}

class AuthService {
  private USER_TOKEN_KEY = "token";
  private ADMIN_TOKEN_KEY = "adminToken";

  // -- Login Methods --

  async loginUser(username: string, password: string): Promise<UserLoginResponse> {
    const response = await axios.post<UserLoginResponse>(
      `${API_URL}/login/user`,
      { email: username, password }, // Backend expects 'email' key even for username
      { headers: { "Content-Type": "application/json" } }
    );
    this.setToken(response.data.token, false);
    localStorage.setItem("uid", String(response.data.uid));
    localStorage.setItem("allowedToCreateConnection", String(response.data.allowed_to_create_connection));
    localStorage.setItem("allowedToCreatePublicConnection", String(response.data.allowed_to_create_public_connection));
    return response.data;
  }

  async loginAdmin(email: string, password: string): Promise<AdminLoginResponse> {
    const response = await axios.post<AdminLoginResponse>(
      `${API_URL}/login/admin`,
      { email, password },
      { headers: { "Content-Type": "application/json" } }
    );
    this.setToken(response.data.token, true);
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
      const response = await axios.post(
        `${API_URL}/validate-token`,
        { token },
        { headers: { "Content-Type": "application/json" } }
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
