/**
 * AITA Cloudflare Quick Tunnel Manager & Dynamic Registry Updater
 * 
 * Functions:
 * 1. Spawns and manages cloudflared.exe for http://127.0.0.1:5000
 * 2. Parses stdout/stderr to detect https://xxxx.trycloudflare.com URL
 * 3. Verifies health endpoint (GET /api/health) through the tunnel
 * 4. Publishes ONLINE status & new URL to Supabase Runtime Config Registry
 * 5. Maintains 30s heartbeat
 * 6. Graceful shutdown: marks OFFLINE on exit / SIGINT / SIGTERM / --offline flag
 */

const { spawn, execSync } = require('node:child_process');
const http = require('node:http');
const https = require('node:https');
const dns = require('node:dns');
const path = require('node:path');
const fs = require('node:fs');

// Set public fast DNS servers for instant trycloudflare.com resolution
try {
  dns.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1']);
} catch {}

function fastLookup(hostname, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'object' ? options : {};
  dns.resolve4(hostname, (err, addresses) => {
    if (err || !addresses || addresses.length === 0) {
      return dns.lookup(hostname, options, cb);
    }
    if (opts.all) {
      cb(null, addresses.map(a => ({ address: a, family: 4 })));
    } else {
      cb(null, addresses[0], 4);
    }
  });
}

// Simple .env parser (zero external dependencies)
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const rootDir = path.resolve(__dirname, '..');
const fileEnv = { ...loadEnv(path.join(rootDir, '.env')), ...loadEnv(path.join(rootDir, 'apps/backend/.env')) };

const SUPABASE_URL = process.env.SUPABASE_URL || fileEnv.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY || '';
const SERVICE_NAME = process.env.SERVICE_NAME || fileEnv.SERVICE_NAME || 'aita-backend';
const LOCAL_PORT = process.env.PORT || fileEnv.PORT || 5000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[TunnelManager ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.');
  process.exit(1);
}

function sendSupabasePatch(data) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/runtime_config?service_name=eq.${encodeURIComponent(SERVICE_NAME)}`);
    const payload = JSON.stringify(data);

    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 10000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        } else {
          reject(new Error(`Supabase PATCH failed [${res.statusCode}]: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Supabase PATCH request timed out'));
    });
    req.write(payload);
    req.end();
  });
}

function fetchCurrentRegistry() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/runtime_config?service_name=eq.${encodeURIComponent(SERVICE_NAME)}&select=*`);
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      timeout: 10000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const list = JSON.parse(body);
          resolve(Array.isArray(list) ? list[0] : list);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Fetch timed out')); });
    req.end();
  });
}

function verifyHealth(targetUrl, timeoutMs = 5000) {
  return new Promise((resolve) => {
    try {
      const url = new URL('/api/health', targetUrl);
      const client = url.protocol === 'https:' ? https : http;
      const options = {
        method: 'GET',
        timeout: timeoutMs,
      };
      if (url.protocol === 'https:') {
        options.lookup = fastLookup;
      }
      const req = client.request(url, options, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

function findCloudflared() {
  const commonPaths = [
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
    'C:\\Program Files\\cloudflared\\cloudflared.exe',
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  try {
    const out = execSync('where cloudflared', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const first = out.trim().split(/\r?\n/)[0];
    if (first && fs.existsSync(first)) return first;
  } catch {}
  return 'cloudflared';
}

// Handle CLI subcommands
const args = process.argv.slice(2);

if (args.includes('--offline')) {
  console.log('[TunnelManager] Marking service status as OFFLINE in Supabase...');
  sendSupabasePatch({
    status: 'OFFLINE',
    last_seen: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
    .then((result) => {
      console.log('[TunnelManager] Status successfully set to OFFLINE:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[TunnelManager] Error setting OFFLINE status:', err.message);
      process.exit(1);
    });
  return;
}

if (args.includes('--status')) {
  fetchCurrentRegistry()
    .then((info) => {
      console.log(JSON.stringify(info, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error fetching registry status:', err.message);
      process.exit(1);
    });
  return;
}

// Main Tunnel Manager Daemon
let cloudflaredProc = null;
let currentTunnelUrl = null;
let heartbeatInterval = null;
let isShuttingDown = false;

async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n[TunnelManager] Shutting down... Marking service as OFFLINE.');
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  try {
    await sendSupabasePatch({
      status: 'OFFLINE',
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log('[TunnelManager] Registry marked OFFLINE.');
  } catch (err) {
    console.error('[TunnelManager] Failed to mark OFFLINE in registry:', err.message);
  }

  if (cloudflaredProc && !cloudflaredProc.killed) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /PID ${cloudflaredProc.pid} /T /F`, { stdio: 'ignore' });
      } else {
        cloudflaredProc.kill('SIGTERM');
      }
    } catch {}
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('SIGHUP', () => shutdown(0));

function killExistingCloudflared() {
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /IM cloudflared.exe /T /F >nul 2>&1', { stdio: 'ignore' });
    } else {
      execSync('pkill -f cloudflared', { stdio: 'ignore' });
    }
  } catch {}
}

async function main() {
  killExistingCloudflared();
  await new Promise(r => setTimeout(r, 1000));
  const binary = findCloudflared();
  console.log('========================================================');
  console.log('       AITA CLOUDFLARE QUICK TUNNEL AUTO-MANAGER        ');
  console.log('========================================================');
  console.log(`[Config] Target Local Port: ${LOCAL_PORT}`);
  console.log(`[Config] Cloudflared Binary: ${binary}`);
  console.log(`[Config] Supabase Registry:  ${SUPABASE_URL}`);
  console.log('[TunnelManager] Checking local backend health first...');

  const localHealthy = await verifyHealth(`http://127.0.0.1:${LOCAL_PORT}`, 3000);
  if (!localHealthy) {
    console.warn(`[WARN] Local backend at http://127.0.0.1:${LOCAL_PORT} did not respond to /api/health.`);
    console.warn('[WARN] Continuing to start tunnel, but verify your backend is running.');
  } else {
    console.log('[TunnelManager] Local backend is ONLINE and responsive.');
  }

  console.log('[TunnelManager] Launching cloudflared Quick Tunnel...');
  const proc = spawn(binary, ['tunnel', '--url', `http://127.0.0.1:${LOCAL_PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });
  cloudflaredProc = proc;

  proc.on('error', (err) => {
    console.error('[ERROR] Failed to start cloudflared:', err.message);
    shutdown(1);
  });

  proc.on('exit', (exitCode) => {
    if (!isShuttingDown) {
      console.error(`[TunnelManager] cloudflared exited unexpectedly with code ${exitCode}`);
      shutdown(exitCode || 1);
    }
  });

  const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/i;
  let urlDiscovered = false;

  const handleOutput = async (chunk) => {
    const text = chunk.toString();
    // Also echo out relevant messages
    if (text.includes('trycloudflare.com') || text.includes('Registered tunnel connection')) {
      process.stdout.write(text);
    }

    if (!urlDiscovered) {
      const match = text.match(urlRegex);
      if (match) {
        urlDiscovered = true;
        currentTunnelUrl = match[0].trim();
        console.log(`\n[TunnelManager] 🔗 Detected Cloudflare Tunnel URL: ${currentTunnelUrl}`);
        console.log('[TunnelManager] Verifying tunnel connectivity...');

        let verified = false;
        for (let attempt = 1; attempt <= 15; attempt++) {
          process.stdout.write(`[TunnelManager] Connectivity check attempt ${attempt}/15... `);
          const ok = await verifyHealth(currentTunnelUrl, 4000);
          if (ok) {
            console.log('SUCCESS! (HTTP 200)');
            verified = true;
            break;
          }
          console.log('pending...');
          await new Promise(r => setTimeout(r, 1500));
        }

        if (!verified) {
          console.warn('[TunnelManager] ⚠️ Health check via tunnel timed out, registering URL anyway.');
        }

        console.log('[TunnelManager] Publishing new URL to Supabase Registry...');
        try {
          await sendSupabasePatch({
            backend_url: currentTunnelUrl,
            status: 'ONLINE',
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          console.log('========================================================');
          console.log('   STATUS: 🟢 ONLINE');
          console.log(`   PUBLIC BACKEND URL: ${currentTunnelUrl}`);
          console.log('   REGISTRY: Updated successfully!');
          console.log('   Frontend Vercel will auto-connect to this URL.');
          console.log('========================================================\n');

          // Start Heartbeat every 30s
          heartbeatInterval = setInterval(async () => {
            try {
              await sendSupabasePatch({
                status: 'ONLINE',
                last_seen: new Date().toISOString(),
              });
            } catch (hbErr) {
              console.warn('[TunnelManager] Heartbeat update failed:', hbErr.message);
            }
          }, 30000);

        } catch (regErr) {
          console.error('[TunnelManager] Failed to register URL on Supabase:', regErr.message);
        }
      }
    }
  };

  proc.stdout.on('data', handleOutput);
  proc.stderr.on('data', handleOutput);
}

main().catch(err => {
  console.error('[TunnelManager] Fatal error:', err);
  shutdown(1);
});
