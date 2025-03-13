import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputField from "./InputField";
import PasswordField from "./PasswordField";
import Loader from "./Loader";
import { API_URL } from "../config";
import { useTheme } from "../ThemeContext";

interface LoginProps {
  onLoginSuccess: (token: string) => void;
  onForgotPassword: () => void;
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onForgotPassword,
  onSwitchToSignup,
}) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Logging in, please wait...");
  const { theme } = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value.trimStart(),
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email || !password) {
      toast.error("Email and password cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      setLoadingText("Logging in, please wait...");
      const response = await axios.post(
        `${API_URL}/login`,
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setLoading(false);

      if (response.status === 200) {
        const token = response.data.token;
        toast.success("Login successful!");
        onLoginSuccess(token);
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        toast.error(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        const errorMessage = (error as Error).message;
        toast.error(`Error: ${errorMessage}`);
      }
    }
  };

  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 750);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="space-y-4">
        <ToastContainer
          toastStyle={{
            background:
              theme.colors.background === "#f9f9f9" ? "#ffffff" : "#1e1e1e",
            color: theme.colors.text,
            border: `1px solid ${theme.colors.text}20`,
            borderRadius: theme.borderRadius.default,
          }}
        />
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-sm font-medium"
            style={{ color: theme.colors.text }}
          >
            Email Address
          </label>
          <InputField
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-medium"
            style={{ color: theme.colors.text }}
          >
            Password
          </label>
          <PasswordField
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            showPassword={showPassword}
            toggleShowPassword={handleShowPassword}
          />
        </div>
        <button
          type="submit"
          className="w-full p-2 rounded-md hover:opacity-90 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: theme.colors.accent,
            color: theme.colors.text,
            borderRadius: theme.borderRadius.default,
            boxShadow: `0 4px 6px ${theme.colors.text}20`,
          }}
          disabled={loading}
        >
          {loading ? "Logging In..." : "Log In"}
        </button>
      </form>
      <div className="flex flex-col items-center space-y-2">
        <button
          type="button"
          className="text-sm hover:underline transition-colors"
          onClick={onForgotPassword}
          style={{ color: `${theme.colors.text}80` }}
        >
          Forgot Password?
        </button>
        <button
          type="button"
          className="text-sm hover:underline transition-colors"
          onClick={onSwitchToSignup}
          style={{ color: `${theme.colors.text}80` }}
        >
          Don't have an account? Sign up
        </button>
        {loading && (
          <div className="flex justify-center pt-2">
            <Loader text={loadingText} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
