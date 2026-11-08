# Etapa 3a — Blockix: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Blockix com saco de 7, fantasma, queda instantânea, guardar, fila de 3, tempo de encaixe, pontuação com combos, curva de velocidade, Maratona e nível inicial liberável; ranking em `recorde_blockix`.

**Architecture:** Regras novas em `public/js/logica/blocos.js` (puras, testadas); `blockix.js` cuida de laço, tempo de encaixe, desenho e controles; `auth.js` grava recorde e nível máximo.

**Tech Stack:** JS puro (ES modules), canvas 2D, Firebase 10.7.1, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-08-etapa-3a-blockix-design.md`

## Global Constraints

- Cores só de `paleta()`; ícones SVG próprios; laço só por rAF com tempo real.
- Página de jogo cabe em 390×844 sem rolar, nos três temas.
- `recorde_blockix` para o Blockix; `recorde_tetris` não é mais escrito.

---

### Task 1: Regras puras novas (TDD)

**Files:** Modify `public/js/logica/blocos.js`, `tests/blocos.test.js`

**Produces:** `novoSaco(aleatorio = Math.random) → string[7]`, `pontuar(qtd, nivel, estado = { combo: -1, b2b: false }) → { pontos, combo, b2b, quatroSeguidas }`, `nivelPorLinhas(total, inicial = 1)`, `intervaloQueda(nivel)`, `linhaFantasma(tabuleiro, matriz, pos) → y`, `niveisIniciais(nivelMax) → number[]`, `PONTOS_QUEDA = { suave: 1, instantanea: 2 }`. `pontosPorLinhas` deixa de existir.

- [ ] Testes (substituem os de pontos/velocidade antigos):

```js
test('saco de 7 tem uma peça de cada', () => {
    const saco = novoSaco();
    assert.equal(saco.length, 7);
    assert.deepEqual([...saco].sort(), [...'IJLOSTZ']);
});

test('pontuar: tabela, combo e quatro linhas seguidas', () => {
    let e = { combo: -1, b2b: false };
    let r = pontuar(1, 2, e);
    assert.deepEqual(r, { pontos: 200, combo: 0, b2b: false, quatroSeguidas: false });
    r = pontuar(2, 2, r);                 // segunda limpeza seguida: combo 1
    assert.equal(r.pontos, 600 + 100);
    r = pontuar(0, 2, r);                 // peça sem linha zera o combo
    assert.equal(r.combo, -1);
    r = pontuar(4, 1, r);
    assert.equal(r.pontos, 800);
    assert.equal(r.b2b, true);
    r = pontuar(4, 1, r);                 // quatro seguidas de quatro: ×1,5 + combo 1
    assert.equal(r.pontos, 1200 + 50);
    assert.equal(r.quatroSeguidas, true);
    r = pontuar(1, 1, r);                 // limpeza menor quebra a sequência
    assert.equal(r.b2b, false);
});

test('nível com início escolhido e curva de velocidade', () => {
    assert.equal(nivelPorLinhas(0), 1);
    assert.equal(nivelPorLinhas(25), 3);
    assert.equal(nivelPorLinhas(25, 10), 12);
    assert.equal(intervaloQueda(1), 1000);
    assert.equal(intervaloQueda(5), 522);
    assert.equal(intervaloQueda(20), 50);
    assert.equal(intervaloQueda(99), 50);
});

test('fantasma cai até o chão ou até um bloco', () => {
    const t = criarMatriz(10, 20);
    const o = criarPeca('O');
    assert.equal(linhaFantasma(t, o, { x: 4, y: 0 }), 18);
    fundir(t, o, { x: 4, y: 18 });
    assert.equal(linhaFantasma(t, o, { x: 4, y: 0 }), 16);
});

test('níveis iniciais liberados', () => {
    assert.deepEqual(niveisIniciais(1), [1]);
    assert.deepEqual(niveisIniciais(7), [1, 5]);
    assert.deepEqual(niveisIniciais(23), [1, 5, 10, 15, 20]);
});
```

- [ ] Implementar; `npm test` verde; commit.

### Task 2: auth — campo novo e nível máximo

- [ ] `CAMPOS_RECORDE.blockix = 'recorde_blockix'`; cadastro grava `recorde_blockix: 0`; ranking do menu ordena por `recorde_blockix`.
- [ ] `window.salvarNivelMaxDB(jogo, nivel)`: grava `nivel_max_<jogo>` se maior. Ao carregar o perfil, dispara `perfilcarregado` (`detail: dados`).
- [ ] Commit junto com a Task 3.

### Task 3: Blockix — mecânicas, encaixe, desenho, avisos, controles

- [ ] Fila com saco de 7 (repor quando < 4), guardar (uma vez por peça), queda instantânea (2 pts/linha), queda suave (1 pt/linha), tempo de encaixe 500 ms com até 15 reinícios, fantasma (contorno 2 px com a cor da peça), brilho das linhas limpas 250 ms, avisos no `.aviso-jogo`.
- [ ] Placar: Pontos + "Recorde X", Nível + "N linhas", Guardada, Próxima; fila (2ª e 3ª) só no PC.
- [ ] Camada de início com `<select>` de nível inicial (`niveisIniciais`); nível máximo do navegador (`localStorage`) mesclado com o do perfil.
- [ ] Teclas: ←/→/↓, ↑ e X girar, Z gira ao contrário, Espaço cai, C/Shift guarda, P/Esc pausa. Toque: Guardar, Pausa, Cair (linha pequena) + Esquerda, Descer, Direita, Girar.
- [ ] Verificar nos 3 temas, PC e celular; commit.

### Task 4: Fechamento

- [ ] `npm test`; checagem 3 temas × PC/celular; console limpo.
- [ ] `CLAUDE.md`, resumo, Obsidian; perguntar sobre juntar na `main`.
