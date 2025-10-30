// Importamos express para crear el servidor HTTP REST
import express from 'express';

// Importamos cheerio para parsear HTML y extraer datos con sintaxis tipo jQuery
import cheerio from 'cheerio';

// Importamos el paquete chromium-min que nos da el path y args de Chromium optimizado para servidores
import chromium from '@sparticuz/chromium-min';

// Importamos puppeteer-core para controlar Chromium sin instalar un navegador completo
import puppeteer from 'puppeteer-core';

// Creamos una instancia de express para definir las rutas y manejar peticiones HTTP
const app = express();

// Definimos el puerto de escucha; usa la variable de entorno PORT o 3000 por defecto
const PORT = process.env.PORT || 3000;

// Definimos una ruta GET /apisearch que recibe parámetro q para buscar productos
app.get('/apisearch', async (req, res) => {
  // Guardamos la query de búsqueda enviada por el cliente
  const query = req.query.q;

  // Comprobamos que el parámetro q exista, si no mandamos error 400
  if (!query) return res.status(400).json({ error: "Falta el parámetro q de búsqueda" });

  try {
    // Lanzamos Chromium con configuración hecha para servidores sin interfaz gráfica (esto evita errores)
    const browser = await puppeteer.launch({
      args: chromium.args, // Args esenciales para el entorno serverless
      defaultViewport: chromium.defaultViewport, // Vista por defecto para evitar problemas visuales
      executablePath: await chromium.executablePath(), // Ruta al navegador Chromium (puede descargar si no existe)
      headless: chromium.headless, // Modo headless (sin interfaz)
    });

    // Abrimos una nueva pestaña
    const page = await browser.newPage();

    // Construimos la URL de búsqueda en Amazon.es codificando el término de búsqueda para la URL
    const searchUrl = `https://www.amazon.es/s?k=${encodeURIComponent(query)}`;

    // Navegamos a la URL y esperamos que se cargue el DOM para tener el HTML listo
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

    // Obtenemos el HTML completo de la página en un string
    const html = await page.content();

    // Cargamos el HTML en Cheerio para usar selectores CSS y extraer contenido
    const $ = cheerio.load(html);

    // Array donde guardaremos los productos encontrados
    const productos = [];

    // Seleccionamos cada resultado de producto usando clase CSS común en Amazon
    $('.s-result-item').each((i, el) => {
      // Extraemos título usando selector del título del producto
      const titulo = $(el).find('h2 a span').text().trim();

      // Extraemos la URL de la imagen
      const imagen = $(el).find('img.s-image').attr('src');

      // Extraemos el precio (parte entera) o ponemos texto alternativo si no hay precio
      const precio = $(el).find('.a-price-whole').text().trim() || "Precio no disponible";

      // Extraemos vínculo a Amazon concatenando ruta relativa con dominio
      const link = `https://www.amazon.es${$(el).find('h2 a').attr('href')}`;

      // Solo guardamos si tenemos título, imagen y link para evitar productos vacíos
      if (titulo && imagen && link) {
        productos.push({ titulo, imagen, precio, link });
      }
    });

    // Cerramos el navegador Chromium para liberar recursos
    await browser.close();

    // Respondemos con 10 primeros productos JSON para no saturar al cliente
    res.json(productos.slice(0, 10));
  } catch (error) {
    // Capturamos errores y los mostramos en consola para debug
    console.error('❌ Error al obtener productos:', error);

    // Respondemos error 500 con mensaje genérico
    res.status(500).json({ error: 'Error al scrapear Amazon' });
  }
});

// Arrancamos el servidor en el puerto configurado y mostramos mensaje en consola
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
