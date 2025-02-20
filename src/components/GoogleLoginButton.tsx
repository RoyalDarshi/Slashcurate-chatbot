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

const GoogleLoginButton: React.FC = () => {
  const handleGoogleSuccess = async (response: { credential?: string }) => {
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
      console.log("Backend response:", res.data);
    } catch (error) {
      console.error("Error handling Google login:", error);
      toast.error("Google Login Failed!");
    }
  };

  const handleGoogleFailure = () => {
    toast.error("Google login failed!");
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={handleGoogleFailure}
    />
  );
};

export default GoogleLoginButton;
