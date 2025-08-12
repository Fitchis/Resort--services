/* eslint-disable no-console */

async function json(res: Response) {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  const base = "http://localhost:3000";

  // Menu
  const menu = await json(
    await fetch(`${base}/api/menu`, { cache: "no-store" })
  );
  console.log(
    "menu.items",
    Array.isArray(menu) ? menu.length : Object.keys(menu).length
  );

  // Room validate
  const rv = await json(
    await fetch(`${base}/api/rooms/1201/validate`, { cache: "no-store" })
  );
  console.log("room 1201 ok", rv.ok);

  // Create order
  const orderCreate = await json(
    await fetch(`${base}/api/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        room_number: "1201",
        items: [{ menu_item_id: "pasta", quantity: 1, unit_price: 1800 }],
      }),
    })
  );
  console.log("created order id", orderCreate.id);

  // List orders
  const orders = await json(
    await fetch(`${base}/api/orders`, { cache: "no-store" })
  );
  console.log("orders count", Array.isArray(orders) ? orders.length : 0);

  // Get by id
  const order = await json(
    await fetch(`${base}/api/orders/${orderCreate.id}`, { cache: "no-store" })
  );
  console.log("order status", order.status);

  // Advance status
  await json(
    await fetch(`${base}/api/orders/${orderCreate.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "advance" }),
    })
  );
  const order2 = await json(
    await fetch(`${base}/api/orders/${orderCreate.id}`, { cache: "no-store" })
  );
  console.log("order status (after advance)", order2.status);

  // SSE headers sanity
  const sse = await fetch(`${base}/api/orders/stream`);
  console.log("sse content-type", sse.headers.get("content-type"));
  sse.body?.cancel();
}

main().catch((err) => {
  console.error("smoke failed:", err);
  process.exit(1);
});
