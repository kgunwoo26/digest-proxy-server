import express from "express";
import DigestClient from "digest-fetch";
import cors from "cors";
import dotenv from "dotenv";
import net from "net";
import os from "os";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 어댑터의 IP 주소와 포트 번호 확인 (보통 기본 포트는 23 또는 10001)

const client = new DigestClient(process.env.ROBOT_USER, process.env.ROBOT_PASS);

// 내 IP 확인 함수
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

// 로봇 API 프록시
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

    console.log("로봇 요청:", req.body);
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Digest 요청 실패" });
  }
});

// 바코드 스캔 요청
app.post("/api/barcode", async (req, res) => {
  try {
    const sensor = new net.Socket();

    sensor.connect(3000, "192.168.125.3", () => {
      console.log("✅ 센서 연결됨");
      sensor.write("LON\r"); // 명령 전송
    });

    sensor.once("data", (data) => {
      const result = data.toString().trim();
      console.log("📥 판단 결과:", result);
      res.status(200).json({ barcode: result });
      sensor.destroy();
    });

    sensor.once("error", (err) => {
      console.error("❌ 센서 연결 오류:", err.message);
      res.status(500).json({ error: "센서 연결 실패" });
    });

    sensor.once("close", () => {
      console.log("🔌 센서 연결 종료");
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Barcode 스캔 요청 실패" });
  }
});

// 무게 측정 요청
app.post("/api/barcode", async (req, res) => {
  try {
    const HOST = `${process.env.SCALE_IP}`; // 어댑터 IP 주소
    const PORT = `${process.env.SCALE_PORT}`; // 어댑터 포트 번호
    const sensor = new net.Socket();

    sensor.connect(PORT, HOST, () => {
      console.log(`✅ 저울에 연결됨: ${HOST}:${PORT}`);

      // 예: 계량값 1회 요청 커맨드 (문서에서 S)
      sensor.write("S\r\n");
    });

    // 응답 받기
    sensor.on("data", (data) => {
      const result = data.toString().trim();
      console.log("📥 응답:", data.toString());
      res.status(200).json({ weight: result });
    });

    // 연결 종료 시
    sensor.on("close", () => {
      console.log("🔌 연결 종료됨");
    });

    // 에러 처리
    sensor.on("error", (err) => {
      console.error("❌ 통신 에러:", err.message);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Barcode 스캔 요청 실패" });
  }
});

// 서버 시작
app.listen(process.env.PORT, () => {
  console.log(`Digest Proxy Server listening on port ${process.env.PORT}`);
});
