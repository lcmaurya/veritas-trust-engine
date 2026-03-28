const http = require('http');
const QRCode = require('qrcode');
const https = require('https');
const httpClient = require('http');
const db = require('./db');

const PORT = 5000;

// normalize
function normalize(input) {
  return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

// id
function uid() {
  return Math.random().toString(36).substring(2, 10);
}

// ===== CALL DECISION ENGINE =====
function callDecisionEngine(message) {
  return new Promise((resolve, reject) => {

    const data = JSON.stringify({ text: message });

    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/decide',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = httpClient.request(options, (res) => {
      let body = '';

      res.on('data', chunk => body += chunk.toString());

      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject("Engine JSON error");
        }
      });
    });

    req.on('error', err => reject(err.message));

    req.write(data);
    req.end();
  });
}

// ===== CALL HASHCHAIN =====
function callHashchain(message) {
  return new Promise((resolve, reject) => {

    const data = JSON.stringify({ message });

    const options = {
      hostname: 'veritas-trust-engine.onrender.com',
      path: '/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-api-key': 'mysecret123'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', chunk => body += chunk.toString());

      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject("Hash JSON error");
        }
      });
    });

    req.on('error', err => reject(err.message));

    req.write(data);
    req.end();
  });
}

// ===== SERVER =====
const server = http.createServer((req, res) => {

  if (req.method === 'POST' && req.url === '/generate') {

    let body = '';
    req.on('data', chunk => body += chunk);

    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');

        if (!data.message) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "Missing message" }) + "\n");
        }

        const normalized = normalize(data.message);

        // 🔥 STEP 1: DECISION
        let decisionResult;
        try {
          decisionResult = await callDecisionEngine(data.message);
        } catch (e) {
          res.writeHead(500);
          return res.end(JSON.stringify({ error: "Decision engine failed: " + e }) + "\n");
        }

        const decision = decisionResult.decision || 0;

        // 🔥 STEP 2: HASHCHAIN
        let apiResult;
        try {
          apiResult = await callHashchain(data.message);
        } catch (e) {
          res.writeHead(500);
          return res.end(JSON.stringify({ error: "Hashchain failed: " + e }) + "\n");
        }

        if (!apiResult || apiResult.error) {
          res.writeHead(500);
          return res.end(JSON.stringify({ error: "Hashchain error" }) + "\n");
        }

        const hash = apiResult.hash;
        const signature = apiResult.signature || "";

        const id = uid();
        const time = Date.now();

        db.run(
          `INSERT INTO records (id, message, normalized, hash, time) VALUES (?, ?, ?, ?, ?)`,
          [id, data.message, normalized, hash, time],
          (err) => {
            if (err) {
              res.writeHead(500);
              return res.end(JSON.stringify({ error: "DB insert failed" }) + "\n");
            }

            const link = `http://${req.headers.host}/proof.html?id=${id}`;

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              id,
              message: data.message,
              decision,
              hash,
              signature,
              time,
              link
            }) + "\n");
          }
        );

      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.toString() }) + "\n");
      }
    });

  }

  else if (req.method === 'GET' && req.url.startsWith('/proof')) {

    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id');

    db.get(`SELECT * FROM records WHERE id = ?`, [id], (err, record) => {

      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify({ error: "DB error" }) + "\n");
      }

      if (!record) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: "Not found" }) + "\n");
      }

      res.writeHead(200);
      res.end(JSON.stringify(record) + "\n");
    });

  }

  else {
    res.writeHead(404);
    res.end("Not Found");
  }

});

server.listen(PORT, () => {
  console.log("🚀 VERITAS FULL SYSTEM RUNNING");
});
