// LDAPManager.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Server, Network, Users, Shield, Edit3, ArrowLeft, Globe, HelpCircle } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import Loader from "./Loader";
import styled from "styled-components";
import { Theme } from "../types";
import { adminService } from "../services/adminService";
import { handleApiError } from "../utils/errorHandler";

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
    ldapPort: 389,
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
      const response = await adminService.getLdapConfig();
      if (response && response.LDAP_SERVER) {
        setConfig({
          ldapHost: response.LDAP_SERVER || "",
          ldapPort: response.LDAP_PORT || 389,
          baseDn: response.LDAP_BASE_DN || "",
          userRdn: response.LDAP_USER_RDN || "",
        });
      } else {
        setIsEditing(true);
      }
    } catch (error) {
      handleApiError(error, "Failed to fetch LDAP configuration", mode);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: name === "ldapPort" ? (value === "" ? 0 : parseInt(value) || 0) : value,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminService.storeLdapConfig({
        ldapHost: config.ldapHost,
        ldapPort: config.ldapPort || 389,
        baseDn: config.baseDn,
        userRdn: config.userRdn,
      });
      toast.success("LDAP configuration updated successfully!", {
        theme: mode,
      });
      setIsEditing(false);
    } catch (error) {
      handleApiError(error, "Failed to save LDAP configuration", mode);
    } finally {
      setIsSaving(false);
    }
  };

  const isConfigured = !!config.ldapHost;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader text="Loading directory service configurations..." />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 flex justify-center" style={{ backgroundColor: theme.colors.background }}>
      <ToastContainer toastStyle={{ backgroundColor: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: "12px" }} />
      
      <div className="w-full max-w-4xl">
        {/* SaaS Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b gap-4" style={{ borderColor: `${theme.colors.border}60` }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md" 
                style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}>
                Enterprise Auth
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-[11px] font-semibold opacity-50" style={{ color: theme.colors.text }}>Settings v2.4</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.colors.text }}>
              Directory Integration
            </h2>
            <p className="text-xs opacity-60 mt-1 font-medium max-w-lg" style={{ color: theme.colors.text }}>
              Configure single sign-on (SSO) and node lookup services using lightweight directory protocols.
            </p>
          </div>
          
          {!isEditing && (
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs self-start md:self-center cursor-pointer"
              style={{ backgroundColor: theme.colors.accent }}
            >
              <Edit3 size={13} />
              Configure Directory
            </motion.button>
          )}
        </div>

        {/* Dashboard Grid Layout (2-Column SaaS style) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Sidebar Cards (Status, Reference Guide) */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Status Panel Card */}
            <div className="p-5 rounded-2xl border shadow-xs" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 opacity-50" style={{ color: theme.colors.text }}>
                Authentication Status
              </h3>
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isConfigured ? 'bg-green-500/20' : 'bg-slate-500/20'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: theme.colors.text }}>
                    {isConfigured ? "Connected" : "Inactive"}
                  </h4>
                  <p className="text-[10px] opacity-60" style={{ color: theme.colors.text }}>
                    {isConfigured ? "Sync is operational" : "SSO mapping required"}
                  </p>
                </div>
              </div>

              {isConfigured && (
                <div className="pt-4 border-t space-y-2.5" style={{ borderColor: `${theme.colors.border}40` }}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="opacity-50" style={{ color: theme.colors.text }}>Protocol</span>
                    <span className="font-bold opacity-80" style={{ color: theme.colors.text }}>LDAP v3</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="opacity-50" style={{ color: theme.colors.text }}>Security</span>
                    <span className="font-bold opacity-80" style={{ color: theme.colors.text }}>TLS Auto</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="opacity-50" style={{ color: theme.colors.text }}>Fallback Login</span>
                    <span className="font-bold text-green-500">Enabled</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Reference Guide Card */}
            <div className="p-5 rounded-2xl border shadow-xs" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle size={14} style={{ color: theme.colors.accent }} />
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-50" style={{ color: theme.colors.text }}>
                  Configuration Help
                </h3>
              </div>
              <div className="space-y-3.5 text-xs opacity-75 leading-relaxed" style={{ color: theme.colors.text }}>
                <p>
                  <strong>Server Host:</strong> The endpoint IP or domain of your LDAP controller (e.g., <code>150.239.171.184</code> or <code>ldap.company.com</code>).
                </p>
                <p>
                  <strong>Base DN:</strong> Root node DN for discovery queries (e.g., <code>dc=domain,dc=com</code>).
                </p>
                <p>
                  <strong>RDN Mapping:</strong> The username placeholder expression. Use <code>{"{}"}</code> for parameter replacement (e.g., <code>uid={"{}"}</code>).
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Form/Display Panels (SaaS Settings Cards) */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {!isEditing ? (
                <motion.div
                  key="display"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {/* SaaS settings section 1: Network Endpoint details */}
                  <div className="p-6 rounded-2xl border shadow-xs" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                    <div className="flex items-start justify-between pb-4 mb-5 border-b" style={{ borderColor: `${theme.colors.border}40` }}>
                      <div>
                        <h4 className="text-sm font-bold" style={{ color: theme.colors.text }}>Network Node Details</h4>
                        <p className="text-[11px] opacity-60 mt-0.5" style={{ color: theme.colors.text }}>Host address mapping and active connection values.</p>
                      </div>
                      <Server size={16} className="opacity-40" style={{ color: theme.colors.accent }} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-50" style={{ color: theme.colors.text }}>Server Endpoint</span>
                        <div className="font-semibold text-sm mt-1 select-all font-mono" style={{ color: theme.colors.text }}>
                          {config.ldapHost || <span className="opacity-30 italic font-sans font-normal">No Host Configured</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-50" style={{ color: theme.colors.text }}>Connection Port</span>
                        <div className="font-semibold text-sm mt-1 font-mono" style={{ color: theme.colors.text }}>
                          {config.ldapPort || <span className="opacity-30 italic font-sans font-normal">None</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SaaS settings section 2: Schema / Node parameters */}
                  <div className="p-6 rounded-2xl border shadow-xs" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                    <div className="flex items-start justify-between pb-4 mb-5 border-b" style={{ borderColor: `${theme.colors.border}40` }}>
                      <div>
                        <h4 className="text-sm font-bold" style={{ color: theme.colors.text }}>Distinguished Tree Schema</h4>
                        <p className="text-[11px] opacity-60 mt-0.5" style={{ color: theme.colors.text }}>Lookup directories and path credentials for security mapping.</p>
                      </div>
                      <Users size={16} className="opacity-40" style={{ color: theme.colors.accent }} />
                    </div>

                    <div className="space-y-5">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-50" style={{ color: theme.colors.text }}>Base Distinguished Name (Base DN)</span>
                        <div className="font-semibold text-sm mt-1 p-2.5 rounded-lg border bg-slate-500/5 font-mono select-all break-all" 
                          style={{ color: theme.colors.text, borderColor: `${theme.colors.border}30` }}>
                          {config.baseDn || <span className="opacity-30 italic font-sans font-normal">Not Configured</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-50" style={{ color: theme.colors.text }}>User RDN Mapping</span>
                        <div className="font-semibold text-sm mt-1 p-2.5 rounded-lg border bg-slate-500/5 font-mono select-all break-all" 
                          style={{ color: theme.colors.text, borderColor: `${theme.colors.border}30` }}>
                          {config.userRdn || <span className="opacity-30 italic font-sans font-normal">Not Configured</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* SaaS Edit Settings Panel (Boxed Vercel-Style settings group card) */}
                    <div className="rounded-2xl border shadow-xs overflow-hidden" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                      <div className="p-6 border-b" style={{ borderColor: `${theme.colors.border}40` }}>
                        {config.ldapHost && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold opacity-60 hover:opacity-100 mb-4 hover:translate-x-[-2px] transition-all cursor-pointer"
                            style={{ color: theme.colors.text }}
                          >
                            <ArrowLeft size={12} />
                            Cancel editing
                          </button>
                        )}
                        <h4 className="text-sm font-bold" style={{ color: theme.colors.text }}>Connection Configuration</h4>
                        <p className="text-[11px] opacity-60 mt-0.5" style={{ color: theme.colors.text }}>Define endpoint and routing keys for your LDAP controller.</p>
                      </div>

                      <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                          <div className="flex flex-col sm:col-span-2">
                            <label className="text-[11px] font-bold mb-2 opacity-80" style={{ color: theme.colors.text }}>
                              Server Host Link
                            </label>
                            <div className="relative flex items-center w-full">
                              <div className="absolute left-3 opacity-40">
                                <Server size={14} style={{ color: theme.colors.text }} />
                              </div>
                              <StyledInput
                                type="text"
                                name="ldapHost"
                                value={config.ldapHost}
                                onChange={handleChange}
                                theme={theme}
                                placeholder="ldap.company.com"
                                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all border font-semibold font-mono"
                                style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                                required
                              />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[11px] font-bold mb-2 opacity-80" style={{ color: theme.colors.text }}>
                              Port Number
                            </label>
                            <div className="relative flex items-center w-full">
                              <div className="absolute left-3 opacity-40">
                                <Network size={14} style={{ color: theme.colors.text }} />
                              </div>
                              <StyledInput
                                theme={theme}
                                type="number"
                                name="ldapPort"
                                value={config.ldapPort || ""}
                                onChange={handleChange}
                                placeholder="389"
                                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all border font-semibold font-mono"
                                style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold mb-2 opacity-80" style={{ color: theme.colors.text }}>
                            Base Distinguished Name (Base DN)
                          </label>
                          <div className="relative flex items-center w-full">
                            <div className="absolute left-3 opacity-40">
                              <Users size={14} style={{ color: theme.colors.text }} />
                            </div>
                            <StyledInput
                              theme={theme}
                              type="text"
                              name="baseDn"
                              value={config.baseDn}
                              onChange={handleChange}
                              placeholder="dc=company,dc=local"
                              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all border font-semibold font-mono"
                              style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                              required
                            />
                          </div>
                          <p className="text-[9px] mt-1.5 opacity-55" style={{ color: theme.colors.text }}>
                            Root directory tree branch for node lookups (e.g. <code>ou=employees,dc=enterprise,dc=com</code>).
                          </p>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold mb-2 opacity-80" style={{ color: theme.colors.text }}>
                            User Relative DN (RDN Mapping)
                          </label>
                          <div className="relative flex items-center w-full">
                            <div className="absolute left-3 opacity-40">
                              <Shield size={14} style={{ color: theme.colors.text }} />
                            </div>
                            <StyledInput
                              theme={theme}
                              type="text"
                              name="userRdn"
                              value={config.userRdn}
                              onChange={handleChange}
                              placeholder="uid={},ou=users"
                              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all border font-semibold font-mono"
                              style={{ backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }}
                              required
                            />
                          </div>
                          <p className="text-[9px] mt-1.5 opacity-55" style={{ color: theme.colors.text }}>
                            LDAP login template inject schema. Enter <code>{"{}"}</code> for user input parameter (e.g. <code>uid={"{}"}</code>).
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex justify-end gap-3.5">
                      {config.ldapHost && (
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                          }}
                          className="px-5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer"
                          style={{ color: theme.colors.text, backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
                        >
                          Discard
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2 rounded-xl text-xs font-bold transition-all text-white shadow-xs cursor-pointer"
                        style={{
                          backgroundColor: theme.colors.accent,
                          opacity: isSaving ? 0.75 : 1,
                        }}
                      >
                        {isSaving ? "Saving Configuration..." : "Save Settings"}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDAPManager;
