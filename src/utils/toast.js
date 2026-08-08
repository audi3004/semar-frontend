/**
 * Toast Utility
 * Wraps the global Toast Notification system to provide fail-safe success/error messages.
 */

export const toast = {
  success: (message, duration = 4000) => {
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(message, "success", duration);
    } else {
      console.log("[Toast Success]:", message);
    }
  },
  error: (message, duration = 5000) => {
    const cleanMsg = typeof message === "string" ? message : (message?.message || "Terjadi kesalahan pada sistem.");
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(cleanMsg, "error", duration);
    } else {
      console.error("[Toast Error]:", cleanMsg);
    }
  },
  warning: (message, duration = 4500) => {
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(message, "warning", duration);
    } else {
      console.warn("[Toast Warning]:", message);
    }
  }
};
