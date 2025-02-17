import React from "react";

const InputField: React.FC<{
  type: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}> = ({ type, name, placeholder, value, onChange, required = false }) => (
  <input
    type={type}
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full p-3 border border-gray-600 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400"
    required={required}
  />
);

export default InputField;
