const http = require('http');
const {run} = require('./combine');
const {verifyChain} = require('./verify_chain');
const {verifyData} = require('./verify_record');

const PORT = process.env.PORT || 4000;

// 🔐 API KEY
const API_KEY = "mysecret123";

// 🔥 RATE LIMIT
const rateLimit = {};

function checkRate(ip) {
const now = Date.now();

if (!rateLimit[ip]) {
rateLimit[ip] = [];
}

rateLimit[ip] = rateLimit[ip].filter(t => now - t < 10000);

if (rateLimit[ip].length >= 5) {
return false;
}

rateLimit[ip].push(now);
return true;
}

// 🔹 helper: body read
function getBody(req) {
return new Promise((resolve, reject) => {
let body = '';

req.on('data', chunk => body += chunk);
req.on('end', () => resolve(body));
req.on('error', reject);

});
}

const server = http.createServer(async (req, res) => {

// ✅ CORS FIX
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

// ✅ OPTIONS handler
if (req.method === "OPTIONS") {
res.writeHead(200);
return res.end();
}

try {

// ===================== CHECK =====================
if (req.method === 'POST' && req.url === '/check') {

  const clientKey = req.headers['x-api-key'];
  if (clientKey !== API_KEY) {
    res.writeHead(403);
    return res.end(JSON.stringify({error: "Forbidden"}));
  }

  let ip = req.socket.remoteAddress;
  if (ip === '::1') ip = '127.0.0.1';

  if (!checkRate(ip)) {
    res.writeHead(429);
    return res.end(JSON.stringify({error: "Too many requests"}));
  }

  const raw = await getBody(req);
  if (!raw) {
    res.writeHead(400);
    return res.end(JSON.stringify({error: "Empty body"}));
  }

  const data = JSON.parse(raw);

  if (!data.name || !data.dob || !data.message) {
    res.writeHead(400);
    return res.end(JSON.stringify({error: "Missing fields"}));
  }

  const result = await run(
    data.name,
    data.dob,
    data.message
  );

  res.writeHead(200, {'Content-Type': 'application/json'});
  return res.end(JSON.stringify(result));
}

// ===================== VERIFY =====================
else if (req.method === 'POST' && req.url === '/verify') {

  const clientKey = req.headers['x-api-key'];
  if (clientKey !== API_KEY) {
    res.writeHead(403);
    return res.end(JSON.stringify({error: "Forbidden"}));
  }

  let ip = req.socket.remoteAddress;
  if (ip === '::1') ip = '127.0.0.1';

  if (!checkRate(ip)) {
    res.writeHead(429);
    return res.end(JSON.stringify({error: "Too many requests"}));
  }

  const raw = await getBody(req);
  if (!raw) {
    res.writeHead(400);
    return res.end(JSON.stringify({error: "Empty body"}));
  }

  const data = JSON.parse(raw);

  const result = verifyData(data);

  res.writeHead(200, {'Content-Type': 'application/json'});
  return res.end(JSON.stringify(result));
}

// ===================== VERIFY CHAIN =====================
else if (req.method === 'GET' && req.url === '/verify-chain') {

  const result = verifyChain();

  res.writeHead(200, {'Content-Type': 'application/json'});
  return res.end(JSON.stringify(result));
}

// ===================== DEFAULT =====================
else {
  res.writeHead(404);
  return res.end('Not Found');
}

} catch (e) {
res.writeHead(500);
res.end(JSON.stringify({error: e.message}));
}

});

server.listen(PORT, () => {
console.log('🚀 SECURE SERVER RUNNING ON PORT ' + PORT);
});