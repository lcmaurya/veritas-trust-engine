async function analyze() {

  const message = document.getElementById("msg").value;

  if (!message) {
    alert("Please enter message");
    return;
  }

  try {

    const res = await fetch("https://veritas-trust-engine.onrender.com/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "mysecret123"
      },
      body: JSON.stringify({
        name: "User",
        dob: "2000",
        message: message
      })
    });

    const data = await res.json();

    document.getElementById("result").innerHTML = `
      <p>Risk: ${data.risk}</p>
      <p>Decision Hash: ${data.decision_hash}</p>
      <p>Signature: ${data.decision_signature}</p>
      <p>Block: ${data.block.index}</p>
    `;

  } catch (err) {
    document.getElementById("result").innerHTML = "Error connecting to server";
  }
}
