/* ==========================================================================
   Blockix — tela, laço e controles.
   Regras (matriz, colisão, linhas, pontos, nível) em logica/blocos.js;
   cores sempre da paleta do tema atual (temas.js).
========================================================================== */
import {
    TIPOS, criarMatriz, criarPeca, girar, colide, fundir, varrerLinhas,
    pontosPorLinhas, nivelPorLinhas, intervaloQueda,
} from './logica/blocos.js';
import { mostrarFimDeJogo, esconderFimDeJogo } from './aviso.js';
import { paleta, aoMudarTema, ligarBotaoTema } from './temas.js';
import { ligarToque } from './controles.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const proxima = document.getElementById('proxima');
const ctxProxima = proxima.getContext('2d');
const pontosEl = document.getElementById('pontos');
const nivelEl = document.getElementById('nivel');
const camadaInicio = document.getElementById('camadaInicio');
const camadaPausa = document.getElementById('camadaPausa');
const tituloInicio = camadaInicio.querySelector('.camada-titulo');
const botaoJogar = document.getElementById('botaoJogar');

const ROWS = 20;
const COLS = 10;
const BLOCO = 30;

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
function celula(context, x, y, tamanho, cor) {
    context.fillStyle = cor;
    context.fillRect(x * tamanho + 1, y * tamanho + 1, tamanho - 2, tamanho - 2);
}

function draw() {
    const p = paleta();
    ctx.fillStyle = p.fundo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    board.forEach((row, y) => row.forEach((v, x) => {
        if (v) celula(ctx, x, y, BLOCO, p.pecas[v]);
        else if (p.vazio) celula(ctx, x, y, BLOCO, p.vazio);
    }));
    if (player.matrix) {
        player.matrix.forEach((row, y) => row.forEach((v, x) => {
            if (v) celula(ctx, x + player.pos.x, y + player.pos.y, BLOCO, p.pecas[v]);
        }));
    }
}

// Próxima peça centralizada no quadrinho.
function drawNextPiece() {
    const p = paleta();
    const { width, height } = proxima;
    ctxProxima.fillStyle = p.fundo;
    ctxProxima.fillRect(0, 0, width, height);
    if (!nextPieceMatrix) return;
    const cel = [];
    nextPieceMatrix.forEach((row, y) => row.forEach((v, x) => { if (v) cel.push({ x, y, v }); }));
    const minX = Math.min(...cel.map(c => c.x)), maxX = Math.max(...cel.map(c => c.x));
    const minY = Math.min(...cel.map(c => c.y)), maxY = Math.max(...cel.map(c => c.y));
    const bloco = Math.floor(Math.min(width, height) / 4.5);
    const ox = (width - (maxX - minX + 1) * bloco) / 2;
    const oy = (height - (maxY - minY + 1) * bloco) / 2;
    cel.forEach(({ x, y, v }) => {
        ctxProxima.fillStyle = p.pecas[v];
        ctxProxima.fillRect(ox + (x - minX) * bloco + 1, oy + (y - minY) * bloco + 1, bloco - 2, bloco - 2);
    });
}

function updateHUD() {
    pontosEl.textContent = score;
    nivelEl.textContent = level;
}

/* --- Laço (só pelo requestAnimationFrame, com tempo real) --- */
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

/* --- Partida --- */
function startGame() {
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
    camadaInicio.hidden = true;
    camadaPausa.hidden = true;
    esconderFimDeJogo(camadaInicio);
    playerReset();
    updateHUD();
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
    isGameOver = true;
    cancelAnimationFrame(requestId);
    draw();
    const pontos = score;
    tituloInicio.textContent = 'Fim de jogo';
    botaoJogar.textContent = 'Jogar de novo';
    mostrarFimDeJogo(camadaInicio, { pontos, recordeNovo: false });
    camadaInicio.hidden = false;
    botaoJogar.focus();
    const recordeNovo = window.salvarRecordeDB ? await window.salvarRecordeDB(pontos, 'blockix') : false;
    if (recordeNovo && isGameOver) mostrarFimDeJogo(camadaInicio, { pontos, recordeNovo });
}

function acao(nome) {
    if (nome === 'pausa') return togglePause();
    if (isGameOver || isPaused) return;
    if (nome === 'left') playerMove(-1);
    if (nome === 'right') playerMove(1);
    if (nome === 'down') playerDrop();
    if (nome === 'rotate') playerRotate();
    if (!isGameOver) draw();
}

/* --- Controles --- */
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
    ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rotate', r: 'rotate', R: 'rotate',
};
document.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (!isGameOver) { e.preventDefault(); togglePause(); }
        return;
    }
    const nome = TECLAS[e.key];
    if (nome && !isGameOver) {
        e.preventDefault(); // setas não rolam a página durante o jogo
        acao(nome);
    }
});

ligarBotaoTema(document.getElementById('botaoTema'));
aoMudarTema(() => { draw(); drawNextPiece(); });
draw();
drawNextPiece();
