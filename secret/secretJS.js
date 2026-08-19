// === ГЛОБАЛЬНЫЙ ПЛЕЕР ===
const playerAudio = document.getElementById("player");
let playerPlaying = false;

// === ПЛЕЙЛИСТ ===
const playlist = [
  { title: "Трек 1", src: "https://files.catbox.moe/wmwbx7.mp3" },
  { title: "Трек 2", src: "https://files.catbox.moe/ybtx66.mp3" },
  { title: "Трек 3", src: "https://files.catbox.moe/2narmt.mp3" }
];

let currentTrack = 0;

// === ОДИН AudioContext ДЛЯ ВСЕГО ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 64;

const source = audioCtx.createMediaElementSource(playerAudio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

const freqData = new Uint8Array(analyser.frequencyBinCount);

// === ВИЗУАЛИЗАТОР PNG-БАРОВ ===
const bars = document.querySelectorAll('#visualizer .bar');

// === ДВУСТОРОННИЙ ВИЗУАЛИЗАТОР ===
const leftBar  = document.querySelector('.left-bar');
const rightBar = document.querySelector('.right-bar');

// === АНИМАЦИЯ ВСЕХ ВИЗУАЛИЗАТОРОВ ===
function animate() {
    requestAnimationFrame(animate);
    analyser.getByteFrequencyData(freqData);

    // --- PNG-бары ---
    for (let i = 0; i < bars.length; i++) {
        const val = freqData[i] / 255; // нормализуем 0..1
        bars[i].style.transform = `scaleY(${val})`;
    }

    // --- Двусторонний визуализатор ---
    let avg = 0;
    for (let i = 0; i < freqData.length; i++) avg += freqData[i];
    avg = avg / freqData.length;

    const width = avg / 6; // плавная ширина
    leftBar.style.width  = width + 'px';
    rightBar.style.width = width + 'px';
}

// === ПЛЕЙ/ПАУЗА ===
document.addEventListener("DOMContentLoaded", function() {

    const playerBtn = document.querySelector("#play-icon img");

    playerBtn.addEventListener("click", function() {
        if (!playerPlaying) {
            playerAudio.play();
            playerBtn.src = "https://bogsan007-oss.github.io/img-fonts-css/secret/img/2-p.webp";
            playerPlaying = true;
            audioCtx.resume();
        } else {
            playerAudio.pause();
            playerBtn.src = "https://bogsan007-oss.github.io/img-fonts-css/secret/img/3-p.webp";
            playerPlaying = false;
        }
    });

    animate(); // запускаем визуализацию один раз
});

// === ФУНКЦИЯ ПРОИГРЫВАНИЯ ТРЕКА ===
function playTrack(index) {
    currentTrack = index;
    playerAudio.src = playlist[index].src;
    playerAudio.load();
    playerAudio.play();
    audioCtx.resume();

    // Название трека
    const nameBox = document.getElementById('current-track-name');
    if (nameBox) nameBox.textContent = playlist[index].title;

    // Активный трек
    document.querySelectorAll('.track').forEach(t => t.classList.remove('active-track'));
    document.querySelector(`.track[data-index="${index}"]`).classList.add('active-track');
}

// === КЛИК ПО ПЛЕЙЛИСТУ ===
document.querySelectorAll('.track').forEach(track => {
    track.addEventListener('click', () => {
        const index = Number(track.dataset.index);
        playTrack(index);
    });
});

// === АВТОПЕРЕКЛЮЧЕНИЕ ===
playerAudio.addEventListener('ended', () => {
    currentTrack++;
    if (currentTrack >= playlist.length) currentTrack = 0;
    playTrack(currentTrack);
});
