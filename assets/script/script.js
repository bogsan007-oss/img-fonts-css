/* ============================================================
   === Импорт ключей и плейлистов ===
   ============================================================ */
import {
    API_KEY_YOUTUBE,
    PLAYLIST_ID_1,
    PLAYLIST_ID_2,
    PLAYLIST_ID_3
} from './keys.js';



/* ============================================================
   === Превью в шапке (последняя публикация) ===
   ============================================================ */

async function loadBigPreview() {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID_1}&maxResults=1&key=${API_KEY_YOUTUBE}`;

    const response = await fetch(url);
    const data = await response.json();

    const item = data.items[0];
    const snippet = item.snippet;

    const thumbnail =
        snippet.thumbnails.maxres?.url ||
        snippet.thumbnails.high?.url ||
        snippet.thumbnails.medium?.url;

    // Вставляем картинку
    document.querySelector('.middle-left .preview').src = thumbnail;

    // Вставляем название
    document.querySelector('.middle-left .title').textContent = snippet.title;
}

loadBigPreview();


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

    const response = await fetch(url);
    const data = await response.json();

    allVideos = data.items; // сохраняем все видео
}


/* ============================================================
   === Вывод порции карточек ===
   ============================================================ */

function showMore() {
    const container = document.getElementById('cards');

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











/* ============================================================
   === Блок публикаций (добавим позже) ===
   ============================================================ */
// Здесь будет код для вывода списка публикаций



/* ============================================================
   === Переключение плейлистов (добавим позже) ===
   ============================================================ */
// Здесь будет логика переключения между плейлистами 1, 2, 3



/* ============================================================
   === Дополнительные функции (эффекты, кнопки, анимации) ===
   ============================================================ */
// Здесь будут твои будущие фишки
