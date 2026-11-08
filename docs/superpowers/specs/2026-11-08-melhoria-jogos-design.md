# Melhoria dos jogos — roteiro e Etapa 1 (consertos)

Data: 2026-11-08. Aprovado pelo usuário em conversa.

## Objetivo

Deixar os três jogos funcionais, com uma apresentação de identidade própria e
uma progressão que sustente horas de jogo.

## Decisões do usuário

- Ordem: consertar → identidade visual nova → fases em cada jogo → nível do
  jogador → ranking seguro e acabamento.
- Identidade visual **nova** (não refinar o neon atual).
- Progressão: fases em cada jogo **e** nível do jogador (XP somado entre os
  jogos, conquistas).
- O jogo de blocos ganha **nome próprio** ("Tetris" é marca registrada). O
  campo `recorde_tetris` continua no banco.

## Roteiro

| Etapa | Entrega |
|---|---|
| 0 | Commit do trabalho local como base (`f1f5320`). |
| 1 | Consertos (este documento). Sem mudança visual. |
| 2 | Direção visual nova (2-3 propostas), `DESIGN.md`, nome do jogo de blocos, moldura comum (`shell.css`/`shell.js`), menu redesenhado, layout que cabe no celular. |
| 3a | Blocos: 7-bag, fantasma, guardar peça, queda instantânea, repetição ao segurar, pontuação por linhas/combos, nível a cada 10 linhas, maratona. |
| 3b | Breakout: 3 vidas, lançamento da raquete, mouse/toque, 20 fases + geradas, tijolos de 1-3 golpes e indestrutíveis, power-ups, vida extra. |
| 3c | Snake: fases com mapas e obstáculos, meta de frutas por fase. |
| 4 | Nível do jogador: XP dos três jogos, nível da conta, ~15 conquistas, nível no menu e ranking. |
| 5 | `firestore.rules` versionado e travando o recorde, sons, efeitos, auditoria de acessibilidade. |

Cada etapa a partir da 2 recebe a própria especificação antes de começar.

## Etapa 1 — consertos

### Arquitetura

A lógica pura de cada jogo sai do arquivo de tela para um módulo próprio, sem
DOM nem canvas, testável com `node --test` (sem dependências, sem
`package.json` além do necessário para `"type"`):

- `public/js/logica/blocos.js` — matriz, colisão, rotação, varredura de
  linhas, pontuação e nível.
- `public/js/logica/cobra.js` — fila de direções, passo da cobra, bônus.
- `public/js/logica/bola.js` — passo da bola por tempo, rebatida na raquete.

Os módulos são ES modules. Os scripts de tela passam a ser carregados com
`type="module"` e expõem em `window` só o que o HTML chama (`startGame`,
`togglePause`, `handleInput`, `handleMove`). Testes em `tests/*.test.js`.

### Correções

**Comum**
- Ranking montado com `textContent` (fim do XSS pelo apelido).
- Erro do ranking mostra "Ranking indisponível", não "Carregando..." eterno.
- `salvarRecordeDB(pontos, jogo)` retorna `true` quando há recorde novo; não
  usa `alert` nem recarrega a página. O recorde exibido é atualizado na hora.
- Fim de jogo sem `alert`: uma faixa dentro da área do jogo com a pontuação e
  "Recorde novo!" quando for o caso (estilo mínimo, o visual é da Etapa 2).
- `<footer>` dentro do `<body>` nas quatro páginas.

**Blocos**
- O laço usa o timestamp do `requestAnimationFrame`; ao iniciar e ao sair da
  pausa o relógio é zerado no primeiro quadro (fim da peça travada).
- Linhas são apagadas antes de nascer a peça nova (fim do fim de jogo falso).
- Teclas do jogo chamam `preventDefault` (setas e espaço não rolam a página);
  `event.key` no lugar de `keyCode`.
- Próxima peça centralizada e escalada ao tamanho de cada quadrinho.
- A pontuação e o nível continuam simples nesta etapa, mas o nível deixa de
  depender da própria pontuação: sobe a cada 10 linhas.

**Snake**
- Salva o recorde ao fim do jogo (`salvarRecordeDB(pontos, 'snake')`).
- Nível e recorde aparecem (id do HTML corrigido; recorde lido do banco).
- Bônus expira de fato: só reaparece no próximo múltiplo de 20 alcançado.
- Fila de até 2 comandos; cada um é validado contra a direção anterior na
  fila (sem meia-volta).
- Grade lógica fixa de 20×20; o redimensionamento muda só a escala do
  desenho e não reinicia nada.
- Pausa com P e Esc.

**Breakout**
- Movimento por tempo real (velocidade em px/s × delta), igual em 60 e 144 Hz.
- Rebatida na raquete com ângulo entre 20° e 160° e velocidade constante
  do nível.
- Placar de celular escondido no PC.
- "VOCÊ VENCEU" mostrado na faixa de fim de jogo.

### Fora da Etapa 1

Vidas, fases novas, power-ups, visual, nome novo, regras do Firestore.

### Verificação

1. `node --test tests/` passa.
2. No navegador, em 1366×800 e 390×844: cada jogo inicia, pausa, volta,
   termina e recomeça; o recorde salva; sem erros no console.
