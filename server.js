import express from 'express';
import * as cheerio from 'cheerio'; // Corrección en importación
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/apisearch', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Falta el parámetro q de búsqueda" });
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    const searchUrl = `https://www.amazon.es/s?k=${encodeURIComponent(query)}`;

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    const $ = cheerio.load(html);

    const productos = [];

    $('.s-result-item').each((i, el) => {
      const titulo = $(el).find('h2 a span').text().trim();
      const imagen = $(el).find('img.s-image').attr('src');
      const precio = $(el).find('.a-price-whole').text().trim() || "Precio no disponible";
      const link = `https://www.amazon.es${$(el).find('h2 a').attr('href')}`;

      if (titulo && imagen && link) {
        productos.push({ titulo, imagen, precio, link });
      }
    });

    await browser.close();
    res.json(productos.slice(0,10));
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al scrapear Amazon' });
  }
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
