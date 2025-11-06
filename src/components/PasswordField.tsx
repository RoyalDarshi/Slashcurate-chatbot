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
  disabled?: boolean;
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
        className={`w-full px-3 py-2 text-sm border-none border-transparent shadow-md active:border-none  focus:outline-none focus:ring-2 focus:ring-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={{
          backgroundColor: theme.colors.bubbleBot,
          color: theme.colors.text,
          borderRadius: theme.borderRadius.default,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.size.sm,
          transition: theme.transition.default,
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
        title={showPassword ? "Hide password" : "Show password"} // Tooltip added
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordField;