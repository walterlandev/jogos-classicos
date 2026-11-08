# Etapa 1 — Consertos: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os bugs que impedem jogar (travamento, fim falso, recorde não salvo, física dependente da tela) e o XSS do ranking, sem mudar o visual.

**Architecture:** A lógica pura de cada jogo vai para `public/js/logica/*.js` (ES modules sem DOM), coberta por `node --test`. Os scripts de tela viram `type="module"`, importam essa lógica e expõem em `window` só o que o HTML chama. Uma faixa de fim de jogo comum (`public/js/aviso.js`) substitui os `alert`.

**Tech Stack:** HTML/CSS/JS puros, Firebase 10.7.1 via CDN, Node 24 (`node --test`).

**Spec:** `docs/superpowers/specs/2026-11-08-melhoria-jogos-design.md`

## Global Constraints

- Sem dependências npm; `package.json` só com `"type": "module"` e o script de teste.
- Nada visual além da faixa de fim de jogo mínima; o redesign é a Etapa 2.
- Campos do banco inalterados: `recorde_tetris`, `recorde_snake`, `recorde_breakout`, `nome`.
- Nomes de arquivo novos em minúsculas.
- Pontuação continua na mesma escala (o ranking existente segue comparável).

---

### Task 1: Base comum — testes, ranking seguro, recorde sem alert, faixa de fim de jogo

**Files:**
- Create: `package.json`, `public/js/aviso.js`
- Modify: `public/js/auth.js` (salvarRecordeDB, carregarRanking), `public/css/style.css` (faixa), as 4 páginas (`<footer>` dentro do `<body>`)

**Interfaces:**
- Produces: `window.salvarRecordeDB(pontos: number, jogo: 'tetris'|'snake'|'breakout') → Promise<boolean>` (true = recorde novo; atualiza `#userScore`).
- Produces: `mostrarFimDeJogo(area: HTMLElement, { titulo: string, pontos: number, recordeNovo: boolean })`, `esconderFimDeJogo(area: HTMLElement)` em `public/js/aviso.js`.

- [ ] **Step 1:** `package.json`:

```json
{
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test tests/" }
}
```

- [ ] **Step 2:** `public/js/aviso.js`:

```js
export function mostrarFimDeJogo(area, { titulo, pontos, recordeNovo }) {
    let faixa = area.querySelector('.fim-de-jogo');
    if (!faixa) {
        faixa = document.createElement('div');
        faixa.className = 'fim-de-jogo';
        faixa.setAttribute('role', 'status');
        area.appendChild(faixa);
    }
    const linha = (texto, classe) => {
        const p = document.createElement('p');
        p.textContent = texto;
        if (classe) p.className = classe;
        return p;
    };
    faixa.replaceChildren(linha(titulo, 'fim-titulo'), linha(`${pontos} pontos`));
    if (recordeNovo) faixa.append(linha('Recorde novo!', 'fim-recorde'));
    faixa.hidden = false;
}

export function esconderFimDeJogo(area) {
    const faixa = area.querySelector('.fim-de-jogo');
    if (faixa) faixa.hidden = true;
}
```

- [ ] **Step 3:** CSS no fim de `style.css`:

```css
.fim-de-jogo {
    position: absolute; top: 18%; left: 50%; transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.88); border: 2px solid #fff; padding: 16px 20px;
    text-align: center; z-index: 5; pointer-events: none; min-width: 70%;
}
.fim-de-jogo[hidden] { display: none; }
.fim-de-jogo p { margin: 6px 0; font-size: 12px; color: #fff; }
.fim-de-jogo .fim-titulo { font-size: 16px; }
.fim-de-jogo .fim-recorde { color: #ffd400; }
```

- [ ] **Step 4:** Em `auth.js`, `salvarRecordeDB` passa a ser:

```js
const CAMPOS_RECORDE = { tetris: 'recorde_tetris', snake: 'recorde_snake', breakout: 'recorde_breakout' };

window.salvarRecordeDB = async (pontosFeitos, tipoJogo = 'tetris') => {
    const user = auth.currentUser;
    const campo = CAMPOS_RECORDE[tipoJogo];
    if (!user || !campo || !Number.isFinite(pontosFeitos)) return false;
    try {
        const userRef = doc(db, 'usuarios', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return false;
        const recordeAtual = Number(snap.data()[campo]) || 0;
        if (pontosFeitos <= recordeAtual) return false;
        await updateDoc(userRef, { [campo]: pontosFeitos, data_recorde: new Date() });
        const el = document.getElementById('userScore');
        if (el) el.textContent = pontosFeitos;
        return true;
    } catch (e) {
        console.error('Erro ao salvar recorde:', e);
        return false;
    }
};
```

- [ ] **Step 5:** Em `carregarRanking`, trocar o laço por DOM seguro e a mensagem de erro:

```js
const celula = (texto) => { const td = document.createElement('td'); td.textContent = texto; return td; };
rankingCorpo.replaceChildren();
let posicao = 1;
querySnapshot.forEach((docSnap) => {
    const dados = docSnap.data();
    const tr = document.createElement('tr');
    tr.append(celula(`${posicao}º`), celula(String(dados.nome ?? 'Jogador')),
              celula(`${Number(dados[campoOrdenacao]) || 0} pts`));
    rankingCorpo.append(tr);
    posicao++;
});
```
No `catch`: `rankingCorpo.innerHTML = "<tr><td colspan='3'>Ranking indisponível</td></tr>";` (texto fixo, sem dado do usuário).
Também em `onAuthStateChanged`: `innerText` → `textContent`.

- [ ] **Step 6:** Nas 4 páginas, mover `<footer class="footer">…</footer>` para antes de `</body>`.

- [ ] **Step 7:** Verificar no navegador: menu carrega os 3 rankings, sem erro no console. Commit `Ranking sem XSS, recorde sem alert/reload e faixa de fim de jogo`.

---

### Task 2: Blocos — lógica testável e laço corrigido

**Files:**
- Create: `public/js/logica/blocos.js`, `tests/blocos.test.js`
- Modify: `public/js/tetris.js`, `public/tetris.html` (script `type="module"`)

**Interfaces:**
- Produces (`blocos.js`): `criarMatriz(largura, altura)`, `criarPeca(tipo)`, `girar(matriz) → nova matriz`, `colide(tabuleiro, matriz, pos) → boolean`, `fundir(tabuleiro, matriz, pos)`, `varrerLinhas(tabuleiro) → número de linhas removidas`, `pontosPorLinhas(qtd, nivel)`, `nivelPorLinhas(total)`, `intervaloQueda(nivel)`.
- Consumes: `mostrarFimDeJogo`/`esconderFimDeJogo` e `window.salvarRecordeDB` (Task 1).

- [ ] **Step 1: testes que falham** — `tests/blocos.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarMatriz, criarPeca, girar, colide, fundir, varrerLinhas,
         pontosPorLinhas, nivelPorLinhas, intervaloQueda } from '../public/js/logica/blocos.js';

test('varrerLinhas remove linhas cheias, inclusive a do topo, e desce o resto', () => {
    const t = criarMatriz(3, 4);
    t[0] = [1, 1, 1]; t[2] = [0, 2, 0]; t[3] = [3, 3, 3];
    assert.equal(varrerLinhas(t), 2);
    assert.deepEqual(t, [[0,0,0],[0,0,0],[0,0,0],[0,2,0]]);
});

test('girar devolve uma matriz nova girada 90° no sentido horário', () => {
    const t = criarPeca('T');
    assert.deepEqual(girar(t), [[0,2,0],[0,2,2],[0,2,0]]);
    assert.deepEqual(criarPeca('T'), t);
});

test('colide detecta parede, chão e bloco fixo', () => {
    const t = criarMatriz(10, 20);
    const o = criarPeca('O');
    assert.equal(colide(t, o, { x: -1, y: 0 }), true);
    assert.equal(colide(t, o, { x: 0, y: 19 }), true);
    assert.equal(colide(t, o, { x: 4, y: 0 }), false);
    fundir(t, o, { x: 4, y: 18 });
    assert.equal(colide(t, o, { x: 4, y: 17 }), true);
});

test('nível sobe a cada 10 linhas e não depende dos pontos', () => {
    assert.equal(nivelPorLinhas(0), 1);
    assert.equal(nivelPorLinhas(9), 1);
    assert.equal(nivelPorLinhas(10), 2);
    assert.equal(nivelPorLinhas(35), 4);
});

test('pontos e velocidade', () => {
    assert.equal(pontosPorLinhas(0, 3), 0);
    assert.equal(pontosPorLinhas(2, 3), 6);
    assert.equal(intervaloQueda(1), 1000);
    assert.equal(intervaloQueda(5), 800);
    assert.equal(intervaloQueda(99), 100);
});
```

- [ ] **Step 2:** `npm test` → FAIL (módulo não existe).

- [ ] **Step 3:** `public/js/logica/blocos.js`:

```js
const FORMAS = {
    I: [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    L: [[0,5,0],[0,5,0],[0,5,5]],
    J: [[0,6,0],[0,6,0],[6,6,0]],
    O: [[7,7],[7,7]],
    S: [[0,4,4],[4,4,0],[0,0,0]],
    Z: [[3,3,0],[0,3,3],[0,0,0]],
    T: [[0,2,0],[2,2,2],[0,0,0]],
};
export const TIPOS = 'ILJOTSZ';

export function criarMatriz(largura, altura) {
    return Array.from({ length: altura }, () => new Array(largura).fill(0));
}

export function criarPeca(tipo) {
    return FORMAS[tipo].map(linha => [...linha]);
}

export function girar(matriz) {
    const n = matriz.length;
    return matriz.map((_, y) => matriz.map((_, x) => matriz[n - 1 - x][y]));
}

export function colide(tabuleiro, matriz, pos) {
    for (let y = 0; y < matriz.length; y++) {
        for (let x = 0; x < matriz[y].length; x++) {
            if (matriz[y][x] === 0) continue;
            const linha = tabuleiro[y + pos.y];
            if (!linha || linha[x + pos.x] !== 0) return true;
        }
    }
    return false;
}

export function fundir(tabuleiro, matriz, pos) {
    matriz.forEach((linha, y) => linha.forEach((v, x) => {
        if (v !== 0) tabuleiro[y + pos.y][x + pos.x] = v;
    }));
}

export function varrerLinhas(tabuleiro) {
    let removidas = 0;
    for (let y = tabuleiro.length - 1; y >= 0; y--) {
        if (tabuleiro[y].every(v => v !== 0)) {
            const linha = tabuleiro.splice(y, 1)[0].fill(0);
            tabuleiro.unshift(linha);
            removidas++;
            y++;
        }
    }
    return removidas;
}

export const pontosPorLinhas = (qtd, nivel) => qtd * nivel;
export const nivelPorLinhas = (total) => Math.floor(total / 10) + 1;
export const intervaloQueda = (nivel) => Math.max(100, 1000 - (nivel - 1) * 50);
```

- [ ] **Step 4:** `npm test` → PASS.

- [ ] **Step 5:** Reescrever `tetris.js` usando o módulo. Pontos-chave:
  - `import { … } from './logica/blocos.js'` e `import { mostrarFimDeJogo, esconderFimDeJogo } from './aviso.js'`.
  - Estado novo `linhas = 0`; após `varrerLinhas`: `linhas += n; score += pontosPorLinhas(n, level); level = nivelPorLinhas(linhas); dropInterval = intervaloQueda(level)`.
  - `playerDrop`: `fundir` → `varrerLinhas` → `playerReset` (nessa ordem).
  - `playerRotate`: `const girada = girar(player.matrix)`; tenta deslocamentos `0, 1, -1, 2, -2` (e `3, -3` para a peça I); aplica o primeiro que não colide, senão mantém.
  - Laço: `lastTime = null` ao iniciar e ao despausar; `update(time)` faz `if (lastTime === null) lastTime = time;` e só é agendado por `requestAnimationFrame` (nunca chamado direto). `cancelAnimationFrame` antes de agendar.
  - `gameOver` é `async`: para o laço, `const recordeNovo = window.salvarRecordeDB ? await window.salvarRecordeDB(score, 'tetris') : false;`, `mostrarFimDeJogo(frame, { titulo: 'FIM DE JOGO', pontos: score, recordeNovo })`, mostra o botão "TENTAR NOVAMENTE". `startGame` chama `esconderFimDeJogo(frame)`. `frame = canvas.parentElement`.
  - Teclado com `event.key` (`ArrowLeft/Right/Down/Up`, `r`, `p`, `Escape`) e `preventDefault()` nessas teclas quando o jogo está ativo.
  - `drawNextPiece`: bloco = `Math.floor(ctx.canvas.width / 4)`, peça centralizada pela largura/altura úteis, fundo limpo pelo tamanho real do canvas.
  - `window.startGame`, `window.togglePause`, `window.handleInput` continuam expostos.
- [ ] **Step 6:** `tetris.html`: `<script type="module" src="js/tetris.js"></script>`.
- [ ] **Step 7:** Verificar no navegador: jogar, pausar (a peça volta a cair), perder, "tentar novamente" (a peça cai normal), setas não rolam a página. Commit `Blocos: lógica testável, fim do travamento após pausa e do fim de jogo falso`.

---

### Task 3: Snake — lógica testável, recorde, bônus, fila de comandos, pausa

**Files:**
- Create: `public/js/logica/cobra.js`, `tests/cobra.test.js`
- Modify: `public/js/snake.js`, `public/snake.html`

**Interfaces:**
- Produces (`cobra.js`): `GRADE = 20`, `DIRECOES = { up, down, left, right }` (vetores `{x,y}`), `enfileirar(fila, atual, nova) → nova fila`, `passo(cobra, direcao, comida, grade) → { cobra, comeu, morreu }`, `celulaLivre(cobra, grade, aleatorio = Math.random) → {x,y}`, `nivelPorPontos(pontos)`, `intervaloDoNivel(nivel)`, `marcoDeBonus(pontos)`.

- [ ] **Step 1: testes que falham** — `tests/cobra.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIRECOES, enfileirar, passo, celulaLivre, nivelPorPontos,
         intervaloDoNivel, marcoDeBonus } from '../public/js/logica/cobra.js';
const { up, down, left, right } = DIRECOES;

test('fila recusa meia-volta mesmo com duas teclas rápidas', () => {
    let fila = enfileirar([], right, up);
    fila = enfileirar(fila, right, left);
    assert.deepEqual(fila, [up, left]);
    assert.deepEqual(enfileirar([], right, left), []);
    assert.deepEqual(enfileirar([up, left], right, down), [up, left]);
});

test('passo anda, come e morre', () => {
    const cobra = [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }];
    let r = passo(cobra, right, { x: 9, y: 9 }, 20);
    assert.deepEqual(r.cobra, [{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }]);
    r = passo(cobra, right, { x: 3, y: 2 }, 20);
    assert.equal(r.comeu, true);
    assert.equal(r.cobra.length, 4);
    assert.equal(passo([{ x: 19, y: 0 }], right, null, 20).morreu, true);
});

test('pode entrar na casa onde está o rabo, porque ele sai', () => {
    const cobra = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 }];
    assert.equal(passo(cobra, down, null, 20).morreu, false);
});

test('celulaLivre nunca cai na cobra', () => {
    const cobra = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    assert.deepEqual(celulaLivre(cobra, 2, () => 0), { x: 0, y: 1 });
});

test('níveis, velocidade e marcos de bônus', () => {
    assert.equal(nivelPorPontos(19), 1);
    assert.equal(nivelPorPontos(20), 2);
    assert.equal(nivelPorPontos(50), 3);
    assert.equal(intervaloDoNivel(1), 200);
    assert.equal(intervaloDoNivel(99), 50);
    assert.equal(marcoDeBonus(19), 0);
    assert.equal(marcoDeBonus(20), 20);
    assert.equal(marcoDeBonus(31), 20);
});
```

- [ ] **Step 2:** `npm test` → FAIL.

- [ ] **Step 3:** `public/js/logica/cobra.js`:

```js
export const GRADE = 20;
export const DIRECOES = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

const mesma = (a, b) => a.x === b.x && a.y === b.y;
const oposta = (a, b) => a.x === -b.x && a.y === -b.y;

export function enfileirar(fila, atual, nova, maximo = 2) {
    const referencia = fila.length ? fila[fila.length - 1] : atual;
    if (fila.length >= maximo || mesma(referencia, nova) || oposta(referencia, nova)) return fila;
    return [...fila, nova];
}

export function passo(cobra, direcao, comida, grade) {
    const cabeca = { x: cobra[0].x + direcao.x, y: cobra[0].y + direcao.y };
    const comeu = !!comida && mesma(cabeca, comida);
    const corpo = comeu ? cobra : cobra.slice(0, -1);
    const fora = cabeca.x < 0 || cabeca.y < 0 || cabeca.x >= grade || cabeca.y >= grade;
    if (fora || corpo.some(p => mesma(p, cabeca))) return { cobra, comeu: false, morreu: true };
    return { cobra: [cabeca, ...corpo], comeu, morreu: false };
}

export function celulaLivre(cobra, grade, aleatorio = Math.random) {
    const livres = [];
    for (let y = 0; y < grade; y++)
        for (let x = 0; x < grade; x++)
            if (!cobra.some(p => p.x === x && p.y === y)) livres.push({ x, y });
    return livres[Math.floor(aleatorio() * livres.length)];
}

const metaDoNivel = (nivel) => (nivel === 1 ? 20 : 20 + (nivel - 1) * 30);
export function nivelPorPontos(pontos) {
    let nivel = 1;
    while (pontos >= metaDoNivel(nivel)) nivel++;
    return nivel;
}
export const intervaloDoNivel = (nivel) => Math.max(50, Math.round(200 * 0.85 ** (nivel - 1)));
export const marcoDeBonus = (pontos) => Math.floor(pontos / 20) * 20;
```

(Conferência: `nivelPorPontos(50)`: meta(1)=20 → 2; meta(2)=50 → 3; meta(3)=80 > 50 → 3. ✔)

- [ ] **Step 4:** `npm test` → PASS.

- [ ] **Step 5:** Reescrever `snake.js` com o módulo:
  - Posições em **células** (0..19); `tamanhoCelula = Math.floor(Math.min(innerWidth * 0.9, 400) / GRADE)`; `canvas.width = canvas.height = tamanhoCelula * GRADE`; o `resize` só recalcula isso e redesenha.
  - Estado: `direcao`, `fila`, `ultimoMarco = 0`, `bonusRestanteMs = 0`, `pausado`.
  - Tique: `direcao = fila.shift() ?? direcao` → `passo` → se morreu, `gameOver`; se comeu: bônus (+10, encurta até 5 mantendo 2, `bonusRestanteMs = 0`) ou normal (+1); `const marco = marcoDeBonus(score); if (marco > ultimoMarco && score > 0) { ultimoMarco = marco; bonusRestanteMs = 10000; }`; nova comida por `celulaLivre`; `level = nivelPorPontos(score)` e, se mudou, reagenda com `intervaloDoNivel(level)`. A cada tique `bonusRestanteMs = Math.max(0, bonusRestanteMs - intervalo)` (pausa congela o bônus).
  - `isBonus` = `bonusRestanteMs > 0`.
  - Pausa (`p`/`Escape` e `window.togglePause`): `clearInterval` / volta com `setInterval`.
  - Teclado: `enfileirar` + `preventDefault` em setas/WASD durante o jogo.
  - `gameOver` `async`: `salvarRecordeDB(score, 'snake')` → `mostrarFimDeJogo(canvas.parentElement, …)`; `startGame` esconde a faixa.
- [ ] **Step 6:** `snake.html`: `id="snakenivel"` → `id="snakeLevel"`, `id="snakeBest"` → `id="userScore"`, script `type="module"`.
- [ ] **Step 7:** Verificar: nível aparece e sobe, recorde salva, duas setas rápidas não matam, bônus some após 10 s, pausa congela, girar a tela não quebra. Commit `Snake: recorde salvo, nível visível, bônus que expira, fila de comandos e pausa`.

---

### Task 4: Breakout — física por tempo, rebatida com ângulo, placar no PC

**Files:**
- Create: `public/js/logica/bola.js`, `tests/bola.test.js`
- Modify: `public/js/Breakout.js`, `public/Breakout.html`, `public/css/Breakout.css`

**Interfaces:**
- Produces (`bola.js`): `velocidadeDoNivel(nivel) → px/s`, `rebaterNaRaquete(bolaX, raqueteX, larguraRaquete, velocidade) → { vx, vy }`.

- [ ] **Step 1: testes que falham** — `tests/bola.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { velocidadeDoNivel, rebaterNaRaquete } from '../public/js/logica/bola.js';

const grau = (vx, vy) => Math.atan2(-vy, vx) * 180 / Math.PI;

test('rebatida mantém a velocidade e o ângulo entre 20° e 160°', () => {
    for (const x of [-50, 0, 37.5, 75, 200]) {
        const { vx, vy } = rebaterNaRaquete(x, 0, 75, 300);
        assert.ok(Math.abs(Math.hypot(vx, vy) - 300) < 1e-9);
        assert.ok(vy < 0);
        const a = grau(vx, vy);
        assert.ok(a >= 20 - 1e-9 && a <= 160 + 1e-9, `ângulo ${a}`);
    }
});

test('centro da raquete sobe reto; pontas abrem o ângulo', () => {
    assert.ok(Math.abs(rebaterNaRaquete(37.5, 0, 75, 300).vx) < 1e-9);
    assert.ok(rebaterNaRaquete(0, 0, 75, 300).vx < 0);
    assert.ok(rebaterNaRaquete(75, 0, 75, 300).vx > 0);
});

test('velocidade cresce com o nível', () => {
    assert.ok(velocidadeDoNivel(2) > velocidadeDoNivel(1));
    assert.equal(velocidadeDoNivel(1), Math.round(2.5 * Math.SQRT2 * 60));
});
```

> Nota: o centro exato dá 90° (sobe reto). Isso não trava o jogo, porque o jogador só repete o reto se acertar o centro de novo, e qualquer desvio abre o ângulo. É o comportamento clássico. O bug antigo era `dx=0` **e** a velocidade baixa.

- [ ] **Step 2:** `npm test` → FAIL.

- [ ] **Step 3:** `public/js/logica/bola.js`:

```js
export const velocidadeDoNivel = (nivel) => Math.round((2 + nivel * 0.5) * Math.SQRT2 * 60);

export function rebaterNaRaquete(bolaX, raqueteX, larguraRaquete, velocidade) {
    const relativo = Math.min(1, Math.max(0, (bolaX - raqueteX) / larguraRaquete));
    const angulo = (160 - relativo * 140) * Math.PI / 180;
    return { vx: Math.cos(angulo) * velocidade, vy: -Math.sin(angulo) * velocidade };
}
```

- [ ] **Step 4:** `npm test` → PASS.

- [ ] **Step 5:** `Breakout.js`:
  - Velocidade em px/s: `resetBall` usa `const v = velocidadeDoNivel(level)` com ângulo inicial 45° ou 135°.
  - Laço `draw(time)` só por `requestAnimationFrame`, `lastTime = null` ao iniciar e ao despausar, `dt = Math.min((time - lastTime) / 1000, 0.05)`; bola `x += vx * dt`, raquete `420 px/s * dt`.
  - Paredes: refletir e reposicionar dentro da área (sem prender na parede).
  - Raquete: se a bola desce e cruza a linha da raquete dentro da largura dela, aplicar `rebaterNaRaquete(x, paddleX, paddleWidth, velocidadeDoNivel(level))`.
  - Tijolos: no máximo um tijolo quebrado por quadro (`return` após o primeiro).
  - `gameOver(msg)` `async`: salva o recorde (`'breakout'`) e `mostrarFimDeJogo(frame, { titulo: msg, … })`; "VOCÊ VENCEU" aparece por aí.
  - Pausa sem rAF ocioso: pausar cancela o laço; despausar reagenda.
- [ ] **Step 6:** `Breakout.css`: antes do `@media`, `.mobile-controls, .mobile-only { display: none; }`. `Breakout.html`: script `type="module"`.
- [ ] **Step 7:** Verificar a 60 Hz e emulando o dobro (CPU normal; conferir que a velocidade é por tempo), rebatida nas pontas, vitória exibida, placar de celular só no celular. Commit `Breakout: física por tempo real, rebatida com ângulo e placar de celular só no celular`.

---

### Task 5: Verificação final

- [ ] `npm test` → todos passam.
- [ ] Navegador 1366×800 e 390×844: cada jogo inicia, pausa, volta, termina e recomeça; console sem erros.
- [ ] Atualizar `.claude/RESUMO_PROJETO.md` (estado e pendências), o `CLAUDE.md` (como rodar os testes) e o diário/decisões no Obsidian.
- [ ] Commit da documentação; push após o OK do usuário.
