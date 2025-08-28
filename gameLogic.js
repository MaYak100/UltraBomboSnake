// Основная игровая логика для игры "Маяковская Змейка"

// Получение элементов DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// Константы игры
const gridSize = 20;
let tileCount = 20; // Значение по умолчанию, будет обновлено после загрузки canvas
const gameSpeed = 130;

// Переменные состояния игры
let snake = [{x: 10, y: 10}];
let food = {};
let obstacles = [];
let dx = 0, dy = 0;
let score = 0;
let level = 1;
let gameRunning = true;
let inputQueue = [];
let previewObstacles = [];
let showPreview = false;
let nextStructureFunction = null;
let immaterialTurns = 0; 
const IMMATERIAL_TURNS_COUNT = 4; 
let lastSnakeHead = null; 

// Поиск безопасной позиции для еды
function findSafePosition() {
    for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * tileCount);
        const y = Math.floor(Math.random() * tileCount);
        
        const isOccupied = obstacles.some(obs => obs.x === x && obs.y === y) ||
                          snake.some(segment => segment.x === x && segment.y === y) ||
                          (food.x === x && food.y === y);
        
        if (!isOccupied) return {x, y};
    }
    
    const centerPos = {x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2)};
    return centerPos;
}

// Поиск безопасной стартовой позиции для змейки
function findSafeStartPosition() {
    for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * (tileCount - 4)) + 2;
        const y = Math.floor(Math.random() * (tileCount - 4)) + 2;
        
        let isAreaClear = true;
        for (let dx = -1; dx <= 1 && isAreaClear; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (obstacles.some(obs => obs.x === x + dx && obs.y === y + dy)) {
                    isAreaClear = false;
                    break;
                }
            }
        }
        
        if (isAreaClear) return {x, y};
    }
    
    const centerPos = {x: 10, y: 10};
    return centerPos;
}

// Генерация еды в случайной позиции
function randomFood() {
    food = findSafePosition();
    
    if (score >= 190) {
        food.isGolden = true;
    } else {
        food.isGolden = false;
    }
    
    if (obstacles.some(obs => obs.x === food.x && obs.y === food.y)) {
        let attempts = 0;
        while (obstacles.some(obs => obs.x === food.x && obs.y === food.y) && attempts < 20) {
            food = findSafePosition();
            attempts++;
        }
        if (attempts >= 20) {
            // Не удалось найти безопасную позицию для еды
        }
    }
}

// Инициализация препятствий для первого уровня
function initializeObstacles() {
    const structures = levelStructures[1];
    const randomStructure = structures[Math.floor(Math.random() * structures.length)];
    const reflectionType = Math.floor(Math.random() * 8);
    obstacles = applyReflection(randomStructure, reflectionType);
}

// Генерация предварительного просмотра препятствий
function generatePreviewForNextChange() {
    if (score >= 240) {
        return;
    }
    
    const nextLevel = Math.min(Math.floor((score + 10) / 50) + 1, 5);
    
    const structures = levelStructures[nextLevel];
    const randomStructure = structures[Math.floor(Math.random() * structures.length)];
    
    const reflectionType = Math.floor(Math.random() * 8);
    
    nextStructureFunction = () => applyReflection(randomStructure, reflectionType);
    
    previewObstacles = applyReflection(randomStructure, reflectionType);
    showPreview = true;
    
    if (previewObstacles.length === 0) {
        return;
    }
}

// Смена уровня
function changeLevel() {
    if (nextStructureFunction) {
        const newObstacles = nextStructureFunction();
        obstacles = newObstacles;
        nextStructureFunction = null;
        
        if (previewObstacles.length > 0) {
            const previewMatch = previewObstacles.length === obstacles.length && 
                previewObstacles.every((preview, index) => 
                    preview.x === obstacles[index].x && preview.y === obstacles[index].y
                );
            
            if (!previewMatch) {
                // Структура не совпадает с предварительным просмотром
            }
        }
    } else {
        const structures = levelStructures[level];
        const randomStructure = structures[Math.floor(Math.random() * structures.length)];
        const reflectionType = Math.floor(Math.random() * 8);
        obstacles = applyReflection(randomStructure, reflectionType);
    }
    
    immaterialTurns = IMMATERIAL_TURNS_COUNT;
    
    showPreview = false;
    previewObstacles = [];
    
    let attempts = 0;
    while (obstacles.some(obs => obs.x === food.x && obs.y === food.y) && attempts < 10) {
        randomFood();
        attempts++;
    }
}

// Отрисовка игрового поля
function drawGame() {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#34495e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    snake.forEach((segment, index) => {
        if (index === 0) {
            const headGradient = ctx.createRadialGradient(
                segment.x * gridSize + gridSize/2, segment.y * gridSize + gridSize/2, 0,
                segment.x * gridSize + gridSize/2, segment.y * gridSize + gridSize/2, gridSize/2
            );
            headGradient.addColorStop(0, '#2ecc71');
            headGradient.addColorStop(1, '#27ae60');
            ctx.fillStyle = headGradient;
        } else {
            ctx.fillStyle = index % 2 === 0 ? '#27ae60' : '#229954';
        }
        
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const size = gridSize - 2;
        const radius = 3;
        
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, radius);
        ctx.fill();
    });

    if (food.isGolden) {
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#f39c12';
    } else {
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#e74c3c';
    }
    
    const foodX = food.x * gridSize;
    const foodY = food.y * gridSize;
    const foodSize = gridSize - 2;
    
    ctx.beginPath();
    ctx.roundRect(foodX, foodY, foodSize, foodSize, 4);
    ctx.fill();
    
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#8e44ad';
    obstacles.forEach(obstacle => {
        const x = obstacle.x * gridSize;
        const y = obstacle.y * gridSize;
        const size = gridSize - 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 2);
        ctx.fill();
    });

    if (showPreview && previewObstacles.length > 0) {
        ctx.fillStyle = 'rgba(142, 68, 173, 0.4)';
        previewObstacles.forEach(obstacle => {
            const x = obstacle.x * gridSize;
            const y = obstacle.y * gridSize;
            const size = gridSize - 2;
            
            ctx.beginPath();
            ctx.roundRect(x, y, size, size, 2);
            ctx.fill();
        });
    }
}

// Обработка движения змейки
function moveSnake() {
    if (!gameRunning) return;

    if (inputQueue.length > 0) {
        const nextDirection = inputQueue.shift();
        if ((dx === 0 && dy === 0) || !(nextDirection.dx === -dx && nextDirection.dy === -dy)) {
            dx = nextDirection.dx;
            dy = nextDirection.dy;
        }
    }

    if (dx === 0 && dy === 0) return;

    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount ||
        snake.some(segment => head.x === segment.x && head.y === segment.y) ||
        (immaterialTurns === 0 && obstacles.some(obstacle => head.x === obstacle.x && head.y === obstacle.y))) {
        gameOver();
        return;
    }

    snake.unshift(head);

    if (lastSnakeHead && (head.x !== lastSnakeHead.x || head.y !== lastSnakeHead.y)) {
        if (immaterialTurns > 0) {
            immaterialTurns--;
        }
    }
    lastSnakeHead = {x: head.x, y: head.y};

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        if (checkWin()) {
            return;
        }
        
        const scoreItem = document.querySelector('.stat-item');
        scoreItem.classList.add('score-updated');
        setTimeout(() => {
            scoreItem.classList.remove('score-updated');
        }, 600);
        
        if (score % 50 === 0) {
            const newLevel = Math.floor(score / 50) + 1;
            if (newLevel !== level) {
                level = newLevel;
                levelElement.textContent = level;
                
                const levelItem = document.querySelectorAll('.stat-item')[1];
                levelItem.classList.add('score-updated');
                setTimeout(() => {
                    levelItem.classList.remove('score-updated');
                }, 600);
            }
            
            if (!showPreview && !nextStructureFunction) {
                generatePreviewForNextChange();
            }
            
            changeLevel();
        } else {
            const pointsToNext50 = 50 - (score % 50);
            if (pointsToNext50 === 10 && !showPreview) {
                generatePreviewForNextChange();
            }
        }
        
        randomFood();
    } else {
        snake.pop();
    }
}

// Завершение игры
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// Проверка победы
function checkWin() {
    if (score >= 250) {
        gameRunning = false;
        showWinScreen();
        return true;
    }
    return false;
}

// Отображение экрана победы
function showWinScreen() {
    const winScreen = document.createElement('div');
    winScreen.className = 'game-over';
    winScreen.id = 'winScreen';
    winScreen.style.display = 'block';
    winScreen.innerHTML = `
        <h2 style="color: #f39c12;">🎉 Победа! 🎉</h2>
        <p>Поздравляем! Ты прошел все уровни!</p>
        <p>Сделай скрин и скинь Маяку</p>
        <button class="restart-btn" onclick="restartGame()">Играть снова</button>
    `;
    
    document.body.appendChild(winScreen);
}

// Перезапуск игры с сбросом состояния
function restartGame() {
    gameOverElement.style.display = 'none';
    const winScreen = document.getElementById('winScreen');
    if (winScreen) {
        winScreen.remove();
    }
    
    obstacles = [];
    previewObstacles = [];
    inputQueue = [];
    dx = 0;
    dy = 0;
    score = 0;
    level = 1;
    showPreview = false;
    nextStructureFunction = null;
    immaterialTurns = 0;
    lastSnakeHead = null;
    
    scoreElement.textContent = score;
    levelElement.textContent = level;
    gameRunning = true;
    
    initializeObstacles();
    const safeStart = findSafeStartPosition();
    snake = [{x: safeStart.x, y: safeStart.y}];
    randomFood();
}

// Обработка клавиатурного ввода
document.addEventListener('keydown', (e) => {
    if (e.key === 'R' || e.key === 'r' || e.key === 'Enter' || 
        e.key === 'к' || e.key === 'К') {
        if (!gameRunning) {
            const winScreen = document.getElementById('winScreen');
            if (winScreen && winScreen.style.display === 'block') {
                return;
            }
            restartGame();
            return;
        }
        return;
    }

    if (!gameRunning) return;

    let newDirection = null;
    const key = e.key.toLowerCase();

    if (key === 'arrowup' || key === 'w' || key === 'ц') {
        newDirection = {dx: 0, dy: -1};
    } else if (key === 'arrowdown' || key === 's' || key === 'ы') {
        newDirection = {dx: 0, dy: 1};
    } else if (key === 'arrowleft' || key === 'a' || key === 'ф') {
        newDirection = {dx: -1, dy: 0};
    } else if (key === 'arrowright' || key === 'd' || key === 'в') {
        newDirection = {dx: 1, dy: 0};
    }

    if (newDirection) {
        let currentDx = dx;
        let currentDy = dy;
        if (inputQueue.length > 0) {
            const lastCommand = inputQueue[inputQueue.length - 1];
            currentDx = lastCommand.dx;
            currentDy = lastCommand.dy;
        }

        if ((dx === 0 && dy === 0) || !(newDirection.dx === -currentDx && newDirection.dy === -currentDy)) {
            if (inputQueue.length < 3) {
                inputQueue.push(newDirection);
            }
        }
    }
});

// Основной игровой цикл
function gameLoop() {
    moveSnake();
    drawGame();
}

// Полифилл для roundRect в старых браузерах
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
    };
}

// Валидация структур уровней
function validateLevelStructures() {
    for (let level = 1; level <= 4; level++) {
        if (!levelStructures[level] || !Array.isArray(levelStructures[level])) {
            return false;
        }
        
        levelStructures[level].forEach((structure, index) => {
            if (!Array.isArray(structure) || structure.length === 0) {
                return false;
            }
            
            structure.forEach(point => {
                if (point.x < 0 || point.x >= tileCount || point.y < 0 || point.y >= tileCount) {
                    // Координата выходит за пределы поля
                }
            });
        });
    }
    return true;
}

// Функция отладки для разработчиков
function debugPreview() {
    // Функция отладки доступна для разработчиков
}

// Экспорт функций для глобального доступа
window.debugPreview = debugPreview;
window.restartGame = restartGame;

// Инициализация игры после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Обновляем tileCount после загрузки canvas
    tileCount = canvas.width / gridSize;
    
    validateLevelStructures();
    initializeObstacles();
    const safeStart = findSafeStartPosition();
    snake = [{x: safeStart.x, y: safeStart.y}];
    randomFood();
    setInterval(gameLoop, gameSpeed);
    drawGame();
});
