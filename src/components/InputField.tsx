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
  disabled?: boolean;
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
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`w-full px-3 py-2 text-sm border-none border-transparent active:border-none shadow-md  focus:outline-none focus:ring-2 focus:ring-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        backgroundColor: theme.colors.bubbleBot,
        color: theme.colors.text,
        borderRadius: theme.borderRadius.default,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.size.sm,
        transition: theme.transition.default,
      }}
    />
  );
};

export default InputField;
