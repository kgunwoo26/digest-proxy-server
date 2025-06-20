import express from "express";
import DigestClient from "digest-fetch";
import cors from "cors";
import dotenv from "dotenv";
import net from "net";

dotenv.config(); // 반드시 추가해야 .env 파일 읽힘

const app = express();
app.use(cors());
app.use(express.json());

const client = new DigestClient(process.env.ROBOT_USER, process.env.ROBOT_PASS);

const BarcodeSensor = new net.Socket();

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

app.post("/api/barcode", async (req, res) => {
  try {
    const { path, method = "GET", body } = req.body;

    console.log("요청 들어옴:", req.body);
    const text = await response.text();

    BarcodeSensor.connect(3000, "192.168.125.3", () => {
      console.log("✅ 센서 연결됨");
      BarcodeSensor.write("LON\r"); // ← 명령 자동 전송됨
    });

    BarcodeSensor.on("data", (data) => {
      console.log("📥 판단 결과:", data.toString());
      BarcodeSensor.destroy();
    });

    BarcodeSensor.on("error", (err) => {
      console.error("❌ 소켓 에러:", err.message);
    });

    res.status(200).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Barcode 스캔 요청 실패" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Digest Proxy Server listening on port ${process.env.PORT}`);
});

BarcodeSensor.on("close", () => {
  console.log("🔌 연결 종료");
});
