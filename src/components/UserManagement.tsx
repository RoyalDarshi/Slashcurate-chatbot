import React, { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { adminService } from "../services/adminService";
import { handleApiError } from "../utils/errorHandler";

interface UserManagementProps {
  token: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  allowed_to_create_connection?: boolean;
  allowed_to_create_public_connection?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ token }) => {
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ username: "", email: "", password: "", allowedToCreateConnection: true, allowedToCreatePublicConnection: true });

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      if (data && data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      handleApiError(error, "Failed to fetch users", mode);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminService.updateUser(editingId, formData);
      } else {
        await adminService.createUser(formData);
      }
      
      toast.success(`User ${editingId ? "updated" : "created"} successfully`);
      setShowModal(false);
      fetchUsers(); // Refresh list
    } catch (error) {
      handleApiError(error, "Failed to save user", mode);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await adminService.deleteUser(id);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      handleApiError(error, "Failed to delete user", mode);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({ username: user.username, email: user.email, password: "", allowedToCreateConnection: user.allowed_to_create_connection ?? true, allowedToCreatePublicConnection: user.allowed_to_create_public_connection ?? true });
    } else {
      setEditingId(null);
      setFormData({ username: "", email: "", password: "", allowedToCreateConnection: true, allowedToCreatePublicConnection: true });
    }
    setShowModal(true);
  };

  return (
    <div className="p-8 h-full" style={{ color: theme.colors.text }}>
      <div className="flex justify-between items-center mb-6">
        <h2
          className="text-3xl font-bold"
          style={{ color: theme.colors.text }}
        >
          Manage Users
        </h2>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-xs"
          style={{ backgroundColor: theme.colors.accent }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accentHover)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accent)}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <p className="opacity-70">Loading users...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-lg border pb-2" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface, boxShadow: theme.colors.background === "#0F172A" ? "0 4px 20px -2px rgba(0, 0, 0, 0.4)" : "0 4px 20px -2px rgba(0, 0, 0, 0.05)" }}>
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.colors.border}`, backgroundColor: theme.colors.background }}>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider opacity-70">Username</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider opacity-70">Email</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider opacity-70">Joined</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider opacity-70 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-black/5" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                  <td className="px-6 py-4 font-medium">{user.username}</td>
                  <td className="px-6 py-4 opacity-80">{user.email}</td>
                  <td className="px-6 py-4 opacity-80">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 flex justify-end gap-3">
                    <button onClick={() => openModal(user)} className="p-2 rounded-lg transition-colors" style={{ color: theme.colors.textSecondary }} onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.hover)} onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg transition-colors" style={{ color: theme.colors.error || "#ef4444" }} onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.hover)} onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center opacity-70">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Create / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowModal(false)} 
          />
          <div
            className="relative w-full max-w-[500px] h-full shadow-2xl flex flex-col animate-slide-in-right"
            style={{ backgroundColor: theme.colors.background, borderLeft: `1px solid ${theme.colors.border}` }}
          >
            <div
              className="flex items-center justify-between px-6 py-5 flex-shrink-0"
              style={{ backgroundColor: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}` }}
            >
              <div>
                <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                  {editingId ? "Edit User" : "Create User"}
                </h2>
                <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                  {editingId ? "Modify user details and permissions" : "Add a new user to the system"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full transition-colors duration-200"
                style={{ color: theme.colors.textSecondary }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.hover)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6" style={{ color: theme.colors.text }}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 border transition-all"
                    style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text, focusRingColor: theme.colors.accent }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 border transition-all"
                    style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text, focusRingColor: theme.colors.accent }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {editingId ? "New Password (leave blank to keep current)" : "Password"}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 border transition-all"
                    style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text, focusRingColor: theme.colors.accent }}
                  />
                </div>

                <div className="pt-4 space-y-3">
                  <h4 className="text-sm font-semibold opacity-70 uppercase tracking-wider mb-2">Permissions</h4>
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-black/5 transition-colors" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                    <input
                      type="checkbox"
                      checked={formData.allowedToCreateConnection}
                      onChange={(e) => setFormData({ ...formData, allowedToCreateConnection: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Create Connections</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-black/5 transition-colors" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                    <input
                      type="checkbox"
                      checked={formData.allowedToCreatePublicConnection}
                      onChange={(e) => setFormData({ ...formData, allowedToCreatePublicConnection: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Create Public Connections</span>
                  </label>
                </div>
                
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-lg border font-medium transition-colors"
                    style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg font-medium text-white transition-all shadow-sm"
                    style={{ backgroundColor: theme.colors.accent }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accentHover)}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accent)}
                  >
                    {editingId ? "Save Changes" : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;