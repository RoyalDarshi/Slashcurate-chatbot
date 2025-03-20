import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Server, Network, Users, Shield } from "lucide-react"; // Updated icons
import Loader from "./Loader";
import { ADMIN_API_URL } from "../config";
import { useTheme } from "../ThemeContext";

interface LDAPFormData {
  ldapHost: string;
  ldapPort: number;
  baseDn: string;
  userDn: string;
}

interface LDAPFormProps {
  adminId: string; // Passed as a prop
}

const LDAPForm: React.FC<LDAPFormProps> = ({ adminId }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<LDAPFormData>({
    ldapHost: "",
    ldapPort: 0,
    baseDn: "",
    userDn: "",
  });
  const [loading, setLoading] = useState(false);
  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "ldapPort" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId) {
      toast.error("Admin session expired. Please log in again.", {
        theme: mode,
      });
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(
        `${ADMIN_API_URL}/store-ldap`,
        { ...formData },
        {
          headers: {
            Authorization: `Bearer ${adminId}`,
          },
        }
      );
      setLoading(false);
      if (response.status === 200) {
        toast.success("LDAP settings saved successfully!", { theme: mode });
        setFormData({
          ldapHost: "",
          ldapPort: 0,
          baseDn: "",
          userDn: "",
        });
      }
    } catch (error) {
      setLoading(false);
      toast.error("Failed to save LDAP settings.", { theme: mode });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg p-8 rounded-2xl shadow-xl"
        style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.text}20`,
        }}
      >
        <h2
          className="text-2xl font-bold mb-8 text-center tracking-tight"
          style={{ color: theme.colors.text }}
        >
          LDAP Configuration
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col">
            <label
              className="text-sm font-medium mb-2 flex items-center"
              style={{ color: theme.colors.text }}
            >
              <Server
                className="mr-2 h-5 w-5"
                style={{ color: theme.colors.accent }}
              />
              LDAP Server Host
            </label>
            <input
              type="text"
              name="ldapHost"
              value={formData.ldapHost}
              onChange={handleChange}
              placeholder="e.g., ldap.example.com"
              className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-300 hover:border-opacity-75"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: `${theme.colors.text}40`,
                focusRingColor: theme.colors.accent,
              }}
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              className="text-sm font-medium mb-2 flex items-center"
              style={{ color: theme.colors.text }}
            >
              <Network
                className="mr-2 h-5 w-5"
                style={{ color: theme.colors.accent }}
              />
              LDAP Port
            </label>
            <input
              type="number"
              name="ldapPort"
              value={formData.ldapPort || ""}
              onChange={handleChange}
              placeholder="e.g., 389 (LDAP) or 636 (LDAPS)"
              className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-300 hover:border-opacity-75"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: `${theme.colors.text}40`,
                focusRingColor: theme.colors.accent,
              }}
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              className="text-sm font-medium mb-2 flex items-center"
              style={{ color: theme.colors.text }}
            >
              <Users
                className="mr-2 h-5 w-5"
                style={{ color: theme.colors.accent }}
              />
              Base Distinguished Name
            </label>
            <input
              type="text"
              name="baseDn"
              value={formData.baseDn}
              onChange={handleChange}
              placeholder="e.g., dc=domain,dc=com"
              className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-300 hover:border-opacity-75"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: `${theme.colors.text}40`,
                focusRingColor: theme.colors.accent,
              }}
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              className="text-sm font-medium mb-2 flex items-center"
              style={{ color: theme.colors.text }}
            >
              <Shield
                className="mr-2 h-5 w-5"
                style={{ color: theme.colors.accent }}
              />
              Admin User DN
            </label>
            <input
              type="text"
              name="userDn"
              value={formData.userDn}
              onChange={handleChange}
              placeholder="e.g., cn=admin,dc=domain,dc=com"
              className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-300 hover:border-opacity-75"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: `${theme.colors.text}40`,
                focusRingColor: theme.colors.accent,
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-md hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.colors.accent,
              color: "white",
              boxShadow: `0 6px 12px ${theme.colors.text}20`,
            }}
          >
            {loading ? "Saving..." : "Save LDAP Settings"}
          </button>
        </form>
        {loading && <Loader text="Processing LDAP configuration..." />}
        <ToastContainer
          toastStyle={{
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.text}20`,
            borderRadius: "8px",
          }}
        />
      </div>
    </div>
  );
};

export default LDAPForm;
