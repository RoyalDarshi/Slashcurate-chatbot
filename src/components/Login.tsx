import React, { useState, useRef } from "react";
import axios from "axios";
import { authService } from "../services/authService";
import { useTheme } from "../ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, User, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (token: string, isAdmin: boolean) => void;
  onForgotPassword: () => void;
  onSwitchToSignup: () => void;
}

// Modern floating-label input with icon
interface FloatingInputProps {
  id: string;
  name: string;
  type: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  icon: React.ReactNode;
  autoComplete?: string;
  rightElement?: React.ReactNode;
  accentColor: string;
  isDark: boolean;
  textColor: string;
  textSecondary: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  id, name, type, label, value, onChange, disabled, icon,
  autoComplete, rightElement, accentColor, isDark, textColor, textSecondary,
}) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div className="relative group">
      {/* Glow ring on focus */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-300"
        style={{
          boxShadow: focused ? `0 0 0 3px ${accentColor}30, 0 0 20px ${accentColor}15` : "none",
        }}
      />

      {/* Container */}
      <div
        className="relative flex items-center rounded-xl transition-all duration-200"
        style={{
          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          border: `1px solid ${focused ? accentColor + "60" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        }}
      >
        {/* Left Icon */}
        <div
          className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-200"
          style={{ color: focused ? accentColor : textSecondary, opacity: focused ? 1 : 0.5 }}
        >
          {icon}
        </div>

        {/* Input */}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder=" "
          className="peer w-full pl-10 pr-11 pt-5 pb-2 text-sm bg-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: textColor, fontFamily: "inherit" }}
        />

        {/* Floating label */}
        <label
          htmlFor={id}
          className="absolute left-10 transition-all duration-200 pointer-events-none select-none"
          style={{
            top: isActive ? "8px" : "50%",
            transform: isActive ? "none" : "translateY(-50%)",
            fontSize: isActive ? "10px" : "13px",
            fontWeight: isActive ? 600 : 400,
            color: focused ? accentColor : textSecondary,
            letterSpacing: isActive ? "0.04em" : "0",
            textTransform: isActive ? "uppercase" : "none",
          }}
        >
          {label}
        </label>

        {/* Right element (e.g. show/hide toggle) */}
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  );
};

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onForgotPassword }) => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buttonHovered, setButtonHovered] = useState(false);

  const { theme } = useTheme();
  const isDark = theme.mode === "dark";
  const accentColor = theme.colors.accent;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.trimStart() }));
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = formData.username.trim();
    const password = formData.password.trim();

    if (!username || !password) {
      setError("Username and passcode cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(username, password);
      onLoginSuccess(response.token, response.isAdmin);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError("Invalid username or passcode. Please check your credentials and try again.");
        } else {
          setError(err.response?.data?.message || err.message || "An unexpected error occurred during authentication.");
        }
      } else {
        setError((err as Error).message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4" id="login-form" noValidate>
      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-start gap-3 p-3.5 rounded-xl text-xs font-medium leading-relaxed"
              style={{
                background: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.05)",
                border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.15)"}`,
                color: isDark ? "#F87171" : "#DC2626",
              }}
            >
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1">{error}</div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Username */}
      <FloatingInput
        id="username"
        name="username"
        type="text"
        label="Username or Email"
        value={formData.username}
        onChange={handleChange}
        disabled={loading}
        icon={<User size={15} />}
        autoComplete="username"
        accentColor={accentColor}
        isDark={isDark}
        textColor={theme.colors.text}
        textSecondary={theme.colors.textSecondary}
      />

      {/* Password */}
      <FloatingInput
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        label="Passcode"
        value={formData.password}
        onChange={handleChange}
        disabled={loading}
        icon={<Lock size={15} />}
        autoComplete="current-password"
        accentColor={accentColor}
        isDark={isDark}
        textColor={theme.colors.text}
        textSecondary={theme.colors.textSecondary}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={loading}
            className="p-1 rounded-lg transition-colors duration-150"
            style={{ color: theme.colors.textSecondary }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
        className="relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: loading
            ? `${accentColor}90`
            : `linear-gradient(135deg, ${accentColor} 0%, ${theme.colors.accentHover} 100%)`,
          boxShadow: buttonHovered && !loading
            ? `0 12px 30px -8px ${accentColor}80, 0 0 0 1px ${accentColor}40`
            : `0 6px 20px -6px ${accentColor}60`,
          transform: buttonHovered && !loading ? "translateY(-1px)" : "translateY(0)",
        }}
      >
        {/* Shimmer overlay */}
        {!loading && (
          <div
            className="absolute inset-0 login-shimmer pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)" }}
          />
        )}

        <span className="relative flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white/80" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </span>
      </button>
    </form>
  );
};

export default Login;
