import axios, { AxiosResponse } from "axios";
import {
  API_URL,
  DBCON_API_URL,
  CHATBOT_CON_DETAILS_API_URL,
  CHATBOT_API_URL,
} from "./config";

// Interfaces
interface ConnectionDetails {
  connectionName: string;
  description?: string;
  hostname: string;
  port: string;
  database: string;
  username: string;
  password: string;
  selectedDB: string;
}

interface Connection {
  id: number;
  connectionName: string;
  description: string | null;
  user_email?: string;
  isAdmin: boolean;
}

interface LoginResponse {
  token: string;
  isAdmin: boolean;
}

interface ValidateTokenResponse {
  message: string;
  valid: boolean;
  email?: string;
  isAdmin?: boolean;
}

interface ApiResponse {
  message: string;
}

interface FavouriteMessage {
  id: number;
  message: string;
  query: string;
  uid: string;
}

interface LDAPConfigResponse {
  LDAP_SERVER: string;
  LDAP_PORT: number;
  LDAP_BASE_DN: string;
  LDAP_USER_RDN: string;
}

// Axios Instances
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// const testApi = axios.create({
//   baseURL: DBCON_API_URL,
//   headers: { "Content-Type": "application/json" },
// });

const chatbotApi = axios.create({
  baseURL: CHATBOT_CON_DETAILS_API_URL,
  headers: { "Content-Type": "application/json" },
});

const chatbotMainApi = axios.create({
  baseURL: CHATBOT_API_URL,
  headers: { "Content-Type": "application/json" },
});

// API Calls
export const loginUser = async (
  email: string
): Promise<AxiosResponse<LoginResponse>> => api.post("/login/user", { email });

export const loginAdmin = async (
  email: string,
  password: string
): Promise<AxiosResponse<LoginResponse>> =>
  api.post("/login/admin", { email, password });

export const validateToken = async (
  token: string
): Promise<AxiosResponse<ValidateTokenResponse>> =>
  api.post("/validate-token", { token: token });

export const createUserConnection = async (
  token: string,
  connectionDetails: ConnectionDetails
): Promise<AxiosResponse<ApiResponse>> =>
  api.post("/connections/user/create", { token: token, connectionDetails });

export const createAdminConnection = async (
  token: string,
  connectionDetails: ConnectionDetails
): Promise<AxiosResponse<ApiResponse>> =>
  api.post("/connections/admin/create", { token: token, connectionDetails });

export const testConnection = async (
  connectionDetails: ConnectionDetails
): Promise<AxiosResponse<ApiResponse>> =>
  api.post("/testdbcon", { connectionDetails });

export const getUserConnections = async (
  token: string
): Promise<AxiosResponse<{ connections: Connection[] }>> =>
  api.post("/connections/user/list", { token: token });

export const getAdminConnections = async (
  token: string
): Promise<AxiosResponse<{ connections: Connection[] }>> =>
  api.post("/connections/admin/list", { token: token });

export const deleteConnection = async (
  token: string,
  connectionId: number
): Promise<AxiosResponse<ApiResponse>> =>
  api.post("/connections/delete", { token: token, connectionId });

// export const getFavouriteMessage=async (
//   token:string,
// ):

export const getConnectionDetails = async (
  token: string,
  selectedConnectionObj: object
): Promise<AxiosResponse<ApiResponse>> =>
  chatbotApi.post("/connection_details", {
    token,
    connection: selectedConnectionObj,
  });

export const storeLdapConfig = async (
  token: string,
  ldapConfig: object
): Promise<AxiosResponse<LDAPConfigResponse>> =>
  api.post("/ldap-config", { token: token, ldapConfig });

export const getLdapConfig = async (
  token: string
): Promise<AxiosResponse<LDAPConfigResponse>> =>
  api.post("/get-ldap-config", { token: token });

export const askChatbot = async (
  question: string,
  connection: object
): Promise<AxiosResponse<ApiResponse>> =>
  chatbotMainApi.post("/ask", {
    question: question,
    connection: connection,
  });

export const getRecommendedQuestions = async (token: string) => {
  try {
    const response = await axios.post(`${API_URL}/recommended_questions`, {
      token,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching recommended questions:", error);
    throw error;
  }
};

export const getUserSettings = async (
  token: string
): Promise<AxiosResponse<ApiResponse>> =>
  api.post(`${API_URL}/api/user/settings`, { token });

export default api;
