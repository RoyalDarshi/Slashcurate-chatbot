import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../ThemeContext";
import {
  Plus, Edit2, Trash2, X, User, Mail, Calendar,
  ShieldCheck, ShieldOff, Search, Users, Key, Eye, EyeOff,
  RefreshCw, CheckCircle2, Link2, Globe
} from "lucide-react";
import { toast } from "react-toastify";
import { adminService } from "../services/adminService";
import { handleApiError } from "../utils/errorHandler";

interface UserManagementProps { token: string; }

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  allowed_to_create_connection?: boolean;
  allowed_to_create_public_connection?: boolean;
}

const avatarColor = (name: string) => {
  const colors = [
    ["#6366f1","#4f46e5"], ["#8b5cf6","#7c3aed"], ["#ec4899","#db2777"],
    ["#f59e0b","#d97706"], ["#10b981","#059669"], ["#3b82f6","#2563eb"],
    ["#ef4444","#dc2626"], ["#14b8a6","#0d9488"],
  ];
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length;
  return colors[idx];
};

const initials = (name: string) =>
  name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; accent: string }> = ({ checked, onChange, accent }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0"
    style={{ backgroundColor: checked ? accent : "rgba(148,163,184,0.3)" }}
  >
    <span
      className="inline-block w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300"
      style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
    />
  </button>
);

const UserManagement: React.FC<UserManagementProps> = ({ token }) => {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: "", email: "", password: "",
    allowedToCreateConnection: true,
    allowedToCreatePublicConnection: true,
  });

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data?.users ?? []);
    } catch (error) {
      handleApiError(error, "Failed to fetch users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        username: user.username, email: user.email, password: "",
        allowedToCreateConnection: user.allowed_to_create_connection ?? true,
        allowedToCreatePublicConnection: user.allowed_to_create_public_connection ?? true,
      });
    } else {
      setEditingId(null);
      setFormData({ username: "", email: "", password: "", allowedToCreateConnection: true, allowedToCreatePublicConnection: true });
    }
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await adminService.updateUser(editingId, formData);
      } else {
        await adminService.createUser(formData);
      }
      toast.success(`User ${editingId ? "updated" : "created"} successfully`);
      setShowModal(false);
      fetchUsers(true);
    } catch (error) {
      handleApiError(error, "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this user? This action cannot be undone.")) return;
    try {
      await adminService.deleteUser(id);
      toast.success("User deleted");
      fetchUsers(true);
    } catch (error) {
      handleApiError(error, "Failed to delete user");
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const glassStyle = {
    backgroundColor: isDark ? theme.colors.surface : "#ffffff",
    borderColor: theme.colors.border,
    color: theme.colors.text,
  };

  const inputStyle = {
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
    borderColor: theme.colors.border,
    color: theme.colors.text,
  };

  return (
    <div className="flex flex-col h-full" style={{ color: theme.colors.text }}>

      {/* ── Header ── */}
      <div
        className="px-6 pt-6 pb-4 border-b flex-shrink-0"
        style={{ borderColor: theme.colors.border }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
              User Management
            </h1>
            <p className="text-sm mt-0.5" style={{ color: theme.colors.textSecondary }}>
              {users.length} member{users.length !== 1 ? "s" : ""} in your workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="p-2 rounded-xl border transition-all hover:scale-105 active:scale-95"
              style={{ ...glassStyle, opacity: refreshing ? 0.6 : 1 }}
              title="Refresh"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} style={{ color: theme.colors.textSecondary }} />
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-md"
              style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})` }}
            >
              <Plus size={16} /> Add User
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.colors.textSecondary }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all"
            style={{
              ...inputStyle,
              boxShadow: "none",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = theme.colors.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.accent}18`; }}
            onBlur={e => { e.currentTarget.style.borderColor = theme.colors.border; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="px-6 py-3 flex items-center gap-3 flex-wrap border-b flex-shrink-0" style={{ borderColor: theme.colors.border }}>
        {[
          { label: "Total Users", value: users.length, icon: <Users size={13} />, color: theme.colors.accent },
          { label: "Can Create Connections", value: users.filter(u => u.allowed_to_create_connection).length, icon: <Link2 size={13} />, color: "#10b981" },
          { label: "Can Create Public", value: users.filter(u => u.allowed_to_create_public_connection).length, icon: <Globe size={13} />, color: "#8b5cf6" },
        ].map(s => (
          <div
            key={s.label}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
            style={{ backgroundColor: `${s.color}10`, borderColor: `${s.color}25`, color: s.color }}
          >
            {s.icon}
            <span className="font-bold">{s.value}</span>
            <span className="opacity-75 hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${theme.colors.accent}40`, borderTopColor: theme.colors.accent }} />
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Loading users…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.accent}12` }}>
              <Users size={24} style={{ color: theme.colors.accent }} />
            </div>
            <p className="font-semibold" style={{ color: theme.colors.text }}>{search ? "No matching users" : "No users yet"}</p>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {search ? "Try a different search term" : "Click Add User to get started"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(user => {
              const [from, to] = avatarColor(user.username);
              const canConn = user.allowed_to_create_connection;
              const canPub = user.allowed_to_create_public_connection;
              return (
                <div
                  key={user.id}
                  className="group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:shadow-md"
                  style={{
                    ...glassStyle,
                    boxShadow: isDark
                      ? "0 1px 3px rgba(0,0,0,0.3)"
                      : "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    {initials(user.username)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{user.username}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail size={11} style={{ color: theme.colors.textSecondary }} />
                      <span className="text-xs truncate" style={{ color: theme.colors.textSecondary }}>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar size={11} style={{ color: theme.colors.textSecondary }} />
                      <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
                        Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Permission Badges */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border"
                      style={{
                        backgroundColor: canConn ? "#10b98112" : "rgba(148,163,184,0.08)",
                        borderColor: canConn ? "#10b98130" : theme.colors.border,
                        color: canConn ? "#10b981" : theme.colors.textSecondary,
                      }}
                    >
                      {canConn ? <CheckCircle2 size={10} /> : <ShieldOff size={10} />}
                      Connections
                    </span>
                    <span
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border"
                      style={{
                        backgroundColor: canPub ? "#8b5cf612" : "rgba(148,163,184,0.08)",
                        borderColor: canPub ? "#8b5cf630" : theme.colors.border,
                        color: canPub ? "#8b5cf6" : theme.colors.textSecondary,
                      }}
                    >
                      {canPub ? <Globe size={10} /> : <ShieldOff size={10} />}
                      Public
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(user)}
                      className="p-2 rounded-xl transition-all hover:scale-110"
                      style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}
                      title="Edit user"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 rounded-xl transition-all hover:scale-110"
                      style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                      title="Delete user"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Slide-in Drawer ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div
            className="relative w-full max-w-[460px] h-full shadow-2xl flex flex-col"
            style={{
              backgroundColor: theme.colors.background,
              borderLeft: `1px solid ${theme.colors.border}`,
              animation: "slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>

            {/* Drawer Header */}
            <div
              className="flex items-center justify-between px-6 py-5 flex-shrink-0 border-b"
              style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})` }}>
                  <User size={17} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: theme.colors.text }}>
                    {editingId ? "Edit User" : "New User"}
                  </h2>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                    {editingId ? "Update account details & permissions" : "Add a new member to your workspace"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: theme.colors.textSecondary }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <form id="user-form" onSubmit={handleSubmit} className="space-y-5">

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.colors.textSecondary }}>
                    Username
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.colors.textSecondary }} />
                    <input
                      type="text"
                      required
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = theme.colors.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.accent}18`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = theme.colors.border; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.colors.textSecondary }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.colors.textSecondary }} />
                    <input
                      type="email"
                      required
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = theme.colors.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.accent}18`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = theme.colors.border; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.colors.textSecondary }}>
                    {editingId ? "New Password" : "Password"}
                    {editingId && <span className="ml-2 normal-case font-normal opacity-60">(leave blank to keep current)</span>}
                  </label>
                  <div className="relative">
                    <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.colors.textSecondary }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required={!editingId}
                      placeholder={editingId ? "••••••••" : "Min. 8 characters"}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = theme.colors.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.accent}18`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = theme.colors.border; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Permissions */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={15} style={{ color: theme.colors.accent }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Permissions</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        key: "allowedToCreateConnection" as const,
                        label: "Create Connections",
                        desc: "Can create private database connections",
                        icon: <Link2 size={14} />, color: "#10b981",
                      },
                      {
                        key: "allowedToCreatePublicConnection" as const,
                        label: "Create Public Connections",
                        desc: "Can create connections shared with all users",
                        icon: <Globe size={14} />, color: "#8b5cf6",
                      },
                    ].map(perm => (
                      <div
                        key={perm.key}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all"
                        style={{
                          backgroundColor: formData[perm.key] ? `${perm.color}08` : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                          borderColor: formData[perm.key] ? `${perm.color}30` : theme.colors.border,
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${perm.color}15`, color: perm.color }}>
                            {perm.icon}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{perm.label}</p>
                            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{perm.desc}</p>
                          </div>
                        </div>
                        <Toggle
                          checked={formData[perm.key]}
                          onChange={v => setFormData({ ...formData, [perm.key]: v })}
                          accent={perm.color}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Drawer Footer */}
            <div
              className="px-6 py-4 border-t flex gap-3 flex-shrink-0"
              style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:opacity-80"
                style={{ borderColor: theme.colors.border, color: theme.colors.text }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="user-form"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-md disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})` }}
              >
                {submitting ? "Saving…" : editingId ? "Save Changes" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;