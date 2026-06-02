// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      // https: {
      //   key: fs.readFileSync("key.pem"),
      //   cert: fs.readFileSync("cert.pem"),
      // },
      host: "0.0.0.0",
      port: 5173, // Or your desired port
    },
    plugins: [react(), visualizer()],
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(env.VITE_API_URL),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("echarts")) {
                return "charts-echarts";
              }
              if (id.includes("plotly.js") || id.includes("react-plotly.js")) {
                return "charts-plotly";
              }
              if (id.includes("framer-motion")) {
                return "motion";
              }
              if (id.includes("lucide-react") || id.includes("react-icons") || id.includes("react-feather")) {
                return "icons";
              }
              return "vendor";
            }
          },
        },
      },
      sourcemap: env.VITE_ENABLE_SOURCEMAP === "true",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
