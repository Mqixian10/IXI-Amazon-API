// Importamos express para crear el servidor HTTP
import express from 'express';

// Importamos cheerio para parsear HTML (usamos import * as por compatibilidad con ESModules)
import * as cheerio from 'cheerio';

// Importamos chromium-min para obtener el ejecutable y configuraciones de Chromium optimizadas para servidores
import chromium from '@sparticuz/chromium-min';

// Importamos puppeteer-core para controlar el navegador Chromium
import puppeteer from 'puppeteer';

// Creamos la app de express
const app = express();

// Definimos el puerto que usaremos, lo tomamos de la variable de entorno PORT que usa Render, o 3000 por defecto
const PORT = process.env.PORT || 3000;

/**
 * Ruta raíz '/' para que al acceder sin parámetros se muestre un mensaje amigable
 * Así no sale error 404 cuando visitas https://tu-api/
 */
app.get('/', (req, res) => {
  res.send('API de scraping de productos Amazon activo. Usa /apisearch?q=tu_busqueda para obtener productos.');
});

/**
 * Ruta /apisearch que recibe el parámetro de consulta 'q' con el término a buscar en Amazon
 * Por ejemplo: /apisearch?q=proteina
 */
app.get('/apisearch', async (req, res) => {
  // Obtenemos el término de búsqueda de los query params
  const query = req.query.q;

  // Si no envían parámetro 'q', respondemos con error 400 (Bad Request)
  if (!query) {
    return res.status(400).json({ error: "Falta el parámetro q de búsqueda" });
  }

  try {
    // Usamos puppeteer para lanzar Chromium con configuración optimizada para servidores sin GUI (headless)
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ignoreHTTPSErrors: true,
    });

    // Abrimos una nueva pestaña en el navegador
    const page = await browser.newPage();

    // Construimos la URL de búsqueda en Amazon.es codificando el término para que sea URL-safe
    const searchUrl = `https://www.amazon.es/s?k=${encodeURIComponent(query)}`;

    // Navegamos a la URL y esperamos que se cargue el DOM para luego extraer HTML
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

    // Obtenemos el contenido HTML completo de la página
    const html = await page.content();

    // Cargamos el HTML en Cheerio para manipularlo y extraer datos usando selectores CSS similares a jQuery
    const $ = cheerio.load(html);

    // Array donde iremos guardando cada producto encontrado
    const productos = [];

    // Seleccionamos todos los elementos que tengan clase 's-result-item' (indicativo de producto)
    $('.s-result-item').each((i, el) => {
      // Extraemos el título del producto (texto dentro del selector correcto)
      const titulo = $(el).find('h2 a span').text().trim();

      // Extraemos la URL de la imagen del producto
      const imagen = $(el).find('img.s-image').attr('src');

      // Extraemos el precio, si no existe ponemos texto alternativo
      const precio = $(el).find('.a-price-whole').text().trim() || "Precio no disponible";

      // Extraemos el enlace completo al producto en Amazon concatenando dominio y ruta (href)
      const link = `https://www.amazon.es${$(el).find('h2 a').attr('href')}`;

      // Solo añadimos si tenemos los datos principales (esto evita productos vacíos)
      if (titulo && imagen && link) {
        productos.push({ titulo, imagen, precio, link });
      }
    });

    // Cerramos el navegador para liberar recursos
    await browser.close();

    // Respondemos con máximo 10 productos para no saturar el cliente
    res.json(productos.slice(0, 10));
  } catch (error) {
    // Si ocurre cualquier error, mostramos el error en consola para debug y respondemos con error 500
    console.error('❌ Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al scrapear Amazon' });
  }
});

// Levantamos el servidor escuchando en el puerto asignado y mostramos mensaje en consola
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
