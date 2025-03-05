import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../config";

interface DecodedToken {
  name: string;
  email?: string;
  picture?: string;
}

interface GoogleLoginResponse {
  credential?: string;
}

const GoogleLoginButton: React.FC = () => {
  const handleGoogleSuccess = async (response: GoogleLoginResponse) => {
    if (!response.credential) {
      toast.error("Google login failed: No credential received.");
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(response.credential);
      console.log("Google User Info:", decoded);
      toast.success(`Welcome, ${decoded.name}!`);

      // Sending token to the backend for verification & authentication
      const res = await axios.post(`${API_URL}/google-login`, {
        token: response.credential,
      });

      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("userId", res.data.userId); // Store userId
      console.log("Backend response:", res.data);
      window.location.reload(); // Refresh the page
    } catch (error: any) {
      console.error("Error handling Google login:", error);
      toast.error(error.response?.data?.message || "Google Login Failed!"); // Improved error message
    }
  };

  const handleGoogleFailure = (error: any) => {
    console.error("Google login failed:", error);
    toast.error("Google login failed!");
  };

  return (
    <GoogleLogin
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""}
      onSuccess={handleGoogleSuccess}
      onError={handleGoogleFailure}
      // Add prompt="select_account" to force account selection every time
      // prompt="select_account"
    />
  );
};

export default GoogleLoginButton;
