# Jogos Clássicos — resumo do projeto

Resumo curto para começar uma sessão sem ler tudo. Regras de trabalho:
`CLAUDE.md`. Notas e diário: Obsidian, `wasobsidia/Projetos/Jogos Clássicos/`.

Atualizado em: 08/11/2026 (GitHub `main` = commits antigos + documentação).

## O que é

Site com jogos clássicos no navegador (Tetris, Snake e Breakout), login por
email e senha, recorde por jogo e ranking dos 10 melhores, no Firebase.

## Arquivos

| Parte | Arquivos |
|---|---|
| Menu, login e cadastro | `public/index.html`, `public/css/style.css` |
| Firebase (auth, recorde, ranking) | `public/js/auth.js` |
| Tetris | `public/tetris.html`, `css/tetris.css`, `js/tetris.js` |
| Snake | `public/snake.html`, `css/snake.css`, `js/snake.js` |
| Breakout | `public/Breakout.html`, `css/Breakout.css`, `js/Breakout.js` |
| Imagens do menu | `public/assets/` (`jogo.png`, `Snake.png`, `Brekout.png`, `jogador.png`) |
| Hospedagem | `firebase.json`, `.firebaserc` (projeto `jogos-classicos`) |

## Estado atual

- Projeto trazido de outro PC; ligado ao GitHub em 08/11/2026.
- **Trabalho local sem commit:** Breakout novo, `tetris.css` substituindo
  `tetris-pc.css` e `tetris-cel.css`, remoção de `404.html` e de
  `snake.png`, ajustes em `auth.js`, nos jogos e no menu.

## Pendências

- Revisar e commitar o trabalho local.
- Trazer as regras do Firestore para o repositório e travar o recorde
  (hoje o navegador grava qualquer valor).
- Padronizar os nomes de arquivo em minúsculas (`Breakout.*`, `Snake.png`,
  `Brekout.png` com erro de digitação).
- Sem `PRODUCT.md` nem `DESIGN.md` (a skill impeccable sugere `init` e
  `document`).
