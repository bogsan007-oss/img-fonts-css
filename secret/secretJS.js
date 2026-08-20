console.log("Минимальный мотор плеера загружен");

// === ЭЛЕМЕНТЫ ===
const playBtn   = document.getElementById("player-circle");
const playIcon  = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const audioEl   = document.getElementById("player");
const trackName = document.getElementById("current-track-name");

// === ОДИН ТРЕК ДЛЯ ТЕСТА ===
const testTrack = {
    title: "Тестовый трек",
    src: "https://files.catbox.moe/wmwbx7.mp3"
};

// === УСТАНАВЛИВАЕМ НАЗВАНИЕ ТРЕКА ПРИ ЗАГРУЗКЕ ===
trackName.textContent = testTrack.title;

// === СОСТОЯНИЕ ===
let isPlaying = false;

// === PLAY/PAUSE ===
playBtn.addEventListener("click", () => {

    // если трек ещё не установлен — ставим
    if (!audioEl.src) {
        audioEl.src = testTrack.src;
    }

    if (!isPlaying) {
        audioEl.play();
        isPlaying = true;

        playIcon.style.opacity  = 0;
        pauseIcon.style.opacity = 1;

    } else {
        audioEl.pause();
        isPlaying = false;

        playIcon.style.opacity  = 1;
        pauseIcon.style.opacity = 0;
    }
});
