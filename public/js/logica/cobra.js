// Lógica pura do Snake: sem DOM e sem canvas, testada em tests/cobra.test.js.
// Posições em células (0..GRADE-1), não em pixels.

export const GRADE = 20;
export const DIRECOES = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const INICIO = { x: 4, y: 10 };   // cobra nasce em (4,10), (3,10), (2,10) indo para a direita

const mesma = (a, b) => a.x === b.x && a.y === b.y;
const oposta = (a, b) => a.x === -b.x && a.y === -b.y;
const chave = (x, y) => `${x},${y}`;

// Cada comando é comparado com o último da fila (ou com a direção atual),
// então duas teclas rápidas nunca viram uma meia-volta.
export function enfileirar(fila, atual, nova, maximo = 2) {
    const referencia = fila.length ? fila[fila.length - 1] : atual;
    if (fila.length >= maximo || mesma(referencia, nova) || oposta(referencia, nova)) return fila;
    return [...fila, nova];
}

// Borda aberta: sai de um lado e entra do outro. Parede ou corpo: morre.
export function passo(cobra, direcao, comida, grade, { aberta = false, paredes = new Set() } = {}) {
    let x = cobra[0].x + direcao.x;
    let y = cobra[0].y + direcao.y;
    if (aberta) { x = (x + grade) % grade; y = (y + grade) % grade; }
    const cabeca = { x, y };
    const comeu = !!comida && mesma(cabeca, comida);
    const corpo = comeu ? cobra : cobra.slice(0, -1); // sem comer, o rabo sai antes
    const fora = x < 0 || y < 0 || x >= grade || y >= grade;
    if (fora || paredes.has(chave(x, y)) || corpo.some(p => mesma(p, cabeca))) {
        return { cobra, comeu: false, morreu: true };
    }
    return { cobra: [cabeca, ...corpo], comeu, morreu: false };
}

export function celulaLivre(cobra, grade, aleatorio = Math.random, bloqueadas = new Set()) {
    const livres = [];
    for (let y = 0; y < grade; y++)
        for (let x = 0; x < grade; x++)
            if (!bloqueadas.has(chave(x, y)) && !cobra.some(p => p.x === x && p.y === y)) livres.push({ x, y });
    return livres[Math.floor(aleatorio() * livres.length)];
}

/* --- Mapas --- */
// Paredes como retângulos [x1, y1, x2, y2] (inclusive). A saída (x 1–8, y 9–11) fica livre.
export const MAPAS = [
    { aberta: false, ret: [] },
    { aberta: true, ret: [] },
    { aberta: false, ret: [[5, 4, 14, 4], [5, 15, 14, 15]] },
    { aberta: true, ret: [[10, 0, 10, 7], [10, 12, 10, 19]] },
    { aberta: false, ret: [[3, 3, 6, 3], [3, 3, 3, 6], [13, 3, 16, 3], [16, 3, 16, 6], [3, 13, 3, 16], [3, 16, 6, 16], [16, 13, 16, 16], [13, 16, 16, 16]] },
    { aberta: true, ret: [[9, 2, 9, 7], [9, 12, 9, 17], [12, 9, 17, 9]] },
    { aberta: false, ret: [[5, 3, 5, 7], [10, 11, 10, 16], [15, 3, 15, 8]] },
    { aberta: true, ret: [[0, 5, 7, 5], [12, 5, 19, 5], [0, 14, 7, 14], [12, 14, 19, 14]] },
    { aberta: false, ret: [[6, 6, 13, 6], [13, 6, 13, 13], [6, 13, 13, 13]] },
    { aberta: true, ret: [[3, 3, 5, 3], [6, 5, 8, 5], [11, 14, 13, 14], [14, 16, 16, 16], [14, 3, 16, 3], [3, 16, 5, 16]] },
    { aberta: false, ret: [[10, 0, 10, 3], [10, 5, 10, 14], [10, 16, 10, 19]] },
    { aberta: true, ret: [[5, 5, 6, 6], [13, 5, 14, 6], [5, 13, 6, 14], [13, 13, 14, 14], [9, 2, 10, 3], [9, 16, 10, 17]] },
    { aberta: false, ret: [[3, 4, 15, 4], [4, 7, 16, 7], [3, 13, 15, 13], [4, 16, 16, 16]] },
    { aberta: true, ret: [[4, 4, 8, 4], [11, 4, 15, 4], [4, 15, 8, 15], [11, 15, 15, 15], [4, 5, 4, 7], [4, 12, 4, 14], [15, 5, 15, 7], [15, 12, 15, 14]] },
    { aberta: false, ret: [[5, 3, 5, 7], [14, 3, 14, 7], [5, 12, 5, 16], [14, 12, 14, 16], [8, 0, 11, 1], [8, 18, 11, 19], [9, 8, 10, 11]] },
];

function paredesDe(retangulos) {
    const paredes = new Set();
    for (const [x1, y1, x2, y2] of retangulos)
        for (let x = x1; x <= x2; x++)
            for (let y = y1; y <= y2; y++) paredes.add(chave(x, y));
    return paredes;
}

// Libera a saída e fecha o que a cobra não alcança (a fruta nunca nasce lá).
function finalizar(paredes, aberta) {
    for (let x = 1; x <= 8; x++) for (let y = 9; y <= 11; y++) paredes.delete(chave(x, y));
    const vistos = new Set([chave(INICIO.x, INICIO.y)]);
    const fila = [INICIO];
    while (fila.length) {
        const { x, y } = fila.shift();
        for (const d of Object.values(DIRECOES)) {
            let nx = x + d.x, ny = y + d.y;
            if (aberta) { nx = (nx + GRADE) % GRADE; ny = (ny + GRADE) % GRADE; }
            if (nx < 0 || ny < 0 || nx >= GRADE || ny >= GRADE) continue;
            const k = chave(nx, ny);
            if (paredes.has(k) || vistos.has(k)) continue;
            vistos.add(k);
            fila.push({ x: nx, y: ny });
        }
    }
    for (let y = 0; y < GRADE; y++)
        for (let x = 0; x < GRADE; x++)
            if (!vistos.has(chave(x, y))) paredes.add(chave(x, y));
    return paredes;
}

// Fase 16+: retângulos espelhados nos dois eixos; borda aberta nas fases pares.
function gerar(fase, aleatorio) {
    const aberta = fase % 2 === 0;
    const quantos = Math.min(6, 2 + Math.floor((fase - 16) / 2));
    const ret = [];
    for (let i = 0; i < quantos; i++) {
        const w = 1 + Math.floor(aleatorio() * 3);
        const h = 1 + Math.floor(aleatorio() * 3);
        const x = Math.floor(aleatorio() * (10 - w));
        const y = Math.floor(aleatorio() * (10 - h));
        const x2 = x + w - 1, y2 = y + h - 1;
        ret.push([x, y, x2, y2], [19 - x2, y, 19 - x, y2], [x, 19 - y2, x2, 19 - y], [19 - x2, 19 - y2, 19 - x, 19 - y]);
    }
    let paredes = finalizar(paredesDe(ret), aberta);
    while (GRADE * GRADE - paredes.size < 220 && ret.length) {
        ret.splice(-4);
        paredes = finalizar(paredesDe(ret), aberta);
    }
    return { aberta, paredes };
}

export function montarMapa(fase, aleatorio = Math.random) {
    const base = fase <= MAPAS.length
        ? { aberta: MAPAS[fase - 1].aberta, paredes: finalizar(paredesDe(MAPAS[fase - 1].ret), MAPAS[fase - 1].aberta) }
        : gerar(fase, aleatorio);
    return { ...base, inicio: { ...INICIO } };
}

/* --- Metas, velocidade, pontos --- */
export const metaDaFase = (fase) => Math.min(30, 10 + 2 * (fase - 1));
export const intervaloDaFase = (fase) => Math.max(60, 170 - 7 * (fase - 1));
export const pontosFruta = (fase, dourada) => (dourada ? 50 : 10) * fase;
export const bonusFase = (fase) => 100 * fase;

export function fasesIniciais(max) {
    const lista = [1];
    for (let f = 5; f <= max; f += 5) lista.push(f);
    return lista;
}
