import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import InputField from "./InputField";
import PasswordField from "./PasswordField";
import { useTheme } from "../ThemeContext";
import { loginAdmin } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

import React, { useState, useEffect } from "react";

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";
  
  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value.trimStart(),
    }));
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email || !password) {
      setError("Admin email and password cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await loginAdmin(email, password);

      if (response.status === 200 && response.data.token) {
        const token = response.data.token;
        sessionStorage.setItem("token", token);
        toast.success("Admin login successful!", { theme: theme.mode === "dark" ? "dark" : "light" });
        onLoginSuccess(token);
        setFormData({ email: "", password: "" });
      } else {
        setError(response.data?.message || "Admin login failed");
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      const errorMsg =
        (err as AxiosError<{ message?: string }>).response?.data?.message ||
        (err as Error).message ||
        "An unexpected error occurred";
      setError(errorMsg);
    }
  };

  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 750);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden"
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {/* LEFT SIDE - VISUALS */}
      <div 
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background: theme.mode === 'dark' 
            ? 'linear-gradient(135deg, #020617 0%, #0f172a 100%)' 
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRight: `1px solid ${theme.colors.border}`,
        }}
      >
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
        <div 
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full mix-blend-screen opacity-60 animate-blob"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.accent}, transparent)`,
            filter: 'blur(20px)',
            animation: 'blob 7s infinite alternate'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full mix-blend-screen opacity-40 animate-blob animation-delay-2000"
          style={{
            background: `linear-gradient(135deg, ${theme.mode === 'dark' ? '#f43f5e' : '#fb923c'}, transparent)`,
            filter: 'blur(30px)',
            animation: 'blob 10s infinite alternate-reverse'
          }}
        />

        <div 
          className="absolute inset-0 opacity-60 blur-[90px] pointer-events-none transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle at ${mousePos.x * 0.4}px ${mousePos.y * 0.4}px, ${theme.colors.accent}60, transparent 45%),
                         radial-gradient(circle at ${window.innerWidth * 0.5 - mousePos.x * 0.3}px ${window.innerHeight * 0.5 - mousePos.y * 0.3}px, ${theme.mode === 'dark' ? '#f43f5e50' : '#fb923c50'}, transparent 45%)`
          }}
        />
        
        <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%239C92AC' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }} />

        <div className="absolute top-1/3 right-12 w-64 h-40 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl p-5 transform rotate-6 animate-float"
          style={{ background: 'rgba(255,255,255,0.03)', animation: 'float 6s ease-in-out infinite' }}
        >
          <div className="w-full h-3 rounded-full bg-white/10 mb-3" />
          <div className="w-3/4 h-3 rounded-full bg-white/10 mb-6" />
          <div className="flex items-end gap-2 h-16">
            <div className="w-1/4 h-full rounded-t-sm bg-gradient-to-t from-orange-500/50 to-transparent" />
            <div className="w-1/4 h-3/4 rounded-t-sm bg-gradient-to-t from-red-500/50 to-transparent" />
            <div className="w-1/4 h-1/2 rounded-t-sm bg-gradient-to-t from-rose-500/50 to-transparent" />
            <div className="w-1/4 h-full rounded-t-sm bg-gradient-to-t from-pink-500/50 to-transparent" />
          </div>
        </div>

        <div
          className="relative z-10 flex items-center gap-3 animate-fade-down"
          style={{ color: '#fff' }}
        >
          <div 
            className="flex items-center justify-center w-11 h-11 rounded-2xl shadow-lg"
            style={{ 
                background: `linear-gradient(135deg, ${theme.colors.error || '#ef4444'}, #f43f5e)`,
                color: '#fff',
                boxShadow: `0 10px 25px -5px ${theme.colors.error || '#ef4444'}60`
            }}
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0110 0v4"></path>
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">
            SlashCurate
          </span>
        </div>

        <div className="relative z-10 max-w-xl mb-16 animate-fade-up">
          <h1 className="text-5xl lg:text-[3.75rem] leading-[1.1] font-extrabold tracking-tight mb-6 text-white drop-shadow-lg">
            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">Administration</span> & Control.
          </h1>
          <p className="text-lg leading-relaxed font-medium text-slate-300">
            Securely manage configurations, monitor activity, and oversee your data environments.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-6 lg:p-12 relative bg-transparent">
        
        <div 
          className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
        
        <div
          className="lg:hidden absolute top-6 left-6 flex items-center gap-2"
          style={{ color: theme.colors.text }}
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.error || theme.colors.accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4"></path>
          </svg>
          <span className="text-xl font-bold tracking-tight">
            SlashCurate
          </span>
        </div>

        <div 
          className="w-full max-w-[420px] relative z-10 p-8 lg:p-10 rounded-3xl shadow-2xl border backdrop-blur-3xl animate-fade-in"
          style={{
            background: theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.6)',
            borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            boxShadow: theme.mode === 'dark' 
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255,255,255,0.1)' 
                : '0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255,255,255,0.8)',
          }}
        >
          <div className="mb-8 text-center">
            <h2
              className="text-[2rem] font-extrabold tracking-tight mb-2"
              style={{ color: theme.colors.text }}
            >
              Admin Access
            </h2>
            <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
              Enter your elevated credentials to manage the workspace.
            </p>
          </div>

          <div className="space-y-4">
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
                  placeholder="admin@company.com"
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
                  placeholder="••••••••"
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
                title="Access admin panel"
              >
                {loading ? "Authenticating..." : "Start Managing"}
              </button>
            </form>

            <div className="flex flex-col items-center mt-8">
              <button
                type="button"
                className="text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 opacity-60 hover:opacity-100 hover:-translate-x-1"
                style={{ color: theme.colors.textSecondary }}
                onClick={() => navigate("/")}
                disabled={loading}
                title="Return to user login"
              >
                &larr; <span style={{ color: theme.colors.accent }}>Not an Admin?</span> User Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
