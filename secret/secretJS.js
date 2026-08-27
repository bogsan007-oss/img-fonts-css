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
let isRadioMode = false;

// === ПЛАВНЫЙ ВИЗУАЛИЗАТОР ===
let visualizerIsActive = false;
let fakeRadioInterval = null;

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

// === РАДИОСТАНЦИИ ===
const radioStations = [
    { name: "Русское волна",        src: "https://ru1.amgradio.ru/RuWave48?7aa4" },
    { name: "Новое радио",          src: "https://stream.newradio.ru/novoe96.aacp?9167" },
    { name: "Авторадио",            src: "https://pub0201.101.ru/stream/air/aac/64/100?7b4b6666" },
    { name: "Радио Родных Дорог",   src: "https://stream1.radiord.ru:8000/live128.mp3?e5f1" },
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
    { name: "RetroFM",              src: "https://retro.hostingradio.ru:8043/retro256.mp3" }
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

// === ПЛАВНОЕ ВКЛЮЧЕНИЕ ВИЗУАЛИЗАТОРА ===
function startSmoothVisualizer() {
    if (visualizerIsActive) return;
    visualizerIsActive = true;

    bars.forEach(bar => {
        bar.style.transition = "height 0.35s linear";
        bar.style.height = "40px";
    });

    fakeRadioInterval = setInterval(() => {
        if (!visualizerIsActive) return;

        bars.forEach(bar => {
            const h = Math.random() * 40 + 10;
            bar.style.height = h + "px";
        });
    }, 120);
}

// === ПЛАВНОЕ ВЫКЛЮЧЕНИЕ ВИЗУАЛИЗАТОРА ===
function stopSmoothVisualizer() {
    visualizerIsActive = false;
    clearInterval(fakeRadioInterval);

    bars.forEach(bar => {
        bar.style.transition = "height 0.35s linear";
        bar.style.height = "0px";
    });

    // малый визуализатор тоже гасим
    leftBar.style.transform  = "scaleX(0)";
    rightBar.style.transform = "scaleX(0)";
}

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

        isPlaying = false;
        playIcon.style.opacity  = 1;
        pauseIcon.style.opacity = 0;

        stopPrevBuffer();
        stopSmoothVisualizer();
        return;
    }

    const trackData = playlist[currentTrackIndex];
    trackName.textContent = trackData.title;

    loadAndDecode(trackData.src);
}

// === ЗАГРУЗКА И ДЕКОДИРОВАНИЕ ===
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

// === ЗАПУСК ВИЗУАЛИЗАТОРА ДЛЯ ТРЕКА ===
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

// === АНИМАЦИЯ ===
function animateVisualizer() {
    requestAnimationFrame(animateVisualizer);

    // === НИЧЕГО НЕ ИГРАЕТ → ГАСИМ ОБА ВИЗУАЛИЗАТОРА ===
    if (!isPlaying) {
        bars.forEach(bar => bar.style.transform = "scaleY(0)");
        leftBar.style.transform  = "scaleX(0)";
        rightBar.style.transform = "scaleX(0)";
        return;
    }

    // === РЕЖИМ РАДИО ===
    if (isRadioMode) {
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

    // === РЕЖИМ ТРЕКОВ ===
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

// === ПЕРЕКЛЮЧЕНИЕ ТРЕКА ===
const trackEls = document.querySelectorAll(".track");

trackEls.forEach(track => {
    track.addEventListener("click", () => {

        stopSmoothVisualizer();

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

        startSmoothVisualizer();
        loadAndDecode(trackData.src);
    });
});

// === ВКЛЮЧЕНИЕ РАДИО ===
radioBtns.forEach((btn, index) => {
    btn.addEventListener("click", () => {
        const station = radioStations[index];
        if (!station) return;

        stopSmoothVisualizer();

        isRadioMode = true;
        stopPrevBuffer();

        audioEl.src = station.src;
        audioEl.muted = false;
        audioEl.play().catch(() => {});

        trackName.textContent = station.name;

        isPlaying = true;
        playIcon.style.opacity  = 0;
        pauseIcon.style.opacity = 1;

        startSmoothVisualizer();
    });
});

// === PLAY/PAUSE ===
playBtn.addEventListener("click", () => {

    if (!audioEl.src) {
        audioEl.src = playlist[0].src;
    }

    if (isRadioMode) {
        if (!isPlaying) {
            isPlaying = true;
            playIcon.style.opacity  = 0;
            pauseIcon.style.opacity = 1;
            audioEl.play().catch(() => {});
            startSmoothVisualizer();
        } else {
            isPlaying = false;
            playIcon.style.opacity  = 1;
            pauseIcon.style.opacity = 0;
            audioEl.pause();
            stopSmoothVisualizer();
        }
        return;
    }

    if (!isPlaying) {
        isPlaying = true;
        playIcon.style.opacity  = 0;
        pauseIcon.style.opacity = 1;

        startSmoothVisualizer();
        loadAndDecode(audioEl.src);

    } else {
        isPlaying = false;
        playIcon.style.opacity  = 1;
        pauseIcon.style.opacity = 0;

        stopPrevBuffer();
        stopSmoothVisualizer();
    }
});

// === ОШИБКИ ПОТОКА РАДИО ===
audioEl.addEventListener("error", () => {
    isPlaying = false;
    stopSmoothVisualizer();
});

audioEl.addEventListener("stalled", () => {
    isPlaying = false;
    stopSmoothVisualizer();
});
// ===== Ячека первая рецепты  ======
(function() {
  async function loadRecipe() {
    const url = "https://api.rss2json.com/v1/api.json?rss_url=http://rezept.brodiaga.com/feeds/posts/default?alt=rss";

    try {
      const response = await fetch(url);
      const data = await response.json();

      // ВАЖНО: выбираем случайный рецепт
      const items = data.items;
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
      console.log("Ошибка RSS:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", loadRecipe);
})();
         // ячейка третья мысли умные или нет
(function() {
  document.addEventListener('DOMContentLoaded', async () => {
    const card = document.getElementById('thoughtCard');
    const previewEl = card ? card.querySelector('.thought-preview') : null;
    const thoughtModalEl = document.getElementById('thoughtModal');
    const thoughtTextEl = document.getElementById('thoughtText');
    const closeBtn = thoughtModalEl ? thoughtModalEl.querySelector('.thought-close') : null;

    let thoughts = [];

    try {
      // Надежно скачиваем файл с мыслями как текст, минуя блокировки браузера
      const response = await fetch('https://raw.githubusercontent.com/bogsan007-oss/img-fonts-css/main/secret/thoughts.js');
      const text = await response.text();
      
      // Вырезаем название переменной и превращаем текст в рабочий массив
      const cleanCode = text.replace(/window\.siteThoughts\s*=\s*/, 'window._tempThoughts = ');
      const scriptTag = document.createElement('script');
      scriptTag.textContent = cleanCode;
      document.head.appendChild(scriptTag);
      
      thoughts = window._tempThoughts;
      delete window._tempThoughts;
    } catch (e) {
      console.error("Не удалось загрузить файл с мыслями:", e);
    }

    // Выводим случайную мысль
    if (thoughts && thoughts.length > 0) {
      const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
      if (previewEl) previewEl.textContent = randomThought.preview;
      if (card) card.dataset.full = randomThought.full;
    } else {
      if (previewEl) previewEl.textContent = "Мысли не найдены...";
    }

    // Открытие модалки по клику
    if (card && thoughtModalEl && thoughtTextEl) {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        thoughtTextEl.textContent = card.dataset.full || "Мысль дня...";
        thoughtModalEl.classList.add('active');
      });
    }

    // Закрытие по крестику
    if (closeBtn && thoughtModalEl) {
      closeBtn.addEventListener('click', () => {
        thoughtModalEl.classList.remove('active');
      });
    }

    // Закрытие по клику на фон
    if (thoughtModalEl) {
      thoughtModalEl.addEventListener('click', (e) => {
        if (e.target === thoughtModalEl) {
          thoughtModalEl.classList.remove('active');
        }
      });
    }
  });
})();
/* ===== 1. Вывод карточек из массива ===== */

const container = document.querySelector('.prodam-card'); 
// Вставляем карточки внутрь твоего блока .prodam-card

prodat.forEach((item, index) => {
  const card = document.createElement('div');
  card.className = 'prodam-card-item';
  card.innerHTML = `
    <img src="${item.img}" alt="${item.title}">
    <div class="prodam-card-title">${item.title}</div>
  `;

  // При клике открываем модальное окно
  card.addEventListener('click', () => openProductModal(item));

  container.appendChild(card);
});

/* ====== ВЫВОД ТОВАРОВ В СУЩЕСТВУЮЩИЕ Ячейка 2 ====== */
/* ====== ВЫБИРАЕМ СЛУЧАЙНЫЙ ТОВАР ПРИ КАЖДОЙ ЗАГРУЗКЕ ====== */

function getRandomProduct() {
  return prodat[Math.floor(Math.random() * prodat.length)];
}

/* ====== ВСТАВЛЯЕМ ТОВАР В ЕДИНСТВЕННЫЙ БЛОК ====== */

const block = document.querySelector('.prodam-card');
const item = getRandomProduct();   // ← вот тут выбирается новый товар при каждой загрузке

block.innerHTML = `
  <img src="${item.img}" alt="${item.title}">
  <div class="prodam-card-title">${item.title}</div>
`;

/* ====== ДЕЛАЕМ КАРТОЧКУ КЛИКАБЕЛЬНОЙ ====== */

block.addEventListener('click', () => openProductModal(item));

/* ====== ОТКРЫТИЕ ТВОЕГО СУЩЕСТВУЮЩЕГО МОДАЛЬНОГО ОКНА ====== */

function openProductModal(item) {
  document.getElementById("thoughtText").innerHTML = `
  <div style="display:flex; align-items:flex-start; gap:15px;">

    <img src="${item.img}"
         style="width:150px; height:150px; border-radius:6px; flex-shrink:0;">

    <div style="font-size:22px; line-height:1.3; text-align:left;">
      <b>${item.title}</b><br><br>
      Цена: <b>${item.price}</b><br>
      <span style="text-decoration:line-through; color:#fff;">${item.oldPrice}</span><br>
      <span style="color:#b30000; font-weight:bold;">Скидка: ${item.discount}</span><br><br>

      <a href="${item.link}" target="_blank"
         style="padding:6px 12px; background:#b30000; color:#fff;
                border-radius:4px; text-decoration:none;">
        Купить
      </a>
    </div>

  </div>
`;


  document.querySelector('.thought-modal').classList.add('active');
}

/* ====== ЗАКРЫТИЕ ОКНА ====== */

document.querySelector('.thought-close').addEventListener('click', () => {
  document.querySelector('.thought-modal').classList.remove('active');
});
/* ====== 4 карточка с криминалом */
(function() {

  async function loadCrime() {

    const url = "https://api.rss2json.com/v1/api.json?rss_url=https://tass.ru/rss/v2.xml";

    try {
      const response = await fetch(url);
      const data = await response.json();

      // --- БЕРЁМ СЛУЧАЙНУЮ НОВОСТЬ ---
      const items = data.items;
      const item = items[Math.floor(Math.random() * items.length)];

      const title = item.title;
      const desc = item.description;
      const link = item.link;

      // --- КАРТИНКА ---
      const thumbnail =
        (item.enclosure && item.enclosure.link) ? item.enclosure.link :
        (item.thumbnail || "");

      // --- КАРТОЧКА ---
      const cell = document.querySelector(".crime-card");
      if (!cell) return;

      // --- ВЫВОД В КАРТОЧКУ ---
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
            width:50px;
            height:50px;
            float:right;
            margin-left:6px;
            margin-bottom:4px;
        	">

          <div style="font-size: 20px; line-height:1.0;">
            ${desc}
          </div>
        `;
      }

      // --- КЛИК ПО КАРТОЧКЕ → ОТКРЫВАЕМ МОДАЛКУ ---
      cell.addEventListener("click", function() {
        openCrimeModal({ title, desc, thumbnail, link });
      });

    } catch (e) {
      console.log("Ошибка RSS:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", loadCrime);

})();


// ======================================================
// === МОДАЛЬНОЕ ОКНО ДЛЯ КРИМИНАЛЬНОЙ НОВОСТИ ============
// ======================================================

function openCrimeModal({ title, desc, thumbnail, link }) {

  const modal = document.querySelector(".thought-modal");
  const modalContent = document.querySelector("#thoughtText");

  if (!modal || !modalContent) return;

  // --- ФОРМИРУЕМ ТЕКСТ В МОДАЛКЕ ---
  modalContent.innerHTML = `
    <div style="font-weight:bold; font-size:22px; margin-bottom:10px;">
      ${title}
    </div>

    ${thumbnail ? `
      <img src="${thumbnail}" style="
        width:120px;
        height:120px;
        float:right;
        margin-left:10px;
        border-radius:6px;
      ">
    ` : ""}

    <div style="font-size:17px; line-height:1.1; margin-top:10px;">
      ${desc}
    </div>

    <div style="margin-top:15px;">
      <a href="${link}" target="_blank" style="
        font-size:16px;
        color:#8b0000;
        text-decoration:underline;
      ">Читать полностью…</a>
    </div>
  `;

  // --- ПОКАЗЫВАЕМ МОДАЛКУ ---
  modal.classList.add("active");
}


// --- КНОПКА ЗАКРЫТИЯ ---
document.querySelector(".thought-close").addEventListener("click", () => {
  document.querySelector(".thought-modal").classList.remove("active");
});

// --- ЗАКРЫТИЕ ПО КЛИКУ ВНЕ ОКНА ---
document.querySelector(".thought-modal").addEventListener("click", (e) => {
  if (e.target.classList.contains("thought-modal")) {
    e.target.classList.remove("active");
  }
});
