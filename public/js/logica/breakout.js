// Regras puras do Breakout (fases, tijolos, pontos, vidas, power-ups, colisão).
// Sem DOM e sem canvas; testadas em tests/breakout.test.js.

// Campo 400×560: 10 colunas de 36 px com 4 px de espaço, a partir de x = 2.
export const GRADE = { colunas: 10, largura: 36, altura: 14, espaco: 4, topo: 64, esquerda: 2 };

// Mapas: '.' vazio, '1' '2' '3' golpes, '#' indestrutível (só a partir da fase 6).
export const FASES = [
    ['1111111111', '1111111111', '1111111111', '1111111111'],
    ['..111111..', '.11111111.', '1111111111', '1111111111', '.11111111.', '..111111..'],
    ['2222222222', '1111111111', '1111111111', '1111111111', '2222222222'],
    ['1.1.1.1.1.', '.1.1.1.1.1', '2.2.2.2.2.', '.2.2.2.2.2', '1.1.1.1.1.', '.1.1.1.1.1'],
    ['....22....', '...2112...', '..211112..', '.21111112.', '2111111112', '.21111112.', '..211112..', '...2112...', '....22....'],
    ['##......##', '2222222222', '1111111111', '1111111111', '2222222222', '##......##'],
    ['3333333333', '2222222222', '1111111111', '..........', '1111111111', '2222222222'],
    ['1#1#1#1#1#', '1111111111', '2222222222', '#1#1#1#1#1', '1111111111'],
    ['22......22', '222....222', '2222..2222', '1111111111', '1111111111', '2222..2222', '222....222', '22......22'],
    ['....33....', '...3223...', '..321123..', '.32111123.', '3211111123', '###....###'],
    ['2.2.2.2.2.', '.2.2.2.2.2', '3.3.3.3.3.', '.3.3.3.3.3', '2.2.2.2.2.', '#.#.#.#.#.'],
    ['3333333333', '3........3', '3.222222.3', '3.2....2.3', '3.2.11.2.3', '3.2....2.3', '3.222222.3', '3........3', '333.##.333'],
    ['1111111111', '#2#2#2#2#2', '1111111111', '2#2#2#2#2#', '1111111111'],
    ['..3....3..', '.333..333.', '3333333333', '3322332233', '3333333333', '.3.3..3.3.', '3........3'],
    ['2222222222', '2111111112', '2133333312', '2131111312', '2131221312', '2131111312', '2133333312', '2111111112', '2222222222'],
    ['#........#', '##......##', '3##....##3', '33##..##33', '333....333'],
    ['1212121212', '2121212121', '3232323232', '2323232323', '1212121212', '2121212121', '##.####.##'],
    ['3.3.3.3.3.', '.3.3.3.3.3', '3.3.3.3.3.', '.3.3.3.3.3', '2.2.2.2.2.', '#.#.#.#.#.'],
    ['3333333333', '3#3#3#3#3#', '3333333333', '#3#3#3#3#3', '3333333333', '3#3#3#3#3#', '3333333333'],
    ['#33333333#', '#32222223#', '#32111123#', '#32111123#', '#32222223#', '#33333333#', '##..##..##'],
];

// Fase 21 em diante: simétrica, mais linhas e mais tijolos duros com o tempo.
export function gerarMapa(n, aleatorio = Math.random) {
    const passo = n - 21;
    const linhas = Math.min(12, 6 + Math.floor(passo / 3));
    const pVazio = 0.15;
    const pEterno = Math.min(0.12, 0.03 + passo * 0.005);
    const p3 = Math.min(0.35, 0.05 + passo * 0.015);
    const p2 = Math.min(0.6, 0.2 + passo * 0.02);
    const mapa = [];
    for (let lin = 0; lin < linhas; lin++) {
        const metade = [];
        for (let col = 0; col < 5; col++) {
            const r = aleatorio();
            let c;
            if (r < pVazio) c = '.';
            else if (r < pVazio + pEterno && lin < linhas - 1) c = '#';
            else if (aleatorio() < p3) c = '3';
            else if (aleatorio() < p2) c = '2';
            else c = '1';
            metade.push(c);
        }
        mapa.push(metade.join('') + [...metade].reverse().join(''));
    }
    if (!mapa.join('').match(/[123]/)) mapa[linhas - 1] = '1111111111';
    return mapa;
}

export function montarFase(n, aleatorio = Math.random) {
    const mapa = n <= FASES.length ? FASES[n - 1] : gerarMapa(n, aleatorio);
    const { largura, altura, espaco, topo, esquerda } = GRADE;
    const tijolos = [];
    mapa.forEach((linha, lin) => [...linha].forEach((c, col) => {
        if (c === '.') return;
        const eterno = c === '#';
        const max = eterno ? 1 : Number(c);
        tijolos.push({
            col, lin,
            x: esquerda + col * (largura + espaco),
            y: topo + lin * (altura + espaco),
            golpes: max, max, eterno,
        });
    }));
    return tijolos;
}

export const faseConcluida = (tijolos) => tijolos.every(t => t.eterno || t.golpes <= 0);

export const pontosGolpe = (tijolo, quebrou) => 10 + (quebrou ? 50 * tijolo.max : 0);
export const bonusFase = (n) => 500 + 100 * n;

// Vidas extras ganhas ao passar de `antes` para `depois` pontos (uma a cada 10.000).
export const vidasGanhas = (antes, depois) => Math.floor(depois / 10000) - Math.floor(antes / 10000);

// Círculo (cx, cy, r) contra retângulo: null se não toca; senão o eixo a refletir
// (o de menor penetração).
export function colisaoCirculoRet(cx, cy, r, x, y, w, h) {
    const px = Math.max(x, Math.min(cx, x + w));
    const py = Math.max(y, Math.min(cy, y + h));
    const dx = cx - px, dy = cy - py;
    if (dx * dx + dy * dy > r * r) return null;
    const penX = Math.min(cx + r - x, x + w - (cx - r));
    const penY = Math.min(cy + r - y, y + h - (cy - r));
    return penX < penY ? 'x' : 'y';
}

// 12 % dos tijolos quebrados soltam algo; vida extra só em 1 %.
const PODERES_COMUNS = ['larga', 'multi', 'lenta'];
export function sortearPoder(aleatorio = Math.random) {
    const r = aleatorio();
    if (r < 0.01) return 'vida';
    if (r < 0.12) return PODERES_COMUNS[Math.min(2, Math.floor((r - 0.01) / 0.11 * 3))];
    return null;
}

export function fasesIniciais(max) {
    const lista = [1];
    for (let f = 5; f <= max; f += 5) lista.push(f);
    return lista;
}
