const form = document.getElementById('searchForm');
const inputEl = document.getElementById('searchInput');
const infoEl = document.getElementById('infoText');
const containerEl = document.getElementById('meaning-container');
const titleEl = document.getElementById('title');
const phoneticEl = document.getElementById('phonetic');
const audioEl = document.getElementById('audio');
const audioNoteEl = document.getElementById('audioNote');
const speakBtn = document.getElementById('speakBtn');
const meaningsEl = document.getElementById('meanings');
const sourceEl = document.getElementById('source');
const saveBtn = document.getElementById('saveBtn');
const favoritesEl = document.getElementById('favorites');
const themeBtn = document.getElementById('themeBtn');

let currentWord = '';

/* ---------- helpers ---------- */
function showMessage(text) {
    infoEl.textContent = text;
    infoEl.style.display = 'block';
}

function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
}

/* ---------- storage ---------- */
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('favorites')) || [];
    } catch {
        return [];
    }
}

function setFavorites(list) {
    try {
        localStorage.setItem('favorites', JSON.stringify(list));
    } catch { /* storage unavailable */ }
}

/* ---------- theme ---------- */
function applyTheme(dark) {
    document.body.classList.toggle('dark', dark);
    themeBtn.textContent = dark ? '☀️ Light mode' : '🌙 Dark mode';
}

/* ---------- audio ---------- */
function getAudioSources(entry) {
    const fromApi = entry.phonetics
        .map(p => p.audio)
        .filter(Boolean)
        .map(src => (src.startsWith('//') ? 'https:' + src : src));

    // backup recordings, used if the API's media server is down
    const w = encodeURIComponent(entry.word.toLowerCase());
    const backups = [
        `https://ssl.gstatic.com/dictionary/static/sounds/20200429/${w}--_us_1.mp3`,
        `https://ssl.gstatic.com/dictionary/static/sounds/20200429/${w}--_gb_1.mp3`
    ];

    return [...new Set([...fromApi, ...backups])];
}

function loadAudio(entry) {
    const sources = getAudioSources(entry);
    let index = 0;
    audioNoteEl.textContent = '';
    speakBtn.style.display = 'none';

    function tryNext() {
        if (index >= sources.length) {
            // nothing loaded: keep the player, and offer the browser voice instead
            audioEl.onerror = null;
            audioEl.removeAttribute('src');
            audioNoteEl.textContent = 'No recording is available right now. Use the button below to hear the word.';
            speakBtn.style.display = 'inline-block';
            return;
        }
        audioEl.src = sources[index++];
    }

    audioEl.onerror = tryNext;   // a failed file (like the 502) moves on to the next one
    tryNext();
}

/* ---------- rendering ---------- */
function renderEntry(entry) {
    currentWord = entry.word;
    titleEl.textContent = entry.word;
    phoneticEl.textContent =
        entry.phonetic || entry.phonetics.find(p => p.text)?.text || '';

    meaningsEl.replaceChildren();
    entry.meanings.forEach(meaning => {
        const block = el('div', null, 'meaning-block');
        block.appendChild(el('h4', meaning.partOfSpeech));

        meaning.definitions.slice(0, 3).forEach(def => {
            block.appendChild(el('p', def.definition));
            if (def.example) {
                block.appendChild(el('p', `Example: "${def.example}"`, 'example'));
            }
        });

        const synonyms = [...new Set([
            ...(meaning.synonyms || []),
            ...meaning.definitions.flatMap(d => d.synonyms || [])
        ])].slice(0, 8);
        if (synonyms.length) {
            block.appendChild(el('p', `Synonyms: ${synonyms.join(', ')}`, 'synonyms'));
        }
        meaningsEl.appendChild(block);
    });

    sourceEl.replaceChildren();
    const sourceUrl = entry.sourceUrls?.[0];
    if (sourceUrl) {
        const link = el('a', 'Source', null);
        link.href = sourceUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        sourceEl.append('Source: ', link);
    }

    loadAudio(entry);
    updateSaveState();
    infoEl.style.display = 'none';
    containerEl.style.display = 'block';
}

function renderFavorites() {
    favoritesEl.replaceChildren();
    const favorites = getFavorites();
    if (!favorites.length) {
        favoritesEl.appendChild(el('li', 'No saved words yet.'));
        return;
    }
    favorites.forEach(word => {
        const li = el('li');
        const searchBtn = el('button', word);
        searchBtn.type = 'button';
        searchBtn.addEventListener('click', () => {
            inputEl.value = word;
            fetchWord(word);
        });
        const removeBtn = el('button', '✕');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', `Remove ${word}`);
        removeBtn.addEventListener('click', () => toggleFavorite(word));
        li.append(searchBtn, removeBtn);
        favoritesEl.appendChild(li);
    });
}

function updateSaveState() {
    const saved = getFavorites().includes(currentWord);
    saveBtn.textContent = saved ? '★ Saved' : '☆ Save word';
    containerEl.classList.toggle('saved', saved);
}

function toggleFavorite(word) {
    const favorites = getFavorites();
    const next = favorites.includes(word)
        ? favorites.filter(w => w !== word)
        : [...favorites, word];
    setFavorites(next);
    renderFavorites();
    updateSaveState();
}

/* ---------- fetching ---------- */
async function fetchWord(word) {
    containerEl.style.display = 'none';
    showMessage(`Searching the meaning of "${word}"...`);

    try {
        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        );

        if (response.status === 404) {
            showMessage(`Sorry, no definitions found for "${word}". Try another word.`);
            return;
        }
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const result = await response.json();
        if (!Array.isArray(result) || !result.length) {
            showMessage(`Sorry, no definitions found for "${word}".`);
            return;
        }
        renderEntry(result[0]);
    } catch (error) {
        console.error(error);
        showMessage('Something went wrong while fetching the meaning. Check your connection and try again.');
    }
}

/* ---------- events ---------- */
form.addEventListener('submit', event => {
    event.preventDefault();
    const word = inputEl.value.trim();
    if (!word) {
        showMessage('Please enter a word to search.');
        return;
    }
    if (!/^[a-zA-Z'-]+$/.test(word)) {
        showMessage('Please enter a single English word (letters only).');
        return;
    }
    fetchWord(word);
});

speakBtn.addEventListener('click', () => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
});

saveBtn.addEventListener('click', () => {
    if (currentWord) toggleFavorite(currentWord);
});

themeBtn.addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark');
    applyTheme(dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
});

/* ---------- init ---------- */
let savedTheme = null;
try { savedTheme = localStorage.getItem('theme'); } catch {}
applyTheme(savedTheme === 'dark');
renderFavorites();