// UserManagement.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../ThemeContext";
import {
  Plus, Edit3, Trash2, X, User, Mail, Calendar,
  ShieldCheck, ShieldOff, Search, Users, Key, Eye, EyeOff,
  RefreshCw, CheckCircle2, Link2, Globe
} from "lucide-react";
import { toast } from "react-toastify";
import { adminService } from "../services/adminService";
import { handleApiError } from "../utils/errorHandler";
import { motion, AnimatePresence } from "framer-motion";
import styled from "styled-components";
import { Theme } from "../types";

export const StyledInput = styled.input<{ theme: Theme }>`
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-text-fill-color: ${(props) => props.theme.colors.text} !important;
    color: ${(props) => props.theme.colors.text} !important;
    background-color: ${(props) => props.theme.colors.background} !important;
    caret-color: ${(props) => props.theme.colors.text} !important;
    transition: background-color 5000s ease-in-out 0s;
  }

  &:focus {
    border-color: ${(props) => props.theme.colors.accent} !important;
    box-shadow: 0 0 0 3px ${(props) => props.theme.colors.accent}15 !important;
  }
`;

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
    ["#6366f1", "#4f46e5"], ["#8b5cf6", "#7c3aed"], ["#ec4899", "#db2777"],
    ["#f59e0b", "#d97706"], ["#10b981", "#059669"], ["#3b82f6", "#2563eb"],
    ["#ef4444", "#dc2626"], ["#14b8a6", "#0d9488"],
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
    className="relative inline-flex items-center h-5.5 w-10 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 cursor-pointer"
    style={{ backgroundColor: checked ? accent : "rgba(148,163,184,0.25)" }}
  >
    <span
      className="inline-block w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300"
      style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
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
      toast.success(`User ${editingId ? "updated" : "created"} successfully`, { theme: isDark ? "dark" : "light" });
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
      toast.success("User deleted", { theme: isDark ? "dark" : "light" });
      fetchUsers(true);
    } catch (error) {
      handleApiError(error, "Failed to delete user");
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full p-6 md:p-10 overflow-hidden" style={{ color: theme.colors.text, backgroundColor: theme.colors.background }}>
      
      {/* ── SaaS Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b gap-4 flex-shrink-0" style={{ borderColor: `${theme.colors.border}60` }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md" 
              style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}>
              IAM Controller
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[11px] font-semibold opacity-50">Workspace Access</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.colors.text }}>
            User Accounts
          </h2>
          <p className="text-xs opacity-60 mt-1 font-medium" style={{ color: theme.colors.text }}>
            Create and manage access credentials and permission scopes for your team members.
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-center">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all hover:bg-slate-500/5"
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
            title="Refresh database"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} style={{ color: theme.colors.textSecondary }} />
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer"
            style={{ backgroundColor: theme.colors.accent }}
          >
            <Plus size={14} /> Add User
          </motion.button>
        </div>
      </div>

      {/* ── SaaS Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 flex-shrink-0">
        {[
          { label: "Total Members", value: users.length, icon: <Users size={16} />, color: theme.colors.accent },
          { label: "Can Create Connections", value: users.filter(u => u.allowed_to_create_connection).length, icon: <Link2 size={16} />, color: "#10b981" },
          { label: "Can Create Public Nodes", value: users.filter(u => u.allowed_to_create_public_connection).length, icon: <Globe size={16} />, color: "#8b5cf6" },
        ].map(s => (
          <div
            key={s.label}
            className="flex items-center gap-4 p-4 rounded-2xl border"
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
          >
            <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: `${s.color}12`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-50" style={{ color: theme.colors.text }}>{s.label}</div>
              <div className="text-xl font-black mt-0.5" style={{ color: theme.colors.text }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls: Search Panel ── */}
      <div className="mb-4 relative flex-shrink-0">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" style={{ color: theme.colors.text }} />
        <StyledInput
          theme={theme}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter workspace members by name or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all font-semibold"
          style={{ backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }}
        />
      </div>

      {/* ── User List Board ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${theme.colors.accent}40`, borderTopColor: theme.colors.accent }} />
            <p className="text-xs opacity-60" style={{ color: theme.colors.text }}>Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${theme.colors.accent}12` }}>
              <Users size={20} style={{ color: theme.colors.accent }} />
            </div>
            <p className="text-sm font-bold" style={{ color: theme.colors.text }}>{search ? "No matching users found" : "No users yet"}</p>
            <p className="text-xs opacity-50 -mt-1" style={{ color: theme.colors.text }}>
              {search ? "Try searching with a different username or email." : "Add a user configuration to your settings."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(user => {
              const [from, to] = avatarColor(user.username);
              const canConn = user.allowed_to_create_connection;
              const canPub = user.allowed_to_create_public_connection;
              return (
                <motion.div
                  layout
                  key={user.id}
                  className="group flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-300"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-sm flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                    >
                      {initials(user.username)}
                    </div>

                    {/* Member Metadata */}
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: theme.colors.text }}>{user.username}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] opacity-65 flex-wrap">
                        <span className="flex items-center gap-0.5 truncate">
                          <Mail size={10} />
                          {user.email}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="flex items-center gap-0.5">
                          <Calendar size={10} />
                          Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Capabilities Flags & Action Buttons */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5">
                      <span
                        className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
                        style={{
                          backgroundColor: canConn ? "#10b98110" : "rgba(148,163,184,0.05)",
                          borderColor: canConn ? "#10b98125" : theme.colors.border,
                          color: canConn ? "#10b981" : theme.colors.textSecondary,
                        }}
                      >
                        {canConn ? <CheckCircle2 size={9} /> : <ShieldOff size={9} />}
                        Connections
                      </span>
                      <span
                        className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
                        style={{
                          backgroundColor: canPub ? "#8b5cf610" : "rgba(148,163,184,0.05)",
                          borderColor: canPub ? "#8b5cf625" : theme.colors.border,
                          color: canPub ? "#8b5cf6" : theme.colors.textSecondary,
                        }}
                      >
                        {canPub ? <Globe size={9} /> : <ShieldOff size={9} />}
                        Public Nodes
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openModal(user)}
                        className="p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{ backgroundColor: `${theme.colors.accent}12`, color: theme.colors.accent }}
                        title="Edit member parameters"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                        title="Revoke and delete member"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Slide-in Drawer ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setShowModal(false)}
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-[460px] h-full shadow-2xl flex flex-col z-10"
              style={{
                backgroundColor: theme.colors.surface,
                borderLeft: `1px solid ${theme.colors.border}`,
              }}
            >
              {/* Drawer Header */}
              <div
                className="flex items-center justify-between px-6 py-5 flex-shrink-0 border-b"
                style={{ borderColor: `${theme.colors.border}50`, backgroundColor: theme.colors.surface }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})` }}>
                    <User size={15} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight" style={{ color: theme.colors.text }}>
                      {editingId ? "Modify Account Settings" : "Enroll Member"}
                    </h3>
                    <p className="text-[10px] opacity-60 mt-0.5 font-medium" style={{ color: theme.colors.text }}>
                      {editingId ? "Update access configuration keys." : "Add a member to the workspace."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-6">
                <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Username */}
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold mb-2 opacity-85" style={{ color: theme.colors.text }}>
                      Username
                    </label>
                    <div className="relative flex items-center w-full">
                      <div className="absolute left-3.5 opacity-40">
                        <User size={14} style={{ color: theme.colors.text }} />
                      </div>
                      <StyledInput
                        type="text"
                        required
                        placeholder="johndoe"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all border font-semibold"
                        style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                        theme={theme}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold mb-2 opacity-85" style={{ color: theme.colors.text }}>
                      Email Address
                    </label>
                    <div className="relative flex items-center w-full">
                      <div className="absolute left-3.5 opacity-40">
                        <Mail size={14} style={{ color: theme.colors.text }} />
                      </div>
                      <StyledInput
                        type="email"
                        required
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all border font-semibold"
                        style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                        theme={theme}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold mb-2 opacity-85 flex items-center gap-1.5" style={{ color: theme.colors.text }}>
                      <span>{editingId ? "Change Password" : "Password"}</span>
                      {editingId && <span className="text-[10px] font-normal opacity-50">(leave blank to keep current)</span>}
                    </label>
                    <div className="relative flex items-center w-full">
                      <div className="absolute left-3.5 opacity-40">
                        <Key size={14} style={{ color: theme.colors.text }} />
                      </div>
                      <StyledInput
                        type={showPassword ? "text" : "password"}
                        required={!editingId}
                        placeholder={editingId ? "••••••••" : "Min. 8 characters"}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-9 pr-10 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all border font-semibold font-mono"
                        style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                        theme={theme}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 opacity-50 hover:opacity-100 cursor-pointer"
                        style={{ color: theme.colors.text }}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Permissions Cards */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck size={14} style={{ color: theme.colors.accent }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider opacity-80" style={{ color: theme.colors.text }}>Capabilities Scope</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          key: "allowedToCreateConnection" as const,
                          label: "Create Database Links",
                          desc: "Authorizes the creation of private database profiles.",
                          icon: <Link2 size={13} />, color: "#10b981",
                        },
                        {
                          key: "allowedToCreatePublicConnection" as const,
                          label: "Global Public Links",
                          desc: "Authorizes sharing connections with all workspace users.",
                          icon: <Globe size={13} />, color: "#8b5cf6",
                        },
                      ].map(perm => (
                        <div
                          key={perm.key}
                          className="flex items-center justify-between gap-3 p-4 rounded-xl border transition-all"
                          style={{
                            backgroundColor: formData[perm.key] ? `${perm.color}05` : theme.colors.background,
                            borderColor: formData[perm.key] ? `${perm.color}25` : theme.colors.border,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: `${perm.color}10`, color: perm.color }}>
                              {perm.icon}
                            </div>
                            <div>
                              <p className="text-xs font-bold" style={{ color: theme.colors.text }}>{perm.label}</p>
                              <p className="text-[10px] opacity-60 mt-0.5" style={{ color: theme.colors.text }}>{perm.desc}</p>
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
                style={{ borderColor: `${theme.colors.border}50`, backgroundColor: theme.colors.surface }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-slate-500/5 cursor-pointer"
                  style={{ borderColor: theme.colors.border, color: theme.colors.text }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="user-form"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md disabled:opacity-60 cursor-pointer"
                  style={{ backgroundColor: theme.colors.accent }}
                >
                  {submitting ? "Saving Parameters..." : editingId ? "Update Settings" : "Enroll User"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;