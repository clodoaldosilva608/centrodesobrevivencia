/**
 * /api/cakto-webhook.js
 *
 * Recebe webhook do Cakto quando o status de uma cobrança muda.
 *
 * Quando o pagamento é confirmado:
 *   1. Identifica a compra via cakto_charge_id ou external_reference
 *   2. Atualiza course_purchases.status='paid', paid_at=now()
 *   3. Chama RPC auto_enroll_after_payment para criar matrícula
 *
 * Segurança:
 *   - Verifica assinatura HMAC (se Cakto fornecer header X-Cakto-Signature)
 *   - Fallback: aceita POST com JSON, mas idealmente configura secret no Cakto
 *
 * Variáveis de ambiente:
 *   - CAKTO_WEBHOOK_SECRET: segredo para validar assinatura
 *   - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 */
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mbterwktxczsyevcudoz.supabase.co';
    const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_ryJL0JbkpT8farKwPC_Mjw_Jiyx0N7M';
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const WEBHOOK_SECRET = process.env.CAKTO_WEBHOOK_SECRET;

    if (!SERVICE_ROLE) {
      console.error('[cakto-webhook] SUPABASE_SERVICE_ROLE_KEY não configurado');
      return res.status(500).json({ error: 'Server config error' });
    }

    // === Verificação de assinatura (se configurada) ===
    if (WEBHOOK_SECRET) {
      const sigHeader = req.headers['x-cakto-signature'] || req.headers['x-signature'] || '';
      const rawBody = JSON.stringify(req.body);
      const expectedSig = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      // Comparação em tempo constante
      const sigBuf = Buffer.from(sigHeader);
      const expBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.warn('[cakto-webhook] Assinatura inválida');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const payload = req.body || {};
    console.log('[cakto-webhook] Payload:', JSON.stringify(payload).slice(0, 500));

    // Estrutura esperada do webhook Cakto:
    // {
    //   "id": "charge_xxx",
    //   "external_reference": "user_id:course_id",
    //   "status": "paid",  // paid | expired | refunded
    //   "amount": 9700,
    //   "currency": "BRL",
    //   "payment_method": "pix",
    //   "paid_at": "2025-01-15T10:30:00Z"
    // }
    const chargeId = payload.id || payload.charge_id || payload.transaction_id;
    const externalRef = payload.external_reference || '';
    const status = (payload.status || '').toLowerCase();
    const paidAt = payload.paid_at || payload.paidAt || new Date().toISOString();

    if (!chargeId && !externalRef) {
      console.warn('[cakto-webhook] Sem chargeId nem external_reference');
      return res.status(400).json({ error: 'Missing charge identification' });
    }

    // === 1. Buscar a compra no banco ===
    const query = chargeId
      ? `cakto_charge_id=eq.${chargeId}`
      : `external_reference=eq.${externalRef}`;
    const findRes = await fetch(`${SUPABASE_URL}/rest/v1/course_purchases?${query}&select=*&limit=1`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${SERVICE_ROLE}` },
    });
    if (!findRes.ok) {
      console.error('[cakto-webhook] Erro buscando purchase:', await findRes.text());
      return res.status(500).json({ error: 'DB error' });
    }
    const purchases = await findRes.json();
    if (!purchases || purchases.length === 0) {
      console.warn('[cakto-webhook] Purchase não encontrada para charge:', chargeId);
      return res.status(404).json({ error: 'Purchase not found', chargeId });
    }
    const purchase = purchases[0];

    // === 2. Atualizar status ===
    let newStatus = 'pending';
    if (status === 'paid' || status === 'approved' || status === 'completed' || status === 'approved_payment') {
      newStatus = 'paid';
    } else if (status === 'expired' || status === 'failed') {
      newStatus = 'expired';
    } else if (status === 'refunded' || status === 'cancelled') {
      newStatus = status === 'refunded' ? 'refunded' : 'cancelled';
    } else {
      console.log('[cakto-webhook] Status não tratado:', status);
      return res.status(200).json({ received: true, ignored: true, status });
    }

    const updateBody = { status: newStatus };
    if (newStatus === 'paid') updateBody.paid_at = paidAt;

    const updRes = await fetch(`${SUPABASE_URL}/rest/v1/course_purchases?id=eq.${purchase.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(updateBody),
    });
    if (!updRes.ok) {
      console.error('[cakto-webhook] Erro update purchase:', await updRes.text());
      return res.status(500).json({ error: 'DB update error' });
    }

    // === 3. Auto-matricular se pago ===
    if (newStatus === 'paid') {
      const enrollRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/auto_enroll_after_payment`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_user_id: purchase.user_id,
          p_course_id: purchase.course_id,
        }),
      });
      if (!enrollRes.ok) {
        console.error('[cakto-webhook] Erro auto-enroll:', await enrollRes.text());
        // Continua — não bloqueia o webhook
      } else {
        console.log(`[cakto-webhook] ✅ User ${purchase.user_id.slice(0, 8)} matriculado em ${purchase.course_id}`);
      }
    }

    return res.status(200).json({
      received: true,
      purchase_id: purchase.id,
      status: newStatus,
    });

  } catch (err) {
    console.error('[cakto-webhook] Exception:', err);
    return res.status(500).json({ error: 'Internal error', message: err.message });
  }
};
