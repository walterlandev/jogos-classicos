const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const upcomingCanvas = document.getElementById('upcoming');
const upCtx = upcomingCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

const COLORS = [null, '#00ffff', '#ff00ff', '#ff0000', '#00ff00', '#ff8800', '#0000ff', '#ffff00'];

let board = createMatrix(COLS, ROWS);
const player = { pos: {x: 0, y: 0}, matrix: null };

let score = 0;
let level = 1;
let nextPieceMatrix = null;
let paused = true;
let gameRunning = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let requestId = null;

function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

function createPiece(type) {
    if (type === 'I') return [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]];
    if (type === 'L') return [[0,5,0],[0,5,0],[0,5,5]];
    if (type === 'J') return [[0,6,0],[0,6,0],[6,6,0]];
    if (type === 'O') return [[7,7],[7,7]];
    if (type === 'S') return [[0,4,4],[4,4,0],[0,0,0]];
    if (type === 'Z') return [[3,3,0],[0,3,3],[0,0,0]];
    if (type === 'T') return [[0,2,0],[2,2,2],[0,0,0]];
}

function rotate(matrix) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    matrix.forEach(row => row.reverse());
}

function playerRotate() {
    if (paused || !gameRunning) return;
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix);
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix);
            player.pos.x = pos;
            return;
        }
    }
    draw();
}

function collide(board, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) return true;
        }
    }
    return false;
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) board[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    if (!nextPieceMatrix) nextPieceMatrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.matrix = nextPieceMatrix;
    nextPieceMatrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    if (collide(board, player)) {
        gameOver();
    }
    drawUpcoming();
}

function gameOver() {
    if (window.salvarRecordeDB) window.salvarRecordeDB(score);
    alert("FIM DE JOGO! Pontos: " + score);
    board.forEach(row => row.fill(0));
    score = 0;
    level = 1;
    dropInterval = 1000;
    gameRunning = false;
    paused = true;
    updateScore();
    document.getElementById('start').style.visibility = 'visible';
    cancelAnimationFrame(requestId);
}

function boardSweep() {
    let rowCount = 0;
    outer: for (let y = board.length - 1; y > 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) continue outer;
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y; 
        rowCount++;
    }

    if (rowCount > 0) {
        score += rowCount; 
        level = Math.floor(score / 50) + 1;
        let reducao = (level - 1) * 0.15;
        dropInterval = 1000 * (1 - reducao);
        if (dropInterval < 100) dropInterval = 100;
        updateScore();
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(ctx, board, {x: 0, y: 0});
    drawMatrix(ctx, player.matrix, player.pos);
}

function drawUpcoming() {
    // Define o tamanho interno do canvas da prévia
    // No PC usamos 120 (4 blocos de 30), no Mobile usamos 40 (4 blocos de 10)
    const isMobile = window.innerWidth < 768;
    const internalSize = isMobile ? 40 : 120;
    const blockSizePrevia = isMobile ? 10 : 30;

    upcomingCanvas.width = internalSize;
    upcomingCanvas.height = internalSize;

    upCtx.fillStyle = '#000';
    upCtx.fillRect(0, 0, upcomingCanvas.width, upcomingCanvas.height);

    // Centraliza a peça
    const offsetX = (upcomingCanvas.width - nextPieceMatrix[0].length * blockSizePrevia) / 2;
    const offsetY = (upcomingCanvas.height - nextPieceMatrix.length * blockSizePrevia) / 2;

    nextPieceMatrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                upCtx.fillStyle = COLORS[value];
                upCtx.fillRect(
                    Math.floor(offsetX + x * blockSizePrevia), 
                    Math.floor(offsetY + y * blockSizePrevia), 
                    blockSizePrevia - 1, 
                    blockSizePrevia - 1
                );
            }
        });
    });
}
function drawMatrix(context, matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = COLORS[value];
                context.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        });
    });
}

function updateScore() {
    scoreElement.innerText = score.toString().padStart(5, '0');
    levelElement.innerText = level;
}

function playerDrop() {
    if (paused) return;
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        boardSweep();
    }
    dropCounter = 0;
    draw();
}

function playerMove(dir) {
    if (paused) return;
    player.pos.x += dir;
    if (collide(board, player)) player.pos.x -= dir;
    draw();
}

function update(time = 0) {
    if (paused) return;
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) playerDrop();
    draw();
    requestId = requestAnimationFrame(update);
}

window.play = function() {
    if(gameRunning) return;
    gameRunning = true;
    paused = false;
    board.forEach(row => row.fill(0));
    playerReset();
    updateScore();
    lastTime = performance.now();
    update();
    document.getElementById('start').style.visibility = 'hidden';
};

window.togglePause = function() {
    if (!gameRunning) return;
    if (!paused) {
        paused = true;
        cancelAnimationFrame(requestId);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = "20px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText("PAUSADO", canvas.width / 2, canvas.height / 2);
    } else {
        paused = false;
        lastTime = performance.now();
        update();
    }
};

window.handleMove = function(command) {
    if (!gameRunning || paused) return;
    if (command === 'left') playerMove(-1);
    if (command === 'right') playerMove(1);
    if (command === 'down') playerDrop();
};

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) window.handleMove('left');
    else if (event.keyCode === 39) window.handleMove('right');
    else if (event.keyCode === 40) window.handleMove('down');
    else if (event.keyCode === 38) playerRotate();
    else if (event.keyCode === 80 || event.keyCode === 27) window.togglePause();
});

function setupMobileControls() {
    const buttons = document.querySelectorAll('.controles-mobile button');
    buttons.forEach(btn => {
        btn.onclick = null;
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const cmd = btn.getAttribute('data-command');
            
            // Lógica rigorosa para evitar o bug do Samsung Internet
            if (cmd === 'pause') {
                window.togglePause();
            } else if (cmd === 'rotate') {
                playerRotate();
            } else if (cmd) {
                window.handleMove(cmd);
            }
        }, { passive: false });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    setupMobileControls();
    draw(); 
});
