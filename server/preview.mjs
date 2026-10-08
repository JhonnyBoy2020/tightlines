import express from "express";
import { handler } from "./service.mjs";
const app = express();
app.use(express.text({ type: "*/*", limit: "2mb" }));
app.use("/api", async (req, res) => {
  const request = new Request(`http://${req.headers.host}/api${req.url}`, {
    method: req.method, headers: req.headers,
    ...(!["GET", "HEAD"].includes(req.method) ? { body: req.body || "" } : {}),
  });
  const result = await handler(request);
  res.status(result.status);
  result.headers.forEach((value, key) => res.setHeader(key, value));
  res.send(await result.text());
});
app.listen(5000, "0.0.0.0", () => console.log("Pocket Ghillie private preview API on 5000"));
