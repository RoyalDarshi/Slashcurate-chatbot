import React, { useState } from "react";
import axios, { isAxiosError } from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputField from "./InputField";
import PasswordField from "./PasswordField";
import Loader from "./Loader";
import { API_URL } from "../config";
import { useTheme } from "../ThemeContext";

interface SignupProps {
  onSignupSuccess: (token: string) => void;
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({
  onSignupSuccess,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
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
    setFormData((prevData) => ({
      ...prevData,
      [name]: value.trimStart(),
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { first_name, last_name, email, password, confirmPassword } =
      formData;

    if (
      !first_name.trim() ||
      !last_name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      toast.error("All fields are required.", { theme: mode });
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.", { theme: mode });
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.", {
        theme: mode,
      });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_URL}/signup`,
        {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.trim(),
          password: password.trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );
      setLoading(false);

      if (res.status === 200) {
        toast.success("Signup successful!", { theme: mode });
        onSignupSuccess(res.data.token);
      } else {
        toast.error(res.data.message || "Signup failed.", { theme: mode });
      }
    } catch (err) {
      setLoading(false);
      toast.error(
        isAxiosError(err)
          ? err.response?.data?.message || err.message
          : (err as Error).message || "An unexpected error occurred",
        { theme: mode }
      );
    }
  };

  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 500);
  };

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword(true);
    setTimeout(() => setShowConfirmPassword(false), 500);
  };

  return (
    <div
      className="relative"
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      <form onSubmit={handleSignup} className="space-y-4">
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

        {/* First Name */}
        <div className="space-y-1">
          <label
            htmlFor="first_name"
            className="text-sm font-semibold tracking-wide"
            style={{ color: theme.colors.text }}
          >
            First Name
          </label>
          <InputField
            type="text"
            name="first_name"
            placeholder="Your first name"
            value={formData.first_name}
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

        {/* Last Name */}
        <div className="space-y-1">
          <label
            htmlFor="last_name"
            className="text-sm font-semibold tracking-wide"
            style={{ color: theme.colors.text }}
          >
            Last Name
          </label>
          <InputField
            type="text"
            name="last_name"
            placeholder="Your last name"
            value={formData.last_name}
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

        {/* Email */}
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
            placeholder="Your email"
            value={formData.email}
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

        {/* Password */}
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
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            showPassword={showPassword}
            toggleShowPassword={handleShowPassword}
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-transparent shadow-sm focus:border-transparent transition-all duration-200"
            style={{
              backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
              color: theme.colors.text,
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
            placeholder="Confirm it"
            value={formData.confirmPassword}
            onChange={handleChange}
            showPassword={showConfirmPassword}
            toggleShowPassword={handleShowConfirmPassword}
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-transparent shadow-sm focus:border-transparent transition-all duration-200"
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
          title="Set up your data access" // Tooltip added
        >
          {loading ? "Processing..." : "Register"}
        </button>
      </form>

      <div className="flex flex-col items-center mt-8">
        <button
          type="button"
          className="text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 opacity-60 hover:opacity-100 hover:-translate-x-1"
          style={{ color: theme.colors.textSecondary }}
          onClick={onSwitchToLogin}
          disabled={loading}
          title="Sign in with existing account" // Tooltip added
        >
          &larr; <span style={{ color: theme.colors.accent }}>Existing User?</span> Sign In
        </button>
        {loading && <Loader text="Launching..." />}
      </div>
    </div>
  );
};

export default Signup;
