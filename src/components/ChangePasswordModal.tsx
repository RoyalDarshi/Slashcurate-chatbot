import React, { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext"; // Adjust path based on your folder structure
import { API_URL } from "../config";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [status, setStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ 
    type: "", 
    message: "" 
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setStatus({ type: "", message: "" });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setStatus({ type: "", message: "" });

    // Validation
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setStatus({ type: "error", message: "All fields are required" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatus({ type: "error", message: "New passwords do not match" });
      return;
    }
    if (passwordData.newPassword.length < 4) {
      setStatus({ type: "error", message: "Password must be at least 4 characters" });
      return;
    }

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/user/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
          body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: "success", message: "Password changed successfully!" });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatus({ type: "error", message: data.error || "Failed to change password" });
      }
    } catch (error) {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="p-6 rounded-lg shadow-xl w-full max-w-sm"
        style={{ 
          backgroundColor: theme.colors.surface, 
          color: theme.colors.text,
          border: `1px solid ${theme.colors.text}20` 
        }}
      >
        <h3 className="text-xl font-bold mb-4">Change Password</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1" style={{color: theme.colors.textSecondary}}>
              Current Password
            </label>
            <input
              type="password"
              name="oldPassword"
              value={passwordData.oldPassword}
              onChange={handleChange}
              className="w-full p-2 rounded border focus:outline-none"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: `${theme.colors.text}40`
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1" style={{color: theme.colors.textSecondary}}>
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handleChange}
              className="w-full p-2 rounded border focus:outline-none"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: `${theme.colors.text}40`
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{color: theme.colors.textSecondary}}>
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handleChange}
              className="w-full p-2 rounded border focus:outline-none"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: `${theme.colors.text}40`
              }}
            />
          </div>
        </div>

        {/* Status Message */}
        {status.message && (
          <div className={`mt-3 text-sm p-2 rounded ${status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {status.message}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded hover:bg-gray-200 transition-colors"
            style={{ color: theme.colors.textSecondary }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 rounded text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: theme.colors.accent }}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;