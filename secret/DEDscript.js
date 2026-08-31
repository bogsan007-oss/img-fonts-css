console.log("Мотор плеера запущен (исправление двойного воспроизведения)");

// === ЭЛЕМЕНТЫ ИНФЕРФЕЙСА ===
const playBtn   = document.getElementById("player-circle");
const playIcon  = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const audioEl   = document.getElementById("player");
const trackName = document.getElementById("current-track-name");
const leftBar   = document.querySelector('.left-bar');
const rightBar  = document.querySelector('.right-bar');
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.getElementById("progress-container");

const radioBox  = document.getElementById("radio-box");
const radioBtns = radioBox ? radioBox.querySelectorAll(".radio-btn") : [];

// === СОСТОЯНИЕ ===
let isPlaying = false;
let currentTrackIndex = 0;
let isRadioMode = false;
let isTransitioning = false; // Защита от наложений и двойных срабатываний

const playlist = window.myPlaylist || [];

const radioStations = [
    { name: "Русское волна",        src: "https://ru1.amgradio.ru/RuWave48?7aa4" },
    { name: "Новое радио",          src: "https://stream.newradio.ru/novoe96.aacp?9167" },
    { name: "Авторадио",            src: "https://pub0201.101.ru/stream/air/aac/64/100?7b4b6666" },
    { name: "Радио Родных Дорог",    src: "https://stream1.radiord.ru:8000/live128.mp3?e5f1" },
    { name: "Шансон",               src: "https://chanson.hostingradio.ru:8041/chanson256.mp3" },
    { name: "Русское радио",        src: "https://rusradio.hostingradio.ru/rusradio96.aacp?67c24" },
    { name: "Монте карло",          src: "https://montecarlo.hostingradio.ru/montecarlo96.aacp?acac" },
    { name: "Европа плюс",          src: "https://pub0201.101.ru/stream/air/aac/64/100?7b4b6666" },
    { name: "Эльдорадо радио",      src: "https://emgspb.hostingradio.ru/eldoradio128.mp3?e139a94b" },
    { name: "Шоколад радио",        src: "https://choco.hostingradio.ru:10010/fm?0665d328" },
    { name: "Радио Максимум",       src: "http://maximum.hostingradio.ru/maximum96.aacp" },
    { name: "Radio Paradise",       src: "https://stream.radioparadise.com/mp3-128" },
    { name: "Наше радио",           src: "https://nashe1.hostingradio.ru:80/nashe-128.mp3" },
    { name: "Радио Маяк",           src: "https://nashe1.hostingradio.ru:80/nashe-128.mp3" },
    { name: "радио Родники",        src: "https://rodniki.hostingradio.ru/rodniki128.mp3" },
    { name: "RetroFM",              src: "https://retro.hostingradio.ru:8043/retro256.mp3" },
    { name: "Казак FM",             src: "https://radio.kazak.fm/kazak_fm.mp3?radiostatistica=online-red.fm" },
    { name: "Радио «Дача»",         src: "https://listen15.vdfm.ru:8000/dacha?type=.mp3" },
    { name: "Маруся FM",            src: "https://listen.vdfm.ru:8000/marusya" },
    { name: "Хорошее Радио",        src: "https://hr.amgradio.ru/horoshee.aacp" }
];

// Настройка тега аудио
audioEl.crossOrigin = "anonymous";
audioEl.loop = false; // Жестко запрещаем цикличность на уровне браузера

// Инициализация первого трека (для мгновенного старта с кнопки Play)
if (playlist.length > 0) {
    currentTrackIndex = 0; // Явно задаем 0 индекс
    trackName.textContent = playlist[0].title;
    audioEl.src = playlist[0].src;
    audioEl.load(); // ОБЯЗАТЕЛЬНО: очищаем буфер браузера при старте!
}

// === WEB AUDIO API И АНАЛИЗАТОР ===
let audioCtx = null;
let analyser = null;
let audioSrcNode = null;

function initAudioContext() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;

        audioSrcNode = audioCtx.createMediaElementSource(audioEl);
        audioSrcNode.connect(analyser);
        analyser.connect(audioCtx.destination);
    } catch (e) {
        console.log("Web Audio API ошибка:", e);
    }
}

// === ВИЗУАЛИЗАТОР ===
const bars = document.querySelectorAll("#visualizer .bar");

function animateVisualizer() {
    requestAnimationFrame(animateVisualizer);

    if (!isPlaying || !analyser) {
        bars.forEach(bar => bar.style.transform = "scaleY(0.1)");
        if (leftBar) leftBar.style.transform = "scaleX(0.4)";
        if (rightBar) rightBar.style.transform = "scaleX(0.4)";
        return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    bars.forEach((bar, i) => {
        // --- БАСЫ СПРАВА, ВЫСОКИЕ СЛЕВА ---
        // Вычисляем индекс наоборот: i=0 (левый край) берет данные с конца массива (высокие),
        // а последний i (правый край) берет данные с начала массива (басы).
        const invertedIndex = bars.length - 1 - i;
        const dataIndex = Math.floor((invertedIndex / bars.length) * (bufferLength / 2.5));
        
        // --- ПОЧЕМУ ОНИ ЗАШКАЛИВАЛИ И КАК ИСПРАВИТЬ ---
        // Значение dataArray[dataIndex] от 0 до 255.
        // Делим на 255, получаем от 0.0 до 1.0.
        // Умножаем на 0.6, чтобы искусственно уменьшить максимальную высоту столбика (приглушить басы).
        const rawValue = dataArray[dataIndex] / 155;
        const barHeight = rawValue * 0.6; // Множитель 0.6 уберет зашкаливание

        // Применяем трансформацию
        bar.style.transform = `scaleY(${Math.max(barHeight, 0.1)})`;
    });

    // Если у вас есть боковые индикаторы (leftBar, rightBar), их тоже нужно поменять местами:
    if (leftBar && rightBar) {
        // Теперь leftBar реагирует на высокие (индекс 6), а rightBar на басы (индекс 2)
        const leftVal = (dataArray[6] / 255) * 8 + 1; 
        const rightVal = (dataArray[2] / 255) * 8 + 1; 
        leftBar.style.transform = `scaleX(${leftVal})`;
        rightBar.style.transform = `scaleX(${rightVal})`;
    }
}
animateVisualizer();

// === БЕЗОПАСНАЯ ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ ТРЕКОВ ===
function playTrackByIndex(index) {
    if (isTransitioning) return;
    isTransitioning = true;

    currentTrackIndex = index;
    const trackData = playlist[currentTrackIndex];
    if (!trackData) {
        isTransitioning = false;
        return;
    }

    trackName.textContent = trackData.title;

    // Полный сброс буфера предыдущего трека во избежание фантомных повторов
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.src = "";
    audioEl.load();

    audioEl.src = trackData.src;
    audioEl.load();

    initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    audioEl.play().then(() => {
        isPlaying = true;
        if (playIcon) playIcon.style.opacity = 0;
        if (pauseIcon) pauseIcon.style.opacity = 1;
        isTransitioning = false;
    }).catch(err => {
        console.log("Ошибка воспроизведения:", err);
        isTransitioning = false;
    });
}

// === ПРОГРЕСС И ПЕРЕМОТКА ===
audioEl.addEventListener("timeupdate", () => {
    if (isRadioMode || !audioEl.duration) {
        if (progressBar) progressBar.style.width = "0%";
        return;
    }
    const percent = (audioEl.currentTime / audioEl.duration) * 100;
    if (progressBar) progressBar.style.width = percent + "%";
});

if (progressContainer) {
    progressContainer.addEventListener("click", (e) => {
        if (isRadioMode || !audioEl.duration) return;
        const rect = progressContainer.getBoundingClientRect();
        audioEl.currentTime = ((e.clientX - rect.left) / rect.width) * audioEl.duration;
    });
}

// === АБСОЛЮТНО НАДЕЖНЫЙ АВТОПЕРЕХОД БЕЗ ДВОЙНЫХ КРУГОВ ===
let isTrackFinished = false;

audioEl.addEventListener("ended", () => {
    if (isRadioMode) return;
    if (isTrackFinished) return;
    isTrackFinished = true;

    currentTrackIndex++;
    if (currentTrackIndex >= playlist.length) {
        currentTrackIndex = 0;
    }

    const nextTrackData = playlist[currentTrackIndex];
    if (nextTrackData) {
        trackName.textContent = nextTrackData.title;
        audioEl.src = nextTrackData.src;
        audioEl.load();

        audioEl.play().then(() => {
            isPlaying = true;
            if (playIcon) playIcon.style.opacity = 0;
            if (pauseIcon) pauseIcon.style.opacity = 1;
            setTimeout(() => { isTrackFinished = false; }, 500);
        }).catch(err => {
            console.log("Ошибка автопереключения:", err);
            isTrackFinished = false;
        });
    }
});

// === КЛИК ПО ТРЕКУ В ПЛЕЙЛИСТЕ ===
document.querySelectorAll(".track").forEach(track => {
    track.addEventListener("click", () => {
        isRadioMode = false;
        const index = parseInt(track.dataset.index, 10);
        playTrackByIndex(index);
    });
});

// === КЛИК ПО РАДИО ===
radioBtns.forEach((btn, index) => {
    btn.addEventListener("click", () => {
        const station = radioStations[index];
        if (!station) return;

        isRadioMode = true;
        if (progressBar) progressBar.style.width = "0%";
        trackName.textContent = station.name;

        audioEl.pause();
        audioEl.currentTime = 0;
        audioEl.src = "";
        audioEl.load();

        audioEl.src = station.src;
        audioEl.load();

        initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        audioEl.play().then(() => {
            isPlaying = true;
            if (playIcon) playIcon.style.opacity = 0;
            if (pauseIcon) pauseIcon.style.opacity = 1;
        }).catch(() => {});
    });
});

// === КНОПКА PLAY / PAUSE ===
playBtn.addEventListener("click", () => {
    if (!isPlaying) {
        initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        audioEl.play().then(() => {
            isPlaying = true;
            if (playIcon) playIcon.style.opacity = 0;
            if (pauseIcon) pauseIcon.style.opacity = 1;
        }).catch(() => {});
    } else {
        isPlaying = false;
        if (playIcon) playIcon.style.opacity = 1;
        if (pauseIcon) pauseIcon.style.opacity = 0;
        audioEl.pause();
    }
});
// === ДИНАМИЧЕСКОЕ СОЗДАНИЕ ПЛЕЙЛИСТА ===
const playlistInner = document.querySelector(".playlist-inner");

function renderPlaylist() {
    if (!playlistInner) return;
    playlistInner.innerHTML = "";

    playlist.forEach((track, index) => {
        const trackDiv = document.createElement("div");
        trackDiv.className = "gold-text track";
        trackDiv.dataset.index = index;
        
        trackDiv.innerHTML = `
            <img class="svet-icon" src="https://raw.githubusercontent.com/bogsan007-oss/img-fonts-css/main/secret/img/svet.webp" alt="">
            ${track.title}
        `;
        
        // Клик по треку (никаких рекурсивных вызовов renderPlaylist!)
        trackDiv.addEventListener("click", () => {
            isRadioMode = false;
            isTrackFinished = false;
            currentTrackIndex = parseInt(trackDiv.dataset.index, 10);
            
            const trackData = playlist[currentTrackIndex];
            if (trackData) {
                trackName.textContent = trackData.title;
                audioEl.src = trackData.src;
                audioEl.load();
                audioEl.play().then(() => {
                    isPlaying = true;
                    if (playIcon) playIcon.style.opacity = 0;
                    if (pauseIcon) pauseIcon.style.opacity = 1;
                }).catch(err => {
                    console.log("Ошибка воспроизведения:", err);
                });
            }
        });

        playlistInner.appendChild(trackDiv);
    });
}

// Запускаем отрисовку плейлиста ровно один раз при старте
renderPlaylist();


/* ====== ВЫВОД СЛУЧАЙНОГО ТОВАРА ИЗ МАССИВА prodat ====== */
(function() {
    // Проверяем, есть ли вообще массив товаров и нужный блок на странице
    if (typeof prodat === 'undefined' || !prodat || prodat.length === 0) {
        console.log("Массив товаров prodat пуст или еще не загрузился");
        return;
    }

    const block = document.querySelector('.prodam-card');
    if (!block) return;

    // Выбираем случайный товар из вашего постоянно пополняющегося массива
    const randomProduct = prodat[Math.floor(Math.random() * prodat.length)];

    // Вставляем товар в карточку
    block.innerHTML = `
        <img src="${randomProduct.img}" alt="${randomProduct.title}">
        <div class="prodam-card-title">${randomProduct.title}</div>
    `;

    // При клике открываем модальное окно с подробным описанием
    block.addEventListener('click', (e) => {
        e.preventDefault();
        openProductModal(randomProduct);
    });

    // Функция открытия модального окна для товара
    function openProductModal(item) {
        const thoughtText = document.getElementById("thoughtText");
        const modal = document.querySelector('.thought-modal');

        if (!thoughtText || !modal) return;

        thoughtText.innerHTML = `
            <div style="display:flex; align-items:flex-start; gap:15px;">
                <img src="${item.img}" style="width:150px; height:150px; border-radius:6px; flex-shrink:0; object-fit:cover;">
                <div style="font-size:22px; line-height:1.3; text-align:left;">
                    <b>${item.title}</b><br><br>
                    Цена: <b>${item.price}</b><br>
                    <span style="text-decoration:line-through; color:#888;">${item.oldPrice}</span><br>
                    <span style="color:#b30000; font-weight:bold;">Скидка: ${item.discount}</span><br><br>
                    ${item.desc ? `<span style="font-size:15px; color:#ccc;">${item.desc}</span><br><br>` : ''}
                    <a href="${item.link}" target="_blank" style="padding:6px 12px; background:#b30000; color:#fff; border-radius:4px; text-decoration:none; display:inline-block;">
                        Купить
                    </a>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    // Закрытие модального окна по крестику или клику вне окна
    const closeBtn = document.querySelector('.thought-close');
    const modal = document.querySelector('.thought-modal');

    if (closeBtn && modal) {
        closeBtn.onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        };
    }
})();
/* ======================================================
   1. МЫСЛИ ДНЯ (Умные мысли)
====================================================== */
(function() {
    async function loadThoughts() {
        const card = document.getElementById('thoughtCard');
        const previewEl = card ? card.querySelector('.thought-preview') : null;
        const thoughtModalEl = document.getElementById('thoughtModal');
        const thoughtTextEl = document.getElementById('thoughtText');
        const closeBtn = thoughtModalEl ? thoughtModalEl.querySelector('.thought-close') : null;

        let thoughts = [];

        try {
            const response = await fetch('https://raw.githubusercontent.com/bogsan007-oss/img-fonts-css/main/secret/thoughts.js');
            const text = await response.text();
            
            const cleanCode = text.replace(/window\.siteThoughts\s*=\s*/, 'window._tempThoughts = ');
            const scriptTag = document.createElement('script');
            scriptTag.textContent = cleanCode;
            document.head.appendChild(scriptTag);
            
            thoughts = window._tempThoughts;
            delete window._tempThoughts;
        } catch (e) {
            console.error("Не удалось загрузить файл с мыслями:", e);
        }

        if (thoughts && thoughts.length > 0) {
            const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
            if (previewEl) previewEl.textContent = randomThought.preview;
            if (card) card.dataset.full = randomThought.full;
        } else {
            if (previewEl) previewEl.textContent = "Мысли не найдены...";
        }

        if (card && thoughtModalEl && thoughtTextEl) {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                thoughtTextEl.textContent = card.dataset.full || "Мысль дня...";
                thoughtModalEl.classList.add('active');
            });
        }

        if (closeBtn && thoughtModalEl) {
            closeBtn.addEventListener('click', () => {
                thoughtModalEl.classList.remove('active');
            });
        }

        if (thoughtModalEl) {
            thoughtModalEl.addEventListener('click', (e) => {
                if (e.target === thoughtModalEl) {
                    thoughtModalEl.classList.remove('active');
                }
            });
        }
    }

    // Запускаем сразу, так как скрипт в самом низу страницы
    loadThoughts();
})();


/* ======================================================
   2. ТОВАРЫ (ПРОДАМ) - СЛУЧАЙНЫЙ ВЫБОР ПРИ ЗАГРУЗКЕ
====================================================== */
(function() {
    if (typeof prodat === 'undefined' || !prodat || prodat.length === 0) return;

    const block = document.querySelector('.prodam-card');
    if (!block) return;

    const item = prodat[Math.floor(Math.random() * prodat.length)];

    block.innerHTML = `
        <img src="${item.img}" alt="${item.title}">
        <div class="prodam-card-title">${item.title}</div>
    `;

    block.addEventListener('click', (e) => {
        e.preventDefault();
        openProductModal(item);
    });

    function openProductModal(item) {
        const modalContent = document.getElementById("thoughtText");
        const modal = document.querySelector('.thought-modal');

        if (!modalContent || !modal) return;

        modalContent.innerHTML = `
            <div style="display:flex; align-items:flex-start; gap:15px;">
                <img src="${item.img}" style="width:150px; height:150px; border-radius:6px; flex-shrink:0;">
                <div style="font-size:22px; line-height:1.3; text-align:left;">
                    <b>${item.title}</b><br><br>
                    Цена: <b>${item.price}</b><br>
                    <span style="text-decoration:line-through; color:#888;">${item.oldPrice}</span><br>
                    <span style="color:#b30000; font-weight:bold;">Скидка: ${item.discount}</span><br><br>
                    <a href="${item.link}" target="_blank" style="padding:6px 12px; background:#b30000; color:#fff; border-radius:4px; text-decoration:none;">
                        Купить
                    </a>
                </div>
            </div>
        `;
        modal.classList.add('active');
    }
})();


/* ======================================================
   3. КРИМИНАЛЬНЫЕ НОВОСТИ (RSS) - КАРТИНКА СЛЕВА
====================================================== */
(function() {
    async function loadCrime() {
        const url = "https://api.rss2json.com/v1/api.json?rss_url=https://tass.ru/rss/v2.xml";

        try {
            const response = await fetch(url);
            const data = await response.json();

            const items = data.items;
            if (!items || items.length === 0) return;

            const item = items[Math.floor(Math.random() * items.length)];

            const title = item.title;
            const desc = item.description;
            const link = item.link;
            const thumbnail = (item.enclosure && item.enclosure.link) ? item.enclosure.link : (item.thumbnail || "");

            const cell = document.querySelector(".crime-card");
            if (!cell) return;

            if (!thumbnail) {
                cell.innerHTML = `
                    <div style="font-weight:bold; font-size:20px; margin-bottom:6px; line-height:1.0;">
                        ${title}
                    </div>
                    <div style="font-size:18px; line-height:1.0;">
                        ${desc}
                    </div>
                `;
            } else {
                cell.innerHTML = `
                    <div style="font-weight:bold; font-size:13px; margin-bottom:6px; line-height:1.2;">
                        ${title}
                    </div>
                    <img src="${thumbnail}" style="
                        width: 60px;
                        height: 60px;
                        float: left;
                        margin-right: 8px;
                        margin-bottom: 4px;
                        border-radius: 4px;
                    ">
                    <div style="font-size: 16px; line-height:1.2;">
                        ${desc}
                    </div>
                `;
            }

            cell.addEventListener("click", function(e) {
                e.preventDefault();
                openCrimeModal({ title, desc, thumbnail, link });
            });

        } catch (e) {
            console.log("Ошибка RSS:", e);
        }
    }

    function openCrimeModal({ title, desc, thumbnail, link }) {
        const modal = document.querySelector(".thought-modal");
        const modalContent = document.querySelector("#thoughtText");

        if (!modal || !modalContent) return;

        modalContent.innerHTML = `
            <div style="font-weight:bold; font-size:22px; margin-bottom:10px;">
                ${title}
            </div>
            ${thumbnail ? `
                <img src="${thumbnail}" style="
                    width: 120px;
                    height: 120px;
                    float: left;
                    margin-right: 12px;
                    margin-bottom: 8px;
                    border-radius: 6px;
                ">
            ` : ""}
            <div style="font-size:17px; line-height:1.2;">
                ${desc}
            </div>
            <div style="clear: both; margin-top:15px;">
                <a href="${link}" target="_blank" style="font-size:16px; color:#8b0000; text-decoration:underline;">Читать полностью…</a>
            </div>
        `;

        modal.classList.add("active");
    }

    loadCrime();
})();
/* ======================================================
   4. РЕЦЕПТЫ (RSS)
====================================================== */
(function() {
    async function loadRecipe() {
        const url = "https://api.rss2json.com/v1/api.json?rss_url=http://rezept.brodiaga.com/feeds/posts/default?alt=rss";

        try {
            const response = await fetch(url);
            const data = await response.json();

            const items = data.items;
            if (!items || items.length === 0) return;

            const randomItem = items[Math.floor(Math.random() * items.length)];

            const title = randomItem.title;
            const link = randomItem.link;
            const thumbnail = randomItem.thumbnail;

            const cell = document.querySelector(".paper-news");
            if (cell) {
                cell.innerHTML = `
                    <div class="paper-title">
                        ${title}
                    </div>

                    <a href="${link}" target="_blank">
                        <img class="paper-img" src="${thumbnail}">
                    </a>
                `;
            }
        } catch (e) {
            console.log("Ошибка RSS рецептов:", e);
        }
    }

    // Запускаем сразу
    loadRecipe();
})();
// бегущая шкала плеера
let startTime = 0;
let pauseOffset = 0;
let progressTimer = null;

// Функция запуска отслеживания прогресса
function startProgress(duration) {
    clearInterval(progressTimer);
    startTime = audioCtx.currentTime - pauseOffset;
    
    progressTimer = setInterval(() => {
        if (!isPlaying || isRadioMode) return;
        
        const elapsed = audioCtx.currentTime - startTime;
        const progressPercent = (elapsed / duration) * 100;
        
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = Math.min(progressPercent, 100) + '%';
        }
        
        // Если дошли до конца, сбрасываем полосу
        if (elapsed >= duration) {
            clearInterval(progressTimer);
        }
    }, 100);
}

// Функция сброса полосы (при паузе или переключении)
function stopProgress() {
    clearInterval(progressTimer);
    pauseOffset = audioCtx.currentTime - startTime;
}
