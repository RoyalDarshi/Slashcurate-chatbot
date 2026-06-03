import React, { useEffect, useRef, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./Login";
import { useTheme } from "../ThemeContext";

interface LoginSignupProps {
  onLoginSuccess: (token: string, isAdmin?: boolean) => void;
}

// Animated SVG data visualization mock
const DataVizCard: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div
    className={`rounded-2xl border border-white/10 backdrop-blur-md p-5 ${className}`}
    style={{ background: "rgba(255,255,255,0.04)", ...style }}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <div>
        <div className="text-white/80 text-xs font-semibold">Revenue Insights</div>
        <div className="text-white/40 text-[10px]">Last 30 days</div>
      </div>
      <div className="ml-auto text-emerald-400 text-xs font-bold">↑ 18.4%</div>
    </div>
    <div className="flex items-end gap-1.5 h-16">
      {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${h}%`,
            background: `linear-gradient(to top, ${i % 3 === 0 ? "#6366f1" : i % 3 === 1 ? "#8b5cf6" : "#06b6d4"}90, transparent)`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  </div>
);

const QueryCard: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div
    className={`rounded-2xl border border-white/10 backdrop-blur-md p-4 ${className}`}
    style={{ background: "rgba(255,255,255,0.04)", ...style }}
  >
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <div className="text-white/60 text-[10px] font-mono">Natural Language Query</div>
    </div>
    <div className="text-white/90 text-xs font-medium mb-3 font-mono">
      "Show me total sales by region for Q4 2024"
    </div>
    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
      <div className="flex gap-1">
        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[9px] font-semibold">SQL</span>
        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold">Chart</span>
      </div>
      <div className="ml-auto text-white/30 text-[9px]">0.4s</div>
    </div>
  </div>
);

const StatBadge: React.FC<{ value: string; label: string; color: string }> = ({ value, label, color }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
    </div>
    <div>
      <div className="text-white font-bold text-sm leading-none">{value}</div>
      <div className="text-white/40 text-[10px] mt-0.5">{label}</div>
    </div>
  </div>
);

const LoginSignup: React.FC<LoginSignupProps> = ({ onLoginSuccess }) => {
  const { theme } = useTheme();
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const leftPaneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (leftPaneRef.current) {
        const rect = leftPaneRef.current.getBoundingClientRect();
        setMousePos({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      } else {
        setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const accentColor = theme.colors.accent;

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden"
      style={{ backgroundColor: theme.colors.background, fontFamily: theme.typography.fontFamily }}
    >
      {/* ====================================================
          LEFT SIDE — Visual Showcase Panel
      ==================================================== */}
      <div
        ref={leftPaneRef}
        className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #040811 0%, #0a1020 50%, #060d1c 100%)" }}
      >
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Mouse-tracked primary glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(ellipse 60% 50% at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${accentColor}35 0%, transparent 70%)`,
          }}
        />

        {/* Secondary ambient glow (counter-mouse) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 45% 40% at ${(1 - mousePos.x) * 100}% ${(1 - mousePos.y) * 100}%, #06b6d440 0%, transparent 65%)`,
          }}
        />

        {/* Floating animated orbs */}
        <div
          className="absolute w-[420px] h-[420px] rounded-full pointer-events-none login-orb-1"
          style={{
            background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
            top: "-10%",
            right: "-5%",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full pointer-events-none login-orb-2"
          style={{
            background: "radial-gradient(circle, #06b6d430 0%, transparent 70%)",
            bottom: "5%",
            left: "10%",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute w-[200px] h-[200px] rounded-full pointer-events-none login-orb-3"
          style={{
            background: "radial-gradient(circle, #8b5cf640 0%, transparent 70%)",
            top: "40%",
            left: "5%",
            filter: "blur(35px)",
          }}
        />

        {/* Scanning line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="login-scan-line" />
        </div>

        {/* ── Logo ── */}
        <div className="relative z-10 flex items-center gap-3 login-entry-1">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-2xl shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${theme.colors.accentHover})`,
              boxShadow: `0 8px 32px -4px ${accentColor}70`,
            }}
          >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white">SlashCurate</span>
            <div className="text-[10px] text-white/40 font-medium tracking-widest uppercase">AI Data Platform</div>
          </div>
        </div>

        {/* ── Floating Data Cards ── */}
        <div className="absolute right-8 top-[18%] login-entry-3" style={{ zIndex: 10 }}>
          <DataVizCard className="w-64 shadow-2xl transform rotate-2 login-float-1" />
        </div>

        <div className="absolute left-[30%] bottom-[22%] login-entry-4" style={{ zIndex: 10 }}>
          <QueryCard className="w-60 shadow-2xl transform -rotate-1 login-float-2" />
        </div>

        {/* ── Hero Text ── */}
        <div className="relative z-10 max-w-lg mb-12 login-entry-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 border border-white/10"
            style={{ background: `${accentColor}15` }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider text-white/60 uppercase">AI-Powered Analytics</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight leading-[1.05] text-white mb-5">
            Turn data into{" "}
            <span
              className="relative inline-block"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, #06b6d4, #8b5cf6)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              answers
            </span>
            {" "}instantly.
          </h1>
          <p className="text-base leading-relaxed text-white/50 font-medium max-w-sm">
            Ask questions in plain English. Get charts, tables, and insights — no SQL required.
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="relative z-10 flex items-center gap-8 login-entry-5">
          <StatBadge value="10x" label="Faster insights" color="#6366f1" />
          <div className="w-px h-8 bg-white/10" />
          <StatBadge value="99.9%" label="Uptime SLA" color="#06b6d4" />
        </div>
      </div>

      {/* ====================================================
          RIGHT SIDE — Auth Form Panel
      ==================================================== */}
      <div
        className="w-full lg:w-[42%] flex flex-col justify-center items-center px-6 py-12 lg:p-14 relative"
        style={{ background: theme.mode === "dark" ? "rgba(6, 8, 18, 0.98)" : theme.colors.background }}
      >
        {/* Subtle right panel glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${accentColor}12 0%, transparent 60%)`,
          }}
        />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10 self-start">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${theme.colors.accentHover})` }}
          >
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </svg>
          </div>
          <span className="text-lg font-extrabold tracking-tight" style={{ color: theme.colors.text }}>SlashCurate</span>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-[400px] relative z-10 login-form-entry">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[1.85rem] font-black tracking-tight mb-1.5" style={{ color: theme.colors.text }}>
              Welcome back
            </h2>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              Sign in to your workspace
            </p>
          </div>

          {/* Form fields */}
          <div className="space-y-5">
            <Login
              onLoginSuccess={onLoginSuccess}
              onForgotPassword={() => {}}
              onSwitchToSignup={() => {}}
            />
          </div>

          {/* Trust badges */}
          <div className="mt-8 pt-6 border-t flex items-center justify-center gap-5" style={{ borderColor: theme.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" style={{ color: theme.colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-[10px] font-medium" style={{ color: theme.colors.textSecondary }}>Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" style={{ color: theme.colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[10px] font-medium" style={{ color: theme.colors.textSecondary }}>SOC 2 Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" style={{ color: theme.colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[10px] font-medium" style={{ color: theme.colors.textSecondary }}>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default LoginSignup;
