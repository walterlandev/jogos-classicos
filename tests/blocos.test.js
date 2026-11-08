import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarMatriz, criarPeca, girar, colide, fundir, varrerLinhas,
         pontosPorLinhas, nivelPorLinhas, intervaloQueda } from '../public/js/logica/blocos.js';

test('varrerLinhas remove linhas cheias, inclusive a do topo, e desce o resto', () => {
    const t = criarMatriz(3, 4);
    t[0] = [1, 1, 1]; t[2] = [0, 2, 0]; t[3] = [3, 3, 3];
    assert.equal(varrerLinhas(t), 2);
    assert.deepEqual(t, [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 2, 0]]);
});

test('girar devolve uma matriz nova girada 90° no sentido horário', () => {
    const t = criarPeca('T');
    assert.deepEqual(girar(t), [[0, 2, 0], [0, 2, 2], [0, 2, 0]]);
    assert.deepEqual(criarPeca('T'), t);
});

test('colide detecta parede, chão e bloco fixo', () => {
    const t = criarMatriz(10, 20);
    const o = criarPeca('O');
    assert.equal(colide(t, o, { x: -1, y: 0 }), true);
    assert.equal(colide(t, o, { x: 0, y: 19 }), true);
    assert.equal(colide(t, o, { x: 4, y: 0 }), false);
    fundir(t, o, { x: 4, y: 18 });
    assert.equal(colide(t, o, { x: 4, y: 17 }), true);
});

test('nível sobe a cada 10 linhas e não depende dos pontos', () => {
    assert.equal(nivelPorLinhas(0), 1);
    assert.equal(nivelPorLinhas(9), 1);
    assert.equal(nivelPorLinhas(10), 2);
    assert.equal(nivelPorLinhas(35), 4);
});

test('pontos e velocidade', () => {
    assert.equal(pontosPorLinhas(0, 3), 0);
    assert.equal(pontosPorLinhas(2, 3), 6);
    assert.equal(intervaloQueda(1), 1000);
    assert.equal(intervaloQueda(5), 800);
    assert.equal(intervaloQueda(99), 100);
});
