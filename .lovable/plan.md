
# Plataforma GIS Tática — Survival Hub

Adiciona um módulo completo estilo BDGEx ao app existente, em PT-BR, com tema tático escuro, mobile-first, totalmente offline-first via localStorage/IndexedDB e Service Worker (já existente). Mantém a stack atual (React + Vite + Tailwind + shadcn + Leaflet) e respeita as memórias do projeto: **sem Lovable Cloud**; persistência via localStorage e, quando o usuário quiser sync remoto, via Supabase próprio (apenas schemas mock prontos, sem ativar).

## Escopo dividido em 5 entregas incrementais

Por ser muito grande, proponho construir em 5 PRs/iterações. Cada uma é utilizável sozinha. Confirme se quer todas seguidas ou parar para revisar entre elas.

### Iteração 1 — Núcleo GIS e camadas
- Nova rota `/gis` (e link no menu) com `MapaTatico` em tela cheia, Leaflet com gestos multi-touch já nativos.
- Componente `LayerSwitcher` (bottom sheet) com bases:
  - Satélite (Esri World Imagery)
  - Topográfico (OpenTopoMap)
  - Ruas (OSM)
  - Tático escuro (CartoDB Dark Matter — já usado no projeto)
- `CustomTileLayerForm`: usuário cola URL XYZ/WMS/WMTS, salva em `localStorage` (`sh_gis_layers`), aparece no switcher.
- Cache offline de tiles via **IndexedDB** (`idb-keyval`): usuário desenha bbox + zoom range, app baixa e guarda; SW intercepta requests para servir do cache. Listagem de regiões salvas com tamanho/limpeza.
- Readout de coordenadas no rodapé (centro do mapa + cursor em desktop): DD, DMS e **MGRS** (lib `mgrs`).
- Modal "Ir para coordenada" aceitando DD, DMS ou MGRS.

### Iteração 2 — Ferramentas táticas de medição
- Toolbar flutuante (lateral direita, ícones grandes 48px para luvas).
- **Distância linear**: `leaflet-geometryutil` — clique para adicionar vértices, total em m/km/NM, segmentos rotulados.
- **Área**: polígono, cálculo em m², hectares, acres.
- **Perfil de elevação**: usa `https://api.open-elevation.com/api/v1/lookup` (amostra ~100 pontos ao longo do path); chart 2D com Recharts (já no projeto). Gráfico abre em sheet inferior.
- **Bússola/HUD**: usa `DeviceOrientationEvent` (com permissão iOS), mostra heading atual, rumo até próximo waypoint selecionado, e declinação magnética calculada via fórmula WMM simplificada (ou tabela aproximada por região).

### Iteração 3 — Waypoints e marcadores
- Estende o `useWaypoints` existente para suportar tipos: `water | shelter | danger | foraging | cache | custom` com ícones Lucide e cores.
- Form de criação/edição com título, descrição, tipo, cor.
- **Export/Import GPX e KML** (parser próprio leve em `src/lib/gpxKml.ts`; download via Blob, upload via `<input type=file>`).
- Lista virtualizada (`@tanstack/react-virtual`) para centenas de waypoints.

### Iteração 4 — Módulos de sobrevivência off-grid
- **Manual offline** (`/manual`): base de conhecimento categorizada (Primeiros Socorros, Fogo, Água, Abrigos, Nós) em arquivos markdown estáticos em `src/content/manual/*.md` carregados via `import.meta.glob`, renderizados com `react-markdown`. Busca client-side (Fuse.js). Checklists interativos persistidos em localStorage.
- **Bug-Out Bag** (`/bob`): CRUD de itens com categoria, peso, quantidade, validade. Soma total de peso, alerta acima do limite configurável. Alertas de validade em <30 dias destacados em laranja/vermelho. Lista virtualizada.
- **S.O.S. Hub** (`/sos`):
  - Botão grande que aciona estrobo de tela (alterna `bg-white`/`bg-black` em ritmo Morse SOS) e usa `ImageCapture`/`navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})` + track torch quando disponível.
  - Áudio Morse SOS via Web Audio API (já temos sistema de sons).
  - Card gigante com lat/lon DD + MGRS em fonte enorme para ditado.

### Iteração 5 — Persistência, UX final, performance
- Schema mock Supabase documentado em `docs/supabase-schema.sql` (tabelas `profiles`, `tactical_maps`, `waypoints`, `routes`, `bob_items`, `cached_regions` com RLS por `user_id`). NÃO ativa Lovable Cloud — apenas o SQL pronto para o usuário rodar no Supabase próprio dele quando quiser.
- Camada de repositório `src/lib/repo/*` com interface comum: implementação `localRepo` (atual) e stub `supabaseRepo` desativado por flag.
- Tokens de tema: adiciona `--tactical-charcoal: 0 0% 7%`, `--olive: 90 11% 27%`, `--emergency: 16 100% 60%` ao `index.css`, expõe no `tailwind.config.ts`. Mantém compatibilidade com tema claro existente.
- Botões mínimo 44×44px nas telas GIS, bottom sheets com snap points.
- Virtualização revisada, lazy-load das rotas pesadas (`React.lazy` para `/gis`, `/bob`, `/manual`).

## Detalhes técnicos

```text
Novas libs:
  leaflet-geometryutil   medições
  mgrs                   conversão MGRS
  idb-keyval             cache IndexedDB de tiles
  react-markdown + remark-gfm   manual
  fuse.js                busca offline
  @tanstack/react-virtual       listas virtualizadas
Sem novas libs de mapa: continuamos com Leaflet 4.2.1 (já no projeto).
```

```text
Estrutura de arquivos nova
src/pages/
  Gis.tsx           tela principal do mapa tático
  Bob.tsx           bug-out bag
  Manual.tsx        wiki offline
  Sos.tsx           hub de emergência
src/components/gis/
  MapaTatico.tsx
  LayerSwitcher.tsx
  CoordinateReadout.tsx
  GoToCoordinate.tsx
  MeasureToolbar.tsx
  ElevationProfile.tsx
  CompassHUD.tsx
  WaypointEditor.tsx
  OfflineRegionsManager.tsx
src/lib/
  mgrs.ts           wrappers
  gpxKml.ts         import/export
  tileCache.ts      IndexedDB + SW handshake
  elevation.ts      open-elevation client com cache
  declination.ts    WMM simplificado
  repo/             interface + impl local
src/content/manual/*.md
docs/supabase-schema.sql
```

```text
Service Worker (public/sw.js)
- adiciona estratégia "cache-first com fallback de rede" para hosts de tiles registrados
- canal postMessage para a UI saber progresso do download de regiões
```

## O que NÃO está incluso (precisa confirmação)
1. **Mapbox GL JS** como alternativa: ficamos só com Leaflet. Mapbox exige token pago e troca grande de stack — só faço se você pedir.
2. **Ativar Supabase de verdade**: a memória do projeto proíbe Lovable Cloud. Posso entregar o SQL e o repo stub, mas a integração viva fica para depois com seu projeto Supabase próprio.
3. **Roteamento turn-by-turn**: fora do escopo (BDGEx também não tem).

## Perguntas antes de começar
1. Faço as 5 iterações em sequência num único loop ou paro após cada uma para você validar?
2. Mantenho o módulo existente `/mapa-sobrevivencia` (gamificado) e adiciono `/gis` como módulo profissional separado, ou refatoro o `/mapa-sobrevivencia` para virar este novo? Recomendo manter os dois — públicos diferentes.
3. Confirma que o tile cache offline pode usar até ~200MB no IndexedDB do dispositivo (configurável)?
