import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams, useNavigate } from "react-router-dom";
import PasswordField from "./PasswordField";
import Loader from "./Loader";
import { API_URL } from "../config";
import { useTheme } from "../ThemeContext";

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading, please wait...");
  const { theme } = useTheme(); // Access the theme

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value.trimStart() }));
  };

  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 750);
  };

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword(true);
    setTimeout(() => setShowConfirmPassword(false), 750);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const { password, confirmPassword } = formData;
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirmPassword) {
      toast.error("Both fields are required.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setLoadingText("Resetting password, please wait...");
      const response = await axios.post(
        `${API_URL}/reset-password`,
        { password: trimmedPassword, token },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setLoading(false);
      if (response.status === 200) {
        toast.success("Password reset successful.");
        setTimeout(() => navigate("/"), 3000);
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        toast.error(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        toast.error(`Error: ${(error as Error).message}`);
      }
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen p-6"
      style={{ background: theme.colors.background }}
    >
      <div
        className="w-full max-w-md p-8 rounded-lg shadow-md"
        style={{
          background: theme.colors.surface, // Use surface color for the card
          borderRadius: theme.borderRadius.default,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <h2
          className="text-2xl font-semibold text-center mb-6"
          style={{ color: theme.colors.text }}
        >
          Reset Password
        </h2>
        <ToastContainer
          toastStyle={{
            background: theme.colors.surface,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.default,
          }}
        />
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: theme.colors.text }}
            >
              New Password
            </label>
            <PasswordField
              name="password"
              placeholder="Enter new password"
              value={formData.password}
              onChange={handleChange}
              showPassword={showPassword}
              toggleShowPassword={handleShowPassword}
              theme={theme} // Pass the theme to PasswordField
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium"
              style={{ color: theme.colors.text }}
            >
              Confirm Password
            </label>
            <PasswordField
              name="confirmPassword"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              showPassword={showConfirmPassword}
              toggleShowPassword={handleShowConfirmPassword}
              theme={theme} // Pass the theme to PasswordField
            />
          </div>
          <button
            type="submit"
            className="w-full p-3 rounded-md hover:opacity-90 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: theme.colors.accent,
              color: "white",
              borderRadius: theme.borderRadius.default,
              boxShadow: theme.shadow.md,
            }}
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <button
            type="button"
            className="w-full text-sm hover:underline transition-colors text-center"
            onClick={() => navigate("/")}
            style={{ color: theme.colors.textSecondary }}
          >
            Back to Login
          </button>
          {loading && (
            <div className="flex justify-center">
              <Loader text={loadingText} theme={theme} />{" "}
              {/* Pass the theme to Loader */}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
