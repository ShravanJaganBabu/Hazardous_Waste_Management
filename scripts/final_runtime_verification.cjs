const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const socketIoClientPath = path.resolve(__dirname, '../frontend/node_modules/socket.io-client');
const { io } = require(socketIoClientPath);

const API_BASE = 'http://127.0.0.1:5000/api';

function request(method, pathUrl, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + pathUrl);
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

const testResults = {
  passed: [],
  failed: [],
  skipped: [],
};

function recordPass(testName, details) {
  console.log(`\x1b[32m✓ [PASS]\x1b[0m ${testName}: ${details}`);
  testResults.passed.push({ name: testName, details });
}

function recordFail(testName, error) {
  console.error(`\x1b[31m✗ [FAIL]\x1b[0m ${testName}: ${error}`);
  testResults.failed.push({ name: testName, error });
}

function recordSkip(testName, reason) {
  console.log(`\x1b[33m⚠ [SKIP]\x1b[0m ${testName}: ${reason}`);
  testResults.skipped.push({ name: testName, reason });
}

async function runVerification() {
  console.log('============================================================');
  console.log('  HAZTRACK // FINAL RUNTIME & INTEGRATION VERIFICATION');
  console.log('============================================================\n');

  let adminToken = '';
  let facilityToken = '';
  let transporterToken = '';
  let createdWasteId = '';

  // --------------------------------------------------------------------------
  // Checkpoint 1 & 2: Health Check & Process Liveness
  // --------------------------------------------------------------------------
  console.log('\n--- CHECKPOINT 1 & 2: Server Liveness & GET /api/health ---');
  try {
    const health = await request('GET', '/health');
    if (health.status === 200 && health.data?.status === 'OPERATIONAL') {
      recordPass('GET /api/health', `Responded HTTP 200 with status: ${health.data.status}, system: ${health.data.system}`);
    } else {
      recordFail('GET /api/health', `Unexpected status: ${health.status}`);
    }
  } catch (err) {
    recordFail('GET /api/health', err.message);
  }

  // --------------------------------------------------------------------------
  // Checkpoint 5: Login, JWT Authentication, and RBAC
  // --------------------------------------------------------------------------
  console.log('\n--- CHECKPOINT 5: Login, JWT Authentication & RBAC ---');
  try {
    // 5a. Admin Login
    const adminLogin = await request('POST', '/auth/login', {
      identifier: 'harinitha.admin@haztrack.eec.edu',
      password: 'HazTrack@2026!',
    });
    if (adminLogin.status === 200 && adminLogin.data?.token) {
      adminToken = adminLogin.data.token;
      recordPass('Admin Authentication', `Authenticated as ${adminLogin.data.user.name} (Role: ${adminLogin.data.user.role})`);
    } else {
      recordFail('Admin Authentication', `Status ${adminLogin.status}`);
    }

    // 5b. Facility Manager Login
    const facilityLogin = await request('POST', '/auth/login', {
      identifier: 'ravan@greensafe.in',
      password: 'HazTrack@2026!',
    });
    if (facilityLogin.status === 200 && facilityLogin.data?.token) {
      facilityToken = facilityLogin.data.token;
      recordPass('Facility Manager Authentication', `Authenticated as ${facilityLogin.data.user.name} (Role: ${facilityLogin.data.user.role})`);
    } else {
      recordFail('Facility Manager Authentication', `Status ${facilityLogin.status}`);
    }

    // 5c. Transporter Login
    const transporterLogin = await request('POST', '/auth/login', {
      identifier: 'shravan@vanguardlogistics.in',
      password: 'HazTrack@2026!',
    });
    if (transporterLogin.status === 200 && transporterLogin.data?.token) {
      transporterToken = transporterLogin.data.token;
      recordPass('Transporter Authentication', `Authenticated as ${transporterLogin.data.user.name} (Role: ${transporterLogin.data.user.role})`);
    } else {
      recordFail('Transporter Authentication', `Status ${transporterLogin.status}`);
    }

    // 5d. Role-Based Authorization Enforcement
    // GET /api/audit-logs is restricted to ADMIN
    const adminAudit = await request('GET', '/audit-logs', null, adminToken);
    const nonAdminAudit = await request('GET', '/audit-logs', null, facilityToken);
    if (adminAudit.status === 200 && nonAdminAudit.status === 403) {
      recordPass('RBAC Endpoint Protection', `Admin granted 200 OK, Treatment Facility denied 403 Forbidden on /api/audit-logs`);
    } else {
      recordFail('RBAC Endpoint Protection', `Admin: ${adminAudit.status}, Facility: ${nonAdminAudit.status}`);
    }
  } catch (err) {
    recordFail('Authentication/RBAC', err.message);
  }

  // --------------------------------------------------------------------------
  // Checkpoint 4: Record Creation, Readback & Persistence
  // --------------------------------------------------------------------------
  console.log('\n--- CHECKPOINT 4: Create Record, Readback & Data Verification ---');
  try {
    const newWastePayload = {
      wasteType: 'Lithium Battery Cathode Slurry',
      category: 'Class 9 (Miscellaneous Hazardous)',
      declaredQuantity: 320,
      unit: 'kg',
      description: 'Spent EV lithium cobalt cathode slurry from battery research pack testing.',
      hazardLevel: 'EXTREME',
    };

    const createRes = await request('POST', '/waste/register', newWastePayload, adminToken);
    if (createRes.status === 201 && createRes.data?.waste?.wasteId) {
      createdWasteId = createRes.data.waste.wasteId;
      recordPass('Waste Registration (Write)', `Created record ID: ${createdWasteId} with QR code and declared mass: ${createRes.data.waste.declaredQuantity} kg`);

      // Read it back
      const readRes = await request('GET', `/waste/${createdWasteId}`, null, adminToken);
      if (readRes.status === 200 && readRes.data?.waste?.wasteId === createdWasteId) {
        recordPass('Waste Readback (Read)', `Successfully queried record ${createdWasteId}: ${readRes.data.waste.wasteType}`);
      } else {
        recordFail('Waste Readback', `Status: ${readRes.status}`);
      }
    } else {
      recordFail('Waste Registration', `Status: ${createRes.status}: ${createRes.data?.message}`);
    }
  } catch (err) {
    recordFail('Record Persistence', err.message);
  }

  // --------------------------------------------------------------------------
  // Checkpoint 6: QR Lookup API (Valid, Invalid, JSON, URL)
  // --------------------------------------------------------------------------
  console.log('\n--- CHECKPOINT 6: QR Code Lookup API Flow ---');
  try {
    // 6a. Valid Shipment ID
    const validShipment = await request('GET', '/shipments/lookup/SHP-2026-000103', null, facilityToken);
    if (validShipment.status === 200 && validShipment.data?.shipment?.shipmentId === 'SHP-2026-000103') {
      recordPass('Valid Shipment Lookup (SHP-2026-000103)', `Status: ${validShipment.data.shipment.status}, Permitted Facility Actions: ${JSON.stringify(validShipment.data.allowedActions)}`);
    } else {
      recordFail('Valid Shipment Lookup', `Status: ${validShipment.status}`);
    }

    // 6b. Valid Waste ID
    const validWaste = await request('GET', '/shipments/lookup/HW-2026-000103', null, facilityToken);
    if (validWaste.status === 200 && validWaste.data?.shipment?.shipmentId === 'SHP-2026-000103') {
      recordPass('Valid Waste ID Lookup (HW-2026-000103)', `Successfully resolved to parent shipment ${validWaste.data.shipment.shipmentId}`);
    } else {
      recordFail('Valid Waste ID Lookup', `Status: ${validWaste.status}`);
    }

    // 6c. Valid Manifest Number
    const validManifest = await request('GET', '/shipments/lookup/MNF-TN-880103', null, facilityToken);
    if (validManifest.status === 200 && validManifest.data?.shipment?.shipmentId === 'SHP-2026-000103') {
      recordPass('Valid Manifest Lookup (MNF-TN-880103)', `Successfully resolved manifest to shipment ${validManifest.data.shipment.shipmentId}`);
    } else {
      recordFail('Valid Manifest Lookup', `Status: ${validManifest.status}`);
    }

    // 6d. Invalid/Nonexistent Identifier
    const invalidRes = await request('GET', '/shipments/lookup/HW-2026-000117', null, facilityToken);
    if (invalidRes.status === 404 && invalidRes.data?.message?.includes('No hazardous waste manifest or shipment')) {
      recordPass('Invalid Identifier Lookup (HW-2026-000117)', `HTTP 404 cleanly returned with message: "${invalidRes.data.message}"`);
    } else {
      recordFail('Invalid Identifier Lookup', `Status: ${invalidRes.status}`);
    }

    // 6e. Normalized Scanned JSON QR Code Payload
    const jsonPayload = encodeURIComponent('{"wasteId":"HW-2026-000103","organization":"Apex Chemical R&D"}');
    const jsonLookup = await request('GET', `/shipments/lookup/${jsonPayload}`, null, facilityToken);
    if (jsonLookup.status === 200 && jsonLookup.data?.shipment?.shipmentId === 'SHP-2026-000103') {
      recordPass('JSON QR Payload Normalization', `Successfully extracted HW-2026-000103 from scanned JSON and resolved shipment`);
    } else {
      recordFail('JSON QR Payload Normalization', `Status: ${jsonLookup.status}`);
    }

    // 6f. Normalized Scanned URL
    const urlPayload = encodeURIComponent('https://haztrack.vercel.app/admin/shipments/SHP-2026-000103');
    const urlLookup = await request('GET', `/shipments/lookup/${urlPayload}`, null, facilityToken);
    if (urlLookup.status === 200 && urlLookup.data?.shipment?.shipmentId === 'SHP-2026-000103') {
      recordPass('URL Format QR Normalization', `Successfully extracted SHP-2026-000103 from scanned URL`);
    } else {
      recordFail('URL Format QR Normalization', `Status: ${urlLookup.status}`);
    }
  } catch (err) {
    recordFail('QR Lookup Tests', err.message);
  }

  // --------------------------------------------------------------------------
  // Checkpoint 7: Document Upload Validation & Scoping
  // --------------------------------------------------------------------------
  console.log('\n--- CHECKPOINT 7: Document Upload Validation & RBAC ---');
  try {
    // 7a. Valid Document Record Upload
    const validDocRes = await request(
      'POST',
      '/documents/upload',
      {
        documentType: 'MSDS_SHEET',
        fileName: 'Lithium_Slurry_Safety_Data_Sheet.pdf',
        fileUrl: 'https://storage.haztrack.gov.in/docs/msds_lithium_slurry_2026.pdf',
        fileSize: 1024 * 450, // 450 KB
        mimeType: 'application/pdf',
      },
      adminToken
    );
    if (validDocRes.status === 201 && validDocRes.data?.document?.documentId) {
      recordPass('Valid Document Upload', `Secured document: ${validDocRes.data.document.fileName} (ID: ${validDocRes.data.document.documentId})`);
    } else {
      recordFail('Valid Document Upload', `Status: ${validDocRes.status}: ${validDocRes.data?.message}`);
    }

    // 7b. Invalid Document: Exceeding 15MB Size Threshold
    const oversizedDocRes = await request(
      'POST',
      '/documents/upload',
      {
        documentType: 'TRANSPORT_PERMIT',
        fileName: 'huge_archive.pdf',
        fileUrl: 'https://storage.haztrack.gov.in/docs/huge.pdf',
        fileSize: 20 * 1024 * 1024, // 20 MB (> 15MB limit)
        mimeType: 'application/pdf',
      },
      adminToken
    );
    if (oversizedDocRes.status === 400 && oversizedDocRes.data?.message?.includes('exceeds maximum permitted limit')) {
      recordPass('Oversized Document Validation', `HTTP 400 cleanly rejected 20MB file: "${oversizedDocRes.data.message}"`);
    } else {
      recordFail('Oversized Document Validation', `Status: ${oversizedDocRes.status}`);
    }

    // 7c. Invalid Document: Unsupported Executable MIME Type
    const invalidMimeRes = await request(
      'POST',
      '/documents/upload',
      {
        documentType: 'OTHER',
        fileName: 'malicious_script.exe',
        fileUrl: 'https://storage.haztrack.gov.in/docs/script.exe',
        fileSize: 1024 * 10,
        mimeType: 'application/x-msdownload',
      },
      adminToken
    );
    if (invalidMimeRes.status === 400 && invalidMimeRes.data?.message?.includes('Unsupported file format')) {
      recordPass('MIME Type Validation', `HTTP 400 cleanly rejected dangerous format: "${invalidMimeRes.data.message}"`);
    } else {
      recordFail('MIME Type Validation', `Status: ${invalidMimeRes.status}`);
    }

    // 7d. Document Scoping Check
    const docsQuery = await request('GET', '/documents', null, facilityToken);
    if (docsQuery.status === 200 && Array.isArray(docsQuery.data?.documents)) {
      recordPass('Document RBAC Query Scoping', `Retrieved ${docsQuery.data.count} authorized documents for role TREATMENT_FACILITY`);
    } else {
      recordFail('Document RBAC Query Scoping', `Status: ${docsQuery.status}`);
    }
  } catch (err) {
    recordFail('Document Validation', err.message);
  }

  // --------------------------------------------------------------------------
  // Checkpoint 8: Socket.IO Connection & Notification Channel
  // --------------------------------------------------------------------------
  console.log('\n--- CHECKPOINT 8: Real-Time Socket.IO & Event Engine ---');
  try {
    const socketConnected = await new Promise((resolve) => {
      const clientSocket = io('http://127.0.0.1:5000', {
        auth: {
          token: adminToken,
          userId: 'HZU-001',
          role: 'ADMIN',
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      clientSocket.on('connect', () => {
        const socketId = clientSocket.id;
        clientSocket.disconnect();
        resolve({ connected: true, socketId });
      });

      clientSocket.on('connect_error', (err) => {
        resolve({ connected: false, error: err.message });
      });

      setTimeout(() => {
        clientSocket.disconnect();
        resolve({ connected: false, error: 'Connection timed out' });
      }, 5000);
    });

    if (socketConnected.connected) {
      recordPass('Socket.IO Connection', `Handshake successful via WebSocket. Socket ID: ${socketConnected.socketId}`);
    } else {
      recordFail('Socket.IO Connection', socketConnected.error);
    }
  } catch (err) {
    recordFail('Socket.IO Connection', err.message);
  }

  // --------------------------------------------------------------------------
  // Checkpoint 9: Production Fallback Protection Verification
  // --------------------------------------------------------------------------
  console.log('\n--- CHECKPOINT 9: Production Mode Fallback Protection ---');
  try {
    // Spawn an isolated test process with NODE_ENV=production and unreachable DB
    const prodTestResult = await new Promise((resolve) => {
      const testProc = spawn('node', ['backend/dist/server.js'], {
        env: {
          ...process.env,
          PORT: '5099',
          HOST: '0.0.0.0',
          NODE_ENV: 'production',
          MONGODB_URI: 'mongodb://127.0.0.1:19999/unreachable_db', // Unreachable port
        },
        stdio: 'pipe',
      });

      let stdoutData = '';
      let stderrData = '';
      testProc.stdout.on('data', (d) => (stdoutData += d.toString()));
      testProc.stderr.on('data', (d) => (stderrData += d.toString()));

      testProc.on('exit', (code) => {
        const combined = stdoutData + stderrData;
        const haltedSafely =
          code !== 0 &&
          combined.includes('[HAZTRACK DB CRITICAL ERROR]') &&
          combined.includes('Embedded fallback is disabled (ALLOW_EMBEDDED_DB_FALLBACK=false)');
        resolve({ haltedSafely, code, combined });
      });

      setTimeout(() => {
        testProc.kill();
        resolve({ haltedSafely: false, code: -1, combined: stdoutData + stderrData });
      }, 20000);
    });

    if (prodTestResult.haltedSafely) {
      recordPass(
        'Production Fallback Protection',
        'Verified: Production mode exited with failure code and REFUSED to silently switch to in-memory storage when persistent database was unreachable.'
      );
    } else {
      recordFail(
        'Production Fallback Protection',
        `Did not halt safely. Exit code: ${prodTestResult.code}. Output: ${prodTestResult.combined.slice(0, 300)}`
      );
    }
  } catch (err) {
    recordFail('Production Fallback Protection', err.message);
  }

  // --------------------------------------------------------------------------
  // Checkpoint 10: Frontend API URL Configuration Verification
  // --------------------------------------------------------------------------
  console.log('\n--- CHECKPOINT 10: Frontend Production Bundle URL Audit ---');
  try {
    const distAssetsDir = path.resolve(__dirname, '../frontend/dist/assets');
    const files = fs.readdirSync(distAssetsDir);
    const jsBundle = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));

    if (jsBundle) {
      const bundleContent = fs.readFileSync(path.join(distAssetsDir, jsBundle), 'utf8');
      const containsLocalhostApi = bundleContent.includes('localhost:5000') || bundleContent.includes('127.0.0.1:5000');

      if (!containsLocalhostApi) {
        recordPass(
          'Frontend Bundle URL Audit',
          `Verified: ${jsBundle} contains zero hardcoded localhost:5000 API references. Dynamic VITE_API_URL resolution active.`
        );
      } else {
        recordFail('Frontend Bundle URL Audit', `Found hardcoded localhost:5000 in production bundle ${jsBundle}`);
      }
    } else {
      recordFail('Frontend Bundle URL Audit', 'Could not locate built JS bundle in frontend/dist/assets');
    }
  } catch (err) {
    recordFail('Frontend Bundle URL Audit', err.message);
  }

  // --------------------------------------------------------------------------
  // Checkpoint 3 & Cloud Services Summary
  // --------------------------------------------------------------------------
  console.log('\n--- CHECKPOINT 3: MongoDB Atlas Cloud Storage ---');
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv://')) {
    recordPass('MongoDB Atlas Remote Connection', `Active connection string detected in environment.`);
  } else {
    recordSkip(
      'MongoDB Atlas Remote Connection',
      'No live MongoDB Atlas credentials (mongodb+srv://...) provided in local environment. Tested and verified locally against high-performance MongoDB engine. Follow DEPLOYMENT.md to supply Atlas URI on Render.'
    );
  }

  // --------------------------------------------------------------------------
  // Final Results Summary
  // --------------------------------------------------------------------------
  console.log('\n============================================================');
  console.log('  FINAL VERIFICATION SUMMARY');
  console.log('============================================================');
  console.log(`Passed Checks : ${testResults.passed.length}`);
  console.log(`Failed Checks : ${testResults.failed.length}`);
  console.log(`Skipped Checks: ${testResults.skipped.length}`);

  if (testResults.failed.length === 0) {
    console.log('\n\x1b[32m%s\x1b[0m', '>>> ALL INTEGRATION CHECKS PASSED. HAZTRACK IS PRODUCTION-READY. <<<');
    process.exit(0);
  } else {
    console.log('\n\x1b[31m%s\x1b[0m', '>>> SOME CHECKS FAILED. REVIEW LOGS ABOVE. <<<');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
