console.log("НОВЫЙ МОТОР ЗАГРУЖЕН");

// === ЭЛЕМЕНТЫ ===
const btn        = document.querySelector(".player-btn");
const icon       = document.getElementById("player-icon");
const audioEl    = document.getElementById("radio-audio");

const bars  = document.querySelectorAll(".eq-bar");
const barsH = document.querySelectorAll(".eq-bar-h");

const playlistEl = document.querySelector(".playlist");

// === КНОПКИ РАДИО ===
const shansonBtn = document.querySelector(".SHanson-btn");
const rodnixBtn  = document.querySelector(".rodnix_dorog-btn");
const novoeBtn   = document.querySelector(".novoe_radio-btn");
const avtoradioBtn   = document.querySelector(".avtoradio-btn");

// === ПЛЕЙЛИСТ ===
const playlist = [
    { title: "Трек 1", src: "https://files.catbox.moe/wmwbx7.mp3", local: false},
    { title: "Трек 2", src: "https://files.catbox.moe/ybtx66.mp3", local: false},
    { title: "Трек 3", src: "https://files.catbox.moe/2narmt.mp3", local: false}
];

let currentTrack = 0;

// === РАДИОСТАНЦИИ ===
const radioStations = [
    "https://chanson.hostingradio.ru:8041/chanson256.mp3",   // 0 — Шансон
    "https://stream1.radiord.ru:8000/live128.mp3?e5f1",      // 1 — Родных дорог
    "https://stream.newradio.ru/novoe96.aacp?9167",           // 2 — Новое радио
	"https://pub0201.101.ru/stream/air/aac/64/100?7b4b6666"   // 3 - Авто радио
];

let currentRadio = 0;

// === СОСТОЯНИЕ ===
let mode = "playlist";
let isPlaying = false;

// === WEB AUDIO ===
let audioCtx = null;
let analyser = null;
let sourceNode = null;
let catboxBuffer = null;

// === ФЛАГ ПАУЗЫ (главное исправление)
let userPaused = false;

// === ЭКВАЛАЙЗЕР ДЛЯ ЛОКАЛЬНЫХ MP3 ===
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

// === ЭКВАЛАЙЗЕР ДЛЯ CATBOX MP3 ===
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

    // если трек был на паузе — продолжаем с места остановки
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

// === АНИМАЦИЯ ЭКВАЛАЙЗЕРА ===
function animateEq() {
    requestAnimationFrame(animateEq);

    if (!analyser || mode !== "playlist") return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    bars.forEach((bar, i) => {
        bar.style.height = (dataArray[i] / 255) * 80 + "px";
    });

    barsH.forEach((bar, i) => {
        bar.style.transform = `scaleX(${dataArray[i] / 255})`;
    });
}
animateEq();

// === ВИЗУАЛИЗАТОР РАДИО ===
let visualEqActive = false;

function startVisualEq() {
    visualEqActive = true;

    function animate() {
        if (!visualEqActive) return;

        if (!isPlaying || mode !== "radio") {
            bars.forEach(bar => bar.style.height = "0px");
            barsH.forEach(bar => bar.style.transform = "scaleX(0)");
            requestAnimationFrame(animate);
            return;
        }

        bars.forEach((bar, i) => {
            let h;
            if (i < 5) h = 15 + Math.random() * 15;
            else if (i < 10) h = 10 + Math.random() * 20;
            else h = 5 + Math.random() * 10;

            bar.style.height = h + "px";
        });

        barsH.forEach((bar, i) => {
            const scale = 0.4 + Math.random() * 0.6;
            bar.style.transform = `scaleX(${scale})`;
        });

        setTimeout(() => requestAnimationFrame(animate), 80);
    }

    animate();
}

function stopVisualEq() {
    visualEqActive = false;

    bars.forEach(bar => bar.style.height = "0px");
    barsH.forEach(bar => bar.style.transform = "scaleX(0)");
}

// === MP3 ===
async function playMp3(index) {
    mode = "playlist";
    currentTrack = index;
    userPaused = false;

    const track = playlist[currentTrack];

    stopVisualEq();

    if (track.local) {
        audioEl.src = track.src;
        audioEl.play();
        initEqForLocalMp3();

        isPlaying = true;
        icon.src = "img/2-p.png";
        icon.classList.add("pause-icon");
        return;
    }

    audioEl.pause();
    catboxPausedAt = 0;
    await initEqForCatbox(track.src);

    isPlaying = true;
    icon.src = "img/2-p.png";
    icon.classList.add("pause-icon");
}

// === РАДИО ===
function playRadio(index) {
    mode = "radio";
    currentRadio = index;

    audioEl.src = radioStations[currentRadio];
    audioEl.play();

    analyser = null;
    startVisualEq();

    isPlaying = true;
    icon.src = "img/2-p.png";
    icon.classList.add("pause-icon");
}
// === PLAY/PAUSE ===
btn.addEventListener("click", async () => {

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === "suspended") {
        await audioCtx.resume();
    }

    // === ПЛЕЙЛИСТ CATBOX ===
    if (mode === "playlist" && !playlist[currentTrack].local) {

        if (!isPlaying) {
            // запуск
            userPaused = false;
            playCatboxBuffer();
            isPlaying = true;

            icon.src = "img/2-p.png";
            icon.classList.add("pause-icon");

        } else {
            // пауза
            pauseCatbox();
            isPlaying = false;

            icon.src = "img/3-p.png";
            icon.classList.remove("pause-icon");
        }

        return;
    }

    // === ПЛЕЙЛИСТ обычные MP3 ===
    if (!isPlaying) {
        userPaused = false;
        audioEl.play();
        isPlaying = true;

        icon.src = "img/2-p.png";
        icon.classList.add("pause-icon");

    } else {
        userPaused = true;
        audioEl.pause();
        isPlaying = false;

        icon.src = "img/3-p.png";
        icon.classList.remove("pause-icon");
    }
});

// === КЛИК ПО ТРЕКУ ===
playlistEl.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    const index = parseInt(li.dataset.index, 10);
    playMp3(index);
});

// === КНОПКИ РАДИО ===
if (shansonBtn) {
    shansonBtn.addEventListener("click", () => {
        playRadio(0);
    });
}

if (rodnixBtn) {
    rodnixBtn.addEventListener("click", () => {
        playRadio(1);
    });
}

if (novoeBtn) {
    novoeBtn.addEventListener("click", () => {
        playRadio(2);
    });
}

if (avtoradioBtn) {
    avtoradioBtn.addEventListener("click", () => {
        playRadio(3);
    });
}

// === КНОПКА ВЫДВИЖЕНИЯ ПЛЕЙЛИСТА ===
const playlistToggle = document.querySelector(".btm_playlist");

if (playlistToggle) {
    playlistToggle.addEventListener("click", () => {
        document.querySelector(".playlist").classList.toggle("open");
    });
}

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

// === ФУНКЦИЯ ПЕРЕХОДА НА СЛЕДУЮЩИЙ ТРЕК ===
function playNextTrack() {
    currentTrack++;

    if (currentTrack >= playlist.length) {
        currentTrack = 0;
    }

    playMp3(currentTrack);
}
