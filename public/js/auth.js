import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    query, 
    collection, 
    orderBy, 
    limit, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURAÇÃO ---
const firebaseConfig = {
  apiKey: "AIzaSyAmzWuaasssjZeN1wRYFxgDDjEJqNws7eU",
  authDomain: "jogos-classicos.firebaseapp.com",
  projectId: "jogos-classicos",
  storageBucket: "jogos-classicos.firebasestorage.app",
  messagingSenderId: "179789313146",
  appId: "1:179789313146:web:4911debffc5a63a23977c3",
  measurementId: "G-LMKWJP6RY0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- MONITORAMENTO DO USUÁRIO ---
onAuthStateChanged(auth, async (user) => {
    const statusLogado = document.getElementById('statusLogado');
    const botoesDeslogado = document.getElementById('botoesDeslogado');
    const userNameEl = document.getElementById('userName');
    const userScoreEl = document.getElementById('userScore');

    if (user) {
        // Se o usuário está logado, busca os dados dele
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
            const dados = userDoc.data();
            if (userNameEl) userNameEl.textContent = dados.nome || "Jogador";
            
            // Lógica para mostrar o recorde certo dependendo da página
            if (userScoreEl) {
                const url = window.location.href.toLowerCase();
                if (url.includes("snake")) {
                    userScoreEl.textContent = dados.recorde_snake || 0;
                } else if (url.includes("breakout")) {
                    userScoreEl.textContent = dados.recorde_breakout || 0;
                } else {
                    // Assume Tetris como padrão ou index
                    userScoreEl.textContent = dados.recorde_tetris || 0;
                }
            }
            
            if (statusLogado) statusLogado.style.display = 'flex';
            if (botoesDeslogado) botoesDeslogado.style.display = 'none';
        }
    } else {
        // Se não está logado
        if (statusLogado) statusLogado.style.display = 'none';
        if (botoesDeslogado) botoesDeslogado.style.display = 'flex';
    }
});

// --- SALVAR RECORDES (UNIFICADO) ---
// Devolve true quando a pontuação virou recorde novo. Não recarrega a página.
const CAMPOS_RECORDE = { tetris: 'recorde_tetris', snake: 'recorde_snake', breakout: 'recorde_breakout' };

window.salvarRecordeDB = async (pontosFeitos, tipoJogo = 'tetris') => {
    const user = auth.currentUser;
    const campo = CAMPOS_RECORDE[tipoJogo];
    if (!user || !campo || !Number.isFinite(pontosFeitos)) return false;
    try {
        const userRef = doc(db, 'usuarios', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return false;
        const recordeAtual = Number(snap.data()[campo]) || 0;
        if (pontosFeitos <= recordeAtual) return false;
        await updateDoc(userRef, { [campo]: pontosFeitos, data_recorde: new Date() });
        const el = document.getElementById('userScore');
        if (el) el.textContent = pontosFeitos;
        return true;
    } catch (e) {
        console.error('Erro ao salvar recorde:', e);
        return false;
    }
};

// --- INTERFACE (Modais) ---
window.openLogin = () => document.getElementById('loginModal')?.showModal();
window.openRegister = () => document.getElementById('registerModal')?.showModal();
window.logout = () => signOut(auth).then(() => window.location.href = "index.html");

// --- CADASTRO ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nick = document.getElementById('regNickname').value;
        const email = document.getElementById('regEmail').value;
        const senha = document.getElementById('regSenha').value;

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, senha);
            
            // AQUI É O PULO DO GATO:
            // Já cria o usuário com os 3 campos de jogos zerados.
            // Assim não dá erro de "undefined" depois.
            await setDoc(doc(db, "usuarios", userCred.user.uid), { 
                nome: nick, 
                email: email,
                recorde_snake: 0, 
                recorde_tetris: 0,
                recorde_breakout: 0 
            });
            
            await sendEmailVerification(userCred.user);
            alert("Conta criada! Verifique seu e-mail.");
            window.location.reload();
        } catch (error) { alert("Erro: " + error.message); }
    });
}

// --- LOGIN ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const senha = document.getElementById('loginSenha').value;

        try {
            const userCred = await signInWithEmailAndPassword(auth, email, senha);
            if (userCred.user.emailVerified) {
                window.location.reload();
            } else { 
                alert("Valide seu e-mail primeiro!"); 
                await signOut(auth);
            }
        } catch (error) { alert("E-mail ou senha incorretos."); }
    });
}

// --- RANKING ---
async function carregarRanking(campoOrdenacao, idTabela) {
    const rankingCorpo = document.getElementById(idTabela);
    if (!rankingCorpo) return; // Se a tabela não existir na pagina, para aqui

    try {
        const q = query(collection(db, "usuarios"), orderBy(campoOrdenacao, "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        const celula = (texto) => {
            const td = document.createElement('td');
            td.textContent = texto;
            return td;
        };
        rankingCorpo.replaceChildren();
        let posicao = 1;

        // Montado com textContent: o apelido nunca é interpretado como HTML.
        querySnapshot.forEach((docSnap) => {
            const dados = docSnap.data();
            const tr = document.createElement('tr');
            tr.append(
                celula(`${posicao}º`),
                celula(String(dados.nome ?? 'Jogador')),
                celula(`${Number(dados[campoOrdenacao]) || 0} pts`)
            );
            rankingCorpo.append(tr);
            posicao++;
        });
    } catch (error) { 
        console.error("Erro ranking:", error);
        rankingCorpo.innerHTML = "<tr><td colspan='3'>Ranking indisponível</td></tr>";
    }
}

// --- INICIALIZAÇÃO DOS RANKINGS ---
// Chamamos as funções para preencher as tabelas (caso existam na página)
carregarRanking("recorde_tetris", "rankingTetris");
carregarRanking("recorde_snake", "rankingSnake");
carregarRanking("recorde_breakout", "rankingBreakout");
