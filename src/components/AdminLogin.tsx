import React, { useState } from "react";
import { AxiosError } from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputField from "./InputField";
import PasswordField from "./PasswordField";
import { useTheme } from "../ThemeContext";
import { loginAdmin } from "../api";

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email || !password) {
      toast.error("Email and password cannot be empty.", { theme: mode });
      return;
    }

    try {
      setLoading(true);
      // const response = await axios.post(
      //   `${API_URL}/login/admin`, // Updated to match our Flask route
      //   { email, password },
      //   { headers: { "Content-Type": "application/json" } }
      // );
      const response = await loginAdmin(email, password)

       if (response.status === 200 && response.data.token) {
        const token = response.data.token;
        sessionStorage.setItem("token", token); // Store token for ExistingConnections
        toast.success("Admin login successful!", { theme: mode });
        onLoginSuccess(token);
        setFormData({ email: "", password: "" }); // Clear form
      } else {
        toast.error(`Error: ${response.data?.message || "Admin login failed"}`, {
          theme: mode,
        });
      setLoading(false);
      }
       
    } catch (error) {
      setLoading(false);
      const errorMsg =
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
        (error as Error).message ||
        "An unexpected error occurred";
      toast.error(`Error: ${errorMsg}`, { theme: mode });
    }
  };

  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 750);
  };

  // const handleForgotPassword = () => {
  //   toast.info("Admin password reset not implemented yet.", { theme: mode });
  // };

  // const handleSwitchToSignup = () => {
  //   toast.info("Admin registration not available here.", { theme: mode });
  // };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden"
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.colors.accent}20, transparent 70%)`,
        }}
      />

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
          Admin Access
        </h2>

        <div className="space-y-4">
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-semibold tracking-wide"
                style={{ color: theme.colors.text }}
              >
                Admin Email
              </label>
              <InputField
                type="email"
                name="email"
                placeholder="Enter your admin email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 text-sm border-none rounded-lg focus:ring-2 transition-all duration-200"
                style={{
                  backgroundColor: theme.colors.bubbleBot,
                  color: theme.colors.text,
                  borderRadius: theme.borderRadius.default,
                }}
                focusRingColor={theme.colors.accent}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-sm font-semibold tracking-wide"
                style={{ color: theme.colors.text }}
              >
                Admin Passcode
              </label>
              <PasswordField
                name="password"
                placeholder="Enter your admin passcode"
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
                }}
                focusRingColor={theme.colors.accent}
              />
            </div>

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
                (e.currentTarget.style.backgroundColor = `${theme.colors.accent}20`)
              }
              onMouseOut={(e) =>
                !loading &&
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              disabled={loading}
              title="Access admin panel"
            >
              {loading ? "Processing..." : "Start Managing"}
            </button>
          </form>

          {/* <div className="flex flex-col items-center space-y-2 text-sm mt-4">
            <button
              type="button"
              className="transition-all duration-200 hover:underline"
              style={{ color: theme.colors.textSecondary }}
              onClick={handleForgotPassword}
              disabled={loading}
              title="Recover your admin account"
            >
              Forgot Your Passcode?
            </button>
            <button
              type="button"
              className="transition-all duration-200 hover:underline"
              style={{ color: theme.colors.textSecondary }}
              onClick={handleSwitchToSignup}
              disabled={loading}
              title="Register as an admin (if applicable)"
            >
              New Admin? Register
            </button>
            {loading && <Loader text="Logging in..." />}
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
