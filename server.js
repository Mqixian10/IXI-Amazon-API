// Importamos express para crear el servidor HTTP
import express from 'express';

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
  // Obtenemos el término de búsqueda
  const query = req.query.q;

  // Validación de parámetro requerido
  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro q de búsqueda' });
  }

  try {
    // Lanzamos Chromium con configuración optimizada para servidores
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(45000);

    // Construimos la URL de búsqueda
    const searchUrl = `https://www.amazon.es/s?k=${encodeURIComponent(query)}`;

    // Cargamos la página y esperamos el DOM
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

    // Obtenemos el HTML y lo cargamos en Cheerio
    const html = await page.content();
    const $ = cheerio.load(html);

    // Extraemos productos
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

    // Respondemos con máximo 10 resultados
    return res.json(productos.slice(0, 10));
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    return res.status(500).json({ error: 'Error al scrapear Amazon' });
  }
});

// Levantamos el servidor
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
