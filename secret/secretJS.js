console.log("Минимальный мотор плеера с радио загружен");

// === ЭЛЕМЕНТЫ ===
const playBtn   = document.getElementById("player-circle");
const playIcon  = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const audioEl   = document.getElementById("player");
const trackName = document.getElementById("current-track-name");
const leftBar  = document.querySelector('.left-bar');
const rightBar = document.querySelector('.right-bar');

const radioBox   = document.getElementById("radio-box");
const radioBtns  = radioBox ? radioBox.querySelectorAll(".radio-btn") : [];

// === СОСТОЯНИЕ ===
let isPlaying = false;
let currentTrackIndex = 0;
let isRadioMode = false; // ★ режим радио

// === ПЛЕЙЛИСТ ТРЕКОВ ===
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

// === РАДИОСТАНЦИИ (временные ссылки, потом заменишь) ===
const radioStations = [
    { name: "Русское волна",        src: "https://ru1.amgradio.ru/RuWave48?7aa4" },
    { name: "Новое радио",          src: "https://stream.newradio.ru/novoe96.aacp?9167" },
    { name: "Авторадио",            src: "https://pub0201.101.ru/stream/air/aac/64/100?7b4b6666" },
    { name: "Радио Родных Дорог",   src: "https://stream1.radiord.ru:8000/live128.mp3?e5f1" },
    { name: "Шансон",               src: "https://chanson.hostingradio.ru:8041/chanson256.mp3" }
];

// === СТАВИМ ПЕРВЫЙ ТРЕК ===
audioEl.src = playlist[0].src;
audioEl.muted = true;
trackName.textContent = playlist[0].title;

// === ВИЗУАЛИЗАТОР ===
const bars = document.querySelectorAll("#visualizer .bar");

// === ОБНУЛЕНИЕ ===
bars.forEach(bar => bar.style.transform = "scaleY(0)");
leftBar.style.transform  = "scaleX(0)";
rightBar.style.transform = "scaleX(0)";

let audioCtx = null;
let analyser = null;
let sourceNode = null;
let decodedBuffer = null;

// === ОСТАНОВКА ПРЕДЫДУЩЕГО ПОТОКА ТРЕКА ===
function stopPrevBuffer() {
    if (sourceNode) {
        try { sourceNode.stop(); } catch(e) {}
        sourceNode.disconnect();
        sourceNode = null;
    }

    bars.forEach(bar => bar.style.transform = "scaleY(0)");
    leftBar.style.transform  = "scaleX(0)";
    rightBar.style.transform = "scaleX(0)";
}

// === АВТОПЕРЕХОД НА СЛЕДУЮЩИЙ ТРЕК ===
function nextTrack() {
    currentTrackIndex++;

    if (currentTrackIndex >= playlist.length) {
        currentTrackIndex = 0;

        // треки кончились — останавливаемся
        isPlaying = false;
        playIcon.style.opacity  = 1;
        pauseIcon.style.opacity = 0;

        stopPrevBuffer();
        return;
    }

    const trackData = playlist[currentTrackIndex];
    trackName.textContent = trackData.title;

    loadAndDecode(trackData.src);
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

// === ЗАПУСК ВИЗУАЛИЗАТОРА И ЗВУКА ДЛЯ ТРЕКА ===
function startVisualizerBuffer() {
    stopPrevBuffer();

    sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = decodedBuffer;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    sourceNode.start(0);

    sourceNode.onended = () => {
        if (isPlaying && !isRadioMode) {
            nextTrack();
        }
    };
}

// === АНИМАЦИЯ ВИЗУАЛИЗАТОРА ===
function animateVisualizer() {
    requestAnimationFrame(animateVisualizer);

    // режим радио → случайный визуализатор
    if (isRadioMode) {

    // обновляем значения только раз в 100 мс
    if (!window.lastFakeUpdate || Date.now() - window.lastFakeUpdate > 100) {
        window.lastFakeUpdate = Date.now();

        window.fakeData = new Uint8Array(bars.length);
        for (let i = 0; i < window.fakeData.length; i++) {
            window.fakeData[i] = Math.floor(Math.random() * 256);
        }
    }

    const fakeData = window.fakeData;


        bars.forEach((bar, i) => {
            const value = fakeData[i] / 255;
            bar.style.transform = `scaleY(${value * 0.8})`;
        });

        const leftValue  = fakeData[5]  / 255;
        const rightValue = fakeData[15] / 255;

        leftBar.style.transform  = `scaleX(${Math.max(leftValue * 12, 0.4)})`;
        rightBar.style.transform = `scaleX(${Math.max(rightValue * 12, 0.4)})`;

        return;
    }

    // обычный режим треков
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    bars.forEach((bar, i) => {
        const value = dataArray[i] / 255;
        bar.style.transform = `scaleY(${value * 1.4})`;
    });

    const leftValue  = dataArray[5]  / 255;
    const rightValue = dataArray[15] / 255;

    leftBar.style.transform  = `scaleX(${Math.max(leftValue * 12, 0.4)})`;
    rightBar.style.transform = `scaleX(${Math.max(rightValue * 12, 0.4)})`;
}

animateVisualizer();

// === ПЕРЕКЛЮЧЕНИЕ ТРЕКА ПО КЛИКУ ===
const trackEls = document.querySelectorAll(".track");

trackEls.forEach(track => {
    track.addEventListener("click", () => {
        // если играло радио — выключаем
        if (isRadioMode) {
            isRadioMode = false;
            audioEl.pause();
        }

        currentTrackIndex = parseInt(track.dataset.index, 10);

        const trackData = playlist[currentTrackIndex];

        stopPrevBuffer();

        audioEl.src = trackData.src;
        trackName.textContent = trackData.title;

        isPlaying = true;
        playIcon.style.opacity  = 0;
        pauseIcon.style.opacity = 1;

        loadAndDecode(trackData.src);
    });
});

// === ВКЛЮЧЕНИЕ РАДИО ПО КЛИКУ НА КАРТИНКУ ===
radioBtns.forEach((btn, index) => {
    btn.addEventListener("click", () => {
        const station = radioStations[index];
        if (!station) return;

        // выключаем трековый WebAudio
        isRadioMode = true;
        stopPrevBuffer();

        // включаем радио через обычный audio
        audioEl.src = station.src;
        audioEl.muted = false;
        audioEl.play().catch(() => {});

        trackName.textContent = station.name;

        isPlaying = true;
        playIcon.style.opacity  = 0;
        pauseIcon.style.opacity = 1;
    });
});

// === PLAY/PAUSE ===
playBtn.addEventListener("click", () => {

    if (!audioEl.src) {
        audioEl.src = playlist[0].src;
    }

    // если сейчас радио
    if (isRadioMode) {
        if (!isPlaying) {
            isPlaying = true;
            playIcon.style.opacity  = 0;
            pauseIcon.style.opacity = 1;
            audioEl.play().catch(() => {});
        } else {
            isPlaying = false;
            playIcon.style.opacity  = 1;
            pauseIcon.style.opacity = 0;
            audioEl.pause();
        }
        return;
    }

    // обычный режим треков
    if (!isPlaying) {

        isPlaying = true;
        playIcon.style.opacity  = 0;
        pauseIcon.style.opacity = 1;

        loadAndDecode(audioEl.src);

    } else {

        isPlaying = false;
        playIcon.style.opacity  = 1;
        pauseIcon.style.opacity = 0;

        stopPrevBuffer();
    }
});
