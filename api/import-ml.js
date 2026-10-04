const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const inputUrl = (req.body || {}).url;
  if (!inputUrl) return res.status(400).json({ error: 'URL é obrigatória' });

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });

    // Resolver short URL
    let finalUrl = inputUrl;
    if (inputUrl.includes('meli.la')) {
      try {
        const r = await fetch(inputUrl, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (r.status === 301 || r.status === 302) finalUrl = r.headers.get('location') || inputUrl;
      } catch (e) {}
    }

    // Abrir página
    await page.goto(finalUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Scroll para carregar todos os produtos
    let prevCount = 0;
    for (let i = 0; i < 30; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await new Promise(r => setTimeout(r, 1500));
      const count = await page.evaluate(() => document.querySelectorAll('img[alt]').length);
      console.log('Scroll ' + (i+1) + ': ' + count + ' imagens');
      if (count === prevCount && i > 2) break;
      prevCount = count;
    }

    // Voltar ao topo
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 500));

    // Extrair produtos
    const products = await page.evaluate(() => {
      const skipAlts = ['logo', 'streaming', 'banner', 'icone', 'navigation', 'footer', 'mercado', 'categoria', 'avatar', 'search', 'perfil', 'oferta'];
      const results = [];
      const seen = new Set();
      
      const links = Array.from(document.querySelectorAll('a[href*="/p/MLB"]'));
      
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const img = link.querySelector('img');
        const alt = (img && img.getAttribute('alt')) || '';
        const src = (img && (img.getAttribute('src') || img.getAttribute('data-src'))) || '';
        
        if (alt.length < 5) continue;
        if (skipAlts.some(s => alt.toLowerCase().includes(s))) continue;
        
        const title = alt.replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
        const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
        
        if (seen.has(slug)) continue;
        seen.add(slug);
        
        results.push({ title, price: '', image: src, url: href.split('?')[0], buyLink: href, affiliateNetwork: 'mercadolivre', slug });
      }
      
      if (results.length === 0) {
        const imgs = Array.from(document.querySelectorAll('img[alt]'));
        for (const img of imgs) {
          const alt = img.getAttribute('alt') || '';
          const src = img.getAttribute('src') || '';
          if (alt.length < 5) continue;
          if (skipAlts.some(s => alt.toLowerCase().includes(s))) continue;
          if (!src.includes('mlstatic.com')) continue;
          
          const title = alt.replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
          const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
          if (seen.has(slug)) continue;
          seen.add(slug);
          
          results.push({ title, price: '', image: src, url: '', buyLink: '', affiliateNetwork: 'mercadolivre', slug });
        }
      }
      
      return results;
    });

    // Categorizar
    const categorized = products.map(p => ({ ...p, category: guessCategory(p.title) }));

    return res.status(200).json({ success: true, sourceUrl: finalUrl, productsCount: categorized.length, products: categorized });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao importar produtos', detail: error.message });
  } finally {
    if (browser) await browser.close();
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
