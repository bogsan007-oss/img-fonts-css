console.log("JS загружен!");

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

// === AudioContext создаём ТОЛЬКО после клика ===
let audioCtx = null;
let analyser = null;
let freqData = null;

function startAudioEngine() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;

        const source = audioCtx.createMediaElementSource(playerAudio);
        source.connect(analyser);
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

    playerBtn.addEventListener("click", function() {

        startAudioEngine();

        if (!playerPlaying) {
            playerAudio.play();
            playerBtn.src = "https://bogsan007-oss.github.io/img-fonts-css/secret/img/2-p.webp";
            playerPlaying = true;
            if (audioCtx) audioCtx.resume();
        } else {
            playerAudio.pause();
            playerBtn.src = "https://bogsan007-oss.github.io/img-fonts-css/secret/img/3-p.webp";
            playerPlaying = false;
        }
    });

    document.querySelectorAll('.track').forEach(track => {
        track.addEventListener('click', () => {
            const index = Number(track.dataset.index);
            playTrack(index);
        });
    });

});

// === ПРОИГРЫВАНИЕ ТРЕКА ===
function playTrack(index) {

    currentTrack = index;
    playerAudio.src = playlist[index].src;
    playerAudio.play();   // load() УБРАНО

    if (audioCtx) audioCtx.resume();

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
