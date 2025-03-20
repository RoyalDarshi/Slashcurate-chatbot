export const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL ?? "http://";
export const API_HOST = import.meta.env.VITE_API_HOST ?? "localhost";
export const API_PORT = import.meta.env.VITE_API_PORT ?? "5000";

export const DBCON_API_PROTOCOL =
  import.meta.env.VITE_DBCON_API_PROTOCOL ?? "http://";
export const DBCON_API_HOST =
  import.meta.env.VITE_DBCON_API_HOST ?? "localhost";
export const DBCON_API_PORT = import.meta.env.VITE_DBCON_API_PORT ?? "5000";

export const ADMIN_API_PROTOCOL =
  import.meta.env.VITE_ADMIN_API_PROTOCOL ?? "http://";
export const ADMIN_API_HOST =
  import.meta.env.VITE_ADMIN_API_HOST ?? "localhost";
export const ADMIN_API_PORT = import.meta.env.VITE_ADMIN_API_PORT ?? "5002";

export const CHATBOT_API_PROTOCOL =
  import.meta.env.VITE_CHATBOT_API_PROTOCOL ?? "http://";
export const CHATBOT_API_HOST =
  import.meta.env.VITE_CHATBOT_API_HOST ?? "localhost";
export const CHATBOT_API_PORT =
  import.meta.env.VITE_CHATBOT_API_PORT_CHATBOT ?? "5000";

export const CHATBOT_CON_DETAILS_API_PROTOCOL =
  import.meta.env.VITE_CON_DETAILS_API_PROTOCOL ?? "http://";
export const CHATBOT_CON_DETAILS_API_HOST =
  import.meta.env.VITE_CON_DETAILS_API_HOST ?? "localhost";
export const CHATBOT_CON_DETAILS_API_PORT =
  import.meta.env.VITE_CON_DETAILS_API_PORT ?? "5000";

export const API_URL = `${API_PROTOCOL}${API_HOST}:${API_PORT}`;

export const DBCON_API_URL = `${DBCON_API_PROTOCOL}${DBCON_API_HOST}:${DBCON_API_PORT}`;

export const ADMIN_API_URL = `${ADMIN_API_PROTOCOL}${ADMIN_API_HOST}:${ADMIN_API_PORT}`;

export const CHATBOT_API_URL = `${CHATBOT_API_PROTOCOL}${CHATBOT_API_HOST}:${CHATBOT_API_PORT}`;

export const CHATBOT_CON_DETAILS_API_URL = `${CHATBOT_CON_DETAILS_API_PROTOCOL}${CHATBOT_CON_DETAILS_API_HOST}:${CHATBOT_CON_DETAILS_API_PORT}`;
