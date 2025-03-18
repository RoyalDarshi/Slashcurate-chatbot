import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputField from "./InputField";
import Loader from "./Loader";
import { API_URL } from "../config";
import { useTheme } from "../ThemeContext";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.trimStart());
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Email is required.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/forgot-password`,
        { email: trimmedEmail },
        { headers: { "Content-Type": "application/json" } }
      );
      setLoading(false);

      if (response.status === 200) {
        toast.success("Password reset email sent.");
        setTimeout(() => onBackToLogin(), 3000);
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
      className="relative"
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      <form onSubmit={handleForgotPassword} className="space-y-4">
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
            Email Address
          </label>
          <InputField
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleChange}
            required
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
          title="Send a reset link to your email" // Tooltip added
        >
          {loading ? "Processing..." : "Transmit Signal"}
        </button>
      </form>

      {/* Back to Login */}
      <div className="text-center text-sm mt-4">
        <button
          type="button"
          className="transition-all duration-200 hover:underline"
          style={{ color: theme.colors.textSecondary }}
          onClick={onBackToLogin}
          disabled={loading}
          title="Return to login screen" // Tooltip added
        >
          Return to Galaxy
        </button>
        {loading && <Loader text="Sending..." />}
      </div>
    </div>
  );
};

export default ForgotPassword;
