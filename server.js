// ======================
// API de Scraping Amazon
// ======================

// Dependencias
import express from "express";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;

// Ruta raíz
app.get("/", (req, res) => {
  res.send(
    "✅ API de Amazon activa. Usa /apisearch?q=tu_busqueda para obtener productos."
  );
});

// Ruta /apisearch?q=
app.get("/apisearch", async (req, res) => {
  const query = req.query.q;
  if (!query)
    return res.status(400).json({ error: "Falta el parámetro q de búsqueda" });

  try {
    // Lanzar Chromium en cloud
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    // User-Agent realista
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/120.0.0.0 Safari/537.36"
    );

    // URL de búsqueda
    const searchUrl = `https://www.amazon.es/s?k=${encodeURIComponent(query)}`;

    // Ir a la página
    await page.goto(searchUrl, { waitUntil: "networkidle2" });

    // Obtener HTML completo (sin esperar selectores específicos)
    const html = await page.content();
    const $ = cheerio.load(html);

    const productos = [];
    $(".s-result-item").each((i, el) => {
      const titulo = $(el).find("h2 a span").text().trim();
      const imagen = $(el).find("img.s-image").attr("src");
      const href = $(el).find("h2 a").attr("href");
      const link = href ? `https://www.amazon.es${href}` : null;
      const precio =
        $(el).find(".a-price-whole").text().trim() || "Precio no disponible";

      if (titulo && imagen && link) {
        productos.push({ titulo, imagen, precio, link });
      }
    });

    await browser.close();

    // Mensaje si Amazon bloquea IP
    if (!productos.length) {
      return res.status(404).json({
        message:
          "No se encontraron productos. Amazon pudo bloquear la IP o no hay resultados.",
      });
    }

    res.json(productos.slice(0, 10));
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    res.status(500).json({ error: "Error al scrapear Amazon" });
  }
});

// Levantar servidor
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
