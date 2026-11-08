import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    FASES, GRADE, montarFase, gerarMapa, faseConcluida, pontosGolpe, bonusFase,
    vidasGanhas, colisaoCirculoRet, sortearPoder, fasesIniciais,
} from '../public/js/logica/breakout.js';

// Aleatório com semente (mulberry32): fases geradas reproduzíveis no teste.
function semente(s) {
    return () => {
        s |= 0; s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

test('20 fases desenhadas, válidas, sem indestrutível antes da 6', () => {
    assert.equal(FASES.length, 20);
    FASES.forEach((mapa, i) => {
        for (const linha of mapa) assert.match(linha, /^[.123#]{10}$/, `fase ${i + 1}: "${linha}"`);
        assert.ok(mapa.join('').match(/[123]/), `fase ${i + 1} sem tijolo quebrável`);
        if (i < 5) assert.ok(!mapa.join('').includes('#'), `fase ${i + 1} tem indestrutível`);
    });
});

test('montarFase posiciona os tijolos na grade', () => {
    const t = montarFase(1);
    const primeiro = t.find(k => k.col === 0 && k.lin === 0);
    assert.deepEqual(primeiro, { col: 0, lin: 0, x: GRADE.esquerda, y: GRADE.topo, golpes: 1, max: 1, eterno: false });
    assert.equal(t.length, FASES[0].join('').replace(/\./g, '').length);
});

test('fase gerada: reproduzível, simétrica, com quebrável e mais linhas com o tempo', () => {
    assert.deepEqual(gerarMapa(25, semente(7)), gerarMapa(25, semente(7)));
    for (const n of [21, 30, 47]) {
        const mapa = gerarMapa(n, semente(n));
        for (const linha of mapa) assert.equal(linha, [...linha].reverse().join(''));
        assert.ok(mapa.join('').match(/[123]/));
        assert.ok(!mapa[mapa.length - 1].includes('#'), 'última linha sem indestrutível');
    }
    assert.equal(gerarMapa(21, semente(1)).length, 6);
    assert.equal(gerarMapa(40, semente(1)).length, 12);
});

test('fase concluída ignora indestrutíveis', () => {
    assert.equal(faseConcluida([{ golpes: 0, eterno: false }, { golpes: 1, eterno: true }]), true);
    assert.equal(faseConcluida([{ golpes: 1, eterno: false }]), false);
});

test('pontos, bônus de fase e vidas extras', () => {
    assert.equal(pontosGolpe({ max: 3 }, false), 10);
    assert.equal(pontosGolpe({ max: 3 }, true), 160);
    assert.equal(bonusFase(3), 800);
    assert.equal(vidasGanhas(9990, 10010), 1);
    assert.equal(vidasGanhas(0, 25000), 2);
    assert.equal(vidasGanhas(10000, 10500), 0);
});

test('colisão indica o eixo a refletir', () => {
    assert.equal(colisaoCirculoRet(18, -4, 5, 0, 0, 36, 14), 'y');  // por cima
    assert.equal(colisaoCirculoRet(-4, 7, 5, 0, 0, 36, 14), 'x');   // pela lateral
    assert.equal(colisaoCirculoRet(18, -10, 5, 0, 0, 36, 14), null);
});

test('power-ups: vida rara, três comuns, maioria nada', () => {
    assert.equal(sortearPoder(() => 0.005), 'vida');
    assert.equal(sortearPoder(() => 0.02), 'larga');
    assert.equal(sortearPoder(() => 0.06), 'multi');
    assert.equal(sortearPoder(() => 0.11), 'lenta');
    assert.equal(sortearPoder(() => 0.5), null);
});

test('fases iniciais liberadas de 5 em 5, sem teto', () => {
    assert.deepEqual(fasesIniciais(1), [1]);
    assert.deepEqual(fasesIniciais(12), [1, 5, 10]);
    assert.deepEqual(fasesIniciais(31), [1, 5, 10, 15, 20, 25, 30]);
});
