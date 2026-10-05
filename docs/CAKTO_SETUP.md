# Configuração do Pagamento Cakto

Este documento descreve como configurar o sistema de pagamentos PIX integrado com a **Cakto** no Centro de Sobrevivência.

## 📋 Pré-requisitos

1. Conta na [Cakto](https://cakto.com.br) aprovada
2. Acesso ao dashboard da Cakto para gerar API Key
3. Acesso ao Vercel (para configurar variáveis de ambiente)
4. Acesso ao Supabase (para configurar RPCs já criadas nesta migration)

## 🚀 Setup em 6 passos

### Passo 1: Migration SQL (já executada ✅)

A migration já foi rodada via Supabase Management API. Confirme acessando o Table Editor do Supabase — deve haver:

- `course_prices` (11 registros com preço R$ 97 default)
- `course_purchases` (vazia)
- `app_settings` (com `courses_landing_status = coming_soon`)

RPCs disponíveis:
- `is_course_paid(p_course_id text)` — verifica se user atual pagou
- `auto_enroll_after_payment(p_user_id uuid, p_course_id text)` — cria matrícula após pagamento

### Passo 2: Criar API Key na Cakto

1. Acesse https://dashboard.cakto.com.br
2. Vá em **API** ou **Integrações** (dependendo do layout atual)
3. Gere uma nova chave de API (sandbox para testes, produção para real)
4. Copie:
   - **API Key** (Bearer token)
   - **Webhook Secret** (se disponível)

### Passo 3: Configurar variáveis de ambiente no Vercel

Acesse https://vercel.com/clodoaldo608-gmailcoms-projects/centrodesobrevivencia/settings/environment-variables e adicione:

| Variável | Valor | Ambiente |
|----------|-------|----------|
| `CAKTO_API_KEY` | `<sua api key da Cakto>` | Production (e Preview se quiser testar) |
| `CAKTO_API_URL` | `https://api.cakto.com.br/v1` | Production |
| `CAKTO_WEBHOOK_SECRET` | `<seu webhook secret>` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `<service role do Supabase>` | Production |
| `APP_URL` | `https://centrodesobrevivencia.vercel.app` | Production |

⚠️ **IMPORTANTE**: `SUPABASE_SERVICE_ROLE_KEY` NÃO pode ir para o front-end. Está OK em variável de ambiente do Vercel (serverless functions têm acesso).

Para obter a `SUPABASE_SERVICE_ROLE_KEY`:
1. Acesse https://supabase.com/project/mbterwktxczsyevcudoz/settings/api
2. Role até "service_role secret" (não exposta em código do cliente)
3. **Reveal** e copie

### Passo 4: Configurar Webhook na Cakto

Na dashboard da Cakto, vá em Webhooks e cadastre:

- **URL**: `https://centrodesobrevivencia.vercel.app/api/cakto-webhook`
- **Eventos** (se disponível):
  - `payment.paid`
  - `payment.expired`
  - `payment.refunded`
- **Secret** (se Cakto suportar): o mesmo valor de `CAKTO_WEBHOOK_SECRET`

### Passo 5: Ativar matrículas

No Admin → Cursos → card "Status da landing page" → clique **Ativar matrículas**.

A landing page muda de "Em breve" (âmbar) para "Matrículas abertas" (esmeralda).

### Passo 6: Testar o fluxo completo

1. Faça login como usuário comum
2. Acesse `/cursos/essencial-sobrevivencia`
3. Clique **Comprar — R$ 97,00**
4. Modal abre com:
   - QR Code PIX (imagem)
   - Código "copia e cola"
   - Botão "Abrir página de pagamento" (fallback)
   - Status: "Aguardando confirmação..."
5. Pague o PIX (no banco de testes da Cakto)
6. Webhook é disparado → `/api/cakto-webhook` recebe → atualiza status → cria matrícula
7. Modal atualiza automaticamente (polling 10s) → "Pagamento confirmado!"
8. Feche o modal → o player de vídeo aparece

## 🔍 Endpoints disponíveis

### POST /api/cakto-payment
Cria cobrança PIX. Requer JWT Supabase no header `Authorization: Bearer <token>`.

**Request**:
```json
{ "course_id": "essencial-sobrevivencia" }
```

**Response 200**:
```json
{
  "purchase_id": "uuid",
  "charge_id": "cakto_charge_id",
  "amount_cents": 9700,
  "currency": "BRL",
  "pix_qr_code": "00020126...",
  "pix_qr_image": "https://...",
  "payment_url": "https://...",
  "expires_at": "2025-01-15T11:00:00Z",
  "status": "pending"
}
```

### POST /api/cakto-webhook
Recebe notificações da Cakto. Verifica assinatura HMAC (se `CAKTO_WEBHOOK_SECRET` configurado).

Estrutura esperada do payload (pode variar — ajustar conforme documentação Cakto):
```json
{
  "id": "charge_xxx",
  "external_reference": "user_id:course_id",
  "status": "paid",
  "amount": 9700,
  "paid_at": "2025-01-15T10:30:00Z"
}
```

Ações tomadas:
1. Identifica compra por `cakto_charge_id` ou `external_reference`
2. Atualiza status (`pending` → `paid`/`expired`/`refunded`)
3. Se `paid`: chama RPC `auto_enroll_after_payment` que cria matrícula em `course_enrollments`

## 📊 Painel Admin

Acesse `/admin` → clique **Cursos** no sidebar. 5 tabs disponíveis:

1. **Lições** — CRUD de vídeo URLs por curso
2. **Matrículas** — lista de matrículas existentes
3. **Preços** (NOVO) — CRUD de preços por curso (R$, promo, ativo/inativo)
4. **Compras** (NOVO) — histórico de compras (cliente, curso, valor, status, pago em)
5. **Canais** (NOVO) — mostra nome do canal YouTube por lição (preenchido via oEmbed)

## 🛡️ Segurança

- **API Key (Cakto)** nunca é exposta no front-end — apenas em variável de ambiente do Vercel
- **Service Role Key (Supabase)** idem — nunca vai para o bundle JS
- **RLS ativa** em todas as tabelas:
  - `course_prices`: leitura pública, escrita só admin
  - `course_purchases`: leitura própria/admin, insert próprio, update só admin
- **Webhook signature**: se `CAKTO_WEBHOOK_SECRET` configurado, valida HMAC SHA256 em `x-cakto-signature` header

## 🐛 Troubleshooting

### "CAKTO_API_KEY não configurado"
Variável de ambiente não foi criada no Vercel. Volte ao Passo 3.

### "Erro ao criar cobrança no Cakto" (HTTP 502)
Cakto retornou erro. Verifique:
1. API Key válida (não expirada)
2. URL base correta (`CAKTO_API_URL`)
3. Formato do body (pode variar entre versões da API)
4. Logs da serverless function: `vercel logs <url-da-function>`

### Compra fica "pending" para sempre
Webhook não foi disparado pela Cakto. Verifique:
1. URL webhook correta na dashboard Cakto
2. Variável `APP_URL` no Vercel está correta (sem barra final)
3. Teste webhook manualmente via curl:
   ```bash
   curl -X POST https://centrodesobrevivencia.vercel.app/api/cakto-webhook \
     -H "Content-Type: application/json" \
     -d '{"id":"<charge_id>","external_reference":"<user_id>:<course_id>","status":"paid","amount":9700}'
   ```

### Vídeo não aparece após pagamento
Pode ser cache do estado. Recarregue a página (F5). Se persistir:
1. Verifique em Admin → Cursos → Compras que o status é `paid`
2. Verifique em Admin → Cursos → Matrículas que o registro existe
3. Force reload do hook chamando `/perfil/meus-cursos` e voltando

## 🔐 Revogação

Se precisar revogar API Key ou Service Role:
1. Gere nova no Cakto/Supabase
2. Atualize variável no Vercel
3. Redeploy (automático ao salvar variável)
4. Antiga para de funcionar imediatamente
