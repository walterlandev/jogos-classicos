# Etapa 3c — Snake: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Snake com 15 mapas + gerados, metas de frutas por fase, bordas abertas/fechadas, 3 vidas, fruta dourada, deslizar no campo e ranking novo.

**Architecture:** Regras puras em `logica/cobra.js` (testadas em `tests/cobra.test.js`); cor `parede` nova em `logica/temas.js`; `snake.js` cuida de tique, desenho e entrada.

**Tech Stack:** JS puro (ES modules), canvas 2D, Firebase 10.7.1, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-08-etapa-3c-snake-design.md`

## Global Constraints

- Canvas 400×400 (20 px por célula); cores só de `paleta()`.
- Página cabe em 390×844 e 1366×800 sem rolar, nos três temas.

---

### Task 1: Regras puras (TDD)

**Produces (`cobra.js`):** `GRADE`, `DIRECOES`, `enfileirar` (sem mudança), `passo(cobra, dir, comida, grade, { aberta = false, paredes = new Set() } = {})`, `celulaLivre(cobra, grade, aleatorio, bloqueadas = new Set())`, `MAPAS` (15), `montarMapa(fase, aleatorio) → { aberta, paredes: Set<"x,y">, inicio: { x, y } }`, `metaDaFase`, `intervaloDaFase`, `pontosFruta(fase, dourada)`, `bonusFase(fase)`, `fasesIniciais(max)`. Saem `nivelPorPontos`, `intervaloDoNivel`, `marcoDeBonus`.
**`temas.js`:** chave `parede` em cada paleta.

- [ ] Testes em `tests/cobra.test.js` e `tests/temas.test.js`; falhar; implementar; verde; commit.

### Task 2: auth — `recorde_snake_v2`, cadastro e ranking do menu.

### Task 3: Tela — `snake.html` (placar, seletor de fase, aviso) e `snake.js` (mapas, metas, vidas, dourada, borda, deslizar); verificar 3 temas × PC/celular; commit.

### Task 4: docs, Obsidian; perguntar sobre enviar.
