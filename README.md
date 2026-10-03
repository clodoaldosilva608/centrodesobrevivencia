# 🏕️ Centro de Sobrevivência — Survival Hub

> Hub brasileiro de **bushcraft**, **sobrevivencialismo** e **aventura**.
> PWA offline-first com simuladores, mapa interativo, bússola tática, GIS, e-books, jogos e desafios gamificados — 100% em português do Brasil.

**Sobrevivência é conhecimento. Conhecimento é poder.**

---

## 📑 Sumário

- [Visão geral](#-visão-geral)
- [Funcionalidades principais](#-funcionalidades-principais)
- [Stack tecnológica](#-stack-tecnológica)
- [Estrutura do repositório](#-estrutura-do-repositório)
- [Pré-requisitos](#-pré-requisitos)
- [Como rodar localmente](#-como-rodar-localmente)
- [Scripts disponíveis](#-scripts-disponíveis)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Configuração de SEO e sitemap](#-configuração-de-seo-e-sitemap)
- [PWA, service worker e mapas offline](#-pwa-service-worker-e-mapas-offline)
- [Testes](#-testes)
- [CI/CD](#-cicd)
- [Roadmap](#-roadmap)
- [Como contribuir](#-como-contribuir)
- [Licença](#-licença)

---

## 🎯 Visão geral

O **Centro de Sobrevivência** é uma plataforma modular e expansível que reúne, em uma única PWA, tudo o que um aventureiro, sobrevivencialista, praticante de bushcraft ou entusiasta de preparação para situações extremas precisa:equipamentos táticos avaliados, biblioteca de e-books, jogos interativos, simuladores de cenários, mapa interativo com GPS e pontos de interesse, bússola tática com geolocalização, GIS tático com rotas e mapas offline, sistema de desafios semanais com XP e conquistas, painel administrativo, sistema de perfil e gamificação completo.

A aplicação foi projetada como uma **PWA offline-first**: uma vez carregada, a maior parte das funcionalidades continua disponível mesmo sem conexão — waypoints, rotas, mapas offline e configurações são persistidos localmente via `localStorage` e `IndexedDB`.

O projeto segue uma arquitetura modular orientada a features, com separação clara entre páginas, componentes, hooks, contexts, libs utilitárias e dados mockados — preparada para crescer e receber novos módulos (marketplace real, autenticação Supabase, sync em nuvem, etc.) sem refatoração pesada.

---

## 🚀 Funcionalidades principais

### Catálogo de conteúdo
- **Equipamentos**: 30 produtos táticos categorizados (mochilas, canivetes, lanternas, fogareiros, kits de primeiros socorros, bússolas, cordas, filtros de água, facas, barracas, sacos de dormir, fire starters, painéis solares, rádios de emergência, machados, binóculos, tarps, purificadores UV, GPS outdoor e muito mais), cada um com galeria, descrição completa, especificações, benefícios e link de compra.
- **E-books**: biblioteca com 20 títulos cobrindo selva, bushcraft para iniciantes, acampamento, água, primeiros socorros, fogo, abrigos, orientação, emergências urbanas, plantas comestíveis, nós e amarrações, inverno, caça e pesca, medicina natural, cartografia, mar, defesa pessoal, kit 72h, meteorologia, psicologia.
- **Jogos**: 9 jogos temáticos (simulador de floresta, construir abrigo, gerenciar recursos, explorar território, caça e coleta, puzzle, simulador de fogo, encontrar água, explorador de montanha, missão de sobrevivência).

### Simuladores interativos
- **Simulador de cenários** baseado em decisões com consequências em árvore (perder-se na floresta, falta de água, ferimentos, etc.).
- **Simulador de sobrevivência na floresta** dedicado com narrativa multi-estado e recursos limitados.

### Mapa, GIS e navegação
- **Mapa interativo de sobrevivência** com pontos de interesse por categoria (fontes de água, abrigos naturais, regiões perigosas, recursos naturais).
- **GIS Tático** (módulo protegido por login) com:
  - Marcadores arrastáveis, edição de rotas, reordenação por drag-and-drop, duplicação de pontos e rotas.
  - Importação/exportação em **GPX**, **KML** e **GeoJSON**.
  - Painel de elevação, perfil de rota e estimativa de tempo (regra de Naismith ajustável).
  - Mapas offline por área (desenho de retângulo, fila de download com pausar/retomar/cancelar, estimativa de tamanho, contagem de falhas, limpeza por região ou total).
  - HUD de navegação em tempo real (`watchPosition`): distância restante, próximo ponto, direção, ETA.
  - Ferramentas: medir distância, medir área, ir para coordenada (DD/MGRS), layer switcher, bússola HUD, leitura de coordenadas.
  - Módulo **S.O.S. e B.O.B.** (Bug-Out Bag): listas de itens com peso, quantidade, validade, anotações; modo S.O.S. em tela cheia com sinal Morse, lanterna estroboscópica, posição em DD/MGRS em letras grandes, compartilhamento por SMS/WhatsApp, anotações de emergência (tipo sanguíneo, alergias) e atalhos configuráveis (tecla, toque triplo, toque longo).
- **Bússola tática** com geolocalização, altitude, posição solar e declinação magnética.

### Gamificação e engajamento
- Sistema de **XP, níveis, medalhas e conquistas** (Explorador iniciante, Especialista em abrigo, Mestre da sobrevivência, etc.).
- **Desafios semanais** com dificuldade (Fácil, Médio, Difícil, Extremo) e XP por conclusão.
- **Streak diária** e missões diárias para retenção.
- **Notificações de engajamento** e de conquistas.
- **Comunidade** com ranking público.
- **Estatísticas** de progresso pessoal (jogos jogados, desafios completados, tempo de uso, etc.).

### PWA e UX
- Instalável como app (manifest + ícones 192/512).
- **Service worker** com fallback para página offline.
- **Banner de instalação PWA** customizado.
- **Splash screen** animada na primeira visita.
- **Onboarding tutorial** guiado.
- **Tema claro/escuro** persistido.
- **Sons** de feedback (ativáveis/desativáveis no perfil).
- **Compartilhamento e convite** via WhatsApp, Telegram, X ou Web Share API.
- Totalmente em **português do Brasil**.

### Administração
- **Painel admin** com gestão de produtos, e-books, jogos e desafios (CRUD sobre dados mockados — pronto para ser conectado a um backend real).

### Autenticação
- `AuthContext` local (`localStorage`) com login por e-mail ou Google simulado. O código já está estruturado para troca por Supabase Auth no futuro (`loginWithGoogle` e `loginWithEmail`).

---

## 🛠 Stack tecnológica

| Camada | Tecnologia |
|---|---|
| **Build** | Vite 5 (com `@vitejs/plugin-react-swc`) |
| **Linguagem** | TypeScript 5 |
| **UI** | React 18, React Router v6, Radix UI, shadcn/ui |
| **Estilo** | TailwindCSS 3 + `tailwindcss-animate` + `@tailwindcss/typography` |
| **Estado/Dados** | `@tanstack/react-query`, contexts + hooks customizados, `idb-keyval` (IndexedDB), `localStorage` |
| **Mapas** | Leaflet + `react-leaflet`, MGRS (`mgrs`), GIS utilities próprias |
| **Formulários** | React Hook Form + Zod + `@hookform/resolvers` |
| **Animação** | Framer Motion |
| **Gráficos** | Recharts |
| **Relatórios** | jsPDF (PDF de rotas), canvas para thumbnails |
| **SEO** | `react-helmet-async`, sitemap.xml dinâmico, JSON-LD, OG/Twitter cards |
| **Testes** | Vitest, Testing Library, Playwright |
| **CI/CD** | GitHub Actions (Lighthouse + SEO validation), `.lighthouserc.json` |
| **Runtime** | Node.js 18+ (recomendado 20+), npm |

---

## 📁 Estrutura do repositório

```
centrodesobrevivencia/
├── .github/
│   └── workflows/
│       └── seo-ci.yml            # CI: build + SEO validation + Lighthouse
├── .lighthouserc.json            # Configuração do Lighthouse CI
├── public/
│   ├── manifest.json
│   ├── sw.js                     # Service worker
│   ├── offline.html              # Fallback offline
│   ├── robots.txt
│   ├── sitemap.xml               # Gerado em build/dev
│   ├── llms.txt                  # Resumo para LLMs
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── favicon.ico
│   ├── og-default.jpg
│   └── placeholder.svg
├── scripts/
│   ├── generate-sitemap.ts       # Roda em predev/prebuild
│   └── validate-seo.ts           # Valida canonical/OG/JSON-LD/404/trailing slash
├── src/
│   ├── App.tsx                   # Roteamento principal
│   ├── main.tsx                  # Bootstrap + service worker
│   ├── index.css                 # Tema (claro/escuro) + fonts (Oswald, Source Sans 3)
│   ├── App.css
│   ├── vite-env.d.ts
│   ├── assets/
│   │   ├── logo.png
│   │   └── hero-bg.jpg
│   ├── components/
│   │   ├── ui/                   # shadcn/ui (60+ componentes)
│   │   ├── gis/                  # Componentes do GIS Tático
│   │   │   ├── MapaTatico.tsx
│   │   │   ├── WaypointDialog.tsx
│   │   │   ├── WaypointLayer.tsx
│   │   │   ├── WaypointsPanel.tsx
│   │   │   ├── DistanceTool.tsx
│   │   │   ├── AreaTool.tsx
│   │   │   ├── GoToCoordinate.tsx
│   │   │   ├── LayerSwitcher.tsx
│   │   │   ├── ImportExportMenu.tsx
│   │   │   ├── ElevationProfile.tsx
│   │   │   ├── MeasureToolbar.tsx
│   │   │   ├── CompassHUD.tsx
│   │   │   ├── CoordinateReadout.tsx
│   │   │   └── OfflineRegionsManager.tsx
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── NavLink.tsx
│   │   ├── Section.tsx
│   │   ├── ContentCard.tsx
│   │   ├── EquipmentCard.tsx
│   │   ├── EbookCard.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── SEO.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── OnboardingTutorial.tsx
│   │   ├── PWAInstallBanner.tsx
│   │   ├── ShareInviteButton.tsx
│   │   ├── EngagementNotification.tsx
│   │   └── AchievementNotification.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── AchievementNotifContext.tsx
│   ├── hooks/
│   │   ├── useWaypoints.ts
│   │   ├── useRoutes.ts
│   │   ├── useDataStore.ts
│   │   ├── useStreak.ts
│   │   ├── useActivityLog.ts
│   │   ├── useDailyMissions.ts
│   │   ├── useUserProfile.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── utils.ts              # cn() helper
│   │   ├── geo.ts                # Cálculos geográficos
│   │   ├── mgrs.ts               # MGRS wrappers
│   │   ├── kml.ts                # Import/export KML
│   │   ├── gpx.ts                # Import/export GPX
│   │   ├── elevation.ts         # Consulta de elevação
│   │   ├── declination.ts       # Declinação magnética
│   │   ├── routeStats.ts        # Distância/subida/descida/Naismith
│   │   ├── routeReport.ts       # PDF/HTML de rota (jsPDF)
│   │   ├── tileCache.ts         # Fila de downloads de tiles offline
│   │   ├── ogImage.ts
│   │   └── sounds.ts            # Símbolos Morse e sons de feedback
│   ├── data/
│   │   ├── mockData.ts          # products, ebooks, games, challenges
│   │   ├── mapData.ts
│   │   ├── mapTypes.ts
│   │   └── waypointTypes.ts
│   ├── pages/
│   │   ├── Index.tsx           # Landing
│   │   ├── Welcome.tsx
│   │   ├── SplashScreen.tsx
│   │   ├── Equipamentos.tsx
│   │   ├── ProdutoDetalhe.tsx
│   │   ├── Ebooks.tsx
│   │   ├── EbookDetalhe.tsx
│   │   ├── Jogos.tsx
│   │   ├── JogoDetalhe.tsx
│   │   ├── Simulador.tsx
│   │   ├── SimuladorFloresta.tsx
│   │   ├── MapaSobrevivencia.tsx
│   │   ├── Desafios.tsx
│   │   ├── Admin.tsx
│   │   ├── Perfil.tsx
│   │   ├── Comunidade.tsx
│   │   ├── Estatisticas.tsx
│   │   ├── Bussola.tsx         # Login required
│   │   ├── Gis.tsx             # Login required
│   │   ├── Login.tsx
│   │   └── NotFound.tsx
│   └── test/
│       ├── setup.ts
│       └── example.test.ts
├── tests/e2e/                  # Playwright E2E (crie aqui)
├── components.json             # shadcn/ui config
├── eslint.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── playwright-fixture.ts
├── postcss.config.js
├── index.html
├── package.json
└── package-lock.json
```

---

## ✅ Pré-requisitos

- **Node.js** `>= 18.20` (recomendado **20 LTS** ou superior).
- **npm** `>= 9` (ou bun/yarn/pnpm equivalente, embora o repositório use `npm`).
- Editor recomendado: **Visual Studio Code** com as extensões ESLint e Tailwind CSS IntelliSense.

> Dica: use [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating) para gerenciar versões do Node.

---

## 💻 Como rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/clodoaldosilva608/centrodesobrevivencia.git
cd centrodesobrevivencia

# 2. Instale as dependências
npm install

# 3. Rode o ambiente de desenvolvimento
npm run dev
```

A aplicação ficará disponível em **http://localhost:8080**.

Para gerar a build de produção:

```bash
npm run build      # Gera dist/ e regenera public/sitemap.xml
npm run preview    # Serve a build em http://localhost:4173
```

---

## 🧪 Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o Vite em modo desenvolvimento (porta 8080). Roda `predev` antes para regenerar `sitemap.xml`. |
| `npm run build` | Build de produção. Roda `prebuild` para regenerar sitemap. |
| `npm run build:dev` | Build em modo desenvolvimento (Vite). |
| `npm run preview` | Servidor de preview da build (`vite preview`). |
| `npm run lint` | Lint com ESLint. |
| `npm test` | Roda os testes unitários com Vitest uma vez. |
| `npm run test:watch` | Vitest em modo watch. |
| `npm run validate:seo` | Validação SEO via Playwright (roda em `vite preview` por padrão). |

---

## 🔐 Variáveis de ambiente

O projeto não exige variáveis de ambiente para rodar localmente, mas expõe alguns knobs opcionais:

| Variável | Default | Descrição |
|---|---|---|
| `SITE_URL` | `https://centrodesobrevivencia.app` | URL canônica usada para gerar o sitemap e validar SEO. |
| `PORT` | `4173` | Porta do `vite preview` usado pelo `validate:seo`. |
| `BASE_URL` | `http://localhost:${PORT}` | URL alvo do validador SEO (sobrepõe o vite preview). |
| `CONCURRENCY` | `6` | Concorrência do validador SEO. |
| `MAX_ROUTES` | `0` (sem limite) | Limite máximo de rotas validadas. |

Crie um arquivo `.env.local` para sobrescrever localmente (já coberto pelo `.gitignore`).

---

## 🔎 Configuração de SEO e sitemap

- O `sitemap.xml` é gerado por `scripts/generate-sitemap.ts`, que é executado automaticamente em `predev` e `prebuild`. Ele mescla rotas estáticas (definidas no próprio script) com rotas dinâmicas derivadas de `src/data/mockData.ts` (produtos, e-books e jogos).
- O `scripts/validate-seo.ts` valida em produção:
  - canonical auto-referencial (sem trailing slash, exceto root);
  - `og:url` coerente com canonical;
  - `og:image` e `twitter:image` acessíveis (HTTP 2xx);
  - presença de `og:title`, `og:description`, `og:type`, `twitter:card`;
  - rota 404 com `noindex`;
  - variantes com trailing slash normalizam para canonical;
  - `hreflang` válido e auto-referencial;
  - blocos JSON-LD parseáveis e com `@context` schema.org.
- O `components/SEO.tsx` injeta canonical/OG/Twitter/JSON-LD em cada página.
- `robots.txt` e `llms.txt` ficam em `public/`.

> ⚠️ A URL canônica padrão é `https://centrodesobrevivencia.app`. Se for publicar em outro domínio, defina `SITE_URL` no ambiente de CI antes do build.

---

## 📦 PWA, service worker e mapas offline

- `public/manifest.json` define nome, ícones, cores (`#e87b1e`), `start_url` e `display: standalone`.
- `public/sw.js` é registrado em produção (não em iframes/preview) por `src/main.tsx`. Em preview/iframe, o SW é desregistrado automaticamente.
- `public/offline.html` é o fallback exibido quando o SW intercepta uma navegação sem conexão.
- O **GIS Tático** (`src/lib/tileCache.ts`) baixa tiles de mapas por área usando `IndexedDB` (via `idb-keyval`) com fila, pausar/retomar/cancelar, contagem de falhas e estimativa de tamanho via `navigator.storage.estimate()`.

---

## 🧪 Testes

- **Unitários**: Vitest + Testing Library (`src/test/setup.ts`, `src/test/example.test.ts`). Rode com `npm test`.
- **E2E**: Playwright (`playwright.config.ts`). Crie specs em `tests/e2e/`. O `playwright-fixture.ts` re-exporta `test` e `expect` para customizações futuras.
- **CI**: o workflow `.github/workflows/seo-ci.yml` roda build, validação SEO e Lighthouse em cada push/PR para `main`.

---

## 🔄 CI/CD

O workflow **`SEO & Lighthouse`** (`.github/workflows/seo-ci.yml`):

1. Faz checkout do repo.
2. Instala Bun e dependências (`bun install --frozen-lockfile`).
3. Build com `SITE_URL` injetado (regenera sitemap).
4. Instala Playwright + Chromium.
5. Roda `bunx tsx scripts/validate-seo.ts` (com `continue-on-error` para sempre coletar o relatório).
6. Sobe o artefato `seo-validation-report` com HTML + JSON + screenshots por rota com falha.
7. Renderiza um resumo markdown no GitHub Step Summary (incluindo ranking de piores rotas e taxa de falha por categoria).
8. Falha o job se houver issues.
9. Roda Lighthouse CI em 5 URLs da produção (home, equipamentos, ebooks, jogos, bussola) com thresholds em `.lighthouserc.json` (performance ≥ 0.85, accessibility ≥ 0.9, SEO ≥ 0.95, LCP ≤ 2.5s, CLS ≤ 0.1, etc.).

---

## 🗺 Roadmap

As próximas frentes de evolução (em ordem de prioridade):

- [ ] Conectar `AuthContext` ao **Supabase Auth** (OAuth Google + magic link por e-mail).
- [ ] Migrar `mockData.ts` para tabelas Supabase (`products`, `ebooks`, `games`, `challenges`, `achievements`, `user_progress`, `users`).
- [ ] Substituir `localStorage` por **sync em nuvem** opcional (IndexedDB como cache, Supabase como fonte de verdade para usuários autenticados).
- [ ] Code-splitting por rota para reduzir o bundle principal (atualmente > 1.4 MB).
- [ ] Marketplace real com checkout (afiliados / Stripe / Mercado Pago).
- [ ] Jogos com Three.js (módulos `src/games/`).
- [ ] Internacionalização (`pt-BR` atual → variante `pt-PT` e `en-US`).
- [ ] Testes E2E cobrindo fluxo de gamificação completa.
- [ ] Storybook para documentação viva dos componentes UI.

---

## 🤝 Como contribuir

Contribuições são bem-vindas. Para colaborar:

1. Faça um fork do projeto.
2. Crie uma branch descritiva: `git checkout -b feat/minha-feature` ou `fix/meu-fix`.
3. Faça commits pequenos e claros, em português ou inglês, seguindo o padrão **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
4. Rode `npm run lint` e `npm test` antes de abrir PR.
5. Abra um **Pull Request** para `main` descrevendo o que mudou e por quê.

**Boas práticas do projeto:**
- Mantenha o **português do Brasil** como idioma padrão da UI e dos textos do usuário.
- Não introduza dependências novas sem justificativa — discuta em issue antes.
- Mantenha o `package-lock.json` consistente (não commite `bun.lock` ou `yarn.lock`).
- Remova código morto e console.log antes do commit.
- Para mudanças de UI, valide em tema claro e escuro.

Veja também o guia de estilo: `CONTRIBUTING.md`.

---

## 📄 Licença

Distribuído sob licença **MIT**. Veja [`LICENSE`](./LICENSE) para detalhes.

---

## 👤 Autor

Desenvolvido e mantido por **Clodoaldo Silva** — [`@clodoaldosilva608`](https://github.com/clodoaldosilva608).

Contribuições, issues e sugestões são bem-vindas no [repositório do GitHub](https://github.com/clodoaldosilva608/centrodesobrevivencia/issues).

---

**Sobrevivência é conhecimento. Conhecimento é poder.** 🏕️
