/**
 * API: Importar produtos de lista do Mercado Livre
 * 
 * Recebe um link curto (meli.la/xxx) ou URL completa do Mercado Livre,
 * resolve redirects, busca a página HTML, extrai produtos (título, preço,
 * imagem, URL) e retorna como JSON.
 * 
 * Uso: POST /api/import-ml
 * Body: { "url": "https://meli.la/1XCwh8E" }
 * Response: { "products": [{ title, price, image, url, category }] }
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url: inputUrl } = req.body || {};

  if (!inputUrl) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  try {
    // Passo 1: Resolver short URL (meli.la → mercadolivre.com.br)
    let finalUrl = inputUrl;
    
    if (inputUrl.includes('meli.la')) {
      console.log('[import-ml] Resolvendo short URL:', inputUrl);
      const redirectRes = await fetch(inputUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      });
      
      if (redirectRes.status === 301 || redirectRes.status === 302) {
        finalUrl = redirectRes.headers.get('location') || inputUrl;
        console.log('[import-ml] Redirect para:', finalUrl);
      }
    }

    // Passo 2: Buscar a página HTML
    console.log('[import-ml] Buscando página:', finalUrl);
    const pageRes = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
      },
    });

    const html = await pageRes.text();
    console.log('[import-ml] HTML length:', html.length);

    // Passo 3: Extrair produtos do HTML
    const products = extractProductsFromHTML(html, finalUrl);
    console.log('[import-ml] Produtos extraídos:', products.length);

    // Passo 4: Retornar
    return res.status(200).json({
      success: true,
      sourceUrl: finalUrl,
      productsCount: products.length,
      products,
    });

  } catch (error) {
    console.error('[import-ml] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro ao importar produtos',
      detail: error.message,
    });
  }
}

/**
 * Extrai produtos do HTML da página do Mercado Livre.
 * 
 * O ML usa React (SPA), mas o HTML inicial inclui:
 * - <img> tags com URLs de imagens de produtos (http2.mlstatic.com)
 * - Meta tags com títulos
 * - Links para produtos (mercadolivre.com.br/MLB-xxx)
 * - Dados JSON embutidos em <script> tags
 */
function extractProductsFromHTML(html, baseUrl) {
  const products = [];

  // Método 1: Procurar por links de produtos (MLB-xxx ou MLA-xxx)
  const productUrlPattern = /https?:\/\/(?:www\.)?mercadolivre\.com\.br\/(?:produto|p\/ML[AB]-\d+)/gi;
  const productUrls = [...new Set(html.match(productUrlPattern) || [])];

  // Método 2: Procurar por imagens de produtos (http2.mlstatic.com)
  const imagePattern = /https?:\/\/http2\.mlstatic\.com\/[A-Za-z0-9_-]+\.(?:jpg|webp)/gi;
  const images = [...new Set(html.match(imagePattern) || [])];

  // Método 3: Procurar por dados JSON em <script> tags
  const jsonPattern = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi;
  const jsonMatches = [];
  let match;
  while ((match = jsonPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data && typeof data === 'object') {
        jsonMatches.push(data);
      }
    } catch (e) {
      // Ignora JSON inválido
    }
  }

  // Método 4: Procurar por __NEXT_DATA__ (Next.js hydration)
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      // Navegar pela estrutura para encontrar produtos
      const pageProps = nextData?.props?.pageProps;
      if (pageProps) {
        // Procurar por arrays de produtos em várias possíveis localizações
        const possibleProductArrays = [
          pageProps?.list?.items,
          pageProps?.items,
          pageProps?.products,
          pageProps?.results,
          pageProps?.data?.items,
          pageProps?.data?.products,
        ];
        for (const arr of possibleProductArrays) {
          if (Array.isArray(arr)) {
            for (const item of arr) {
              const product = extractProductFromMLItem(item);
              if (product) products.push(product);
            }
          }
        }
      }
    } catch (e) {
      console.log('[import-ml] Erro ao parse __NEXT_DATA__:', e.message);
    }
  }

  // Método 5: Se não encontramos produtos via JSON, usar regex no HTML
  if (products.length === 0) {
    // Procurar por elementos com class "product" ou "item" que tenham título e preço
    const itemPattern = /<a[^>]*href="(https?:\/\/(?:www\.)?mercadolivre\.com\.br\/[^"]*ML[AB]-\d+[^"]*)"[^>]*>[\s\S]*?<img[^>]*src="(https?:\/\/http2\.mlstatic\.com\/[^"]*)"[^>]*>[\s\S]*?<\/a>/gi;
    
    let itemMatch;
    while ((itemMatch = itemPattern.exec(html)) !== null) {
      const url = itemMatch[1];
      const image = itemMatch[2];
      
      // Extrair título do contexto (próximo texto)
      const surroundingHtml = html.slice(Math.max(0, itemMatch.index - 500), itemMatch.index + 500);
      const titleMatch = surroundingHtml.match(/<h[2-4][^>]*>([^<]+)/);
      const priceMatch = surroundingHtml.match(/R\$\s*([\d.,]+)/);
      
      products.push({
        title: titleMatch ? titleMatch[1].trim() : 'Produto Mercado Livre',
        price: priceMatch ? `R$ ${priceMatch[1]}` : '',
        image: image,
        url: url,
        buyLink: url,
        affiliateNetwork: 'mercadolivre',
      });
    }
  }

  // Método 6: Se ainda não encontramos, usar as imagens como base
  if (products.length === 0 && images.length > 0) {
    for (const image of images.slice(0, 20)) {
      // Tentar extrair MLB ID da URL da imagem
      const mlbMatch = image.match(/ML[AB]-\d+/);
      const mlbId = mlbMatch ? mlbMatch[0] : '';
      
      products.push({
        title: `Produto ${mlbId || 'Mercado Livre'}`,
        price: '',
        image: image,
        url: mlbId ? `https://www.mercadolivre.com.br/MLB-${mlbId.match(/\d+/)?.[0]}` : '',
        buyLink: mlbId ? `https://www.mercadolivre.com.br/MLB-${mlbId.match(/\d+/)?.[0]}` : inputUrl,
        affiliateNetwork: 'mercadolivre',
      });
    }
  }

  // Deduplicar por URL
  const seen = new Set();
  const unique = products.filter(p => {
    const key = p.url || p.image;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
}

/**
 * Extrai dados de produto de um item da API do Mercado Livre.
 */
function extractProductFromMLItem(item) {
  if (!item || typeof item !== 'object') return null;

  // O ML usa várias estruturas dependendo do contexto
  const title = item.title || item.name || item.product_name;
  const price = item.price || item.amount || item.original_price;
  const image = item.thumbnail || item.image || item.picture?.url || item.pictures?.[0]?.url;
  const url = item.permalink || item.url || item.link || item.buy_url;
  const category = item.category_id || item.domain_id || '';

  if (!title && !image) return null;

  return {
    title: String(title || 'Produto'),
    price: price ? `R$ ${typeof price === 'number' ? price.toFixed(2).replace('.', ',') : price}` : '',
    image: image || '',
    url: url || '',
    buyLink: url || '',
    affiliateNetwork: 'mercadolivre',
    category: category || '',
  };
}
