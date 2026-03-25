function generateProof(data, verifyResult) {

  return {
    status: verifyResult.valid ? "VERIFIED" : "TAMPERED",
    timestamp: Date.now(),
    data: data,
    proof: verifyResult.block || null
  };
}

module.exports = { generateProof };
