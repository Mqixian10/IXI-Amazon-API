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

// === ENDPOINT PARA OBTENER LAS 10 MEJORES CREATINAS ===
// Este endpoint usará la API de Amazon para traer los productos
app.get('/api/creatinas', async (req, res) => {
  try {
    // Importa el módulo de Amazon Product Advertising API
    const AmazonPaapi = require('amazon-paapi');

    // Configura las credenciales desde variables de entorno (.env)
    const commonParameters = {
      AccessKey: process.env.AMAZON_ACCESS_KEY,
      SecretKey: process.env.AMAZON_SECRET_KEY,
      PartnerTag: process.env.AMAZON_PARTNER_TAG, // tu storeID: ufc0d-21
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.es'
    };

    // Parámetros de búsqueda
    const requestParameters = {
      Keywords: 'creatina',
      SearchIndex: 'HealthPersonalCare',
      ItemCount: 10,
      Resources: [
        'Images.Primary.Medium',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price',
        'CustomerReviews.Count',
        'CustomerReviews.StarRating'
      ]
    };

    // Llamada a la API
    const data = await AmazonPaapi.SearchItems(commonParameters, requestParameters);

    // Extraer los datos útiles
    const productos = data.SearchResult.Items.map(item => ({
      titulo: item.ItemInfo.Title.DisplayValue,
      imagen: item.Images.Primary.Medium.URL,
      precio: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'No disponible',
      rating: item.CustomerReviews?.StarRating || 'N/A',
      link: item.DetailPageURL
    }));

    res.json(productos);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error al obtener los productos de Amazon' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
