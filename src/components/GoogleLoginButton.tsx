import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import axios from "axios";

const GoogleLoginButton: React.FC = () => {
  const handleGoogleSuccess = (response: { credential?: string }) => {
    interface DecodedToken {
      name: string;
      // add other properties if needed
    }
    if (response.credential) {
      const decoded = jwtDecode<DecodedToken>(response.credential);
      console.log("Google User Info:", decoded);
      toast.success(`Welcome, ${decoded.name}!`);
    } else {
      toast.error("Google login failed: No credential received.");
    }

    // If using a backend to verify the token
    axios
      .post("http://localhost:5000/google-login", {
        token: response.credential,
      })
      .then((res) => {
        sessionStorage.setItem("token", res.data.token);
      })
      .catch(() => toast.error("Google Login Failed!"));
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
