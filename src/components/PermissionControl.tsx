import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../ThemeContext";
import {
  Plus, Trash2, Save, Users, Database,
  ChevronDown, ChevronRight, Search, Shield,
  CheckSquare, Square, RefreshCw, X, Check,
  ShieldCheck, Link2, Globe,
} from "lucide-react";
import { toast } from "react-toastify";
import { adminService } from "../services/adminService";
import { connectionService } from "../services/connectionService";
import { handleApiError } from "../utils/errorHandler";
import { API_URL } from "../config";

interface PermissionControlProps { token: string; }

interface Group { id: string; name: string; }
interface User  { id: string; username: string; email: string; }
interface Connection { id: string; connectionName: string; }

const avatarColor = (name: string) => {
  const colors = [
    ["#6366f1","#4f46e5"], ["#8b5cf6","#7c3aed"], ["#ec4899","#db2777"],
    ["#f59e0b","#d97706"], ["#10b981","#059669"], ["#3b82f6","#2563eb"],
  ];
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length;
  return colors[idx];
};
const initials = (name: string) =>
  name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

const PermissionControl: React.FC<PermissionControlProps> = ({ token }) => {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";

  const [groups, setGroups]           = useState<Group[]>([]);
  const [users, setUsers]             = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupUsers, setGroupUsers]           = useState<string[]>([]);
  const [groupConnections, setGroupConnections] = useState<string[]>([]);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [creating, setCreating]       = useState(false);
  const [showUsers, setShowUsers]     = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [userSearch, setUserSearch]   = useState("");
  const [connSearch, setConnSearch]   = useState("");

  const glassStyle = {
    backgroundColor: isDark ? theme.colors.surface : "#ffffff",
    borderColor: theme.colors.border,
  };

  const inputStyle = {
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
    borderColor: theme.colors.border,
    color: theme.colors.text,
  };

  const fetchGroups = useCallback(async () => {
    try {
      const data = await adminService.getGroups();
      setGroups(data.groups || []);
    } catch (e) { handleApiError(e, "Failed to fetch groups"); }
  }, []);

  const fetchUsersAndConnections = useCallback(async () => {
    try {
      const [ud, cd] = await Promise.all([
        adminService.getUsers(),
        connectionService.getAdminConnections(),
      ]);
      setUsers(ud.users || []);
      setConnections(cd.connections || []);
    } catch (e) { handleApiError(e, "Failed to fetch users or connections"); }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchUsersAndConnections();
  }, [fetchGroups, fetchUsersAndConnections]);

  useEffect(() => {
    if (selectedGroupId) loadGroupMapping(selectedGroupId);
    else { setGroupUsers([]); setGroupConnections([]); }
  }, [selectedGroupId]);

  const loadGroupMapping = async (groupId: string) => {
    setLoading(true);
    try {
      const data = await adminService.getGroupMapping(groupId);
      setGroupUsers(data.users || []);
      setGroupConnections((data.connections || []).map(String));
    } catch (e) { handleApiError(e, "Failed to load group mappings"); }
    setLoading(false);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      await adminService.createGroup(newGroupName.trim());
      toast.success("Group created");
      setNewGroupName("");
      fetchGroups();
    } catch (e: any) { handleApiError(e, "Failed to create group"); }
    setCreating(false);
  };

  const deleteGroup = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this group? All mappings will be lost.")) return;
    try {
      await adminService.deleteGroup(id);
      toast.success("Group deleted");
      if (selectedGroupId === id) setSelectedGroupId(null);
      fetchGroups();
    } catch (e) { handleApiError(e, "Failed to delete group"); }
  };

  const saveMapping = async () => {
    if (!selectedGroupId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/groups/${selectedGroupId}/mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ users: groupUsers, connections: groupConnections.map(Number) }),
      });
      if (res.ok) toast.success("Mappings saved successfully!");
      else toast.error("Failed to save mappings");
    } catch { toast.error("Network error"); }
    setSaving(false);
  };

  const toggleUser = (uid: string) =>
    setGroupUsers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);

  const toggleConnection = (cid: string) =>
    setGroupConnections(prev => prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredConns = connections.filter(c =>
    c.connectionName.toLowerCase().includes(connSearch.toLowerCase())
  );

  return (
    <div className="flex h-full overflow-hidden" style={{ color: theme.colors.text }}>

      {/* ══════════ LEFT SIDEBAR ══════════ */}
      <div
        className="w-72 flex-shrink-0 flex flex-col border-r"
        style={{ borderColor: theme.colors.border, backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)" }}
      >
        {/* Sidebar Header */}
        <div className="px-4 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})` }}>
              <Shield size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: theme.colors.text }}>Permission Groups</h2>
              <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Create Group Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New group name…"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createGroup()}
              className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none transition-all min-w-0"
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = theme.colors.accent; e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.accent}18`; }}
              onBlur={e => { e.currentTarget.style.borderColor = theme.colors.border; e.currentTarget.style.boxShadow = "none"; }}
            />
            <button
              onClick={createGroup}
              disabled={!newGroupName.trim() || creating}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md"
              style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})` }}
              title="Create group"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Group List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Shield size={28} style={{ color: theme.colors.textSecondary, opacity: 0.4 }} />
              <p className="text-xs text-center" style={{ color: theme.colors.textSecondary }}>No groups yet.<br/>Create one above.</p>
            </div>
          ) : groups.map(g => {
            const isActive = selectedGroupId === g.id;
            return (
              <div
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className="group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: isActive
                    ? `${theme.colors.accent}18`
                    : "transparent",
                  border: `1px solid ${isActive ? `${theme.colors.accent}40` : "transparent"}`,
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${avatarColor(g.name)[0]}, ${avatarColor(g.name)[1]})` }}
                  >
                    {initials(g.name)}
                  </div>
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: isActive ? theme.colors.accent : theme.colors.text }}
                  >
                    {g.name}
                  </span>
                </div>
                <button
                  onClick={(e) => deleteGroup(g.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:scale-110"
                  style={{ color: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" }}
                  title="Delete group"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════ MAIN PANEL ══════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedGroupId ? (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.colors.accent}20, ${theme.colors.accent}08)`, border: `1px solid ${theme.colors.accent}20` }}
            >
              <ShieldCheck size={36} style={{ color: theme.colors.accent, opacity: 0.7 }} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: theme.colors.text }}>Select a group</p>
              <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                Choose a group from the sidebar to manage<br />its users and connection permissions.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${theme.colors.accent}40`, borderTopColor: theme.colors.accent }} />
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Loading mappings…</p>
          </div>
        ) : (
          <>
            {/* Panel Header */}
            <div
              className="px-6 pt-5 pb-4 border-b flex items-center justify-between gap-4 flex-shrink-0"
              style={{ borderColor: theme.colors.border }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${avatarColor(selectedGroup!.name)[0]}, ${avatarColor(selectedGroup!.name)[1]})` }}
                  >
                    {initials(selectedGroup!.name)}
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                    {selectedGroup!.name}
                  </h2>
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                  {groupUsers.length} user{groupUsers.length !== 1 ? "s" : ""} · {groupConnections.length} connection{groupConnections.length !== 1 ? "s" : ""} assigned
                </p>
              </div>
              <button
                onClick={saveMapping}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95 shadow-md disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})` }}
              >
                {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Saving…" : "Save Mappings"}
              </button>
            </div>

            {/* Mapping Sections */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">

              {/* ── Users Section ── */}
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ ...glassStyle, boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <button
                  onClick={() => setShowUsers(p => !p)}
                  className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.colors.accent}15` }}>
                      <Users size={15} style={{ color: theme.colors.accent }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold" style={{ color: theme.colors.text }}>Assign Users</p>
                      <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                        {groupUsers.length} of {users.length} selected
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${theme.colors.accent}18`, color: theme.colors.accent }}
                    >
                      {groupUsers.length} assigned
                    </span>
                    {showUsers ? <ChevronDown size={16} style={{ color: theme.colors.textSecondary }} /> : <ChevronRight size={16} style={{ color: theme.colors.textSecondary }} />}
                  </div>
                </button>

                {showUsers && (
                  <div className="border-t px-5 pb-4" style={{ borderColor: theme.colors.border }}>
                    {/* Search */}
                    <div className="relative mt-4 mb-3">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.colors.textSecondary }} />
                      <input
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        placeholder="Search users…"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border text-xs focus:outline-none transition-all"
                        style={inputStyle}
                        onFocus={e => { e.currentTarget.style.borderColor = theme.colors.accent; }}
                        onBlur={e => { e.currentTarget.style.borderColor = theme.colors.border; }}
                      />
                    </div>

                    {/* Select/Deselect All */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs" style={{ color: theme.colors.textSecondary }}>{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</span>
                      <button
                        onClick={() => {
                          const allIds = filteredUsers.map(u => u.id);
                          const allSelected = allIds.every(id => groupUsers.includes(id));
                          setGroupUsers(prev =>
                            allSelected
                              ? prev.filter(id => !allIds.includes(id))
                              : [...new Set([...prev, ...allIds])]
                          );
                        }}
                        className="text-xs font-semibold transition-opacity hover:opacity-80"
                        style={{ color: theme.colors.accent }}
                      >
                        {filteredUsers.every(u => groupUsers.includes(u.id)) ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredUsers.length === 0 && (
                        <p className="col-span-2 text-xs py-4 text-center" style={{ color: theme.colors.textSecondary }}>No users found</p>
                      )}
                      {filteredUsers.map(u => {
                        const checked = groupUsers.includes(u.id);
                        const [from, to] = avatarColor(u.username);
                        return (
                          <label
                            key={u.id}
                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                            style={{
                              backgroundColor: checked ? `${theme.colors.accent}0a` : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                              borderColor: checked ? `${theme.colors.accent}40` : theme.colors.border,
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                            >
                              {initials(u.username)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: theme.colors.text }}>{u.username}</p>
                              <p className="text-[10px] truncate" style={{ color: theme.colors.textSecondary }}>{u.email}</p>
                            </div>
                            <div
                              className="w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                              style={{
                                backgroundColor: checked ? theme.colors.accent : "transparent",
                                borderColor: checked ? theme.colors.accent : theme.colors.border,
                              }}
                              onClick={() => toggleUser(u.id)}
                            >
                              {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Connections Section ── */}
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ ...glassStyle, boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <button
                  onClick={() => setShowConnections(p => !p)}
                  className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#8b5cf615" }}>
                      <Database size={15} style={{ color: "#8b5cf6" }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold" style={{ color: theme.colors.text }}>Assign Connections</p>
                      <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                        {groupConnections.length} of {connections.length} selected
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: "#8b5cf618", color: "#8b5cf6" }}
                    >
                      {groupConnections.length} assigned
                    </span>
                    {showConnections ? <ChevronDown size={16} style={{ color: theme.colors.textSecondary }} /> : <ChevronRight size={16} style={{ color: theme.colors.textSecondary }} />}
                  </div>
                </button>

                {showConnections && (
                  <div className="border-t px-5 pb-4" style={{ borderColor: theme.colors.border }}>
                    <div className="relative mt-4 mb-3">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.colors.textSecondary }} />
                      <input
                        value={connSearch}
                        onChange={e => setConnSearch(e.target.value)}
                        placeholder="Search connections…"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border text-xs focus:outline-none transition-all"
                        style={inputStyle}
                        onFocus={e => { e.currentTarget.style.borderColor = "#8b5cf6"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = theme.colors.border; }}
                      />
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs" style={{ color: theme.colors.textSecondary }}>{filteredConns.length} connection{filteredConns.length !== 1 ? "s" : ""}</span>
                      <button
                        onClick={() => {
                          const allIds = filteredConns.map(c => String(c.id));
                          const allSelected = allIds.every(id => groupConnections.includes(id));
                          setGroupConnections(prev =>
                            allSelected
                              ? prev.filter(id => !allIds.includes(id))
                              : [...new Set([...prev, ...allIds])]
                          );
                        }}
                        className="text-xs font-semibold transition-opacity hover:opacity-80"
                        style={{ color: "#8b5cf6" }}
                      >
                        {filteredConns.every(c => groupConnections.includes(String(c.id))) ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredConns.length === 0 && (
                        <p className="col-span-2 text-xs py-4 text-center" style={{ color: theme.colors.textSecondary }}>No admin connections found</p>
                      )}
                      {filteredConns.map(c => {
                        const checked = groupConnections.includes(String(c.id));
                        return (
                          <label
                            key={c.id}
                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                            style={{
                              backgroundColor: checked ? "#8b5cf60a" : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                              borderColor: checked ? "#8b5cf640" : theme.colors.border,
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: checked ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : (isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.1)") }}
                            >
                              <Database size={14} style={{ color: checked ? "#fff" : "#8b5cf6" }} />
                            </div>
                            <span className="text-xs font-semibold flex-1 truncate" style={{ color: theme.colors.text }}>
                              {c.connectionName}
                            </span>
                            <div
                              className="w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                              style={{
                                backgroundColor: checked ? "#8b5cf6" : "transparent",
                                borderColor: checked ? "#8b5cf6" : theme.colors.border,
                              }}
                              onClick={() => toggleConnection(String(c.id))}
                            >
                              {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PermissionControl;
