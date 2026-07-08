import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

// __dirname ko ES Modules (Vite) ke mutabik safe tarike se recreate karne ke liye
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Backend URL - default localhost:8000
  const BACKEND_URL = env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // ✅ MAGIC FIX: Ye process.env.REACT_APP_BACKEND_URL ko automatically 
    // replace kar dega bina files change kiye!
    define: {
      'process.env.REACT_APP_BACKEND_URL': JSON.stringify(BACKEND_URL),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env': {}
    },
    server: {
      host: true,
      port: 3000,
      // ✅ FIXED: Proxy ab 8000 par point karta hai (aapka backend port)
      proxy: {
        "/api": {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "build",
    },
  };
});