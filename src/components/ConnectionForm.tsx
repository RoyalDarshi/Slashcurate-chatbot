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
    icon: <Server className="h-5 w-5 text-blue-600" />,
    description: "Enterprise-class relational database management system",
  },
  {
    value: "postgresql",
    label: "PostgreSQL",
    icon: <Database className="h-5 w-5 text-indigo-600" />,
    description: "Powerful, open source object-relational database system",
  },
  {
    value: "mysql",
    label: "MySQL",
    icon: <Database className="h-5 w-5 text-orange-500" />,
    description: "Open-source relational database management system",
  },
  {
    value: "oracle",
    label: "Oracle",
    icon: <Database className="h-5 w-5 text-red-600" />,
    description: "Multi-model database management system",
  },
  {
    value: "sqlserver",
    label: "SQL Server",
    icon: <Server className="h-5 w-5 text-blue-800" />,
    description: "Microsoft's relational database management system",
  },
];

const fieldConfigs: FieldConfig[] = [
  {
    label: "Connection Name",
    name: "connectionName",
    type: "text",
    required: true,
    icon: <FileText className="h-5 w-5 text-gray-500" />,
    placeholder: "Enter a unique name for this connection",
  },
  {
    label: "Description",
    name: "description",
    type: "textarea",
    icon: <FileText className="h-5 w-5 text-gray-500" />,
    placeholder: "Add optional details about this connection",
  },
  {
    label: "Hostname or IP address",
    name: "hostname",
    type: "text",
    required: true,
    icon: <Globe className="h-5 w-5 text-gray-500" />,
    placeholder: "e.g., db.example.com or 192.168.1.1",
  },
  {
    label: "Port",
    name: "port",
    type: "text",
    required: true,
    icon: <Lock className="h-5 w-5 text-gray-500" />,
    placeholder: "e.g., 5432",
  },
  {
    label: "Database",
    name: "database",
    type: "text",
    required: true,
    icon: <Database className="h-5 w-5 text-gray-500" />,
    placeholder: "Enter database name",
  },
  {
    label: "Command Timeout",
    name: "commandTimeout",
    type: "text",
    icon: <Clock className="h-5 w-5 text-gray-500" />,
    placeholder: "Timeout in seconds (optional, e.g., 30)",
  },
  {
    label: "Max Transport Objects",
    name: "maxTransportObjects",
    type: "text",
    icon: <Layers className="h-5 w-5 text-gray-500" />,
    placeholder: "Maximum number of objects (optional, e.g., 1000)",
  },
  {
    label: "Username",
    name: "username",
    type: "text",
    required: true,
    icon: <User className="h-5 w-5 text-gray-500" />,
    placeholder: "Enter database username",
  },
  {
    label: "Password",
    name: "password",
    type: "password",
    required: true,
    icon: <Key className="h-5 w-5 text-gray-500" />,
    placeholder: "Enter database password",
  },
];

const ConnectionForm: React.FC = () => {
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
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    timeoutIdRef.current = setTimeout(() => {
      const isModified = Object.entries(formData).some(
        ([key, value]) => key !== "selectedDB" && !!value
      );
      setIsSubmitButtonEnabled(false);
      setIsFormModified(isModified);
    }, 500);

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [formData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".custom-select-container")) {
        setIsSelectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const debouncedValidateField = useCallback(
    debounce((name: string, value: string) => {
      let error = "";
      switch (name) {
        case "connectionName":
          error = validateConnectionName(value);
          break;
        case "hostname":
          error = validateHostname(value);
          break;
        case "port":
          error = validatePort(value);
          break;
        case "database":
          error = validateDatabase(value);
          break;
        case "username":
          error = validateUsername(value);
          break;
        case "password":
          error = validatePassword(value);
          break;
        default:
          break;
      }
      setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
    }, 300),
    []
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    debouncedValidateField(name, value);
  };

  const handleSelectDB = (value: string) => {
    setFormData((prevData) => ({ ...prevData, selectedDB: value }));
    setIsSelectOpen(false);
  };

  const validateConnectionName = (value: string) => {
    if (!value) return "Connection Name is required.";
    return "";
  };

  const validateHostname = (value: string) => {
    if (!value) return "Hostname is required.";
    if (
      !/^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}$/.test(
        value
      ) &&
      !/^(\d{1,3}\.){3}\d{1,3}$/.test(value)
    ) {
      return "Invalid hostname or IP address.";
    }
    return "";
  };

  const validatePort = (value: string) => {
    if (!value) return "Port is required.";
    if (
      !/^\d+$/.test(value) ||
      parseInt(value, 10) < 1024 ||
      parseInt(value, 10) > 65535
    ) {
      return "Port must be a number between 1024 and 65535.";
    }
    return "";
  };

  const validateDatabase = (value: string) => {
    if (!value) return "Database is required.";
    if (!/^\w+$/.test(value)) {
      return "Database name can only contain letters, numbers, and underscores.";
    }
    return "";
  };

  const validateUsername = (value: string) => {
    if (!value) return "Username is required.";
    if (/\s/.test(value)) {
      return "Username cannot contain spaces.";
    }
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required.";
    return "";
  };

  const validateForm = () => {
    const newErrors: Errors = {};
    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof FormData];
      let error = "";
      switch (key) {
        case "connectionName":
          error = validateConnectionName(value);
          break;
        case "hostname":
          error = validateHostname(value);
          break;
        case "port":
          error = validatePort(value);
          break;
        case "database":
          error = validateDatabase(value);
          break;
        case "username":
          error = validateUsername(value);
          break;
        case "password":
          error = validatePassword(value);
          break;
        default:
          break;
      }
      if (error) {
        newErrors[key] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    const payload = {
      userId,
      connectionDetails: formData,
    };

    try {
      setLoading(true);
      setLoadingText("Submitting form, please wait...");
      const response = await axios.post(`${API_URL}/createdbcon`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setLoading(false);
      if (response.status === 200) {
        toast.success("Form submitted successfully.");
        handleClearForm();
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (error) {
      setLoading(false);
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : (error as Error).message;
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setLoadingText("Testing connection, please wait...");
    try {
      const response = await axios.post(
        `${DBCON_API_URL}/testdbcon`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
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
      toast.error(`Error: Please check the connection details.`);
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

  const renderInputField = (
    label: string,
    name: string,
    type: string,
    required: boolean,
    icon: React.ReactNode,
    placeholder: string = ""
  ) => (
    <div key={name} className="mb-6">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        {type === "textarea" ? (
          <textarea
            id={name}
            name={name}
            value={formData[name as keyof FormData]}
            onChange={handleChange}
            placeholder={placeholder}
            className={`pl-10 block w-full px-4 py-3 border ${
              errors[name]
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            } pl-10
    block
    w-full
    px-4
    py-3
    border
    dark:text-gray-200
    border-gray-300
    dark:border-gray-600
    bg-white
    dark:bg-gray-700
    rounded-lg
    shadow-sm
    focus:outline-none
    focus:ring-2
    focus:ring-indigo-500
    focus:border-indigo-500
    sm:text-sm
    transition-all
    duration-200`}
          />
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={formData[name as keyof FormData]}
            onChange={handleChange}
            required={required}
            placeholder={placeholder}
            className={`pl-10 block w-full px-4 py-3 border ${
              errors[name]
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }  pl-10
    block
    w-full
    px-4
    py-3
    border
    border-gray-300
    dark:border-gray-600
    dark:text-gray-200
    bg-white
    dark:bg-gray-700
    rounded-lg
    shadow-sm
    focus:outline-none
    focus:ring-2
    focus:ring-indigo-500
    focus:border-indigo-500
    sm:text-sm
    transition-all
    duration-200`}
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
    <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl h-full overflow-y-auto">
      <ToastContainer />
      <div className="flex items-center mb-8">
        <Database className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-3" />
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          Database Connection
        </h2>
      </div>

      <div className="mb-10 custom-select-container">
        <label
          htmlFor="dropdown"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Select a Database Engine
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl py-4 px-5 flex items-center justify-between shadow-sm hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
          >
            {selectedOption ? (
              <div className="flex items-center">
                {selectedOption.icon}
                <span className="ml-3 font-medium text-gray-800 dark:text-gray-200">
                  {selectedOption.label}
                </span>
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                Select a database engine
              </span>
            )}
            <ChevronDown
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                isSelectOpen ? "transform rotate-180" : ""
              }`}
            />
          </button>

          {isSelectOpen && (
            <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-700 shadow-xl rounded-xl py-2 border border-gray-200 dark:border-gray-600 max-h-72 overflow-auto">
              {databaseOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelectDB(option.value)}
                  className={`px-5 py-4 flex flex-col cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors duration-150 ${
                    formData.selectedDB === option.value
                      ? "bg-indigo-50 dark:bg-gray-600"
                      : ""
                  }`}
                >
                  <div className="flex items-center">
                    {option.icon}
                    <span className="ml-3 font-medium text-gray-800 dark:text-gray-200">
                      {option.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {formData.selectedDB && (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-8">
            {selectedOption?.icon}
            <h3 className="ml-3 text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {selectedOption?.label} Connection Details
            </h3>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2"
          >
            {fieldConfigs.map(
              ({ label, name, type, required, icon, placeholder }) =>
                renderInputField(
                  label,
                  name,
                  type,
                  required ?? false,
                  icon,
                  placeholder
                )
            )}
            <div className="md:col-span-2 flex flex-wrap justify-end gap-4 mt-10">
              <button
                type="button"
                onClick={handleClearForm}
                disabled={!isFormModified}
                className={`px-6 py-3 w-full md:w-auto ${
                  isFormModified
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-300 cursor-not-allowed"
                } text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 font-medium`}
              >
                Clear Form
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!isTestButtonEnabled}
                className={`px-6 py-3 w-full md:w-auto ${
                  isTestButtonEnabled
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-300 cursor-not-allowed"
                } text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium`}
              >
                Test Connection
              </button>
              <button
                type="submit"
                disabled={!isSubmitButtonEnabled}
                className={`px-6 py-3 w-full md:w-auto ${
                  isSubmitButtonEnabled
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gray-300 cursor-not-allowed"
                } text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 font-medium`}
              >
                Submit
              </button>
            </div>
            {loading && (
              <div className="md:col-span-2 mt-4">
                <Loader text={loadingText} />
              </div>
            )}
            <div className="mb-12"></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ConnectionForm;