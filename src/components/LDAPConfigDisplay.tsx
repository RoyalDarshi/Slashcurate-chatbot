import React, { useEffect } from "react";
import { Server, Network, Users, Shield } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { getLdapConfig } from "../api";
import { motion } from "framer-motion";

interface LDAPConfigDisplayProps {
  ldapHost: string;
  ldapPort: number;
  baseDn: string;
  userRdn: string;
}

const LDAPConfigDisplay = () => {
  const { theme } = useTheme();
  const [config, setConfig] = React.useState<LDAPConfigDisplayProps>({
    ldapHost: "",
    ldapPort: 0,
    baseDn: "",
    userRdn: "",
  });

  useEffect(() => {
    fetchLDAPConfig();
  }, []);

  const fetchLDAPConfig = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Token not found");

      const response = await getLdapConfig(token);
      if (response.status === 200) {
        setConfig({
          ldapHost: response.data.LDAP_SERVER,
          ldapPort: response.data.LDAP_PORT,
          baseDn: response.data.LDAP_BASE_DN,
          userRdn: response.data.LDAP_USER_RDN,
        });
      }
    } catch (error) {
      console.error("Error fetching LDAP configuration:", error);
      setConfig({
        ldapHost: "Error fetching data",
        ldapPort: 0,
        baseDn: "Error fetching data",
        userRdn: "Error fetching data",
      });
    }
  };

  const ConfigItem = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ComponentType<any>;
    label: string;
    value: string | number;
  }) => (
    <motion.div
      className="flex items-start gap-4 p-4 rounded-xl transition-all"
      whileHover={{ scale: 1.02 }}
      style={{
        backgroundColor: `${theme.colors.background}CC`, // Added slight transparency
        border: `1px solid ${theme.colors.border}30`,
      }}
    >
      <div
        className="p-2 rounded-lg"
        style={{ backgroundColor: theme.colors.accent + "15" }}
      >
        <Icon className="h-5 w-5" style={{ color: theme.colors.accent }} />
      </div>
      <div className="flex-1">
        <div
          className="text-sm mb-1 opacity-75"
          style={{ color: theme.colors.text }}
        >
          {label}
        </div>
        <div
          className="font-medium break-words"
          style={{ color: theme.colors.text }}
        >
          {value || <span className="opacity-50">Not configured</span>}
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        backdropFilter: "blur(10px)", // Glass effect
        boxShadow: `0 4px 16px ${theme.colors.text}20`,
        border: `1px solid ${theme.colors.border}20`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="w-full max-w-2xl p-6 rounded-3xl relative"
        style={{
          backgroundColor: `${theme.colors.surface}D9`, // Semi-transparent surface
          boxShadow: `0 8px 32px ${theme.colors.text}08`,
          backdropFilter: "blur(10px)", // Glass effect
          border: `1px solid ${theme.colors.border}20`,
        }}
      >
        <div className="flex justify-center items-center gap-3 mb-8">
          <h2
            className="text-2xl font-bold"
            style={{ color: theme.colors.text }}
          >
            LDAP Configuration
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigItem
            icon={Server}
            label="LDAP Server Host"
            value={config.ldapHost}
          />

          <ConfigItem
            icon={Network}
            label="LDAP Port"
            value={config.ldapPort || "Not configured"}
          />

          <div className="md:col-span-2">
            <ConfigItem
              icon={Users}
              label="Base Distinguished Name"
              value={config.baseDn}
            />
          </div>

          <div className="md:col-span-2">
            <ConfigItem icon={Shield} label="User RDN" value={config.userRdn} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LDAPConfigDisplay;
