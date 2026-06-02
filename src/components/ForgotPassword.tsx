import React, { useState } from "react";
import axios from "axios";
import InputField from "./InputField";
import Loader from "./Loader";
import { API_URL } from "../config";
import { useTheme } from "../ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.trimStart());
    if (error) setError(null);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}/forgot-password`,
        { email: trimmedEmail },
        { headers: { "Content-Type": "application/json" } }
      );
      setLoading(false);

      if (response.status === 200) {
        toast.success("Password reset email sent.", { theme: theme.mode === "dark" ? "dark" : "light" });
        setTimeout(() => onBackToLogin(), 3000);
      } else {
        setError(response.data.message || "Failed to request password reset.");
      }
    } catch (err) {
      setLoading(false);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || "Failed to send reset link.");
      } else {
        setError((err as Error).message || "An unexpected error occurred");
      }
    }
  };

  return (
    <div
      className="relative"
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="flex items-start gap-3 p-3.5 rounded-xl border text-xs font-semibold leading-relaxed overflow-hidden"
              style={{
                backgroundColor: theme.mode === "dark" ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.04)",
                borderColor: theme.mode === "dark" ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.15)",
                color: theme.mode === "dark" ? "#F87171" : "#DC2626",
              }}
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
              <div className="flex-grow">{error}</div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-transparent shadow-sm focus:border-transparent transition-all"
            style={{
              backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
              color: theme.colors.text,
              focusRingColor: theme.colors.accent,
            }}
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
          title="Send a reset link to your email" // Tooltip added
        >
          {loading ? "Processing..." : "Request Reset Link"}
        </button>
      </form>

      <div className="flex flex-col items-center mt-8">
        <button
          type="button"
          className="text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 opacity-60 hover:opacity-100 hover:-translate-x-1"
          style={{ color: theme.colors.textSecondary }}
          onClick={onBackToLogin}
          disabled={loading}
          title="Return to login screen" // Tooltip added
        >
          &larr; Return to Sign In
        </button>
        {loading && <Loader text="Sending..." />}
      </div>
    </div>
  );
};

export default ForgotPassword;
