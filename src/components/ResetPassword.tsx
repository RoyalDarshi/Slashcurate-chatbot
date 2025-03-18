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
  const { theme } = useTheme();
  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";

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
      toast.error("Both fields are required.", { theme: mode });
      return;
    }
    if (trimmedPassword !== trimmedConfirmPassword) {
      toast.error("Passwords do not match.", { theme: mode });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/reset-password`,
        { password: trimmedPassword, token },
        { headers: { "Content-Type": "application/json" } }
      );
      setLoading(false);
      if (response.status === 200) {
        toast.success("Password reset successful.", { theme: mode });
        setTimeout(() => navigate("/"), 3000);
      } else {
        toast.error(`Error: ${response.data.message}`, { theme: mode });
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        toast.error(
          `Error: ${error.response?.data?.message || error.message}`,
          { theme: mode }
        );
      } else {
        toast.error(`Error: ${(error as Error).message}`, { theme: mode });
      }
    }
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
          Reclaim Access
        </h2>

        <div
          className="relative"
          style={{ fontFamily: theme.typography.fontFamily }}
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
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

            {/* New Password */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-sm font-semibold tracking-wide"
                style={{ color: theme.colors.text }}
              >
                New Passcode
              </label>
              <PasswordField
                name="password"
                placeholder="Enter new password"
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

            {/* Confirm Password */}
            <div className="space-y-1">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-semibold tracking-wide"
                style={{ color: theme.colors.text }}
              >
                Confirm Passcode
              </label>
              <PasswordField
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                showPassword={showConfirmPassword}
                toggleShowPassword={handleShowConfirmPassword}
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
                !loading &&
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              disabled={loading}
              title="Update your password" // Tooltip added
            >
              {loading ? "Processing..." : "Reset Passcode"}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center text-sm mt-4">
            <button
              type="button"
              className="transition-all duration-200 hover:underline"
              style={{ color: theme.colors.textSecondary }}
              onClick={() => navigate("/")}
              disabled={loading}
              title="Go back to login" // Tooltip added
            >
              Go back to login
            </button>
            {loading && <Loader text="Resetting..." />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
