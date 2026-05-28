import React, { useState, useEffect } from "react";
import { Server, Network, Users, Shield, Edit2, ArrowLeft } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { getLdapConfig, storeLdapConfig } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import Loader from "./Loader";
import styled from "styled-components";
import { Theme } from "../types";
import { authService } from "../services/authService";

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
`;

interface LDAPConfigDisplayProps {
  ldapHost: string;
  ldapPort: number;
  baseDn: string;
  userRdn: string;
}

const LDAPManager = () => {
  const { theme } = useTheme();
  const [config, setConfig] = useState<LDAPConfigDisplayProps>({
    ldapHost: "",
    ldapPort: 0,
    baseDn: "",
    userRdn: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";

  useEffect(() => {
    fetchLDAPConfig();
  }, []);

  const fetchLDAPConfig = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken(true);
      if (!token) throw new Error("Token not found");

      const response = await getLdapConfig(token);
      if (response.status === 200 && response.data.LDAP_SERVER) {
        setConfig({
          ldapHost: response.data.LDAP_SERVER,
          ldapPort: response.data.LDAP_PORT,
          baseDn: response.data.LDAP_BASE_DN,
          userRdn: response.data.LDAP_USER_RDN,
        });
        setIsEditing(false);
      } else {
        setIsEditing(true); // No config found, show form
      }
    } catch (error) {
      console.error("Error fetching LDAP configuration:", error);
      setIsEditing(true); // On error or not found, default to form
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: name === "ldapPort" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = authService.getToken(true);
    if (!token) {
      toast.error("Admin session expired. Please log in again.", { theme: mode });
      return;
    }
    try {
      setIsSaving(true);
      const response = await storeLdapConfig(token, config);
      if (response.status === 200) {
        toast.success("LDAP settings saved successfully!", { theme: mode });
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Failed to save LDAP settings.", { theme: mode });
    } finally {
      setIsSaving(false);
    }
  };

  const ConfigItem = ({ icon: Icon, label, value }: { icon: React.ComponentType<any>; label: string; value: string | number }) => (
    <motion.div
      className="flex items-start gap-4 p-4 rounded-xl transition-all"
      whileHover={{ scale: 1.01 }}
      style={{
        backgroundColor: `${theme.colors.background}CC`,
        border: `1px solid ${theme.colors.border}30`,
      }}
    >
      <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.accent + "15" }}>
        <Icon className="h-5 w-5" style={{ color: theme.colors.accent }} />
      </div>
      <div className="flex-1">
        <div className="text-sm mb-1 opacity-75 font-medium" style={{ color: theme.colors.text }}>{label}</div>
        <div className="font-semibold break-words" style={{ color: theme.colors.text }}>
          {value || <span className="opacity-50 font-normal">Not configured</span>}
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader text="Loading LDAP configuration..." />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 flex justify-center" style={{ backgroundColor: theme.colors.background }}>
      <ToastContainer toastStyle={{ backgroundColor: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: "8px" }} />
      
      <div className="w-full max-w-2xl mt-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>LDAP Configuration</h2>
            <p className="text-sm mt-2 opacity-70" style={{ color: theme.colors.text }}>Manage your organizational directory connections.</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-xs"
              style={{ backgroundColor: theme.colors.accent }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accentHover)}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.colors.accent)}
            >
              <Edit2 size={16} />
              Edit Settings
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="display"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 md:p-8 rounded-3xl shadow-sm border relative"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConfigItem icon={Server} label="Server Host" value={config.ldapHost} />
                <ConfigItem icon={Network} label="Port" value={config.ldapPort || "Not configured"} />
                <div className="md:col-span-2">
                  <ConfigItem icon={Users} label="Base Distinguished Name (Base DN)" value={config.baseDn} />
                </div>
                <div className="md:col-span-2">
                  <ConfigItem icon={Shield} label="User RDN" value={config.userRdn} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 md:p-8 rounded-3xl shadow-sm border relative"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              {config.ldapHost && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="absolute top-6 left-6 flex items-center gap-1.5 text-sm font-medium transition-colors opacity-70 hover:opacity-100"
                  style={{ color: theme.colors.text }}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}
              
              <h3 className={`text-xl font-bold mb-6 ${config.ldapHost ? "text-center mt-2" : ""}`} style={{ color: theme.colors.text }}>
                {config.ldapHost ? "Edit LDAP Details" : "Set Up LDAP Connection"}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1.5 flex items-center" style={{ color: theme.colors.text }}>
                      <Server className="mr-1.5 h-4 w-4" style={{ color: theme.colors.accent }} /> Server Host
                    </label>
                    <StyledInput
                      type="text"
                      name="ldapHost"
                      value={config.ldapHost}
                      onChange={handleChange}
                      theme={theme}
                      spellCheck="false"
                      placeholder="e.g., ldap.example.com"
                      className="w-full p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all border"
                      style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1.5 flex items-center" style={{ color: theme.colors.text }}>
                      <Network className="mr-1.5 h-4 w-4" style={{ color: theme.colors.accent }} /> Port
                    </label>
                    <StyledInput
                      theme={theme}
                      type="number"
                      name="ldapPort"
                      value={config.ldapPort || ""}
                      onChange={handleChange}
                      placeholder="e.g., 389 or 636"
                      className="w-full p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all border"
                      style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1.5 flex items-center" style={{ color: theme.colors.text }}>
                    <Users className="mr-1.5 h-4 w-4" style={{ color: theme.colors.accent }} /> Base Distinguished Name (Base DN)
                  </label>
                  <StyledInput
                    theme={theme}
                    type="text"
                    name="baseDn"
                    spellCheck="false"
                    value={config.baseDn}
                    onChange={handleChange}
                    placeholder="e.g., dc=domain,dc=com"
                    className="w-full p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all border"
                    style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                    required
                  />
                  <p className="text-xs mt-1.5 opacity-60" style={{ color: theme.colors.text }}>The starting point for directory searches.</p>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1.5 flex items-center" style={{ color: theme.colors.text }}>
                    <Shield className="mr-1.5 h-4 w-4" style={{ color: theme.colors.accent }} /> User RDN
                  </label>
                  <StyledInput
                    theme={theme}
                    type="text"
                    name="userRdn"
                    value={config.userRdn}
                    onChange={handleChange}
                    spellCheck="false"
                    placeholder="e.g., uid={},ou=people"
                    className="w-full p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all border"
                    style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                    required
                  />
                   <p className="text-xs mt-1.5 opacity-60" style={{ color: theme.colors.text }}>The relative distinguished name mapping for users. Use {"{}"} as placeholder for the username.</p>
                </div>

                <div className="pt-4 flex justify-end">
                  {config.ldapHost && (
                     <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-5 py-2.5 rounded-lg font-medium mr-3 transition-colors"
                        style={{ color: theme.colors.text, backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.border}` }}
                     >
                       Cancel
                     </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-lg font-medium focus:outline-none focus:ring-2 transition-all duration-300 text-white"
                    style={{
                      backgroundColor: theme.colors.accent,
                      opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    {isSaving ? "Saving Configuration..." : "Save LDAP Settings"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LDAPManager;
