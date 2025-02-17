import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleLoginButton from "./GoogleLoginButton";
import LinkedInLoginButton from "./LinkedInLoginButton";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";

const clientId = "YOUR_GOOGLE_CLIENT_ID"; // Replace with actual Google Client ID

interface LoginSignupProps {
  onLoginSuccess: (token: string) => void;
}

const LoginSignup: React.FC<LoginSignupProps> = ({ onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSwitchToSignup = () => {
    setIsSignup(true);
    setIsForgotPassword(false);
  };

  const handleSwitchToLogin = () => {
    setIsSignup(false);
    setIsForgotPassword(false);
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setIsSignup(false);
  };

  return (
    
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 p-6">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full space-y-6">
          <ToastContainer />
          <h2 className="text-3xl font-bold text-white text-center">
            {isSignup
              ? "Sign Up"
              : isForgotPassword
              ? "Forgot Password"
              : "Log In"}
          </h2>
          {isSignup && (
            <Signup
              onSignupSuccess={onLoginSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}
        {!isSignup && !isForgotPassword && (
          <GoogleOAuthProvider clientId={clientId}>
            <Login
              onLoginSuccess={onLoginSuccess}
              onForgotPassword={handleForgotPassword}
              onSwitchToSignup={handleSwitchToSignup}
            />
          <div className="flex justify-center space-x-4">
            <GoogleLoginButton />
            <LinkedInLoginButton />
          </div>
          </GoogleOAuthProvider>
          )}
          {isForgotPassword && (
            <ForgotPassword onBackToLogin={handleSwitchToLogin} />
          )}
        </div>
      </div>
  );
};

export default LoginSignup;
