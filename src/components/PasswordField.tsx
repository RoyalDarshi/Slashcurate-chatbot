import React from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordField: React.FC<{
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
}> = ({
  name,
  placeholder,
  value,
  onChange,
  showPassword,
  toggleShowPassword,
}) => (
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full p-3 border border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400"
      required
    />
    <button
      type="button"
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
      onClick={toggleShowPassword}
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>
);

export default PasswordField;
