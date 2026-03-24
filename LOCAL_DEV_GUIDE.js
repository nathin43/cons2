#!/usr/bin/env node

/**
 * LOCAL DEVELOPMENT CONFIGURATION GUIDE
 * 
 * This file documents how to properly run the full-stack app locally
 * with proper environment variable separation.
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

console.clear();
console.log(COLORS.cyan + COLORS.bright);
console.log('\n╔════════════════════════════════════════════╗');
console.log('║    LOCAL DEVELOPMENT SETUP GUIDE           ║');
console.log('╚════════════════════════════════════════════╝\n');
console.log(COLORS.reset);

console.log(COLORS.bright + '📋 ENVIRONMENT VARIABLE STRATEGY\n' + COLORS.reset);

console.log('Your app uses different configurations based on environment:\n');

console.log(COLORS.cyan + '📁 FRONTEND:' + COLORS.reset);
console.log('  ├─ .env.local .............. LOCAL DEV (localhost:3003 → localhost:50004)');
console.log('  └─ .env.production ......... VERCEL PRODUCTION (vercel.app → onrender.com)\n');

console.log(COLORS.cyan + '📁 BACKEND:' + COLORS.reset);
console.log('  ├─ .env .................... CURRENT CONFIG (change as needed)');
console.log('  ├─ .env.example ............ TEMPLATE (for reference)');
console.log('  └─ Render Platform ......... PRODUCTION (env vars via dashboard)\n');

console.log(COLORS.bright + '🚀 HOW THE FLOW WORKS:\n' + COLORS.reset);

console.log(COLORS.yellow + '1. LOCAL DEVELOPMENT (Your Machine)\n' + COLORS.reset);
console.log('   Frontend (.env.local):');
console.log('      VITE_API_URL=http://localhost:50004');
console.log('      VITE_SOCKET_URL=http://localhost:50004\n');

console.log('   Frontend Proxy (vite.config.js):');
console.log('      localhost:3003 → /api → http://127.0.0.1:50004/api\n');

console.log('   Backend (.env):');
console.log('      PORT=50004');
console.log('      NODE_ENV=development');
console.log('      MONGO_URI=<your mongodb uri>\n');

console.log('   What happens:');
console.log('   ┌─────────────────────────────────────────────────┐');
console.log('   │ User @localhost:3003                            │');
console.log('   │         ↓ API Call: GET /api/products           │');
console.log('   │ Vite Proxy (port 3003)                          │');
console.log('   │         ↓ Forwards to Backend                   │');
console.log('   │ Backend @127.0.0.1:50004 ✅ CORS OK             │');
console.log('   │         ↓ Responds                              │');
console.log('   │ Frontend receives data ✅                        │');
console.log('   └─────────────────────────────────────────────────┘\n');

console.log(COLORS.yellow + '2. PRODUCTION DEPLOYMENT (Vercel + Render)\n' + COLORS.reset);
console.log('   Frontend (.env.production):');
console.log('      VITE_API_URL=https://manielectrical-backend.onrender.com');
console.log('      VITE_SOCKET_URL=https://manielectrical-backend.onrender.com\n');

console.log('   Vercel (environment variables set in Vercel dashboard):');
console.log('      VITE_API_URL → injected during build\n');

console.log('   Backend (.env on Render):');
console.log('      PORT → (auto-assigned by Render)');
console.log('      NODE_ENV=production');
console.log('      MONGO_URI=<your mongodb uri>\n');

console.log('   What happens:');
console.log('   ┌─────────────────────────────────────────────────┐');
console.log('   │ User @manielectrical.vercel.app                │');
console.log('   │         ↓ API Call: GET /api/products           │');
console.log('   │ Vercel (bundles with VITE_API_URL)             │');
console.log('   │         ↓ Direct HTTPS call                      │');
console.log('   │ Render Backend ✅ CORS enabled for Vercel       │');
console.log('   │         ↓ Responds                              │');
console.log('   │ Frontend receives data ✅                        │');
console.log('   └─────────────────────────────────────────────────┘\n');

console.log(COLORS.bright + '⚡ RUNNING LOCALLY:\n' + COLORS.reset);

console.log('Terminal 1 - Start Backend:');
console.log(COLORS.dim + '$ cd backend');
console.log('$ npm install');
console.log('$ npm start' + COLORS.reset);
console.log('  >> Backend listens on http://localhost:50004\n');

console.log('Terminal 2 - Start Frontend:');
console.log(COLORS.dim + '$ cd frontend');
console.log('$ npm install');
console.log('$ npm run dev' + COLORS.reset);
console.log('  >> Frontend runs at http://localhost:3003\n');

console.log(COLORS.green + '✅ Everything is now working!' + COLORS.reset);
console.log('   • Frontend proxies to backend automatically');
console.log('   • CORS is handled via Vite proxy (no issues)\n');

console.log(COLORS.bright + '🔍 API RESOLUTION LOGIC:\n' + COLORS.reset);

console.log('When you call: API.post("/orders/create", data)\n');

console.log('In Development (import.meta.env.DEV === true):');
console.log(COLORS.dim + '  1. Vite detects: POST /api/orders/create');
console.log('  2. Proxy intercepts and rewrites to: http://127.0.0.1:50004/api/orders/create');
console.log('  3. Backend responds directly (no CORS issues)' + COLORS.reset);
console.log('  → baseURL = "/api"\n');

console.log('In Production (import.meta.env.DEV === false):');
console.log(COLORS.dim + '  1. Uses build-time VITE_API_URL variable');
console.log('  2. Direct HTTPS call: https://manielectrical-backend.onrender.com/api/orders/create');
console.log('  3. Backend CORS checks Referer/Origin headers' + COLORS.reset);
console.log('  → baseURL = "https://manielectrical-backend.onrender.com/api"\n');

console.log(COLORS.bright + '⚙️  FILE LOCATIONS:\n' + COLORS.reset);

console.log('Frontend API Configuration:');
console.log(COLORS.dim + '  • frontend/src/services/api.js (main axios instance)');
console.log('  • frontend/src/services/socket.js (WebSocket connection)' + COLORS.reset + '\n');

console.log('Backend Configuration:');
console.log(COLORS.dim + '  • backend/server.js (CORS setup & PORT usage)');
console.log('  • backend/.env (local environment variables)' + COLORS.reset + '\n');

console.log('Build Configuration:');
console.log(COLORS.dim + '  • frontend/vite.config.js (dev proxy settings)');
console.log('  • frontend/vercel.json (Vercel deployment config)' + COLORS.reset + '\n');

console.log(COLORS.bright + '🎯 BEST PRACTICES IMPLEMENTED:\n' + COLORS.reset);

console.log(COLORS.green + '✅' + COLORS.reset + ' Backend uses: process.env.PORT || 5000');
console.log(COLORS.green + '✅' + COLORS.reset + ' Frontend uses: VITE_* prefix (Vite standard)');
console.log(COLORS.green + '✅' + COLORS.reset + ' Dev/Prod separation: .env.local vs .env.production');
console.log(COLORS.green + '✅' + COLORS.reset + ' CORS properly configured for production domains');
console.log(COLORS.green + '✅' + COLORS.reset + ' Socket.IO URL matches API URL (prevents connection issues)');
console.log(COLORS.green + '✅' + COLORS.reset + ' Environment variables documented in .env.example');
console.log(COLORS.green + '✅' + COLORS.reset + ' No hardcoded URLs (fully dynamic)\n');

console.log(COLORS.bright + '❌ COMMON MISTAKES TO AVOID:\n' + COLORS.reset);

console.log('1. Using localhost on Vercel production:');
console.log(COLORS.dim + '   ❌ VITE_API_URL=http://localhost:50004  (WRONG - won\'t work on Vercel)' + COLORS.reset);
console.log(COLORS.green + '   ✅ VITE_API_URL=https://manielectrical-backend.onrender.com' + COLORS.reset + '\n');

console.log('2. Committing .env file to git:');
console.log(COLORS.dim + '   ❌ git add .env  (WRONG - leaks secrets)' + COLORS.reset);
console.log(COLORS.green + '   ✅ Use Vercel dashboard for secrets' + COLORS.reset + '\n');

console.log('3. Mixing VITE_ and process.env in frontend:');
console.log(COLORS.dim + '   ❌ process.env.API_URL  (WRONG - not available in browser)' + COLORS.reset);
console.log(COLORS.green + '   ✅ import.meta.env.VITE_API_URL  (CORRECT)' + COLORS.reset + '\n');

console.log('4. Different URLs for API and Socket.IO:');
console.log(COLORS.dim + '   ❌ API @ https://api.example.com, Socket @ https://socket.example.com' + COLORS.reset);
console.log(COLORS.green + '   ✅ Both use same domain for simplicity' + COLORS.reset + '\n');

console.log(COLORS.reset);
