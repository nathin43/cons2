#!/usr/bin/env node
/**
 * Kills any process using PORT before the server starts.
 * Prevents EADDRINUSE crash when restarting dev server.
 */
const { execSync } = require('child_process');
const net = require('net');

require('dotenv').config();
const PORT = process.env.PORT || 5000;

function getPidsUsingPort(port) {
  if (process.platform !== 'win32') return [];
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = result.trim().split('\n').filter(Boolean);
    const pids = new Set();

    lines.forEach((line) => {
      // Prefer LISTENING entries to avoid killing unrelated outbound sockets.
      if (!line.includes('LISTENING')) return;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    });

    return Array.from(pids);
  } catch (_) {
    return [];
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, '0.0.0.0');
  });
}

async function ensurePortFree() {
  const freeBefore = await isPortFree(PORT);
  if (freeBefore) {
    console.log(`✅ Port ${PORT} is free`);
    return;
  }

  console.log(`⚠️  Port ${PORT} in use - killing existing process...`);

  if (process.platform === 'win32') {
    const pids = getPidsUsingPort(PORT);
    if (pids.length === 0) {
      console.log(`   No killable LISTENING PID found for port ${PORT}`);
    }

    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`   Killed PID ${pid}`);
      } catch (_) {
        console.log(`   Could not kill PID ${pid}`);
      }
    });
  } else {
    try {
      execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'ignore' });
    } catch (_) {
      // Ignore and verify below.
    }
  }

  const freeAfter = await isPortFree(PORT);
  if (freeAfter) {
    console.log(`✅ Port ${PORT} freed`);
    return;
  }

  console.error(`❌ Port ${PORT} is still in use. Stop the process manually and retry.`);
  process.exit(1);
}

ensurePortFree();
