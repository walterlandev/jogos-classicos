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
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
            const dados = userDoc.data();
            if (userNameEl) userNameEl.innerText = dados.nome || "Jogador";
            
            if (userScoreEl) {
                const eSnake = window.location.href.includes("snake");
                userScoreEl.innerText = eSnake ? (dados.recorde_snake || 0) : (dados.recorde_tetris || 0);
            }
            
            if (statusLogado) statusLogado.style.display = 'flex';
            if (botoesDeslogado) botoesDeslogado.style.display = 'none';
        }
    } else {
        if (statusLogado) statusLogado.style.display = 'none';
        if (botoesDeslogado) botoesDeslogado.style.display = 'flex';
    }
});

// --- SALVAR RECORDES (UNIFICADO) ---
window.salvarRecordeDB = async (pontosFeitos, tipoJogo) => {
    const user = auth.currentUser;
    if (!user) return;

    // Ajuste para garantir que grave no campo certo do seu banco (recorde_snake)
    const campoRecorde = (tipoJogo === "usuarios_snake") ? "recorde_snake" : "recorde_tetris";
    const userRef = doc(db, "usuarios", user.uid);

    try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const recordeAtual = snap.data()[campoRecorde] || 0;

            // Só atualiza se a pontuação for maior que a atual
            if (pontosFeitos > recordeAtual) {
                await updateDoc(userRef, { 
                    [campoRecorde]: pontosFeitos,
                    data_recorde: new Date()
                });
                alert("🎮 NOVO RECORDE: " + pontosFeitos + " pts!");
                window.location.reload(); 
            }
        }
    } catch (e) { console.error("Erro ao salvar recorde:", e); }
};

// --- INTERFACE ---
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
            await setDoc(doc(db, "usuarios", userCred.user.uid), { 
                nome: nick, 
                email: email,
                recorde_snake: 0, 
                recorde_tetris: 0 
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

// --- RANKING (COM SUPORTE A ZEROS) ---
async function carregarRanking(campoOrdenacao, idTabela) {
    const rankingCorpo = document.getElementById(idTabela);
    if (!rankingCorpo) return;

    try {
        const q = query(collection(db, "usuarios"), orderBy(campoOrdenacao, "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        rankingCorpo.innerHTML = ""; 
        let posicao = 1;

        querySnapshot.forEach((docSnap) => {
            const dados = docSnap.data();
            const pontos = dados[campoOrdenacao] || 0;

            rankingCorpo.innerHTML += `
                <tr>
                    <td>${posicao}º</td>
                    <td>${dados.nome}</td>
                    <td>${pontos} pts</td>
                </tr>
            `;
            posicao++;
        });
    } catch (error) { 
        console.error("Erro ranking:", error);
        rankingCorpo.innerHTML = "<tr><td colspan='3'>Aguardando jogadores...</td></tr>";
    }
}

// Chamada inicial para preencher as tabelas na index
carregarRanking("recorde_tetris", "rankingTetris");
carregarRanking("recorde_snake", "rankingSnake");
