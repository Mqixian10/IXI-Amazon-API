import express from "express";
import { default as AmazonPaApi } from "amazon-pa-api50";

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar cliente PA API
const client = new AmazonPaApi({
  accessKey: process.env.AWS_ACCESS_KEY,
  secretKey: process.env.AWS_SECRET_KEY,
  partnerTag: process.env.ASSOCIATE_TAG,
  marketplace: "www.amazon.es",
});

// Ruta raíz
app.get("/", (req, res) => {
  res.send(
    "✅ API de Amazon PA activa. Usa /apisearch?q=tu_busqueda para obtener productos."
  );
});

// Ruta de búsqueda
app.get("/apisearch", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Falta el parámetro q de búsqueda" });
  }

  try {
    // Buscar productos
    const response = await client.searchItems({
      Keywords: query,
      SearchIndex: "All",
      Resources: [
        "ItemInfo.Title",
        "ItemInfo.Features",
        "Images.Primary.Large",
        "Offers.Listings.Price",
        "DetailPageURL",
      ],
      ItemPage: 1,
    });

    if (!response.ItemsResult || !response.ItemsResult.Items.length) {
      return res.status(404).json({
        message: "No se encontraron productos para tu búsqueda.",
      });
    }

    // Formatear resultados
    const productos = response.ItemsResult.Items.map((item) => {
      const titulo = item.ItemInfo?.Title?.DisplayValue || "Sin título";
      const imagen = item.Images?.Primary?.Large?.URL || null;
      const precio =
        item.Offers?.Listings?.[0]?.Price?.DisplayAmount || "Precio no disponible";
      const link = item.DetailPageURL || null;
      return { titulo, imagen, precio, link };
    });

    res.json(productos.slice(0, 10));
  } catch (error) {
    console.error("❌ Error PA API:", error);
    res.status(500).json({ error: "Error al obtener productos de Amazon." });
  }
});

// Levantar servidor
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
