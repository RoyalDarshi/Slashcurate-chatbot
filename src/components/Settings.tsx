import React, { useState } from "react";
import { useTheme } from "../ThemeContext";
import { useSettings } from "../SettingsContext";
import ChangePasswordModal from "./ChangePasswordModal";

/* ─── tiny SVG icon helpers ─────────────────────────────────────────────── */
const Icon = ({ d, size = 20, color }: { d: string; size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || "currentColor"}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  appearance: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
  workspace:
    "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM8 11h8M8 15h5",
  notifications: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  security: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  sun: "M12 5a1 1 0 0 1 1-1V3a1 1 0 0 1-2 0v1a1 1 0 0 1 1 1Zm-7 7a1 1 0 0 1-1 1H3a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1Zm14 0a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2h-1a1 1 0 0 1-1-1ZM12 17a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1Zm-5.657-1.343a1 1 0 0 1 0-1.414l-.707-.707a1 1 0 0 1-1.414 1.414l.707.707a1 1 0 0 1 1.414 0Zm11.314 0a1 1 0 0 1 1.414 0l.707.707a1 1 0 0 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414ZM5.636 7.05a1 1 0 0 1 1.414 0L6.343 6.343A1 1 0 0 1 4.929 4.93l.707.707a1 1 0 0 1 0 1.414Zm11.314-1.414a1 1 0 0 1 0 1.414l.707-.707a1 1 0 0 1 1.414 1.414l-.707.707a1 1 0 0 1-1.414 0ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z",
  font: "M4 7V4h16v3M9 20h6M12 4v16",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z",
  dashboard:
    "M3 3h7v7H3ZM14 3h7v7h-7ZM14 14h7v7h-7ZM3 14h7v7H3Z",
  tip: "M12 2a7 7 0 0 1 5 11.9V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2.1A7 7 0 0 1 12 2ZM9 21h6M10 17v4M14 17v4",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM7 11V7a5 5 0 0 1 10 0v4",
  chevron: "M6 9l6 6 6-6",
};

/* ─── Toggle switch ──────────────────────────────────────────────────────── */
const Toggle = ({
  checked,
  onChange,
  label,
  accent,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  accent: string;
}) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    style={{
      width: 52,
      height: 28,
      borderRadius: 9999,
      border: "none",
      padding: 3,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      backgroundColor: checked ? accent : "rgba(148,163,184,0.35)",
      transition: "background-color 0.25s cubic-bezier(0.4,0,0.2,1)",
      flexShrink: 0,
      position: "relative",
    }}
  >
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        transform: checked ? "translateX(24px)" : "translateX(0)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        display: "block",
      }}
    />
  </button>
);

/* ─── Segment picker (replaces plain <select> for better UX) ────────────── */
const SegmentPicker = ({
  value,
  options,
  onChange,
  accent,
  isDark,
  textColor,
}: {
  value: string;
  options: { value: string; label: string; icon?: string }[];
  onChange: (v: string) => void;
  accent: string;
  isDark: boolean;
  textColor: string;
}) => (
  <div
    style={{
      display: "inline-flex",
      borderRadius: 12,
      padding: 3,
      backgroundColor: isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.06)",
      gap: 2,
    }}
  >
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "6px 16px",
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            fontWeight: active ? 600 : 500,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
            backgroundColor: active ? accent : "transparent",
            color: active ? "#fff" : textColor,
            boxShadow: active ? `0 2px 8px ${accent}55` : "none",
          }}
        >
          {opt.icon && (
            <Icon d={opt.icon} size={14} color={active ? "#fff" : textColor} />
          )}
          {opt.label}
        </button>
      );
    })}
  </div>
);

/* ─── Main Settings component ────────────────────────────────────────────── */
const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    chatFontSize,
    setChatFontSize,
    notificationsEnabled,
    setNotificationsEnabled,
    currentView,
    setCurrentView,
  } = useSettings();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const isDark = theme.mode === "dark";
  const accent = theme.colors.accent;
  const text = theme.colors.text;
  const textSec = theme.colors.textSecondary;
  const bg = theme.colors.background;

  /* card glass style */
  const card = {
    borderRadius: 20,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
    backgroundColor: isDark ? "rgba(19,28,46,0.65)" : "#ffffff",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: isDark
      ? "0 8px 32px -4px rgba(0,0,0,0.45)"
      : "0 4px 24px -4px rgba(0,0,0,0.06)",
    overflow: "hidden" as const,
    marginBottom: 20,
  };

  const divider = {
    height: 1,
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    margin: "0 24px",
  };

  /* ── Section header ── */
  const SectionHeader = ({
    icon,
    title,
    subtitle,
    color,
  }: {
    icon: string;
    title: string;
    subtitle: string;
    color: string;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "20px 24px 16px",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
          border: `1px solid ${color}30`,
          flexShrink: 0,
        }}
      >
        <Icon d={icon} size={18} color={color} />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>{title}</p>
        <p style={{ fontSize: 12, color: textSec, margin: 0, marginTop: 1 }}>{subtitle}</p>
      </div>
    </div>
  );

  /* ── Setting row ── */
  const Row = ({
    label,
    description,
    control,
    noBorder,
  }: {
    label: string;
    description?: string;
    control: React.ReactNode;
    noBorder?: boolean;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 24px",
        gap: 16,
        borderBottom: noBorder
          ? "none"
          : `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
        transition: "background 0.15s",
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: text, margin: 0 }}>{label}</p>
        {description && (
          <p style={{ fontSize: 12, color: textSec, margin: 0, marginTop: 3 }}>
            {description}
          </p>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100%",
        backgroundColor: bg,
        overflowY: "auto",
        padding: "40px 16px 60px",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* ── Hero header ─────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: 24,
            padding: "32px 32px 28px",
            marginBottom: 28,
            background: isDark
              ? `linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(79,70,229,0.08) 100%)`
              : `linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(79,70,229,0.04) 100%)`,
            border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.15)"}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative blobs */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -60,
              left: -20,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${accent} 0%, ${theme.colors.accentHover || accent} 100%)`,
                  boxShadow: `0 8px 20px ${accent}50`,
                }}
              >
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: text, margin: 0, letterSpacing: "-0.5px" }}>
                  Settings
                </h1>
                <p style={{ fontSize: 14, color: textSec, margin: 0, marginTop: 2 }}>
                  Manage your preferences and workspace
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Appearance ─────────────────────────────────────────── */}
        <div style={card}>
          <SectionHeader
            icon={ICONS.appearance}
            title="Appearance"
            subtitle="Personalize the look and feel"
            color="#6366F1"
          />

          <Row
            label="Theme"
            description={isDark ? "Currently using dark mode" : "Currently using light mode"}
            control={
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon d={ICONS.sun} size={16} color={isDark ? textSec : "#F59E0B"} />
                <Toggle
                  checked={isDark}
                  onChange={toggleTheme}
                  label="Toggle dark mode"
                  accent={accent}
                />
                <Icon d={ICONS.moon} size={16} color={isDark ? "#818CF8" : textSec} />
              </div>
            }
          />

          <Row
            label="Chat Font Size"
            description="Adjust text size in the chat interface"
            noBorder
            control={
              <SegmentPicker
                value={chatFontSize}
                onChange={(v) => setChatFontSize(v as "small" | "medium" | "large")}
                accent={accent}
                isDark={isDark}
                textColor={textSec}
                options={[
                  { value: "small", label: "S" },
                  { value: "medium", label: "M" },
                  { value: "large", label: "L" },
                ]}
              />
            }
          />
        </div>

        {/* ── Workspace ──────────────────────────────────────────── */}
        <div style={card}>
          <SectionHeader
            icon={ICONS.workspace}
            title="Workspace"
            subtitle="Configure your default experience"
            color="#0EA5E9"
          />

          <Row
            label="Default View"
            description="Choose which view opens when you log in"
            noBorder
            control={
              <SegmentPicker
                value={currentView}
                onChange={(v) => setCurrentView(v as "chat" | "dashboard")}
                accent={accent}
                isDark={isDark}
                textColor={textSec}
                options={[
                  { value: "chat", label: "Chat", icon: ICONS.chat },
                  { value: "dashboard", label: "Dashboard", icon: ICONS.dashboard },
                ]}
              />
            }
          />
        </div>

        {/* ── Notifications & Tips ───────────────────────────────── */}
        <div style={card}>
          <SectionHeader
            icon={ICONS.notifications}
            title="Notifications & Tips"
            subtitle="Stay informed without distractions"
            color="#10B981"
          />

          <Row
            label="Quick Tips"
            description="Show helpful hints across the application"
            noBorder
            control={
              <Toggle
                checked={notificationsEnabled}
                onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                label="Toggle quick tips"
                accent={accent}
              />
            }
          />
        </div>

        {/* ── Account Security ───────────────────────────────────── */}
        <div style={card}>
          <SectionHeader
            icon={ICONS.security}
            title="Account Security"
            subtitle="Keep your account protected"
            color="#F59E0B"
          />

          <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: text, margin: 0 }}>Password</p>
              <p style={{ fontSize: 12, color: textSec, margin: 0, marginTop: 3 }}>
                Last changed · update regularly for better security
              </p>
            </div>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              style={{
                padding: "10px 22px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.02em",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: `linear-gradient(135deg, ${accent} 0%, ${theme.colors.accentHover || accent} 100%)`,
                color: "#fff",
                boxShadow: `0 4px 16px ${accent}50`,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 24px ${accent}60`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px ${accent}50`;
              }}
            >
              <Icon d={ICONS.lock} size={14} color="#fff" />
              Change Password
            </button>
          </div>
        </div>

      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default Settings;