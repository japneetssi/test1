// vite.config.ts
import { defineConfig } from "file:///Users/kunalkatke/Desktop/Git_Upload/WealthMax-Og/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///Users/kunalkatke/Desktop/Git_Upload/WealthMax-Og/frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///Users/kunalkatke/Desktop/Git_Upload/WealthMax-Og/frontend/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/Users/kunalkatke/Desktop/Git_Upload/WealthMax-Og/frontend";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select", "@radix-ui/react-tabs"],
          "charts-vendor": ["recharts"],
          "query-vendor": ["@tanstack/react-query"],
          // Feature chunks
          "calculators": [
            "@/components/calculators/SIPCalculatorUI",
            "@/components/calculators/RetirementCalculatorUI",
            "@/components/calculators/LifeInsuranceCalculatorUI",
            "@/components/calculators/EducationCalculatorUI",
            "@/components/calculators/CostOfDelayCalculatorUI",
            "@/components/calculators/HRACalculatorUI",
            "@/components/calculators/HomeAffordabilityCalculatorUI",
            "@/components/calculators/EMICalculatorUI",
            "@/components/calculators/CAGRCalculatorUI"
          ],
          "reports": ["@/components/reports/A4ReportView"]
        }
      }
    },
    chunkSizeWarningLimit: 1e3
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMva3VuYWxrYXRrZS9EZXNrdG9wL0dpdF9VcGxvYWQvV2VhbHRoTWF4LU9nL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMva3VuYWxrYXRrZS9EZXNrdG9wL0dpdF9VcGxvYWQvV2VhbHRoTWF4LU9nL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9rdW5hbGthdGtlL0Rlc2t0b3AvR2l0X1VwbG9hZC9XZWFsdGhNYXgtT2cvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA4MDgwLFxuICAgIGhtcjoge1xuICAgICAgb3ZlcmxheTogZmFsc2UsXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW3JlYWN0KCksIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKV0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIFZlbmRvciBjaHVua3NcbiAgICAgICAgICAncmVhY3QtdmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICd1aS12ZW5kb3InOiBbJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLCAnQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnUnLCAnQHJhZGl4LXVpL3JlYWN0LXNlbGVjdCcsICdAcmFkaXgtdWkvcmVhY3QtdGFicyddLFxuICAgICAgICAgICdjaGFydHMtdmVuZG9yJzogWydyZWNoYXJ0cyddLFxuICAgICAgICAgICdxdWVyeS12ZW5kb3InOiBbJ0B0YW5zdGFjay9yZWFjdC1xdWVyeSddLFxuXG4gICAgICAgICAgLy8gRmVhdHVyZSBjaHVua3NcbiAgICAgICAgICAnY2FsY3VsYXRvcnMnOiBbXG4gICAgICAgICAgICAnQC9jb21wb25lbnRzL2NhbGN1bGF0b3JzL1NJUENhbGN1bGF0b3JVSScsXG4gICAgICAgICAgICAnQC9jb21wb25lbnRzL2NhbGN1bGF0b3JzL1JldGlyZW1lbnRDYWxjdWxhdG9yVUknLFxuICAgICAgICAgICAgJ0AvY29tcG9uZW50cy9jYWxjdWxhdG9ycy9MaWZlSW5zdXJhbmNlQ2FsY3VsYXRvclVJJyxcbiAgICAgICAgICAgICdAL2NvbXBvbmVudHMvY2FsY3VsYXRvcnMvRWR1Y2F0aW9uQ2FsY3VsYXRvclVJJyxcbiAgICAgICAgICAgICdAL2NvbXBvbmVudHMvY2FsY3VsYXRvcnMvQ29zdE9mRGVsYXlDYWxjdWxhdG9yVUknLFxuICAgICAgICAgICAgJ0AvY29tcG9uZW50cy9jYWxjdWxhdG9ycy9IUkFDYWxjdWxhdG9yVUknLFxuICAgICAgICAgICAgJ0AvY29tcG9uZW50cy9jYWxjdWxhdG9ycy9Ib21lQWZmb3JkYWJpbGl0eUNhbGN1bGF0b3JVSScsXG4gICAgICAgICAgICAnQC9jb21wb25lbnRzL2NhbGN1bGF0b3JzL0VNSUNhbGN1bGF0b3JVSScsXG4gICAgICAgICAgICAnQC9jb21wb25lbnRzL2NhbGN1bGF0b3JzL0NBR1JDYWxjdWxhdG9yVUknXG4gICAgICAgICAgXSxcbiAgICAgICAgICAncmVwb3J0cyc6IFsnQC9jb21wb25lbnRzL3JlcG9ydHMvQTRSZXBvcnRWaWV3J10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICB9LFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnVyxTQUFTLG9CQUFvQjtBQUM3WCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsaUJBQWlCLGdCQUFnQixDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDOUUsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBO0FBQUEsVUFFWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDekQsYUFBYSxDQUFDLDBCQUEwQixpQ0FBaUMsMEJBQTBCLHNCQUFzQjtBQUFBLFVBQ3pILGlCQUFpQixDQUFDLFVBQVU7QUFBQSxVQUM1QixnQkFBZ0IsQ0FBQyx1QkFBdUI7QUFBQTtBQUFBLFVBR3hDLGVBQWU7QUFBQSxZQUNiO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxXQUFXLENBQUMsbUNBQW1DO0FBQUEsUUFDakQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsdUJBQXVCO0FBQUEsRUFDekI7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
