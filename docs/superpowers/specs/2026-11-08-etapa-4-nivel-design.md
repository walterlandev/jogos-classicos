# Etapa 4 — Nível do jogador, conquistas e tema "Lousa da escola"

Data: 2026-11-08. Aprovado pelo usuário em conversa.

## Decisões do usuário

- XP somada dos três jogos, nível da conta e 15 conquistas.
- Ranking: aba **"Geral" por XP** e **nível ao lado do nome** em todos os rankings.
- Recompensa: **4º tema liberado no nível 10** da conta ("Lousa da escola").

## XP e nível (lógica pura em `public/js/logica/progresso.js`)

- Partida: 10 XP. Blockix: 2 por linha. Breakout: 1 por tijolo + 20 por
  fase concluída. Snake: 2 por fruta + 20 por fase concluída.
- XP total para o nível n: `50 × (n − 1) × n` (2 = 100, 10 = 4.500,
  20 = 19.000). Sem teto.
- Progresso: `{ xp, conquistas: [ids], est: { partidas, jogos: [ids],
  linhas, tijolos } }`. Mescla (navegador × perfil): maior XP, união das
  conquistas e dos jogos, maior de cada contador.

## Conquistas (15)

| Jogo | Conquista |
|---|---|
| Blockix | Primeira linha; Quatro linhas de uma vez; Combo ×5; Nível 10 numa partida; 100 linhas no total |
| Breakout | Primeira fase concluída; Fase 10; Pegar a multibola; 1.000 tijolos no total |
| Snake | Fase 5; Fruta dourada; Cobra com 30 partes |
| Geral | Jogar os três jogos; 50 partidas; Nível 10 da conta |

## Resumo de partida enviado por cada jogo

- Blockix: `{ linhas, quatros, maiorCombo, nivelMax }`
- Breakout: `{ tijolos, fasesConcluidas, faseMax, pegouMulti }`
- Snake: `{ frutas, fasesConcluidas, faseMax, douradas, maiorTamanho }`

## Persistência

- Navegador: `localStorage.progresso`. Perfil: campo `progresso` e `xp`
  (no topo, para ordenar o ranking). Ao entrar, mescla e grava.
- XP é gravada pelo navegador (forjável até a Etapa 5).

## Tela

- Menu: faixa de nível no topo (número, barra, "120 de 300 XP para o nível 4");
  painel de conquistas (obtidas e bloqueadas, ícones SVG).
- Ranking: aba "Geral" (XP); nível ao lado do nome em todas as abas.
- Fim de partida: "+N XP", subida de nível e conquistas novas na faixa.

## Tema "Lousa da escola" (`lousa`)

- Quadro verde-escuro, giz branco e colorido, moldura de madeira.
- Fontes: Cabin Sketch (títulos, números), Patrick Hand (texto).
- `nivelMinimo: 10`. `podeUsar(id, itens, nivelConta)`; no seletor aparece
  bloqueado com "Libera no nível 10".

## Verificação

`npm test`; navegador: partida dá XP, nível e barra no menu, conquista
aparece, aba Geral, tema bloqueado abaixo do 10 e liberado com nível 10
(forçado no teste), 4 temas × páginas cabem e sem erros.
