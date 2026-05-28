import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useLocation } from "react-router-dom"; // <-- ADDED IMPORT
import InputField from "./InputField";
import PasswordField from "./PasswordField";
import { authService } from "../services/authService";
import { useTheme } from "../ThemeContext";

interface LoginProps {
  onLoginSuccess: (token: string, isAdmin: boolean) => void;
  onForgotPassword: () => void;
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onForgotPassword,
  onSwitchToSignup,
}) => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { theme } = useTheme();
  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [loginType, setLoginType] = useState<"user" | "admin">(
    queryParams.get("login") === "admin" ? "admin" : "user"
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value.trimStart(),
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = formData.username.trim();
    const password = formData.password.trim();

    if (!username || !password) {
      toast.error("Username and password cannot be empty.", { theme: mode });
      return;
    }

    try {
      setLoading(true);
      
      if (loginType === "admin") {
        const response = await authService.loginAdmin(username, password);
        toast.success("Admin login successful!", { theme: mode });
        onLoginSuccess(response.token, true);
      } else {
        const response = await authService.loginUser(username, password);
        toast.success("Login successful!", { theme: mode });
        onLoginSuccess(response.token, false);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Invalid credentials.", { theme: mode });
        } else {
          toast.error(
            `Error: ${error.response?.data?.message || error.message}`,
            { theme: mode },
          );
        }
      } else {
        toast.error(
          `Error: ${(error as Error).message || "An unexpected error occurred"}`,
          { theme: mode },
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 750);
  };

  return (
    <div
      className="relative"
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      <form onSubmit={handleLogin} className="space-y-4" id="login-form">
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

        {/* Login Type Toggle */}
        <div className="flex p-1 rounded-xl mb-6 shadow-sm" style={{ backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }}>
          <button
            type="button"
            onClick={() => setLoginType("user")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${loginType === "user" ? "shadow-md" : "opacity-60"}`}
            style={{ 
              backgroundColor: loginType === "user" ? theme.colors.surface : "transparent",
              color: loginType === "user" ? theme.colors.text : theme.colors.textSecondary 
            }}
          >
            User Login
          </button>
          <button
            type="button"
            onClick={() => setLoginType("admin")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${loginType === "admin" ? "shadow-md" : "opacity-60"}`}
            style={{ 
              backgroundColor: loginType === "admin" ? theme.colors.surface : "transparent",
              color: loginType === "admin" ? theme.colors.text : theme.colors.textSecondary 
            }}
          >
            Admin Login
          </button>
        </div>

        {/* Username / Email Field */}
        <div className="space-y-1">
          <label
            htmlFor="username"
            className="text-sm font-semibold tracking-wide"
            style={{ color: theme.colors.text }}
          >
            {loginType === "admin" ? "Admin Email" : "Username"}
          </label>
          <InputField
            type="text"
            name="username"
            placeholder={loginType === "admin" ? "admin@company.com" : "john_doe"}
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-transparent shadow-sm focus:border-transparent transition-all"
            style={{
              backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
              color: theme.colors.text,
              focusRingColor: theme.colors.accent,
            }}
            autoComplete="username"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-semibold tracking-wide"
            style={{ color: theme.colors.text }}
          >
            Passcode
          </label>
          <PasswordField
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            showPassword={showPassword}
            toggleShowPassword={handleShowPassword}
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm border border-transparent shadow-sm rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{
              backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
              color: theme.colors.text,
              focusRingColor: theme.colors.accent,
            }}
            type="password"
            autoComplete="current-password"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full shadow-lg block py-3 mt-6 text-sm font-semibold tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
          style={{
            color: '#fff',
            background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`,
            borderRadius: '12px',
            boxShadow: `0 8px 20px -6px ${theme.colors.accent}80`
          }}
          disabled={loading}
          title="Access your cosmic account"
        >
          {loading ? "Processing..." : "Start Analyzing"}
        </button>
      </form>



      {/* Links (Currently Commented Out) */}
      {/* <div className="flex flex-col items-center space-y-2 text-sm mt-4">
        <button
          type="button"
          className="transition-all duration-200 hover:underline"
          style={{ color: theme.colors.textSecondary }}
          onClick={onForgotPassword}
          disabled={loading}
          title="Recover your account" // Tooltip added
        >
          Forgot Your Passcode?
        </button>
        <button
          type="button"
          className="transition-all duration-200 hover:underline"
          style={{ color: theme.colors.textSecondary }}
          onClick={onSwitchToSignup}
          disabled={loading}
          title="Create a new account" // Tooltip added
        >
          New User? Register
        </button>
        {loading && <Loader text="Almost there, please wait..." />}
      </div> */}
    </div>
  );
};

export default Login;
