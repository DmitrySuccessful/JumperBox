const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const controls = document.getElementById('controls');
const restartButton = document.getElementById('restartButton');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const game = new Game(ctx);
game.start();

controls.style.display = 'block'; // Показываем иконку в начале игры

// Скрываем иконку после начала игры
game.onStart = () => {
    controls.style.display = 'none';
    restartButton.style.display = 'none'; // Скрываем кнопку перезапуска
};

restartButton.addEventListener('click', () => {
    game.restart(); // Предполагается, что у вас есть метод restart в классе Game
    restartButton.style.display = 'none'; // Скрываем кнопку после нажатия
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    game.resize();
});
