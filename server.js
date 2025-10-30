// Importamos express para crear el servidor HTTP
import express from 'express';
const html = await page.content();
console.log(html.slice(0, 5000)); // Muestra los primeros 5000 caracteres
// Importamos cheerio para parsear HTML
import * as cheerio from 'cheerio';

// Usamos puppeteer-core junto con @sparticuz/chromium para entornos cloud
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Creamos la app de express
const app = express();

// Definimos el puerto (Render expone PORT)
const PORT = process.env.PORT || 3000;

/**
 * Ruta raíz
 */
app.get('/', (req, res) => {
  res.send('API de scraping de productos Amazon activo. Usa /apisearch?q=tu_busqueda para obtener productos.');
});

/**
 * Ruta /apisearch que recibe el parámetro 'q'
 * Ejemplo: /apisearch?q=proteina
 */
app.get('/apisearch', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Falta el parámetro q de búsqueda' });

  try {
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(45000);

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const searchUrl = `https://www.amazon.es/s?k=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.s-result-item h2 a span', { timeout: 10000 });

    const html = await page.content(); // 👈 aquí dentro
    const $ = cheerio.load(html);

    const productos = [];
    $('.s-result-item').each((i, el) => {
      const titulo = $(el).find('h2 a span').text().trim();
      const imagen = $(el).find('img.s-image').attr('src');
      const href = $(el).find('h2 a').attr('href');
      const link = href ? `https://www.amazon.es${href}` : null;
      const precio = $(el).find('.a-price-whole').text().trim() || 'Precio no disponible';

      if (titulo && imagen && link) {
        productos.push({ titulo, imagen, precio, link });
      }
    });

    await browser.close();
    return res.json(productos.slice(0, 10));
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    return res.status(500).json({ error: 'Error al scrapear Amazon' });
  }
});

// Levantamos el servidor
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
