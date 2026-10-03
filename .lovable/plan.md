# Iteração 4 do GIS Tático: rotas, S.O.S./B.O.B. e mapas offline

## O que você vai ganhar
1. **Resumo da rota para baixar**: cada rota salva ganha um botão "Baixar resumo", em PDF ou HTML. O resumo traz o nome, a data, o mapa da rota, a lista de pontos com coordenadas (DD/MGRS), a distância de cada trecho e o total, a subida e a descida, o gráfico de elevação e o tempo estimado.
2. **Medir trilhas com um painel na tela**: escolha uma rota ou uma sequência de pontos e veja a distância total, a subida e a descida, e o tempo estimado (regra de Naismith ajustada ao ritmo escolhido). Durante a navegação, um painel no mapa mostra quanto falta, o próximo ponto, a direção e a hora estimada de chegada, usando sua posição real.
3. **Editar rotas**: reordene os pontos arrastando, mova-os no mapa, insira um ponto entre dois outros, remova ou duplique pontos, e duplique a rota inteira. O mapa se atualiza na hora e tudo fica salvo.
4. **Mapas offline por área**: desenhe um retângulo no mapa para escolher a região, em vez de usar só a área visível. Antes de baixar, você vê a estimativa de quantidade e tamanho. Durante o download, aparecem o progresso, os botões de pausar e cancelar e a contagem de falhas, com opção de tentar de novo. Também dá para ver o espaço usado por região e no total, apagar uma região ou limpar todo o cache.
5. **Módulo S.O.S. e B.O.B.** (painel novo no mapa):
   - **B.O.B. (mochila de emergência)**: várias listas, cada uma com itens, peso, quantidade, categoria e validade, além de anotações livres. Mostra o peso total e marca os itens já embalados.
   - **S.O.S.**: um modo de emergência em tela cheia com sinal sonoro de SOS em Morse (som gerado no próprio app), lanterna estroboscópica na tela, sua posição em DD/MGRS em letras grandes, e botões para compartilhar a posição por SMS ou WhatsApp com contatos salvos. Inclui anotações de emergência, como tipo sanguíneo e alergias.
   - **Atalhos configuráveis**: escolha uma tecla de teclado (padrão: Shift+S), toque triplo no botão S.O.S. ou toque longo de 2 segundos. Isso é ajustado nas configurações do módulo.

Tudo funciona sem internet e fica salvo no próprio aparelho, como no resto do GIS.

## Detalhes técnicos
- Novas libs: `jspdf` para gerar o PDF e `@dnd-kit/sortable` para reordenar os pontos. A imagem do mapa é desenhada em canvas a partir dos tiles em cache, sem depender de captura de tela.
- `src/lib/routeStats.ts`: distância por trecho, subida e descida (com filtro de ruído) e estimativa de tempo. A elevação vem de `elevation.ts` e fica guardada na própria rota (`elevations?: number[]`).
- `src/lib/routeReport.ts`: monta o HTML (Blob) e o PDF (jsPDF) a partir da mesma estrutura de dados.
- `useRoutes`: novas funções `updateRoute`, `duplicateRoute`, `reorderPoint`, `movePoint`, `insertPoint` e `removePoint`. Novo componente `RouteEditor.tsx`, com marcadores arrastáveis no mapa e lista ordenável no painel.
- `TrailHUD.tsx`: acompanha a posição com `watchPosition`, encontra o ponto mais próximo da rota e calcula o que falta.
- `tileCache.ts`: download em fila com pausar, retomar e cancelar (AbortController), registro das falhas, tamanho em bytes por região, `clearAll()` e uma estimativa por `navigator.storage.estimate()`. Novo componente `AreaSelectTool.tsx` para desenhar o retângulo.
- `useBob.ts`, `useSos.ts` e `SosBobPanel.tsx`, mais `SosMode.tsx` em tela cheia. O sinal Morse fica em `sounds.ts`. Os atalhos ficam salvos em `sh_sos_shortcuts` e são lidos por um listener global no `MapaTatico`.
- Tudo é guardado em localStorage ou IndexedDB. Nada usa servidor.
