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
  const [loadingText, setLoadingText] = useState("Loading, please wait...");
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
      setLoadingText("Sending reset link, please wait...");
      const response = await axios.post(
        `${API_URL}/forgot-password`,
        { email: trimmedEmail },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setLoading(false);

      if (response.status === 200) {
        toast.success("Password reset email sent.");
        setTimeout(() => {
          onBackToLogin();
        }, 3000);
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

  return (
    <form onSubmit={handleForgotPassword} className="space-y-5">
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
          value={email}
          onChange={handleChange}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full p-3 rounded-md hover:opacity-90 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: theme.colors.accent,
          color: "white",
          borderRadius: theme.borderRadius.default,
          boxShadow: `0 4px 6px ${theme.colors.text}20`,
        }}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
      <button
        type="button"
        className="w-full text-sm hover:underline transition-colors text-center"
        onClick={onBackToLogin}
        style={{ color: `${theme.colors.text}80` }}
      >
        Back to Login
      </button>
      {loading && (
        <div className="flex justify-center">
          <Loader text={loadingText} />
        </div>
      )}
    </form>
  );
};

export default ForgotPassword;
