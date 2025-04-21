export const handleLogout = () => {
  window.location.href = "/";
  sessionStorage.removeItem("userId");
  localStorage.removeItem("currentSessionId");
};
