// --- 1. CONFIGURAÇÃO DO PALCO ---
// Pegamos o elemento <canvas> do HTML para poder desenhar nele.
const canvas = document.getElementById("gameCanvas");
// O 'ctx' (contexto) é o "pincel". Tudo que desenhamos (quadrados, bolas) usa o ctx.
const ctx = canvas.getContext("2d");

// --- 2. LIGAÇÃO COM O HTML (HUD) ---
// Pegamos os elementos de texto do HTML para atualizar Pontos, Nível e Botões.
const startBtn = document.getElementById("startBtnOverlay");
// Arrays [] são usados porque temos dois lugares para mostrar pontos: no PC e no Mobile.
const scoreDisplay = [document.getElementById("scorePC"), document.getElementById("scoreMob")];
const levelDisplay = [document.getElementById("levelPC"), document.getElementById("levelMob")];
const pauseOverlay = document.getElementById("pauseOverlay");

// --- 3. VARIÁVEIS DE ESTADO ---
// Guardam como o jogo está AGORA.
let score = 0;          // Pontuação atual
let level = 1;          // Nível atual
let paused = false;     // Se o jogo está pausado
let gameRunning = false; // Se o jogo está rodando ou parado (Menu/Game Over)
let animationId;        // Guarda o ID da animação para podermos cancelar (parar) ela depois.

// --- 4. A RAQUETE ---
const paddleHeight = 10;
const paddleSegmentWidth = 15;
// A raquete é formada por 5 blocos de 15px, totalizando 75px de largura.
const paddleWidth = paddleSegmentWidth * 5; 
// paddleX define onde a raquete começa na horizontal. 
// A conta `(canvas.width - paddleWidth) / 2` serve para centralizar ela na tela.
let paddleX = (canvas.width - paddleWidth) / 2;

// --- 5. A BOLA (FÍSICA) ---
let x, y;    // Posição atual da bola
let dx, dy;  // "Delta X" e "Delta Y" = Velocidade. 
             // Se dx = 2, a bola move 2 pixels para a direita a cada quadro.
             // Se dy = -2, a bola move 2 pixels para cima (Y diminui subindo).
const ballRadius = 6;     // Tamanho da bola
const speedIncrement = 0.5; // Quanto a velocidade aumenta por nível

// --- 6. OS TIJOLOS (MATRIZ) ---
const brickRowCount = 5;     // 5 linhas de tijolos
const brickColumnCount = 8;  // 8 colunas
const brickWidth = 50;
const brickHeight = 15;
const brickPadding = 5;      // Espaço entre tijolos
const brickOffsetTop = 40;   // Margem do topo (para não colar no teto)
const brickOffsetLeft = 25;  // Margem da esquerda
let bricks = []; // Vai guardar todos os tijolos criados

// --- 7. CONTROLES ---
// Variáveis booleanas (true/false) para saber se o botão está apertado AGORA.
let rightPressed = false;
let leftPressed = false;

// "Escuta" o teclado. Se alguém apertar (keydown) ou soltar (keyup), chama as funções.
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

// Quando aperta a tecla
function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
}

// Quando solta a tecla
function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}

// CONTROLE MOBILE: Essa função é chamada pelo HTML (ontouchstart)
// window.handleInput torna a função global para o HTML conseguir enxergar ela.
window.handleInput = function(dir, isPressed) {
    if (dir === 'right') rightPressed = isPressed;
    if (dir === 'left') leftPressed = isPressed;
};

// --- 8. PREPARAÇÃO DO JOGO ---
function initGameVars() {
    score = 0;
    level = 1;
    resetBall();   // Coloca a bola no meio
    initBricks();  // Cria os tijolos
    updateHUD();   // Atualiza os textos na tela
}

// Reseta a posição da bola (usado no inicio e ao passar de fase)
function resetBall() {
    x = canvas.width / 2;
    y = canvas.height - 30; // Perto da raquete
    
    // FÓRMULA DE VELOCIDADE:
    // Começa com 2 e aumenta 0.5 a cada nível.
    let speed = 2 + (level * 0.5);
    
    // Math.random() > 0.5 decide se a bola sai para esquerda ou direita aleatoriamente.
    dx = speed * (Math.random() > 0.5 ? 1 : -1);
    dy = -speed; // Negativo faz a bola ir para CIMA
    
    paddleX = (canvas.width - paddleWidth) / 2; // Centraliza raquete
}

// Cria a grade de tijolos
function initBricks() {
    bricks = []; // Limpa tijolos antigos
    // Loop duplo: Para cada Coluna (c)... e para cada Linha (r)...
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            let active = true;
            
            // LÓGICA DE FASES:
            // Se o nível for par, cria um padrão "xadrez" desligando alguns tijolos
            if (level % 2 === 0 && (c + r) % 2 === 0) active = false; 
            
            // Cria o objeto tijolo. 
            // x:0, y:0 (será calculado no desenho). status: 1 (vivo) ou 0 (quebrado/inexistente)
            bricks[c][r] = { x: 0, y: 0, status: active ? 1 : 0 };
        }
    }
}

// --- 9. DETECÇÃO DE COLISÃO (A Matemática) ---
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            // Só verifica se o tijolo ainda existe (status 1)
            if (b.status === 1) {
                // FÓRMULA DE COLISÃO RETANGULAR:
                // Se a posição da bola estiver DENTRO da área do tijolo...
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy; // Inverte a direção vertical (bola quica)
                    b.status = 0; // Destroi o tijolo
                    score += 1;  // Ganha pontos
                    updateHUD();
                    
                    // Verifica se acabou os tijolos da fase
                    if (checkWin()) nextLevel();
                }
            }
        }
    }
}

// Verifica se TODOS os tijolos estão com status 0
function checkWin() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) return false; // Se achar um vivo, não venceu
        }
    }
    return true; // Se o loop acabou e não achou ninguém vivo, venceu
}

function nextLevel() {
    if (level < 10) {
        level++;
        resetBall(); // Bola volta pro meio, mas mais rápida (veja resetBall)
        initBricks(); // Novos tijolos
        updateHUD();
    } else {
        gameOver("VOCÊ VENCEU!"); // Zerou o jogo
    }
}

// Atualiza o texto na tela
function updateHUD() {
    // padStart(5, '0') faz o zero virar "00000"
    scoreDisplay.forEach(el => { if(el) el.innerText = score.toString().padStart(5, '0') });
    levelDisplay.forEach(el => { if(el) el.innerText = level });
}

// --- 10. FUNÇÕES DE DESENHO (O Artista) ---

function drawBall() {
    ctx.beginPath(); // Começa um desenho novo
    // Cria um quadrado para a bola (estilo retro)
    ctx.rect(x - ballRadius/2, y - ballRadius/2, ballRadius, ballRadius);
    ctx.fillStyle = "#0ff"; // Cor Ciano Neon
    ctx.fill(); // Preenche
    ctx.closePath();
}

function drawPaddle() {
    // Desenha 5 pequenos retângulos lado a lado para parecer uma raquete segmentada
    for(let i=0; i<5; i++) {
        ctx.beginPath();
        ctx.rect(paddleX + (i * paddleSegmentWidth), canvas.height - paddleHeight - 5, paddleSegmentWidth - 1, paddleHeight);
        ctx.fillStyle = "#0f0"; // Verde Neon
        ctx.fill();
        ctx.closePath();
    }
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                // CALCULA A POSIÇÃO X e Y DO TIJOLO NA TELA
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                
                bricks[c][r].x = brickX; // Salva para usar na colisão depois
                bricks[c][r].y = brickY;
                
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                // `hsl` cria cores arco-íris baseadas na linha (r)
                ctx.fillStyle = `hsl(${r * 40}, 100%, 50%)`;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// --- 11. O LOOP DO JOGO (Coração do Jogo) ---
// Essa função roda 60 vezes por segundo!
function draw() {
    if (!gameRunning) return; // Se parou, não faz nada.

    if (paused) {
        // Se pausado, apenas pede o próximo quadro mas não desenha movimento
        animationId = requestAnimationFrame(draw);
        return;
    }

    // 1. LIMPA A TELA (Senão vira um borrão, rastro da bola)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. DESENHA TUDO NA NOVA POSIÇÃO
    drawBricks();
    drawBall();
    drawPaddle();
    
    // 3. CALCULA A MATEMÁTICA (Colisões)
    collisionDetection();

    // Colisão Paredes LATERAIS
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx; // Inverte direção X
    
    // Colisão TETO
    if (y + dy < ballRadius) dy = -dy; // Inverte direção Y (bate e volta)
    
    // Colisão EM BAIXO (Raquete ou Morte)
    else if (y + dy > canvas.height - paddleHeight - 10) {
        // Se a bola estiver na horizontal da raquete:
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy; // REBATE!
            
            // FÍSICA AVANÇADA:
            // Se bater na ponta da raquete, muda o ângulo horizontal
            let centerPaddle = paddleX + paddleWidth / 2;
            let hitPoint = x - centerPaddle;
            dx = hitPoint * 0.15; // Dá "efeito" na bola
        } 
        else if (y + dy > canvas.height) {
            // Se passou da raquete e tocou no chão: MORREU.
            gameOver("FIM DE JOGO");
            return; // Sai da função para não desenhar mais nada
        }
    }

    // 4. MOVIMENTA A RAQUETE
    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
    else if (leftPressed && paddleX > 0) paddleX -= 7;

    // 5. ATUALIZA POSIÇÃO DA BOLA
    x += dx;
    y += dy;

    // 6. CHAMA O PRÓXIMO QUADRO (Loop Infinito)
    animationId = requestAnimationFrame(draw);
}

// --- 12. FIM DE JOGO ---
function gameOver(msg) {
    gameRunning = false;
    cancelAnimationFrame(animationId); // Para o loop
    
    // Mostra o botão para jogar de novo
    startBtn.style.display = "block";
    startBtn.innerText = "↻ REINICIAR";

    // --- SALVAR O RECORDE NO FIREBASE ---
    // Verifica se a função de salvar existe (veio do auth.js)
    if (window.salvarRecordeDB) {
        // Envia os pontos e avisa que é o jogo 'breakout'
        window.salvarRecordeDB(score, 'breakout');
    }
}

// --- 13. FUNÇÕES GLOBAIS DE CONTROLE ---
window.startGame = function() {
    if (!gameRunning) {
        initGameVars(); // Reseta pontos e posições
        gameRunning = true;
        paused = false;
        startBtn.style.display = "none"; // Esconde botão
        pauseOverlay.style.display = "none";
        draw(); // Começa o loop!
    }
};

window.togglePause = function() {
    if (!gameRunning) return;
    paused = !paused;
    pauseOverlay.style.display = paused ? "block" : "none";
};
