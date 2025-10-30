import express from "express";
import { PaapiClient, SearchItemsRequest } from "paapi5-nodejs-sdk";

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar cliente PA API
const client = new PaapiClient({
  accessKey: process.env.AWS_ACCESS_KEY,
  secretKey: process.env.AWS_SECRET_KEY,
  partnerTag: process.env.ASSOCIATE_TAG,
  region: "eu-west-1", // Europa
  marketplace: "www.amazon.es",
});

app.get("/", (req, res) => {
  res.send(
    "✅ API de Amazon PA activa. Usa /apisearch?q=tu_busqueda para obtener productos."
  );
});

app.get("/apisearch", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Falta el parámetro q" });

  try {
    const request = new SearchItemsRequest({
      Keywords: query,
      SearchIndex: "All",
      ItemCount: 10,
      Resources: [
        "ItemInfo.Title",
        "Images.Primary.Large",
        "Offers.Listings.Price",
        "DetailPageURL",
      ],
    });

    const response = await client.searchItems(request);

    if (!response.ItemsResult || !response.ItemsResult.Items.length)
      return res.status(404).json({ message: "No se encontraron productos." });

    const productos = response.ItemsResult.Items.map((item) => ({
      titulo: item.ItemInfo?.Title?.DisplayValue || "Sin título",
      imagen: item.Images?.Primary?.Large?.URL || null,
      precio:
        item.Offers?.Listings?.[0]?.Price?.DisplayAmount || "Precio no disponible",
      link: item.DetailPageURL || null,
    }));

    res.json(productos);
  } catch (error) {
    console.error("❌ Error PA API:", error);
    res.status(500).json({ error: "Error al obtener productos de Amazon." });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
);
