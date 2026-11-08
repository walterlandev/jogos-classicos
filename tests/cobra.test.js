import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIRECOES, enfileirar, passo, celulaLivre, nivelPorPontos,
         intervaloDoNivel, marcoDeBonus } from '../public/js/logica/cobra.js';

const { up, down, left, right } = DIRECOES;

test('fila recusa meia-volta mesmo com duas teclas rápidas', () => {
    let fila = enfileirar([], right, up);
    fila = enfileirar(fila, right, left);
    assert.deepEqual(fila, [up, left]);
    assert.deepEqual(enfileirar([], right, left), []);
    assert.deepEqual(enfileirar([up, left], right, down), [up, left]);
});

test('passo anda, come e morre', () => {
    const cobra = [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }];
    let r = passo(cobra, right, { x: 9, y: 9 }, 20);
    assert.deepEqual(r.cobra, [{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }]);
    r = passo(cobra, right, { x: 3, y: 2 }, 20);
    assert.equal(r.comeu, true);
    assert.equal(r.cobra.length, 4);
    assert.equal(passo([{ x: 19, y: 0 }], right, null, 20).morreu, true);
});

test('pode entrar na casa onde está o rabo, porque ele sai', () => {
    const cobra = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 }];
    assert.equal(passo(cobra, down, null, 20).morreu, false);
});

test('celulaLivre nunca cai na cobra', () => {
    const cobra = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    assert.deepEqual(celulaLivre(cobra, 2, () => 0), { x: 0, y: 1 });
});

test('níveis, velocidade e marcos de bônus', () => {
    assert.equal(nivelPorPontos(19), 1);
    assert.equal(nivelPorPontos(20), 2);
    assert.equal(nivelPorPontos(50), 3);
    assert.equal(intervaloDoNivel(1), 200);
    assert.equal(intervaloDoNivel(99), 50);
    assert.equal(marcoDeBonus(19), 0);
    assert.equal(marcoDeBonus(20), 20);
    assert.equal(marcoDeBonus(31), 20);
});
