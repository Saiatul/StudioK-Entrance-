/**
 * StudioK local print bridge.
 *
 * The tablet PWA sends raw TSPL/ESC bytes here. A future Android companion
 * or Bluetooth SPP process should replace the write target without changing
 * the registration app.
 *
 * GET  /status -> { ok: true }
 * POST /print  -> application/octet-stream body of printer bytes
 *
 * Optional env:
 *   PRINT_BRIDGE_PORT=9100
 *   PRINT_BRIDGE_TCP=127.0.0.1:9101   (raw socket to a USB/network printer)
 */
import http from "node:http";
import net from "node:net";
import { Buffer } from "node:buffer";

const PORT = Number(process.env.PRINT_BRIDGE_PORT || 9100);
const TCP_TARGET = process.env.PRINT_BRIDGE_TCP || "";

function sendTcp(bytes) {
  const [host, port] = TCP_TARGET.split(":");
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: Number(port) }, () => {
      socket.write(bytes, (error) => {
        socket.end();
        if (error) reject(error);
        else resolve();
      });
    });
    socket.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, target: TCP_TARGET || "stdout" }));
    return;
  }

  if (req.method === "POST" && req.url === "/print") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);

    try {
      if (TCP_TARGET) {
        await sendTcp(bytes);
      } else {
        console.log(`Received print job: ${bytes.length} bytes`);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, bytes: bytes.length }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(error) }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`StudioK print bridge listening on http://127.0.0.1:${PORT}`);
});
