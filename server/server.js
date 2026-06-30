const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const DB_FILE = path.join(__dirname, 'db.json');

// Seed Data
const initialData = {
  companies: [
    { id: 'c-vulcan', name: 'Vulcan Resources Mozambique', appName: 'ZeroGate', status: 'Active', defaultLanguage: 'en', tier: 'Prime', features: { alcohol: true } },
    { id: 'c-motaengil', name: 'Mota-Engil Africa', appName: 'ZeroGate Sub-Portal', status: 'Active', defaultLanguage: 'pt', parentId: 'c-vulcan', tier: 'Sub', features: { alcohol: false } },
    { id: 'c-jachris', name: 'Jachris Services', appName: 'Jachris Portal', status: 'Active', defaultLanguage: 'pt', parentId: 'c-vulcan', tier: 'Sub', features: { alcohol: false } },
    { id: 'c-belabel', name: 'Belabel Logistics', appName: 'Belabel Portal', status: 'Active', defaultLanguage: 'pt', parentId: 'c-vulcan', tier: 'Sub', features: { alcohol: false } }
  ],
  sites: [
    { id: 's-moatize', companyId: 'c-vulcan', name: 'Moatize Coal Mine', location: 'Tete' },
    { id: 's-nacala', companyId: 'c-vulcan', name: 'Nacala Logistics Port', location: 'Nampula' }
  ],
  employees: [
    { id: 'emp-paulo', name: 'Paulo Manjate', recordId: 'VUL-2049', siteId: 's-moatize', company: 'Vulcan Resources Mozambique', department: 'HSE Risk', role: 'Operator', isActive: true, phoneNumber: '+258 84 123 4567', driverLicenseNumber: 'MC-29402', driverLicenseClass: 'C', driverLicenseExpiry: '2027-12-10' },
    { id: 'emp-maria', name: 'Maria Tembe', recordId: 'MOT-8839', siteId: 's-nacala', company: 'Mota-Engil Africa', department: 'Operations', role: 'Driver', isActive: true, phoneNumber: '+258 82 987 6543', driverLicenseNumber: 'MC-40294', driverLicenseClass: 'B', driverLicenseExpiry: '2026-05-15' },
    { id: 'emp-celso', name: 'Celso Alface', recordId: 'JAC-0092', siteId: 's-moatize', company: 'Jachris Services', department: 'Maintenance', role: 'Technician', isActive: true, phoneNumber: '+258 84 999 1122', driverLicenseNumber: 'MC-11002', driverLicenseClass: 'C', driverLicenseExpiry: '2028-08-20' }
  ],
  bookings: [
    { id: 'book-initial-1', employeeId: 'emp-paulo', sessionId: 'sess-1', status: 'Pending', requestedAt: new Date().toISOString() }
  ],
  sessions: [
    { id: 'sess-1', racCode: 'RAC01', date: '2026-06-25', startTime: '09:00', location: 'Main Classroom', capacity: 15, instructor: 'Pita Domingos', language: 'en', companyId: 'c-vulcan', siteId: 's-moatize' },
    { id: 'sess-2', racCode: 'RAC02', date: '2026-06-28', startTime: '10:00', location: 'Auditorium B', capacity: 10, instructor: 'Pita Domingos', language: 'pt', companyId: 'c-vulcan', siteId: 's-nacala' },
    { id: 'sess-3', racCode: 'RAC01', date: '2026-07-02', startTime: '14:00', location: 'Site Classroom 2', capacity: 12, instructor: 'Pita Domingos', language: 'pt', companyId: 'c-vulcan', siteId: 's-moatize' }
  ],
  requirements: [
    { id: 'req-1', employeeId: 'emp-paulo', racCode: 'RAC01', status: 'Expired', expiryDate: '2026-06-01', medicalStatus: 'Valid', medicalExpiry: '2026-11-15' },
    { id: 'req-2', employeeId: 'emp-maria', racCode: 'RAC02', status: 'Valid', expiryDate: '2027-01-15', medicalStatus: 'Expired', medicalExpiry: '2026-05-01' },
    { id: 'req-3', employeeId: 'emp-celso', racCode: 'RAC01', status: 'Expired', expiryDate: '2026-05-10', medicalStatus: 'Valid', medicalExpiry: '2027-02-14' }
  ],
  logs: [
    { id: 'log-1', timestamp: new Date(Date.now() - 3600000).toISOString(), employeeName: 'Paulo Manjate', recordId: 'VUL-2049', company: 'Vulcan Resources Mozambique', site: 'Moatize Coal Mine', module: 'Breathalyzer', result: 'Clean (0.00 BAC)', status: 'Authorized' }
  ],
  notifications: [
    { id: 'notif-1', type: 'info', title: 'System Initialized', message: 'CARS Shared Sync API active.', timestamp: new Date().toISOString(), isRead: false }
  ]
};

// Ensure database file exists
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading db.json, resetting to default', e);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  return initialData;
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving db.json', e);
  }
}

// Start Server
const server = http.createServer((req, res) => {
  // Add CORS headers to all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const db = loadDb();

  // Route: GET /api/db -> Load entire DB state
  if (pathname === '/api/db' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db));
    return;
  }

  // Route: POST /api/save -> Full sync
  if (pathname === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        // Clean and update keys in database
        Object.keys(payload).forEach(key => {
          if (db[key]) {
            db[key] = payload[key];
          }
        });
        saveDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Route: POST /api/bookings -> Add new training booking
  if (pathname === '/api/bookings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const booking = JSON.parse(body);
        db.bookings.push(booking);
        
        // Push notification for training department
        const employee = db.employees.find(e => e.id === booking.employeeId) || { name: 'Unknown Employee' };
        const session = db.sessions.find(s => s.id === booking.sessionId) || { racCode: 'RAC' };
        
        db.notifications.unshift({
          id: Math.random().toString(36).substring(2, 9),
          type: 'info',
          title: 'New Training Request',
          message: `${employee.name} requested enrollment in ${session.racCode}.`,
          timestamp: new Date().toISOString(),
          isRead: false
        });

        saveDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, booking }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // Route: POST /api/alcohol/log -> Log breathalyzer gate checks
  if (pathname === '/api/alcohol/log' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const logEntry = JSON.parse(body);
        db.logs.unshift(logEntry);
        
        // Trigger alert notification if positive BAC test
        if (logEntry.result !== 'Clean (0.00 BAC)' && logEntry.status === 'Denied') {
          db.notifications.unshift({
            id: Math.random().toString(36).substring(2, 9),
            type: 'danger',
            title: 'ALCOHOL VIOLATION DETECTED',
            message: `Employee ${logEntry.employeeName} (${logEntry.company}) failed breathalyzer test at ${logEntry.site}. Gate Access Denied!`,
            timestamp: new Date().toISOString(),
            isRead: false
          });
        }
        
        saveDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });
    return;
  }

  // Catch all: 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(PORT, () => {
  console.log(`CARS Shared Sync API running at http://localhost:${PORT}`);
});
