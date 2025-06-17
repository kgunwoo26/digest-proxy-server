import express from "express";
import DigestClient from "digest-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // 반드시 추가해야 .env 파일 읽힘

const app = express();
app.use(cors());
app.use(express.json());

const client = new DigestClient(process.env.ROBOT_USER, process.env.ROBOT_PASS);

import os from "os";

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "IP 찾을 수 없음";
}

console.log("📡 내 로컬 IP 주소:", getLocalIP());

app.post("/api/robot", async (req, res) => {
  try {
    const { path, method = "GET", body } = req.body;
    const url = `${process.env.ROBOT_URL}${path}`;

    const response = await client.fetch(url, {
      method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: method !== "GET" ? body : undefined,
    });
    console.log("요청 들어옴:", req.body);
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Digest 요청 실패" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Digest Proxy Server listening on port ${process.env.PORT}`);
});
