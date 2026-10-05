/**
 * /api/cakto-payment.js
 *
 * Cria uma cobrança PIX no Cakto para o curso informado.
 *
 * Body: { course_id }
 * Header: Authorization: Bearer <supabase JWT>
 *
 * Fluxo:
 *   1. Valida JWT do usuário (via Supabase auth.getUser)
 *   2. Busca preço do curso em course_prices
 *   3. Se já existe compra paga para este user+course, retorna erro
 *   4. Cria cobrança no Cakto via API REST
 *   5. Salva em course_purchases com status='pending'
 *   6. Retorna { charge_id, pix_qr_code, pix_qr_image, payment_url, expires_at }
 *
 * Variáveis de ambiente necessárias:
 *   - CAKTO_API_KEY: token do Cakto (Bearer)
 *   - CAKTO_API_URL: base URL (default https://api.cakto.com.br/v1)
 *   - SUPABASE_URL: https://<ref>.supabase.co
 *   - SUPABASE_ANON_KEY: anon key (pública)
 *   - SUPABASE_SERVICE_ROLE_KEY: service role (para escrever purchases)
 *   - APP_URL: URL pública do app (ex: https://centrodesobrevivencia.vercel.app)
 */
export default async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { course_id } = req.body || {};
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!course_id) return res.status(400).json({ error: 'course_id é obrigatório' });
    if (!token) return res.status(401).json({ error: 'Token de autorização ausente' });

    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mbterwktxczsyevcudoz.supabase.co';
    const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_ryJL0JbkpT8farKwPC_Mjw_Jiyx0N7M';
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const CAKTO_API_KEY = process.env.CAKTO_API_KEY;
    const CAKTO_API_URL = process.env.CAKTO_API_URL || 'https://api.cakto.com.br/v1';
    const APP_URL = process.env.APP_URL || 'https://centrodesobrevivencia.vercel.app';

    if (!SERVICE_ROLE) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurado' });
    }
    if (!CAKTO_API_KEY) {
      return res.status(500).json({ error: 'CAKTO_API_KEY não configurado. Configure no Vercel.' });
    }

    // === 1. Validar JWT do usuário ===
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Token inválido' });
    const user = await userRes.json();

    // === 2. Buscar perfil (nome) + preço do curso ===
    const [profileRes, priceRes, courseRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=full_name,email`, {
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
      }),
      fetch(`${SUPABASE_URL}/rest/v1/course_prices?course_id=eq.${course_id}&select=price_cents,promo_price_cents,currency,is_active`, {
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
      }),
      fetch(`${SUPABASE_URL}/rest/v1/course_purchases?user_id=eq.${user.id}&course_id=eq.${course_id}&status=eq.paid&select=id&limit=1`, {
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
      }),
    ]);
    const profile = (await profileRes.json())[0] || {};
    const priceData = (await priceRes.json())[0];
    const existingPaid = await courseRes.json();

    if (existingPaid && existingPaid.length > 0) {
      return res.status(409).json({ error: 'Você já comprou este curso', already_paid: true });
    }
    if (!priceData || !priceData.is_active) {
      return res.status(404).json({ error: 'Curso não está à venda' });
    }
    const amountCents = priceData.promo_price_cents ?? priceData.price_cents;
    if (amountCents <= 0) {
      return res.status(400).json({ error: 'Curso é gratuito — matricule direto' });
    }

    // === 3. Criar cobrança no Cakto ===
    const courseTitle = course_id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const webhookUrl = `${APP_URL}/api/cakto-webhook`;

    const caktoBody = {
      amount: amountCents,
      currency: 'BRL',
      payment_method: 'pix',
      description: `Curso: ${courseTitle}`,
      external_reference: `${user.id}:${course_id}`,
      webhook_url: webhookUrl,
      customer: {
        name: profile.full_name || (user.email ? user.email.split('@')[0] : 'Cliente'),
        email: user.email || profile.email,
      },
      metadata: { course_id, user_id: user.id, platform: 'centro-de-sobrevivencia' },
      success_url: `${APP_URL}/pagamento/sucesso?course_id=${course_id}`,
      failure_url: `${APP_URL}/cursos/${course_id}`,
    };

    const caktoRes = await fetch(`${CAKTO_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAKTO_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(caktoBody),
    });

    if (!caktoRes.ok) {
      const errText = await caktoRes.text();
      console.error('[cakto-payment] Cakto API error:', caktoRes.status, errText);
      return res.status(502).json({
        error: 'Erro ao criar cobrança no Cakto',
        details: errText.slice(0, 500),
      });
    }

    const caktoData = await caktoRes.json();
    const chargeId = caktoData.id || caktoData.charge_id || caktoData.transaction_id;
    const paymentUrl = caktoData.payment_url || caktoData.checkout_url || caktoData.payment?.payment_url;
    const pixQrCode = caktoData.pix_qr_code || caktoData.payment?.pix_qr_code || caktoData.qr_code;
    const pixQrImage = caktoData.pix_qr_image || caktoData.payment?.pix_qr_image || caktoData.qr_code_image;
    const expiresAt = caktoData.expires_at || caktoData.payment?.expires_at || caktoData.expiration_date;

    // === 4. Salvar em course_purchases ===
    const purchaseRes = await fetch(`${SUPABASE_URL}/rest/v1/course_purchases`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_id: user.id,
        course_id,
        amount_cents: amountCents,
        currency: priceData.currency || 'BRL',
        status: 'pending',
        cakto_charge_id: chargeId,
        cakto_payment_url: paymentUrl,
        cakto_pix_qr_code: pixQrCode,
        cakto_pix_qr_image: pixQrImage,
        cakto_raw_response: caktoData,
        customer_name: profile.full_name,
        customer_email: user.email,
        expires_at: expiresAt,
      }),
    });
    if (!purchaseRes.ok) {
      const err = await purchaseRes.text();
      console.error('[cakto-payment] DB insert error:', err);
      return res.status(500).json({ error: 'Erro ao salvar compra no banco', details: err.slice(0, 200) });
    }
    const purchase = (await purchaseRes.json())[0];

    // === 5. Retornar dados para o cliente ===
    return res.status(200).json({
      purchase_id: purchase.id,
      charge_id: chargeId,
      amount_cents: amountCents,
      currency: priceData.currency || 'BRL',
      pix_qr_code: pixQrCode,
      pix_qr_image: pixQrImage,
      payment_url: paymentUrl,
      expires_at: expiresAt,
      status: 'pending',
    });

  } catch (err) {
    console.error('[cakto-payment] Exception:', err);
    return res.status(500).json({ error: 'Erro interno', message: err.message });
  }
};

