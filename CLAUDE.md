# Jogos Clássicos — guia para qualquer sessão nova do Claude Code

Leia isto antes de mexer em qualquer coisa. Para o estado atual, a lista de
arquivos e as pendências, leia `.claude/RESUMO_PROJETO.md` (é curto). Notas,
decisões e diário ficam no Obsidian: `wasobsidia/Projetos/Jogos Clássicos/`.
Mantenha o resumo atualizado quando fizer mudanças relevantes.

## Onde as coisas moram

- **Site estático, sem build:** HTML, CSS e JS puros em `public/`. Cada jogo
  tem `public/<jogo>.html`, `public/css/<jogo>.css`, `public/js/<jogo>.js`
  (tela, laço, controles; ES module) e `public/js/logica/<x>.js` (regras
  puras). `public/css/style.css` é o estilo comum, `public/js/aviso.js` a
  faixa de fim de jogo e `public/index.html` o menu.
- **Login, perfil e ranking:** Firebase Auth + Firestore, projeto
  `jogos-classicos`, tudo em `public/js/auth.js` (SDK 10.7.1 pelo CDN
  `gstatic`). Coleção `usuarios/{uid}` com `nome`, `recorde_tetris`,
  `recorde_snake`, `recorde_breakout` e `data_recorde`.
- **Hospedagem:** Firebase Hosting (`firebase.json` publica `public/`).
- **Repositório:** GitHub `walterlandev/jogos-classicos` (público), remoto
  por HTTPS. O push NÃO publica o site; a publicação é um passo à parte.

## Rodar, testar e publicar

- Testes: `npm test` (Node 24, `node --test`, sem dependências). A lógica pura
  de cada jogo fica em `public/js/logica/` (sem DOM) e é testada em `tests/`.
  Regra nova de jogo entra primeiro ali, com teste.
- Local: `npx serve public` (ou qualquer servidor estático). Abrir o HTML
  direto pelo arquivo não funciona, porque `auth.js` é um módulo ES.
- Publicar: `npx firebase-tools deploy --only hosting` (o CLI não está
  instalado globalmente neste PC). Avise o usuário antes: é produção.

## Regras que não podem ser esquecidas

1. **Nomes de arquivo diferenciam maiúsculas no site publicado.** O Windows
   ignora a caixa e o Firebase Hosting não: `snake.png` em vez de
   `Snake.png` funciona aqui e quebra no ar. Confira cada `href`/`src`
   contra o nome exato do arquivo. Nomes novos: tudo em minúsculas.
2. **O recorde é gravado pelo navegador** (`auth.js`, `updateDoc`), então
   o ranking pode ser forjado por quem abrir o console. Sem backend, a
   defesa possível são as regras do Firestore (só o dono escreve, recorde
   numérico, só pode subir). As regras atuais **não estão no repositório**:
   antes de mudar algo de banco, traga-as para `firestore.rules`.
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
6. **Mudou um jogo, teste os três:** `auth.js` e `style.css` são
   compartilhados, e `auth.js` decide qual recorde mostrar pela URL.
