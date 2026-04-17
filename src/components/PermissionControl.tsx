import React, { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { Plus, Trash2, Save, Users, Database } from "lucide-react";
import { toast } from "react-toastify";
import { API_URL } from "../config";

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

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (e) {
      toast.error("Failed to fetch groups");
    }
  };

  const fetchUsersAndConnections = async () => {
    try {
      const [usersRes, connsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/connections`, { headers: { Authorization: `Bearer ${token}` } }) // Wait, AdminDashboard uses a different endpoint for connections list maybe? Or just use `/connections/admin/list` POST
      ]);

      if (usersRes.ok) {
        const udata = await usersRes.json();
        setUsers(udata.users || []);
      }
      // Let's use the POST endpoint for admin connections
      const pConnsRes = await fetch(`${API_URL}/connections/admin/list`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (pConnsRes.ok) {
          const cdata = await pConnsRes.json();
          setConnections(cdata.connections || []);
      }

    } catch (e) {
      toast.error("Failed to fetch users or connections");
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
      const res = await fetch(`${API_URL}/api/admin/groups/${groupId}/mapping`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroupUsers(data.users || []);
        // Make sure connection IDs are stored as strings for easy matching in checkboxes
        setGroupConnections((data.connections || []).map(String));
      }
    } catch (e) {
      toast.error("Failed to load group mappings");
    }
    setLoading(false);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newGroupName.trim() })
      });
      if (res.ok) {
        toast.success("Group created");
        setNewGroupName("");
        fetchGroups();
      } else {
         const d = await res.json();
         toast.error(d.error || "Failed to create group");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const deleteGroup = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/groups/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Group deleted");
        if (selectedGroupId === id) setSelectedGroupId(null);
        fetchGroups();
      }
    } catch (e) {
      toast.error("Failed to delete group");
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
            className="flex-1 p-2 rounded border focus:outline-none focus:ring-1"
            style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
          />
          <button 
            onClick={createGroup}
            disabled={!newGroupName.trim()}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center w-10"
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
              className={`p-3 rounded cursor-pointer border flex justify-between items-center transition-colors`}
              style={{
                 backgroundColor: selectedGroupId === g.id ? `${theme.colors.accent}20` : theme.colors.surface,
                 borderColor: selectedGroupId === g.id ? theme.colors.accent : theme.colors.border
              }}
            >
              <span className="font-medium truncate">{g.name}</span>
              <button onClick={(e) => deleteGroup(g.id, e)} className="text-red-500 hover:text-red-700 p-1">
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
                    <h2 className="text-2xl font-bold">
                       Manage: {groups.find(g => g.id === selectedGroupId)?.name}
                    </h2>
                    <button 
                       onClick={saveMapping}
                       className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow"
                    >
                       <Save size={18} /> Save Mappings
                    </button>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                   {/* Users List */}
                   <div className="flex-1 flex flex-col p-4 rounded border" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                      <h3 className="font-bold mb-4 border-b pb-2 flex items-center gap-2" style={{ borderColor: theme.colors.border }}>
                         <Users size={16} /> Assign Users
                      </h3>
                      <div className="overflow-y-auto flex-1 space-y-1">
                         {users.length === 0 && <p className="text-sm opacity-60">No users found.</p>}
                         {users.map(u => (
                            <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-black hover:bg-opacity-5 rounded cursor-pointer">
                               <input 
                                  type="checkbox"
                                  checked={groupUsers.includes(u.id)}
                                  onChange={() => toggleUser(u.id)}
                                  className="w-4 h-4 rounded text-blue-600"
                               />
                               <div className="flex flex-col">
                                 <span className="font-medium">{u.username}</span>
                                 <span className="text-xs opacity-70">{u.email}</span>
                               </div>
                            </label>
                         ))}
                      </div>
                   </div>

                   {/* Connections List */}
                   <div className="flex-1 flex flex-col p-4 rounded border" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                      <h3 className="font-bold mb-4 border-b pb-2 flex items-center gap-2" style={{ borderColor: theme.colors.border }}>
                         <Database size={16} /> Assign Connections
                      </h3>
                      <div className="overflow-y-auto flex-1 space-y-1">
                         {connections.length === 0 && <p className="text-sm opacity-60">No admin connections found.</p>}
                         {connections.map(c => (
                            <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-black hover:bg-opacity-5 rounded cursor-pointer">
                               <input 
                                  type="checkbox"
                                  checked={groupConnections.includes(String(c.id))}
                                  onChange={() => toggleConnection(String(c.id))}
                                  className="w-4 h-4 rounded text-blue-600"
                               />
                               <span className="font-medium">{c.connectionName}</span>
                            </label>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default PermissionControl;
