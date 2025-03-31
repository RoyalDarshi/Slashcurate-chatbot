import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Server, Network, Users, Shield } from "lucide-react"; // Updated icons
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import { Theme } from "../types";
import { storeLdapConfig } from "../api";

interface LDAPFormData {
  ldapHost: string;
  ldapPort: number;
  baseDn: string;
  userRdn: string;
}

interface LDAPFormProps {
  adminId: string; // Passed as a prop
}

export const StyledInput = styled.input<{ theme: Theme }>`
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-text-fill-color: ${(props) => props.theme.colors.text} !important;
    color: ${(props) => props.theme.colors.text} !important;
    background-color: ${(props) => props.theme.colors.background} !important;
    caret-color: ${(props) =>
      props.theme.colors.text} !important; /* Cursor color */
    transition: background-color 5000s ease-in-out 0s;
  }
`;

const LDAPForm: React.FC<LDAPFormProps> = ({ adminId }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<LDAPFormData>({
    ldapHost: "",
    ldapPort: 0,
    baseDn: "",
    userRdn: "",
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
    const token=sessionStorage.getItem("token")
    if (!token) {
      toast.error("Admin session expired. Please log in again.", {
        theme: mode,
      });
      return;
    }
    try {
      setLoading(true);
      // const response = await axios.post(
      //   `${ADMIN_API_URL}/store-ldap`,
      //   { ...formData },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${adminId}`,
      //     },
      //   }
      // );
      const response = await storeLdapConfig(token, formData);
      setLoading(false);
      if (response.status === 200) {
        toast.success("LDAP settings saved successfully!", { theme: mode });
        setFormData({
          ldapHost: "",
          ldapPort: 0,
          baseDn: "",
          userRdn: "",
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
            <StyledInput
              type="text"
              name="ldapHost"
              value={formData.ldapHost}
              onChange={handleChange}
              theme={theme}
              spellCheck="false"
              placeholder="e.g., ldap.example.com"
              className="w-full p-3 rounded-lg focus:outline-none focus:ring-2  transition-all duration-300"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
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
            <StyledInput
              theme={theme}
              type="number"
              name="ldapPort"
              value={formData.ldapPort || ""}
              onChange={handleChange}
              placeholder="e.g., 389 (LDAP) or 636 (LDAPS)"
              className="w-full p-3 rounded-lg focus:outline-none focus:ring-2  transition-all duration-300"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
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
            <StyledInput
              theme={theme}
              type="text"
              name="baseDn"
              spellCheck="false"
              value={formData.baseDn}
              onChange={handleChange}
              placeholder="e.g., dc=domain,dc=com"
              className="w-full p-3 rounded-lg focus:outline-none focus:ring-2  transition-all duration-300"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
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
              User RDN
            </label>
            <StyledInput
              theme={theme}
              type="text"
              name="userRdn"
              value={formData.userRdn}
              onChange={handleChange}
              spellCheck="false"
              placeholder="e.g., uid={},ou=people"
              className="w-full p-3 rounded-lg focus:outline-none focus:ring-2  transition-all duration-300"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded-lg focus:outline-none focus:ring-2  transition-all duration-300"
            style={{
              backgroundColor: theme.colors.accent,
              color: "white",
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
