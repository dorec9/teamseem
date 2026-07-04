const http = require("http");
const fs = require("fs");

let payload = "";
try {
  payload = fs.readFileSync(0, "utf-8");
} catch (e) {}
if (!payload) payload = "{}";

const req = http.request(
  "http://localhost:3000/api/events",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  },
  (res) => {
    res.on("data", () => {});
    res.on("end", () => {
      process.stdout.write("{}");
      process.exit(0);
    });
  }
);

req.on("error", (e) => {
  process.stdout.write("{}");
  process.exit(0);
});

req.write(payload);
req.end();
