import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import debounce from "lodash.debounce";
import {
  Database,
  Server,
  ChevronDown,
  Lock,
  Globe,
  Clock,
  Layers,
  User,
  Key,
  FileText,
} from "lucide-react";
import Loader from "./Loader";
import { DBCON_API_URL, API_URL } from "../config";
import { useTheme } from "../ThemeContext";
import "./ConnectionForm.css";

interface FormData {
  connectionName: string;
  description: string;
  hostname: string;
  port: string;
  database: string;
  commandTimeout: string;
  maxTransportObjects: string;
  username: string;
  password: string;
  selectedDB: string;
}

interface Errors {
  [key: string]: string;
}

interface DatabaseOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface FieldConfig {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  icon: React.ReactNode;
  placeholder?: string;
}

const databaseOptions: DatabaseOption[] = [
  {
    value: "db2",
    label: "IBM DB2",
    icon: <Server className="h-5 w-5" />,
    description: "Enterprise-class relational database management system",
  },
  {
    value: "postgresql",
    label: "PostgreSQL",
    icon: <Database className="h-5 w-5" />,
    description: "Powerful, open source object-relational database system",
  },
  {
    value: "mysql",
    label: "MySQL",
    icon: <Database className="h-5 w-5" />,
    description: "Open-source relational database management system",
  },
  {
    value: "oracle",
    label: "Oracle",
    icon: <Database className="h-5 w-5" />,
    description: "Multi-model database management system",
  },
  {
    value: "sqlserver",
    label: "SQL Server",
    icon: <Server className="h-5 w-5" />,
    description: "Microsoft's relational database management system",
  },
];

const fieldConfigs: FieldConfig[] = [
  {
    label: "Connection Name",
    name: "connectionName",
    type: "text",
    required: true,
    icon: <FileText />,
    placeholder: "Enter a unique name",
  },
  {
    label: "Description",
    name: "description",
    type: "textarea",
    icon: <FileText />,
    placeholder: "Add optional details",
  },
  {
    label: "Hostname or IP",
    name: "hostname",
    type: "text",
    required: true,
    icon: <Globe />,
    placeholder: "e.g., db.example.com",
  },
  {
    label: "Port",
    name: "port",
    type: "text",
    required: true,
    icon: <Lock />,
    placeholder: "e.g., 5432",
  },
  {
    label: "Database",
    name: "database",
    type: "text",
    required: true,
    icon: <Database />,
    placeholder: "Enter database name",
  },
  {
    label: "Command Timeout",
    name: "commandTimeout",
    type: "text",
    icon: <Clock />,
    placeholder: "Seconds (e.g., 30)",
  },
  {
    label: "Max Transport Objects",
    name: "maxTransportObjects",
    type: "text",
    icon: <Layers />,
    placeholder: "e.g., 1000",
  },
  {
    label: "Username",
    name: "username",
    type: "text",
    required: true,
    icon: <User />,
    placeholder: "Database username",
  },
  {
    label: "Password",
    name: "password",
    type: "password",
    required: true,
    icon: <Key />,
    placeholder: "Database password",
  },
];

const ConnectionForm: React.FC = () => {
  const { theme } = useTheme();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState<FormData>({
    connectionName: "",
    description: "",
    hostname: "",
    port: "",
    database: "",
    commandTimeout: "",
    maxTransportObjects: "",
    username: "",
    password: "",
    selectedDB: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isTestButtonEnabled, setIsTestButtonEnabled] = useState(false);
  const [isSubmitButtonEnabled, setIsSubmitButtonEnabled] = useState(false);
  const [isFormModified, setIsFormModified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading, please wait...");
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const isFormValid = useMemo(() => {
    const { connectionName, hostname, port, database, username, password } =
      formData;
    return Boolean(
      connectionName &&
        hostname &&
        port &&
        database &&
        username &&
        password &&
        !Object.values(errors).some((error) => error)
    );
  }, [formData, errors]);

  useEffect(() => {
    setIsTestButtonEnabled(isFormValid);
  }, [isFormValid]);

  useEffect(() => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = setTimeout(() => {
      const isModified = Object.entries(formData).some(
        ([key, value]) => key !== "selectedDB" && !!value
      );
      setIsSubmitButtonEnabled(false);
      setIsFormModified(isModified);
    }, 500);
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, [formData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".custom-select-container")) setIsSelectOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const debouncedValidateField = useCallback(
    debounce((name: string, value: string) => {
      let error = "";
      switch (name) {
        case "connectionName":
          error = !value ? "Connection Name is required." : "";
          break;
        case "hostname":
          error = !value
            ? "Hostname is required."
            : !/^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}$/.test(
                value
              ) && !/^(\d{1,3}\.){3}\d{1,3}$/.test(value)
            ? "Invalid hostname or IP."
            : "";
          break;
        case "port":
          error = !value
            ? "Port is required."
            : !/^\d+$/.test(value) ||
              parseInt(value, 10) < 1024 ||
              parseInt(value, 10) > 65535
            ? "Port must be 1024-65535."
            : "";
          break;
        case "database":
          error = !value
            ? "Database is required."
            : !/^\w+$/.test(value)
            ? "Letters, numbers, and underscores only."
            : "";
          break;
        case "username":
          error = !value
            ? "Username is required."
            : /\s/.test(value)
            ? "No spaces allowed."
            : "";
          break;
        case "password":
          error = !value ? "Password is required." : "";
          break;
      }
      setErrors((prev) => ({ ...prev, [name]: error }));
    }, 300),
    []
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    debouncedValidateField(name, value);
  };

  const handleSelectDB = (value: string) => {
    setFormData((prev) => ({ ...prev, selectedDB: value }));
    setIsSelectOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }
    const payload = { userId, connectionDetails: formData };
    try {
      setLoading(true);
      setLoadingText("Submitting form, please wait...");
      const response = await axios.post(`${API_URL}/createdbcon`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      setLoading(false);
      if (response.status === 200) {
        toast.success("Connection created successfully.");
        handleClearForm();
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (error) {
      setLoading(false);
      toast.error(
        `Error: ${
          axios.isAxiosError(error)
            ? error.response?.data?.message
            : (error as Error).message
        }`
      );
    }
  };

  const handleTestConnection = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setLoadingText("Testing connection, please wait...");
    try {
      const response = await axios.post(
        `${DBCON_API_URL}/testdbcon`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setLoading(false);
      if (response.status === 200) {
        toast.success("Connection established successfully.");
        setIsSubmitButtonEnabled(true);
      } else {
        toast.error(`Error: ${response.data.message}`);
        setIsSubmitButtonEnabled(false);
      }
    } catch {
      setLoading(false);
      toast.error("Connection failed. Check details.");
      setIsSubmitButtonEnabled(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      connectionName: "",
      description: "",
      hostname: "",
      port: "",
      database: "",
      commandTimeout: "",
      maxTransportObjects: "",
      username: "",
      password: "",
      selectedDB: formData.selectedDB,
    });
    setErrors({});
    setIsSubmitButtonEnabled(false);
    setIsTestButtonEnabled(false);
    setIsFormModified(false);
  };

  const renderInputField = ({
    label,
    name,
    type,
    required,
    icon,
    placeholder,
  }: FieldConfig) => (
    <div key={name} className="mb-4">
      <label
        className="block text-sm font-medium mb-1"
        style={{ color: theme.colors.text }}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {React.cloneElement(icon as React.ReactElement, {
            className: "h-5 w-5",
            style: { color: `${theme.colors.text}80` },
          })}
        </div>
        {type === "textarea" ? (
          <textarea
            name={name}
            value={formData[name as keyof FormData]}
            onChange={handleChange}
            placeholder={placeholder}
            className="pl-10 w-full p-3 rounded-md focus:outline-none focus:ring-2 transition-all duration-200"
            style={{
              background:
                theme.colors.background === "#f9f9f9" ? "#f0f0f0" : "#2a2a2a",
              color: theme.colors.text,
              border: `1px solid ${
                errors[name] ? "#ef4444" : theme.colors.text
              }20`,
              borderRadius: theme.borderRadius.default,
            }}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name as keyof FormData]}
            onChange={handleChange}
            required={required}
            placeholder={placeholder}
            className="pl-10 w-full p-3 rounded-md focus:outline-none focus:ring-2 transition-all duration-200"
            style={{
              background:
                theme.colors.background === "#f9f9f9" ? "#f0f0f0" : "#2a2a2a",
              color: theme.colors.text,
              border: `1px solid ${
                errors[name] ? "#ef4444" : theme.colors.text
              }20`,
              borderRadius: theme.borderRadius.default,
            }}
          />
        )}
      </div>
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
      )}
    </div>
  );

  const selectedOption = databaseOptions.find(
    (option) => option.value === formData.selectedDB
  );

  return (
    <div
      className="p-6 rounded-lg shadow-md h-full overflow-y-auto"
      style={{
        background:
          theme.colors.background === "#f9f9f9" ? "#ffffff" : "#1e1e1e",
        border: `1px solid ${theme.colors.text}20`,
      }}
    >
      <ToastContainer
        toastStyle={{
          background:
            theme.colors.background === "#f9f9f9" ? "#ffffff" : "#1e1e1e",
          color: theme.colors.text,
          border: `1px solid ${theme.colors.text}20`,
        }}
      />
      <div className="flex items-center mb-6">
        <Database
          style={{ color: theme.colors.accent }}
          className="h-8 w-8 mr-3"
        />
        <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
          New Database Connection
        </h2>
      </div>

      <div className="mb-8 custom-select-container">
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: theme.colors.text }}
        >
          Select Database Engine
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="w-full p-3 rounded-md flex items-center justify-between focus:outline-none focus:ring-2 transition-all duration-200"
            style={{
              background:
                theme.colors.background === "#f9f9f9" ? "#f0f0f0" : "#2a2a2a",
              border: `1px solid ${theme.colors.text}20`,
              borderRadius: theme.borderRadius.default,
              color: theme.colors.text,
            }}
          >
            {selectedOption ? (
              <div className="flex items-center">
                {React.cloneElement(selectedOption.icon as React.ReactElement, {
                  style: { color: theme.colors.accent },
                })}
                <span className="ml-3 font-medium">{selectedOption.label}</span>
              </div>
            ) : (
              <span style={{ color: `${theme.colors.text}80` }}>
                Select a database engine
              </span>
            )}
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-200 ${
                isSelectOpen ? "rotate-180" : ""
              }`}
              style={{ color: `${theme.colors.text}80` }}
            />
          </button>
          {isSelectOpen && (
            <div
              className="absolute z-10 mt-2 w-full rounded-md shadow-lg max-h-72 overflow-auto"
              style={{
                background:
                  theme.colors.background === "#f9f9f9" ? "#ffffff" : "#1e1e1e",
                border: `1px solid ${theme.colors.text}20`,
                borderRadius: theme.borderRadius.default,
              }}
            >
              {databaseOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelectDB(option.value)}
                  className="p-3 flex flex-col cursor-pointer hover:bg-opacity-10 transition-colors duration-150"
                  style={{
                    backgroundColor:
                      formData.selectedDB === option.value
                        ? `${theme.colors.accent}10`
                        : undefined,
                  }}
                >
                  <div className="flex items-center">
                    {React.cloneElement(option.icon as React.ReactElement, {
                      style: { color: theme.colors.accent },
                    })}
                    <span
                      className="ml-3 font-medium"
                      style={{ color: theme.colors.text }}
                    >
                      {option.label}
                    </span>
                  </div>
                  <p
                    className="text-xs mt-1 ml-8"
                    style={{ color: `${theme.colors.text}80` }}
                  >
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {formData.selectedDB && (
        <div
          className="pt-6 border-t"
          style={{ borderColor: `${theme.colors.text}20` }}
        >
          <div className="flex items-center mb-6">
            {React.cloneElement(selectedOption!.icon as React.ReactElement, {
              style: { color: theme.colors.accent },
            })}
            <h3
              className="ml-3 text-xl font-semibold"
              style={{ color: theme.colors.text }}
            >
              {selectedOption?.label} Connection Details
            </h3>
          </div>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {fieldConfigs.map((config) => renderInputField(config))}
            <div className="md:col-span-2 flex flex-wrap justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={handleClearForm}
                disabled={!isFormModified}
                className="px-6 py-2 w-full md:w-auto rounded-md font-medium shadow-md transition-all duration-200"
                style={{
                  background: isFormModified
                    ? "#ef4444"
                    : `${theme.colors.text}20`,
                  color: theme.colors.text,
                  borderRadius: theme.borderRadius.default,
                  boxShadow: isFormModified
                    ? `0 4px 6px ${theme.colors.text}20`
                    : "none",
                  opacity: isFormModified ? 1 : 0.5,
                  cursor: isFormModified ? "pointer" : "not-allowed",
                }}
              >
                Clear Form
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!isTestButtonEnabled}
                className="px-6 py-2 w-full md:w-auto rounded-md font-medium shadow-md transition-all duration-200"
                style={{
                  background: isTestButtonEnabled
                    ? "#3b82f6"
                    : `${theme.colors.text}20`,
                  color: theme.colors.text,
                  borderRadius: theme.borderRadius.default,
                  boxShadow: isTestButtonEnabled
                    ? `0 4px 6px ${theme.colors.text}20`
                    : "none",
                  opacity: isTestButtonEnabled ? 1 : 0.5,
                  cursor: isTestButtonEnabled ? "pointer" : "not-allowed",
                }}
              >
                Test Connection
              </button>
              <button
                type="submit"
                disabled={!isSubmitButtonEnabled}
                className="px-6 py-2 w-full md:w-auto rounded-md font-medium shadow-md transition-all duration-200"
                style={{
                  background: isSubmitButtonEnabled
                    ? theme.colors.accent
                    : `${theme.colors.text}20`,
                  color: theme.colors.text,
                  borderRadius: theme.borderRadius.default,
                  boxShadow: isSubmitButtonEnabled
                    ? `0 4px 6px ${theme.colors.text}20`
                    : "none",
                  opacity: isSubmitButtonEnabled ? 1 : 0.5,
                  cursor: isSubmitButtonEnabled ? "pointer" : "not-allowed",
                }}
              >
                Submit
              </button>
            </div>
            {loading && (
              <div className="md:col-span-2 mt-4">
                <Loader text={loadingText} />
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default ConnectionForm;
