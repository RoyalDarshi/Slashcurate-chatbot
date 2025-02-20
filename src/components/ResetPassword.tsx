import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams, useNavigate } from "react-router-dom";
import PasswordField from "./PasswordField";
import Loader from "./Loader";
import { API_URL } from "../config";

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading, please wait...");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Show password for a limited time (0.75 seconds)
  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 750);
  };

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword(true);
    setTimeout(() => setShowConfirmPassword(false), 750);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      toast.error("Both fields are required.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setLoadingText("Resetting password, please wait...");
      const response = await axios.post(
        `${API_URL}/reset-password`,
        { password: formData.password, token: token },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setLoading(false);
      if (response.status === 200) {
        toast.success("Password reset successful.");
        setTimeout(() => navigate("/"), 3000);
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        toast.error(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        toast.error(`Error: ${(error as Error).message}`);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-6 bg-gray-800 shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-white mb-4">
          Reset Password
        </h2>
        <ToastContainer />
        <form onSubmit={handleResetPassword} className="space-y-4">
          <PasswordField
            name="password"
            placeholder="New Password"
            value={formData.password}
            onChange={handleChange}
            showPassword={showPassword}
            toggleShowPassword={handleShowPassword} // Auto-hides after 1.5s
          />
          <PasswordField
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            showPassword={showConfirmPassword}
            toggleShowPassword={handleShowConfirmPassword} // Auto-hides after 1.5s
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Reset Password
          </button>
          <button
            type="button"
            className="w-full text-sm text-gray-400 hover:text-gray-300 hover:underline mt-4"
            onClick={() => navigate("/")}
          >
            Back to Login
          </button>
          {loading && <Loader text={loadingText} />}
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
