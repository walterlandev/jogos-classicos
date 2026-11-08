# Jogos Clássicos — resumo do projeto

Resumo curto para começar uma sessão sem ler tudo. Regras de trabalho:
`CLAUDE.md`. Notas e diário: Obsidian, `wasobsidia/Projetos/Jogos Clássicos/`.

Atualizado em: 08/11/2026 (Etapa 2 — temas — concluída).

## O que é

Site com jogos clássicos no navegador (Blockix, Snake e Breakout) e três temas visuais à escolha do jogador, login por
email e senha, recorde por jogo e ranking dos 10 melhores, no Firebase.

## Arquivos

| Parte | Arquivos |
|---|---|
| Menu, login e cadastro | `public/index.html`, `js/menu.js` |
| Temas | `css/base.css`, `css/temas/*.css`, `js/temas.js`, `js/logica/temas.js`, `DESIGN.md` |
| Firebase (auth, recorde, ranking, tema do perfil) | `public/js/auth.js` |
| Comuns dos jogos | `js/aviso.js` (fim de jogo), `js/controles.js` (toque) |
| Blockix | `public/blockix.html`, `js/blockix.js`, `js/logica/blocos.js` |
| Snake | `public/snake.html`, `js/snake.js`, `js/logica/cobra.js` |
| Breakout | `public/breakout.html`, `js/breakout.js`, `js/logica/bola.js` |
| Testes | `tests/*.test.js` (`npm test`) |
| Hospedagem | `firebase.json`, `.firebaserc` (projeto `jogos-classicos`) |
| Plano de melhoria | `docs/superpowers/specs/2026-11-08-melhoria-jogos-design.md` (roteiro das etapas) |

## Estado atual

- **Etapa 1 (consertos) feita:** blocos não travam mais após pausa/recomeço
  nem acabam à toa; Snake salva recorde, mostra nível, bônus expira, sem
  meia-volta, com pausa; Breakout igual em 60 e 144 Hz, rebatida com ângulo;
  ranking sem XSS; fim de jogo sem alert/reload. 13 testes.
- **Etapa 2 (temas) feita:** três temas grátis (Fliperama, padrão;
  Cartucho; LCD), troca ao vivo, salva no navegador e no perfil; moldura
  comum; jogos cabem no celular sem rolar; "Tetris" virou **Blockix**
  (redirect 301 de `/tetris.html` e `/Breakout.html`); login sem alert.
- Próxima: **Etapa 3** — fases em cada jogo (3a Blockix, 3b Breakout, 3c
  Snake). No Breakout, pensar em campo em pé para celular.

## Pendências

- Etapas 2 a 5 do roteiro (ver o plano de melhoria acima).
- Trazer as regras do Firestore para o repositório e travar o recorde
  (hoje o navegador grava qualquer valor).
- Arquivos antigos sem uso aguardando OK para remover: `css/style.css`,
  `css/tetris.css`, `css/snake.css`, `css/Breakout.css` e `public/assets/*`.
- Etapa 6: loja (PIX) para temas e níveis difíceis; exige servidor.
