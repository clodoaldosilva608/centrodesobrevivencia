/**
 * API: Importar produtos de lista do Mercado Livre usando Chromium headless
 * 
 * Usa @sparticuz/chromium + puppeteer-core para renderizar a página do ML
 * e extrair TODOS os produtos (incluindo os carregados via JavaScript).
 */

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url: inputUrl } = req.body || {};
  if (!inputUrl) return res.status(400).json({ error: 'URL é obrigatória' });

  let browser = null;
  try {
    console.log('[import-ml] Iniciando chromium...');
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });

    // Passo 1: Resolver short URL se necessário
    let finalUrl = inputUrl;
    if (inputUrl.includes('meli.la')) {
      console.log('[import-ml] Resolvendo short URL...');
      try {
        const resp = await page.goto(inputUrl, { waitUntil: 'networkidle0', timeout: 15000 });
        // Seguir redirect manualmente
        const redirectResp = await page.goto(inputUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        finalUrl = page.url();
        console.log('[import-ml] URL final:', finalUrl);
      } catch (e) {
        // Tentar resolver via fetch simples
        const r = await fetch(inputUrl, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (r.status === 301 || r.status === 302) {
          finalUrl = r.headers.get('location') || inputUrl;
        }
      }
    }

    // Passo 2: Abrir página final e esperar carregar
    console.log('[import-ml] Abrindo página:', finalUrl);
    await page.goto(finalUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Passo 3: Scroll para carregar todos os produtos (lazy loading)
    console.log('[import-ml] Fazendo scroll para carregar produtos...');
    let prevCount = 0;
    for (let i = 0; i < 30; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await page.waitForTimeout(1500);
      const count = await page.evaluate(() => 
        document.querySelectorAll('img[alt]').length
      );
      console.log(`[import-ml] Scroll ${i+1}: ${count} imagens`);
      if (count === prevCount && i > 2) break;
      prevCount = count;
    }

    // Passo 4: Voltar ao topo
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Passo 5: Extrair TODOS os produtos da página renderizada
    console.log('[import-ml] Extraindo produtos...');
    const products = await page.evaluate((skipAlts) => {
      const results = [];
      const seen = new Set();
      
      // Buscar todos os links que contêm /p/MLB
      const links = Array.from(document.querySelectorAll('a[href*="/p/MLB"]'));
      
      // Buscar todas as imagens com alt text
      const imgs = Array.from(document.querySelectorAll('img[alt]'));
      
      // Para cada link de produto, buscar a imagem mais próxima
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const img = link.querySelector('img') || null;
        const alt = img?.getAttribute('alt') || '';
        const src = img?.getAttribute('src') || img?.getAttribute('data-src') || '';
        
        // Pular imagens de navegação
        if (alt.length < 5) continue;
        if (skipAlts.some(s => alt.toLowerCase().includes(s))) continue;
        
        // Decodificar entidades HTML
        const title = alt
          .replace(/&#x27;/g, "'")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"');
        
        // Criar slug
        const slug = title.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 80);
        
        if (seen.has(slug)) continue;
        seen.add(slug);
        
        results.push({
          title,
          price: '',
          image: src,
          url: href.split('?')[0],
          buyLink: href,
          affiliateNetwork: 'mercadolivre',
          slug,
        });
      }
      
      // Se não encontramos via links, tentar via imagens
      if (results.length === 0) {
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
          
          results.push({
            title,
            price: '',
            image: src,
            url: '',
            buyLink: '',
            affiliateNetwork: 'mercadolivre',
            slug,
          });
        }
      }
      
      return results;
    }, ['logo', 'streaming', 'banner', 'icone', 'navigation', 'footer', 'mercado', 'categoria', 'avatar', 'search', 'perfil', 'oferta']);

    console.log('[import-ml] Produtos extraídos:', products.length);

    // Passo 6: Categorizar produtos
    const categorized = products.map(p => ({
      ...p,
      category: guessCategory(p.title),
    }));

    return res.status(200).json({
      success: true,
      sourceUrl: finalUrl,
      productsCount: categorized.length,
      products: categorized,
    });
  } catch (error) {
    console.error('[import-ml] Erro:', error.message);
    return res.status(500).json({ error: 'Erro ao importar produtos', detail: error.message });
  } finally {
    if (browser) await browser.close();
  }
}

function guessCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('barraca') || t.includes('tenda')) return 'Barracas e Abrigos';
  if (t.includes('cadeira') || t.includes('mesa')) return 'Móveis de Camping';
  if (t.includes('fogareiro') || t.includes('fogão') || t.includes('cozinha')) return 'Cozinha de Campo';
  if (t.includes('lanterna') || t.includes('lampião') || t.includes('lâmpada') || t.includes('led')) return 'Iluminação';
  if (t.includes('colchão') || t.includes('saco de dormir') || t.includes('travesseiro')) return 'Conforto e Sono';
  if (t.includes('canivete') || t.includes('faca') || t.includes('machado')) return 'Ferramentas';
  if (t.includes('bússola') || t.includes('gps') || t.includes('navega')) return 'Navegação';
  if (t.includes('mochila') || t.includes('bolsa')) return 'Móveis de Camping';
  if (t.includes('água') || t.includes('filtro') || t.includes('purif')) return 'Purificação de Água';
  return 'Equipamentos de Camping';
}
