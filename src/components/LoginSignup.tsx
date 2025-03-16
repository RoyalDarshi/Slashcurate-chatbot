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

const clientId = "YOUR_GOOGLE_CLIENT_ID"; // Replace with your actual Google Client ID

interface LoginSignupProps {
  onLoginSuccess: (token: string) => void;
}

const LoginSignup: React.FC<LoginSignupProps> = ({ onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { theme } = useTheme();

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
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="w-full max-w-md space-y-6">
        <div
          className="p-6 rounded-lg shadow-md space-y-6"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.default,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadow.sm,
          }}
        >
          <div className="flex justify-between items-center">
            <h2
              className="text-2xl font-semibold text-center flex-1"
              style={{
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily,
                fontWeight: theme.typography.weight.bold,
              }}
            >
              {isSignup
                ? "Sign Up"
                : isForgotPassword
                ? "Forgot Password"
                : "Log In"}
            </h2>
          </div>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar
            closeOnClick
            pauseOnHover
            toastStyle={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.default,
              boxShadow: theme.shadow.sm,
            }}
          />

          {/* Conditional Rendering */}
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

      {/* Footer Logo */}
      <footer
        className="absolute bottom-4 left-4 flex items-center space-x-2"
        style={{ color: theme.colors.textSecondary }}
      >
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
          className="text-lg font-semibold"
          style={{
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily,
            fontWeight: theme.typography.weight.bold,
          }}
        >
          YourCompany
        </span>
      </footer>
    </div>
  );
};

export default LoginSignup;
