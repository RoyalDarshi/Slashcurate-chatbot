export const handleLogout = () => {
  sessionStorage.removeItem("userId");
  localStorage.removeItem("currentSessionId");
};
