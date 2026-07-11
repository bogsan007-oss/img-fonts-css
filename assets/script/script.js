/* ============================================================
   === Импорт ключей и плейлистов ===
   ============================================================ */
import {
    API_KEY_YOUTUBE,
    PLAYLIST_ID_1,
    PLAYLIST_ID_2,
    PLAYLIST_ID_3
} from '../../dist/keys.js';



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
