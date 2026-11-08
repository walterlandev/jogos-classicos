/* ==========================================================================
   Breakout — tela, laço, física e entrada.
   Física por tempo real (px/s × segundos), em subpassos curtos para a bola
   rápida não atravessar tijolos. Regras em logica/breakout.js e logica/bola.js;
   cores sempre da paleta do tema atual.
========================================================================== */
import {
    montarFase, faseConcluida, pontosGolpe, bonusFase, vidasGanhas,
    colisaoCirculoRet, sortearPoder, fasesIniciais, GRADE,
} from './logica/breakout.js';
import { velocidadeDaFase, aceleracao, rebaterNaRaquete } from './logica/bola.js';
import { mostrarFimDeJogo, esconderFimDeJogo } from './aviso.js';
import { paleta, aoMudarTema, ligarBotaoTema } from './temas.js';
import { ligarToque } from './controles.js';

const $ = (id) => document.getElementById(id);
const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d');
const tela = canvas.parentElement;
const camadaInicio = $('camadaInicio');
const camadaPausa = $('camadaPausa');
const tituloInicio = camadaInicio.querySelector('.camada-titulo');
const botaoJogar = $('botaoJogar');
const seletorFase = $('faseInicial');
const avisoEl = $('avisoJogo');

const W = canvas.width;   // 400
const H = canvas.height;  // 560
const RAIO = 5;
const RAQUETE_Y = H - 36;
const RAQUETE_ALTURA = 10;
const LARGURA_NORMAL = 72;
const LARGURA_LARGA = 112;
const VELOCIDADE_RAQUETE = 480; // px/s pelas setas
const QUEDA_PODER = 120;        // px/s
const DURACAO = { larga: 15000, lenta: 10000 };
const NOMES_PODER = { larga: 'Raquete larga', multi: 'Multibola', lenta: 'Bola lenta', vida: 'Vida extra!' };
const LETRA_PODER = { larga: 'L', multi: 'M', lenta: 'D', vida: '+' };
const CHAVE_FASE_MAX = 'breakout_fase_max';

/* --- Estado --- */
let tijolos = [];
let bolas = [];
let poderes = [];
let raqueteX = (W - LARGURA_NORMAL) / 2;   // borda esquerda
let pontos = 0;
let vidas = 3;
let fase = 1;
let faseMax = lerFaseMaxLocal();
let rebatidas = 0;
let relogio = 0;          // ms de jogo (para na pausa)
let larguraAte = 0;
let lentaAte = 0;
let esquerda = false;
let direita = false;
let rodando = false;
let pausado = false;
let lastTime = null;
let animationId = null;
let avisoTimer = null;

function lerFaseMaxLocal() {
    try { return Math.max(1, Number(localStorage.getItem(CHAVE_FASE_MAX)) || 1); } catch { return 1; }
}

const larguraRaquete = () => (relogio < larguraAte ? LARGURA_LARGA : LARGURA_NORMAL);
const velocidade = () => velocidadeDaFase(fase) * aceleracao(rebatidas) * (relogio < lentaAte ? 0.7 : 1);

/* --- Bolas --- */
function bolaPresa() {
    return { x: raqueteX + larguraRaquete() / 2, y: RAQUETE_Y - RAIO - 1, vx: 0, vy: 0, presa: true };
}

function lancar() {
    for (const b of bolas) {
        if (!b.presa) continue;
        const desvio = (Math.random() - 0.5) * 0.4;   // nunca sobe 100 % reto
        Object.assign(b, rebaterNaRaquete(raqueteX + larguraRaquete() * (0.5 + desvio), raqueteX, larguraRaquete(), velocidade()));
        b.presa = false;
    }
}

function moverRaquetePara(centro) {
    const l = larguraRaquete();
    raqueteX = Math.max(0, Math.min(W - l, centro - l / 2));
}

/* --- Pontos, vidas, fases --- */
function somarPontos(n) {
    const antes = pontos;
    pontos += n;
    const ganhas = vidasGanhas(antes, pontos);
    if (ganhas > 0) {
        vidas += ganhas;
        avisar('Vida extra!');
    }
    atualizarPlacar();
}

function prepararFase() {
    tijolos = montarFase(fase);
    bolas = [bolaPresa()];
    poderes = [];
    rebatidas = 0;
    larguraAte = 0;
    lentaAte = 0;
    registrarFaseMax();
    atualizarPlacar();
}

function proximaFase() {
    somarPontos(bonusFase(fase));
    fase++;
    avisar(`Fase ${fase}`);
    prepararFase();
}

function perderVida() {
    vidas--;
    atualizarPlacar();
    if (vidas <= 0) return gameOver();
    bolas = [bolaPresa()];
    poderes = [];
    rebatidas = 0;
    larguraAte = 0;
    lentaAte = 0;
    avisar(vidas === 1 ? 'Última vida' : `${vidas} vidas`);
}

function aplicarPoder(tipo) {
    avisar(NOMES_PODER[tipo]);
    if (tipo === 'larga') {
        const centro = raqueteX + larguraRaquete() / 2;
        larguraAte = relogio + DURACAO.larga;
        moverRaquetePara(centro);
    } else if (tipo === 'lenta') {
        lentaAte = relogio + DURACAO.lenta;
    } else if (tipo === 'vida') {
        vidas++;
        atualizarPlacar();
    } else if (tipo === 'multi') {
        if (bolas.every(b => b.presa)) lancar();
        const novas = [];
        for (const b of bolas.filter(k => !k.presa)) {
            for (const giro of [-0.45, 0.45]) {
                const c = Math.cos(giro), s = Math.sin(giro);
                novas.push({ x: b.x, y: b.y, vx: b.vx * c - b.vy * s, vy: b.vx * s + b.vy * c, presa: false });
            }
        }
        bolas.push(...novas.slice(0, 12 - bolas.length));
    }
}

/* --- Física --- */
function passoBola(b, dt) {
    // Mantém a direção e ajusta a rapidez atual (aceleração, bola lenta).
    const v = velocidade();
    const mod = Math.hypot(b.vx, b.vy) || 1;
    b.vx = b.vx / mod * v;
    b.vy = b.vy / mod * v;
    if (b.vy > -40 && b.vy < 40) b.vy = b.vy < 0 ? -40 : 40; // evita bola presa na horizontal

    const distancia = v * dt;
    const n = Math.max(1, Math.ceil(distancia / 4));
    for (let i = 0; i < n; i++) {
        const xAntes = b.x, yAntes = b.y;
        b.x += b.vx * dt / n;
        b.y += b.vy * dt / n;

        if (b.x < RAIO) { b.x = RAIO; b.vx = Math.abs(b.vx); }
        else if (b.x > W - RAIO) { b.x = W - RAIO; b.vx = -Math.abs(b.vx); }
        if (b.y < RAIO) { b.y = RAIO; b.vy = Math.abs(b.vy); }

        // Raquete: só quando a bola desce e cruza a borda de cima.
        const topo = RAQUETE_Y - RAIO;
        const l = larguraRaquete();
        if (b.vy > 0 && yAntes <= topo && b.y >= topo && b.x >= raqueteX - RAIO && b.x <= raqueteX + l + RAIO) {
            b.y = topo;
            rebatidas++;
            Object.assign(b, rebaterNaRaquete(b.x, raqueteX, l, velocidade()));
            continue;
        }

        // Tijolos: no máximo um por subpasso.
        for (const t of tijolos) {
            if (!t.eterno && t.golpes <= 0) continue;
            const eixo = colisaoCirculoRet(b.x, b.y, RAIO, t.x, t.y, GRADE.largura, GRADE.altura);
            if (!eixo) continue;
            b.x = xAntes;
            b.y = yAntes;
            if (eixo === 'x') b.vx = -b.vx; else b.vy = -b.vy;
            if (!t.eterno) {
                t.golpes--;
                const quebrou = t.golpes <= 0;
                somarPontos(pontosGolpe(t, quebrou));
                if (quebrou) {
                    const poder = sortearPoder();
                    if (poder) poderes.push({ x: t.x + GRADE.largura / 2, y: t.y + GRADE.altura / 2, tipo: poder });
                }
            }
            break;
        }
        if (b.y - RAIO > H) return false; // caiu
    }
    return true;
}

function atualizar(dt) {
    relogio += dt * 1000;
    if (direita) moverRaquetePara(raqueteX + larguraRaquete() / 2 + VELOCIDADE_RAQUETE * dt);
    else if (esquerda) moverRaquetePara(raqueteX + larguraRaquete() / 2 - VELOCIDADE_RAQUETE * dt);
    if (relogio >= larguraAte && raqueteX > W - larguraRaquete()) raqueteX = W - larguraRaquete();

    for (const b of bolas) {
        if (b.presa) { b.x = raqueteX + larguraRaquete() / 2; b.y = RAQUETE_Y - RAIO - 1; }
    }
    bolas = bolas.filter(b => b.presa || passoBola(b, dt));
    if (!rodando) return;
    if (faseConcluida(tijolos)) return proximaFase();
    if (bolas.length === 0) return perderVida();

    for (const p of poderes) p.y += QUEDA_PODER * dt;
    poderes = poderes.filter(p => {
        const pegou = p.y + 6 >= RAQUETE_Y && p.y - 6 <= RAQUETE_Y + RAQUETE_ALTURA &&
                      p.x >= raqueteX - 8 && p.x <= raqueteX + larguraRaquete() + 8;
        if (pegou) aplicarPoder(p.tipo);
        return !pegou && p.y - 6 < H;
    });
}

/* --- Desenho --- */
function render() {
    const p = paleta();
    ctx.globalAlpha = 1;
    ctx.fillStyle = p.fundo;
    ctx.fillRect(0, 0, W, H);
    const { largura: tw, altura: th } = GRADE;
    for (const t of tijolos) {
        if (t.eterno) {
            ctx.strokeStyle = p.texto;
            ctx.lineWidth = 2;
            ctx.strokeRect(t.x + 1, t.y + 1, tw - 2, th - 2);
            ctx.fillStyle = p.texto;
            ctx.fillRect(t.x + tw / 2 - 2, t.y + th / 2 - 2, 4, 4);
            continue;
        }
        if (t.golpes <= 0) continue;
        ctx.fillStyle = p.tijolos[t.lin % p.tijolos.length];
        ctx.fillRect(t.x, t.y, tw, th);
        // Golpes que faltam além do último: uma barra para cada.
        ctx.fillStyle = p.fundo;
        for (let i = 0; i < t.golpes - 1; i++) {
            ctx.fillRect(t.x + tw / 2 - 5 + i * 7, t.y + 3, 3, th - 6);
        }
    }
    for (const pd of poderes) {
        ctx.fillStyle = p.bola;
        ctx.fillRect(pd.x - 12, pd.y - 7, 24, 14);
        ctx.fillStyle = p.fundo;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(LETRA_PODER[pd.tipo], pd.x, pd.y + 1);
    }
    ctx.fillStyle = p.bola;
    for (const b of bolas) ctx.fillRect(b.x - RAIO, b.y - RAIO, RAIO * 2, RAIO * 2);
    ctx.fillStyle = p.raquete;
    const l = larguraRaquete(), seg = l / 5;
    for (let i = 0; i < 5; i++) ctx.fillRect(raqueteX + i * seg, RAQUETE_Y, seg - 1, RAQUETE_ALTURA);
}

function atualizarPlacar() {
    $('pontos').textContent = pontos;
    $('fase').textContent = fase;
    $('vidas').textContent = vidas;
}

function avisar(texto) {
    avisoEl.textContent = texto;
    avisoEl.classList.add('visivel');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => avisoEl.classList.remove('visivel'), 1100);
}

/* --- Laço --- */
function laco(time) {
    if (!rodando || pausado) return;
    if (lastTime === null) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.05); // trava saltos (aba em segundo plano)
    lastTime = time;
    atualizar(dt);
    if (!rodando) return;
    render();
    animationId = requestAnimationFrame(laco);
}

function agendarLaco() {
    cancelAnimationFrame(animationId);
    lastTime = null;
    animationId = requestAnimationFrame(laco);
}

/* --- Fase inicial --- */
function montarSeletorFase() {
    const escolhida = Number(seletorFase.value) || 1;
    const opcoes = fasesIniciais(faseMax);
    seletorFase.replaceChildren(...opcoes.map(n => {
        const o = document.createElement('option');
        o.value = n;
        o.textContent = n;
        return o;
    }));
    seletorFase.value = opcoes.includes(escolhida) ? escolhida : 1;
}

function registrarFaseMax() {
    if (fase <= faseMax) return;
    faseMax = fase;
    try { localStorage.setItem(CHAVE_FASE_MAX, String(faseMax)); } catch { /* navegação privada */ }
    window.salvarNivelMaxDB?.('breakout', faseMax);
    montarSeletorFase();
}

/* --- Partida --- */
async function gameOver() {
    rodando = false;
    cancelAnimationFrame(animationId);
    esquerda = direita = false;
    render();
    const total = pontos;
    tituloInicio.textContent = 'Fim de jogo';
    botaoJogar.textContent = 'Jogar de novo';
    mostrarFimDeJogo(camadaInicio, { pontos: total, recordeNovo: false, detalhe: `Chegou à fase ${fase}` });
    camadaInicio.hidden = false;
    botaoJogar.focus();
    const recordeNovo = window.salvarRecordeDB ? await window.salvarRecordeDB(total, 'breakout') : false;
    if (recordeNovo && !rodando) {
        mostrarFimDeJogo(camadaInicio, { pontos: total, recordeNovo, detalhe: `Chegou à fase ${fase}` });
    }
}

function startGame() {
    if (rodando) return;
    pontos = 0;
    vidas = 3;
    fase = Number(seletorFase.value) || 1;
    relogio = 0;
    raqueteX = (W - LARGURA_NORMAL) / 2;
    prepararFase();
    rodando = true;
    pausado = false;
    camadaInicio.hidden = true;
    camadaPausa.hidden = true;
    esconderFimDeJogo(camadaInicio);
    agendarLaco();
}

function togglePause() {
    if (!rodando) return;
    pausado = !pausado;
    camadaPausa.hidden = !pausado;
    if (pausado) {
        cancelAnimationFrame(animationId);
        esquerda = direita = false;
        camadaPausa.querySelector('button').focus();
    } else {
        agendarLaco();
    }
}

/* --- Entrada --- */
// Raquete segue o dedo ou o mouse em qualquer ponto do campo; toque/clique lança.
function xNoCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return (e.clientX - r.left) * (W / r.width);
}
tela.addEventListener('pointermove', e => {
    if (rodando && !pausado) moverRaquetePara(xNoCanvas(e));
});
tela.addEventListener('pointerdown', e => {
    if (!rodando || pausado || e.target !== canvas) return;
    e.preventDefault();
    moverRaquetePara(xNoCanvas(e));
    lancar();
});

botaoJogar.addEventListener('click', startGame);
document.querySelectorAll('[data-acao="pausa"]').forEach(botao => {
    if (botao.classList.contains('controle')) ligarToque(botao, togglePause);
    else botao.addEventListener('click', togglePause);
});

document.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (rodando) { e.preventDefault(); togglePause(); }
        return;
    }
    if (!rodando) return;
    if (e.key === 'ArrowRight') direita = true;
    else if (e.key === 'ArrowLeft') esquerda = true;
    else if (e.key === ' ') { if (!e.repeat) lancar(); }
    else return;
    e.preventDefault(); // setas e espaço não rolam a página durante o jogo
});
document.addEventListener('keyup', e => {
    if (e.key === 'ArrowRight') direita = false;
    else if (e.key === 'ArrowLeft') esquerda = false;
});

// Fase máxima do perfil (outro aparelho) soma com a deste navegador.
window.addEventListener('perfilcarregado', e => {
    const doPerfil = Number(e.detail?.nivel_max_breakout) || 1;
    if (doPerfil > faseMax) {
        faseMax = doPerfil;
        try { localStorage.setItem(CHAVE_FASE_MAX, String(faseMax)); } catch { /* navegação privada */ }
        montarSeletorFase();
    } else if (faseMax > doPerfil) {
        window.salvarNivelMaxDB?.('breakout', faseMax);
    }
});

ligarBotaoTema($('botaoTema'));
aoMudarTema(render);
tijolos = montarFase(1);
bolas = [bolaPresa()];
montarSeletorFase();
render();
