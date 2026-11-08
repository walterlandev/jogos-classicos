/* ==========================================================================
   Snake — tela, laço e controles.
   Regras (passo, fila de comandos, níveis, bônus) em logica/cobra.js;
   cores sempre da paleta do tema atual (temas.js).
========================================================================== */
import {
    GRADE, DIRECOES, enfileirar, passo, celulaLivre,
    nivelPorPontos, intervaloDoNivel, marcoDeBonus,
} from './logica/cobra.js';
import { mostrarFimDeJogo, esconderFimDeJogo } from './aviso.js';
import { paleta, aoMudarTema, ligarBotaoTema } from './temas.js';
import { ligarToque } from './controles.js';

const canvas = document.getElementById('snakeGame');
const ctx = canvas.getContext('2d');
const CELULA = canvas.width / GRADE; // 400 / 20 = 20 px; o CSS escala sem distorcer
const pontosEl = document.getElementById('pontos');
const nivelEl = document.getElementById('nivel');
const camadaInicio = document.getElementById('camadaInicio');
const camadaPausa = document.getElementById('camadaPausa');
const tituloInicio = camadaInicio.querySelector('.camada-titulo');
const botaoJogar = document.getElementById('botaoJogar');

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
let piscar = false;
let loop = null;
let rodando = false;
let pausado = false;

/* --- Partida --- */
function startGame() {
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
    camadaInicio.hidden = true;
    camadaPausa.hidden = true;
    esconderFimDeJogo(camadaInicio);
    updateHUD();
    agendar();
    desenhar();
}

function agendar() {
    clearInterval(loop);
    loop = setInterval(tique, intervalo);
}

function togglePause() {
    if (!rodando) return;
    pausado = !pausado;
    camadaPausa.hidden = !pausado;
    if (pausado) {
        clearInterval(loop);
        camadaPausa.querySelector('button').focus();
    } else {
        agendar();
    }
}

async function gameOver() {
    rodando = false;
    clearInterval(loop);
    loop = null;
    const pontos = score;
    tituloInicio.textContent = 'Fim de jogo';
    botaoJogar.textContent = 'Jogar de novo';
    mostrarFimDeJogo(camadaInicio, { pontos, recordeNovo: false });
    camadaInicio.hidden = false;
    botaoJogar.focus();
    const recordeNovo = window.salvarRecordeDB ? await window.salvarRecordeDB(pontos, 'snake') : false;
    if (recordeNovo && !rodando) mostrarFimDeJogo(camadaInicio, { pontos, recordeNovo });
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
    piscar = !piscar;
    desenhar();
}

/* --- Desenho --- */
function quadrado(p, cor) {
    ctx.fillStyle = cor;
    ctx.fillRect(p.x * CELULA + 1, p.y * CELULA + 1, CELULA - 2, CELULA - 2);
}

function desenhar() {
    const pal = paleta();
    ctx.fillStyle = pal.fundo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (pal.vazio) {
        for (let y = 0; y < GRADE; y++)
            for (let x = 0; x < GRADE; x++) quadrado({ x, y }, pal.vazio);
    }
    if (!cobra.length) return;
    // Comida bônus pisca entre as duas cores de bônus do tema.
    if (comida) quadrado(comida, bonusRestanteMs > 0 ? pal.bonus[piscar ? 1 : 0] : pal.comida);
    cobra.forEach((p, i) => quadrado(p, i === 0 ? pal.cabeca : pal.cobra));
}

function updateHUD() {
    pontosEl.textContent = score;
    nivelEl.textContent = level;
}

/* --- Controles --- */
function acao(nome) {
    if (nome === 'pausa') return togglePause();
    if (!rodando || pausado) return;
    fila = enfileirar(fila, direcao, DIRECOES[nome]);
}

botaoJogar.addEventListener('click', startGame);
document.querySelectorAll('[data-acao]').forEach(botao => {
    const nome = botao.dataset.acao;
    if (botao.classList.contains('controle')) ligarToque(botao, () => acao(nome));
    else botao.addEventListener('click', () => acao(nome));
});

const TECLAS = {
    arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
    arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
};
document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'p' || k === 'escape') {
        if (rodando) { e.preventDefault(); togglePause(); }
        return;
    }
    if (TECLAS[k] && rodando) {
        e.preventDefault(); // setas não rolam a página durante o jogo
        acao(TECLAS[k]);
    }
});

ligarBotaoTema(document.getElementById('botaoTema'));
aoMudarTema(desenhar);
desenhar();
updateHUD();
