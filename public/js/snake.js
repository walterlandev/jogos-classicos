/* ==========================================================================
   CONFIGURAÇÃO INICIAL
========================================================================== */
const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("snakeScore");
const levelEl = document.getElementById("snakeLevel");
const bestEl = document.getElementById("snakeBest");

// Tenta encontrar qualquer um dos botões de início possíveis
const btnStart = document.querySelector(".btn-start") || 
                 document.querySelector(".btn-start-overlay") || 
                 document.getElementById("startBtnPC");

const SIZE = 20;
let snake, food, dx, dy, score, level, speed, loop;
let isBonus = false;
let bonusTimer = null;

/* ==========================================================================
   FUNÇÕES DE INÍCIO E GAME OVER
========================================================================== */
window.startGame = () => {
    if (loop) return; // Evita iniciar dois loops ao mesmo tempo

    // Esconde o botão que foi clicado
    if (btnStart) btnStart.style.display = "none";

    // Reinicia variáveis do jogo
    snake = [
        { x: SIZE * 5, y: SIZE * 5 },
        { x: SIZE * 4, y: SIZE * 5 },
        { x: SIZE * 3, y: SIZE * 5 }
    ];
    dx = SIZE; 
    dy = 0;
    score = 0; 
    level = 1; 
    speed = 200;
    isBonus = false;

    updateHUD();
    spawnFood();
    
    // Inicia o ciclo do jogo
    if (loop) clearInterval(loop);
    loop = setInterval(draw, speed);
};

function gameOver() {
    clearInterval(loop);
    loop = null;
    if (bonusTimer) clearTimeout(bonusTimer);
    
    if (btnStart) {
        btnStart.innerText = "TENTAR NOVAMENTE";
        btnStart.style.display = "block";
    }

    ctx.fillStyle = "white";
    ctx.font = "16px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
}

/* ==========================================================================
   LÓGICA DA COMIDA E DO BÔNUS (REGRAS NOVAS)
========================================================================== */
function spawnFood() {
    // Se o score é 20, 40, 60... e ainda não ativamos o modo bônus
    if (score > 0 && score % 20 === 0 && !isBonus) {
        isBonus = true;
        
        // O bônus dura 10 segundos. Se não comer, ele volta a ser comida normal.
        if (bonusTimer) clearTimeout(bonusTimer);
        bonusTimer = setTimeout(() => {
            if (isBonus) {
                isBonus = false;
                spawnFood(); // Troca a posição para virar comida normal
            }
        }, 10000);
    }

    food = {
        x: Math.floor(Math.random() * (canvas.width / SIZE)) * SIZE,
        y: Math.floor(Math.random() * (canvas.height / SIZE)) * SIZE
    };

    // Impede que a comida nasça em cima da cobra
    if (snake.some(p => p.x === food.x && p.y === food.y)) spawnFood();
}

/* ==========================================================================
   DESENHO E ATUALIZAÇÃO
========================================================================== */
function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha Peça (Bônus Arco-íris ou Comida Rosa)
    if (isBonus) {
        const hue = (Date.now() / 2) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 20;
    } else {
        ctx.fillStyle = "#ff00ff";
        ctx.shadowColor = "#ff00ff";
        ctx.shadowBlur = 10;
    }
    ctx.fillRect(food.x, food.y, SIZE - 1, SIZE - 1);

    // Desenha Cobra
    ctx.shadowColor = "#00ffff";
    snake.forEach((p, i) => {
        ctx.shadowBlur = i === 0 ? 20 : 10;
        ctx.fillStyle = i === 0 ? "#fff" : "#00ffff";
        ctx.fillRect(p.x, p.y, SIZE - 1, SIZE - 1);
    });

    ctx.shadowBlur = 0;
    update();
}

function update() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Colisões
    if (head.x < 0 || head.y < 0 || head.x >= canvas.width || head.y >= canvas.height ||
        snake.some(p => p.x === head.x && p.y === head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    // Quando a cobra come a peça
    if (head.x === food.x && head.y === food.y) {
        if (isBonus) {
            score += 10; // Bônus dá 10 pontos
            // EFEITO: Diminui a cobra em 5 pedaços (mantendo no mínimo 2)
            for (let i = 0; i < 5; i++) {
                if (snake.length > 2) snake.pop();
            }
            isBonus = false;
            if (bonusTimer) clearTimeout(bonusTimer);
        } else {
            score += 1; // Comida normal dá 1 ponto
        }

        checkLevel();
        spawnFood();
        updateHUD();
    } else {
        snake.pop();
    }
}

function checkLevel() {
    // Nível 1 meta: 20 | Nível 2+ meta: 30 a mais cada
    let metaParaProximoNivel = (level === 1) ? 20 : 20 + ((level - 1) * 30);

    if (score >= metaParaProximoNivel) {
        level++;
        // Aumenta a velocidade (reduz o tempo do intervalo)
        speed = Math.max(speed * 0.85, 50); 
        clearInterval(loop);
        loop = setInterval(draw, speed);
    }
}

function updateHUD() {
    if (scoreEl) scoreEl.innerText = score.toString().padStart(4, "0");
    if (levelEl) levelEl.innerText = level;
}

/* ==========================================================================
   CONTROLES E RESPONSIVIDADE
========================================================================== */
function changeDir(dir) {
    if (!loop) return;
    if (dir === "up" && dy === 0) { dx = 0; dy = -SIZE; }
    if (dir === "down" && dy === 0) { dx = 0; dy = SIZE; }
    if (dir === "left" && dx === 0) { dx = -SIZE; dy = 0; }
    if (dir === "right" && dx === 0) { dx = SIZE; dy = 0; }
}

window.handleMove = (e, dir) => {
    if (e && e.cancelable) e.preventDefault();
    changeDir(dir);
};

document.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if (k === "arrowup" || k === "w") changeDir("up");
    if (k === "arrowdown" || k === "s") changeDir("down");
    if (k === "arrowleft" || k === "a") changeDir("left");
    if (k === "arrowright" || k === "d") changeDir("right");
});

function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.90, 400);
    canvas.width = Math.floor(size / SIZE) * SIZE;
    canvas.height = Math.floor(size / SIZE) * SIZE;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
