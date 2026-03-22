#!/usr/bin/env node
/**
 * Kills any process using PORT before the server starts.
 * Prevents EADDRINUSE crash when restarting dev server.
 */
const { execSync } = require('child_process');
const net = require('net');

require('dotenv').config();
const PORT = process.env.PORT || 5000;

const server = net.createServer();
server.listen(PORT, '0.0.0.0', () => {
  server.close(() => {
    console.log(`✅ Port ${PORT} is free`);
  });
});

server.on('error', () => {
  console.log(`⚠️  Port ${PORT} in use — killing existing process...`);
  try {
    if (process.platform === 'win32') {
      const result = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });
      const lines = result.trim().split('\n');
      const pids = new Set();
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') pids.add(pid);
      });
      pids.forEach(pid => {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`   Killed PID ${pid}`);
        } catch (_) {}
      });
    } else {
      execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'ignore' });
    }
    console.log(`✅ Port ${PORT} freed`);
  } catch (_) {
    console.log(`   Could not kill process on port ${PORT} — continuing anyway`);
  }
});
