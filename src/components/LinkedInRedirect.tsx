import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LinkedInRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This component is just a placeholder to handle the LinkedIn redirect.
    // The LinkedInLoginButton component handles the actual login logic.
    // After successful login, redirect to the desired page.
    navigate("/"); // Replace "/" with your desired redirect path
  }, [navigate]);

  return (
    <div>
      Redirecting...
    </div>
  );
};

export default LinkedInRedirect;