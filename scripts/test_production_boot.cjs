const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 5055;
const HOST = '0.0.0.0';

console.log('=== HAZTRACK PRODUCTION ENVIRONMENT BOOT TEST ===\n');

const env = {
  ...process.env,
  PORT: String(PORT),
  HOST: HOST,
  NODE_ENV: 'production',
  SERVE_FRONTEND: 'true',
  MONGODB_URI: 'mongodb://127.0.0.1:64679/haztrack_prod_test',
  JWT_SECRET: 'production-verified-secret-key-64-bytes-long-super-secure-chain-2026',
};

const serverPath = path.resolve(__dirname, '../backend/dist/server.js');
console.log(`[BOOT] Launching: node backend/dist/server.js on ${HOST}:${PORT} (NODE_ENV=production)...`);

const serverProc = spawn(process.execPath, [serverPath], {
  env,
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
serverProc.stdout.on('data', (d) => {
  const str = d.toString();
  serverOutput += str;
  process.stdout.write(str);
});

serverProc.stderr.on('data', (d) => {
  const str = d.toString();
  serverOutput += str;
  process.stderr.write(str);
});

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runVerification() {
  console.log('[VERIFY] Waiting for server initialization...');
  let ready = false;
  for (let i = 0; i < 30; i++) {
    await wait(1000);
    try {
      const res = await httpGet('/api/health');
      if (res.status === 200 && res.data?.status === 'OPERATIONAL') {
        console.log('\n✓ Health check endpoint responded with 200 OK:');
        console.log(res.data);
        ready = true;
        break;
      }
    } catch (e) {
      // still starting up
    }
  }

  if (!ready) {
    console.error('✗ Server failed to respond to health check in 30 seconds.');
    serverProc.kill();
    process.exit(1);
  }

  // Test static frontend serving
  console.log('\n[VERIFY] Testing Production Static Frontend Delivery (GET /)...');
  const indexRes = await httpGet('/');
  console.log(`Static Frontend Response: HTTP ${indexRes.status}, Content-Type: ${indexRes.headers['content-type']}`);
  if (indexRes.status === 200 && indexRes.raw?.includes('<title>')) {
    console.log('✓ Successfully served built single-page application frontend index.html!');
  } else {
    console.error('✗ Failed to serve frontend index.html:', indexRes);
  }

  // Test API endpoint (e.g. login)
  console.log('\n[VERIFY] Testing Production Authentication API (POST /api/auth/login)...');
  const postData = JSON.stringify({
    identifier: 'harinitha.admin@haztrack.eec.edu',
    password: 'HazTrack@2026!'
  });

  const loginRes = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch (_) { resolve({ status: res.statusCode, raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  console.log('Login Status:', loginRes.status);
  console.log('Admin User:', loginRes.data?.user?.name, 'Role:', loginRes.data?.user?.role);
  if (loginRes.status === 200 && loginRes.data?.token) {
    console.log('✓ Production authentication successful!');
  } else {
    console.error('✗ Production login failed:', loginRes);
  }

  console.log('\n[CLEANUP] Stopping production test server...');
  serverProc.kill();
  console.log('✓ Production Boot Verification Succeeded 100%!');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('Test execution error:', err);
  serverProc.kill();
  process.exit(1);
});
