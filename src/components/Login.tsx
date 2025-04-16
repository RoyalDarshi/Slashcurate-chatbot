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
  const { theme } = useTheme();
  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";

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
      toast.error("Email and password cannot be empty.", { theme: mode });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/login/user`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      setLoading(false);

      if (response.status === 200) {
        const token = response.data.token;
        toast.success("Login successful!", { theme: mode });
        onLoginSuccess(token);
      } else {
        toast.error(`Error: ${response.data.message || "Login failed"}`, {
          theme: mode,
        });
      }
      if (response.status === 401) {
        toast.error("Invalid email or password.", { theme: mode });
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        toast.error(
          `Error: ${error.response?.data?.message || error.message}`,
          { theme: mode }
        );
      } else {
        toast.error(
          `Error: ${
            (error as Error).message || "An unexpected error occurred"
          }`,
          { theme: mode }
        );
      }
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
      <form onSubmit={handleLogin} className="space-y-4">
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

        {/* Email Field */}
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-sm font-semibold tracking-wide"
            style={{ color: theme.colors.text }}
          >
            Username
          </label>
          <InputField
            type="text"
            name="email"
            placeholder="Enter your username"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-3 py-2 text-sm rounded-lg"
            style={{
              backgroundColor: theme.colors.bubbleBot,
              color: theme.colors.text,
              borderRadius: theme.borderRadius.default,
              focusRingColor: theme.colors.accent,
            }}
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
            placeholder="Enter your passcode"
            value={formData.password}
            onChange={handleChange}
            showPassword={showPassword}
            toggleShowPassword={handleShowPassword}
            disabled={loading}
            className="w-full px-3 py-2 text-sm border-none rounded-lg focus:ring-2 transition-all duration-200"
            style={{
              backgroundColor: theme.colors.bubbleBot,
              color: theme.colors.text,
              borderRadius: theme.borderRadius.default,
              focusRingColor: theme.colors.accent,
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-32 mx-auto block py-1.5 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: theme.colors.text,
            backgroundColor: "transparent",
            border: `1px solid ${theme.colors.accent}`,
            borderRadius: theme.borderRadius.pill,
          }}
          onMouseOver={(e) =>
            !loading &&
            (e.currentTarget.style.backgroundColor =
              theme.colors.accentHover + "20")
          }
          onMouseOut={(e) =>
            !loading && (e.currentTarget.style.backgroundColor = "transparent")
          }
          disabled={loading}
          title="Access your cosmic account" // Tooltip added
        >
          {loading ? "Processing..." : "Start Analyzing"}
        </button>
      </form>

      {/* Links */}
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
