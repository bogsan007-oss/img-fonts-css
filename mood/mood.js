// === АУДИО И ПЕРЕМЕННЫЕ АНАЛИЗАТОРА ===
let audioContext = null;
let analyser = null;
let dataArray = null;
let audioBuffer = null;
let sourceNode = null;
let startTime = 0;
let pauseOffset = 0;
let isPlaying = false;

function hidePlayer() {
    stopBuffer();
    const playerBlock = document.getElementById("player-block");
    if (playerBlock) playerBlock.style.display = "none";
}

// === ДОМ-ЗАГРУЗЧИК И ОСНОВНАЯ ЛОГИКА ===
document.addEventListener("DOMContentLoaded", function () {

    // === БАЗА ТРЕКОВ ===
    const trackDatabase = {
       "Стресс": {
            title: "Warm Healing Pad",
            url: "https://ded-brodiaga.github.io/music/Pills/WarmHealingPad.mp3"
        },
        "Мягкий стресс": {
            title: "Warm Healing Pad",
            url: "https://ded-brodiaga.github.io/music/Pills/WarmHealingPad.mp3"
        },
        "Средний стресс": {
            title: "Calm Safe Soundscape",
            url: "https://ded-brodiaga.github.io/music/Pills/Calm%20Safe%20Soundscape.mp3"
        },
        "Сильный стресс": {
            title: "Serenidad Profunda",
            url: "https://ded-brodiaga.github.io/music/Pills/Serenidad%20Profunda.mp3"
        },
		"Усталость": {
            title: "Warm Rest",
            url: "https://ded-brodiaga.github.io/music/Pills/Warm%20Rest.mp3"
        },
        "Лёгкая усталость": {
            title: "Warm Rest",
            url: "https://ded-brodiaga.github.io/music/Pills/Warm%20Rest.mp3"
        },
        "Сильная усталость": {
            title: "Recuperación Suave",
            url: "https://ded-brodiaga.github.io/music/Pills/Recuperaci%C3%B3n%20Suave.mp3"
        },
        "Опустошение": {
            title: "Warm Sustained Drones",
            url: "https://ded-brodiaga.github.io/music/Pills/Warm%20Sustained%20Drones.mp3"
        },
		"Тревога": {
            title: "Warm Analog Pads",
            url: "https://ded-brodiaga.github.io/music/Pills/Warm%20Analog%20Pads.mp3"
        },
        "Лёгкая тревога": {
            title: "Warm Analog Pads",
            url: "https://ded-brodiaga.github.io/music/Pills/Warm%20Analog%20Pads.mp3"
        },
        "Средняя тревога": {
            title: "Warm Analog Pulse",
            url: "https://ded-brodiaga.github.io/music/Pills/Warm%20Analog%20Pulse.mp3"
        },
        "Сильная тревога": {
            title: "Serenidad Profunda",
            url: "https://ded-brodiaga.github.io/music/Pills/Serenidad%20Profunda.mp3"
        },
		"Бессонница": {
            title: "Slow Breathing",
            url: "https://ded-brodiaga.github.io/music/Pills/Slow%20Breathing.mp3"
        },
        "Лёгкая бессонница": {
            title: "Slow Breathing",
            url: "https://ded-brodiaga.github.io/music/Pills/Slow%20Breathing.mp3"
        },
        "Мысли мешают": {
            title: "Deep Sleep Drift",
            url: "https://ded-brodiaga.github.io/music/Pills/Deep%20Sleep%20Drift.mp3"
        },
        "Ночная тревога": {
            title: "Stillness in the Air",
            url: "https://ded-brodiaga.github.io/music/Pills/Stillness%20in%20the%20Air.mp3"
        },
		"Печаль": {
            title: "Safe and Comforting",
            url: "https://ded-brodiaga.github.io/music/Pills/Safe%20and%20Comforting.mp3"
        },
        "Одиночество в печали": {
            title: "Safe and Comforting",
            url: "https://ded-brodiaga.github.io/music/Pills/Safe%20and%20Comforting.mp3"
        },
        "Тихая грусть": {
            title: "Calm Reassurance",
            url: "https://ded-brodiaga.github.io/music/Pills/Calm%20Reassurance.mp3"
        },
        "Тяжёлая печаль": {
            title: "Warmth in the Waves",
            url: "https://ded-brodiaga.github.io/music/Pills/Warmth%20in%20the%20Waves.mp3"
        },
		"Одиночество": {
            title: "Safe Haven",
            url: "https://ded-brodiaga.github.io/music/Pills/Safe%20Haven.mp3"
        },
        "Лёгкое одиночество": {
            title: "Safe Haven",
            url: "https://ded-brodiaga.github.io/music/Pills/Safe%20Haven.mp3"
        },
        "Одиночество + тревога": {
            title: "Grounding Waves",
            url: "https://ded-brodiaga.github.io/music/Pills/Grounding%20Waves.mp3"
        },
        "Глубокое одиночество": {
            title: "Healing Atmosphere",
            url: "https://ded-brodiaga.github.io/music/Pills/Healing%20Atmosphere.mp3"
        },
		"Внутреннее напряжение": {
            title: "Tranquil Waves",
            url: "https://ded-brodiaga.github.io/music/Pills/Tranquil%20Waves.mp3"
        },
        "Лёгкое напряжение": {
            title: "Tranquil Waves",
            url: "https://ded-brodiaga.github.io/music/Pills/Tranquil%20Waves.mp3"
        },
        "Среднее напряжение": {
            title: "Gradual Swells",
            url: "https://ded-brodiaga.github.io/music/Pills/Gradual%20Swells.mp3"
        },
        "Сильное напряжение": {
            title: "Meditative Grounding",
            url: "https://ded-brodiaga.github.io/music/Pills/Meditative%20Grounding.mp3"
        },
		"Потеря мотивации": {
            title: "Cozy Uplift",
            url: "https://ded-brodiaga.github.io/music/Pills/Cozy%20Uplift.mp3"
        },
        "Лёгкая апатия": {
            title: "Cozy Uplift",
            url: "https://ded-brodiaga.github.io/music/Pills/Cozy%20Uplift.mp3"
        },
        "Средняя апатия": {
            title: "Warm Sustained Drones",
            url: "https://ded-brodiaga.github.io/music/Pills/Warm%20Sustained%20Drones.mp3"
        },
        "Глубокая апатия": {
            title: "Safe Grounded",
            url: "https://ded-brodiaga.github.io/music/Pills/Safe%20Grounded.mp3"
        },
		"Эмоциональная пустота": {
            title: "Warm Analog Pads",
            url: "https://ded-brodiaga.github.io/music/Pills/Warm%20Analog%20Pads.mp3"
        },
        "Лёгкая пустота": {
            title: "Warm Analog Pads",
            url: "https://ded-brodiaga.github.io/music/Pills/Warm%20Analog%20Pads.mp3"
        },
        "Средняя пустота": {
            title: "Suspended Warmth",
            url: "https://ded-brodiaga.github.io/music/Pills/Suspended%20Warmth.mp3"
        },
        "Глубокая пустота": {
            title: "Gradual Healing",
            url: "https://ded-brodiaga.github.io/music/Pills/Gradual%20Healing.mp3"
        },
		"Переутомление": {
            title: "Cozy Analog Pads",
            url: "https://ded-brodiaga.github.io/music/Pills/Cozy%20Analog%20Pads.mp3"
        },
        "Лёгкое переутомление": {
            title: "Cozy Analog Pads",
            url: "https://ded-brodiaga.github.io/music/Pills/Cozy%20Analog%20Pads.mp3"
        },
        "Сильное переутомление": {
            title: "Calm Release",
            url: "https://ded-brodiaga.github.io/music/Pills/Calm%20Release.mp3"
        },
        "Полное истощение": {
            title: "Gradual Recovery",
            url: "https://ded-brodiaga.github.io/music/Pills/Gradual%20Recovery.mp3"
        }
    };

    window.selectedTrackData = null;
    let isColorSelected = false;

    const sessionToggleBtn = document.getElementById("session-toggle-btn");
    const recipeButton = document.querySelector(".go-btn");
    const wavesContainer = document.getElementById("audio-waves");

    // === АНИМАЦИЯ ШИРОКОЙ ЗЕЛЕНОЙ РОЗЫ СПЕКТРА ===
    const canvas = document.getElementById("rose-canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;

    function drawRose() {
        if (!ctx || !canvas) return;

        requestAnimationFrame(drawRose);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Если музыка не играет — рисуем спящий бутон
        if (!isPlaying || !analyser || !dataArray) {
            drawStaticBud();
            return;
        }

        analyser.getByteFrequencyData(dataArray);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRadius = 35; 
        const petals = 16;     

        ctx.save();
        ctx.translate(centerX, centerY);

        // Рисуем объемные широкие лепестки
        for (let i = 0; i < petals; i++) {
            const angle = (i * 2 * Math.PI) / petals;
            const value = (dataArray[i % dataArray.length] + dataArray[(i + 1) % dataArray.length]) / 2;
            
            const lengthBonus = 25 + (value * 3.5 / 255) * 140; 
            const currentRadius = baseRadius + lengthBonus;

            const petalWidth = 0.22; // Ширина лепестка

            const x1 = Math.cos(angle - petalWidth) * baseRadius;
            const y1 = Math.sin(angle - petalWidth) * baseRadius;
            const xTip = Math.cos(angle) * currentRadius;
            const yTip = Math.sin(angle) * currentRadius;
            const x2 = Math.cos(angle + petalWidth) * baseRadius;
            const y2 = Math.sin(angle + petalWidth) * baseRadius;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(x1, y1);
            ctx.lineTo(xTip, yTip);
            ctx.lineTo(x2, y2);
            ctx.closePath();

            const alpha = 0.35 + (value / 255) * 0.55;
            ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
            ctx.fill();

            ctx.strokeStyle = `rgba(39, 174, 96, ${alpha + 0.2})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Сердцевина розы
        const avgValue = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const coreRadius = baseRadius * 0.7 + (avgValue / 255) * 20;

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
        gradient.addColorStop(0, 'rgba(230, 255, 235, 0.95)');
        gradient.addColorStop(0.6, 'rgba(46, 204, 113, 0.8)');
        gradient.addColorStop(1, 'rgba(39, 174, 96, 0.15)');

        ctx.beginPath();
        ctx.arc(0, 0, coreRadius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }

    function drawStaticBud() {
        if (!ctx || !canvas) return;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
        ctx.fill();
        ctx.restore();
    }

    drawRose();

    // === УПРАВЛЕНИЕ АУДИО БУФЕРОМ ===
    async function loadAndPlayTrack(url) {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            pauseOffset = 0;
            playBuffer(0);
        } catch (e) {
            console.log("Ошибка загрузки аудио через fetch:", e);
            alert("Не удалось загрузить трек. Проверьте консоль.");
        }
    }

    function playBuffer(offset) {
        if (!audioBuffer) return;

        if (sourceNode) {
            try { sourceNode.stop(); } catch(e) {}
        }

        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64; 

        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        sourceNode.start(0, offset);
        startTime = audioContext.currentTime - offset;
        isPlaying = true;
        startWaves();
    }

    function stopBuffer() {
        if (sourceNode && isPlaying) {
            try { sourceNode.stop(); } catch(e) {}
            pauseOffset = audioContext.currentTime - startTime;
            isPlaying = false;
        }
        stopWaves();
    }

    function startWaves() {
        if (wavesContainer) wavesContainer.classList.add("active");
    }

    function stopWaves() {
        if (wavesContainer) wavesContainer.classList.remove("active");
    }

    stopWaves();

    // === 1. ВЫБОР НАСТРОЕНИЯ (Связь с меню) ===
    document.querySelectorAll(".sub-menu li a").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault(); 
            const moodText = item.textContent.trim();
            const chosenMoodEl = document.getElementById("chosen-mood");
            if (chosenMoodEl) chosenMoodEl.textContent = moodText;

            const trackInfo = trackDatabase[moodText];
            const trackElement = document.getElementById("chosen-track");

            if (trackInfo) {
                if (trackElement) trackElement.textContent = trackInfo.title;
                window.selectedTrackData = trackInfo;
            } else {
                if (trackElement) trackElement.textContent = "—";
                window.selectedTrackData = null;
            }

            stopBuffer();
            if (sessionToggleBtn) sessionToggleBtn.style.display = "none";
        });
    });

    // === 2. ВЫБОР ЦВЕТА ===
    document.querySelectorAll(".color-item").forEach(item => {
        item.addEventListener("click", () => {
            const colorName = item.getAttribute("data-color");
            const bg = item.style.background; 

            const colorTextEl = document.getElementById("chosen-color-text");
            const colorCircleEl = document.getElementById("chosen-color-circle");

            if (colorTextEl) colorTextEl.textContent = colorName;
            if (colorCircleEl) colorCircleEl.style.background = bg;
            
            isColorSelected = true;

            const screenEl = document.getElementById("visualizer-screen");
            if (screenEl) {
                screenEl.style.setProperty('--glow-color-dim', bg.replace('rgb', 'rgba').replace(')', ', 0.3)'));
                screenEl.style.setProperty('--glow-color-bright', bg.replace('rgb', 'rgba').replace(')', ', 0.7)'));
                screenEl.classList.add("glowing-screen");
            }
        });
    });

    // === 3. КНОПКА ЗАПУСКА ===
    if (recipeButton) {
        recipeButton.addEventListener("click", () => {
            if (!window.selectedTrackData) {
                alert("Пожалуйста, выберите состояние слева!");
                return;
            }
            if (!isColorSelected) {
                alert("Пожалуйста, выберите цвет терапии!");
                return;
            }

            loadAndPlayTrack(window.selectedTrackData.url);

            if (sessionToggleBtn) {
                sessionToggleBtn.style.display = "inline-block";
                sessionToggleBtn.textContent = "⏸ Пауза сеанса";
                sessionToggleBtn.style.backgroundColor = "#c0392b";
            }
        });
    }

    // === 4. ПАУЗА / ПРОДОЛЖИТЬ ===
    if (sessionToggleBtn) {
        sessionToggleBtn.addEventListener("click", () => {
            if (isPlaying) {
                stopBuffer();
                sessionToggleBtn.textContent = "▶ Продолжить сеанс";
                sessionToggleBtn.style.backgroundColor = "#27ae60";
            } else {
                if (audioBuffer) {
                    playBuffer(pauseOffset);
                    sessionToggleBtn.textContent = "⏸ Пауза сеанса";
                    sessionToggleBtn.style.backgroundColor = "#c0392b";
                }
            }
        });
    }

});
// Список изображений персонажей в наушниках (замените на ваши реальные имена файлов)
const characterImages = [
    "music therapy.webp", 
    "1.webp", 
    "2.webp", 
    "3.webp", 
    "4.webp", 
    "6.webp", 
    "7.webp", 
    "8.webp"
];

let currentImgIndex = 0;
const targetImgElement = document.querySelector(".intro-img img");

if (targetImgElement && characterImages.length > 1) {
    setInterval(() => {
        // 1. Плавно гасим текущую картинку
        targetImgElement.classList.add("fade-out");

        // 2. Через 1.5 секунды меняем источник и плавно проявляем новую
        setTimeout(() => {
            currentImgIndex = (currentImgIndex + 1) % characterImages.length;
            targetImgElement.src = characterImages[currentImgIndex];
            targetImgElement.classList.remove("fade-out");
        }, 1500); // Время задержки совпадает с длительностью transition в CSS

    }, 25000); // Интервал смены картинок (25 секунд — спокойно и не отвлекает)
}
