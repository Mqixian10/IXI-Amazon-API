// --- IXI Amazon API Backend ---
// Este servidor actúa como intermediario entre tu web en Hostinger y la API de Amazon
// Nunca pongas tus claves directamente en el HTML, solo aquí

import express from "express";
import axios from "axios";
import aws4 from "aws4";

const app = express();
const PORT = process.env.PORT || 3000;

// Las claves se pondrán como variables de entorno (Render te deja hacerlo fácilmente)
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
const ASSOCIATE_TAG = "ufc0d-21"; // tu store ID
const REGION = "eu-west-1"; // Cambia si estás en otro país (por ejemplo: us-east-1, ca-central-1...)

app.get("/api/creatinas", async (req, res) => {
  const options = {
    host: "webservices.amazon.es",
    path: "/paapi5/searchitems",
    service: "ProductAdvertisingAPI",
    region: REGION,
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      Keywords: "creatina",
      SearchIndex: "HealthPersonalCare",
      ItemCount: 10,
      Resources: [
        "Images.Primary.Medium",
        "ItemInfo.Title",
        "ItemInfo.Features",
        "Offers.Listings.Price",
        "CustomerReviews.Count",
        "CustomerReviews.StarRating"
      ],
      PartnerTag: ASSOCIATE_TAG,
      PartnerType: "Associates",
      Marketplace: "www.amazon.es"
    }),
  };

  // Firma la solicitud con tus claves de Amazon
  aws4.sign(options, { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY });

  try {
    const response = await axios.post(
      `https://${options.host}${options.path}`,
      options.body,
      { headers: options.headers }
    );
    res.json(response.data);
  } catch (err) {
    console.error("Error al obtener productos:", err.message);
    res.status(500).json({ error: "No se pudieron obtener los datos de Amazon" });
  }
});

app.listen(PORT, () => console.log(`Servidor IXI Amazon API en puerto ${PORT}`));
