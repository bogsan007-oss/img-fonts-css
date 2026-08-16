// =====================================
// === SCRIPT: PLAYER MAIN (Плей/Пауза) ===
// === ОТВЕЧАЕТ ЗА КНОПКУ #play-icon =====
// =====================================

document.addEventListener("DOMContentLoaded", function() {

  // Кнопка (картинка внутри #play-icon)
  const playerBtn = document.querySelector("#play-icon img");

  // Аудио-файл (пока пустой, ты вставишь свой)
  const playerAudio = new Audio("https://bogsan007-oss.github.io/img-fonts-css/assets/Music/Piem_sa_Sashu.mp3");

  // Состояние плеера
  let playerPlaying = false;

  // Обработчик клика по кнопке
  playerBtn.addEventListener("click", function() {
console.log(playerBtn);

    if (!playerPlaying) {
      // Запуск музыки
      playerAudio.play();

      // Меняем картинку на паузу
      playerBtn.src = "https://bogsan007-oss.github.io/img-fonts-css/secret/img/2-p.webp";

      playerPlaying = true;

    } else {
      // Остановка музыки
      playerAudio.pause();

      // Меняем картинку на плей
      playerBtn.src = "https://bogsan007-oss.github.io/img-fonts-css/secret/img/3-p.webp";

      playerPlaying = false;
    }

  });

});
/* === ВИЗУАЛИЗАТОР ПОД МУЗЫКУ === */

const audio = document.getElementById('audio-player');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const source = audioCtx.createMediaElementSource(audio);

const analyser = audioCtx.createAnalyser();
analyser.fftSize = 64;

source.connect(analyser);
analyser.connect(audioCtx.destination);

const dataArray = new Uint8Array(analyser.frequencyBinCount);
const bars = document.querySelectorAll('#visualizer .bar');

function animateBars() {
    requestAnimationFrame(animateBars);
    analyser.getByteFrequencyData(dataArray);

    for (let i = 0; i < bars.length; i++) {
        const value = dataArray[i];
        bars[i].style.height = (value / 2) + 'px';
    }
}

audio.addEventListener('play', () => {
    audioCtx.resume();
    animateBars();
});

