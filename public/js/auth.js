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
            if (userNameEl) userNameEl.innerText = dados.nome || "Jogador";
            
            // Lógica para mostrar o recorde certo dependendo da página
            if (userScoreEl) {
                const url = window.location.href.toLowerCase();
                if (url.includes("snake")) {
                    userScoreEl.innerText = dados.recorde_snake || 0;
                } else if (url.includes("breakout")) {
                    userScoreEl.innerText = dados.recorde_breakout || 0;
                } else {
                    // Assume Tetris como padrão ou index
                    userScoreEl.innerText = dados.recorde_tetris || 0;
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
// Agora aceita 'snake', 'tetris' ou 'breakout' como parametro tipoJogo
window.salvarRecordeDB = async (pontosFeitos, tipoJogo) => {
    const user = auth.currentUser;
    if (!user) return; // Se não tiver logado, não salva

    // Define qual campo do banco de dados vamos atualizar
    let campoRecorde = "";
    if (tipoJogo === "snake" || tipoJogo === "usuarios_snake") {
        campoRecorde = "recorde_snake";
    } else if (tipoJogo === "breakout" || tipoJogo === "usuarios_breakout") {
        campoRecorde = "recorde_breakout";
    } else {
        campoRecorde = "recorde_tetris";
    }

    const userRef = doc(db, "usuarios", user.uid);

    try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const dados = snap.data();
            // Pega o recorde atual ou 0 se o campo ainda não existir
            const recordeAtual = dados[campoRecorde] || 0;

            // Só atualiza se a pontuação atual for maior que o recorde do banco
            if (pontosFeitos > recordeAtual) {
                await updateDoc(userRef, { 
                    [campoRecorde]: pontosFeitos,
                    data_recorde: new Date()
                });
                
                alert(`🎮 NOVO RECORDE NO ${campoRecorde.toUpperCase()}: ${pontosFeitos} pts!`);
                window.location.reload(); 
            }
        }
    } catch (e) { 
        console.error("Erro ao salvar recorde:", e); 
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
        
        rankingCorpo.innerHTML = ""; 
        let posicao = 1;

        querySnapshot.forEach((docSnap) => {
            const dados = docSnap.data();
            // Garante que mostre 0 se o campo não existir
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
        rankingCorpo.innerHTML = "<tr><td colspan='3'>Carregando...</td></tr>";
    }
}

// --- INICIALIZAÇÃO DOS RANKINGS ---
// Chamamos as funções para preencher as tabelas (caso existam na página)
carregarRanking("recorde_tetris", "rankingTetris");
carregarRanking("recorde_snake", "rankingSnake");
carregarRanking("recorde_breakout", "rankingBreakout");
