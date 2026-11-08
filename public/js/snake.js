/* ==========================================================================
   Snake — tela, laço e controles.
   A lógica (passo, fila de comandos, níveis, bônus) mora em logica/cobra.js.
========================================================================== */
import {
    GRADE, DIRECOES, enfileirar, passo, celulaLivre,
    nivelPorPontos, intervaloDoNivel, marcoDeBonus,
} from './logica/cobra.js';
import { mostrarFimDeJogo, esconderFimDeJogo } from './aviso.js';

const canvas = document.getElementById('snakeGame');
const ctx = canvas.getContext('2d');
const area = canvas.parentElement;
const scoreEl = document.getElementById('snakeScore');
const levelEl = document.getElementById('snakeLevel');
const btnStart = document.querySelector('.btn-start');

const DURACAO_BONUS_MS = 10000;

let cobra = [];
let comida = null;
let direcao = DIRECOES.right;
let fila = [];
let score = 0;
let level = 1;
let intervalo = intervaloDoNivel(1);
let ultimoMarco = 0;
let bonusRestanteMs = 0;
let loop = null;
let rodando = false;
let pausado = false;
let celula = 20; // pixels por célula; só muda a escala, nunca a grade

/* --- Partida --- */
window.startGame = () => {
    if (rodando) return;
    cobra = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    direcao = DIRECOES.right;
    fila = [];
    score = 0;
    level = 1;
    intervalo = intervaloDoNivel(1);
    ultimoMarco = 0;
    bonusRestanteMs = 0;
    comida = celulaLivre(cobra, GRADE);
    rodando = true;
    pausado = false;
    if (btnStart) btnStart.style.display = 'none';
    esconderFimDeJogo(area);
    updateHUD();
    agendar();
    desenhar();
};

function agendar() {
    clearInterval(loop);
    loop = setInterval(tique, intervalo);
}

window.togglePause = () => {
    if (!rodando) return;
    pausado = !pausado;
    if (pausado) {
        clearInterval(loop);
        desenhar();
    } else {
        agendar();
    }
};

async function gameOver() {
    rodando = false;
    clearInterval(loop);
    loop = null;
    if (btnStart) {
        btnStart.textContent = 'TENTAR NOVAMENTE';
        btnStart.style.display = 'block';
    }
    const pontos = score;
    mostrarFimDeJogo(area, { titulo: 'FIM DE JOGO', pontos, recordeNovo: false });
    const recordeNovo = window.salvarRecordeDB ? await window.salvarRecordeDB(pontos, 'snake') : false;
    if (recordeNovo && !rodando) mostrarFimDeJogo(area, { titulo: 'FIM DE JOGO', pontos, recordeNovo });
}

/* --- Tique do jogo --- */
function tique() {
    direcao = fila.shift() ?? direcao;
    const emBonus = bonusRestanteMs > 0;
    const r = passo(cobra, direcao, comida, GRADE);
    if (r.morreu) {
        desenhar();
        gameOver();
        return;
    }
    cobra = r.cobra;

    if (r.comeu) {
        if (emBonus) {
            score += 10;
            // O bônus encurta a cobra em até 5 partes, mantendo no mínimo 2.
            cobra = cobra.slice(0, Math.max(2, cobra.length - 5));
            bonusRestanteMs = 0;
        } else {
            score += 1;
        }
        const marco = marcoDeBonus(score);
        if (score > 0 && marco > ultimoMarco) {
            ultimoMarco = marco;
            bonusRestanteMs = DURACAO_BONUS_MS;
        }
        comida = celulaLivre(cobra, GRADE);
        const novoNivel = nivelPorPontos(score);
        if (novoNivel !== level) {
            level = novoNivel;
            intervalo = intervaloDoNivel(level);
            agendar();
        }
        updateHUD();
    } else if (emBonus) {
        // O tempo do bônus corre por tique: a pausa congela o bônus junto.
        bonusRestanteMs = Math.max(0, bonusRestanteMs - intervalo);
    }
    desenhar();
}

/* --- Desenho --- */
function quadrado(p, cor, brilho) {
    ctx.fillStyle = cor;
    ctx.shadowColor = cor;
    ctx.shadowBlur = brilho;
    ctx.fillRect(p.x * celula, p.y * celula, celula - 1, celula - 1);
}

function desenhar() {
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!cobra.length) return;

    if (comida) {
        if (bonusRestanteMs > 0) quadrado(comida, `hsl(${(Date.now() / 2) % 360}, 100%, 50%)`, 20);
        else quadrado(comida, '#ff00ff', 10);
    }
    cobra.forEach((p, i) => quadrado(p, i === 0 ? '#fff' : '#00ffff', i === 0 ? 20 : 10));
    ctx.shadowBlur = 0;

    if (pausado) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = "14px 'Press Start 2P'";
        ctx.textAlign = 'center';
        ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2);
    }
}

function updateHUD() {
    if (scoreEl) scoreEl.textContent = String(score).padStart(4, '0');
    if (levelEl) levelEl.textContent = level;
}

/* --- Controles --- */
function mudarDirecao(nome) {
    if (!rodando || pausado) return;
    fila = enfileirar(fila, direcao, DIRECOES[nome]);
}

window.handleMove = (e, dir) => {
    if (e && e.cancelable) e.preventDefault();
    mudarDirecao(dir);
};

const TECLAS = {
    arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
    arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
};

document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'p' || k === 'escape') {
        if (rodando) { e.preventDefault(); window.togglePause(); }
        return;
    }
    if (TECLAS[k] && rodando) {
        e.preventDefault(); // setas não rolam a página durante o jogo
        mudarDirecao(TECLAS[k]);
    }
});

/* --- Tamanho: a grade é sempre 20×20; a tela só muda a escala --- */
function resizeCanvas() {
    celula = Math.max(8, Math.floor(Math.min(window.innerWidth * 0.9, 400) / GRADE));
    canvas.width = canvas.height = celula * GRADE;
    desenhar();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
updateHUD();
