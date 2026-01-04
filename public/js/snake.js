/* ===== CONFIGURAÇÃO DO CANVAS ===== */
const canvas = document.getElementById('snakeGame'); 
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('snakeScore');
const bestElement = document.getElementById('snakeBest');
const levelElement = document.getElementById('snakeLevel'); // Novo indicador

const SIZE = 20; 
const TOTAL_BLOCOS = (canvas.width / SIZE) * (canvas.height / SIZE); 
const BLOCOS_POR_NIVEL = TOTAL_BLOCOS / 10; 

let snake = [{ x: 200, y: 200 }, { x: 180, y: 200 }, { x: 160, y: 200 }];
let food = { x: 0, y: 0 };
let dx = SIZE; 
let dy = 0;    
let score = 0;
let level = 1;
let gameInterval = null;
let speed = 200; 

function getRandomFood() {
    food.x = Math.floor(Math.random() * (canvas.width / SIZE)) * SIZE;
    food.y = Math.floor(Math.random() * (canvas.height / SIZE)) * SIZE;
    for (let part of snake) {
        if (part.x === food.x && part.y === food.y) return getRandomFood();
    }
}

function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff00ff";
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(food.x, food.y, SIZE - 1, SIZE - 1);

    ctx.shadowColor = "#00ffff";
    snake.forEach((part, index) => {
        const isHead = index === 0;
        ctx.shadowBlur = isHead ? 20 : 10;
        ctx.fillStyle = isHead ? "#fff" : "#00ffff"; 
        ctx.fillRect(part.x, part.y, SIZE - 1, SIZE - 1);
    });
    
    ctx.shadowBlur = 0;
    updateSnake();
}

function updateSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) return gameOver();
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        updateStats();
        getRandomFood();
    } else {
        snake.pop();
    }
}

/* ===== LÓGICA DE NÍVEL E VELOCIDADE ===== */
function updateStats() {
    scoreElement.innerText = score.toString().padStart(5, '0');
    
    // Nível baseado na capacidade máxima / 10
    // Em um canvas 400x400 com blocos de 20px, BLOCOS_POR_NIVEL será 40.
    let newLevel = Math.floor(score / BLOCOS_POR_NIVEL) + 1;
    
    // Se subir de nível (máximo nível 10 conforme sua regra)
    if (newLevel > level && newLevel <= 10) {
        level = newLevel;
        levelElement.innerText = level; 
        
        clearInterval(gameInterval);
        
        // Velocidade: Aumenta 15% por nível (o intervalo diminui para 85%)
        // Começa em 200ms. Nível 2 = 200 * 0.85, Nível 3 = 200 * 0.85 * 0.85...
        speed = 200 * Math.pow(0.85, level - 1);
        
        // Limite de segurança
        if (speed < 50) speed = 50;
        
        gameInterval = setInterval(draw, speed);
        
        // Efeito visual de upgrade
        canvas.style.borderColor = "#fff";
        setTimeout(() => canvas.style.borderColor = "#00ffff", 200);
    }
}

/* ===== CONTROLES MOBILE CORRIGIDOS ===== */
window.handleMove = function(event, direction) {
    // IMPORTANTE: impede o navegador de tentar rolar a página ao tocar nos botões
    if (event && event.cancelable) {
        event.preventDefault();
    }

    if (!gameInterval) return;

    // Lógica de direção (impede a cobra de morder o próprio pescoço)
    if (direction === "up" && dy === 0) { dx = 0; dy = -SIZE; }
    if (direction === "down" && dy === 0) { dx = 0; dy = SIZE; }
    if (direction === "left" && dx === 0) { dx = -SIZE; dy = 0; }
    if (direction === "right" && dx === 0) { dx = SIZE; dy = 0; }
};

// Previne o "pinch-to-zoom" e scroll acidental no jogo
document.addEventListener('touchstart', function(e) {
    if (e.target.tagName === 'BUTTON') {
        e.preventDefault(); 
    }
}, { passive: false });

async function gameOver() {
    clearInterval(gameInterval);
    gameInterval = null;

    if (window.salvarRecordeDB) {
        // Adicionamos o "await" para esperar o envio antes de recarregar
        await window.salvarRecordeDB(score, "usuarios_snake");
    }

    alert("FIM DE JOGO!\nNível: " + level + "\nPontos: " + score);
    location.reload(); 
}

window.startGame = function() {
    if (gameInterval) return;
    document.getElementById('startBtn').style.display = 'none';
    getRandomFood();
    gameInterval = setInterval(draw, speed);
};

window.addEventListener('keydown', e => {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
    if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -SIZE; }
    if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = SIZE; }
    if (e.key === "ArrowLeft" && dx === 0) { dx = -SIZE; dy = 0; }
    if (e.key === "ArrowRight" && dx === 0) { dx = SIZE; dy = 0; }
});
/* ===== CONTROLES PARA CELULAR (TOUCH) ===== */
window.handleMove = function(direction) {
    if (!gameInterval) return;

    if (direction === "up" && dy === 0) { dx = 0; dy = -SIZE; }
    if (direction === "down" && dy === 0) { dx = 0; dy = SIZE; }
    if (direction === "left" && dx === 0) { dx = -SIZE; dy = 0; }
    if (direction === "right" && dx === 0) { dx = SIZE; dy = 0; }
};

// ESSENCIAL: Impede que o celular role a tela ao tocar nos botões de controle
document.addEventListener('touchstart', function(e) {
    if (e.target.tagName === 'BUTTON') {
        e.preventDefault(); 
    }
}, { passive: false });
