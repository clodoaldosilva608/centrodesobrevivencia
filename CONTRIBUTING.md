# Guia de Contribuição — Centro de Sobrevivência

Obrigado por considerar contribuir com o **Centro de Sobrevivência**! Este documento descreve o fluxo de trabalho, padrões de código e convenções que mantemos para que o repositório continue organizado e escalável.

## 🚀 Começando

1. Faça um **fork** do repositório.
2. Clone o fork localmente:
   ```bash
   git clone https://github.com/<seu-usuario>/centrodesobrevivencia.git
   cd centrodesobrevivencia
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Rode o ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Crie uma branch descritiva para a sua contribuição:
   ```bash
   git checkout -b feat/minha-feature
   ```

## 🌿 Padrão de branches

- `main` — branch estável, sempre publicável. Tudo merges via PR.
- `feat/<nome>` — novas funcionalidades (ex.: `feat/simulador-caverna`).
- `fix/<nome>` — correções de bug (ex.: `fix/bussola-declinacao`).
- `chore/<nome>` — manutenção, configs, deps (ex.: `chore/upgrade-vite`).
- `docs/<nome>` — apenas documentação (ex.: `docs/roadmap-jogos`).
- `refactor/<nome>` — refatorações sem mudança de comportamento.
- `test/<nome>` — inclusão ou ajuste de testes.

Não use prefixos como `feature/` ou `bug/` — mantenha os nomes curtos e em **kebab-case**.

## ✍️ Conventional Commits

Mantenha commits pequenos e atômicos. Use o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/):

```
<tipo>(<escopo opcional>): <descrição curta em minúsculas>
```

**Tipos aceitos:**
- `feat:` — nova funcionalidade visível ao usuário
- `fix:` — correção de bug
- `chore:` — tarefas de manutenção (deps, configs, CI)
- `docs:` — documentação (README, CONTRIBUTING, etc.)
- `refactor:` — reestruturação de código sem mudança de comportamento
- `test:` — adição ou ajuste de testes
- `style:` — apenas formatação (espaços, ponto-e-vírgula)
- `perf:` — melhoria de performance

**Exemplos:**
- `feat(gis): adicionar suporte a exportação em GeoJSON`
- `fix(bussola): corrigir declinação magnética no hemisfério sul`
- `chore(deps): atualizar react-leaflet para 4.2.1`
- `docs: atualizar roadmap com módulo de jogos 3D`

## ✅ Checklist antes de abrir PR

- [ ] Código em **TypeScript** sem erros (`tsc --noEmit` implícito no build).
- [ ] `npm run lint` sem erros.
- [ ] `npm test` sem falhas (se a sua mudança afeta lógica coberta por testes).
- [ ] UI testada em **tema claro e escuro**.
- [ ] Sem `console.log` ou código comentado.
- [ ] Sem dependências novas desnecessárias — justifique se for o caso.
- [ ] Textos de UI em **português do Brasil**.
- [ ] Imagens novas otimizadas e com `alt` acessível.
- [ ] Páginas novas passam pelo componente `<SEO />`.
- [ ] Se adicionou rota nova, registre no `scripts/generate-sitemap.ts`.
- [ ] Commit message seguindo Conventional Commits.

## 🧪 Testes

- **Unitários**: Vitest + Testing Library em `src/test/`. Rode com `npm test`.
- **E2E**: Playwright. Crie specs em `tests/e2e/`. Rode com `npx playwright test`.
- **SEO**: O CI já valida canonical/OG/JSON-LD em cada PR. Para rodar localmente:
  ```bash
  npm run build
  npm run preview &
  npm run validate:seo
  ```

## 🎨 Estilo de código

- **TypeScript** estrito (ver `tsconfig.app.json`).
- **TailwindCSS** para estilo — evite CSS bruto no `index.css` sempre que possível.
- Componentes **shadcn/ui** em `src/components/ui/` — não editar diretamente, regerar via `npx shadcn-ui@latest add <componente>` quando precisar de um novo.
- Caminho de importação absoluta: use o alias `@/` (configurado em `vite.config.ts` e `tsconfig.json`).
- Nome de componentes em **PascalCase** (ex.: `WaypointDialog.tsx`).
- Hooks em **camelCase** prefixado com `use` (ex.: `useStreak.ts`).
- Libs utilitárias em **camelCase** (ex.: `routeStats.ts`).
- Constantes em **UPPER_SNAKE_CASE**.

## 🌐 Idioma

- **UI e textos**: sempre português do Brasil (pt-BR).
- **Comentários e docs**: português do Brasil ou inglês, mantendo consistência com o arquivo.
- **Variáveis e nomes de código**: inglês (prática universal).

## 🔐 Segurança

- Não commite segredos, tokens ou variáveis de ambiente sensíveis. Use `.env.local` (já no `.gitignore`).
- Reporte vulnerabilidades de segurança em privado via GitHub Security Advisory, não por PR público.

## 📬 Discussão

Antes de começar uma feature grande, abra uma **issue de discussão** para alinhar escopo e abordagem. Assim evitamos retrabalho.

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a **MIT** do projeto.

---

Obrigado por ajudar a tornar o Centro de Sobrevivência melhor! 🏕️
