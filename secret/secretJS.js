console.log("НОВЫЙ МОТОР ДЛЯ СЕКРЕТНОГО ПЛЕЕРА ЗАГРУЖЕН");

// === ЭЛЕМЕНТЫ ===
const playBtn     = document.getElementById("player-circle");
const playIcon    = document.getElementById("play-icon");
const audioEl     = document.getElementById("player");

const bars        = document.querySelectorAll("#visualizer .bar");
const leftBar     = document.querySelector("#dual-visualizer .left-bar");
const rightBar    = document.querySelector("#dual-visualizer .right-bar");

const playlistBox = document.querySelector(".playlist-box");
const playlistBtn = document.querySelector(".btn-playlist"); // теперь НЕ активная
const trackEls    = document.querySelectorAll(".track");

const trackNameEl = document.getElementById("current-track-name");

// === ПЛЕЙЛИСТ ===
const playlist = [
    { title: "Трек 1", src: "https://files.catbox.moe/wmwbx7.mp3", local: false },
    { title: "Трек 2", src: "https://files.catbox.moe/ybtx66.mp3", local: false },
    { title: "Трек 3", src: "https://files.catbox.moe/2narmt.mp3", local: false }
];

let currentTrack = 0;

// === СОСТОЯНИЕ ===
let mode = "playlist";
let isPlaying = false;
let userPaused = false;

// === WEB AUDIO ===
let audioCtx = null;
let analyser = null;
let sourceNode = null;
let catboxBuffer = null;
let catboxPausedAt = 0;

// === ИНИЦИАЛИЗАЦИЯ ЭКВАЛАЙЗЕРА ДЛЯ ЛОКАЛЬНЫХ MP3 ===
function initEqForLocalMp3() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const src = audioCtx.createMediaElementSource(audioEl);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    src.connect(analyser);
    analyser.connect(audioCtx.destination);
}

// === CATBOX MP3 ===
async function initEqForCatbox(url) {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    catboxBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    playCatboxBuffer();
}

function playCatboxBuffer() {
    if (sourceNode) sourceNode.disconnect();

    sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = catboxBuffer;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    const offset = userPaused ? catboxPausedAt : 0;
    userPaused = false;

    sourceNode.start(0, offset);

    attachCatboxEndHandler();
}

// === ПАУЗА CATBOX ===
function pauseCatbox() {
    if (!sourceNode) return;

    userPaused = true;
    catboxPausedAt = audioCtx.currentTime;

    try { sourceNode.stop(); } catch(e) {}
    sourceNode.disconnect();
    sourceNode = null;
}

// === АНИМАЦИЯ ОСНОВНОГО ВИЗУАЛИЗАТОРА ===
function animateEq() {
    requestAnimationFrame(animateEq);

    if (!analyser || mode !== "playlist") return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    bars.forEach((bar, i) => {
        bar.style.transform = `scaleY(${(dataArray[i] / 255) * 1.2})`;
    });

    // двойной визуализатор
    if (leftBar && rightBar) {
        const L = dataArray[5] / 255;
        const R = dataArray[15] / 255;

        leftBar.style.transform  = `scaleY(${L})`;
        rightBar.style.transform = `scaleY(${R})`;
    }
}
animateEq();

// === MP3 ===
async function playMp3(index) {
    mode = "playlist";
    currentTrack = index;
    userPaused = false;

    const track = playlist[currentTrack];

    trackNameEl.textContent = track.title;

    if (track.local) {
        audioEl.src = track.src;
        audioEl.play();
        initEqForLocalMp3();

        isPlaying = true;
        playIcon.style.opacity = 0;
        return;
    }

    audioEl.pause();
    catboxPausedAt = 0;
    await initEqForCatbox(track.src);

    isPlaying = true;
    playIcon.style.opacity = 0;
}

// === PLAY/PAUSE ===
playBtn.addEventListener("click", async () => {

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === "suspended") {
        await audioCtx.resume();
    }

    // === CATBOX ===
    if (mode === "playlist" && !playlist[currentTrack].local) {

        if (!isPlaying) {
            userPaused = false;
            playCatboxBuffer();
            isPlaying = true;
            playIcon.style.opacity = 0;

        } else {
            pauseCatbox();
            isPlaying = false;
            playIcon.style.opacity = 1;
        }

        return;
    }

    // === Обычные MP3 ===
    if (!isPlaying) {
        userPaused = false;
        audioEl.play();
        isPlaying = true;
        playIcon.style.opacity = 0;

    } else {
        userPaused = true;
        audioEl.pause();
        isPlaying = false;
        playIcon.style.opacity = 1;
    }
});

// === КЛИК ПО ТРЕКУ ===
trackEls.forEach(track => {
    track.addEventListener("click", () => {
        const index = parseInt(track.dataset.index, 10);
        playMp3(index);
    });
});

// === ОТКЛЮЧЕНО: ПЛЕЙЛИСТ НЕ ВЫЕЗЖАЕТ И НЕ СКРЫВАЕТСЯ ===
// playlistBtn.addEventListener("click", () => {
//     playlistBox.classList.toggle("open");
// });

// === АВТОПЕРЕХОД ДЛЯ ОБЫЧНЫХ MP3 ===
audioEl.addEventListener("ended", () => {
    if (mode === "playlist" && !userPaused) {
        playNextTrack();
    }
});

// === АВТОПЕРЕХОД ДЛЯ CATBOX ===
function attachCatboxEndHandler() {
    if (sourceNode) {
        sourceNode.onended = () => {
            if (mode === "playlist" && !userPaused) {
                playNextTrack();
            }
        };
    }
}

// === СЛЕДУЮЩИЙ ТРЕК ===
function playNextTrack() {
    currentTrack++;

    if (currentTrack >= playlist.length) {
        currentTrack = 0;
    }

    playMp3(currentTrack);
}
