import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTheme } from "../ThemeContext";

interface PasswordFieldProps {
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  className?: string;
  disabled?: boolean; // Added for consistency with Signup/Login
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  name,
  placeholder,
  value,
  onChange,
  showPassword,
  toggleShowPassword,
  className = "",
  disabled = false,
}) => {
  const { theme } = useTheme();

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full p-2 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={{
          backgroundColor: disabled
            ? theme.colors.disabled
            : theme.colors.background,
          color: disabled ? theme.colors.disabledText : theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.default,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.size.base,
          transition: theme.transition.default,
          focusRingColor: theme.colors.accent, // Custom property for focus ring
        }}
        required
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-2 flex items-center"
        onClick={toggleShowPassword}
        disabled={disabled}
        aria-label={showPassword ? "Hide password" : "Show password"}
        style={{
          color: disabled
            ? theme.colors.disabledText
            : theme.colors.textSecondary,
          transition: theme.transition.default,
        }}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordField;
