export const handleLogout = () => {
  sessionStorage.removeItem("userId");
  window.location.href = "/";
};
