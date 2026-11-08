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

export const pontosPorLinhas = (qtd, nivel) => qtd * nivel;
export const nivelPorLinhas = (total) => Math.floor(total / 10) + 1;
export const intervaloQueda = (nivel) => Math.max(100, 1000 - (nivel - 1) * 50);
