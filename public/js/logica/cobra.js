// Lógica pura do Snake: sem DOM e sem canvas, testada em tests/cobra.test.js.
// Posições em células (0..grade-1), não em pixels.

export const GRADE = 20;
export const DIRECOES = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

const mesma = (a, b) => a.x === b.x && a.y === b.y;
const oposta = (a, b) => a.x === -b.x && a.y === -b.y;

// Cada comando é comparado com o último da fila (ou com a direção atual),
// então duas teclas rápidas nunca viram uma meia-volta.
export function enfileirar(fila, atual, nova, maximo = 2) {
    const referencia = fila.length ? fila[fila.length - 1] : atual;
    if (fila.length >= maximo || mesma(referencia, nova) || oposta(referencia, nova)) return fila;
    return [...fila, nova];
}

export function passo(cobra, direcao, comida, grade) {
    const cabeca = { x: cobra[0].x + direcao.x, y: cobra[0].y + direcao.y };
    const comeu = !!comida && mesma(cabeca, comida);
    const corpo = comeu ? cobra : cobra.slice(0, -1); // sem comer, o rabo sai antes
    const fora = cabeca.x < 0 || cabeca.y < 0 || cabeca.x >= grade || cabeca.y >= grade;
    if (fora || corpo.some(p => mesma(p, cabeca))) return { cobra, comeu: false, morreu: true };
    return { cobra: [cabeca, ...corpo], comeu, morreu: false };
}

export function celulaLivre(cobra, grade, aleatorio = Math.random) {
    const livres = [];
    for (let y = 0; y < grade; y++)
        for (let x = 0; x < grade; x++)
            if (!cobra.some(p => p.x === x && p.y === y)) livres.push({ x, y });
    return livres[Math.floor(aleatorio() * livres.length)];
}

const metaDoNivel = (nivel) => (nivel === 1 ? 20 : 20 + (nivel - 1) * 30);
export function nivelPorPontos(pontos) {
    let nivel = 1;
    while (pontos >= metaDoNivel(nivel)) nivel++;
    return nivel;
}
export const intervaloDoNivel = (nivel) => Math.max(50, Math.round(200 * 0.85 ** (nivel - 1)));
export const marcoDeBonus = (pontos) => Math.floor(pontos / 20) * 20;
