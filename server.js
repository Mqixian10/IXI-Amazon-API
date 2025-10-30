import express from 'express';
import dotenv from 'dotenv';
import AmazonPaapi from 'amazon-paapi';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('API funcionando correctamente ✅'));
// === ENDPOINT PARA OBTENER LAS 10 MEJORES CREATINAS ===
// Este endpoint usará la API de Amazon para traer los productos
app.get('/api/creatinas', async (req, res) => {
  try {
    const commonParameters = {
      AccessKey: process.env.AMAZON_ACCESS_KEY,
      SecretKey: process.env.AMAZON_SECRET_KEY,
      PartnerTag: process.env.AMAZON_PARTNER_TAG,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.es'
    };

    const requestParameters = {
      Keywords: 'creatina',
      SearchIndex: 'HealthPersonalCare',
      ItemCount: 10,
      Resources: [
        'Images.Primary.Medium',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price',
        'CustomerReviews.Count',
        'CustomerReviews.StarRating'
      ]
    };

    const data = await AmazonPaapi.SearchItems(commonParameters, requestParameters);

    const productos = data.SearchResult.Items.map(item => ({
      titulo: item.ItemInfo.Title.DisplayValue,
      imagen: item.Images.Primary.Medium.URL,
      precio: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'No disponible',
      rating: item.CustomerReviews?.StarRating || 'N/A',
      link: item.DetailPageURL
    }));

    res.json(productos);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error al obtener los productos de Amazon' });
  }
});



app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
