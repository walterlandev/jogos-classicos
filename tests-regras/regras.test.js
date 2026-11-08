// Testes das regras do Firestore no emulador (npm run test:regras).
// Projeto "demo-": o emulador nunca toca no banco real.
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import {
    initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, deleteField, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

let env;
const NOVO = { nome: 'Lua', recorde_blockix: 0, recorde_snake: 0, recorde_tetris: 0, recorde_breakout: 0, recorde_breakout_v2: 0, recorde_snake_v2: 0 };
const ANTIGO = { ...NOVO, nome: 'wasgba', email: 'alguem@exemplo.com', recorde_tetris: 421, recorde_blockix: 1000, xp: 100, progresso: { xp: 100, conquistas: [], est: { partidas: 3, jogos: ['blockix'], linhas: 10, tijolos: 0 } } };

before(async () => {
    env = await initializeTestEnvironment({
        projectId: 'demo-jogos-classicos',
        firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    });
});
after(() => env.cleanup());
beforeEach(async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'usuarios/ana'), ANTIGO);
    });
});

const dono = (uid = 'ana', verificado = true) => env.authenticatedContext(uid, { email_verified: verificado }).firestore();
const visitante = () => env.unauthenticatedContext().firestore();

test('qualquer um lê o ranking; outras coleções são negadas', async () => {
    await assertSucceeds(getDoc(doc(visitante(), 'usuarios/ana')));
    await assertSucceeds(getDocs(query(collection(visitante(), 'usuarios'), orderBy('xp', 'desc'), limit(10))));
    await assertFails(getDoc(doc(visitante(), 'segredos/x')));
    await assertFails(setDoc(doc(dono(), 'segredos/x'), { a: 1 }));
});

test('cadastro: só o dono, só nome e recordes zerados', async () => {
    // Cada tentativa usa um usuário novo: em perfil existente, setDoc vira atualização.
    const cadastro = (uid, dados) => setDoc(doc(dono(uid, false), `usuarios/${uid}`), dados);
    await assertSucceeds(cadastro('bia', NOVO));
    await assertFails(setDoc(doc(dono('c0'), 'usuarios/outro'), NOVO));
    await assertFails(cadastro('c1', { ...NOVO, email: 'bia@x.com' }));
    await assertFails(cadastro('c2', { ...NOVO, itens_liberados: ['tema:lousa'] }));
    await assertFails(cadastro('c3', { ...NOVO, recorde_blockix: 99999 }));
    await assertFails(cadastro('c4', { ...NOVO, xp: 5000 }));
    await assertFails(cadastro('c5', { ...NOVO, nome: '' }));
    await assertFails(cadastro('c6', { ...NOVO, nome: 'x'.repeat(21) }));
});

test('recorde: só sobe, inteiro e com teto; só o dono verificado', async () => {
    const ref = (db) => doc(db, 'usuarios/ana');
    await assertSucceeds(updateDoc(ref(dono()), { recorde_blockix: 2000, data_recorde: new Date() }));
    await assertFails(updateDoc(ref(dono()), { recorde_blockix: 10 }));
    await assertFails(updateDoc(ref(dono()), { recorde_blockix: 2500.5 }));
    await assertFails(updateDoc(ref(dono()), { recorde_blockix: 999999999 }));
    await assertFails(updateDoc(ref(dono('ana', false)), { recorde_blockix: 3000 }));
    await assertFails(updateDoc(ref(dono('bia')), { recorde_blockix: 3000 }));
    await assertFails(updateDoc(ref(dono()), { recorde_tetris: 5000 }));   // campo antigo congelado
});

test('XP: só sobe, salto limitado, igual ao progresso', async () => {
    const ref = doc(dono(), 'usuarios/ana');
    const prog = (xp) => ({ xp, conquistas: ['primeira-linha'], est: { partidas: 4, jogos: ['blockix'], linhas: 12, tijolos: 0 } });
    await assertSucceeds(updateDoc(ref, { xp: 150, progresso: prog(150) }));
    await assertFails(updateDoc(ref, { xp: 50, progresso: prog(50) }));
    await assertFails(updateDoc(ref, { xp: 1e8, progresso: prog(1e8) }));
    await assertFails(updateDoc(ref, { xp: 200, progresso: prog(999) }));
    await assertFails(updateDoc(ref, { xp: 200 }));                        // XP sem o progresso junto
    await assertFails(updateDoc(ref, { xp: 200, progresso: { ...prog(200), extra: 1 } }));
});

test('itens pagos, nome e campos estranhos: recusados; e-mail só pode sair', async () => {
    const ref = doc(dono(), 'usuarios/ana');
    await assertFails(updateDoc(ref, { itens_liberados: ['tema:lousa'] }));
    await assertFails(updateDoc(ref, { nome: '<script>' }));
    await assertFails(updateDoc(ref, { admin: true }));
    await assertFails(updateDoc(ref, { email: 'outro@x.com' }));
    await assertSucceeds(updateDoc(ref, { email: deleteField() }));
});

test('tema e nível máximo', async () => {
    const ref = doc(dono(), 'usuarios/ana');
    await assertSucceeds(updateDoc(ref, { tema: 'cartucho' }));
    await assertFails(updateDoc(ref, { tema: 'x'.repeat(40) }));
    await assertSucceeds(updateDoc(ref, { nivel_max_blockix: 7 }));
    await assertFails(updateDoc(ref, { nivel_max_blockix: 3 }));
    await assertFails(updateDoc(ref, { nivel_max_snake: 100000 }));
});

test('ninguém apaga perfil', async () => {
    await assertFails(deleteDoc(doc(dono(), 'usuarios/ana')));
});
