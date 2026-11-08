/* ==========================================================================
   Jogo de blocos — tela, laço e controles.
   A lógica (matriz, colisão, linhas, pontos, nível) mora em logica/blocos.js.
========================================================================== */
import {
    TIPOS, criarMatriz, criarPeca, girar, colide, fundir, varrerLinhas,
    pontosPorLinhas, nivelPorLinhas, intervaloQueda,
} from './logica/blocos.js';
import { mostrarFimDeJogo, esconderFimDeJogo } from './aviso.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const frame = canvas.parentElement;

const scoreEls = [document.getElementById('scorePC'), document.getElementById('scoreMob')];
const levelEls = [document.getElementById('levelPC'), document.getElementById('levelMob')];
const nextCtxs = ['upcomingPC', 'upcomingMob']
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .map(c => c.getContext('2d'));

const btnStartOverlay = document.getElementById('startBtnOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

// Índice 0 é vazio; os demais batem com os valores das peças em logica/blocos.js.
const COLORS = [null, '#00ffff', '#ff00ff', '#ff0000', '#00ff00', '#ff8800', '#0000ff', '#ffff00'];

/* --- Estado --- */
let board = criarMatriz(COLS, ROWS);
const player = { pos: { x: 0, y: 0 }, matrix: null };
let nextPieceMatrix = null;

let score = 0;
let level = 1;
let linhas = 0;
let dropCounter = 0;
let dropInterval = intervaloQueda(1);
let lastTime = null; // null = o próximo quadro zera o relógio
let isPaused = false;
let isGameOver = true;
let requestId = null;

const pecaAleatoria = () => criarPeca(TIPOS[Math.floor(Math.random() * TIPOS.length)]);

/* --- Jogador --- */
function playerReset() {
    player.matrix = nextPieceMatrix ?? pecaAleatoria();
    nextPieceMatrix = pecaAleatoria();
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
    drawNextPiece();
    if (colide(board, player.matrix, player.pos)) gameOver();
}

function playerRotate() {
    const girada = girar(player.matrix);
    const deslocamentos = girada.length === 4 ? [0, 1, -1, 2, -2, 3, -3] : [0, 1, -1, 2, -2];
    for (const dx of deslocamentos) {
        const pos = { x: player.pos.x + dx, y: player.pos.y };
        if (!colide(board, girada, pos)) {
            player.matrix = girada;
            player.pos = pos;
            return;
        }
    }
}

function playerMove(dir) {
    const pos = { x: player.pos.x + dir, y: player.pos.y };
    if (!colide(board, player.matrix, pos)) player.pos = pos;
}

function playerDrop() {
    const pos = { x: player.pos.x, y: player.pos.y + 1 };
    if (colide(board, player.matrix, pos)) {
        fundir(board, player.matrix, player.pos);
        // Apaga as linhas ANTES de nascer a peça nova (senão o jogo acaba à toa).
        const removidas = varrerLinhas(board);
        if (removidas > 0) {
            linhas += removidas;
            score += pontosPorLinhas(removidas, level);
            level = nivelPorLinhas(linhas);
            dropInterval = intervaloQueda(level);
            updateHUD();
        }
        playerReset();
    } else {
        player.pos = pos;
    }
    dropCounter = 0;
}

/* --- Desenho --- */
function drawMatrix(matrix, offset, context, tamanho) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value === 0) return;
            context.shadowBlur = 15;
            context.shadowColor = COLORS[value];
            context.fillStyle = COLORS[value];
            context.fillRect((x + offset.x) * tamanho, (y + offset.y) * tamanho, tamanho - 1, tamanho - 1);
            context.shadowBlur = 0;
        });
    });
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, { x: 0, y: 0 }, ctx, BLOCK_SIZE);
    if (player.matrix) drawMatrix(player.matrix, player.pos, ctx, BLOCK_SIZE);
}

// Próxima peça centralizada, com o bloco ajustado ao tamanho de cada quadrinho.
function drawNextPiece() {
    const celulas = [];
    nextPieceMatrix.forEach((row, y) => row.forEach((v, x) => { if (v) celulas.push({ x, y, v }); }));
    const minX = Math.min(...celulas.map(c => c.x)), maxX = Math.max(...celulas.map(c => c.x));
    const minY = Math.min(...celulas.map(c => c.y)), maxY = Math.max(...celulas.map(c => c.y));
    const larg = maxX - minX + 1, alt = maxY - minY + 1;

    nextCtxs.forEach(c => {
        const { width, height } = c.canvas;
        const bloco = Math.floor(Math.min(width, height) / 4.5);
        const ox = (width - larg * bloco) / 2, oy = (height - alt * bloco) / 2;
        c.fillStyle = '#000';
        c.fillRect(0, 0, width, height);
        celulas.forEach(({ x, y, v }) => {
            c.fillStyle = COLORS[v];
            c.fillRect(ox + (x - minX) * bloco, oy + (y - minY) * bloco, bloco - 1, bloco - 1);
        });
    });
}

function updateHUD() {
    scoreEls.forEach(el => { if (el) el.textContent = String(score).padStart(5, '0'); });
    levelEls.forEach(el => { if (el) el.textContent = level; });
}

/* --- Laço --- */
// Só é chamado pelo requestAnimationFrame, então `time` está sempre na mesma escala.
function update(time) {
    if (isPaused || isGameOver) return;
    if (lastTime === null) lastTime = time;
    dropCounter += time - lastTime;
    lastTime = time;
    if (dropCounter > dropInterval) playerDrop();
    if (isGameOver) return;
    draw();
    requestId = requestAnimationFrame(update);
}

function agendarLaco() {
    cancelAnimationFrame(requestId);
    lastTime = null;
    requestId = requestAnimationFrame(update);
}

/* --- Controles --- */
window.startGame = function () {
    if (!isGameOver) return;
    board = criarMatriz(COLS, ROWS);
    score = 0;
    level = 1;
    linhas = 0;
    dropCounter = 0;
    dropInterval = intervaloQueda(1);
    nextPieceMatrix = null;
    isGameOver = false;
    isPaused = false;
    btnStartOverlay.style.display = 'none';
    pauseOverlay.style.display = 'none';
    esconderFimDeJogo(frame);
    playerReset();
    updateHUD();
    agendarLaco();
};

window.togglePause = function () {
    if (isGameOver) return;
    isPaused = !isPaused;
    pauseOverlay.style.display = isPaused ? 'block' : 'none';
    if (isPaused) cancelAnimationFrame(requestId);
    else agendarLaco();
};

async function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(requestId);
    draw();
    btnStartOverlay.style.display = 'block';
    btnStartOverlay.innerText = '↻ TENTAR NOVAMENTE';
    const pontos = score;
    mostrarFimDeJogo(frame, { titulo: 'FIM DE JOGO', pontos, recordeNovo: false });
    const recordeNovo = window.salvarRecordeDB ? await window.salvarRecordeDB(pontos, 'tetris') : false;
    if (recordeNovo && isGameOver) mostrarFimDeJogo(frame, { titulo: 'FIM DE JOGO', pontos, recordeNovo });
}

window.handleInput = function (action, event) {
    if (event && event.cancelable) event.preventDefault();
    if (isGameOver || isPaused) return;
    if (action === 'left') playerMove(-1);
    if (action === 'right') playerMove(1);
    if (action === 'down') playerDrop();
    if (action === 'rotate') playerRotate();
    if (!isGameOver) draw();
};

const TECLAS = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rotate', r: 'rotate', R: 'rotate',
};

document.addEventListener('keydown', event => {
    const emJogo = !isGameOver;
    if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
        if (emJogo) { event.preventDefault(); window.togglePause(); }
        return;
    }
    const acao = TECLAS[event.key];
    if (acao && emJogo) {
        event.preventDefault(); // setas não rolam a página durante o jogo
        window.handleInput(acao);
    }
});
