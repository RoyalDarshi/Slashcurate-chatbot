export const handleLogout = () => {
  sessionStorage.removeItem("userId");
  localStorage.removeItem("currentSessionId");
};

export const copyToClipboard = (text: string): Promise<boolean> => {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => {
      return fallbackCopyToClipboard(text);
    });
  }
  return Promise.resolve(fallbackCopyToClipboard(text));
};

const fallbackCopyToClipboard = (text: string): boolean => {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback copy failed", err);
    return false;
  }
};
