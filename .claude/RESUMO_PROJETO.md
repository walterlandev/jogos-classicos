# Jogos Clássicos — resumo do projeto

Resumo curto para começar uma sessão sem ler tudo. Regras de trabalho:
`CLAUDE.md`. Notas e diário: Obsidian, `wasobsidia/Projetos/Jogos Clássicos/`.

Atualizado em: 08/11/2026 (Etapa 1 — consertos — concluída).

## O que é

Site com jogos clássicos no navegador (Tetris, Snake e Breakout), login por
email e senha, recorde por jogo e ranking dos 10 melhores, no Firebase.

## Arquivos

| Parte | Arquivos |
|---|---|
| Menu, login e cadastro | `public/index.html`, `public/css/style.css` |
| Firebase (auth, recorde, ranking) | `public/js/auth.js` |
| Faixa de fim de jogo | `public/js/aviso.js` |
| Blocos ("Tetris") | `public/tetris.html`, `css/tetris.css`, `js/tetris.js`, `js/logica/blocos.js` |
| Snake | `public/snake.html`, `css/snake.css`, `js/snake.js`, `js/logica/cobra.js` |
| Breakout | `public/Breakout.html`, `css/Breakout.css`, `js/Breakout.js`, `js/logica/bola.js` |
| Testes | `tests/*.test.js` (`npm test`) |
| Imagens do menu | `public/assets/` (`jogo.png`, `Snake.png`, `Brekout.png`, `jogador.png`) |
| Hospedagem | `firebase.json`, `.firebaserc` (projeto `jogos-classicos`) |
| Plano de melhoria | `docs/superpowers/specs/2026-11-08-melhoria-jogos-design.md` (roteiro das etapas) |

## Estado atual

- **Etapa 1 (consertos) feita:** blocos não travam mais após pausa/recomeço
  nem acabam à toa; Snake salva recorde, mostra nível, bônus expira, sem
  meia-volta, com pausa; Breakout igual em 60 e 144 Hz, rebatida com ângulo;
  ranking sem XSS; fim de jogo sem alert/reload. 13 testes.
- Próxima: **Etapa 2** — identidade visual nova, nome próprio do jogo de
  blocos, moldura comum, layout que cabe no celular, fonte com acentos.

## Pendências

- Etapas 2 a 5 do roteiro (ver o plano de melhoria acima).
- Trazer as regras do Firestore para o repositório e travar o recorde
  (hoje o navegador grava qualquer valor).
- Padronizar os nomes de arquivo em minúsculas (`Breakout.*`, `Snake.png`,
  `Brekout.png` com erro de digitação).
- Sem `PRODUCT.md` nem `DESIGN.md` (a skill impeccable sugere `init` e
  `document`).
