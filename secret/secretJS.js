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
      bars[i].style.height = (dataArray[i] / 4) + 'px';
    }
  }

  playerAudio.addEventListener('play', () => {
    audioCtx.resume();
    animateBars();
  });
/* === ДВУСТОРОННИЙ ВИЗУАЛИЗАТОР === */

const leftBar  = document.querySelector('.left-bar');
const rightBar = document.querySelector('.right-bar');

const audioCtx2 = new (window.AudioContext || window.webkitAudioContext)();
const analyser2 = audioCtx2.createAnalyser();
analyser2.fftSize = 64;

const source2 = audioCtx2.createMediaElementSource(playerAudio);
source2.connect(analyser2);
analyser2.connect(audioCtx2.destination);

const freqData = new Uint8Array(analyser2.frequencyBinCount);

function animateDual() {
    requestAnimationFrame(animateDual);
    analyser2.getByteFrequencyData(freqData);

    // Берём среднюю частоту — она даёт ровный "дыхательный" эффект
    let avg = 0;
    for (let i = 0; i < freqData.length; i++) avg += freqData[i];
    avg = avg / freqData.length;

    // Уменьшаем амплитуду (делим на 3)
    const width = avg / 8;

    leftBar.style.width  = width + 'px';
    rightBar.style.width = width + 'px';
}

playerAudio.addEventListener('play', () => {
    audioCtx2.resume();
    animateDual();
});

});
// === ПЛЕЙЛИСТ ===
const playlist = [
    { title: "Трек 1", src: "https://files.catbox.moe/wmwbx7.mp3", local: false },
    { title: "Трек 2", src: "https://files.catbox.moe/ybtx66.mp3", local: false },
    { title: "Трек 3", src: "https://files.catbox.moe/2narmt.mp3", local: false }
];

let currentTrack = 0;

// === АУДИО-ПЛЕЕР ===
const audio = document.querySelector('#player'); // <audio id="player"></audio>

// === ФУНКЦИЯ ПРОИГРЫВАНИЯ ТРЕКА ===
function playTrack(index) {
    currentTrack = index;
    audio.src = playlist[index].src;
    audio.play();

    // подсветка активного трека (если нужно)
    document.querySelectorAll('.track').forEach(t => t.classList.remove('active-track'));
    document.querySelector(`.track[data-index="${index}"]`).classList.add('active-track');
}

// === КЛИК ПО СТРОКЕ ТРЕКА ===
document.querySelectorAll('.track').forEach(track => {
    track.addEventListener('click', () => {
        const index = Number(track.dataset.index);
        playTrack(index);
    });
});

// === АВТОПЕРЕХОД НА СЛЕДУЮЩИЙ ТРЕК ===
audio.addEventListener('ended', () => {
    currentTrack++;
    if (currentTrack >= playlist.length) currentTrack = 0;
    playTrack(currentTrack);
});

