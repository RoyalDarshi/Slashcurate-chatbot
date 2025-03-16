import React from "react";
import { useTheme } from "../ThemeContext";

interface InputFieldProps {
  type: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean; // Added for consistency with other components
}

const InputField: React.FC<InputFieldProps> = ({
  type,
  name,
  placeholder,
  value,
  onChange,
  required = false,
  className = "",
  disabled = false,
}) => {
  const { theme } = useTheme();

  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
      }}
    />
  );
};

export default InputField;
