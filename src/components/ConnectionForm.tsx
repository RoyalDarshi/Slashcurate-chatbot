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
  ClipboardList, // Icon for Extract Metadata
} from "lucide-react";
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import "./ConnectionForm.css";
import {
  createAdminConnection,
  createUserConnection,
  testConnection,
} from "../api";
import { CHATBOT_API_URL } from "../config";

// Define interfaces for type safety
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
  name: keyof FormData; // Ensure name matches FormData keys
  type: string;
  required?: boolean;
  icon: React.ReactNode;
  placeholder?: string;
}

interface ConnectionFormProps {
  isAdmin: boolean; // Determines if creating admin default connection or user connection
  token: string; // Token from sessionStorage (JWT for user or admin)
  onSuccess?: () => void; // Optional callback after successful submission
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
  {
    value: "mongodb",
    label: "MongoDB",
    icon: <Database className="h-5 w-5" />,
    description: "NoSQL document-oriented database",
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

const ConnectionForm: React.FC<ConnectionFormProps> = ({
  isAdmin,
  token,
  onSuccess,
}) => {
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
  const [isExtractMetadataButtonEnabled, setIsExtractMetadataButtonEnabled] =
    useState(false);
  const [isSubmitButtonEnabled, setIsSubmitButtonEnabled] = useState(false);
  const [isFormModified, setIsFormModified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading, please wait...");
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const [isTestSuccessful, setIsTestSuccessful] = useState(false);
  const [isMetadataExtracted, setIsMetadataExtracted] = useState(false);

  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";

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
    // If form becomes invalid, reset downstream button states
    if (!isFormValid) {
      setIsTestSuccessful(false);
      setIsMetadataExtracted(false);
    }
  }, [isFormValid]);

  useEffect(() => {
    setIsExtractMetadataButtonEnabled(isTestSuccessful && !isMetadataExtracted);
  }, [isTestSuccessful, isMetadataExtracted]);

  useEffect(() => {
    setIsSubmitButtonEnabled(isMetadataExtracted);
  }, [isMetadataExtracted]);

  useEffect(() => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = setTimeout(() => {
      const isModified = Object.entries(formData).some(
        ([key, value]) => key !== "selectedDB" && !!value
      );
      setIsFormModified(isModified);
      if (isModified) {
        // If any relevant field is changed, reset progress
        setIsTestSuccessful(false);
        setIsMetadataExtracted(false);
      }
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
    debounce((name: keyof FormData, value: string) => {
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
        default:
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
    debouncedValidateField(name as keyof FormData, value);
    // When data changes, reset test and metadata success
    setIsTestSuccessful(false);
    setIsMetadataExtracted(false);
  };

  const handleSelectDB = (value: string) => {
    setFormData((prev) => ({ ...prev, selectedDB: value }));
    setIsSelectOpen(false);
    // Reset progress if DB type changes
    setIsTestSuccessful(false);
    setIsMetadataExtracted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMetadataExtracted) {
      // Now depends on metadata extraction
      toast.error(
        "Please test connection and extract metadata before creating.",
        {
          theme: mode,
        }
      );
      return;
    }
    if (!isFormValid) {
      toast.error("Please fill all required fields correctly.", {
        theme: mode,
      });
      return;
    }
    if (!token) {
      toast.error("Authentication token not found. Please log in again.", {
        theme: mode,
      });
      return;
    }

    try {
      setLoading(true);
      setLoadingText("Submitting connection, please wait...");
      let response = {};
      if (isAdmin) {
        response = await createAdminConnection(token, formData);
      } else {
        response = await createUserConnection(token, formData);
      }
      setLoading(false);

      if (response.status === 200) {
        toast.success(
          `${isAdmin ? "Default" : "User"} connection created successfully.`,
          { theme: mode }
        );
        handleClearForm();
        if (onSuccess) onSuccess();
      } else {
        toast.error(`Error: ${response.data.message || "Unknown error"}`, {
          theme: mode,
        });
      }
    } catch (error) {
      setLoading(false);
      toast.error(
        `Error: ${
          axios.isAxiosError(error)
            ? error.response?.data?.message || "Request failed"
            : (error as Error).message
        }`,
        { theme: mode }
      );
    }
  };

  const handleTestConnection = async () => {
    if (!isFormValid) {
      toast.error("Please fill all required fields correctly.", {
        theme: mode,
      });
      return;
    }

    setLoading(true);
    setLoadingText("Testing connection, please wait...");
    setIsTestSuccessful(false); // Reset before attempting
    setIsMetadataExtracted(false); // Also reset metadata extraction status

    try {
      const response = await testConnection(formData); // Assuming testConnection doesn't need a token or uses a generic one
      setLoading(false);

      if (response.status === 200) {
        toast.success("Connection test successful.", { theme: mode });
        setIsTestSuccessful(true);
      } else {
        toast.error(
          `Error: ${
            response.data.message || response.data?.error || "Test failed"
          }`,
          {
            theme: mode,
          }
        );
        setIsTestSuccessful(false);
      }
    } catch (error) {
      setLoading(false);
      toast.error(
        `Connection test failed: ${
          axios.isAxiosError(error)
            ? error.response?.data?.message || "Unknown error"
            : "Network error"
        }`,
        { theme: mode }
      );
      setIsTestSuccessful(false);
    }
  };

  const handleExtractMetadata = async () => {
    if (!isTestSuccessful) {
      toast.error("Please test the connection successfully first.", {
        theme: mode,
      });
      return;
    }
    // Optionally re-validate here if needed, though isTestSuccessful implies form was valid
    // if (!isFormValid) { ... }

    setLoading(true);
    setLoadingText("Extracting metadata, please wait...");
    setIsMetadataExtracted(false); // Reset before attempting

    try {
      // Pass the token if your extractMetadataFromDB API requires it
      const response = await axios.post(`${CHATBOT_API_URL}/meta_data`, {
        connection: formData,
      }); // Pass formData and token
      setLoading(false);

      if (response.status === 200) {
        toast.success("Metadata extracted successfully.", { theme: mode });
        setIsMetadataExtracted(true);
        // You might want to store/display some of the extracted metadata if the API returns it
      } else {
        toast.error(
          `Metadata extraction failed: ${
            response.data.message || "Unknown error"
          }`,
          { theme: mode }
        );
        setIsMetadataExtracted(false);
      }
    } catch (error) {
      setLoading(false);
      toast.error(
        `Metadata extraction error: ${
          axios.isAxiosError(error)
            ? error.response?.data?.message || "Request failed"
            : (error as Error).message
        }`,
        { theme: mode }
      );
      setIsMetadataExtracted(false);
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
      selectedDB: formData.selectedDB, // Retain selected DB
    });
    setErrors({});
    setIsTestButtonEnabled(false); // Will be re-enabled by useEffect if form becomes valid
    setIsExtractMetadataButtonEnabled(false);
    setIsSubmitButtonEnabled(false);
    setIsFormModified(false);
    setIsTestSuccessful(false);
    setIsMetadataExtracted(false);
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
            autoComplete="off"
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholder}
            className="pl-10 w-full p-3 rounded-md focus:outline-none focus:ring-2 transition-all duration-200"
            style={{
              background: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${
                errors[name] ? theme.colors.error : `${theme.colors.text}20`
              }`,
              borderRadius: theme.borderRadius.default,
            }}
          />
        ) : (
          <input
            type={type}
            name={name}
            autoComplete="off"
            value={formData[name]}
            onChange={handleChange}
            required={required}
            placeholder={placeholder}
            className="pl-10 w-full p-3 rounded-md focus:outline-none focus:ring-2 transition-all duration-200"
            style={{
              background: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${
                errors[name] ? theme.colors.error : `${theme.colors.text}20`
              }`,
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
        backgroundColor: theme.colors.background,
      }}
    >
      <ToastContainer
        toastStyle={{
          backgroundColor: theme.colors.background,
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
          {isAdmin ? "Default Database Connection" : "New Database Connection"}
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
              backgroundColor: theme.colors.surface,
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
                backgroundColor: theme.colors.background,
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
                        ? `${theme.colors.accent}30`
                        : "transparent",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = theme.colors.hover)
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      formData.selectedDB === option.value
                        ? `${theme.colors.accent}30`
                        : "transparent")
                  }
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
                disabled={
                  !isFormModified && !isTestSuccessful && !isMetadataExtracted
                } // Enable if form has content or progress has been made
                className="px-6 py-2 w-full md:w-auto rounded-md font-medium shadow-md transition-all duration-200"
                style={{
                  backgroundColor:
                    isFormModified || isTestSuccessful || isMetadataExtracted
                      ? theme.colors.error
                      : `${theme.colors.text}20`,
                  color: "white",
                  borderRadius: theme.borderRadius.default,
                  boxShadow:
                    isFormModified || isTestSuccessful || isMetadataExtracted
                      ? `0 4px 6px ${theme.colors.text}20`
                      : "none",
                  opacity:
                    isFormModified || isTestSuccessful || isMetadataExtracted
                      ? 1
                      : 0.5,
                  cursor:
                    isFormModified || isTestSuccessful || isMetadataExtracted
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Clear Form
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!isTestButtonEnabled || isTestSuccessful} // Disable if already tested successfully or form invalid
                className="px-6 py-2 w-full md:w-auto rounded-md font-medium shadow-md transition-all duration-200"
                style={{
                  backgroundColor:
                    isTestButtonEnabled && !isTestSuccessful
                      ? theme.colors.accent
                      : `${theme.colors.text}20`,
                  color: "white",
                  borderRadius: theme.borderRadius.default,
                  boxShadow:
                    isTestButtonEnabled && !isTestSuccessful
                      ? `0 4px 6px ${theme.colors.text}20`
                      : "none",
                  opacity: isTestButtonEnabled && !isTestSuccessful ? 1 : 0.5,
                  cursor:
                    isTestButtonEnabled && !isTestSuccessful
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                {isTestSuccessful ? "Tested" : "Test Connection"}
              </button>
              <button
                type="button"
                onClick={handleExtractMetadata}
                disabled={
                  !isExtractMetadataButtonEnabled || isMetadataExtracted
                } // Disable if not ready or already extracted
                className="px-6 py-2 w-full md:w-auto rounded-md font-medium shadow-md transition-all duration-200 flex items-center justify-center"
                style={{
                  backgroundColor:
                    isExtractMetadataButtonEnabled && !isMetadataExtracted
                      ? theme.colors.accent
                      : `${theme.colors.text}20`,
                  color: "white",
                  borderRadius: theme.borderRadius.default,
                  boxShadow:
                    isExtractMetadataButtonEnabled && !isMetadataExtracted
                      ? `0 4px 6px ${theme.colors.text}20`
                      : "none",
                  opacity:
                    isExtractMetadataButtonEnabled && !isMetadataExtracted
                      ? 1
                      : 0.5,
                  cursor:
                    isExtractMetadataButtonEnabled && !isMetadataExtracted
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                {isMetadataExtracted
                  ? "Metadata Extracted"
                  : "Extract Metadata"}
              </button>
              <button
                type="submit"
                disabled={!isSubmitButtonEnabled}
                className="px-6 py-2 w-full md:w-auto rounded-md font-medium shadow-md transition-all duration-200"
                style={{
                  backgroundColor: isSubmitButtonEnabled
                    ? theme.colors.accent
                    : `${theme.colors.text}20`,
                  color: "white",
                  borderRadius: theme.borderRadius.default,
                  boxShadow: isSubmitButtonEnabled
                    ? `0 4px 6px ${theme.colors.text}20`
                    : "none",
                  opacity: isSubmitButtonEnabled ? 1 : 0.5,
                  cursor: isSubmitButtonEnabled ? "pointer" : "not-allowed",
                }}
              >
                Create Connection
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
