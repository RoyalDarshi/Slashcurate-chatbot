import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  Check,
  Settings,
  Activity,
} from "lucide-react";
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import "./ConnectionForm.css";
import { connectionService } from "../services/connectionService";
import { handleApiError } from "../utils/errorHandler";

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
  isPublic?: boolean;
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
  editConnectionId?: number | null; // If set, form is in edit mode
  initialData?: (Partial<FormData> & { originalPassword?: string }) | null; // Pre-populated data for editing
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
  editConnectionId = null,
  initialData = null,
}) => {
  const { theme } = useTheme();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const [originalPassword, setOriginalPassword] = useState<string>("");
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
    isPublic: false,
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
      (editConnectionId ? true : password) &&
      !Object.values(errors).some((error) => error),
    );
  }, [formData, errors, editConnectionId]);

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
        ([key, value]) => key !== "selectedDB" && !!value,
      );
      setIsFormModified(isModified);
    }, 500);
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, [formData]);

  // Populate form when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
      if (initialData.originalPassword) {
        setOriginalPassword(initialData.originalPassword);
      }
      // In edit mode, allow submit without re-testing
      setIsTestSuccessful(true);
      setIsMetadataExtracted(true);
    }
  }, [initialData]);

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
                  value,
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
    [],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    debouncedValidateField(name as keyof FormData, value);
    
    // Only reset test/metadata progress if critical connection parameters change
    const criticalFields = ["hostname", "port", "database", "username", "password"];
    if (criticalFields.includes(name)) {
      setIsTestSuccessful(false);
      setIsMetadataExtracted(false);
    }
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
      toast.error(
        "Please test connection and extract metadata before creating.",
        { theme: mode },
      );
      return;
    }
    if (!isFormValid) {
      toast.error("Please fill all required fields correctly.", {
        theme: mode,
      });
      return;
    }

    try {
      setLoading(true);
      setLoadingText(editConnectionId ? "Updating connection, please wait..." : "Submitting connection, please wait...");
      
      let response: any;
      if (editConnectionId) {
        response = await connectionService.updateConnection(editConnectionId, formData, isAdmin);
      } else if (isAdmin) {
        response = await connectionService.createAdminConnection(formData);
      } else {
        response = await connectionService.createUserConnection(formData);
      }
      setLoading(false);

      if (response.message === "Connection updated successfully" || response.message === "Connection Details Stored Successfully!") {
        toast.success(
          editConnectionId
            ? "Connection updated successfully."
            : `${isAdmin ? "Default" : "User"} connection created successfully.`,
          { theme: mode },
        );
        if (!editConnectionId) handleClearForm();
        if (onSuccess) onSuccess();
      } else {
        toast.error(`Error: ${response.message || "Unknown error"}`, {
          theme: mode,
        });
      }
    } catch (error) {
      setLoading(false);
      handleApiError(error, "Failed to save connection", mode);
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
      const response = await connectionService.testConnection(formData, isAdmin);
      setLoading(false);

      const msg = (response.message || "").toLowerCase();
      const isSuccess = 
        msg.includes("successful") || 
        msg.includes("success") || 
        response.status === "success";

      if (isSuccess) {
        toast.success("Connection test successful.", { theme: mode });
        setIsTestSuccessful(true);
      } else {
        toast.error(`Error: ${response.message || "Test failed"}`, { theme: mode });
      }
    } catch (error) {
      setLoading(false);
      handleApiError(error, "Connection test error", mode);
    }
  };

  const handleExtractMetadata = async () => {
    if (!isTestSuccessful) {
      toast.error("Please test the connection successfully first.", {
        theme: mode,
      });
      return;
    }

    setLoading(true);
    setLoadingText("Extracting metadata, please wait...");
    setIsMetadataExtracted(false);

    try {
      const isPasswordEdited = editConnectionId ? (formData.password !== "") : true;
      const isEncrypted = !isPasswordEdited;
      const payloadPassword = isPasswordEdited ? formData.password : originalPassword;

      // Using reExtractMetadata which maps to /meta_data
      const response = await connectionService.reExtractMetadata(
        {
          ...formData,
          password: payloadPassword,
        } as any,
        isEncrypted
      );
      
      toast.success("Metadata extracted successfully.", { theme: mode });
      setIsMetadataExtracted(true);
    } catch (error) {
      handleApiError(error, "Metadata extraction error", mode);
    } finally {
      setLoading(false);
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
      isPublic: false,
    });
    setOriginalPassword("");
    setErrors({});
    setIsTestButtonEnabled(false);
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
    <div key={name} className="flex flex-col gap-1.5">
      <label
        className="text-xs font-bold tracking-wide"
        style={{ color: theme.colors.textSecondary }}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div 
        className="input-icon-wrapper relative rounded-xl"
        style={{
          '--accent-color': theme.colors.accent,
        } as React.CSSProperties}
      >
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          {React.cloneElement(icon as React.ReactElement, {
            className: "h-4 w-4 transition-colors duration-200",
            style: { color: theme.colors.textSecondary, opacity: 0.6 },
          })}
        </div>
        {type === "textarea" ? (
          <textarea
            name={name}
            autoComplete="off"
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholder}
            rows={2}
            className="pl-10 pr-4 py-2.5 w-full text-sm border-none shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 input-focus-glow"
            style={{
              backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.7)',
              color: theme.colors.text,
              border: `1px solid ${errors[name] ? theme.colors.error : theme.colors.border}`,
              borderRadius: '12px',
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
            className="pl-10 pr-4 py-2.5 w-full text-sm border-none shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 input-focus-glow"
            style={{
              backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.7)',
              color: theme.colors.text,
              border: `1px solid ${errors[name] ? theme.colors.error : theme.colors.border}`,
              borderRadius: '12px',
            }}
          />
        )}
      </div>
      {errors[name] && (
        <p className="text-red-500 text-xs font-semibold mt-0.5 ml-1">{errors[name]}</p>
      )}
    </div>
  );

  const selectedOption = databaseOptions.find(
    (option) => option.value === formData.selectedDB,
  );

  // Steps description for visual stepper
  const currentStep = useMemo(() => {
    if (isMetadataExtracted) return 4;
    if (isTestSuccessful) return 3;
    if (isFormValid) return 2;
    return 1;
  }, [isFormValid, isTestSuccessful, isMetadataExtracted]);

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 overflow-y-auto">
      <ToastContainer
        toastStyle={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.default,
        }}
      />
      
      {/* Visual Stepper */}
      <div 
        className="stepper-container px-4"
        style={{
          '--stepper-line-bg': theme.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        } as React.CSSProperties}
      >
        <div className="stepper-line">
          <div 
            className="stepper-line-progress"
            style={{
              width: `${((currentStep - 1) / 3) * 100}%`
            }}
          />
        </div>
        
        {[
          { label: "Configure Details", step: 1 },
          { label: "Test Connection", step: 2 },
          { label: "Extract Metadata", step: 3 },
          { label: "Ready to Save", step: 4 },
        ].map((item) => {
          const isActive = currentStep === item.step;
          const isCompleted = currentStep > item.step;
          
          return (
            <div key={item.step} className="stepper-step">
              <div 
                className={`step-bubble ${isCompleted ? 'step-bubble-complete' : isActive ? 'step-bubble-active' : ''}`}
                style={{
                  backgroundColor: isCompleted 
                    ? theme.colors.success 
                    : isActive 
                      ? theme.colors.accent 
                      : theme.colors.surface,
                  borderColor: isCompleted 
                    ? theme.colors.success 
                    : isActive 
                      ? theme.colors.accent 
                      : theme.colors.border,
                  color: isCompleted || isActive ? '#FFF' : theme.colors.textSecondary,
                }}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : item.step}
              </div>
              <span 
                className="text-[10px] font-bold mt-2 text-center"
                style={{
                  color: isActive ? theme.colors.accent : isCompleted ? theme.colors.success : theme.colors.textSecondary,
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Grid selector for database engine */}
      <div>
        <label
          className="block text-xs font-bold uppercase tracking-wider mb-3"
          style={{ color: theme.colors.textSecondary }}
        >
          Select Database Engine
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {databaseOptions.map((option) => {
            const isSelected = formData.selectedDB === option.value;
            return (
              <div
                key={option.value}
                onClick={() => handleSelectDB(option.value)}
                className={`db-engine-card p-4 rounded-2xl flex flex-col items-center text-center justify-center border transition-all duration-300 ${
                  isSelected ? 'db-engine-card-active' : ''
                }`}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                  '--accent-color': theme.colors.accent,
                  '--card-border-color': theme.colors.border,
                } as React.CSSProperties}
              >
                <div 
                  className="p-2.5 rounded-xl mb-2 transition-colors duration-300"
                  style={{
                    backgroundColor: isSelected ? `${theme.colors.accent}15` : `${theme.colors.text}05`,
                    color: isSelected ? theme.colors.accent : theme.colors.textSecondary,
                  }}
                >
                  {React.cloneElement(option.icon as React.ReactElement, {
                    className: "h-5 w-5",
                  })}
                </div>
                <span 
                  className="font-bold text-[11px] leading-tight"
                  style={{ color: theme.colors.text }}
                >
                  {option.label}
                </span>
                <span 
                  className="text-[9px] mt-1 line-clamp-2 leading-tight"
                  style={{ color: theme.colors.textSecondary, opacity: 0.8 }}
                >
                  {option.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail form card or placeholder empty state */}
      {!formData.selectedDB ? (
        <div 
          className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed flex-grow min-h-[220px]"
          style={{
            backgroundColor: `${theme.colors.text}03`,
            borderColor: theme.colors.border,
          }}
        >
          <div className="p-4 rounded-full mb-3" style={{ backgroundColor: `${theme.colors.text}05` }}>
            <Activity className="h-6 w-6 opacity-40 animate-pulse" style={{ color: theme.colors.textSecondary }} />
          </div>
          <h3 className="font-bold text-sm mb-1" style={{ color: theme.colors.text }}>No Database Engine Selected</h3>
          <p className="text-xs max-w-xs leading-normal" style={{ color: theme.colors.textSecondary }}>
            Choose one of the database options above to input parameters, authenticate credentials, and test connectivity.
          </p>
        </div>
      ) : (
        <div 
          className="p-6 rounded-2xl border shadow-xs transition-all duration-300"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b" style={{ borderColor: theme.colors.border }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.accent}12`, color: theme.colors.accent }}>
              {React.cloneElement(selectedOption!.icon as React.ReactElement, {
                className: "h-4 w-4",
              })}
            </div>
            <h3
              className="text-sm font-bold"
              style={{ color: theme.colors.text }}
            >
              Configure {selectedOption?.label} Parameters
            </h3>
          </div>
          
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4"
          >
            {fieldConfigs.map((config) => renderInputField(config))}

            {(isAdmin || localStorage.getItem("allowedToCreatePublicConnection") !== "false") && (
              <div
                className="sm:col-span-2 mt-2 p-4 rounded-xl flex items-start gap-3 border transition-colors duration-200"
                style={{
                  backgroundColor: `${theme.colors.accent}05`,
                  borderColor: `${theme.colors.accent}15`,
                }}
              >
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic || false}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      isPublic: e.target.checked,
                    }));
                    setIsTestSuccessful(false);
                    setIsMetadataExtracted(false);
                  }}
                  className="w-4 h-4 rounded focus:ring-2 mt-0.5"
                  style={{ accentColor: theme.colors.accent }}
                />
                <label
                  htmlFor="isPublic"
                  className="font-bold text-xs cursor-pointer select-none"
                  style={{ color: theme.colors.text }}
                >
                  Make this connection public
                  <p
                    className="text-[10px] font-medium mt-0.5"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Public connections are visible and accessible to all users in the system workspace.
                  </p>
                </label>
              </div>
            )}

            <div className="sm:col-span-2 flex flex-wrap justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
              <button
                type="button"
                onClick={handleClearForm}
                disabled={
                  !isFormModified && !isTestSuccessful && !isMetadataExtracted
                }
                className="px-5 py-2 w-full md:w-auto text-xs font-bold transition-all duration-200"
                style={{
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: 'transparent',
                  color: isFormModified || isTestSuccessful || isMetadataExtracted ? theme.colors.error : theme.colors.disabledText,
                  borderRadius: '12px',
                  cursor: isFormModified || isTestSuccessful || isMetadataExtracted ? 'pointer' : 'not-allowed',
                }}
                onMouseOver={(e) => {
                  if (isFormModified || isTestSuccessful || isMetadataExtracted) {
                    e.currentTarget.style.backgroundColor = `${theme.colors.error}10`;
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Reset Form
              </button>
              
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!isTestButtonEnabled || isTestSuccessful}
                className="px-5 py-2 w-full md:w-auto text-xs font-bold border transition-all duration-200"
                style={{
                  backgroundColor: isTestButtonEnabled && !isTestSuccessful
                    ? `${theme.colors.accent}12`
                    : isTestSuccessful 
                      ? `${theme.colors.success}12`
                      : 'transparent',
                  borderColor: isTestButtonEnabled && !isTestSuccessful
                    ? theme.colors.accent
                    : isTestSuccessful
                      ? theme.colors.success
                      : theme.colors.border,
                  color: isTestButtonEnabled && !isTestSuccessful
                    ? theme.colors.accent
                    : isTestSuccessful
                      ? theme.colors.success
                      : theme.colors.disabledText,
                  borderRadius: '12px',
                  cursor: isTestButtonEnabled && !isTestSuccessful ? 'pointer' : 'not-allowed',
                }}
                onMouseOver={(e) => {
                  if (isTestButtonEnabled && !isTestSuccessful) {
                    e.currentTarget.style.backgroundColor = `${theme.colors.accent}20`;
                  }
                }}
                onMouseOut={(e) => {
                  if (isTestButtonEnabled && !isTestSuccessful) {
                    e.currentTarget.style.backgroundColor = `${theme.colors.accent}12`;
                  }
                }}
              >
                {isTestSuccessful ? "Tested ✓" : "Test Connection"}
              </button>
              
              <button
                type="button"
                onClick={handleExtractMetadata}
                disabled={
                  !isExtractMetadataButtonEnabled || isMetadataExtracted
                }
                className="px-5 py-2 w-full md:w-auto text-xs font-bold border transition-all duration-200 flex items-center justify-center"
                style={{
                  backgroundColor: isExtractMetadataButtonEnabled && !isMetadataExtracted
                    ? `${theme.colors.accent}12`
                    : isMetadataExtracted
                      ? `${theme.colors.success}12`
                      : 'transparent',
                  borderColor: isExtractMetadataButtonEnabled && !isMetadataExtracted
                    ? theme.colors.accent
                    : isMetadataExtracted
                      ? theme.colors.success
                      : theme.colors.border,
                  color: isExtractMetadataButtonEnabled && !isMetadataExtracted
                    ? theme.colors.accent
                    : isMetadataExtracted
                      ? theme.colors.success
                      : theme.colors.disabledText,
                  borderRadius: '12px',
                  cursor: isExtractMetadataButtonEnabled && !isMetadataExtracted ? 'pointer' : 'not-allowed',
                }}
                onMouseOver={(e) => {
                  if (isExtractMetadataButtonEnabled && !isMetadataExtracted) {
                    e.currentTarget.style.backgroundColor = `${theme.colors.accent}20`;
                  }
                }}
                onMouseOut={(e) => {
                  if (isExtractMetadataButtonEnabled && !isMetadataExtracted) {
                    e.currentTarget.style.backgroundColor = `${theme.colors.accent}12`;
                  }
                }}
              >
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                {isMetadataExtracted
                  ? "Metadata Extracted ✓"
                  : "Extract Metadata"}
              </button>
              
              <button
                type="submit"
                disabled={!isSubmitButtonEnabled}
                className="px-6 py-2 w-full md:w-auto text-xs font-bold transition-all duration-200 text-white"
                style={{
                  background: isSubmitButtonEnabled
                    ? theme.gradients.primary
                    : theme.colors.disabled,
                  color: isSubmitButtonEnabled ? 'white' : theme.colors.disabledText,
                  borderRadius: '12px',
                  cursor: isSubmitButtonEnabled ? 'pointer' : 'not-allowed',
                  boxShadow: isSubmitButtonEnabled ? `0 4px 12px ${theme.colors.accent}30` : 'none',
                }}
              >
                {editConnectionId ? "Save Changes" : "Create Connection"}
              </button>
            </div>
            
            {loading && (
              <div className="sm:col-span-2 mt-4">
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
