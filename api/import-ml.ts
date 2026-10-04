/**
 * API: Importar produtos de lista do Mercado Livre
 * 
 * Recebe um link curto (meli.la/xxx) ou URL completa do Mercado Livre,
 * resolve redirects, busca a página HTML, extrai produtos (título, preço,
 * imagem, URL) e retorna como JSON.
 * 
 * Uso: POST /api/import-ml
 * Body: { "url": "https://meli.la/1XCwh8E" }
 * Response: { "products": [{ title, price, image, url, buyLink }] }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url: inputUrl } = req.body || {};
  if (!inputUrl) return res.status(400).json({ error: 'URL é obrigatória' });

  try {
    // Passo 1: Resolver short URL
    let finalUrl = inputUrl;
    if (inputUrl.includes('meli.la')) {
      const redirectRes = await fetch(inputUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      });
      if (redirectRes.status === 301 || redirectRes.status === 302) {
        finalUrl = redirectRes.headers.get('location') || inputUrl;
      }
    }

    // Passo 2: Buscar HTML
    const pageRes = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
      },
    });
    const html = await pageRes.text();

    // Passo 3: Extrair produtos
    const products = extractProducts(html, finalUrl);

    return res.status(200).json({
      success: true,
      sourceUrl: finalUrl,
      productsCount: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao importar produtos', detail: error.message });
  }
}

/**
 * Extrai produtos do HTML usando múltiplos métodos:
 * 1. <img> com alt text (título do produto) + src (imagem)
 * 2. <a> com href para /p/MLB-xxx (URL do produto)
 * Combina os dois para obter título + imagem + URL.
 */
function extractProducts(html, baseUrl) {
  const products = [];
  const seen = new Set();

  // Método principal: buscar <img> com alt text de produto
  // Ignora imagens de navegação (logo, ícones, footer)
  const skipAlts = ['logo', 'streaming', 'banner', 'icone', 'ícone', 'navigation', 'footer', 'categorias', 'avatar'];
  
  const imgPattern = /<img[^>]*\s+alt="([^"]*)"[^>]*\s+src="(https?:\/\/http2\.mlstatic\.com\/[^"]*)"[^>]*\/?>/gi;
  // Também tentar src antes de alt
  const imgPattern2 = /<img[^>]*\s+src="(https?:\/\/http2\.mlstatic\.com\/[^"]*)"[^>]*\s+alt="([^"]*)"[^>]*\/?>/gi;
  
  const allImgs = [];
  
  let m;
  while ((m = imgPattern.exec(html)) !== null) {
    allImgs.push({ alt: m[1], src: m[2] });
  }
  while ((m = imgPattern2.exec(html)) !== null) {
    allImgs.push({ alt: m[2], src: m[1] });
  }

  // Buscar URLs de produtos (href com /p/MLB)
  const hrefPattern = /href="(https?:\/\/www\.mercadolivre\.com\.br\/[^"]*\/p\/MLB\d+[^"]*)"/gi;
  const hrefs = [];
  while ((m = hrefPattern.exec(html)) !== null) {
    hrefs.push(m[1].split('#')[0].split('?')[0]); // limpar query params
  }

  // Combinar imgs com hrefs (estão na mesma ordem na página)
  const maxLen = Math.max(allImgs.length, hrefs.length);
  for (let i = 0; i < maxLen; i++) {
    const img = allImgs[i];
    const href = hrefs[i];
    
    if (!img) continue;
    
    const alt = img.alt?.trim() || '';
    const src = img.src || '';
    
    // Pular imagens de navegação/footer
    if (skipAlts.some(s => alt.toLowerCase().includes(s))) continue;
    if (alt.length < 5) continue;
    
    // Decodificar entidades HTML (como &#x27; → ')
    const title = alt
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    
    // Extrair ID do produto da URL
    const mlbMatch = href?.match(/MLB(\d+)/);
    const mlbId = mlbMatch ? `MLB${mlbMatch[1]}` : '';
    
    // Slug do título
    const slug = title.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    
    // Deduplicar
    if (seen.has(slug)) continue;
    seen.add(slug);
    
    products.push({
      title,
      price: '',
      image: src,
      url: href || (mlbId ? `https://www.mercadolivre.com.br/p/${mlbId}` : ''),
      buyLink: href || baseUrl,
      affiliateNetwork: 'mercadolivre',
      category: guessCategory(title),
      mlbId,
      slug,
    });
  }

  return products;
}

/**
 * Tenta adivinhar a categoria do produto baseado no título.
 */
function guessCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('barraca') || t.includes('tenda')) return 'Barracas e Abrigos';
  if (t.includes('cadeira') || t.includes('mesa')) return 'Móveis de Camping';
  if (t.includes('fogareiro') || t.includes('fogão') || t.includes('cozinha')) return 'Cozinha de Campo';
  if (t.includes('lanterna') || t.includes('lampião') || t.includes('lâmpada') || t.includes('led')) return 'Iluminação';
  if (t.includes('colchão') || t.includes('saco de dormir') || t.includes('travesseiro')) return 'Conforto e Sono';
  if (t.includes('canivete') || t.includes('faca') || t.includes('machado')) return 'Ferramentas';
  if (t.includes('bússola') || t.includes('gps') || t.includes('navega')) return 'Navegação';
  if (t.includes('mochila') || t.includes('bolsa')) return 'Mochilas e Bags';
  if (t.includes('água') || t.includes('filtro') || t.includes('purif')) return 'Purificação de Água';
  return 'Equipamentos de Camping';
}
