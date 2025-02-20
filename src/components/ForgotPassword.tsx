import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputField from "./InputField";
import Loader from "./Loader";
import { API_URL } from "../config";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading, please wait...");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email is required.");
      return;
    }

    try {
      setLoading(true);
      setLoadingText("Sending reset link, please wait...");
      const response = await axios.post(
        `${API_URL}/forgot-password`,
        { email },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setLoading(false);

      if (response.status === 200) {
        toast.success("Password reset email sent.");
        setTimeout(() => {
          onBackToLogin();
        }, 3000);
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        toast.error(`Error: ${error.response?.data?.message || error.message}`);
      } else {
        const errorMessage = (error as Error).message;
        toast.error(`Error: ${errorMessage}`);
      }
    }
  };

  return (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <ToastContainer />
      <InputField
        type="email"
        name="email"
        placeholder="Email Address"
        value={email}
        onChange={handleChange}
        required
      />
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
      >
        Send Reset Link
      </button>
      <button
        type="button"
        className="w-full text-sm text-gray-300 hover:underline mt-4"
        onClick={onBackToLogin}
      >
        Back to Login
      </button>
      {loading && <Loader text={loadingText} />}
    </form>
  );
};

export default ForgotPassword;
