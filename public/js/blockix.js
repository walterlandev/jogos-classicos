/* ==========================================================================
   Blockix — tela, laço, tempo de encaixe e controles.
   Regras (peças, colisão, linhas, pontos, nível, fantasma) em logica/blocos.js;
   cores sempre da paleta do tema atual (temas.js).
========================================================================== */
import {
    criarMatriz, criarPeca, girar, colide, fundir, varrerLinhas, novoSaco,
    pontuar, nivelPorLinhas, intervaloQueda, linhaFantasma, niveisIniciais, PONTOS_QUEDA,
} from './logica/blocos.js';
import { mostrarFimDeJogo, esconderFimDeJogo } from './aviso.js';
import { paleta, aoMudarTema, ligarBotaoTema } from './temas.js';
import { ligarToque } from './controles.js';
import { registrarPartida, textosDoFim } from './progresso.js';
import { tocar, ligarBotaoSom } from './som.js';

const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const minis = { guardada: $('guardada'), proxima: $('proxima'), fila: $('fila') };
const camadaInicio = $('camadaInicio');
const camadaPausa = $('camadaPausa');
const tituloInicio = camadaInicio.querySelector('.camada-titulo');
const botaoJogar = $('botaoJogar');
const seletorNivel = $('nivelInicial');
const avisoEl = $('avisoJogo');

const ROWS = 20;
const COLS = 10;
const BLOCO = 30;
const ENCAIXE_MS = 500;
const MAX_REINICIOS = 15;
const BRILHO_MS = 250;
const CHAVE_NIVEL_MAX = 'blockix_nivel_max';
const semMovimento = matchMedia('(prefers-reduced-motion: reduce)');

/* --- Estado --- */
let board = criarMatriz(COLS, ROWS);
const peca = { tipo: null, matriz: null, pos: { x: 0, y: 0 } };
let fila = [];
let guardada = null;
let podeGuardar = true;
let pontos = 0;
let linhas = 0;
let quatros = 0;
let maiorCombo = 0;
let nivel = 1;
let nivelInicial = 1;
let nivelMax = lerNivelMaxLocal();
let estadoPontos = { combo: -1, b2b: false };
let quedaMs = 0;
let encaixeMs = 0;
let reinicios = 0;
let brilho = null; // { ys: [...], desde: ms }
let lastTime = null;
let isPaused = false;
let isGameOver = true;
let requestId = null;
let avisoTimer = null;

function lerNivelMaxLocal() {
    try { return Math.max(1, Number(localStorage.getItem(CHAVE_NIVEL_MAX)) || 1); } catch { return 1; }
}

/* --- Peças e fila (saco de 7) --- */
function proximaDaFila() {
    while (fila.length < 4) fila.push(...novoSaco());
    return fila.shift();
}

function nascer(tipo) {
    peca.tipo = tipo;
    peca.matriz = criarPeca(tipo);
    peca.pos = { x: Math.floor(COLS / 2) - Math.floor(peca.matriz[0].length / 2), y: 0 };
    encaixeMs = 0;
    reinicios = 0;
    quedaMs = 0;
    while (fila.length < 4) fila.push(...novoSaco());
    desenharMinis();
    if (colide(board, peca.matriz, peca.pos)) gameOver();
}

const noChao = () => colide(board, peca.matriz, { x: peca.pos.x, y: peca.pos.y + 1 });

// Mexer a peça no chão dá mais tempo para encaixar (até MAX_REINICIOS vezes).
function depoisDeMexer() {
    if (noChao() && reinicios < MAX_REINICIOS) {
        encaixeMs = 0;
        reinicios++;
    }
}

function mover(dx) {
    const pos = { x: peca.pos.x + dx, y: peca.pos.y };
    if (colide(board, peca.matriz, pos)) return;
    peca.pos = pos;
    depoisDeMexer();
}

function rodar(vezes = 1) {
    let girada = peca.matriz;
    for (let i = 0; i < vezes; i++) girada = girar(girada);
    const chutes = girada.length === 4 ? [0, 1, -1, 2, -2] : [0, 1, -1];
    for (const dy of [0, -1]) {            // tenta no lugar e, se preciso, uma linha acima
        for (const dx of chutes) {
            const pos = { x: peca.pos.x + dx, y: peca.pos.y + dy };
            if (!colide(board, girada, pos)) {
                peca.matriz = girada;
                peca.pos = pos;
                depoisDeMexer();
                return;
            }
        }
    }
}

function descer() {
    if (noChao()) return travar();
    peca.pos = { x: peca.pos.x, y: peca.pos.y + 1 };
    pontos += PONTOS_QUEDA.suave;
    quedaMs = 0;
    atualizarPlacar();
}

function cair() {
    const y = linhaFantasma(board, peca.matriz, peca.pos);
    pontos += (y - peca.pos.y) * PONTOS_QUEDA.instantanea;
    peca.pos = { x: peca.pos.x, y };
    travar();
}

function guardar() {
    if (!podeGuardar) return;
    const atual = peca.tipo;
    if (guardada) nascer(guardada);
    else nascer(proximaDaFila());
    guardada = atual;
    podeGuardar = false;
    desenharMinis();
}

function travar() {
    tocar('travar');
    fundir(board, peca.matriz, peca.pos);
    const cheias = board.flatMap((linha, y) => (linha.every(v => v !== 0) ? [y] : []));
    const removidas = varrerLinhas(board);
    const nivelAntes = nivel;
    const r = pontuar(removidas, nivel, estadoPontos);
    estadoPontos = { combo: r.combo, b2b: r.b2b };
    pontos += r.pontos;
    if (removidas === 4) quatros++;
    maiorCombo = Math.max(maiorCombo, r.combo);
    if (removidas > 0) {
        linhas += removidas;
        nivel = nivelPorLinhas(linhas, nivelInicial);
        if (!semMovimento.matches) brilho = { ys: cheias, desde: performance.now() };
        tocar(nivel > nivelAntes ? 'nivel' : removidas === 4 ? 'quatro' : 'linha');
        if (nivel > nivelAntes) avisar(`Nível ${nivel}`);
        else if (r.quatroSeguidas) avisar('Quatro linhas seguidas!');
        else if (removidas === 4) avisar('Quatro linhas!');
        else if (r.combo >= 2) avisar(`Combo ×${r.combo}`);
    }
    podeGuardar = true;
    atualizarPlacar();
    nascer(proximaDaFila());
}

/* --- Desenho --- */
function celula(context, x, y, tamanho, cor) {
    context.fillStyle = cor;
    context.fillRect(x * tamanho + 1, y * tamanho + 1, tamanho - 2, tamanho - 2);
}

function draw(agora = performance.now()) {
    const p = paleta();
    ctx.globalAlpha = 1;
    ctx.fillStyle = p.fundo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    board.forEach((row, y) => row.forEach((v, x) => {
        if (v) celula(ctx, x, y, BLOCO, p.pecas[v]);
        else if (p.vazio) celula(ctx, x, y, BLOCO, p.vazio);
    }));
    if (peca.matriz && !isGameOver) {
        // Fantasma: contorno onde a peça cairia.
        const yF = linhaFantasma(board, peca.matriz, peca.pos);
        ctx.lineWidth = 2;
        peca.matriz.forEach((row, y) => row.forEach((v, x) => {
            if (!v) return;
            ctx.strokeStyle = p.pecas[v];
            ctx.strokeRect((x + peca.pos.x) * BLOCO + 3, (y + yF) * BLOCO + 3, BLOCO - 6, BLOCO - 6);
        }));
    }
    if (peca.matriz) {
        peca.matriz.forEach((row, y) => row.forEach((v, x) => {
            if (v) celula(ctx, x + peca.pos.x, y + peca.pos.y, BLOCO, p.pecas[v]);
        }));
    }
    if (brilho) {
        const t = (agora - brilho.desde) / BRILHO_MS;
        if (t >= 1) brilho = null;
        else {
            ctx.globalAlpha = 0.75 * (1 - t);
            ctx.fillStyle = p.texto;
            brilho.ys.forEach(y => ctx.fillRect(0, y * BLOCO, canvas.width, BLOCO));
            ctx.globalAlpha = 1;
        }
    }
}

function desenharMini(cv, tipos) {
    if (!cv) return;
    const c = cv.getContext('2d');
    const p = paleta();
    c.fillStyle = p.fundo;
    c.fillRect(0, 0, cv.width, cv.height);
    const altura = cv.height / Math.max(1, tipos.length);
    const bloco = Math.floor(Math.min(cv.width, altura) / 4.5);
    tipos.forEach((tipo, i) => {
        if (!tipo) return;
        const cel = [];
        criarPeca(tipo).forEach((row, y) => row.forEach((v, x) => { if (v) cel.push({ x, y, v }); }));
        const minX = Math.min(...cel.map(k => k.x)), maxX = Math.max(...cel.map(k => k.x));
        const minY = Math.min(...cel.map(k => k.y)), maxY = Math.max(...cel.map(k => k.y));
        const ox = (cv.width - (maxX - minX + 1) * bloco) / 2;
        const oy = i * altura + (altura - (maxY - minY + 1) * bloco) / 2;
        c.globalAlpha = cv === minis.guardada && !podeGuardar ? 0.4 : 1;
        cel.forEach(({ x, y, v }) => {
            c.fillStyle = p.pecas[v];
            c.fillRect(ox + (x - minX) * bloco + 1, oy + (y - minY) * bloco + 1, bloco - 2, bloco - 2);
        });
        c.globalAlpha = 1;
    });
}

function desenharMinis() {
    desenharMini(minis.guardada, [guardada]);
    desenharMini(minis.proxima, [fila[0]]);
    desenharMini(minis.fila, [fila[1], fila[2]]);
}

function atualizarPlacar() {
    $('pontos').textContent = pontos;
    $('nivel').textContent = nivel;
    $('linhas').textContent = linhas;
}

function avisar(texto) {
    avisoEl.textContent = texto;
    avisoEl.classList.add('visivel');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => avisoEl.classList.remove('visivel'), 1100);
}

/* --- Laço (só pelo requestAnimationFrame, com tempo real) --- */
function update(time) {
    if (isPaused || isGameOver) return;
    if (lastTime === null) lastTime = time;
    const dt = Math.min(time - lastTime, 100);
    lastTime = time;

    if (noChao()) {
        encaixeMs += dt;
        if (encaixeMs >= ENCAIXE_MS) travar();
    } else {
        encaixeMs = 0;
        quedaMs += dt;
        const intervalo = intervaloQueda(nivel);
        while (quedaMs >= intervalo && !noChao()) {
            peca.pos = { x: peca.pos.x, y: peca.pos.y + 1 };
            quedaMs -= intervalo;
        }
    }
    if (isGameOver) return;
    draw(time);
    requestId = requestAnimationFrame(update);
}

function agendarLaco() {
    cancelAnimationFrame(requestId);
    lastTime = null;
    requestId = requestAnimationFrame(update);
}

/* --- Nível inicial --- */
function montarSeletorNivel() {
    const escolhido = Number(seletorNivel.value) || 1;
    seletorNivel.replaceChildren(...niveisIniciais(nivelMax).map(n => {
        const o = document.createElement('option');
        o.value = n;
        o.textContent = n;
        return o;
    }));
    seletorNivel.value = niveisIniciais(nivelMax).includes(escolhido) ? escolhido : 1;
}

function registrarNivelMax() {
    if (nivel <= nivelMax) return;
    nivelMax = nivel;
    try { localStorage.setItem(CHAVE_NIVEL_MAX, String(nivelMax)); } catch { /* navegação privada */ }
    window.salvarNivelMaxDB?.('blockix', nivelMax);
    montarSeletorNivel();
}

/* --- Partida --- */
function startGame() {
    if (!isGameOver) return;
    board = criarMatriz(COLS, ROWS);
    fila = [];
    guardada = null;
    podeGuardar = true;
    pontos = 0;
    linhas = 0;
    quatros = 0;
    maiorCombo = 0;
    nivelInicial = Number(seletorNivel.value) || 1;
    nivel = nivelInicial;
    estadoPontos = { combo: -1, b2b: false };
    brilho = null;
    isGameOver = false;
    isPaused = false;
    camadaInicio.hidden = true;
    camadaPausa.hidden = true;
    esconderFimDeJogo(camadaInicio);
    atualizarPlacar();
    nascer(proximaDaFila());
    agendarLaco();
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    camadaPausa.hidden = !isPaused;
    if (isPaused) {
        cancelAnimationFrame(requestId);
        camadaPausa.querySelector('button').focus();
    } else {
        agendarLaco();
    }
}

async function gameOver() {
    tocar('fim');
    isGameOver = true;
    cancelAnimationFrame(requestId);
    draw();
    registrarNivelMax();
    const total = pontos;
    tituloInicio.textContent = 'Fim de jogo';
    botaoJogar.textContent = 'Jogar de novo';
    const extras = textosDoFim(registrarPartida('blockix', { linhas, quatros, maiorCombo, nivelMax: nivel }));
    mostrarFimDeJogo(camadaInicio, { detalhe: `Nível ${nivel}, ${linhas} linhas`, pontos: total, recordeNovo: false, extras });
    camadaInicio.hidden = false;
    botaoJogar.focus();
    const recordeNovo = window.salvarRecordeDB ? await window.salvarRecordeDB(total, 'blockix') : false;
    if (recordeNovo && isGameOver) {
        mostrarFimDeJogo(camadaInicio, { detalhe: `Nível ${nivel}, ${linhas} linhas`, pontos: total, recordeNovo, extras });
    }
}

/* --- Controles --- */
function acao(nome) {
    if (nome === 'pausa') return togglePause();
    if (isGameOver || isPaused) return;
    if (nome === 'left') mover(-1);
    else if (nome === 'right') mover(1);
    else if (nome === 'down') descer();
    else if (nome === 'rotate') rodar(1);
    else if (nome === 'rotate-ccw') rodar(3);
    else if (nome === 'drop') cair();
    else if (nome === 'hold') guardar();
    if (!isGameOver) draw();
}

botaoJogar.addEventListener('click', startGame);
document.querySelectorAll('[data-acao]').forEach(botao => {
    const nome = botao.dataset.acao;
    if (botao.classList.contains('controle')) {
        ligarToque(botao, () => acao(nome), { repetir: ['left', 'right', 'down'].includes(nome) });
    } else {
        botao.addEventListener('click', () => acao(nome));
    }
});

const TECLAS = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down',
    ArrowUp: 'rotate', x: 'rotate', X: 'rotate', z: 'rotate-ccw', Z: 'rotate-ccw',
    ' ': 'drop', c: 'hold', C: 'hold', Shift: 'hold',
};
document.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (!isGameOver) { e.preventDefault(); togglePause(); }
        return;
    }
    const nome = TECLAS[e.key];
    if (!nome || isGameOver) return;
    e.preventDefault(); // setas e espaço não rolam a página durante o jogo
    if (e.repeat && (nome === 'drop' || nome === 'hold' || nome.startsWith('rotate'))) return;
    acao(nome);
});

// Nível máximo do perfil (outro aparelho) soma com o deste navegador.
window.addEventListener('perfilcarregado', e => {
    const doPerfil = Number(e.detail?.nivel_max_blockix) || 1;
    if (doPerfil > nivelMax) {
        nivelMax = doPerfil;
        try { localStorage.setItem(CHAVE_NIVEL_MAX, String(nivelMax)); } catch { /* navegação privada */ }
        montarSeletorNivel();
    } else if (nivelMax > doPerfil) {
        window.salvarNivelMaxDB?.('blockix', nivelMax);
    }
});

ligarBotaoTema($('botaoTema'));
ligarBotaoSom($('botaoSom'));
aoMudarTema(() => { draw(); desenharMinis(); });
montarSeletorNivel();
draw();
desenharMinis();
