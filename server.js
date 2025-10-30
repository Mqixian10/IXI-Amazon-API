import express from "express";
import puppeteer from "puppeteer";
import cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🚀 API de Amazon scraping funcionando correctamente ✅");
});

// === ENDPOINT GENERAL ===
// Ejemplo: /api/search?q=creatina
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Debes proporcionar un parámetro 'q' de búsqueda." });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    const searchUrl = `https://www.amazon.es/s?k=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

    const html = await page.content();
    const $ = cheerio.load(html);

    const productos = [];

    $(".s-result-item").each((_, el) => {
      const titulo = $(el).find("h2 a span").text().trim();
      const imagen = $(el).find("img.s-image").attr("src");
      const precio = $(el).find(".a-price-whole").text().trim();
      const link = "https://www.amazon.es" + $(el).find("h2 a").attr("href");

      if (titulo && imagen && link) {
        productos.push({
          titulo,
          imagen,
          precio: precio || "No disponible",
          link,
        });
      }
    });

    await browser.close();

    if (productos.length === 0) {
      return res.status(404).json({ error: "No se encontraron productos." });
    }

    res.json(productos.slice(0, 10)); // devuelve solo los primeros 10 resultados
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    res.status(500).json({ error: "Error al scrapear Amazon" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
