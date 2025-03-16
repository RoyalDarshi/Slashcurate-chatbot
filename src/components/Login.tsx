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
        toast.error(`Error: ${response.data.message || "Login failed"}`);
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        toast.error(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        toast.error(
          `Error: ${(error as Error).message || "An unexpected error occurred"}`
        );
      }
    }
  };

  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 750);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleLogin} className="space-y-4">
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

        {/* Email Field */}
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-sm font-medium"
            style={{
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.weight.medium,
            }}
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
            disabled={loading}
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-medium"
            style={{
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.weight.medium,
            }}
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
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full p-2 rounded-md transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: theme.colors.accent,
            color: "white",
            borderRadius: theme.borderRadius.default,
            boxShadow: theme.shadow.sm,
            transition: theme.transition.default,
          }}
          disabled={loading}
          onMouseOver={(e) =>
            !loading &&
            (e.currentTarget.style.backgroundColor = theme.colors.accentHover)
          }
          onMouseOut={(e) =>
            !loading &&
            (e.currentTarget.style.backgroundColor = theme.colors.accent)
          }
        >
          {loading ? "Logging In..." : "Log In"}
        </button>
      </form>

      {/* Links */}
      <div className="flex flex-col items-center space-y-2">
        <button
          type="button"
          className="text-sm transition-colors hover:underline"
          style={{
            color: theme.colors.textSecondary,
            transition: theme.transition.default,
          }}
          onClick={onForgotPassword}
          disabled={loading}
        >
          Forgot Password?
        </button>
        <button
          type="button"
          className="text-sm transition-colors hover:underline"
          style={{
            color: theme.colors.textSecondary,
            transition: theme.transition.default,
          }}
          onClick={onSwitchToSignup}
          disabled={loading}
        >
          Don&apos;t have an account? Sign up
        </button>
        {loading && (
          <div className="pt-2">
            <Loader text="" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
