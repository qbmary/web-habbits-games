const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');
const gameMessage = document.getElementById('gameMessage');
const restartButton = document.getElementById('restartButton');

// Load high score
let highScore = localStorage.getItem('snakeHighScore') ? parseInt(localStorage.getItem('snakeHighScore')) : 0;
document.getElementById('highScoreDisplay').innerText = `Рекорд: ${highScore}`;

// Объявляем переменные до использования
const gridSize = 20;
let tileCount = canvas.width / gridSize;
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let gameActive = true;

let touchStartX = 0;
let touchStartY = 0;

// Адаптивный размер канваса
function setCanvasSize() {
  const canvasSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--canvas-size') || 400);
  canvas.width = canvasSize; // Убедимся, что ширина и высота заданы
  canvas.height = canvasSize;
  tileCount = canvas.width / gridSize; // Пересчитываем количество клеток
  // Сбросим позицию, если поле изменилось
  if (snake[0].x >= tileCount || snake[0].y >= tileCount) {
    resetGame();
  }
}
setCanvasSize();
window.addEventListener('resize', setCanvasSize);

// Управление стрелками для компьютеров
document.addEventListener('keydown', (event) => {
  if (gameActive && !('ontouchstart' in window)) { // Только для не сенсорных устройств
    switch (event.key) {
      case 'ArrowUp': if (dy === 0) { dx = 0; dy = -1; } break;
      case 'ArrowDown': if (dy === 0) { dx = 0; dy = 1; } break;
      case 'ArrowLeft': if (dx === 0) { dx = -1; dy = 0; } break;
      case 'ArrowRight': if (dx === 0) { dx = 1; dy = 0; } break;
    }
  }
});

// Управление свайпами для сенсорных устройств
if ('ontouchstart' in window) {
  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Предотвращаем прокрутку
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    if (!gameActive) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dxTouch = touchEndX - touchStartX;
    const dyTouch = touchEndY - touchStartY;
    const absDx = Math.abs(dxTouch);
    const absDy = Math.abs(dyTouch);

    if (absDx > absDy && absDx > 20) { // Горизонтальный свайп с порогом
      if (dx === 0) {
        if (dxTouch > 0) dx = 1, dy = 0; // Вправо
        else dx = -1, dy = 0; // Влево
      }
    } else if (absDy > 20) { // Вертикальный свайп с порогом
      if (dy === 0) {
        if (dyTouch > 0) dx = 0, dy = 1; // Вниз
        else dx = 0, dy = -1; // Вверх
      }
    }
  }, { passive: true });
}

function drawGame() {
  if (!gameActive) return;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };
  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
  } else {
    snake.pop();
  }

  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || snakeCollision()) {
    gameMessage.innerText = `Игра окончена! Счет: ${score}`;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('snakeHighScore', highScore);
      document.getElementById('highScoreDisplay').innerText = `Рекорд: ${highScore}`;
    }
    gameActive = false;
    restartButton.style.display = 'block';
    return;
  }

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'lime';
  snake.forEach(segment => ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2));
  ctx.fillStyle = 'red';
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function snakeCollision() {
  const head = snake[0];
  return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
}

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  food = { x: 15, y: 15 };
  dx = 0;
  dy = 0;
  score = 0;
  gameActive = true;
  gameMessage.innerText = '';
  restartButton.style.display = 'none';
}

restartButton.addEventListener('click', resetGame);
setInterval(drawGame, 100);