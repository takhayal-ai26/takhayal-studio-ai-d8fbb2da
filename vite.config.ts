import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  build: {
    chunkSizeWarningLimit: 450,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            if (id.includes("/src/pages/admin/") || id.includes("/src/components/admin/")) {
              return "admin-app";
            }
            return undefined;
          }

          if (id.includes("recharts")) return "vendor-charts";
          if (id.includes("@tiptap")) return "vendor-editor";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("zustand")) return "vendor-state";
          if (id.includes("vaul")) return "vendor-drawer";
          if (id.includes("next-themes")) return "vendor-theme";
          if (id.includes("react-hook-form")) return "vendor-forms";
          if (id.includes("@hookform/resolvers")) return "vendor-forms";
          if (id.includes("react-day-picker")) return "vendor-date-picker";
          if (id.includes("react-resizable-panels")) return "vendor-layout";
          if (id.includes("cmdk")) return "vendor-command";
          if (id.includes("input-otp")) return "vendor-inputs";
          if (id.includes("@lovable.dev/cloud-auth-js")) return "vendor-auth";
          if (id.includes("date-fns")) return "vendor-date";
          if (id.includes("embla-carousel")) return "vendor-carousel";
          if (id.includes("zod")) return "vendor-validation";
          if (id.includes("sonner")) return "vendor-feedback";
          if (id.includes("react-helmet-async")) return "vendor-seo";
          if (id.includes("react-router") || id.includes("@remix-run/router")) return "vendor-router";
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          return "vendor-misc";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    minify: 'esbuild',
  },
}));
