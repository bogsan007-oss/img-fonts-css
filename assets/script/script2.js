/* ============================================================
   === Вывод карточек через Cloudflare Worker ===
   ============================================================ */

// URL твоего Worker
const WORKER_URL = "https://wispy-snow-3d02.bog-san007.workers.dev";

// ID твоего канала
const CHANNEL_ID = "UCKbsaLZDQ2mb265G3QAcaUw";

// Массив всех видео
let allVideos = [];

// Текущий индекс для "Показать больше"
let currentIndex = 0;

// Сколько карточек выводить за один шаг
const CARDS_PER_STEP = 7;


/* ============================================================
   === Загружаем видео через Worker ===
   ============================================================ */

async function loadVideos() {
    const url = `${WORKER_URL}/?channel=${CHANNEL_ID}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.items) {
            console.error("Worker вернул пустой список видео");
            return;
        }

        allVideos = data.items; // сохраняем все видео
    } catch (error) {
        console.error("Ошибка загрузки видео:", error);
    }
}


/* ============================================================
   === Вывод порции карточек ===
   ============================================================ */

function showMore() {
    const container = document.getElementById('cards');
    if (!container) {
        console.error("Блок #cards не найден в HTML");
        return;
    }

    for (let i = 0; i < CARDS_PER_STEP; i++) {
        if (currentIndex >= allVideos.length) return;

        const snippet = allVideos[currentIndex].snippet;

        const thumbnail =
            snippet.thumbnails.maxres?.url ||
            snippet.thumbnails.high?.url ||
            snippet.thumbnails.medium?.url;

        const title = snippet.title;
        const videoId = snippet.resourceId.videoId;

        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
            <img src="${thumbnail}" class="card-thumb">
            <div class="card-title">${title}</div>
        `;

        card.onclick = () => {
            window.location.href = `https://www.youtube.com/watch?v=${videoId}`;
        };

        container.appendChild(card);

        currentIndex++;
    }

    insertAd(container);
}


/* ============================================================
   === Карточка рекламы Google ===
   ============================================================ */

function insertAd(container) {
    const ad = document.createElement('div');
    ad.className = 'card ad-card';

    ad.innerHTML = `
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="ca-pub-XXXX"
             data-ad-slot="YYYY"
             data-ad-format="auto"></ins>
    `;

    container.appendChild(ad);

    (adsbygoogle = window.adsbygoogle || []).push({});
}


/* ============================================================
   === Инициализация ===
   ============================================================ */

async function init() {
    await loadVideos();
    showMore(); // первая порция карточек
}

init();
