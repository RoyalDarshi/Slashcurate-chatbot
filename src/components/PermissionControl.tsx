// PermissionControl.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../ThemeContext";
import {
  Plus, Trash2, Save, Users, Database,
  Search, Check, ShieldCheck, X, Shield, AlertTriangle
} from "lucide-react";
import { toast } from "react-toastify";
import { adminService } from "../services/adminService";
import { connectionService } from "../services/connectionService";
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
    box-shadow: 0 0 0 2px ${(props) => props.theme.colors.accent}20 !important;
  }
`;

const ScrollContainer = styled.div<{ theme: Theme }>`
  scrollbar-width: thin;
  scrollbar-color: ${(props) => props.theme.colors.border}30 transparent;

  &::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.border}40;
    border-radius: 9999px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: ${(props) => props.theme.colors.accent}40;
  }
`;

interface PermissionControlProps { token: string; }

interface Group { id: string; name: string; }
interface User  { id: string; username: string; email: string; }
interface Connection { id: string; connectionName: string; hostname?: string; database?: string; }

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

const PermissionControl: React.FC<PermissionControlProps> = ({ token }) => {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";

  const [groups, setGroups]           = useState<Group[]>([]);
  const [users, setUsers]             = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  
  // Mapping current selections
  const [groupUsers, setGroupUsers]           = useState<string[]>([]);
  const [groupConnections, setGroupConnections] = useState<string[]>([]);
  
  // Backups to check for unsaved modifications
  const [initialGroupUsers, setInitialGroupUsers] = useState<string[]>([]);
  const [initialGroupConnections, setInitialGroupConnections] = useState<string[]>([]);

  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [creating, setCreating]       = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [userSearch, setUserSearch]   = useState("");
  const [connSearch, setConnSearch]   = useState("");

  const newGroupInputRef = useRef<HTMLInputElement>(null);

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

  const loadGroupMapping = async (groupId: string) => {
    setLoading(true);
    try {
      const data = await adminService.getGroupMapping(groupId);
      const userIds = data.users || [];
      const connIds = (data.connections || []).map(String);
      setGroupUsers(userIds);
      setGroupConnections(connIds);
      setInitialGroupUsers(userIds);
      setInitialGroupConnections(connIds);
    } catch (e) { handleApiError(e, "Failed to load group mappings"); }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupMapping(selectedGroupId);
    } else {
      setGroupUsers([]);
      setGroupConnections([]);
      setInitialGroupUsers([]);
      setInitialGroupConnections([]);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (isCreatingGroup && newGroupInputRef.current) {
      newGroupInputRef.current.focus();
    }
  }, [isCreatingGroup]);

  // Dirty detection logic
  const isDirty = () => {
    if (!selectedGroupId) return false;
    if (groupUsers.length !== initialGroupUsers.length) return true;
    if (groupConnections.length !== initialGroupConnections.length) return true;
    
    const usersMatch = groupUsers.every(uid => initialGroupUsers.includes(uid));
    const connsMatch = groupConnections.every(cid => initialGroupConnections.includes(cid));
    
    return !usersMatch || !connsMatch;
  };

  const handleGroupSelect = (groupId: string) => {
    if (selectedGroupId === groupId) return;
    if (isDirty()) {
      if (!window.confirm("You have unsaved changes in this security group. Switching groups will discard them. Continue?")) {
        return;
      }
    }
    setSelectedGroupId(groupId);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const response = await adminService.createGroup(newGroupName.trim());
      toast.success("Group created successfully", { theme: isDark ? "dark" : "light" });
      const newGroupId = response.id;
      setNewGroupName("");
      setIsCreatingGroup(false);
      await fetchGroups();
      if (newGroupId) {
        setSelectedGroupId(newGroupId);
      }
    } catch (e: any) { handleApiError(e, "Failed to create group"); }
    setCreating(false);
  };

  const deleteGroup = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this group? All mappings will be lost.")) return;
    try {
      await adminService.deleteGroup(id);
      toast.success("Group deleted successfully", { theme: isDark ? "dark" : "light" });
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
      fetchGroups();
    } catch (e) { handleApiError(e, "Failed to delete group"); }
  };

  const saveMapping = async () => {
    if (!selectedGroupId) return;
    setSaving(true);
    try {
      await adminService.saveGroupMapping(selectedGroupId, {
        users: groupUsers,
        connections: groupConnections.map(Number),
      });
      toast.success("Mappings updated successfully!", { theme: isDark ? "dark" : "light" });
      setInitialGroupUsers(groupUsers);
      setInitialGroupConnections(groupConnections);
    } catch (error) {
      handleApiError(error, "Failed to save mappings");
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = (uid: string) =>
    setGroupUsers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);

  const toggleConnection = (cid: string) =>
    setGroupConnections(prev => prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredConns = connections.filter(c =>
    c.connectionName.toLowerCase().includes(connSearch.toLowerCase())
  );

  const dirty = isDirty();

  return (
    <div className="h-full overflow-hidden flex flex-col p-6 md:p-10" style={{ backgroundColor: theme.colors.background }}>
      {/* SaaS Top Header Section */}
      <div className="pb-6 mb-6 border-b flex-shrink-0" style={{ borderColor: `${theme.colors.border}50` }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md" 
            style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}>
            Access Control
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span className="text-[11px] font-semibold opacity-50" style={{ color: theme.colors.text }}>Group Mappings</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.colors.text }}>
          Permission Management
        </h2>
        <p className="text-xs opacity-60 mt-1 font-medium max-w-xl" style={{ color: theme.colors.text }}>
          Group team members together and select which database connection profiles they are authorized to search and access.
        </p>
      </div>

      {/* Main SaaS Master-Detail Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0">
        
        {/* Left Column: Groups administration sidebar (Span 1) */}
        <div className="lg:col-span-1 flex flex-col min-h-0 p-5 rounded-2xl border" 
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <span className="text-xs font-black uppercase tracking-wider opacity-65" style={{ color: theme.colors.text }}>
              Security Groups
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10" style={{ color: theme.colors.text }}>
              {groups.length} total
            </span>
          </div>

          {/* Group search panel */}
          <div className="relative flex items-center mb-4 flex-shrink-0">
            <Search size={12} className="absolute left-3 opacity-40 pointer-events-none" style={{ color: theme.colors.text }} />
            <StyledInput
              theme={theme}
              value={groupSearch}
              onChange={e => setGroupSearch(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none transition-all font-semibold"
              style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
            />
          </div>

          {/* Sidebar vertical list of Groups */}
          <ScrollContainer theme={theme} className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4">
            {filteredGroups.length === 0 && !isCreatingGroup && (
              <p className="text-center py-8 opacity-40 italic text-[11px]" style={{ color: theme.colors.text }}>
                {groupSearch ? "No matching groups" : "No groups created yet"}
              </p>
            )}

            {filteredGroups.map(g => {
              const isActive = selectedGroupId === g.id;
              const [from, to] = avatarColor(g.name);
              return (
                <div
                  key={g.id}
                  onClick={() => handleGroupSelect(g.id)}
                  className="group flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? `${theme.colors.accent}12` : "transparent",
                    borderColor: isActive ? theme.colors.accent : "transparent",
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                      {initials(g.name)}
                    </div>
                    <span className="text-xs font-bold truncate" 
                      style={{ color: isActive ? theme.colors.accent : theme.colors.text }}>
                      {g.name}
                    </span>
                  </div>

                  <button
                    onClick={(e) => deleteGroup(g.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}

            {/* Inline dynamic creation card */}
            <AnimatePresence mode="wait">
              {isCreatingGroup && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="p-3 rounded-xl border flex flex-col gap-2.5"
                  style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.accent }}
                >
                  <StyledInput
                    ref={newGroupInputRef}
                    type="text"
                    theme={theme}
                    placeholder="Group name..."
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") createGroup();
                      if (e.key === "Escape") {
                        setIsCreatingGroup(false);
                        setNewGroupName("");
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none font-semibold"
                    style={{ backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsCreatingGroup(false);
                        setNewGroupName("");
                      }}
                      className="p-1 rounded-md border hover:bg-slate-500/5 cursor-pointer text-xs"
                      style={{ borderColor: theme.colors.border, color: theme.colors.textSecondary }}
                    >
                      <X size={12} />
                    </button>
                    <button
                      onClick={createGroup}
                      disabled={!newGroupName.trim() || creating}
                      className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white cursor-pointer shadow-sm"
                      style={{ backgroundColor: theme.colors.accent }}
                    >
                      {creating ? "Creating..." : "Create"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollContainer>

          {/* Add group trigger button */}
          {!isCreatingGroup && (
            <button
              onClick={() => setIsCreatingGroup(true)}
              className="p-2.5 rounded-xl border border-dashed flex items-center justify-center gap-2 cursor-pointer w-full transition-all hover:border-slate-400 dark:hover:border-slate-600 group flex-shrink-0"
              style={{ borderColor: theme.colors.border, color: theme.colors.textSecondary, backgroundColor: theme.colors.background }}
            >
              <Plus size={14} className="opacity-60 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold tracking-tight">New Group</span>
            </button>
          )}
        </div>

        {/* Right Column: Mapping workspace detail pane (Span 3) */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {!selectedGroupId ? (
              // Empty State visual overlay
              <motion.div
                key="workspace-empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 border border-dashed rounded-2xl text-center flex flex-col items-center justify-center p-12 gap-4"
                style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: `${theme.colors.accent}12`, color: theme.colors.accent }}>
                  <Shield size={22} className="animate-pulse" />
                </div>
                <h4 className="text-sm font-bold" style={{ color: theme.colors.text }}>Access Scope Definition</h4>
                <p className="text-xs opacity-50 -mt-2 leading-relaxed max-w-sm" style={{ color: theme.colors.text }}>
                  Select a security group from the left pane to configure member mappings, select active databases, and manage permissions.
                </p>
              </motion.div>
            ) : (
              // Active Group Mapping Workspace
              <motion.div
                key="workspace-active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex-1 flex flex-col min-h-0"
              >
                
                {/* Active Workspace Header banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b gap-3 flex-shrink-0" 
                  style={{ borderColor: `${theme.colors.border}40` }}>
                  
                  <div>
                    <h3 className="text-lg font-black tracking-tight" style={{ color: theme.colors.text }}>
                      Configure: {selectedGroup?.name}
                    </h3>
                    <p className="text-xs opacity-60 mt-0.5 font-medium" style={{ color: theme.colors.text }}>
                      Adjust workspace mappings and database profile rules for this group.
                    </p>
                  </div>

                  {/* Actions & Dirty alert indicator */}
                  <div className="flex items-center gap-3">
                    {dirty && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Unsaved changes
                      </span>
                    )}

                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={saveMapping}
                      disabled={saving || !dirty}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white transition-all shadow-md disabled:opacity-50 cursor-pointer"
                      style={{ 
                        backgroundColor: theme.colors.accent,
                        boxShadow: dirty ? `0 4px 14px ${theme.colors.accent}40` : "none"
                      }}
                    >
                      <Save size={13} />
                      {saving ? "Saving Changes..." : "Save Scope Changes"}
                    </motion.button>
                  </div>
                </div>

                {/* Subsections columns grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
                  
                  {/* Panel 1: Members mapping layout */}
                  <div className="flex flex-col min-h-0 p-5 rounded-2xl border bg-surface" 
                    style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                    
                    <div className="pb-3 mb-4 border-b flex justify-between items-center flex-shrink-0" style={{ borderColor: `${theme.colors.border}30` }}>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: theme.colors.text }}>Workspace Users</h4>
                        <p className="text-[10px] opacity-50 mt-0.5 font-medium" style={{ color: theme.colors.text }}>Select members assigned to this group.</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${theme.colors.accent}12`, color: theme.colors.accent }}>
                        {groupUsers.length} assigned
                      </span>
                    </div>

                    {/* Search and check control toggle */}
                    <div className="flex items-center gap-3 mb-3.5 flex-shrink-0">
                      <div className="relative flex items-center flex-1">
                        <Search size={12} className="absolute left-3 opacity-40 pointer-events-none" style={{ color: theme.colors.text }} />
                        <StyledInput
                          theme={theme}
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          placeholder="Search users..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none transition-all font-semibold"
                          style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = filteredUsers.map(u => u.id);
                          const allSelected = allIds.every(id => groupUsers.includes(id));
                          setGroupUsers(prev =>
                            allSelected
                              ? prev.filter(id => !allIds.includes(id))
                              : [...new Set([...prev, ...allIds])]
                          );
                        }}
                        className="text-[10px] font-bold cursor-pointer hover:opacity-80 flex-shrink-0"
                        style={{ color: theme.colors.accent }}
                      >
                        {filteredUsers.every(u => groupUsers.includes(u.id)) ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    {/* Flat scroll list viewport */}
                    <ScrollContainer theme={theme} className="flex-1 overflow-y-auto divide-y pr-1" style={{ borderColor: `${theme.colors.border}20` }}>
                      {filteredUsers.length === 0 && (
                        <p className="text-center py-10 opacity-40 italic text-[11px]" style={{ color: theme.colors.text }}>No users matched the criteria.</p>
                      )}
                      
                      {filteredUsers.map(u => {
                        const checked = groupUsers.includes(u.id);
                        const [from, to] = avatarColor(u.username);
                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleUser(u.id)}
                            className="flex items-center justify-between gap-3 py-2.5 px-2.5 transition-all select-none hover:bg-slate-500/5 cursor-pointer first:rounded-t-lg last:rounded-b-lg"
                            style={{
                              backgroundColor: checked ? `${theme.colors.accent}05` : "transparent",
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm"
                                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                              >
                                {initials(u.username)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: theme.colors.text }}>{u.username}</p>
                                <p className="text-[10px] truncate opacity-50 mt-0.5" style={{ color: theme.colors.text }}>{u.email}</p>
                              </div>
                            </div>
                            
                            <div
                              className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer"
                              style={{
                                backgroundColor: checked ? theme.colors.accent : "transparent",
                                borderColor: checked ? theme.colors.accent : theme.colors.border,
                              }}
                            >
                              {checked && <Check size={10} className="text-white" strokeWidth={3.5} />}
                            </div>
                          </div>
                        );
                      })}
                    </ScrollContainer>
                  </div>

                  {/* Panel 2: Connections database mapping layout */}
                  <div className="flex flex-col min-h-0 p-5 rounded-2xl border bg-surface" 
                    style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                    
                    <div className="pb-3 mb-4 border-b flex justify-between items-center flex-shrink-0" style={{ borderColor: `${theme.colors.border}30` }}>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: theme.colors.text }}>Database Profiles</h4>
                        <p className="text-[10px] opacity-50 mt-0.5 font-medium" style={{ color: theme.colors.text }}>Select connections accessible by group members.</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#8b5cf612", color: "#8b5cf6" }}>
                        {groupConnections.length} assigned
                      </span>
                    </div>

                    {/* Search and check control toggle */}
                    <div className="flex items-center gap-3 mb-3.5 flex-shrink-0">
                      <div className="relative flex items-center flex-1">
                        <Search size={12} className="absolute left-3 opacity-40 pointer-events-none" style={{ color: theme.colors.text }} />
                        <StyledInput
                          theme={theme}
                          value={connSearch}
                          onChange={e => setConnSearch(e.target.value)}
                          placeholder="Search connections..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none transition-all font-semibold"
                          style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = filteredConns.map(c => String(c.id));
                          const allSelected = allIds.every(id => groupConnections.includes(id));
                          setGroupConnections(prev =>
                            allSelected
                              ? prev.filter(id => !allIds.includes(id))
                              : [...new Set([...prev, ...allIds])]
                          );
                        }}
                        className="text-[10px] font-bold cursor-pointer hover:opacity-80 flex-shrink-0"
                        style={{ color: "#8b5cf6" }}
                      >
                        {filteredConns.every(c => groupConnections.includes(String(c.id))) ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    {/* Flat scroll list viewport */}
                    <ScrollContainer theme={theme} className="flex-1 overflow-y-auto divide-y pr-1" style={{ borderColor: `${theme.colors.border}20` }}>
                      {filteredConns.length === 0 && (
                        <p className="text-center py-10 opacity-40 italic text-[11px]" style={{ color: theme.colors.text }}>No database profiles mapped.</p>
                      )}
                      
                      {filteredConns.map(c => {
                        const checked = groupConnections.includes(String(c.id));
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleConnection(String(c.id))}
                            className="flex items-center justify-between gap-3 py-2.5 px-2.5 transition-all select-none hover:bg-slate-500/5 cursor-pointer first:rounded-t-lg last:rounded-b-lg"
                            style={{
                              backgroundColor: checked ? "rgba(139,92,246,0.03)" : "transparent",
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                                style={{ background: checked ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "rgba(139,92,246,0.08)" }}
                              >
                                <Database size={13} style={{ color: checked ? "#fff" : "#8b5cf6" }} />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold truncate block" style={{ color: theme.colors.text }}>
                                  {c.connectionName}
                                </span>
                                <span className="text-[9px] opacity-40 block mt-0.5 truncate font-mono">
                                  {c.hostname || "Admin Connection Link"}
                                </span>
                              </div>
                            </div>
                            
                            <div
                              className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200"
                              style={{
                                backgroundColor: checked ? "#8b5cf6" : "transparent",
                                borderColor: checked ? "#8b5cf6" : theme.colors.border,
                              }}
                            >
                              {checked && <Check size={10} className="text-white" strokeWidth={3.5} />}
                            </div>
                          </div>
                        );
                      })}
                    </ScrollContainer>
                  </div>
                  
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default PermissionControl;
