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
  const [loadingText, setLoadingText] = useState("Signing up...");
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
      const res = await axios.post(`${API_URL}/signup`, {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });
      setLoading(false);
      if (res.status === 200) {
        onSignupSuccess(res.data.token);
        toast.success("Signup successful!");
      } else {
        toast.error(res.data.message || "Signup failed.");
      }
    } catch (err) {
      setLoading(false);
      toast.error(
        isAxiosError(err)
          ? err.response?.data?.message || err.message
          : (err as Error).message
      );
    }
  };

  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
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
          htmlFor="name"
          className="text-sm font-medium"
          style={{ color: theme.colors.text }}
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
        />
      </div>
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
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="text-sm font-medium"
          style={{ color: theme.colors.text }}
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
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          showPassword={showConfirmPassword}
          toggleShowPassword={handleShowConfirmPassword}
        />
      </div>
      <button
        type="submit"
        className="w-full p-2 rounded-md hover:opacity-90 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: theme.colors.accent,
          color: theme.colors.text,
          borderRadius: theme.borderRadius.default,
          boxShadow: `0 4px 6px ${theme.colors.text}20`,
        }}
        disabled={loading}
      >
        {loading ? "Signing Up..." : "Sign Up"}
      </button>
      <button
        type="button"
        className="w-full text-sm hover:underline transition-colors text-center"
        onClick={onSwitchToLogin}
        style={{ color: `${theme.colors.text}80` }}
      >
        Already have an account? Log in
      </button>
      {loading && (
        <div className="flex justify-center pt-2">
          <Loader text={loadingText} />
        </div>
      )}
    </form>
  );
};

export default Signup;
