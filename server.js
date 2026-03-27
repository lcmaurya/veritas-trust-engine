const http = require('http');
const {run} = require('./combine');

const PORT = process.env.PORT || 4000;
const API_KEY = "mysecret123";

// 🔥 storage (demo only)
const proofs = {};
const history = [];

// ===== helper =====
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function uid() {
  return Math.random().toString(36).substring(2, 10);
}

// ===== server =====
const server = http.createServer(async (req, res) => {

  // ✅ CORS FIX (VERY IMPORTANT)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  try {

    // ===== GENERATE =====
    if (req.method === 'POST' && req.url === '/generate') {

      const key = req.headers['x-api-key'];
      if (key !== API_KEY) {
        res.writeHead(403, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({error:"Forbidden"}));
      }

      const raw = await getBody(req);
      if (!raw) {
        res.writeHead(400, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({error:"Empty body"}));
      }

      const data = JSON.parse(raw);

      if (!data.message) {
        res.writeHead(400, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({error:"Missing message"}));
      }

      const result = await run(
        data.name || "user",
        data.dob || "2000",
        data.message
      );

      const id = uid();

      const proof = {
        id,
        message: data.message,
        hash: result.decision_hash,
        signature: result.decision_signature,
        block: result.block?.index || 0,
        time: Date.now()
      };

      proofs[id] = proof;
      history.unshift(proof);

      const response = {
        id: proof.id,
        message: proof.message,
        hash: proof.hash,
        signature: proof.signature,
        block: proof.block,
        time: proof.time,
        link: "https://veritasengine.in/proof.html?id=" + id
      };

      res.writeHead(200, {'Content-Type':'application/json'});
      return res.end(JSON.stringify(response));
    }

    // ===== GET PROOF =====
    if (req.method === 'GET' && req.url.startsWith('/proof')) {

      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get('id');

      if (!id || !proofs[id]) {
        res.writeHead(404, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({error:"Not found"}));
      }

      res.writeHead(200, {'Content-Type':'application/json'});
      return res.end(JSON.stringify(proofs[id]));
    }

    // ===== HISTORY =====
    if (req.method === 'GET' && req.url === '/history') {
      res.writeHead(200, {'Content-Type':'application/json'});
      return res.end(JSON.stringify(history.slice(0, 10)));
    }

    // ===== STATS =====
    if (req.method === 'GET' && req.url === '/stats') {

      const total = history.length;
      const latestBlock = total > 0 ? history[0].block : 0;

      res.writeHead(200, {'Content-Type':'application/json'});
      return res.end(JSON.stringify({
        total,
        latestBlock
      }));
    }

    // ===== DEFAULT =====
    res.writeHead(404, {'Content-Type':'application/json'});
    res.end(JSON.stringify({error:"Not Found"}));

  } catch (e) {
    res.writeHead(500, {'Content-Type':'application/json'});
    res.end(JSON.stringify({error: e.message}));
  }

});

// ===== START =====
server.listen(PORT, () => {
  console.log("🚀 Veritas Server Running on PORT " + PORT);
});