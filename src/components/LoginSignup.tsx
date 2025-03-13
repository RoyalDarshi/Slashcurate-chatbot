import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleLoginButton from "./GoogleLoginButton";
import LinkedInLoginButton from "./LinkedInLoginButton";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import { useTheme } from "../ThemeContext";

const clientId =
  process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

interface LoginSignupProps {
  onLoginSuccess: (token: string) => void;
}

const LoginSignup: React.FC<LoginSignupProps> = ({ onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { theme, toggleTheme, themeKey } = useTheme();

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
    <div
      className="min-h-screen flex flex-col justify-center items-center p-6 relative"
      style={{ background: theme.colors.background }}
    >
      <div className="w-full max-w-md space-y-4">
        <div
          className="p-6 rounded-lg shadow-md space-y-4"
          style={{
            background:
              theme.colors.background === "#f9f9f9" ? "#ffffff" : "#1e1e1e",
            borderRadius: theme.borderRadius.default,
            border: `1px solid ${theme.colors.text}20`,
          }}
        >
          <div className="flex justify-between items-center">
            <h2
              className="text-2xl font-semibold text-center flex-1"
              style={{ color: theme.colors.text }}
            >
              {isSignup
                ? "Sign Up"
                : isForgotPassword
                ? "Forgot Password"
                : "Log In"}
            </h2>
            <button
              onClick={toggleTheme}
              className="text-sm hover:underline transition-colors"
              style={{ color: theme.colors.accent }}
              aria-label={`Switch to ${
                themeKey === "dark" ? "light" : "dark"
              } mode`}
            >
              {themeKey === "dark" ? "Light" : "Dark"}
            </button>
          </div>
          <ToastContainer
            toastStyle={{
              background:
                theme.colors.background === "#f9f9f9" ? "#ffffff" : "#1e1e1e",
              color: theme.colors.text,
              border: `1px solid ${theme.colors.text}20`,
            }}
          />
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
              <div className="flex justify-center space-x-4 mt-4">
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
      {/* Logo Placeholder at Bottom-Left */}
      <div className="absolute bottom-4 left-4 flex items-center">
        {/* Replace with your actual logo image */}
        {/* <img src="/assets/logo.png" alt="Company Logo" className="h-8 w-auto" /> */}
        <svg
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span
          className="ml-2 text-lg font-semibold"
          style={{ color: theme.colors.text }}
        >
          YourCompany
        </span>
      </div>
    </div>
  );
};

export default LoginSignup;
