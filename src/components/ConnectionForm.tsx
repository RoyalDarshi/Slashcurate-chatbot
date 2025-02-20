import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import debounce from "lodash.debounce";
import Loader from "./loader";

const ConnectionForm: React.FC = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    connectionName: "",
    description: "",
    hostname: "",
    port: "",
    database: "",
    commandTimeout: "",
    maxTransportObjects: "",
    username: "",
    password: "",
    applicationName: "",
    clientAccountingInformation: "",
    clientHostname: "",
    clientUser: "",
    selectedDB: "",
  });

  // State to manage form errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // State to manage button enable/disable status
  const [isTestButtonEnabled, setIsTestButtonEnabled] = useState(false);
  const [isSubmitButtonEnabled, setIsSubmitButtonEnabled] = useState(false);
  const [isPdfButtonEnabled, setIsPdfButtonEnabled] = useState(false);
  const [isFormModified, setIsFormModified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading, please wait...");

  // Memoize form validity check
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

  // Effect to enable/disable the test button based on form validity
  useEffect(() => {
    setIsTestButtonEnabled(isFormValid);
  }, [isFormValid]);

  // Effect to enable/disable the clear form button based on form modification
  useEffect(() => {
    const isModified = Object.keys(formData).some(
      (key) => key !== "selectedDB" && formData[key as keyof typeof formData]
    );
    setIsFormModified(isModified);
  }, [formData]);

  // Debounced validation function
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

  // Handle input changes and validate fields
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    debouncedValidateField(name, value);
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

  // Validate the entire form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof typeof formData];
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

  // Handle form submission
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
      const response = await axios.post(
        "http://localhost:5000/createdbcon",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setLoading(false);
      if (response.status === 200) {
        toast.success("Form submitted successfully.");
        handleClearForm();
        setIsPdfButtonEnabled(true);
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (error) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : (error as Error).message;
      toast.error(`Error: ${errorMessage}`);
    }
  };

  // Handle test connection
  const handleTestConnection = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setLoadingText("Testing connection, please wait...");
    setLoading(false);
    try {
      const response = await axios.post(
        "http://localhost:5000/testdbcon",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast.success("Connection established successfully.");
        setIsSubmitButtonEnabled(true);
      } else {
        toast.error(`Error: ${response.data.message}`);
        setIsSubmitButtonEnabled(false);
      }
    } catch {
      toast.error(`Error: Please check the connection details.`);
      setIsSubmitButtonEnabled(false);
    }
  };

  // Handle form reset
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
      applicationName: "",
      clientAccountingInformation: "",
      clientHostname: "",
      clientUser: "",
      selectedDB: formData.selectedDB,
    });
    setErrors({});
    setIsSubmitButtonEnabled(false);
    setIsTestButtonEnabled(false);
    setIsFormModified(false);
  };

  // Render input fields
  const renderInputField = (
    label: string,
    name: string,
    type: string,
    required: boolean
  ) => (
    <div key={name} className="mb-6">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}: {required && <span className="text-red-500">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={formData[name as keyof typeof formData]}
          onChange={handleChange}
          className={`mt-2 block w-full px-4 py-2 border ${
            errors[name]
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-600"
          } bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={formData[name as keyof typeof formData]}
          onChange={handleChange}
          required={required}
          className={`mt-2 block w-full px-4 py-2 border ${
            errors[name]
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-600"
          } bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
        />
      )}
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full overflow-y-auto">
      <ToastContainer />
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Connection Form
      </h2>
      <div className="mb-6">
        <label
          htmlFor="dropdown"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Select a Database:
        </label>
        <select
          id="dropdown"
          name="selectedDB"
          value={formData.selectedDB}
          onChange={handleChange}
          className="mt-2 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white text-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="" disabled>
            Select a Database
          </option>
          <option value="db2">DB2</option>
          <option value="postgresql">PostgreSQL</option>
        </select>
      </div>
      {formData.selectedDB && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {[
            {
              label: "Connection Name",
              name: "connectionName",
              type: "text",
              required: true,
            },
            { label: "Description", name: "description", type: "textarea" },
            {
              label: "Hostname or IP address",
              name: "hostname",
              type: "text",
              required: true,
            },
            { label: "Port", name: "port", type: "text", required: true },
            {
              label: "Database",
              name: "database",
              type: "text",
              required: true,
            },
            { label: "Command Timeout", name: "commandTimeout", type: "text" },
            {
              label: "Max Transport Objects",
              name: "maxTransportObjects",
              type: "text",
            },
            {
              label: "Username",
              name: "username",
              type: "text",
              required: true,
            },
            {
              label: "Password",
              name: "password",
              type: "password",
              required: true,
            },
            {
              label: "Application Name",
              name: "applicationName",
              type: "text",
            },
            {
              label: "Client Accounting Information",
              name: "clientAccountingInformation",
              type: "text",
            },
            { label: "Client Hostname", name: "clientHostname", type: "text" },
            { label: "Client User", name: "clientUser", type: "text" },
          ].map(({ label, name, type, required }) =>
            renderInputField(label, name, type, required ?? false)
          )}
          <div className="md:col-span-2 flex flex-wrap justify-center md:justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={handleClearForm}
              disabled={!isFormModified}
              className={`px-4 py-2 w-full md:w-auto ${
                isFormModified
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-300 cursor-not-allowed"
              } text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
            >
              Clear Form
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={!isTestButtonEnabled}
              className={`px-4 py-2 w-full md:w-auto ${
                isTestButtonEnabled
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-300 cursor-not-allowed"
              } text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              Test Connection
            </button>
            <button
              type="submit"
              disabled={!isSubmitButtonEnabled}
              className={`px-4 py-2 w-full md:w-auto ${
                isSubmitButtonEnabled
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-300 cursor-not-allowed"
              } text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
            >
              Submit
            </button>
            {loading && <Loader text={loadingText} />}
          </div>
          <div className="mb-12"></div> {/* Added space below the buttons */}
        </form>
      )}
    </div>
  );
};

export default ConnectionForm;
