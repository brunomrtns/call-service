import { Router } from "express";
import axios from "axios";

const router = Router();

const ASTERISK_HOST = "192.168.15.176";
const ARI_HTTP_BASE = `http://${ASTERISK_HOST}:8088/asterisk/ari`;
const ARI_USER = "admin";
const ARI_PASS = "admin";

let endpointsCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5000;

router.get("/endpoints", async (req, res) => {
  try {
    const now = Date.now();

    if (endpointsCache && now - cacheTimestamp < CACHE_DURATION) {
      return res.json(endpointsCache);
    }

    const auth = Buffer.from(`${ARI_USER}:${ARI_PASS}`).toString("base64");

    const response = await axios.get(`${ARI_HTTP_BASE}/endpoints`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      timeout: 5000,
    });

    endpointsCache = response.data;
    cacheTimestamp = now;

    res.json(response.data);
  } catch (error: any) {
    console.error("Erro endpoints Asterisk:", error?.message);
    res.status(500).json({
      error: "Erro ao conectar com o Asterisk",
      message: error?.message || "Erro desconhecido",
    });
  }
});

router.get("/*", async (req, res) => {
  try {
    const auth = Buffer.from(`${ARI_USER}:${ARI_PASS}`).toString("base64");
    const path = req.path;

    const response = await axios.get(`${ARI_HTTP_BASE}${path}`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      timeout: 5000,
    });

    res.json(response.data);
  } catch (error: any) {
    console.error(`Erro ao acessar ${req.path}:`, error?.message || error);
    res.status(500).json({
      error: "Erro ao conectar com o Asterisk",
      message: error?.message || "Erro desconhecido",
    });
  }
});

export default router;
