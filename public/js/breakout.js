/* ==========================================================================
   Breakout — tela, laço e controles.
   Física por tempo real (px/s × segundos), igual em qualquer taxa de quadros.
   Rebatida e velocidade por fase em logica/bola.js; cores da paleta do tema.
========================================================================== */
import { velocidadeDoNivel, rebaterNaRaquete } from './logica/bola.js';
import { mostrarFimDeJogo, esconderFimDeJogo } from './aviso.js';
import { paleta, aoMudarTema, ligarBotaoTema } from './temas.js';
import { ligarToque, ligarSegurar } from './controles.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pontosEl = document.getElementById('pontos');
const faseEl = document.getElementById('fase');
const camadaInicio = document.getElementById('camadaInicio');
const camadaPausa = document.getElementById('camadaPausa');
const tituloInicio = camadaInicio.querySelector('.camada-titulo');
const botaoJogar = document.getElementById('botaoJogar');

/* --- Estado --- */
let score = 0;
let level = 1;
let paused = false;
let gameRunning = false;
let animationId = null;
let lastTime = null; // null = o próximo quadro zera o relógio

/* --- Raquete --- */
const paddleHeight = 10;
const paddleSegmentWidth = 15;
const paddleWidth = paddleSegmentWidth * 5;
const paddleY = canvas.height - paddleHeight - 5;
const PADDLE_SPEED = 420; // px/s
let paddleX = (canvas.width - paddleWidth) / 2;

/* --- Bola --- */
let x = canvas.width / 2, y = canvas.height - 30;
let vx = 0, vy = 0; // px/s
const ballRadius = 6;

/* --- Tijolos --- */
const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = 50;
const brickHeight = 15;
const brickPadding = 5;
const brickOffsetTop = 40;
const brickOffsetLeft = (canvas.width - (brickColumnCount * (brickWidth + brickPadding) - brickPadding)) / 2;
let bricks = [];

/* --- Controles --- */
let rightPressed = false;
let leftPressed = false;

/* --- Preparação --- */
function resetBall() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    const v = velocidadeDoNivel(level);
    const angulo = (Math.random() > 0.5 ? 45 : 135) * Math.PI / 180;
    vx = Math.cos(angulo) * v;
    vy = -Math.sin(angulo) * v;
    paddleX = (canvas.width - paddleWidth) / 2;
}

function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            // Fases pares em xadrez.
            const active = !(level % 2 === 0 && (c + r) % 2 === 0);
            bricks[c][r] = {
                x: c * (brickWidth + brickPadding) + brickOffsetLeft,
                y: r * (brickHeight + brickPadding) + brickOffsetTop,
                status: active ? 1 : 0,
            };
        }
    }
}

/* --- Colisões --- */
// No máximo um tijolo por quadro: evita a bola inverter duas vezes e atravessar.
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status !== 1) continue;
            if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                vy = -vy;
                b.status = 0;
                score += 1;
                updateHUD();
                if (checkWin()) nextLevel();
                return;
            }
        }
    }
}

const checkWin = () => bricks.every(coluna => coluna.every(b => b.status === 0));

function nextLevel() {
    if (level < 10) {
        level++;
        resetBall();
        initBricks();
        updateHUD();
    } else {
        gameOver('Você venceu!');
    }
}

function updateHUD() {
    pontosEl.textContent = score;
    faseEl.textContent = level;
}

/* --- Desenho --- */
function render() {
    const p = paleta();
    ctx.fillStyle = p.fundo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c]?.[r];
            if (!b || b.status !== 1) continue;
            ctx.fillStyle = p.tijolos[r % p.tijolos.length];
            ctx.fillRect(b.x, b.y, brickWidth, brickHeight);
        }
    }
    ctx.fillStyle = p.bola;
    ctx.fillRect(x - ballRadius / 2, y - ballRadius / 2, ballRadius, ballRadius);
    ctx.fillStyle = p.raquete;
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(paddleX + i * paddleSegmentWidth, paddleY, paddleSegmentWidth - 1, paddleHeight);
    }
}

/* --- Física de um passo de dt segundos --- */
function atualizar(dt) {
    if (rightPressed) paddleX = Math.min(canvas.width - paddleWidth, paddleX + PADDLE_SPEED * dt);
    else if (leftPressed) paddleX = Math.max(0, paddleX - PADDLE_SPEED * dt);

    const yAntes = y;
    x += vx * dt;
    y += vy * dt;

    // Paredes laterais e teto: reflete e recoloca dentro da área.
    if (x < ballRadius) { x = ballRadius; vx = Math.abs(vx); }
    else if (x > canvas.width - ballRadius) { x = canvas.width - ballRadius; vx = -Math.abs(vx); }
    if (y < ballRadius) { y = ballRadius; vy = Math.abs(vy); }

    // Raquete: só quando a bola desce e cruza a linha de cima da raquete.
    const topoRaquete = paddleY - ballRadius / 2;
    if (vy > 0 && yAntes <= topoRaquete && y >= topoRaquete &&
        x >= paddleX - ballRadius / 2 && x <= paddleX + paddleWidth + ballRadius / 2) {
        y = topoRaquete;
        ({ vx, vy } = rebaterNaRaquete(x, paddleX, paddleWidth, velocidadeDoNivel(level)));
    }

    if (y > canvas.height) {
        gameOver('Fim de jogo');
        return;
    }
    collisionDetection();
}

/* --- Laço --- */
function draw(time) {
    if (!gameRunning || paused) return;
    if (lastTime === null) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.05); // trava saltos (aba em segundo plano)
    lastTime = time;
    atualizar(dt);
    if (!gameRunning) return;
    render();
    animationId = requestAnimationFrame(draw);
}

function agendarLaco() {
    cancelAnimationFrame(animationId);
    lastTime = null;
    animationId = requestAnimationFrame(draw);
}

/* --- Partida --- */
async function gameOver(msg) {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    rightPressed = leftPressed = false;
    render();
    const pontos = score;
    tituloInicio.textContent = msg;
    botaoJogar.textContent = 'Jogar de novo';
    mostrarFimDeJogo(camadaInicio, { pontos, recordeNovo: false });
    camadaInicio.hidden = false;
    botaoJogar.focus();
    const recordeNovo = window.salvarRecordeDB ? await window.salvarRecordeDB(pontos, 'breakout') : false;
    if (recordeNovo && !gameRunning) mostrarFimDeJogo(camadaInicio, { pontos, recordeNovo });
}

function startGame() {
    if (gameRunning) return;
    score = 0;
    level = 1;
    resetBall();
    initBricks();
    updateHUD();
    gameRunning = true;
    paused = false;
    camadaInicio.hidden = true;
    camadaPausa.hidden = true;
    esconderFimDeJogo(camadaInicio);
    agendarLaco();
}

function togglePause() {
    if (!gameRunning) return;
    paused = !paused;
    camadaPausa.hidden = !paused;
    if (paused) {
        cancelAnimationFrame(animationId);
        rightPressed = leftPressed = false;
        camadaPausa.querySelector('button').focus();
    } else {
        agendarLaco();
    }
}

/* --- Ligações --- */
botaoJogar.addEventListener('click', startGame);
document.querySelectorAll('[data-acao]').forEach(botao => {
    const nome = botao.dataset.acao;
    if (nome === 'pausa') {
        if (botao.classList.contains('controle')) ligarToque(botao, togglePause);
        else botao.addEventListener('click', togglePause);
    } else {
        const definir = (valor) => { if (nome === 'left') leftPressed = valor; else rightPressed = valor; };
        ligarSegurar(botao, () => definir(true), () => definir(false));
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'Right') rightPressed = true;
    else if (e.key === 'ArrowLeft' || e.key === 'Left') leftPressed = true;
    else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameRunning) { e.preventDefault(); togglePause(); }
        return;
    } else return;
    if (gameRunning) e.preventDefault(); // setas não rolam a página durante o jogo
});
document.addEventListener('keyup', e => {
    if (e.key === 'ArrowRight' || e.key === 'Right') rightPressed = false;
    else if (e.key === 'ArrowLeft' || e.key === 'Left') leftPressed = false;
});

ligarBotaoTema(document.getElementById('botaoTema'));
aoMudarTema(render);
initBricks();
render();
