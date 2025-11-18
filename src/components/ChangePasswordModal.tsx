import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../ThemeContext";
import { API_URL } from "../config";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Icons ---
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
);
const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Store errors per field
  const [errors, setErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    global: "" // For network/API errors
  });
  
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setErrors({ oldPassword: "", newPassword: "", confirmPassword: "", global: "" });
      setShowPassword({ old: false, new: false, confirm: false });
      setIsSuccess(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isOpen]);

  // Close on Escape / Click Outside (omitted for brevity, keep previous implementation if needed)
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // UX Improvement: Clear the error for this specific field as soon as user types
    if (errors[name as keyof typeof errors] || errors.global) {
      setErrors(prev => ({ ...prev, [name]: "", global: "" }));
    }
  };

  const toggleShowPassword = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      global: ""
    };
    let isValid = true;

    if (!formData.oldPassword) {
      newErrors.oldPassword = "Current password is required";
      isValid = false;
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
      isValid = false;
    } else if (formData.oldPassword && formData.newPassword === formData.oldPassword) {
      newErrors.newPassword = "New password cannot be the same as old";
      isValid = false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/user/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        timerRef.current = setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // Handle API errors globally, or map them if your API returns specific fields
        setErrors(prev => ({ ...prev, global: data.error || "Failed to change password" }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, global: "Network connection error" }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // --- Reusable Input Renderer with Inline Error Support ---
  const renderPasswordField = (
    label: string, 
    name: keyof typeof formData, 
    showKey: keyof typeof showPassword, 
    placeholder: string
  ) => {
    const hasError = !!errors[name]; // Boolean to check if this field has an error

    return (
      <div className="mb-1">
        <label className="block text-sm mb-1 font-medium" style={{color: theme.colors.textSecondary}}>
          {label}
        </label>
        <div className="relative">
          <input
            type={showPassword[showKey] ? "text" : "password"}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={isLoading}
            className={`w-full p-2 pr-10 rounded border focus:outline-none transition-all ${
              hasError ? "focus:ring-2 focus:ring-red-200" : "focus:ring-2"
            }`}
            style={{
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              // Dynamic Border Color: Red if error, standard if not
              borderColor: hasError ? "#ef4444" : `${theme.colors.text}40`,
              // @ts-ignore 
              '--tw-ring-color': hasError ? '#ef4444' : theme.colors.accent 
            }}
          />
          <button
            type="button"
            onClick={() => toggleShowPassword(showKey)}
            className="absolute inset-y-0 right-0 px-3 flex items-center cursor-pointer hover:opacity-70"
            style={{ color: theme.colors.textSecondary }}
          >
            {showPassword[showKey] ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        
        {/* --- INLINE ERROR MESSAGE --- */}
        {hasError && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-xs animate-in slide-in-from-top-1 duration-200">
            <AlertIcon />
            <span>{errors[name]}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="p-6 rounded-lg shadow-2xl w-full max-w-md relative"
        style={{ 
          backgroundColor: theme.colors.surface, 
          color: theme.colors.text,
          border: `1px solid ${theme.colors.text}10` 
        }}
      >
        <h3 className="text-xl font-bold mb-6">Change Password</h3>
        
        {/* Global Error Alert (For generic API errors) */}
        {errors.global && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertIcon />
            {errors.global}
          </div>
        )}

        {/* Success Alert */}
        {isSuccess && (
          <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm font-medium text-center">
            Password updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderPasswordField("Current Password", "oldPassword", "old", "Enter current password")}
          {renderPasswordField("New Password", "newPassword", "new", "Enter new password")}
          {renderPasswordField("Confirm New Password", "confirmPassword", "confirm", "Re-enter new password")}

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded hover:bg-gray-100 transition-colors"
              style={{ color: theme.colors.error }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="px-4 py-2 rounded text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: theme.colors.accent }}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;