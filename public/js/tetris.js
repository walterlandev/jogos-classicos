/* ==========================================================================
   1. CONFIGURAÇÕES E SELETORES
   Pegamos os elementos do HTML para desenhar o jogo e mostrar pontos.
========================================================================== */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Elementos de HUD (PC e Mobile)
// Usamos arrays ou seleção dupla para atualizar os dois ao mesmo tempo
const scoreEls = [document.getElementById('scorePC'), document.getElementById('scoreMob')];
const levelEls = [document.getElementById('levelPC'), document.getElementById('levelMob')];

// Canvas de "Próxima Peça" (PC e Mobile)
const nextCanvasPC = document.getElementById('upcomingPC');
const nextCtxPC = nextCanvasPC ? nextCanvasPC.getContext('2d') : null;
const nextCanvasMob = document.getElementById('upcomingMob');
const nextCtxMob = nextCanvasMob ? nextCanvasMob.getContext('2d') : null;

const btnStartOverlay = document.getElementById('startBtnOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');

// Dimensões do Jogo
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30; // Tamanho interno do bloco (resolução)

// Cores Neon para as peças (Índice 0 é vazio)
const COLORS = [
    null,
    '#00ffff', // Cyan (I)
    '#ff00ff', // Pink (L)
    '#ff0000', // Red (J)
    '#00ff00', // Green (O)
    '#ff8800', // Orange (S)
    '#0000ff', // Blue (Z)
    '#ffff00'  // Yellow (T)
];

/* ==========================================================================
   2. VARIÁVEIS DE ESTADO
   Aqui guardamos tudo que muda durante o jogo.
========================================================================== */
let board = createMatrix(COLS, ROWS); // O tabuleiro (matriz de zeros)
let player = { pos: {x: 0, y: 0}, matrix: null }; // O jogador (peça caindo)
let nextPieceMatrix = null; // A próxima peça

let score = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 1000; // Começa caindo a cada 1 segundo (1000ms)
let lastTime = 0;

let isPaused = false;
let isGameOver = true; // Começa como "Fim de Jogo" até clicar em Iniciar
let requestId = null;  // Guarda o ID da animação para poder cancelar

/* ==========================================================================
   3. FUNÇÕES AUXILIARES (LÓGICA MATEMÁTICA)
========================================================================== */

// Cria uma matriz vazia (tabuleiro ou peça)
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// Cria as peças (Tetrominós) baseadas em letras
function createPiece(type) {
    if (type === 'I') return [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]];
    if (type === 'L') return [[0,5,0],[0,5,0],[0,5,5]];
    if (type === 'J') return [[0,6,0],[0,6,0],[6,6,0]];
    if (type === 'O') return [[7,7],[7,7]];
    if (type === 'S') return [[0,4,4],[4,4,0],[0,0,0]];
    if (type === 'Z') return [[3,3,0],[0,3,3],[0,0,0]];
    if (type === 'T') return [[0,2,0],[2,2,2],[0,0,0]];
}

// Função para rotacionar matriz (peça)
function rotate(matrix) {
    // Transposição + Inversão = Rotação 90 graus
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    matrix.forEach(row => row.reverse());
}

/* ==========================================================================
   4. LÓGICA DO JOGADOR
========================================================================== */

// Reseta o jogador com uma nova peça
function playerReset() {
    const pieces = 'ILJOTSZ';
    
    // Se não tiver próxima peça (início do jogo), cria uma
    if (!nextPieceMatrix) {
        nextPieceMatrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    }
    
    // A peça atual vira a "próxima" antiga
    player.matrix = nextPieceMatrix;
    // Gera uma nova "próxima"
    nextPieceMatrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    
    // Centraliza no topo
    player.pos.y = 0;
    player.pos.x = (board[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    // Se colidir logo ao nascer, é Game Over
    if (collide(board, player)) {
        gameOver();
    }
    
    drawNextPiece(); // Atualiza o desenho da próxima peça no HUD
}

// Tenta rotacionar o jogador
function playerRotate() {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix);
    
    // Wall Kick: Se rodar e bater na parede, empurra para o lado até caber
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix); // Se não der, roda de volta
            player.pos.x = pos;
            return;
        }
    }
}

// Move o jogador lateralmente
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(board, player)) {
        player.pos.x -= dir; // Se bater, desfaz o movimento
    }
}

// Faz a peça cair
function playerDrop() {
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--; // Desfaz a descida
        merge(board, player); // Funde a peça no tabuleiro
        playerReset(); // Cria nova peça
        arenaSweep(); // Verifica se completou linhas
    }
    dropCounter = 0;
}

// Verifica colisões entre peça e tabuleiro
function collide(board, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Copia a peça do jogador para a matriz do tabuleiro (fixa ela)
function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Verifica linhas completas
function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = board.length - 1; y > 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer; // Se achar um zero, a linha não está cheia
            }
        }
        
        // Remove a linha cheia e adiciona uma vazia no topo
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        rowCount++;
    }
    
    // Pontuação simples
    if (rowCount > 0) {
        score += rowCount * 1 * level; // Mais pontos em níveis altos
        level = Math.floor(score / 50) + 1; // Sobe de nível a cada 100 pontos
        
        // Aumenta velocidade (diminui intervalo)
        dropInterval = Math.max(100, 1000 - (level * 50)); 
        
        updateHUD();
    }
}

/* ==========================================================================
   5. DESENHO (RENDERIZAÇÃO)
========================================================================== */

function draw() {
    // Limpa a tela (fundo preto)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenha o Tabuleiro (Peças fixas)
    drawMatrix(board, {x: 0, y: 0}, ctx);
    
    // Desenha a Peça do Jogador
    drawMatrix(player.matrix, player.pos, ctx);
}

// Desenha uma matriz genérica no contexto dado
function drawMatrix(matrix, offset, context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Efeito Neon
                context.shadowBlur = 15;
                context.shadowColor = COLORS[value];
                context.fillStyle = COLORS[value];
                
                // Desenha o quadrado
                context.fillRect(
                    (x + offset.x) * BLOCK_SIZE,
                    (y + offset.y) * BLOCK_SIZE,
                    BLOCK_SIZE - 1, // -1 para deixar uma borda preta fina
                    BLOCK_SIZE - 1
                );
                
                // Reseta sombra para performance
                context.shadowBlur = 0;
            }
        });
    });
}

// Desenha a próxima peça nos mini-canvas (PC e Mobile)
function drawNextPiece() {
    [nextCtxPC, nextCtxMob].forEach(ctx => {
        if (!ctx) return;
        
        // Limpa
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 100, 100); // Tamanho arbitrário grande o suficiente
        
        // Calcula tamanho do bloco para o mini preview (menor que o jogo)
        const miniBlock = 20; 
        
        nextPieceMatrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = COLORS[value];
                    ctx.fillRect(x * miniBlock, y * miniBlock, miniBlock - 1, miniBlock - 1);
                }
            });
        });
    });
}

function updateHUD() {
    scoreEls.forEach(el => { if(el) el.innerText = score.toString().padStart(5, '0'); });
    levelEls.forEach(el => { if(el) el.innerText = level; });
}

/* ==========================================================================
   6. LOOP DO JOGO
========================================================================== */

function update(time = 0) {
    if (isPaused || isGameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestId = requestAnimationFrame(update);
}

/* ==========================================================================
   7. CONTROLES E EVENTOS
========================================================================== */

// Iniciar Jogo
window.startGame = function() {
    if (!isGameOver && !isPaused) return; // Se já roda, ignora

    // Reseta estado
    board = createMatrix(COLS, ROWS);
    score = 0;
    level = 1;
    dropInterval = 1000;
    isGameOver = false;
    isPaused = false;
    
    // Esconde botões
    btnStartOverlay.style.display = 'none';
    pauseOverlay.style.display = 'none';
    
    playerReset();
    updateHUD();
    update();
};

// Pausar
window.togglePause = function() {
    if (isGameOver) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseOverlay.style.display = 'block';
        cancelAnimationFrame(requestId);
    } else {
        pauseOverlay.style.display = 'none';
        lastTime = performance.now();
        update();
    }
};

// Game Over
function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(requestId);
    
    // Salva Recorde (se existir função)
    if (window.salvarRecordeDB) window.salvarRecordeDB(score);
    
    alert("FIM DE JOGO! Pontos: " + score);
    
    btnStartOverlay.style.display = 'block';
    btnStartOverlay.innerText = "↻ TENTAR NOVAMENTE";
}

// Input Unificado (Teclado e Toque)
window.handleInput = function(action, event) {
    if (event && event.cancelable) event.preventDefault(); // Evita scroll no celular
    
    if (isGameOver || isPaused) return;

    if (action === 'left') playerMove(-1);
    if (action === 'right') playerMove(1);
    if (action === 'down') playerDrop();
    if (action === 'rotate') playerRotate();
    
    draw(); // Redesenha imediatamente para resposta rápida
};

// Eventos de Teclado
document.addEventListener('keydown', event => {
    if (event.keyCode === 37) handleInput('left');
    else if (event.keyCode === 39) handleInput('right');
    else if (event.keyCode === 40) handleInput('down');
    else if (event.keyCode === 38 || event.keyCode === 82) handleInput('rotate'); // Cima ou R
    else if (event.keyCode === 80) togglePause(); // P para Pause
});
