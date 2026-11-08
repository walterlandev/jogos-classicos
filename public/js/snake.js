/* ==========================================================================
   Snake — tique, desenho e entrada.
   Regras (passo, mapas, metas, pontos, fila de comandos) em logica/cobra.js;
   cores sempre da paleta do tema atual.
========================================================================== */
import {
    GRADE, DIRECOES, enfileirar, passo, celulaLivre, montarMapa,
    metaDaFase, intervaloDaFase, pontosFruta, bonusFase, fasesIniciais,
} from './logica/cobra.js';
import { mostrarFimDeJogo, esconderFimDeJogo } from './aviso.js';
import { paleta, aoMudarTema, ligarBotaoTema } from './temas.js';
import { ligarToque } from './controles.js';
import { registrarPartida, textosDoFim } from './progresso.js';
import { tocar, ligarBotaoSom } from './som.js';

const $ = (id) => document.getElementById(id);
const canvas = $('snakeGame');
const ctx = canvas.getContext('2d');
const CELULA = canvas.width / GRADE; // 20 px; o CSS escala sem distorcer
const camadaInicio = $('camadaInicio');
const camadaPausa = $('camadaPausa');
const tituloInicio = camadaInicio.querySelector('.camada-titulo');
const botaoJogar = $('botaoJogar');
const seletorFase = $('faseInicial');
const avisoEl = $('avisoJogo');

const DURACAO_OURO_MS = 8000;
const FRUTAS_PARA_OURO = 5;
const CHAVE_FASE_MAX = 'snake_fase_max';

let mapa = montarMapa(1);
let cobra = [];
let comida = null;
let ouro = null;           // fruta dourada: { x, y } ou null
let ouroRestanteMs = 0;
let paraOuro = 0;
let direcao = DIRECOES.right;
let fila = [];
let pontos = 0;
let vidas = 3;
let fase = 1;
let frutasFase = 0;
let frutasTotal = 0;
let fasesConcluidas = 0;
let douradas = 0;
let maiorTamanho = 3;
let faseMax = lerFaseMaxLocal();
let intervalo = intervaloDaFase(1);
let piscar = false;
let loop = null;
let rodando = false;
let pausado = false;
let aguardando = false;    // pausa curta depois de bater
let avisoTimer = null;

function lerFaseMaxLocal() {
    try { return Math.max(1, Number(localStorage.getItem(CHAVE_FASE_MAX)) || 1); } catch { return 1; }
}

/* --- Fases e vidas --- */
function iniciarFase() {
    aguardando = false;
    mapa = montarMapa(fase);
    const { x, y } = mapa.inicio;
    cobra = [{ x, y }, { x: x - 1, y }, { x: x - 2, y }];
    direcao = DIRECOES.right;
    fila = [];
    frutasFase = 0;
    paraOuro = 0;
    ouro = null;
    ouroRestanteMs = 0;
    comida = celulaLivre(cobra, GRADE, Math.random, mapa.paredes);
    intervalo = intervaloDaFase(fase);
    atualizarPlacar();
    desenhar();
    if (!pausado) agendar();
}

function agendar() {
    clearInterval(loop);
    loop = setInterval(tique, intervalo);
}

function concluirFase() {
    tocar('nivel');
    pontos += bonusFase(fase);
    fasesConcluidas++;
    fase++;
    registrarFaseMax();
    iniciarFase();
    avisar(mapa.aberta ? `Fase ${fase}: borda aberta` : `Fase ${fase}`);
}

function perderVida() {
    tocar('vida');
    clearInterval(loop);
    vidas--;
    atualizarPlacar();
    desenhar();
    if (vidas <= 0) return gameOver();
    avisar(vidas === 1 ? 'Última vida' : `${vidas} vidas`);
    aguardando = true;
    setTimeout(() => { if (rodando) iniciarFase(); }, 700);
}

/* --- Tique --- */
function tique() {
    direcao = fila.shift() ?? direcao;
    const r = passo(cobra, direcao, comida, GRADE, mapa);
    if (r.morreu) return perderVida();
    cobra = r.cobra;
    maiorTamanho = Math.max(maiorTamanho, cobra.length);

    if (ouro) {
        if (cobra[0].x === ouro.x && cobra[0].y === ouro.y) {
            pontos += pontosFruta(fase, true);
            douradas++;
            tocar('dourada');
            cobra = cobra.slice(0, Math.max(3, cobra.length - 3));
            ouro = null;
        } else {
            ouroRestanteMs -= intervalo;
            if (ouroRestanteMs <= 0) ouro = null;
        }
    }

    if (r.comeu) {
        pontos += pontosFruta(fase, false);
        frutasTotal++;
        tocar('fruta');
        frutasFase++;
        paraOuro++;
        if (frutasFase >= metaDaFase(fase)) return concluirFase();
        const ocupadas = new Set(mapa.paredes);
        if (ouro) ocupadas.add(`${ouro.x},${ouro.y}`);
        comida = celulaLivre(cobra, GRADE, Math.random, ocupadas);
        if (paraOuro >= FRUTAS_PARA_OURO && !ouro) {
            paraOuro = 0;
            const bloqueadas = new Set(mapa.paredes);
            bloqueadas.add(`${comida.x},${comida.y}`);
            ouro = celulaLivre(cobra, GRADE, Math.random, bloqueadas);
            ouroRestanteMs = DURACAO_OURO_MS;
            avisar('Fruta dourada!');
        }
    }
    atualizarPlacar();
    piscar = !piscar;
    desenhar();
}

/* --- Desenho --- */
function quadrado(x, y, cor) {
    ctx.fillStyle = cor;
    ctx.fillRect(x * CELULA + 1, y * CELULA + 1, CELULA - 2, CELULA - 2);
}

function desenhar() {
    const p = paleta();
    ctx.fillStyle = p.fundo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRADE; y++) {
        for (let x = 0; x < GRADE; x++) {
            if (mapa.paredes.has(`${x},${y}`)) {
                ctx.fillStyle = p.parede;
                ctx.fillRect(x * CELULA, y * CELULA, CELULA, CELULA);
            } else if (p.vazio) quadrado(x, y, p.vazio);
        }
    }
    // Borda fechada é uma moldura; borda aberta fica sem moldura.
    if (!mapa.aberta) {
        ctx.strokeStyle = p.parede;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    }
    if (!cobra.length) return;
    if (comida) quadrado(comida.x, comida.y, p.comida);
    if (ouro) quadrado(ouro.x, ouro.y, p.bonus[piscar ? 1 : 0]);
    cobra.forEach((c, i) => quadrado(c.x, c.y, i === 0 ? p.cabeca : p.cobra));
}

function atualizarPlacar() {
    $('pontos').textContent = pontos;
    $('fase').textContent = fase;
    $('frutas').textContent = `${frutasFase}/${metaDaFase(fase)}`;
    $('vidas').textContent = vidas;
}

function avisar(texto) {
    avisoEl.textContent = texto;
    avisoEl.classList.add('visivel');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => avisoEl.classList.remove('visivel'), 1300);
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
    window.salvarNivelMaxDB?.('snake', faseMax);
    montarSeletorFase();
}

/* --- Partida --- */
function startGame() {
    if (rodando) return;
    pontos = 0;
    vidas = 3;
    frutasTotal = 0;
    fasesConcluidas = 0;
    douradas = 0;
    maiorTamanho = 3;
    fase = Number(seletorFase.value) || 1;
    rodando = true;
    pausado = false;
    camadaInicio.hidden = true;
    camadaPausa.hidden = true;
    esconderFimDeJogo(camadaInicio);
    iniciarFase();
    if (mapa.aberta) avisar('Borda aberta');
}

function togglePause() {
    if (!rodando || aguardando) return;
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
    tocar('fim');
    rodando = false;
    clearInterval(loop);
    loop = null;
    const total = pontos;
    tituloInicio.textContent = 'Fim de jogo';
    botaoJogar.textContent = 'Jogar de novo';
    const extras = textosDoFim(registrarPartida('snake', { frutas: frutasTotal, fasesConcluidas, faseMax: fase, douradas, maiorTamanho }));
    mostrarFimDeJogo(camadaInicio, { pontos: total, recordeNovo: false, detalhe: `Chegou à fase ${fase}`, extras });
    camadaInicio.hidden = false;
    botaoJogar.focus();
    const recordeNovo = window.salvarRecordeDB ? await window.salvarRecordeDB(total, 'snake') : false;
    if (recordeNovo && !rodando) {
        mostrarFimDeJogo(camadaInicio, { pontos: total, recordeNovo, detalhe: `Chegou à fase ${fase}`, extras });
    }
}

/* --- Entrada --- */
function acao(nome) {
    if (nome === 'pausa') return togglePause();
    if (!rodando || pausado || aguardando) return;
    fila = enfileirar(fila, direcao, DIRECOES[nome]);
}

botaoJogar.addEventListener('click', startGame);
document.querySelectorAll('[data-acao]').forEach(botao => {
    const nome = botao.dataset.acao;
    if (botao.classList.contains('controle')) ligarToque(botao, () => acao(nome));
    else botao.addEventListener('click', () => acao(nome));
});

// Deslizar no campo: a cada 24 px na direção dominante, um comando.
let origem = null;
canvas.addEventListener('pointerdown', e => {
    origem = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
    if (!origem) return;
    const dx = e.clientX - origem.x, dy = e.clientY - origem.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    acao(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    origem = { x: e.clientX, y: e.clientY };
});
for (const ev of ['pointerup', 'pointercancel']) canvas.addEventListener(ev, () => { origem = null; });

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

// Fase máxima do perfil (outro aparelho) soma com a deste navegador.
window.addEventListener('perfilcarregado', e => {
    const doPerfil = Number(e.detail?.nivel_max_snake) || 1;
    if (doPerfil > faseMax) {
        faseMax = doPerfil;
        try { localStorage.setItem(CHAVE_FASE_MAX, String(faseMax)); } catch { /* navegação privada */ }
        montarSeletorFase();
    } else if (faseMax > doPerfil) {
        window.salvarNivelMaxDB?.('snake', faseMax);
    }
});

ligarBotaoTema($('botaoTema'));
ligarBotaoSom($('botaoSom'));
aoMudarTema(desenhar);
montarSeletorFase();
desenhar();
atualizarPlacar();
