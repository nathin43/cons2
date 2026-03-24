#!/usr/bin/env node

/**
 * PRODUCTION DEPLOYMENT SETUP SCRIPT
 * 
 * Usage: node setup-production.js
 * 
 * This script validates your environment configuration and provides
 * step-by-step instructions for deploying to Vercel + Render
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, COLORS.reset);
}

function checkFile(filePath, label) {
  const exists = fs.existsSync(filePath);
  const symbol = exists ? '✅' : '❌';
  const status = exists ? COLORS.green : COLORS.red;
  log(status, `${symbol} ${label}`);
  return exists;
}

console.clear();
log(COLORS.cyan + COLORS.bright, '\n╔════════════════════════════════════════════╗');
log(COLORS.cyan + COLORS.bright, '║  PRODUCTION DEPLOYMENT CONFIGURATION CHECK ║');
log(COLORS.cyan + COLORS.bright, '╚════════════════════════════════════════════╝\n');

const frontendPath = path.join(__dirname, 'frontend');
const backendPath = path.join(__dirname, 'backend');

// Check frontend files
log(COLORS.bright, '📁 FRONTEND FILES:');
checkFile(path.join(frontendPath, '.env.local'), '.env.local (local development)');
checkFile(path.join(frontendPath, '.env.production'), '.env.production (Vercel production)');
checkFile(path.join(frontendPath, 'vercel.json'), 'vercel.json (Vercel config)');
checkFile(path.join(frontendPath, 'vite.config.js'), 'vite.config.js (Vite config)');

console.log();
log(COLORS.bright, '📁 BACKEND FILES:');
checkFile(path.join(backendPath, '.env'), '.env (current environment)');
checkFile(path.join(backendPath, '.env.example'), '.env.example (template)');
checkFile(path.join(backendPath, 'server.js'), 'server.js (main server)');

console.log();
log(COLORS.cyan + COLORS.bright, '\n╔════════════════════════════════════════════╗');
log(COLORS.cyan + COLORS.bright, '║        DEPLOYMENT INSTRUCTIONS             ║');
log(COLORS.cyan + COLORS.bright, '╚════════════════════════════════════════════╝\n');

log(COLORS.bright, '🔹 STEP 1: Set up RENDER (Backend)\n');
log(COLORS.yellow, '   1. Go to https://render.com');
log(COLORS.yellow, '   2. Create new "Web Service"');
log(COLORS.yellow, '   3. Connect your GitHub repository');
log(COLORS.yellow, '   4. ');
log(COLORS.yellow, '   Configuration:');
log(COLORS.yellow, '      • Name: manielectrical-backend');
log(COLORS.yellow, '      • Environment: Node');
log(COLORS.yellow, '      • Build Command: npm install');
log(COLORS.yellow, '      • Start Command: npm start (or: node server.js)');
log(COLORS.yellow, '      • Instance Type: Free (or paid for no sleep)');
log(COLORS.yellow, '   5. Add Environment Variables (see .env below)');

console.log();
log(COLORS.bright, '🔹 STEP 2: Set Environment Variables on Render\n');
log(COLORS.dim, '   Go to: Settings → Environment Variables\n');
log(COLORS.yellow, '   Required Variables:');
log(COLORS.yellow, '      • MONGO_URI: mongodb+srv://user:pass@cluster.mongodb.net/database?...');
log(COLORS.yellow, '      • NODE_ENV: production');
log(COLORS.yellow, '      • JWT_SECRET: (generate strong 32+ char secret)');
log(COLORS.yellow, '      • RAZORPAY_KEY_ID: (your test key)');
log(COLORS.yellow, '      • RAZORPAY_KEY_SECRET: (your test secret)');
log(COLORS.yellow, '      • CORS_ORIGIN: https://manielectrical.vercel.app');
log(COLORS.yellow, '      • PORT: (Leave blank - Render assigns automatically)');
log(COLORS.yellow, '\n   ⚠️  DO NOT commit .env to git! Use Render dashboard only.');

console.log();
log(COLORS.bright, '🔹 STEP 3: Verify Backend Health\n');
log(COLORS.yellow, '   After deployment, test endpoint:');
log(COLORS.cyan, '      https://manielectrical-backend.onrender.com/api/health');

console.log();
log(COLORS.bright, '🔹 STEP 4: Deploy to VERCEL (Frontend)\n');
log(COLORS.yellow, '   1. Go to https://vercel.com');
log(COLORS.yellow, '   2. Click "New Project"');
log(COLORS.yellow, '   3. Import your GitHub repository');
log(COLORS.yellow, '   4. Framework: Other (Vite)');
log(COLORS.yellow, '   5. Build Command: npm run build');
log(COLORS.yellow, '   6. Output Directory: dist');

console.log();
log(COLORS.bright, '🔹 STEP 5: Set Environment Variables on Vercel\n');
log(COLORS.dim, '   Go to: Settings → Environment Variables\n');
log(COLORS.yellow, '   Required Variables:');
log(COLORS.yellow, '      • VITE_API_URL: https://manielectrical-backend.onrender.com');
log(COLORS.yellow, '      • VITE_SOCKET_URL: https://manielectrical-backend.onrender.com');
log(COLORS.yellow, '      • VITE_GOOGLE_CLIENT_ID: (your OAuth client ID)');
log(COLORS.yellow, '   Set for all environments: Production, Preview, Development');

console.log();
log(COLORS.bright, '🔹 STEP 6: Update Google OAuth\n');
log(COLORS.yellow, '   Update in Google Cloud Console:');
log(COLORS.yellow, '      • Add authorized redirect: https://manielectrical.vercel.app');
log(COLORS.yellow, '      • Add authorized origin: https://manielectrical.vercel.app');

console.log();
log(COLORS.bright, '🔹 STEP 7: Update MongoDB CORS\n');
log(COLORS.yellow, '   MongoDB Atlas → Network Control → IP Whitelist:');
log(COLORS.yellow, '      • Add 0.0.0.0/0 (allow all - for testing)');
log(COLORS.yellow, '      • Or add specific Render IPs (more secure)');

console.log();
log(COLORS.green + COLORS.bright, '\n✅ ENVIRONMENT VARIABLES SUMMARY\n');
log(COLORS.dim, '   Frontend (.env.production):');
log(COLORS.cyan, '      VITE_API_URL=https://manielectrical-backend.onrender.com/api');
log(COLORS.cyan, '      VITE_SOCKET_URL=https://manielectrical-backend.onrender.com');
log(COLORS.cyan, '      VITE_GOOGLE_CLIENT_ID=<your-id>');

log(COLORS.dim, '\n   Backend (.env on Render):');
log(COLORS.cyan, '      MONGO_URI=<mongodb+srv://...>');
log(COLORS.cyan, '      NODE_ENV=production');
log(COLORS.cyan, '      JWT_SECRET=<secret>');
log(COLORS.cyan, '      CORS_ORIGIN=https://manielectrical.vercel.app');

console.log();
log(COLORS.cyan + COLORS.bright, '\n═══════════════════════════════════════════');
log(COLORS.green + COLORS.bright, '🚀 DEPLOYMENT CHECKLIST\n');
log(COLORS.yellow, '   ☐ MongoDB Atlas connection string added');
log(COLORS.yellow, '   ☐ Environment variables set on Render');
log(COLORS.yellow, '   ☐ Environment variables set on Vercel');
log(COLORS.yellow, '   ☐ MongoDB IP whitelist includes Render');
log(COLORS.yellow, '   ☐ Google OAuth updated for production domain');
log(COLORS.yellow, '   ☐ Backend deployed to Render');
log(COLORS.yellow, '   ☐ Frontend deployed to Vercel');
log(COLORS.yellow, '   ☐ Backend health check passes');
log(COLORS.yellow, '   ☐ API calls working from frontend');

console.log();
log(COLORS.bright, '📌 TROUBLESHOOTING:\n');
log(COLORS.yellow, '   • CORS errors: Check CORS_ORIGIN on Render');
log(COLORS.yellow, '   • Connection timeout: Verify MongoDB IP whitelist');
log(COLORS.yellow, '   • 404 API errors: Check VITE_API_URL on Vercel');
log(COLORS.yellow, '   • Socket.IO fails: Check VITE_SOCKET_URL on Vercel');
log(COLORS.yellow, '   • Free tier sleep: Upgrade Render instance or add timeout ping');

console.log();
log(COLORS.reset, '');
