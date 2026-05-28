import React, { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { Plus, Trash2, Save, Users, Database, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { adminService } from "../services/adminService";
import { connectionService } from "../services/connectionService";
import { handleApiError } from "../utils/errorHandler";

interface PermissionControlProps {
  token: string;
}

interface Group {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface Connection {
  id: string;
  connectionName: string;
}

const PermissionControl: React.FC<PermissionControlProps> = ({ token }) => {
  const { theme } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  
  const [groupUsers, setGroupUsers] = useState<string[]>([]);
  const [groupConnections, setGroupConnections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUsers, setShowUsers] = useState(true);
  const [showConnections, setShowConnections] = useState(true);

  const fetchGroups = async () => {
    try {
      const data = await adminService.getGroups();
      setGroups(data.groups || []);
    } catch (e) {
      handleApiError(e, "Failed to fetch groups");
    }
  };

  const fetchUsersAndConnections = async () => {
    try {
      const [usersData, connsData] = await Promise.all([
        adminService.listUsers(),
        connectionService.getAdminConnections()
      ]);
      setUsers(usersData.users || []);
      setConnections(connsData.connections || []);
    } catch (e) {
      handleApiError(e, "Failed to fetch users or connections");
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchUsersAndConnections();
  }, [token]);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupMapping(selectedGroupId);
    } else {
      setGroupUsers([]);
      setGroupConnections([]);
    }
  }, [selectedGroupId]);

  const loadGroupMapping = async (groupId: string) => {
    setLoading(true);
    try {
      const data = await adminService.getGroupMapping(groupId);
      setGroupUsers(data.users || []);
      setGroupConnections((data.connections || []).map(String));
    } catch (e) {
      handleApiError(e, "Failed to load group mappings");
    }
    setLoading(false);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await adminService.createGroup(newGroupName.trim());
      toast.success("Group created");
      setNewGroupName("");
      fetchGroups();
    } catch (e: any) {
      handleApiError(e, "Failed to create group");
    }
  };

  const deleteGroup = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      await adminService.deleteGroup(id);
      toast.success("Group deleted");
      if (selectedGroupId === id) setSelectedGroupId(null);
      fetchGroups();
    } catch (e) {
      handleApiError(e, "Failed to delete group");
    }
  };

  const saveMapping = async () => {
    if (!selectedGroupId) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/groups/${selectedGroupId}/mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          users: groupUsers,
          connections: groupConnections.map(Number) // Send back as integers
        })
      });
      if (res.ok) {
        toast.success("Mappings saved successfully!");
      } else {
        toast.error("Failed to save mappings");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const toggleUser = (uid: string) => {
    setGroupUsers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const toggleConnection = (cid: string) => {
    setGroupConnections(prev => prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]);
  };

  return (
    <div className="flex h-full p-6 text-[15px]" style={{ color: theme.colors.text }}>
      {/* Sidebar: Group List */}
      <div className="w-1/3 pr-6 flex flex-col border-r" style={{ borderColor: theme.colors.border }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
           <Users /> Permission Groups
        </h2>
        
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="New group name..." 
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className="flex-1 p-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all shadow-sm"
            style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
          />
          <button 
            onClick={createGroup}
            disabled={!newGroupName.trim()}
            className="p-2.5 rounded-lg text-white font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-12"
            style={{ backgroundColor: theme.colors.accent }}
            onMouseOver={(e) => !(!newGroupName.trim()) && (e.currentTarget.style.backgroundColor = theme.colors.accentHover)}
            onMouseOut={(e) => !(!newGroupName.trim()) && (e.currentTarget.style.backgroundColor = theme.colors.accent)}
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {groups.length === 0 && <p className="text-sm opacity-60">No groups found.</p>}
          {groups.map(g => (
            <div 
              key={g.id}
              onClick={() => setSelectedGroupId(g.id)}
              className={`p-4 rounded-xl cursor-pointer border flex justify-between items-center transition-all shadow-sm hover:-translate-y-0.5`}
              style={{
                 backgroundColor: selectedGroupId === g.id ? `${theme.colors.accent}15` : theme.colors.surface,
                 borderColor: selectedGroupId === g.id ? theme.colors.accent : theme.colors.border
              }}
            >
              <span className="font-semibold truncate">{g.name}</span>
              <button onClick={(e) => deleteGroup(g.id, e)} className="p-1.5 rounded-md transition-colors" style={{ color: theme.colors.error || "#ef4444" }} onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.hover)} onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                 <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area: Mapping Details */}
      <div className="flex-1 pl-6 flex flex-col">
         {!selectedGroupId ? (
            <div className="flex-1 flex items-center justify-center opacity-50 flex-col gap-4">
               <Users size={64} opacity={0.5} />
               <p className="text-lg">Select a group to manage permissions</p>
            </div>
         ) : loading ? (
             <p className="p-4">Loading mapped data...</p>
         ) : (
             <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold">
                       Manage: <span style={{ color: theme.colors.accent }}>{groups.find(g => g.id === selectedGroupId)?.name}</span>
                    </h2>
                    <button 
                       onClick={saveMapping}
                       className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white transition-all shadow-sm"
                       style={{ backgroundColor: theme.colors.accent }}
                       onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accentHover)}
                       onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accent)}
                    >
                       <Save size={18} /> Save Mappings
                    </button>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-6 pr-2">
                   {/* Users Section */}
                   <div className="flex flex-col rounded-xl border shadow-sm transition-all" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                      <button 
                         onClick={() => setShowUsers(!showUsers)}
                         className="flex items-center justify-between p-4 focus:outline-none hover:bg-black/5 rounded-xl transition-colors"
                      >
                         <div className="flex items-center gap-3">
                            <Users size={18} style={{ color: theme.colors.accent }} />
                            <h3 className="font-bold">Assign Users</h3>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}>
                               {groupUsers.length} Assigned
                            </span>
                         </div>
                         {showUsers ? <ChevronDown size={18} opacity={0.6} /> : <ChevronRight size={18} opacity={0.6} />}
                      </button>
                      
                      {showUsers && (
                        <div className="p-4 pt-0 border-t" style={{ borderColor: theme.colors.border }}>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                              {users.length === 0 && <p className="text-sm opacity-60">No users found.</p>}
                              {users.map(u => (
                                 <label key={u.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-black/5 transition-colors" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                                    <input 
                                       type="checkbox"
                                       checked={groupUsers.includes(u.id)}
                                       onChange={() => toggleUser(u.id)}
                                       className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                                    />
                                    <div className="flex flex-col overflow-hidden">
                                      <span className="font-semibold truncate">{u.username}</span>
                                      <span className="text-xs opacity-70 truncate">{u.email}</span>
                                    </div>
                                 </label>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>

                   {/* Connections Section */}
                   <div className="flex flex-col rounded-xl border shadow-sm transition-all" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                      <button 
                         onClick={() => setShowConnections(!showConnections)}
                         className="flex items-center justify-between p-4 focus:outline-none hover:bg-black/5 rounded-xl transition-colors"
                      >
                         <div className="flex items-center gap-3">
                            <Database size={18} style={{ color: theme.colors.accent }} />
                            <h3 className="font-bold">Assign Connections</h3>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}>
                               {groupConnections.length} Assigned
                            </span>
                         </div>
                         {showConnections ? <ChevronDown size={18} opacity={0.6} /> : <ChevronRight size={18} opacity={0.6} />}
                      </button>
                      
                      {showConnections && (
                        <div className="p-4 pt-0 border-t" style={{ borderColor: theme.colors.border }}>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                              {connections.length === 0 && <p className="text-sm opacity-60">No admin connections found.</p>}
                              {connections.map(c => (
                                 <label key={c.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-black/5 transition-colors" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                                    <input 
                                       type="checkbox"
                                       checked={groupConnections.includes(String(c.id))}
                                       onChange={() => toggleConnection(String(c.id))}
                                       className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                                    />
                                    <span className="font-semibold truncate">{c.connectionName}</span>
                                 </label>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default PermissionControl;
