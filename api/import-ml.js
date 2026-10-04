module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const inputUrl = (req.body || {}).url;
  if (!inputUrl) return res.status(400).json({ error: 'URL é obrigatória' });

  try {
    // Passo 1: Resolver short URL
    let finalUrl = inputUrl;
    if (inputUrl.includes('meli.la')) {
      const r = await fetch(inputUrl, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
      if (r.status === 301 || r.status === 302) finalUrl = r.headers.get('location') || inputUrl;
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

    // Passo 3: Extrair produtos do HTML
    const skipAlts = ['logo', 'streaming', 'banner', 'icone', 'navigation', 'footer', 'mercado', 'categoria', 'avatar', 'search', 'perfil', 'oferta'];
    const products = [];
    const seen = new Set();

    // Método: img com alt + src mlstatic
    const imgRegex = /<img[^>]*\s+alt="([^"]*)"[^>]*\s+src="(https?:\/\/http2\.mlstatic\.com\/[^"]*)"[^>]*\/?>/gi;
    const imgRegex2 = /<img[^>]*\s+src="(https?:\/\/http2\.mlstatic\.com\/[^"]*)"[^>]*\s+alt="([^"]*)"[^>]*\/?>/gi;

    // Buscar hrefs para produtos
    const hrefRegex = /href="(https?:\/\/www\.mercadolivre\.com\.br\/[^"]*\/p\/MLB\d+[^"]*)"/gi;
    const hrefs = [];
    let m;
    while ((m = hrefRegex.exec(html)) !== null) {
      hrefs.push(m[1].split('#')[0].split('?')[0]);
    }

    const allImgs = [];
    while ((m = imgRegex.exec(html)) !== null) allImgs.push({ alt: m[1], src: m[2] });
    while ((m = imgRegex2.exec(html)) !== null) allImgs.push({ alt: m[2], src: m[1] });

    const maxLen = Math.max(allImgs.length, hrefs.length);
    for (let i = 0; i < maxLen; i++) {
      const img = allImgs[i];
      if (!img) continue;
      const alt = (img.alt || '').trim();
      const src = img.src || '';
      if (alt.length < 5) continue;
      if (skipAlts.some(s => alt.toLowerCase().includes(s))) continue;

      const title = alt.replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
      const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
      if (seen.has(slug)) continue;
      seen.add(slug);

      const href = hrefs[i] || '';
      const mlbMatch = href.match(/MLB(\d+)/);
      const mlbId = mlbMatch ? 'MLB' + mlbMatch[1] : '';

      products.push({
        title, price: '', image: src,
        url: href || (mlbId ? 'https://www.mercadolivre.com.br/p/' + mlbId : ''),
        buyLink: href || finalUrl,
        affiliateNetwork: 'mercadolivre',
        category: guessCategory(title),
        mlbId, slug,
      });
    }

    return res.status(200).json({ success: true, sourceUrl: finalUrl, productsCount: products.length, products });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao importar', detail: error.message });
  }
};

function guessCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('barraca') || t.includes('tenda')) return 'Barracas e Abrigos';
  if (t.includes('cadeira') || t.includes('mesa')) return 'Móveis de Camping';
  if (t.includes('fogareiro') || t.includes('fogão') || t.includes('cozinha')) return 'Cozinha de Campo';
  if (t.includes('lanterna') || t.includes('lampião') || t.includes('lâmpada') || t.includes('led')) return 'Iluminação';
  if (t.includes('colchão') || t.includes('saco de dormir') || t.includes('travesseiro')) return 'Conforto e Sono';
  if (t.includes('canivete') || t.includes('faca') || t.includes('machado')) return 'Ferramentas';
  if (t.includes('bússola') || t.includes('gps')) return 'Navegação';
  if (t.includes('mochila') || t.includes('bolsa')) return 'Móveis de Camping';
  if (t.includes('água') || t.includes('filtro')) return 'Purificação de Água';
  return 'Equipamentos de Camping';
}
