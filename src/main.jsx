import { createRoot } from "react-dom/client";
import "./services/volatileStorage";
import App from "./App.jsx";
import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";
import { GlobalApiLoading } from "./components/common/GlobalApiLoading.jsx";
import "./index.css";

// Suppress benign iframe-resize or concurrent rendering fallback warnings
if (typeof window !== "undefined") {
  const ignoreErrors = [
    "concurrent rendering",
    "ResizeObserver",
    "ResponsiveContainer",
    "was able to recover"
  ];

  window.addEventListener("error", (event) => {
    const msg = event?.message || "";
    if (ignoreErrors.some((err) => msg.includes(err))) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason?.message || String(event?.reason || "");
    if (ignoreErrors.some((err) => reason.includes(err))) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });

  // Patch console.error to intercept React's internal concurrent rendering warnings
  const originalConsoleError = console.error;
  console.error = function (...args) {
    if (typeof args[0] === "string" && ignoreErrors.some((err) => args[0].includes(err))) {
      return; // Suppress
    }
    if (args[0] instanceof Error && ignoreErrors.some((err) => args[0].message.includes(err))) {
      return; // Suppress
    }
    originalConsoleError.apply(console, args);
  };
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
      <App />
      <GlobalApiLoading />
  </ErrorBoundary>
);
