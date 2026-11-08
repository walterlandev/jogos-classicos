import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    GRADE, DIRECOES, enfileirar, passo, celulaLivre, MAPAS, montarMapa,
    metaDaFase, intervaloDaFase, pontosFruta, bonusFase, fasesIniciais,
} from '../public/js/logica/cobra.js';

const { up, down, left, right } = DIRECOES;

function semente(s) {
    return () => {
        s |= 0; s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Busca em largura a partir da saída; com borda aberta, as bordas se ligam.
function alcancaveis(mapa) {
    const vistos = new Set([`${mapa.inicio.x},${mapa.inicio.y}`]);
    const fila = [mapa.inicio];
    while (fila.length) {
        const { x, y } = fila.shift();
        for (const d of Object.values(DIRECOES)) {
            let nx = x + d.x, ny = y + d.y;
            if (mapa.aberta) { nx = (nx + GRADE) % GRADE; ny = (ny + GRADE) % GRADE; }
            if (nx < 0 || ny < 0 || nx >= GRADE || ny >= GRADE) continue;
            const k = `${nx},${ny}`;
            if (mapa.paredes.has(k) || vistos.has(k)) continue;
            vistos.add(k);
            fila.push({ x: nx, y: ny });
        }
    }
    return vistos.size;
}

test('fila recusa meia-volta mesmo com duas teclas rápidas', () => {
    let fila = enfileirar([], right, up);
    fila = enfileirar(fila, right, left);
    assert.deepEqual(fila, [up, left]);
    assert.deepEqual(enfileirar([], right, left), []);
    assert.deepEqual(enfileirar([up, left], right, down), [up, left]);
});

test('passo anda, come e morre na borda fechada', () => {
    const cobra = [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }];
    let r = passo(cobra, right, { x: 9, y: 9 }, 20);
    assert.deepEqual(r.cobra, [{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }]);
    r = passo(cobra, right, { x: 3, y: 2 }, 20);
    assert.equal(r.comeu, true);
    assert.equal(r.cobra.length, 4);
    assert.equal(passo([{ x: 19, y: 0 }], right, null, 20).morreu, true);
});

test('borda aberta dá a volta; parede mata', () => {
    const r = passo([{ x: 19, y: 5 }], right, null, 20, { aberta: true });
    assert.equal(r.morreu, false);
    assert.deepEqual(r.cobra[0], { x: 0, y: 5 });
    assert.equal(passo([{ x: 0, y: 0 }], up, null, 20, { aberta: true }).cobra[0].y, 19);
    assert.equal(passo([{ x: 4, y: 5 }], right, null, 20, { paredes: new Set(['5,5']) }).morreu, true);
});

test('pode entrar na casa onde está o rabo, porque ele sai', () => {
    const cobra = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 }];
    assert.equal(passo(cobra, down, null, 20).morreu, false);
});

test('celulaLivre nunca cai na cobra nem em parede', () => {
    assert.deepEqual(celulaLivre([{ x: 0, y: 0 }, { x: 1, y: 0 }], 2, () => 0), { x: 0, y: 1 });
    assert.deepEqual(celulaLivre([{ x: 0, y: 0 }], 2, () => 0, new Set(['1,0', '0,1'])), { x: 1, y: 1 });
});

test('mapas: saída livre, tudo alcançável, bordas misturadas', () => {
    assert.equal(MAPAS.length, 15);
    const fases = [...Array(15).keys()].map(i => i + 1).concat([16, 17, 30, 51]);
    const aberturas = new Set();
    for (const f of fases) {
        const m = montarMapa(f, semente(f));
        if (f <= 15) aberturas.add(m.aberta);
        assert.deepEqual(m.inicio, { x: 4, y: 10 });
        for (let x = 1; x <= 8; x++) for (let y = 9; y <= 11; y++) {
            assert.ok(!m.paredes.has(`${x},${y}`), `fase ${f}: parede na saída (${x},${y})`);
        }
        const livres = GRADE * GRADE - m.paredes.size;
        assert.ok(livres >= 200, `fase ${f}: só ${livres} livres`);
        assert.equal(alcancaveis(m), livres, `fase ${f}: há área fechada`);
    }
    assert.deepEqual([...aberturas].sort(), [false, true]);
});

test('mapa gerado é reproduzível', () => {
    assert.deepEqual([...montarMapa(22, semente(3)).paredes].sort(), [...montarMapa(22, semente(3)).paredes].sort());
});

test('metas, velocidade, pontos e fases iniciais', () => {
    assert.equal(metaDaFase(1), 10);
    assert.equal(metaDaFase(6), 20);
    assert.equal(metaDaFase(99), 30);
    assert.equal(intervaloDaFase(1), 170);
    assert.equal(intervaloDaFase(10), 107);
    assert.equal(intervaloDaFase(99), 60);
    assert.equal(pontosFruta(3, false), 30);
    assert.equal(pontosFruta(3, true), 150);
    assert.equal(bonusFase(4), 400);
    assert.deepEqual(fasesIniciais(12), [1, 5, 10]);
});
