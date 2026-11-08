/* ==========================================================================
   Breakout — tela, laço e controles.
   Física por tempo real (px/s × segundos), igual em qualquer taxa de quadros.
   A rebatida e a velocidade por nível moram em logica/bola.js.
========================================================================== */
import { velocidadeDoNivel, rebaterNaRaquete } from './logica/bola.js';
import { mostrarFimDeJogo, esconderFimDeJogo } from './aviso.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const frame = canvas.parentElement;

const startBtn = document.getElementById('startBtnOverlay');
const scoreDisplay = [document.getElementById('scorePC'), document.getElementById('scoreMob')];
const levelDisplay = [document.getElementById('levelPC'), document.getElementById('levelMob')];
const pauseOverlay = document.getElementById('pauseOverlay');

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
const PADDLE_SPEED = 420; // px/s (era 7 px por quadro a 60 Hz)
let paddleX = (canvas.width - paddleWidth) / 2;

/* --- Bola --- */
let x, y;   // posição
let vx, vy; // velocidade em px/s
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

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'Right') rightPressed = true;
    else if (e.key === 'ArrowLeft' || e.key === 'Left') leftPressed = true;
    else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameRunning) { e.preventDefault(); window.togglePause(); }
        return;
    } else return;
    if (gameRunning) e.preventDefault(); // setas não rolam a página durante o jogo
});
document.addEventListener('keyup', e => {
    if (e.key === 'ArrowRight' || e.key === 'Right') rightPressed = false;
    else if (e.key === 'ArrowLeft' || e.key === 'Left') leftPressed = false;
});

window.handleInput = function (dir, isPressed) {
    if (dir === 'right') rightPressed = isPressed;
    if (dir === 'left') leftPressed = isPressed;
};

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

function checkWin() {
    return bricks.every(coluna => coluna.every(b => b.status === 0));
}

function nextLevel() {
    if (level < 10) {
        level++;
        resetBall();
        initBricks();
        updateHUD();
    } else {
        gameOver('VOCÊ VENCEU!');
    }
}

function updateHUD() {
    scoreDisplay.forEach(el => { if (el) el.textContent = String(score).padStart(5, '0'); });
    levelDisplay.forEach(el => { if (el) el.textContent = level; });
}

/* --- Desenho --- */
function drawBall() {
    ctx.fillStyle = '#0ff';
    ctx.fillRect(x - ballRadius / 2, y - ballRadius / 2, ballRadius, ballRadius);
}

function drawPaddle() {
    ctx.fillStyle = '#0f0';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(paddleX + i * paddleSegmentWidth, paddleY, paddleSegmentWidth - 1, paddleHeight);
    }
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status !== 1) continue;
            ctx.fillStyle = `hsl(${r * 40}, 100%, 50%)`;
            ctx.fillRect(b.x, b.y, brickWidth, brickHeight);
        }
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
}

/* --- Física de um passo de dt segundos --- */
function atualizar(dt) {
    // Raquete
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
        gameOver('FIM DE JOGO');
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

/* --- Fim de jogo --- */
async function gameOver(msg) {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    render();
    startBtn.style.display = 'block';
    startBtn.innerText = '↻ REINICIAR';
    const pontos = score;
    mostrarFimDeJogo(frame, { titulo: msg, pontos, recordeNovo: false });
    const recordeNovo = window.salvarRecordeDB ? await window.salvarRecordeDB(pontos, 'breakout') : false;
    if (recordeNovo && !gameRunning) mostrarFimDeJogo(frame, { titulo: msg, pontos, recordeNovo });
}

/* --- Funções chamadas pelo HTML --- */
window.startGame = function () {
    if (gameRunning) return;
    score = 0;
    level = 1;
    resetBall();
    initBricks();
    updateHUD();
    gameRunning = true;
    paused = false;
    startBtn.style.display = 'none';
    pauseOverlay.style.display = 'none';
    esconderFimDeJogo(frame);
    agendarLaco();
};

window.togglePause = function () {
    if (!gameRunning) return;
    paused = !paused;
    pauseOverlay.style.display = paused ? 'block' : 'none';
    if (paused) cancelAnimationFrame(animationId);
    else agendarLaco();
};
