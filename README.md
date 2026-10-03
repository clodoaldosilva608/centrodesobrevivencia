# Survival Hub Nexus

Você é um engenheiro de software sênior especializado em arquitetura de plataformas digitais escaláveis, aplicações web modernas, marketplaces e sistemas gamificados.



Seu objetivo é criar uma plataforma extremamente avançada chamada:



SURVIVAL HUB



Um hub digital completo voltado para:



bushcraft

sobrevivencialismo

camping

aventura

exploração

preparação para situações extremas



Toda a plataforma deve estar 100% em português do Brasil.



A arquitetura deve ser escalável, modular e preparada para crescimento contínuo.



---



INFRAESTRUTURA E INTEGRAÇÕES OBRIGATÓRIAS



A aplicação deve ser construída preparada para integração direta com Supabase e GitHub.



SUPABASE



Utilizar Supabase como:



banco de dados PostgreSQL

autenticação de usuários

armazenamento de arquivos

API backend automática

gestão de sessões



O schema do banco deve ser compatível com Supabase.



GITHUB



A plataforma deve ser estruturada para funcionar em um repositório GitHub contendo:



controle de versão

deploy contínuo

estrutura organizada de código



A estrutura de pastas deve estar preparada para versionamento e colaboração.



---



STACK TECNOLÓGICA



Frontend



Next.js

React

TypeScript

TailwindCSS



Backend



Supabase (PostgreSQL + Auth + API)



Jogos e simulações



Three.js

Canvas HTML5

React Game Hooks



---



OBJETIVO DA PLATAFORMA



Criar um ecossistema digital contendo:



loja de equipamentos de sobrevivência

biblioteca de e-books

jogos temáticos de sobrevivência

simuladores de sobrevivência

mapa interativo de exploração

sistema de desafios



A plataforma deve permitir expansão futura.



---



ESTRUTURA DA PLATAFORMA



/pagina-inicial



/equipamentos



/equipamentos/[produto]



/ebooks



/ebooks/[ebook]



/jogos



/jogos/[jogo]



/simulador



/mapa-sobrevivencia



/desafios



/comunidade



/perfil



/admin



---



LANDING PAGE



Criar uma landing page profissional com estética inspirada em:



exploração

natureza

aventura

sobrevivência



Elementos da página inicial:



hero banner com paisagem natural

frase principal:



"Sobrevivência é conhecimento. Conhecimento é poder."



Seções da landing page:



equipamentos recomendados

e-books de sobrevivência

jogos interativos

desafios da semana

mapa de sobrevivência



---



SEÇÃO DE EQUIPAMENTOS



Criar uma loja de equipamentos de sobrevivência.



Produtos exibidos em cards visuais.



Cada card deve conter:



imagem

nome do produto

categoria

descrição curta

preço

botão "ver produto"



Exemplos de produtos:



mochila tática

canivete multiuso

lanterna tática

fogareiro portátil

kit primeiros socorros

bussola

corda paracord

filtro de água portátil



---



PÁGINA DO PRODUTO



Cada produto deve possuir:



galeria de imagens

descrição completa

especificações

benefícios

link de compra



A compra pode ocorrer por:



afiliados

marketplaces

checkout externo



---



SEÇÃO DE EBOOKS



Criar biblioteca de conhecimento.



E-books exibidos em cards visuais.



Cada card deve conter:



capa

título

autor

descrição curta

botão ver detalhes



Exemplos de e-books:



Manual de Sobrevivência na Selva

Bushcraft para Iniciantes

Guia de Acampamento Selvagem

Encontrando Água na Natureza

Primeiros Socorros em Situações Extremas



---



SEÇÃO DE JOGOS



Criar área de jogos temáticos.



Cards contendo:



imagem

nome

descrição

botão jogar



Exemplos de jogos:



Simulador de Sobrevivência na Floresta

Construa seu Abrigo

Gerenciamento de Recursos

Exploração de Território

Caça e Coleta



---



SIMULADOR DE SOBREVIVÊNCIA



Criar um simulador interativo baseado em decisões.



O usuário recebe um cenário.



Exemplo:



"Você está perdido na floresta com pouca água."



O usuário escolhe ações.



Exemplos:



procurar água

construir abrigo

acender fogo

explorar território



Cada decisão gera consequências.



---



MAPA INTERATIVO DE SOBREVIVÊNCIA



Criar um mapa explorável.



O usuário pode descobrir:



fontes de água

regiões perigosas

abrigos naturais

recursos naturais



O mapa pode conter:



eventos aleatórios

desafios



---



SISTEMA DE DESAFIOS



Criar desafios semanais.



Exemplos:



acender fogo sem fósforo

construir abrigo simples

encontrar água potável



Os usuários recebem pontos ao completar desafios.



---



SISTEMA DE PERFIL



Cada usuário possui perfil contendo:



nível de sobrevivência

pontuação

desafios completados

jogos jogados



---



SISTEMA DE GAMIFICAÇÃO



Implementar sistema com:



XP

níveis

medalhas

conquistas



Exemplos de conquistas:



Explorador iniciante

Especialista em abrigo

Mestre da sobrevivência



---



BANCO DE DADOS SUPABASE



Criar tabelas:



users

products

ebooks

games

challenges

achievements

user_progress



Cada tabela deve possuir:



id

timestamps

relacionamentos



---



PAINEL ADMINISTRATIVO



Criar painel administrativo contendo:



gestão de produtos

gestão de e-books

gestão de jogos

gestão de desafios



O admin deve poder:



criar

editar

excluir conteúdos



---



ASSETS



Estrutura de assets:



/assets



/products

/ebooks

/games

/map

/icons



---



DESIGN



Cores inspiradas em:



verde militar

marrom terra

preto

laranja aventura



Tipografia forte e legível.



Interface moderna e imersiva.



---



OBJETIVO FINAL



Criar uma plataforma completa que funcione como:



portal de sobrevivencialismo

marketplace de equipamentos

biblioteca de conhecimento

plataforma de jogos e simuladores

hub educacional interativo



A arquitetura deve permitir expansão futura com novos módulos, novos jogos e novos conteúdos.



O código deve estar estruturado para funcionar perfeitamente com:



Supabase

GitHub

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://centrodesobrevivencia.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/99d22bd7-3110-49ba-8db1-fc8e71bd9a38).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
