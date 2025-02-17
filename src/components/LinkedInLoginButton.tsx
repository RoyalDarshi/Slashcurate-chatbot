import React from "react";
import { FaLinkedin } from "react-icons/fa";
import { LinkedIn } from "react-linkedin-login-oauth2";
import axios from "axios";
import { toast } from "react-toastify";

const LinkedInLoginButton: React.FC = () => {
  const handleSuccess = async (code: string) => {
    console.log("LinkedIn Authorization Code:", code);

    try {
      const res = await axios.post("http://localhost:5000/linkedin-login", {
        code,
      });

      sessionStorage.setItem("token", res.data.token);
      toast.success("LinkedIn Login Successful!");
    } catch {
      toast.error("LinkedIn Login Failed!");
    }
  };

  const handleFailure = ({ error, errorMessage }: { error: string; errorMessage: string }) => {
    console.error("LinkedIn Login Error:", error, errorMessage);
    toast.error("LinkedIn login failed!");
  };

  return (
    <div>
      <LinkedIn
        clientId="YOUR_LINKEDIN_CLIENT_ID"
        redirectUri={`${window.location.origin}/linkedin`}
        onSuccess={(code) => handleSuccess(code)}
        onError={handleFailure}
        scope="r_liteprofile r_emailaddress"
      >
        {({ linkedInLogin }) => (
          <button
            onClick={linkedInLogin}
            className="p-3 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition"
            title="Login with LinkedIn"
            aria-label="Login with LinkedIn"
          >
            <FaLinkedin size={20} />
          </button>
        )}
      </LinkedIn>
    </div>
  );
};

export default LinkedInLoginButton;
