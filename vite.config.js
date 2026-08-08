import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const frontendPort = Number(env.VITE_PORT) || 3002;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, ".")
      }
    },
    build: {
      outDir: "dist",
      chunkSizeWarningLimit: 1e3,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("xlsx")) return "vendor-xlsx";
              if (id.includes("jspdf")) return "vendor-jspdf";
              if (id.includes("recharts") || id.includes("d3")) return "vendor-charts";
              if (id.includes("motion") || id.includes("framer-motion")) return "vendor-motion";
              if (id.includes("lucide-react")) return "vendor-lucide";
              return "vendor-core";
            }
          }
        }
      }
    },
    server: {
      host: "0.0.0.0",
      port: frontendPort,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: env.DISABLE_HMR === "true" ? null : {}
    },
    preview: {
      host: "0.0.0.0",
      port: frontendPort,
      strictPort: true
    }
  };
});
