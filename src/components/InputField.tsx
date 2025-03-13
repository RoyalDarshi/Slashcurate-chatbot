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
}

const InputField: React.FC<InputFieldProps> = ({
  type,
  name,
  placeholder,
  value,
  onChange,
  required = false,
  className = "",
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
      className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${className}`}
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        borderColor: `${theme.colors.text}50`, // 50% opacity for border
        borderRadius: theme.borderRadius.default,
        focusRingColor: theme.colors.accent, // This won't work directly; handled by Tailwind class
      }}
    />
  );
};

export default InputField;
