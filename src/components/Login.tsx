import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputField from "./InputField";
import PasswordField from "./PasswordField";

interface LoginProps {
  onLoginSuccess: (token: string) => void;
  onForgotPassword: () => void;
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onForgotPassword,
  onSwitchToSignup,
}) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/login",
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        const token = response.data.token;
        toast.success("Login successful.");
        onLoginSuccess(token);
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        const errorMessage = (error as Error).message;
        toast.error(`Error: ${errorMessage}`);
      }
    }
  };

  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => {
      setShowPassword(false);
    }, 750); // Hide password after 0.75 seconds
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <ToastContainer />
      <InputField
        type="email"
        name="email"
        placeholder="Email Address"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <PasswordField
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        showPassword={showPassword}
        toggleShowPassword={handleShowPassword}
      />
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
      >
        Log In
      </button>
      <div className="flex justify-between items-center">
        <button
          type="button"
          className="text-sm text-gray-300 hover:underline"
          onClick={onForgotPassword}
        >
          Forgot Password?
        </button>
        <button
          type="button"
          className="text-sm text-gray-300 hover:underline"
          onClick={onSwitchToSignup}
        >
          Don't have an account? Sign up
        </button>
      </div>
    </form>
  );
};

export default Login;
