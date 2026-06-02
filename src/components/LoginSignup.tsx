import React, { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import { useTheme } from "../ThemeContext";

interface LoginSignupProps {
  onLoginSuccess: (token: string, isAdmin?: boolean) => void;
}

const LoginSignup: React.FC<LoginSignupProps> = ({ onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { theme } = useTheme();
  
  // Subtle mouse tracking effect for the background mesh
  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSwitchToSignup = () => {
    setIsSignup(true);
    setIsForgotPassword(false);
  };

  const handleSwitchToLogin = () => {
    setIsSignup(false);
    setIsForgotPassword(false);
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setIsSignup(false);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden"
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {/* LEFT SIDE - VISUALS (Hidden on small screens) */}
      <div 
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background: theme.mode === 'dark' 
            ? 'linear-gradient(135deg, #020617 0%, #0f172a 100%)' 
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Made light mode also have a dark, striking left pane for contrast
          borderRight: `1px solid ${theme.colors.border}`,
        }}
      >
        {/* Abstract Noise Texture */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
        {/* Abstract Floating Shapes for extra depth */}
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
            background: `linear-gradient(135deg, ${theme.mode === 'dark' ? '#818cf8' : '#38bdf8'}, transparent)`,
            filter: 'blur(30px)',
            animation: 'blob 10s infinite alternate-reverse'
          }}
        />

        {/* Dynamic Abstract Mesh / Glows */}
        <div 
          className="absolute inset-0 opacity-60 blur-[90px] pointer-events-none transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle at ${mousePos.x * 0.4}px ${mousePos.y * 0.4}px, ${theme.colors.accent}60, transparent 45%),
                         radial-gradient(circle at ${window.innerWidth * 0.5 - mousePos.x * 0.3}px ${window.innerHeight * 0.5 - mousePos.y * 0.3}px, ${theme.mode === 'dark' ? '#818cf850' : '#38bdf850'}, transparent 45%)`
          }}
        />
        
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%239C92AC' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }} />

        {/* Floating Glass Data Cards */}
        <div className="absolute top-1/3 right-12 w-64 h-40 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl p-5 transform rotate-6 animate-float"
          style={{ background: 'rgba(255,255,255,0.03)', animation: 'float 6s ease-in-out infinite' }}
        >
          <div className="w-full h-3 rounded-full bg-white/10 mb-3" />
          <div className="w-3/4 h-3 rounded-full bg-white/10 mb-6" />
          <div className="flex items-end gap-2 h-16">
            <div className="w-1/4 h-full rounded-t-sm bg-gradient-to-t from-blue-500/50 to-transparent" />
            <div className="w-1/4 h-3/4 rounded-t-sm bg-gradient-to-t from-purple-500/50 to-transparent" />
            <div className="w-1/4 h-1/2 rounded-t-sm bg-gradient-to-t from-emerald-500/50 to-transparent" />
            <div className="w-1/4 h-full rounded-t-sm bg-gradient-to-t from-sky-500/50 to-transparent" />
          </div>
        </div>
        
        <div className="absolute bottom-1/4 left-1/3 w-56 h-32 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl p-5 transform -rotate-3 animate-float animation-delay-2000"
          style={{ background: 'rgba(255,255,255,0.03)', animation: 'float 8s ease-in-out infinite reverse' }}
        >
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-400" />
              <div className="w-20 h-3 rounded-full bg-white/10" />
           </div>
           <div className="w-full h-2 rounded-full bg-white/5 mb-2" />
           <div className="w-full h-2 rounded-full bg-white/5 mb-2" />
           <div className="w-4/5 h-2 rounded-full bg-white/5" />
        </div>

        {/* Company Logo - Top Left */}
        <div
          className="relative z-10 flex items-center gap-3 animate-fade-down"
          style={{ color: '#fff' }} // Forced white for contrast against dark pane
        >
          <div 
            className="flex items-center justify-center w-11 h-11 rounded-2xl shadow-lg"
            style={{ 
                background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`,
                color: '#fff',
                boxShadow: `0 10px 25px -5px ${theme.colors.accent}60`
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
              <circle cx="12" cy="12" r="9" />
              <path d="M12 6v6l3.5 2" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">
            SlashCurate
          </span>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-xl mb-16 animate-fade-up">
          <h1 className="text-5xl lg:text-[3.75rem] leading-[1.1] font-extrabold tracking-tight mb-6 text-white drop-shadow-lg">
            Transform your data into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">intelligent</span> insights.
          </h1>
          <p className="text-lg leading-relaxed font-medium text-slate-300">
            Instantly query, visualize, and interact with your complex datasets using just natural language.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-6 lg:p-12 relative bg-transparent">
        
        {/* Subtle noise on the right side too */}
        <div 
          className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
        
        {/* Mobile Logo (only visible on small screens) */}
        <div
          className="lg:hidden absolute top-6 left-6 flex items-center gap-2"
          style={{ color: theme.colors.text }}
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="text-xl font-bold tracking-tight">
            SlashCurate
          </span>
        </div>

        {/* Glassmorphic Form Container */}
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
              {isSignup
                ? "Create Account"
                : isForgotPassword
                ? "Reset Passcode"
                : "Welcome back."}
            </h2>
            <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
              {isSignup
                ? "Sign up to start analyzing your data."
                : isForgotPassword
                ? "Enter your details to reclaim access."
                : "Enter your credentials to access your workspace."}
            </p>
          </div>

          <div className="space-y-4">
            {isSignup && (
              <Signup
                onSignupSuccess={onLoginSuccess}
                onSwitchToLogin={handleSwitchToLogin}
              />
            )}
            {!isSignup && !isForgotPassword && (
              <Login
                onLoginSuccess={onLoginSuccess}
                onForgotPassword={handleForgotPassword}
                onSwitchToSignup={handleSwitchToSignup}
              />
            )}
            {isForgotPassword && (
              <ForgotPassword onBackToLogin={handleSwitchToLogin} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
