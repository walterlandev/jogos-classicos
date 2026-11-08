# Etapa 2 — Temas, moldura comum e Blockix: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O jogador escolhe entre três temas (Fliperama, Cartucho, LCD) que vestem menu e jogos; os jogos usam uma moldura comum que cabe no celular; o jogo de blocos vira Blockix.

**Architecture:** Registro puro de temas (`logica/temas.js`) + aplicação no navegador (`temas.js`) que define `data-tema` e publica a paleta do canvas. `base.css` só usa variáveis; `temas/<id>.css` dá os valores e o acabamento. As três páginas de jogo compartilham a mesma estrutura de HTML.

**Tech Stack:** HTML/CSS/JS puros (ES modules), Firebase 10.7.1 via CDN, Google Fonts (Bungee, Barlow Semi Condensed, Rubik Mono One, Rubik, Pixelify Sans, IBM Plex Sans Condensed), `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-08-etapa-2-temas-design.md`

## Global Constraints

- Tema padrão: `fliperama`. Ids: `fliperama`, `cartucho`, `lcd`. Os três `gratis: true`.
- Campo do banco do Blockix continua `recorde_tetris`.
- Ícones em SVG inline próprios; nenhum caractere unicode como ícone; nada de emoji.
- Sem `shadowBlur` nos canvas. Contraste de texto ≥ 4,5:1.
- Celular (390×844): página de jogo cabe em `100dvh` sem rolagem.
- Não apagar arquivos antigos sem OK do usuário (só deixar de referenciar).

---

### Task 1: Registro de temas (lógica pura + testes)

**Files:** Create `public/js/logica/temas.js`, `tests/temas.test.js`

**Produces:** `TEMAS`, `TEMA_PADRAO`, `IDS_TEMAS`, `podeUsar(id, itensLiberados = [])`, `resolverTema(salvo, itensLiberados = [])`.
Cada tema: `{ id, nome, descricao, gratis, amostra: [cores], canvas: { fundo, vazio, pecas: [null, 7 cores], cobra, cabeca, comida, bonus: [2 cores], tijolos: [5 cores], bola, raquete, texto } }`.

- [ ] Testes (falham primeiro):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMAS, TEMA_PADRAO, IDS_TEMAS, podeUsar, resolverTema } from '../public/js/logica/temas.js';

test('os três temas existem, são grátis e têm paleta completa', () => {
    assert.deepEqual(IDS_TEMAS, ['fliperama', 'cartucho', 'lcd']);
    assert.equal(TEMA_PADRAO, 'fliperama');
    for (const id of IDS_TEMAS) {
        const c = TEMAS[id].canvas;
        assert.equal(TEMAS[id].gratis, true);
        assert.equal(c.pecas.length, 8);
        assert.equal(c.tijolos.length, 5);
        assert.equal(c.bonus.length, 2);
        for (const k of ['fundo', 'cobra', 'cabeca', 'comida', 'bola', 'raquete', 'texto'])
            assert.match(c[k], /^#[0-9a-f]{6}$/i, `${id}.${k}`);
    }
});

test('podeUsar: grátis sempre; pago só se liberado; inexistente nunca', () => {
    assert.equal(podeUsar('lcd'), true);
    assert.equal(podeUsar('nao-existe'), false);
    TEMAS.teste_pago = { ...TEMAS.lcd, id: 'teste_pago', gratis: false };
    try {
        assert.equal(podeUsar('teste_pago'), false);
        assert.equal(podeUsar('teste_pago', ['tema:teste_pago']), true);
    } finally { delete TEMAS.teste_pago; }
});

test('resolverTema cai no padrão quando o salvo é inválido', () => {
    assert.equal(resolverTema('cartucho'), 'cartucho');
    assert.equal(resolverTema(null), 'fliperama');
    assert.equal(resolverTema('<script>'), 'fliperama');
});
```

- [ ] Implementar; `npm test` verde; commit `Temas: registro e regras de uso`.

### Task 2: Aplicação de temas no navegador + CSS base e dos três temas + DESIGN.md

**Files:** Create `public/js/temas.js`, `public/css/base.css`, `public/css/temas/fliperama.css`, `cartucho.css`, `lcd.css`, `DESIGN.md`

**Produces (`temas.js`):** `aplicarTema(id, { salvar = true } = {})`, `temaAtual()`, `paleta()`, `aoMudarTema(fn)`, `montarSeletor(container)`; evento `window` `temamudou` (`detail: { id }`); variáveis CSS `--c-fundo`, `--c-vazio`, `--c-peca-1..7`, `--c-cobra`, `--c-comida`, `--c-tijolo-1..5`, `--c-bola`, `--c-raquete` no `<html>`.
Script de cabeça (inline em cada página, antes do CSS):
`<script>try{var t=localStorage.getItem('tema');if(/^[a-z_]+$/.test(t))document.documentElement.dataset.tema=t}catch(e){}</script>` e `<html data-tema="fliperama">` como padrão.

- [ ] `base.css`: reset, tokens de layout (espaços, raios por tema via variável), componentes `.topo`, `.marca`, `.botao` (+ `.botao-primario`, `.botao-icone`), `.placar`/`.placar-item`, `.campo` (canvas `max-width:100%; max-height:100%; width:auto; height:auto`), `.camada` (início/pausa), `.fim-de-jogo`, `.controles`, `.maquinas`/`.maquina`, `.ranking` + abas, `.seletor-tema`, `dialog`, formulários, `.mensagem` (erro/sucesso). Layout de jogo: grid `100dvh` (topo / placar / campo 1fr / controles) no celular; no PC campo central com placar ao lado. Foco visível, `::selection`, `scrollbar-color`, `prefers-reduced-motion`.
- [ ] Cada `temas/<id>.css` em `[data-tema="<id>"]`: fontes, cores de superfície/texto/acento, raio, borda e acabamento (fliperama: letreiro vermelho com sublinhado amarelo, máquina = gabinete de madeira com marquise, botão primário = ficha amarela; cartucho: contorno 3px tinta, sombra dura 6px, rótulo em faixa diagonal; lcd: corpo grafite, campo como tela LCD com moldura, botões redondos laranja).
- [ ] `DESIGN.md`: os três mundos, tokens (cores com hex, fontes, raios), regras (o que cada tema pode e não pode).
- [ ] Verificação visual vem nas Tasks 3–6. Commit `Temas: aplicação, CSS base e os três temas`.

### Task 3: Menu novo

**Files:** Modify `public/index.html`, `public/js/auth.js`

- [ ] `index.html`: cabeçalho (marca + conta), seção de jogos (3 `.maquina` com miniatura CSS usando `--c-*`, recorde do jogador `[data-recorde="blockix|snake|breakout"]`, link "Jogar"), ranking com abas (`role="tablist"`, um `<tbody>` por jogo, só um visível), seletor de tema, rodapé. Dialogs de login/cadastro com `<p class="mensagem" role="alert">`.
- [ ] `auth.js`: `CAMPOS_RECORDE = { blockix: 'recorde_tetris', tetris: 'recorde_tetris', snake: 'recorde_snake', breakout: 'recorde_breakout' }`; mostra recordes em `[data-recorde]` e, na página de jogo, em `#userScore` conforme `document.body.dataset.jogo`; login/cadastro escrevem na `.mensagem` em vez de `alert` (mensagens: "E-mail ou senha incorretos.", "Confirme seu e-mail pelo link que enviamos e entre de novo.", "Conta criada. Enviamos um link de confirmação para <email>.", erros do Firebase traduzidos para os códigos `auth/email-already-in-use`, `auth/weak-password`, `auth/invalid-email`); ao entrar, aplica `dados.tema` se `podeUsar(dados.tema, dados.itens_liberados)`; `aoMudarTema` grava `{ tema }` no perfil quando logado.
- [ ] Verificar nos 3 temas (PC e celular), troca ao vivo, abas, dialogs. Commit `Menu novo com seletor de tema`.

### Task 4: Blockix na moldura comum

**Files:** `git mv public/tetris.html public/blockix.html`, `git mv public/js/tetris.js public/js/blockix.js`; modify ambos e `firebase.json`

- [ ] HTML na moldura comum (`body data-jogo="blockix"`), placar Pontos/Nível/Recorde/Próxima, camadas de início e pausa, controles SVG (girar, esquerda, baixo, direita, pausa). Controles com `pointerdown` e repetição ao segurar para esquerda/direita/baixo (atraso 170 ms, repetição 50 ms).
- [ ] `blockix.js`: cores de `paleta()` (`pecas`, `fundo`, `vazio` desenha a grade se não for null); `aoMudarTema(() => { draw(); drawNextPiece(); })`; um único canvas de próxima peça; salvar com `'blockix'`.
- [ ] `firebase.json`: `"redirects": [{ "source": "/tetris.html", "destination": "/blockix.html", "type": 301 }, { "source": "/Breakout.html", "destination": "/breakout.html", "type": 301 }]`.
- [ ] Verificar nos 3 temas, PC e celular (sem rolagem), jogar até o fim. Commit `Blockix: novo nome e moldura comum`.

### Task 5: Snake na moldura comum

**Files:** Modify `public/snake.html`, `public/js/snake.js`

- [ ] HTML na moldura (`data-jogo="snake"`), placar Pontos/Nível/Recorde, camadas, cruz de direção SVG + pausa.
- [ ] `snake.js`: canvas fixo 400×400 (20 px por célula; o CSS escala), sem `resize`; cores de `paleta()` (`cobra`, `cabeca`, `comida`, `bonus` alternando a cada tique), camada de pausa em HTML; redesenha em `temamudou`.
- [ ] Verificar nos 3 temas, PC e celular. Commit `Snake: moldura comum`.

### Task 6: Breakout na moldura comum

**Files:** `git mv public/Breakout.html public/breakout.html`, `git mv public/js/Breakout.js public/js/breakout.js`; modify ambos

- [ ] HTML na moldura (`data-jogo="breakout"`), placar Pontos/Fase/Recorde, camadas, controles SVG esquerda/direita (segurar) + pausa.
- [ ] `breakout.js`: cores de `paleta()` (`tijolos`, `bola`, `raquete`, `fundo`); redesenha em `temamudou`.
- [ ] Verificar nos 3 temas, PC e celular. Commit `Breakout: novo nome e moldura comum`.

### Task 7: Revisão e fechamento

- [ ] Revisão `web-design-guidelines` nas 4 páginas; corrigir achados.
- [ ] `npm test`; checagem final nos 3 temas × 4 páginas × 2 tamanhos; console limpo.
- [ ] Atualizar `CLAUDE.md`, `.claude/RESUMO_PROJETO.md`, Obsidian. Perguntar ao usuário sobre remover `style.css`, `tetris.css`, `snake.css`, `Breakout.css` e as imagens antigas.
