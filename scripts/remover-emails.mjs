// Remove o campo `email` dos perfis públicos (usuarios/{uid}) do Firestore.
// Usa o login do Firebase CLI deste PC (`npx firebase login`) como administrador.
// Não toca no Firebase Authentication: as contas e os logins continuam iguais.
//
// Uso (na pasta do projeto):  node scripts/remover-emails.mjs
// Ele lista quantos perfis têm e-mail, pede confirmação e confere que só esse campo mudou.

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { execSync } from 'node:child_process';

const PROJETO = 'jogos-classicos';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJETO}/databases/(default)/documents`;

// Renova o token da sessão do CLI e lê o token de acesso (nunca é impresso).
execSync('npx firebase projects:list', { stdio: 'ignore' });
const config = JSON.parse(readFileSync(join(homedir(), '.config', 'configstore', 'firebase-tools.json'), 'utf8'));
const token = config.tokens?.access_token;
if (!token) {
    console.error('Sem login no Firebase. Rode: npx firebase login');
    process.exit(1);
}
const cabecalhos = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const lista = await (await fetch(`${BASE}/usuarios?pageSize=300`, { headers: cabecalhos })).json();
if (lista.error) {
    console.error('Erro ao listar perfis:', lista.error.message);
    process.exit(1);
}
const comEmail = (lista.documents || []).filter(d => d.fields?.email);
console.log(`Perfis no total: ${(lista.documents || []).length}. Com e-mail: ${comEmail.length}.`);
if (comEmail.length === 0) process.exit(0);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const resposta = await rl.question(`Remover o campo "email" desses ${comEmail.length} perfis? Digite "remover" para confirmar: `);
rl.close();
if (resposta.trim() !== 'remover') {
    console.log('Nada foi alterado.');
    process.exit(0);
}

let ok = 0;
for (const docu of comEmail) {
    const id = docu.name.split('/').pop();
    const antes = Object.keys(docu.fields).filter(k => k !== 'email').sort().join(',');
    // updateMask só com "email" e corpo sem esse campo = apaga só ele.
    const r = await fetch(`https://firestore.googleapis.com/v1/${docu.name}?updateMask.fieldPaths=email&currentDocument.exists=true`, {
        method: 'PATCH', headers: cabecalhos, body: JSON.stringify({ fields: {} }),
    });
    const j = await r.json();
    if (!r.ok) {
        console.log(`Falhou em ${id}: ${j.error?.message}`);
        continue;
    }
    const depois = Object.keys(j.fields || {}).sort().join(',');
    if (depois !== antes) console.log(`ATENÇÃO: outros campos mudaram em ${id}`);
    else ok++;
}
console.log(`E-mail removido de ${ok} de ${comEmail.length} perfis; demais campos intactos.`);
