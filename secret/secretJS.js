console.log("JS загружен!");

// === ГЛОБАЛЬНЫЙ ПЛЕЕР ===
const playerAudio = document.getElementById("player");
let playerPlaying = false;

// === ПЛЕЙЛИСТ ===
const playlist = [
  { title: "Трек 1", src: "https://raw.githubusercontent.com/bogsan007-oss/img-fonts-css/main/assets/Music/Piem_sa_Sashu.mp3" },
  { title: "Трек 2", src: "https://files.catbox.moe/ybtx66.mp3" },
  { title: "Трек 3", src: "https://files.catbox.moe/2narmt.mp3" }
];

let currentTrack = 0;

// === AudioContext ===
let audioCtx = null;
let analyser = null;
let freqData = null;
let sourceNode = null;

function initAudioEngine() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;

        sourceNode = audioCtx.createMediaElementSource(playerAudio);

        // ПОДКЛЮЧАЕМ ПРАВИЛЬНО
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);

        freqData = new Uint8Array(analyser.frequencyBinCount);

        animate();
    }
}

// === ВИЗУАЛИЗАТОРЫ ===
const bars = document.querySelectorAll('#visualizer .bar');
const leftBar  = document.querySelector('.left-bar');
const rightBar = document.querySelector('.right-bar');

// === АНИМАЦИЯ ===
function animate() {
    requestAnimationFrame(animate);
    if (!analyser) return;

    analyser.getByteFrequencyData(freqData);

    for (let i = 0; i < bars.length; i++) {
        const val = freqData[i] / 255;
        bars[i].style.transform = `scaleY(${val})`;
    }

    let avg = 0;
    for (let i = 0; i < freqData.length; i++) avg += freqData[i];
    avg = avg / freqData.length;

    const width = avg / 6;
    leftBar.style.width  = width + 'px';
    rightBar.style.width = width + 'px';
}

// === ПРИ ЗАГРУЗКЕ СТРАНИЦЫ — СТАВИМ ПЕРВЫЙ ТРЕК ===
document.addEventListener("DOMContentLoaded", function() {

    currentTrack = 0;
    playerAudio.src = playlist[0].src;

    const nameBox = document.getElementById('current-track-name');
    if (nameBox) nameBox.textContent = playlist[0].title;

    const playerBtn = document.querySelector("#play-icon img");

    // === КНОПКА PLAY ===
    playerBtn.addEventListener("click", function() {

        initAudioEngine(); // ← запуск движка

        if (!playerPlaying) {
            audioCtx.resume();
            playerAudio.play();

            playerBtn.src = "https://bogsan007-oss.github.io/img-fonts-css/secret/img/2-p.webp";
            playerPlaying = true;
        } else {
            playerAudio.pause();
            playerBtn.src = "https://bogsan007-oss.github.io/img-fonts-css/secret/img/3-p.webp";
            playerPlaying = false;
        }
    });

    // === КЛИК ПО ТРЕКАМ ===
    document.querySelectorAll('.track').forEach(track => {
        track.addEventListener('click', () => {
            const index = Number(track.dataset.index);
            playTrack(index);
        });
    });

});

// === ПРОИГРЫВАНИЕ ТРЕКА ===
function playTrack(index) {

    initAudioEngine(); // ← движок запускается при клике

    currentTrack = index;
    playerAudio.src = playlist[index].src;

    audioCtx.resume();
    playerAudio.play();

    const nameBox = document.getElementById('current-track-name');
    if (nameBox) nameBox.textContent = playlist[index].title;

    document.querySelectorAll('.track').forEach(t => t.classList.remove('active-track'));
    document.querySelector(`.track[data-index="${index}"]`).classList.add('active-track');

    const playerBtn = document.querySelector("#play-icon img");
    playerBtn.src = "https://bogsan007-oss.github.io/img-fonts-css/secret/img/2-p.webp";
    playerPlaying = true;
}

// === АВТОПЕРЕКЛЮЧЕНИЕ ===
playerAudio.addEventListener('ended', () => {
    currentTrack++;
    if (currentTrack >= playlist.length) currentTrack = 0;
    playTrack(currentTrack);
});
