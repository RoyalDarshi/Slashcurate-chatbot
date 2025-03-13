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
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  name,
  placeholder,
  value,
  onChange,
  showPassword,
  toggleShowPassword,
  className = "",
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
        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all pr-10 ${className}`} // Added pr-10 for icon space
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          borderColor: `${theme.colors.text}50`,
          borderRadius: theme.borderRadius.default,
        }}
        required
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-2 flex items-center"
        onClick={toggleShowPassword}
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-expanded={showPassword}
      >
        {showPassword ? (
          <EyeOff size={18} style={{ color: theme.colors.text }} />
        ) : (
          <Eye size={18} style={{ color: theme.colors.text }} />
        )}
      </button>
    </div>
  );
};

export default PasswordField;
