import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputField from "./InputField";
import PasswordField from "./PasswordField";

interface SignupProps {
  onSignupSuccess: (token: string) => void;
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({
  onSignupSuccess,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast.error("All fields are required.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/signup",
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        const token = response.data.token;
        toast.success("Signup successful.");
        onSignupSuccess(token);
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

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword(true);
    setTimeout(() => {
      setShowConfirmPassword(false);
    }, 750); // Hide confirm password after 0.75 seconds
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <ToastContainer />
      <InputField
        type="text"
        name="name"
        placeholder="Full Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
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
      <PasswordField
        name="confirmPassword"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChange={handleChange}
        showPassword={showConfirmPassword}
        toggleShowPassword={handleShowConfirmPassword}
      />
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
      >
        Sign Up
      </button>
      <button
        type="button"
        className="w-full text-sm text-gray-300 hover:underline mt-4"
        onClick={onSwitchToLogin}
      >
        Already have an account? Log in
      </button>
    </form>
  );
};

export default Signup;
