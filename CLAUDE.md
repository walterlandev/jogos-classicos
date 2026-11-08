# Jogos Clássicos — guia para qualquer sessão nova do Claude Code

Leia isto antes de mexer em qualquer coisa. Para o estado atual, a lista de
arquivos e as pendências, leia `.claude/RESUMO_PROJETO.md` (é curto). Notas,
decisões e diário ficam no Obsidian: `wasobsidia/Projetos/Jogos Clássicos/`.
Mantenha o resumo atualizado quando fizer mudanças relevantes.

## Onde as coisas moram

- **Site estático, sem build:** HTML, CSS e JS puros em `public/`. Jogos:
  `blockix.html` (ex-"Tetris"), `snake.html`, `breakout.html`, cada um com
  `js/<jogo>.js` (tela, laço, controles) e regras puras em `js/logica/`.
  `index.html` + `js/menu.js` é o menu. Comuns: `js/aviso.js` (faixa de fim),
  `js/controles.js` (botões de toque), `js/temas.js` (tema).
- **Temas (o jogador escolhe):** `css/base.css` (estrutura, só variáveis) +
  `css/temas/<id>.css`; registro e paleta do canvas em `js/logica/temas.js`.
  Regras e tokens em `DESIGN.md`. Toda página de jogo usa a mesma moldura
  (`.topo`, `.placar`, `.campo > .tela`, `.camada`, `.controles`).
- **Login, perfil e ranking:** Firebase Auth + Firestore, projeto
  `jogos-classicos`, tudo em `public/js/auth.js` (SDK 10.7.1 pelo CDN
  `gstatic`). Coleção `usuarios/{uid}` com `nome`, `recorde_tetris`,
  `recorde_snake`, `recorde_breakout`, `data_recorde`, `tema` (escolha do
  jogador) e `itens_liberados` (reservado: só o servidor grava; Etapa 6).
  Blockix grava em `recorde_blockix` (desde a Etapa 3a; `recorde_tetris`
  fica no banco, fora da tela) e `nivel_max_blockix` (libera nível inicial).
  Breakout grava em `recorde_breakout_v2` (Etapa 3b) e `nivel_max_breakout`
  (fase máxima). As 20 fases desenhadas ficam em `js/logica/breakout.js`.
  Snake grava em `recorde_snake_v2` (Etapa 3c) e `nivel_max_snake`; os 15
  mapas ficam em `js/logica/cobra.js` (todo mapa passa por teste de área
  fechada).
- **Nível do jogador (Etapa 4):** `js/logica/progresso.js` (XP, curva,
  15 conquistas, mescla) + `js/progresso.js` (guarda no navegador, mescla com o
  perfil). Cada jogo chama `registrarPartida(jogo, resumo)` no fim. Perfil:
  `progresso` e `xp` (ranking Geral). Tema `lousa` tem `nivelMinimo: 10`.
- **Hospedagem:** Firebase Hosting (`firebase.json` publica `public/`).
- **Repositório:** GitHub `walterlandev/jogos-classicos` (público), remoto
  por HTTPS. O push NÃO publica o site; a publicação é um passo à parte.

## Rodar, testar e publicar

- Testes: `npm test` (Node 24, `node --test`, sem dependências). A lógica pura
  de cada jogo fica em `public/js/logica/` (sem DOM) e é testada em `tests/`.
  Regra nova de jogo entra primeiro ali, com teste.
- Local: `npx serve public` (ou qualquer servidor estático). Abrir o HTML
  direto pelo arquivo não funciona, porque `auth.js` é um módulo ES.
- Publicar (produção; sempre com o OK do usuário, e o login no Firebase é
  dele: `npx firebase login`):
  1. site: `npx firebase deploy --only hosting`;
  2. regras: `npx firebase deploy --only firestore:rules`.
  Nessa ordem: o site antigo grava `email` no cadastro e seria recusado.

## Regras que não podem ser esquecidas

1. **Nomes de arquivo diferenciam maiúsculas no site publicado.** O Windows
   ignora a caixa e o Firebase Hosting não: `snake.png` em vez de
   `Snake.png` funciona aqui e quebra no ar. Confira cada `href`/`src`
   contra o nome exato do arquivo. Nomes novos: tudo em minúsculas.
2. **O banco é protegido por `firestore.rules`** (versionado e testado):
   perfil público sem dado pessoal (nunca grave e-mail nele), só o dono
   altera, recordes/XP/níveis só sobem com teto, `itens_liberados` nunca
   pelo navegador. **Mudou as regras ou um campo gravado pelo site? Rode
   `npm run test:regras`** (emulador; precisa do Java em
   `C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot\bin` no PATH) e
   acrescente o caso em `tests-regras/`. Campo novo no perfil = regra nova.
3. **A `apiKey` do Firebase em `auth.js` não é segredo** (vai ao navegador
   de qualquer visitante). Segredo de verdade (conta de serviço, `.env`)
   nunca entra no repositório.
4. **Laço de jogo só pelo `requestAnimationFrame`, com tempo real.** Nunca
   chame o `update` direto (o timestamp do rAF tem outra escala) e zere o
   relógio (`lastTime = null`) ao iniciar e ao despausar. Movimento em px/s
   × dt, nunca "px por quadro" (monitor de 144 Hz dobraria a velocidade).
5. **Nada de `alert`/`reload` no jogo, nem `innerHTML` com dado do jogador.**
   Fim de jogo usa `mostrarFimDeJogo` (`aviso.js`); recorde usa
   `salvarRecordeDB(pontos, 'tetris'|'snake'|'breakout')`, que devolve true
   quando é recorde novo.
6. **Cor nunca fixa:** no CSS só variáveis do tema; no canvas só `paleta()`.
   Tema novo precisa de todas as variáveis do `fliperama.css`. Ícones são
   SVG próprios (nada de caractere unicode/emoji como ícone).
7. **Renomear só a caixa no Windows:** `git mv` direto falha
   (`Breakout`→`breakout`); passe por um nome temporário.
8. **Mudou um jogo, teste os três:** `auth.js` e `style.css` são
   compartilhados, e `auth.js` decide qual recorde mostrar por `<body data-jogo>`.
