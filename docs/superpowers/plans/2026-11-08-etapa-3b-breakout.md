# Etapa 3b — Breakout: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Breakout em pé com vidas, 20 fases desenhadas + geradas, tijolos de 1–3 golpes e indestrutíveis, power-ups, raquete pelo dedo/mouse e ranking novo.

**Architecture:** Regras puras em `logica/breakout.js` e `logica/bola.js` (testadas em `tests/breakout.test.js` e `tests/bola.test.js`); `breakout.js` faz laço, física, desenho e entrada.

**Tech Stack:** JS puro (ES modules), canvas 2D, Firebase 10.7.1, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-08-etapa-3b-breakout-design.md`

## Global Constraints

- Canvas 400×560; `--proporcao: 0.7143` na página.
- Cores só de `paleta()`; laço só por rAF com tempo real; física em px/s.
- Página cabe em 390×844 e 1366×800 sem rolar, nos três temas.

---

### Task 1: Regras puras (TDD)

**Files:** Create `public/js/logica/breakout.js`, `tests/breakout.test.js`; modify `public/js/logica/bola.js`, `tests/bola.test.js`.

**Produces (`breakout.js`):** `GRADE = { colunas: 10, largura: 36, altura: 14, espaco: 4, topo: 64, esquerda: 2 }`, `FASES` (20 mapas), `montarFase(n, aleatorio = Math.random) → [{ col, lin, x, y, golpes, max, eterno }]`, `faseConcluida(tijolos)`, `pontosGolpe(tijolo, quebrou)`, `bonusFase(n)`, `vidasGanhas(antes, depois)`, `colisaoCirculoRet(cx, cy, r, x, y, w, h) → null | 'x' | 'y'`, `sortearPoder(aleatorio) → null | 'larga' | 'multi' | 'lenta' | 'vida'`, `fasesIniciais(max)`.
**Produces (`bola.js`):** `velocidadeDaFase(f)`, `aceleracao(rebatidas)`, `rebaterNaRaquete` (inalterada). `velocidadeDoNivel` sai.

- [ ] Escrever `tests/breakout.test.js` e ajustar `tests/bola.test.js`; ver falhar; implementar; verde; commit.

### Task 2: auth — ranking novo e fase máxima

- [ ] `CAMPOS_RECORDE.breakout = 'recorde_breakout_v2'`; cadastro grava `recorde_breakout_v2: 0`; ranking do menu usa o campo novo. Fase máxima usa `salvarNivelMaxDB('breakout', fase)`.

### Task 3: Tela do Breakout

- [ ] `breakout.html`: canvas 400×560, placar Pontos/recorde, Fase, Vidas; camada de início com seletor de fase; aviso; controles só com pausa e dica de arrastar.
- [ ] `breakout.js`: bolas (lista), bola presa até lançar, raquete pelo ponteiro (pointerdown/move no campo) e setas, power-ups caindo e efeitos com tempo, vidas, fase concluída → bônus e próxima fase, avisos, fim de jogo, fase máxima.
- [ ] Verificar nos 3 temas, PC e celular; commit.

### Task 4: Fechamento

- [ ] `npm test`; docs (`CLAUDE.md`, resumo, Obsidian); perguntar sobre enviar.
