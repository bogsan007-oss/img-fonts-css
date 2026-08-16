// =====================================
// === SCRIPT: PLAYER MAIN (Плей/Пауза) ===
// =====================================

document.addEventListener("DOMContentLoaded", function() {

  // Кнопка
  const playerBtn = document.querySelector("#play-icon img");

  // Аудио-файл
  const playerAudio = new Audio("https://bogsan007-oss.github.io/img-fonts-css/assets/Music/Piem_sa_Sashu.mp3");

  let playerPlaying = false;

  playerBtn.addEventListener("click", function() {

    if (!playerPlaying) {
      playerAudio.play();
      playerBtn.src = "https://bogsan007-oss.github.io/img-fonts-css/secret/img/2-p.webp";
      playerPlaying = true;

    } else {
      playerAudio.pause();
      playerBtn.src = "https://bogsan007-oss.github.io/img-fonts-css/secret/img/3-p.webp";
      playerPlaying = false;
    }

  });


  /* === ВИЗУАЛИЗАТОР ПОД МУЗЫКУ === */

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 64;

  const source = audioCtx.createMediaElementSource(playerAudio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  const bars = document.querySelectorAll('#visualizer .bar');

  function animateBars() {
    requestAnimationFrame(animateBars);
    analyser.getByteFrequencyData(dataArray);

    for (let i = 0; i < bars.length; i++) {
      bars[i].style.height = (dataArray[i] / 2) + 'px';
    }
  }

  playerAudio.addEventListener('play', () => {
    audioCtx.resume();
    animateBars();
  });

});
