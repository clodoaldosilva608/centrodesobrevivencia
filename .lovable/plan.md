# Iteração 3 — Waypoints Táticos e Import/Export GPX/KML

Expande o módulo `/gis` com waypoints categorizados, rotas persistentes e interoperabilidade com apps de campo (Garmin, Google Earth, OsmAnd, Gaia GPS).

## Escopo

### 1. Waypoints com tipos e ícones táticos
- Estender `Waypoint` em `src/data/mapTypes.ts` com `type: WaypointType` e `icon` opcional.
- Tipos: `base`, `agua`, `perigo`, `abrigo`, `recurso`, `observacao`, `rota`, `extracao`, `contato`, `generico`.
- Cada tipo tem ícone Lucide + cor semântica (forest/earth/tactical/primary/destructive).
- Novo `src/data/waypointTypes.ts` centraliza config (ícone, cor, label PT-BR, emoji fallback).

### 2. UI de Waypoints no mapa
- Novo `src/components/gis/WaypointLayer.tsx`: renderiza `L.marker` com `divIcon` estilizado por tipo. Clique seleciona (integra com `CompassHUD` alvo já existente).
- Novo `src/components/gis/WaypointDialog.tsx`: modal shadcn para criar/editar waypoint (nome, tipo, cor, nota, lat/lng editáveis com validação).
- Long-press no mapa (mobile) e Shift+click (desktop) abrem o dialog pré-preenchido com a coordenada clicada. Handler em `MapaTatico.tsx`.
- Botão "Adicionar waypoint" na toolbar lateral (ao lado de `LocateButton`).

### 3. Painel lateral de gerenciamento
- Novo `src/components/gis/WaypointsPanel.tsx`: `Sheet` (side="right") listando todos os waypoints.
- Busca por nome, filtro por tipo (chips), ordenação (recente/nome/distância do usuário).
- Cada item: ícone tipado, nome, coord (formato preferido), ações (voar até, editar, remover). Virtualização com `react-window` já disponível (ou fallback simples se >200 itens).
- Botão "Limpar todos" com confirmação.

### 4. Rotas (paths persistentes)
- Nova entidade `Route` em `mapTypes.ts`: `{ id, name, color, points: LatLng[], createdAt, notes? }`.
- Novo `src/hooks/useRoutes.ts` (padrão `useWaypoints`, storage `sh_routes`).
- Botão "Salvar como rota" no card de distância existente (`DistanceTool.tsx`) — converte o path atual em `Route` persistente.
- Rotas listadas em aba do `WaypointsPanel` (tabs: Waypoints / Rotas). Ao clicar, desenha polyline no mapa e permite exportar.

### 5. Import/Export GPX e KML
- Novo `src/lib/gpx.ts`: parser + serializador GPX 1.1 (waypoints `<wpt>` e tracks `<trk>/<trkseg>/<trkpt>`).
- Novo `src/lib/kml.ts`: parser + serializador KML (Placemarks com `<Point>` e `<LineString>`; extensões de cor via `<Style>`).
- Sem libs externas — parsing via `DOMParser`, serialização via template strings + `XMLSerializer` para escape.
- Novo `src/components/gis/ImportExportMenu.tsx`: dropdown com:
  - **Exportar waypoints** (GPX / KML) — download via Blob.
  - **Exportar rotas** (GPX / KML).
  - **Exportar tudo**.
  - **Importar arquivo** (`<input type="file" accept=".gpx,.kml">`) — detecta formato pela extensão + validação de root element; mescla com dados existentes (dedupe por lat/lng+nome, toast de resumo).
- Todos os textos e mensagens de erro em PT-BR.

### 6. Ajustes de integração
- `CompassHUD` continua aceitando waypoint selecionado como alvo — expor `selectedWaypointId` em `MapaTatico.tsx` compartilhado com `WaypointLayer` e `WaypointsPanel`.
- `LayerSwitcher` e `MeasureToolbar` continuam funcionando sem regressão.
- Todos os textos em PT-BR.

## Arquivos

```text
Novos:
  src/data/waypointTypes.ts
  src/components/gis/WaypointLayer.tsx
  src/components/gis/WaypointDialog.tsx
  src/components/gis/WaypointsPanel.tsx
  src/components/gis/ImportExportMenu.tsx
  src/hooks/useRoutes.ts
  src/lib/gpx.ts
  src/lib/kml.ts

Editados:
  src/data/mapTypes.ts               +type/icon em Waypoint, +Route
  src/hooks/useWaypoints.ts          suporte a novos campos + updateWaypoint
  src/components/gis/MapaTatico.tsx  integra layer, panel, dialog, menu
  src/components/gis/DistanceTool.tsx  botão "salvar como rota"
```

## Detalhes técnicos

- **Formato GPX**: schema oficial `http://www.topografix.com/GPX/1/1`. Cor via extensão `<extensions><gpxx:DisplayColor>`. Compatível com Garmin BaseCamp.
- **Formato KML**: schema `http://www.opengis.net/kml/2.2`. Cor via `<Style><IconStyle><color>` (formato AABBGGRR).
- **Import dedupe**: waypoints com mesma lat/lng (tol. ~1m) e mesmo nome são ignorados; conflito de ID gera novo `crypto.randomUUID()`.
- **Migração de dados**: `useWaypoints` inicial faz backfill de `type: "generico"` para waypoints antigos sem o campo.

## Fora do escopo (Iteração 4)
- Sync com Supabase (fica quando o usuário priorizar).
- Compartilhamento de rotas por link.
- Snap-to-trail / routing engine.

## Perguntas
1. Prefere o painel de waypoints como **Sheet lateral** (deslizante) ou como **página dedicada** `/gis/waypoints`?
2. Ao importar GPX/KML, devo **mesclar** com os waypoints atuais ou oferecer opção de **substituir tudo**?
