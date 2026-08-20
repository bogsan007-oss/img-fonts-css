console.log("Минимальный мотор плеера загружен");

// === ЭЛЕМЕНТЫ ===
const playBtn   = document.getElementById("player-circle");
const playIcon  = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const audioEl   = document.getElementById("player");
const trackName = document.getElementById("current-track-name");
const leftBar  = document.querySelector('.left-bar');
const rightBar = document.querySelector('.right-bar');

// === СОСТОЯНИЕ ===
let isPlaying = false;

// === ПЛЕЙЛИСТ ===
const playlist = [
    { title: "Дворовый Воробей", src: "https://files.catbox.moe/wmwbx7.mp3" },
    { title: "Жара сжигает всё", src: "https://files.catbox.moe/ybtx66.mp3" },
    { title: "К Деду с пивом", src: "https://files.catbox.moe/2narmt.mp3" },
	{ title: "Вишнёвая серёжка", src: "https://files.catbox.moe/yzxy0t.mp3" },
	{ title: "Валиться из рук", src: "https://files.catbox.moe/pdtd7m.mp3" },
	{ title: "Загуляло лето, загуляло", src: "https://files.catbox.moe/2ufu06.mp3" },
	{ title: "Давление 200/120", src: "https://files.catbox.moe/0qlzvn.mp3" },
	{ title: "Стар капитан", src: "https://files.catbox.moe/3g0zuw.mp3" }
];

// === СТАВИМ ПЕРВЫЙ ТРЕК ПРИ ЗАГРУЗКЕ (ТОЛЬКО ДЛЯ НАЗВАНИЯ) ===
audioEl.src = playlist[0].src;
audioEl.muted = true;
trackName.textContent = playlist[0].title;

// === ВИЗУАЛИЗАТОР ===
const bars = document.querySelectorAll("#visualizer .bar");

// === ОБНУЛЕНИЕ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ===
bars.forEach(bar => bar.style.transform = "scaleY(0)");
leftBar.style.transform  = "scaleX(0)";
rightBar.style.transform = "scaleX(0)";

let audioCtx = null;
let analyser = null;
let sourceNode = null;
let decodedBuffer = null;

// === ОСТАНОВКА ПРЕДЫДУЩЕГО ПОТОКА ===
function stopPrevBuffer() {
    if (sourceNode) {
        try { sourceNode.stop(); } catch(e) {}
        sourceNode.disconnect();
        sourceNode = null;
    }

    // === ОБНУЛЕНИЕ ПРИ ОСТАНОВКЕ ===
    bars.forEach(bar => bar.style.transform = "scaleY(0)");
    leftBar.style.transform  = "scaleX(0)";
    rightBar.style.transform = "scaleX(0)";
}

// === ЗАГРУЗКА И ДЕКОДИРОВАНИЕ CATBOX ===
async function loadAndDecode(url) {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    stopPrevBuffer();

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    startVisualizerBuffer();
}

// === ЗАПУСК ВИЗУАЛИЗАТОРА И ЗВУКА ИЗ БУФЕРА ===
function startVisualizerBuffer() {
    stopPrevBuffer();

    sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = decodedBuffer;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    sourceNode.start(0);
}

// === АНИМАЦИЯ ===
function animateVisualizer() {
    requestAnimationFrame(animateVisualizer);

    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // === БОЛЬШОЙ ВЕРТИКАЛЬНЫЙ ===
    bars.forEach((bar, i) => {
        const value = dataArray[i] / 255;
        bar.style.transform = `scaleY(${value * 1.4})`;
    });

    // === МАЛЫЙ ГОРИЗОНТАЛЬНЫЙ ===
    const leftValue  = dataArray[5]  / 255;
    const rightValue = dataArray[15] / 255;

    leftBar.style.transform  = `scaleX(${Math.max(leftValue * 12, 0.4)})`;
    rightBar.style.transform = `scaleX(${Math.max(rightValue * 12, 0.4)})`;
}

animateVisualizer();

// === ПЕРЕКЛЮЧЕНИЕ ТРЕКА ===
const trackEls = document.querySelectorAll(".track");

trackEls.forEach(track => {
    track.addEventListener("click", () => {
        const index = parseInt(track.dataset.index, 10);
        const trackData = playlist[index];

        stopPrevBuffer();

        audioEl.src = trackData.src;
        trackName.textContent = trackData.title;

        isPlaying = true;
        playIcon.style.opacity  = 0;
        pauseIcon.style.opacity = 1;

        loadAndDecode(trackData.src);
    });
});

// === PLAY/PAUSE ===
playBtn.addEventListener("click", () => {

    if (!audioEl.src) {
        audioEl.src = playlist[0].src;
    }

    if (!isPlaying) {

        isPlaying = true;
        playIcon.style.opacity  = 0;
        pauseIcon.style.opacity = 1;

        loadAndDecode(audioEl.src);

    } else {

        isPlaying = false;
        playIcon.style.opacity  = 1;
        pauseIcon.style.opacity = 0;

        stopPrevBuffer(); // глушим звук
    }
});
