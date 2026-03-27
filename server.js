const http = require('http');
const {run} = require('./combine');

const PORT = process.env.PORT || 4000;
const API_KEY = "mysecret123";

// 🔥 In-memory store (demo purpose)
const proofs = {};

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

const server = http.createServer(async (req, res) => {

  // ===================== GENERATE =====================
  if (req.method === 'POST' && req.url === '/generate') {

    const key = req.headers['x-api-key'];
    if (key !== API_KEY) {
      res.writeHead(403);
      return res.end(JSON.stringify({error:"Forbidden"}));
    }

    const data = JSON.parse(await getBody(req));

    const result = await run(data.name, data.dob, data.message);

    const id = uid();

    proofs[id] = {
      message: data.message,
      hash: result.decision_hash,
      signature: result.decision_signature,
      block: result.block.index
    };

    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({
      id,
      link: "https://veritasengine.in/proof.html?id=" + id,
      ...proofs[id]
    }));
  }

  // ===================== GET PROOF =====================
  if (req.method === 'GET' && req.url.startsWith('/proof')) {

    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id');

    if (!proofs[id]) {
      res.writeHead(404);
      return res.end(JSON.stringify({error:"Not found"}));
    }

    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify(proofs[id]));
  }

  res.writeHead(404);
  res.end("Not Found");

});

server.listen(PORT, () => {
  console.log("🚀 Server running on " + PORT);
});