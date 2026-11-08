# Etapa 4 — Nível do jogador: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** XP, nível da conta, 15 conquistas, ranking Geral e tema "Lousa da escola" liberado no nível 10.

**Architecture:** Regras puras em `logica/progresso.js` e `logica/temas.js` (testadas); `js/progresso.js` guarda/mescla e publica; jogos chamam `registrarPartida(jogo, resumo)` no fim; menu mostra nível e conquistas; `auth.js` grava `progresso` e `xp`.

**Tech Stack:** JS puro (ES modules), Firebase 10.7.1, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-08-etapa-4-nivel-design.md`

## Global Constraints

- Sem `innerHTML` com dado de jogador; ícones SVG próprios.
- Todo tema define todas as variáveis do `fliperama.css`.
- Páginas cabem em 390×844 e 1366×800 nos quatro temas.

---

### Task 1: Regras puras (TDD) — `progresso.js` (`xpDaPartida`, `xpTotalParaNivel`, `nivelDaConta`, `novoProgresso`, `aplicarPartida`, `mesclar`, `CONQUISTAS`) e `temas.js` (tema `lousa` com `nivelMinimo: 10`; `podeUsar(id, itens, nivel)`, `resolverTema(salvo, itens, nivel)`).

### Task 2: `js/progresso.js` + `auth.js` (`salvarProgressoDB`, ranking Geral, nível ao lado do nome) + `temas.js` navegador (`definirNivelConta`, seletor com bloqueio) + `aviso.js` (linhas extras).

### Task 3: Jogos enviam o resumo e mostram XP/conquistas no fim.

### Task 4: Menu (faixa de nível, painel de conquistas, aba Geral) + tema Lousa (CSS, fontes, DESIGN.md).

### Task 5: Verificação, docs, Obsidian.
