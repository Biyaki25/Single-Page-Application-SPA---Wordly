# Wordly Dictionary

A single page application (SPA) built with HTML, CSS, and JavaScript. Users can search for an English word and see its definitions, pronunciation, synonyms, and source, all without reloading the page.

**Author:** Daniel Nyamongo Kamanda
**Live demo:** https://YOUR-USERNAME.github.io/wordly-dictionary/ *(if you enable GitHub Pages)*

## Features

- **Word search** using an HTML form (submit with the Search button or Enter)
- **Definitions** grouped by part of speech, with example usage when available
- **Synonyms** for each meaning
- **Pronunciation** as phonetic text plus audio playback
- **Source link** to the dictionary entry
- **Favorites**: save words, click a saved word to search it again, or remove it. Favorites persist between visits using `localStorage`
- **Highlighting**: saved words get a gold highlight, applied by JavaScript
- **Theme toggle**: switch between light and dark mode. The choice is remembered
- **Error handling**:
  - empty input
  - non-letter input
  - word not found (404)
  - server or network failure
  - missing audio
- **Responsive design** that works on phone-width screens

## API

Uses the [Free Dictionary API](https://dictionaryapi.dev/):

```
GET https://api.dictionaryapi.dev/api/v2/entries/en/<word>
```

Fields used from the response:

| Field | Used for |
|---|---|
| `word` | Title |
| `phonetic` / `phonetics[].text` | Pronunciation text |
| `phonetics[].audio` | Audio playback |
| `meanings[].partOfSpeech` | Section headings |
| `meanings[].definitions[].definition` / `.example` | Definitions and examples |
| `meanings[].synonyms` / `definitions[].synonyms` | Synonyms |
| `sourceUrls` | Source link |

## How It Works

1. The form's `submit` event is intercepted with `preventDefault()`, so the page never reloads.
2. The input is validated, then `fetch()` requests the word from the API.
3. The JSON response is rendered into the DOM with `createElement` and `textContent`.
4. Audio tries each recording the API provides. If none load, it falls back to the browser's built-in speech voice (`speechSynthesis`).
5. Favorites and the theme are stored in `localStorage` and restored on page load.

## Project Structure

```
wordly-dictionary/
├── index.html   # page structure
├── style.css    # styling, dark theme, responsive layout
├── script.js    # fetch, DOM updates, events, favorites
└── README.md
```

## Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/wordly-dictionary.git
   cd wordly-dictionary
   ```
2. Open `index.html` in a browser, or serve the folder:
   ```bash
   python3 -m http.server 8000
   ```
   then visit `http://localhost:8000`. The VS Code **Live Server** extension also works.

## Testing

| Test | Expected result |
|---|---|
| Search `hello` | Definitions, phonetics, audio, synonyms, source |
| Search `asdfgh` | "No definitions found" message |
| Submit empty input | "Please enter a word" message |
| Search `123` | "Letters only" message |
| Go offline and search | Network error message |
| Save a word, reload the page | The word is still in Favorites |
| Toggle theme, reload | The theme is remembered |
| Resize to about 360px wide | No horizontal scrolling |

## Known Limitations

- The API's audio files are sometimes unavailable (for example, a 502 error). The app then tries other recordings and finally uses the browser's voice.
- Only the first entry returned for a word is shown, and at most three definitions per part of speech.
- English words only. The API doesn't support phrases.

## Possible Improvements

- Show all entries for words with multiple origins
- Make synonyms clickable to search them
- Add search history
- Add keyboard shortcuts

## Credits

- [Free Dictionary API](https://dictionaryapi.dev/)