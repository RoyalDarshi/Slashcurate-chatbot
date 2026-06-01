import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../ThemeContext";
import { 
  Database, 
  Activity, 
  Trash2, 
  Key, 
  UserPlus, 
  RefreshCw, 
  Check, 
  Server
} from "lucide-react";
import "./Loader.css";

const Loader = ({ text }: { text: string }) => {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  // Normalize lower-case text for matching
  const actionText = (text || "").toLowerCase();

  // Determine configuration based on type of action
  let steps = [
    "Verifying parameters",
    "Processing background task",
    "Finalizing user dashboard"
  ];
  let operationType = "generic";
  let MainIcon = RefreshCw;
  let simulatedDuration = 3000; // ms

  if (actionText.includes("metadata")) {
    steps = [
      "Establishing database connection handshake",
      "Retrieving system catalogs & schema data",
      "Analyzing foreign key relationships & indexes",
      "Building and caching AI indexing models"
    ];
    operationType = "metadata";
    MainIcon = Database;
    simulatedDuration = 15000;
  } else if (actionText.includes("test")) {
    steps = [
      "Resolving database endpoint host details",
      "Sending socket ping & handshake request",
      "Verifying user privileges & authorizations"
    ];
    operationType = "test";
    MainIcon = Activity;
    simulatedDuration = 3000;
  } else if (actionText.includes("delete")) {
    steps = [
      "Revoking database access channel parameters",
      "Purging workspace metadata storage cache",
      "Updating existing records list view panels"
    ];
    operationType = "delete";
    MainIcon = Trash2;
    simulatedDuration = 2000;
  } else if (actionText.includes("ldap") || actionText.includes("config")) {
    steps = [
      "Querying system server configurations",
      "Validating server address host credentials",
      "Applying environment permission changes"
    ];
    operationType = "ldap";
    MainIcon = Server;
    simulatedDuration = 4000;
  } else if (actionText.includes("reset") || actionText.includes("password") || actionText.includes("send")) {
    steps = [
      "Validating security token signatures",
      "Updating user authentication secrets data",
      "Broadcasting credentials updates logs"
    ];
    operationType = "auth";
    MainIcon = Key;
    simulatedDuration = 3000;
  } else if (actionText.includes("launch") || actionText.includes("signup") || actionText.includes("register")) {
    steps = [
      "Provisioning new workspace resources",
      "Configuring personal dashboard catalogs",
      "Launching user interactive workspace"
    ];
    operationType = "launch";
    MainIcon = UserPlus;
    simulatedDuration = 3000;
  }

  // Effect to simulate progress percentage
  useEffect(() => {
    setProgress(0);
    let currentProgress = 0;
    
    // Choose increment interval based on speed
    const intervalTime = operationType === "metadata" ? 250 : 100;
    
    const timer = setInterval(() => {
      if (operationType === "metadata") {
        // Metadata climbs slow and caps at 99% until complete
        if (currentProgress < 30) {
          currentProgress += Math.floor(Math.random() * 6) + 4;
        } else if (currentProgress < 65) {
          currentProgress += Math.floor(Math.random() * 4) + 2;
        } else if (currentProgress < 85) {
          currentProgress += Math.floor(Math.random() * 2) + 1;
        } else if (currentProgress < 98) {
          currentProgress += Math.random() > 0.4 ? 1 : 0;
        } else if (currentProgress === 98) {
          currentProgress = 99;
        }
      } else {
        // Quick tasks climb steadily to 100%
        const stepsCount = 100 / (simulatedDuration / intervalTime);
        currentProgress += Math.max(1, Math.floor(stepsCount + Math.random() * 4));
        if (currentProgress > 100) currentProgress = 100;
      }

      setProgress(currentProgress);
      
      // Calculate active step index based on progress range
      const stepSegment = 100 / steps.length;
      const computedStep = Math.min(
        steps.length - 1,
        Math.floor(currentProgress / stepSegment)
      );
      setActiveStep(computedStep);

      if (currentProgress >= 100) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [operationType, steps.length, simulatedDuration]);

  // Lock scrolling on document body and intercept keyboard/mouse captures
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    // Intercept keyboard clicks to block esc, space or navigation triggers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["Escape", "Tab", "Space", "Enter"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  // Styling helpers
  const isDark = theme.mode === 'dark';

  if (typeof window === "undefined" || !window.document) {
    return null;
  }

  const loaderContent = (
    <div
      className="fixed inset-0 flex items-center justify-center z-[99999] animate-backdrop-in pointer-events-auto select-none"
      style={{
        backgroundColor: isDark ? 'rgba(9, 13, 22, 0.72)' : 'rgba(241, 245, 249, 0.72)',
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Visual Tech Background mesh grid */}
      <div 
        className="loader-mesh-grid"
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)'
            : 'linear-gradient(rgba(0, 0, 0, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.015) 1px, transparent 1px)',
        }}
      />

      {/* Decorative Glow Spots */}
      <div 
        className="glow-spot" 
        style={{ 
          backgroundColor: theme.colors.accent, 
          top: '30%', 
          left: '35%',
          opacity: isDark ? 0.12 : 0.06
        }} 
      />
      <div 
        className="glow-spot" 
        style={{ 
          backgroundColor: theme.colors.accent, 
          bottom: '30%', 
          right: '35%',
          opacity: isDark ? 0.08 : 0.04
        }} 
      />

      {/* Main Glass Card */}
      <div 
        className="loader-card animate-card-in"
        style={{
          backgroundColor: isDark ? 'rgba(19, 28, 46, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 50px rgba(99, 102, 241, 0.08)'
            : '0 25px 50px -12px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 50px rgba(79, 70, 229, 0.04)',
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Dynamic Holographic Orbit Graphic */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center select-none">
          {/* Outer Orbit (Dotted, Slow CW) */}
          <div 
            className="absolute inset-0 rounded-full orbit-outer-spin"
            style={{
              border: `1.5px dashed ${theme.colors.accent}40`,
            }}
          />
          {/* Middle Orbit (Gradient arc, CCW) */}
          <div 
            className="absolute inset-2 rounded-full orbit-middle-spin"
            style={{
              border: '2px solid transparent',
              borderTopColor: theme.colors.accent,
              borderBottomColor: `${theme.colors.accent}20`,
            }}
          />
          {/* Inner Glowing Core Circle (Pulse) */}
          <div 
            className="absolute inset-4 rounded-full flex items-center justify-center orbit-inner-pulse"
            style={{
              backgroundColor: `${theme.colors.accent}12`,
              boxShadow: `0 0 20px ${theme.colors.accent}20`,
            }}
          />
          {/* Solid Central Icon container */}
          <div className="absolute inset-5 rounded-full flex items-center justify-center bg-slate-900/10 dark:bg-white/5">
            <MainIcon 
              className="h-6 w-6 animate-pulse" 
              style={{ color: theme.colors.accent }}
            />
          </div>
        </div>

        {/* Task Title & Percentage */}
        <div className="w-full text-center mb-1">
          <h3 
            className="text-sm font-extrabold tracking-tight text-center"
            style={{ color: theme.colors.text }}
          >
            {text || "Processing Request"}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 mb-4">
          <span 
            className="text-xs font-mono font-bold tracking-wider"
            style={{ color: theme.colors.accent }}
          >
            {progress}%
          </span>
          <span 
            className="text-[10px] font-semibold opacity-60 tracking-wider uppercase"
            style={{ color: theme.colors.textSecondary }}
          >
            Completed
          </span>
        </div>

        {/* Custom Segmented Progress Bar */}
        <div className="w-full relative h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mb-6">
          <div 
            className="h-full rounded-full transition-all duration-300 relative"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${theme.colors.accent}dd, ${theme.colors.accent})`,
              boxShadow: `0 0 8px ${theme.colors.accent}80`,
            }}
          />
          {/* Segment slits for a technical dashboard look */}
          <div 
            className="segmented-overlay" 
            style={{ 
              '--gap-color': isDark ? '#131C2E' : '#FFFFFF' 
            } as React.CSSProperties}
          />
        </div>

        {/* Detailed diagnostic steps checklist */}
        <div 
          className="w-full space-y-3 pt-4 border-t"
          style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
        >
          {steps.map((step, idx) => {
            const isCompleted = progress >= 100 || idx < activeStep;
            const isActive = idx === activeStep && progress < 100;
            const isPending = idx > activeStep && progress < 100;

            return (
              <div 
                key={idx}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isActive ? 'animate-step-entry' : ''
                }`}
                style={{
                  opacity: isPending ? 0.35 : 1,
                }}
              >
                {/* Visual state bubble */}
                <div 
                  className={`h-5 w-5 rounded-full flex items-center justify-center transition-all duration-300 border ${
                    isCompleted 
                      ? 'border-transparent' 
                      : isActive 
                        ? 'border-transparent'
                        : 'border-slate-300 dark:border-slate-700'
                  }`}
                  style={{
                    backgroundColor: isCompleted 
                      ? theme.colors.success 
                      : isActive 
                        ? `${theme.colors.accent}15`
                        : 'transparent',
                  }}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3 text-white stroke-[3px]" />
                  ) : isActive ? (
                    <div 
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>

                {/* Step Description */}
                <span 
                  className={`text-[11px] font-medium tracking-tight transition-all duration-300 ${
                    isActive ? 'font-semibold' : ''
                  }`}
                  style={{
                    color: isActive 
                      ? theme.colors.accent 
                      : isCompleted 
                        ? theme.colors.text
                        : theme.colors.textSecondary,
                  }}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(loaderContent, document.body);
};

export default Loader;