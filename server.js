// server.js

import express from "express";
// Eliminado: import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 10000;

// 👇 Ruta raíz para evitar el error "Cannot GET /"
app.get("/", (req, res) => {
  res.send("✅ API de IXI Amazon funcionando correctamente. Usa /api/creatinas para obtener los productos.");
});

// 👇 Endpoint principal: obtiene productos de Amazon (necesita tus credenciales)
app.get("/api/creatinas", async (req, res) => {
  try {
    const ACCESS_KEY = process.env.AMAZON_ACCESS_K EY;
    const SECRET_KEY = process.env.AMAZON_SECRET_KEY;
    const PARTNER_TAG = "ufc0d-21"; // tu storeID
    const REGION = "eu-west-1"; // Europa

    // 🔹 Esta es una llamada simulada de ejemplo (ya que la API de Amazon requiere firma)
    // Más abajo te explico cómo reemplazarla por datos reales
    const mockData = [
      {
        title: "Optimum Nutrition Creatine Monohydrate",
        image: "https://m.media-amazon.com/images/I/61p1fO7FhHL._AC_SL1500_.jpg",
        rating: 4.7,
        price: "€19.99",
        link: "https://www.amazon.es/dp/B002DYIZEO?tag=ufc0d-21"
      },
      {
        title: "MyProtein Creatina Monohidratada",
        image: "https://m.media-amazon.com/images/I/71Q8gkCwOUL._AC_SL1500_.jpg",
        rating: 4.6,
        price: "€17.49",
        link: "https://www.amazon.es/dp/B00T9H2J1S?tag=ufc0d-21"
      },
      {
        title: "Creapure Creatina Pura 500g",
        image: "https://m.media-amazon.com/images/I/61bqD5HVbiL._AC_SL1500_.jpg",
        rating: 4.8,
        price: "€24.90",
        link: "https://www.amazon.es/dp/B01LZ6RFS3?tag=ufc0d-21"
      }
    ];

    res.json(mockData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo productos" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
