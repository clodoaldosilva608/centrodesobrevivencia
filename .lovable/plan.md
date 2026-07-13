
# Iteração 2 — Ferramentas Táticas de Medição

Adiciona a toolbar de medições e HUD sobre o mapa GIS já existente (`/gis`). Mantém stack atual (Leaflet + shadcn + Recharts + Framer Motion) e as memórias do projeto (PT-BR, tema tático, sem Lovable Cloud).

## Escopo

### 1. Toolbar flutuante de ferramentas
- Novo `MeasureToolbar.tsx` na lateral direita do mapa (abaixo dos controles existentes).
- Botões 48×48px (luvas): **Distância**, **Área**, **Elevação**, **Bússola**, **Limpar**.
- Estado ativo destacado com cor `--primary` (adventure orange).
- Estado gerido via `useState` no `MapaTatico.tsx` — apenas uma ferramenta ativa por vez.

### 2. Medição de distância linear
- Lib nova: `leaflet-geometryutil`.
- Clique adiciona vértice; duplo clique/botão "concluir" encerra o path.
- Polyline em cor `--primary`, vértices como círculos.
- Cada segmento rotulado com distância (m/km) via `L.marker` com `divIcon`.
- Card no rodapé mostra **total** em m, km e **NM** (milhas náuticas).
- Toggle de unidade preferida (métrico / náutico) persistido em `localStorage` (`sh_gis_unit`).

### 3. Medição de área
- Polígono via cliques; fecha ao clicar no primeiro vértice ou botão "concluir".
- Preenchimento semitransparente cor `--primary`.
- Cálculo com `L.GeometryUtil.geodesicArea` → m², **hectares**, **acres**.
- Card no rodapé com perímetro + área.

### 4. Perfil de elevação
- Novo `ElevationProfile.tsx` em bottom sheet (`Sheet` do shadcn, side="bottom").
- Após desenhar um path (modo distância), botão "Perfil de elevação" fica ativo.
- `src/lib/elevation.ts`: cliente para `https://api.open-elevation.com/api/v1/lookup`, amostra ~100 pontos ao longo do path (interpolação linear), com cache em `localStorage` por hash do path (`sh_elev_cache`, TTL 7 dias).
- Gráfico Recharts (`AreaChart`) mostrando elevação × distância acumulada.
- Stats: min, max, ganho total, perda total.
- Fallback amigável se offline / API falhar.

### 5. Bússola / HUD
- Novo `CompassHUD.tsx` — botão de toggle abre overlay flutuante (canto inferior esquerdo, arrastável opcional; v1 fixo).
- Usa `DeviceOrientationEvent` com permissão iOS (`DeviceOrientationEvent.requestPermission()`).
- Rosa dos ventos em SVG animada via Framer Motion (rotate suave).
- Mostra **heading atual** (0–360°) e cardinal (N/NE/E/…).
- Se houver waypoint selecionado no mapa, mostra **rumo (bearing)** até ele e **distância**.
- **Declinação magnética**: novo `src/lib/declination.ts` com aproximação WMM simplificada (fórmula polinomial baseada em lat/lon, precisão ~1°); exibe valor e aplica correção true↔magnetic com toggle.
- Fallback desktop: se sem sensor, exibe aviso e permite input manual de rumo alvo.

### 6. Ajustes de suporte
- Waypoints existentes (`useWaypoints`) ganham seleção clicável para servir de alvo da bússola. Sem mudança de schema, apenas UI: marker no mapa + estado `selectedWaypointId`.
- Toolbar respeita safe-area em mobile (padding-bottom).
- Textos 100% PT-BR.

## Arquivos

```text
Novos:
  src/components/gis/MeasureToolbar.tsx
  src/components/gis/DistanceTool.tsx      handler + camada de desenho
  src/components/gis/AreaTool.tsx          handler + camada de desenho
  src/components/gis/ElevationProfile.tsx  bottom sheet com Recharts
  src/components/gis/CompassHUD.tsx        overlay de bússola
  src/lib/elevation.ts                     open-elevation client + cache
  src/lib/declination.ts                   WMM simplificado
  src/lib/geo.ts                           bearing, haversine, interpolação de path

Editados:
  src/components/gis/MapaTatico.tsx        integra toolbar + estados
  package.json                              +leaflet-geometryutil
```

## Fora do escopo desta iteração
- Waypoints com tipos/ícones (fica para Iteração 3).
- Import/export GPX/KML (Iteração 3).
- Persistência das medições entre sessões — v1 mede em memória; usuário limpa manualmente.

## Perguntas rápidas
1. Unidade padrão do sistema: **métrico** (m/km/km²/ha) ou **náutico** (NM)? Sugestão: métrico com toggle rápido.
2. Confirmar uso da **API pública open-elevation** (sem chave, mas exige rede)? Sem alternativa 100% offline nesta iteração.
