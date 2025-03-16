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
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value.trimStart(),
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      toast.error("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (!/\S/.test(password)) {
      toast.error("Password cannot be only spaces.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_URL}/signup`,
        {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );
      setLoading(false);

      if (res.status === 200) {
        toast.success("Signup successful!");
        onSignupSuccess(res.data.token);
      } else {
        toast.error(res.data.message || "Signup failed.");
      }
    } catch (err) {
      setLoading(false);
      toast.error(
        isAxiosError(err)
          ? err.response?.data?.message || err.message
          : (err as Error).message || "An unexpected error occurred"
      );
    }
  };

  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 500); // Hide after 500ms
  };

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword(true);
    setTimeout(() => setShowConfirmPassword(false), 500); // Hide after 500ms
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSignup} className="space-y-4">
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

        {/* Name Field */}
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="text-sm font-medium"
            style={{
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.weight.medium,
            }}
          >
            Full Name
          </label>
          <InputField
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

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

        {/* Confirm Password Field */}
        <div className="space-y-1">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium"
            style={{
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.weight.medium,
            }}
          >
            Confirm Password
          </label>
          <PasswordField
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            showPassword={showConfirmPassword}
            toggleShowPassword={handleShowConfirmPassword}
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
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center">
        <button
          type="button"
          className="text-sm transition-colors hover:underline"
          style={{
            color: theme.colors.textSecondary,
            transition: theme.transition.default,
          }}
          onClick={onSwitchToLogin}
          disabled={loading}
        >
          Already have an account? Log in
        </button>
        {loading && (
          <div className="pt-2">
            <Loader text="Signing up..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
