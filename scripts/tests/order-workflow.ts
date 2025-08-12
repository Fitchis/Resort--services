import assert from "node:assert/strict"

type Status = "received" | "preparing" | "ready" | "delivered"
const flow: Status[] = ["received", "preparing", "ready", "delivered"]

function nextStatus(current: Status): Status {
  return flow[Math.min(flow.indexOf(current) + 1, flow.length - 1)]
}

// Unit tests
console.log("Testing order workflow...")
assert.equal(nextStatus("received"), "preparing")
assert.equal(nextStatus("preparing"), "ready")
assert.equal(nextStatus("ready"), "delivered")
assert.equal(nextStatus("delivered"), "delivered")
console.log("OK")
