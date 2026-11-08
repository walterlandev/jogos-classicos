// Firebase: conta, perfil (apelido, recordes, tema), recorde e ranking.
// Todo dado do jogador entra na página por textContent, nunca como HTML.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    onAuthStateChanged, signOut, sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore, doc, getDoc, setDoc, updateDoc, query, collection, orderBy, limit, getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { aplicarTema, aoMudarTema, definirItensLiberados } from './temas.js';
import { podeUsar } from './logica/temas.js';

// Config web do Firebase: não é segredo (vai ao navegador de todo visitante).
const firebaseConfig = {
    apiKey: "AIzaSyAmzWuaasssjZeN1wRYFxgDDjEJqNws7eU",
    authDomain: "jogos-classicos.firebaseapp.com",
    projectId: "jogos-classicos",
    storageBucket: "jogos-classicos.firebasestorage.app",
    messagingSenderId: "179789313146",
    appId: "1:179789313146:web:4911debffc5a63a23977c3",
    measurementId: "G-LMKWJP6RY0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// O Blockix guarda no campo antigo do "Tetris" (ranking preservado).
const CAMPOS_RECORDE = {
    blockix: 'recorde_tetris', tetris: 'recorde_tetris',
    snake: 'recorde_snake', breakout: 'recorde_breakout',
};
const jogoDaPagina = document.body.dataset.jogo;

const el = (id) => document.getElementById(id);
const texto = (node, valor) => { if (node) node.textContent = valor; };

function mostrarRecordes(dados) {
    document.querySelectorAll('[data-recorde]').forEach(n => {
        texto(n, Number(dados?.[CAMPOS_RECORDE[n.dataset.recorde]]) || 0);
    });
    if (jogoDaPagina) texto(el('userScore'), Number(dados?.[CAMPOS_RECORDE[jogoDaPagina]]) || 0);
}

// --- Estado da conta ---
onAuthStateChanged(auth, async (user) => {
    const logado = el('statusLogado');
    const deslogado = el('botoesDeslogado');
    let dados = null;
    if (user) {
        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (snap.exists()) dados = snap.data();
        } catch (e) {
            console.error('Erro ao ler o perfil:', e);
        }
    }
    if (dados) {
        texto(el('userName'), String(dados.nome || 'jogador'));
        mostrarRecordes(dados);
        definirItensLiberados(dados.itens_liberados);
        if (dados.tema && podeUsar(dados.tema, dados.itens_liberados)) {
            aplicarTema(dados.tema, { origem: 'perfil' });
        }
    } else {
        document.querySelectorAll('[data-recorde]').forEach(n => texto(n, '—'));
        definirItensLiberados([]);
    }
    if (logado) logado.hidden = !dados;
    if (deslogado) deslogado.hidden = !!dados;
});

// Tema escolhido pelo jogador vai para o perfil (vale em qualquer aparelho).
aoMudarTema(async (id, origem) => {
    const user = auth.currentUser;
    if (origem !== 'usuario' || !user) return;
    try {
        await updateDoc(doc(db, 'usuarios', user.uid), { tema: id });
    } catch (e) {
        console.error('Erro ao salvar o tema:', e);
    }
});

el('botaoSair')?.addEventListener('click', () => signOut(auth));

// --- Recorde ---
// Devolve true quando a pontuação virou recorde novo. Não recarrega a página.
window.salvarRecordeDB = async (pontosFeitos, tipoJogo = jogoDaPagina) => {
    const user = auth.currentUser;
    const campo = CAMPOS_RECORDE[tipoJogo];
    if (!user || !campo || !Number.isFinite(pontosFeitos)) return false;
    try {
        const ref = doc(db, 'usuarios', user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return false;
        const recordeAtual = Number(snap.data()[campo]) || 0;
        if (pontosFeitos <= recordeAtual) return false;
        await updateDoc(ref, { [campo]: pontosFeitos, data_recorde: new Date() });
        texto(el('userScore'), pontosFeitos);
        return true;
    } catch (e) {
        console.error('Erro ao salvar recorde:', e);
        return false;
    }
};

// --- Formulários (mensagens dentro do diálogo, sem alert) ---
const ERROS = {
    'auth/email-already-in-use': 'Já existe uma conta com este e-mail. Use "Entrar".',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/invalid-email': 'Este e-mail não parece válido. Confira e tente de novo.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Espere alguns minutos e tente de novo.',
    'auth/network-request-failed': 'Sem conexão com o servidor. Verifique a internet.',
};
const mensagemDeErro = (e) => ERROS[e?.code] || 'Não deu certo agora. Tente de novo em instantes.';

function avisar(form, msg, tipo) {
    const p = form.querySelector('.mensagem');
    p.dataset.tipo = tipo;
    p.textContent = msg;
}

const registerForm = el('registerForm');
registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = el('regNickname').value.trim();
    const email = el('regEmail').value.trim();
    const senha = el('regSenha').value;
    if (!nome) return avisar(registerForm, 'Escolha um apelido para aparecer no ranking.', 'erro');
    const botao = registerForm.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(db, 'usuarios', cred.user.uid), {
            nome, email, recorde_snake: 0, recorde_tetris: 0, recorde_breakout: 0,
        });
        await sendEmailVerification(cred.user);
        await signOut(auth);
        registerForm.reset();
        avisar(registerForm, `Conta criada. Enviamos um link de confirmação para ${email}; confirme e depois entre.`, 'sucesso');
    } catch (erro) {
        avisar(registerForm, mensagemDeErro(erro), 'erro');
    } finally {
        botao.disabled = false;
    }
});

const loginForm = el('loginForm');
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = el('loginEmail').value.trim();
    const senha = el('loginSenha').value;
    const botao = loginForm.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
        const cred = await signInWithEmailAndPassword(auth, email, senha);
        if (!cred.user.emailVerified) {
            await signOut(auth);
            avisar(loginForm, 'Confirme seu e-mail pelo link que enviamos e entre de novo.', 'erro');
            return;
        }
        loginForm.reset();
        loginForm.closest('dialog').close();
    } catch (erro) {
        avisar(loginForm, mensagemDeErro(erro), 'erro');
    } finally {
        botao.disabled = false;
    }
});

// --- Ranking ---
async function carregarRanking(campo, idTabela) {
    const corpo = el(idTabela);
    if (!corpo) return;
    const linha = (...celulas) => {
        const tr = document.createElement('tr');
        for (const c of celulas) {
            const td = document.createElement('td');
            td.textContent = c;
            tr.append(td);
        }
        return tr;
    };
    try {
        const q = query(collection(db, 'usuarios'), orderBy(campo, 'desc'), limit(10));
        const snap = await getDocs(q);
        corpo.replaceChildren();
        let posicao = 1;
        snap.forEach(d => {
            const dados = d.data();
            const tr = linha(`${posicao}º`, String(dados.nome ?? 'jogador'), `${Number(dados[campo]) || 0}`);
            if (auth.currentUser && d.id === auth.currentUser.uid) tr.classList.add('voce');
            corpo.append(tr);
            posicao++;
        });
        if (posicao === 1) {
            const vazio = linha('Ninguém jogou ainda. Seja o primeiro.');
            vazio.firstChild.colSpan = 3;
            corpo.append(vazio);
        }
    } catch (erro) {
        console.error('Erro ranking:', erro);
        const falha = linha('Ranking indisponível agora.');
        falha.firstChild.colSpan = 3;
        corpo.replaceChildren(falha);
    }
}

carregarRanking('recorde_tetris', 'rankingBlockix');
carregarRanking('recorde_snake', 'rankingSnake');
carregarRanking('recorde_breakout', 'rankingBreakout');
