const express = require("express");
const DigestFetch = require("digest-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new DigestFetch(process.env.ROBOT_USER, process.env.ROBOT_PASS);

app.post("/api/robot", async (req, res) => {
  try {
    const { path, method = "GET", body } = req.body;
    const url = `${process.env.ROBOT_URL}${path}`;

    const response = await client.fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method !== "GET" ? JSON.stringify(body) : undefined,
    });

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
