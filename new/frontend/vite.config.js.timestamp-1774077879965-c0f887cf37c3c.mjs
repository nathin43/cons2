// vite.config.js
import { defineConfig, createLogger } from "file:///D:/manielectrical/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/manielectrical/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var logger = createLogger();
var _warn = logger.warn.bind(logger);
logger.warn = (msg, opts) => {
  if (msg.includes("ECONNREFUSED") || msg.includes("ECONNRESET")) return;
  _warn(msg, opts);
};
var vite_config_default = defineConfig({
  customLogger: logger,
  plugins: [react()],
  server: {
    port: 3003,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 3003
    },
    // ⚠️  IMPORTANT: This frontend (port 3003) proxies API requests to the backend
    // ⚠️  The backend MUST be running on port 5000 before starting the frontend
    // Backend is configured in: backend/.env (PORT=5000)
    // Use 127.0.0.1 (not localhost) to avoid IPv6 localhost resolution issues on Windows.
    // If you change the backend port, update the 'target' values below accordingly
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err, _req, res) => {
            if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
              if (res && !res.headersSent) {
                res.writeHead(503, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, message: "Backend server is not running" }));
              }
              return;
            }
            console.error("[proxy error]", err.message);
          });
        }
      },
      "/uploads": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err, _req, res) => {
            if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
              if (res && !res.headersSent) {
                res.writeHead(503, { "Content-Type": "text/plain" });
                res.end("Backend server is not running");
              }
              return;
            }
            console.error("[proxy error]", err.message);
          });
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxtYW5pZWxlY3RyaWNhbFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcbWFuaWVsZWN0cmljYWxcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L21hbmllbGVjdHJpY2FsL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBjcmVhdGVMb2dnZXIgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcblxyXG4vLyBDdXN0b20gbG9nZ2VyIHRoYXQgc3VwcHJlc3NlcyBFQ09OTlJFRlVTRUQgcHJveHkgbm9pc2Ugd2hlbiB0aGUgYmFja2VuZCBpcyBkb3duLlxyXG4vLyBWaXRlIGxvZ3MgXCJodHRwIHByb3h5IGVycm9yXCIgYmVmb3JlIHRoZSBwZXItcHJveHkgZXJyb3IgaGFuZGxlciBydW5zLCBzbyB3ZVxyXG4vLyBoYXZlIHRvIGZpbHRlciBpdCBoZXJlIGluc3RlYWQuXHJcbmNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcigpO1xyXG5jb25zdCBfd2FybiA9IGxvZ2dlci53YXJuLmJpbmQobG9nZ2VyKTtcclxubG9nZ2VyLndhcm4gPSAobXNnLCBvcHRzKSA9PiB7XHJcbiAgaWYgKG1zZy5pbmNsdWRlcygnRUNPTk5SRUZVU0VEJykgfHwgbXNnLmluY2x1ZGVzKCdFQ09OTlJFU0VUJykpIHJldHVybjtcclxuICBfd2Fybihtc2csIG9wdHMpO1xyXG59O1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBjdXN0b21Mb2dnZXI6IGxvZ2dlcixcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiAzMDAzLFxyXG4gICAgaG1yOiB7XHJcbiAgICAgIHByb3RvY29sOiAnd3MnLFxyXG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcclxuICAgICAgcG9ydDogMzAwMyxcclxuICAgIH0sXHJcbiAgICAvLyBcdTI2QTBcdUZFMEYgIElNUE9SVEFOVDogVGhpcyBmcm9udGVuZCAocG9ydCAzMDAzKSBwcm94aWVzIEFQSSByZXF1ZXN0cyB0byB0aGUgYmFja2VuZFxyXG4gICAgLy8gXHUyNkEwXHVGRTBGICBUaGUgYmFja2VuZCBNVVNUIGJlIHJ1bm5pbmcgb24gcG9ydCA1MDAwIGJlZm9yZSBzdGFydGluZyB0aGUgZnJvbnRlbmRcclxuICAgIC8vIEJhY2tlbmQgaXMgY29uZmlndXJlZCBpbjogYmFja2VuZC8uZW52IChQT1JUPTUwMDApXHJcbiAgICAvLyBVc2UgMTI3LjAuMC4xIChub3QgbG9jYWxob3N0KSB0byBhdm9pZCBJUHY2IGxvY2FsaG9zdCByZXNvbHV0aW9uIGlzc3VlcyBvbiBXaW5kb3dzLlxyXG4gICAgLy8gSWYgeW91IGNoYW5nZSB0aGUgYmFja2VuZCBwb3J0LCB1cGRhdGUgdGhlICd0YXJnZXQnIHZhbHVlcyBiZWxvdyBhY2NvcmRpbmdseVxyXG4gICAgcHJveHk6IHtcclxuICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTo1MDAwJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICBjb25maWd1cmU6IChwcm94eSkgPT4ge1xyXG4gICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVyciwgX3JlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFNpbGVudGx5IGhhbmRsZSBiYWNrZW5kLW5vdC1ydW5uaW5nIGVycm9ycyBpbnN0ZWFkIG9mIHNwYW1taW5nIHRoZSB0ZXJtaW5hbFxyXG4gICAgICAgICAgICBpZiAoZXJyLmNvZGUgPT09ICdFQ09OTlJFRlVTRUQnIHx8IGVyci5jb2RlID09PSAnRUNPTk5SRVNFVCcpIHtcclxuICAgICAgICAgICAgICBpZiAocmVzICYmICFyZXMuaGVhZGVyc1NlbnQpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAzLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdCYWNrZW5kIHNlcnZlciBpcyBub3QgcnVubmluZycgfSkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3Byb3h5IGVycm9yXScsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgICcvdXBsb2Fkcyc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjUwMDAnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5KSA9PiB7XHJcbiAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCBfcmVxLCByZXMpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVyci5jb2RlID09PSAnRUNPTk5SRUZVU0VEJyB8fCBlcnIuY29kZSA9PT0gJ0VDT05OUkVTRVQnKSB7XHJcbiAgICAgICAgICAgICAgaWYgKHJlcyAmJiAhcmVzLmhlYWRlcnNTZW50KSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMywgeyAnQ29udGVudC1UeXBlJzogJ3RleHQvcGxhaW4nIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgnQmFja2VuZCBzZXJ2ZXIgaXMgbm90IHJ1bm5pbmcnKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1twcm94eSBlcnJvcl0nLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNRLFNBQVMsY0FBYyxvQkFBb0I7QUFDalQsT0FBTyxXQUFXO0FBS2xCLElBQU0sU0FBUyxhQUFhO0FBQzVCLElBQU0sUUFBUSxPQUFPLEtBQUssS0FBSyxNQUFNO0FBQ3JDLE9BQU8sT0FBTyxDQUFDLEtBQUssU0FBUztBQUMzQixNQUFJLElBQUksU0FBUyxjQUFjLEtBQUssSUFBSSxTQUFTLFlBQVksRUFBRztBQUNoRSxRQUFNLEtBQUssSUFBSTtBQUNqQjtBQUdBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLGNBQWM7QUFBQSxFQUNkLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxVQUFVO0FBQUEsTUFDVixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU1BLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLFdBQVcsQ0FBQyxVQUFVO0FBQ3BCLGdCQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssTUFBTSxRQUFRO0FBRXBDLGdCQUFJLElBQUksU0FBUyxrQkFBa0IsSUFBSSxTQUFTLGNBQWM7QUFDNUQsa0JBQUksT0FBTyxDQUFDLElBQUksYUFBYTtBQUMzQixvQkFBSSxVQUFVLEtBQUssRUFBRSxnQkFBZ0IsbUJBQW1CLENBQUM7QUFDekQsb0JBQUksSUFBSSxLQUFLLFVBQVUsRUFBRSxTQUFTLE9BQU8sU0FBUyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQUEsY0FDdEY7QUFDQTtBQUFBLFlBQ0Y7QUFDQSxvQkFBUSxNQUFNLGlCQUFpQixJQUFJLE9BQU87QUFBQSxVQUM1QyxDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLFdBQVcsQ0FBQyxVQUFVO0FBQ3BCLGdCQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssTUFBTSxRQUFRO0FBQ3BDLGdCQUFJLElBQUksU0FBUyxrQkFBa0IsSUFBSSxTQUFTLGNBQWM7QUFDNUQsa0JBQUksT0FBTyxDQUFDLElBQUksYUFBYTtBQUMzQixvQkFBSSxVQUFVLEtBQUssRUFBRSxnQkFBZ0IsYUFBYSxDQUFDO0FBQ25ELG9CQUFJLElBQUksK0JBQStCO0FBQUEsY0FDekM7QUFDQTtBQUFBLFlBQ0Y7QUFDQSxvQkFBUSxNQUFNLGlCQUFpQixJQUFJLE9BQU87QUFBQSxVQUM1QyxDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
