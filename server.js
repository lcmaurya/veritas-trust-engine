const http = require('http');
const {run} = require('./combine');

const PORT = process.env.PORT || 4000;
const API_KEY = "mysecret123";

// 🔥 storage
const proofs = {};
const history = [];

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
  });
}

function uid() {
  return Math.random().toString(36).substring(2, 10);
}

const server = http.createServer(async (req, res) => {

  // ===== GENERATE =====
  if (req.method === 'POST' && req.url === '/generate') {

    const key = req.headers['x-api-key'];
    if (key !== API_KEY) {
      res.writeHead(403);
      return res.end(JSON.stringify({error:"Forbidden"}));
    }

    const data = JSON.parse(await getBody(req));
    const result = await run(data.name, data.dob, data.message);

    const id = uid();

    const proof = {
      id,
      message: data.message,
      hash: result.decision_hash,
      signature: result.decision_signature,
      block: result.block.index,
      time: Date.now()
    };

    proofs[id] = proof;
    history.unshift(proof);

    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({
      ...proof,
      link: "https://veritasengine.in/proof.html?id=" + id
    }));
  }

  // ===== GET PROOF =====
  if (req.method === 'GET' && req.url.startsWith('/proof')) {

    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id');

    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify(proofs[id] || {}));
  }

  // ===== HISTORY =====
  if (req.method === 'GET' && req.url === '/history') {
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify(history.slice(0,10)));
  }

  // ===== DASHBOARD =====
  if (req.method === 'GET' && req.url === '/stats') {

    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({
      total: history.length,
      latestBlock: history[0]?.block || 0
    }));
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log("🚀 Dashboard server running");
});