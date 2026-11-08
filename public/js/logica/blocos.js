// Lógica pura do jogo de blocos: sem DOM e sem canvas, testada em tests/blocos.test.js.
// Valores das células: 0 = vazio; 1..7 = cor da peça (índice em COLORS de tetris.js).

const FORMAS = {
    I: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
    L: [[0, 5, 0], [0, 5, 0], [0, 5, 5]],
    J: [[0, 6, 0], [0, 6, 0], [6, 6, 0]],
    O: [[7, 7], [7, 7]],
    S: [[0, 4, 4], [4, 4, 0], [0, 0, 0]],
    Z: [[3, 3, 0], [0, 3, 3], [0, 0, 0]],
    T: [[0, 2, 0], [2, 2, 2], [0, 0, 0]],
};
export const TIPOS = 'ILJOTSZ';

export function criarMatriz(largura, altura) {
    return Array.from({ length: altura }, () => new Array(largura).fill(0));
}

export function criarPeca(tipo) {
    return FORMAS[tipo].map(linha => [...linha]);
}

// Gira 90° no sentido horário e devolve uma matriz nova (a original não muda).
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

// Remove as linhas cheias (inclusive a do topo) e devolve quantas saíram.
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

// Saco de 7: uma peça de cada tipo, embaralhada (Fisher-Yates).
export function novoSaco(aleatorio = Math.random) {
    const saco = [...TIPOS];
    for (let i = saco.length - 1; i > 0; i--) {
        const j = Math.floor(aleatorio() * (i + 1));
        [saco[i], saco[j]] = [saco[j], saco[i]];
    }
    return saco;
}

const PONTOS_LINHAS = [0, 100, 300, 500, 800];
export const PONTOS_QUEDA = { suave: 1, instantanea: 2 };

// Pontos de uma peça encaixada que limpou `qtd` linhas.
// estado.combo: limpezas seguidas menos 1 (-1 = nenhuma em andamento).
// estado.b2b: a última limpeza foi de quatro linhas.
export function pontuar(qtd, nivel, estado = { combo: -1, b2b: false }) {
    if (qtd === 0) return { pontos: 0, combo: -1, b2b: estado.b2b, quatroSeguidas: false };
    const quatro = qtd === 4;
    const quatroSeguidas = quatro && estado.b2b;
    let pontos = PONTOS_LINHAS[qtd] * nivel;
    if (quatroSeguidas) pontos = Math.floor(pontos * 1.5);
    const combo = estado.combo + 1;
    if (combo > 0) pontos += 50 * combo * nivel;
    return { pontos, combo, b2b: quatro, quatroSeguidas };
}

export const nivelPorLinhas = (total, inicial = 1) => inicial + Math.floor(total / 10);
export const intervaloQueda = (nivel) => Math.max(50, Math.round(1000 * 0.85 ** (nivel - 1)));

// Linha (y) onde a peça pararia se caísse direto.
export function linhaFantasma(tabuleiro, matriz, pos) {
    let y = pos.y;
    while (!colide(tabuleiro, matriz, { x: pos.x, y: y + 1 })) y++;
    return y;
}

// Níveis em que o jogador pode começar, conforme o maior nível já alcançado.
export const niveisIniciais = (nivelMax) => [1, 5, 10, 15, 20].filter(n => n === 1 || n <= nivelMax);
