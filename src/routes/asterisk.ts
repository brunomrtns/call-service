import { Router } from "express";
import axios from "axios";

const router = Router();

// Configurações do Asterisk
const ASTERISK_HOST = "192.168.15.176";
const ARI_HTTP_BASE = `http://${ASTERISK_HOST}:8088/asterisk/ari`;
const ARI_USER = "admin";
const ARI_PASS = "admin";

// Proxy para requisições ARI - evita problemas de CORS
router.get("/endpoints", async (req, res) => {
  try {
    const auth = Buffer.from(`${ARI_USER}:${ARI_PASS}`).toString('base64');
    
    const response = await axios.get(`${ARI_HTTP_BASE}/endpoints`, {
      headers: {
        'Authorization': `Basic ${auth}`
      },
      timeout: 5000
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Erro ao buscar endpoints do Asterisk:', error?.message || error);
    res.status(500).json({ 
      error: "Erro ao conectar com o Asterisk",
      message: error?.message || "Erro desconhecido" 
    });
  }
});

// Proxy genérico para outras rotas ARI se necessário
router.get("/*", async (req, res) => {
  try {
    const auth = Buffer.from(`${ARI_USER}:${ARI_PASS}`).toString('base64');
    const path = req.path;
    
    const response = await axios.get(`${ARI_HTTP_BASE}${path}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      },
      timeout: 5000
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error(`Erro ao acessar ${req.path}:`, error?.message || error);
    res.status(500).json({ 
      error: "Erro ao conectar com o Asterisk",
      message: error?.message || "Erro desconhecido" 
    });
  }
});

export default router;
