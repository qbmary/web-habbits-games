const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gameMessage = document.getElementById('gameMessage');
const restartButton = document.getElementById('restartButton');

// Load high score
let highScore = localStorage.getItem('paddleHighScore') ? parseInt(localStorage.getItem('paddleHighScore')) : 0;
document.getElementById('highScoreDisplay').innerText = `Рекорд: ${highScore}`;

// Объявляем переменные до использования
let ballX = canvas.width / 2;
let ballY = canvas.height - 50;
let ballStepX = 5;
let ballStepY = -6;
let ballRadius = 10;

let paddleX = canvas.width / 2 - 50;
let paddleWidth = 100;
let paddleHeight = 10;
let paddleOffset = 40;

let score = 0;
let gameActive = true;

let touchStartX = 0;
let touchStartY = 0;

// Блоки
const blockRows = 3;
const blockCols = 6;
let blocks = [];

// Функция генерации блоков
function generateBlocks() {
  blocks = [];
  const blockWidth = canvas.width / blockCols - 2; // Адаптируем ширину с отступом
  const blockHeight = canvas.height / 25; // Адаптируем высоту (примерно 20 на 500px)
  const blockPadding = 2;
  const startY = canvas.height / 10; // Выше платформы, адаптируем

  for (let row = 0; row < blockRows; row++) {
    for (let col = 0; col < blockCols; col++) {
      blocks.push({
        x: col * (blockWidth + blockPadding) + blockPadding / 2, // Центрируем
        y: startY + row * (blockHeight + blockPadding),
        width: blockWidth,
        height: blockHeight,
        active: true
      });
    }
  }
}

// Адаптивный размер канваса
function setCanvasSize() {
  const canvasSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--canvas-size') || 400);
  canvas.width = canvasSize;
  canvas.height = canvasSize * 0.625; // Соотношение 800x500 из статьи
  paddleWidth = canvas.width / 8; // Адаптируем платформу
  paddleX = canvas.width / 2 - paddleWidth / 2;
  ballRadius = canvas.width / 80; // Адаптируем мячик
  ballStepX = canvas.width / 160; // Адаптируем скорость (~5 на 800px)
  ballStepY = -canvas.height / 83.33; // Адаптируем скорость (~6 на 500px)
  paddleOffset = canvas.height / 12.5; // Адаптируем отступ платформы
  paddleHeight = canvas.height / 50; // Адаптируем высоту платформы
  generateBlocks(); // Генерируем блоки при изменении размера
  // Начальная отрисовка
  drawGame();
}
setCanvasSize();
window.addEventListener('resize', setCanvasSize);

// Управление мышью
canvas.addEventListener('mousemove', (event) => {
  if (gameActive && !('ontouchstart' in window)) {
    const rect = canvas.getBoundingClientRect();
    paddleX = event.clientX - rect.left - paddleWidth / 2;
    if (paddleX < 0) paddleX = 0;
    if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
  }
});

// Управление стрелками для ПК
document.addEventListener('keydown', (event) => {
  if (gameActive && !('ontouchstart' in window)) {
    if (event.key === 'ArrowLeft') paddleX -= 10;
    if (event.key === 'ArrowRight') paddleX += 10;
    if (paddleX < 0) paddleX = 0;
    if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
  }
});

// Управление свайпами для телефонов
if ('ontouchstart' in window) {
  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (gameActive) {
      const touchX = e.touches[0].clientX;
      paddleX = touchX - canvas.getBoundingClientRect().left - paddleWidth / 2;
      if (paddleX < 0) paddleX = 0;
      if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
    }
  }, { passive: false });
}

function drawGame() {
  if (!gameActive) return;

  // Движение мячика
  ballX += ballStepX;
  ballY += ballStepY;

  // Отскок от стен
  if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width) ballStepX *= -1;
  if (ballY - ballRadius < 0) ballStepY *= -1;

  // Отскок от платформы
  const paddleLeft = paddleX;
  const paddleRight = paddleLeft + paddleWidth;
  const paddleTop = canvas.height - paddleOffset;
  const paddleBottom = paddleTop + paddleHeight;
  if (ballX > paddleLeft && ballX < paddleRight && ballY > paddleTop && ballY < paddleBottom) {
    ballStepY *= -1;
    const paddleCenter = paddleLeft + paddleWidth / 2;
    const ballDistance = ballX - paddleCenter;
    ballStepX = ballDistance * 0.35;
    score += 10; // Увеличиваем счёт за отскок
  }

  // Проверка столкновения с блоками
  blocks.forEach(block => {
    if (block.active) {
      if (ballX + ballRadius > block.x && ballX - ballRadius < block.x + block.width &&
          ballY + ballRadius > block.y && ballY - ballRadius < block.y + block.height) {
        block.active = false;
        ballStepY *= -1; // Отскок от блока
        score += 50; // Больше очков за блок
      }
    }
  });

  // Проверка победы
  if (blocks.every(block => !block.active)) {
    gameMessage.innerText = 'Уровень пройден!';
    gameActive = false;
    restartButton.style.display = 'block';
    return;
  }

  // Проигрыш (мячик упал)
  if (ballY + ballRadius > canvas.height) {
    gameMessage.innerText = `Игра окончена! Счет: ${score}`;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('paddleHighScore', highScore);
      document.getElementById('highScoreDisplay').innerText = `Рекорд: ${highScore}`;
    }
    gameActive = false;
    restartButton.style.display = 'block';
    return;
  }

  // Отрисовка
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'firebrick';
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();

  ctx.fillStyle = '#fff';
  ctx.fillRect(paddleX, canvas.height - paddleOffset, paddleWidth, paddleHeight);

  // Отрисовка блоков
  ctx.fillStyle = 'blue';
  blocks.forEach(block => {
    if (block.active) {
      ctx.fillRect(block.x, block.y, block.width, block.height);
    }
  });
}

function resetGame() {
  ballX = canvas.width / 2;
  ballY = canvas.height - 50;
  ballStepX = canvas.width / 160; // Адаптируем скорость при сбросе
  ballStepY = -canvas.height / 83.33;
  paddleX = canvas.width / 2 - paddleWidth / 2;
  score = 0;
  gameActive = true;
  generateBlocks(); // Генерируем новые блоки
  gameMessage.innerText = '';
  restartButton.style.display = 'none';
  drawGame(); // Рисуем сразу после сброса
}

restartButton.addEventListener('click', resetGame);

setInterval(drawGame, 1000 / 24); // 24 fps, как в статье