import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import { useTheme } from "../ThemeContext";


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
      className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden"
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {/* Subtle Background Effect */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.colors.accent}20, transparent 70%)`,
        }}
      ></div>

      {/* Company Logo - Top Left */}
      <div
        className="absolute top-4 left-4 flex items-center space-x-2"
        style={{ color: theme.colors.textSecondary }}
      >
        <svg
          className="h-6 w-6"
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
          className="text-base font-medium"
          style={{ fontFamily: theme.typography.fontFamily }}
        >
          SlashCurate
        </span>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <h2
          className="text-2xl font-bold text-center tracking-tight"
          style={{ color: theme.colors.text }}
        >
          {isSignup
            ? "Access Data Insights Through Text"
            : isForgotPassword
            ? "Reclaim Access"
            : "Access Your Data"}
        </h2>

        <div className="space-y-4">
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar
            closeOnClick
            pauseOnHover
            toastStyle={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderRadius: theme.borderRadius.default,
              boxShadow: theme.shadow.sm,
            }}
          />

          {isSignup && (
            <Signup
              onSignupSuccess={onLoginSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}
          {!isSignup && !isForgotPassword && (
            <Login
              onLoginSuccess={onLoginSuccess}
              onForgotPassword={handleForgotPassword}
              onSwitchToSignup={handleSwitchToSignup}
            />
          )}
          {isForgotPassword && (
            <ForgotPassword onBackToLogin={handleSwitchToLogin} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
