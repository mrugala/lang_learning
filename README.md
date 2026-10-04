# lang_learning

Aplikacje do nauki języków i pism, jako statyczne strony (bez buildu).

## Uruchomienie

    node tools/serve.js

i otwórz `http://localhost:8731/`.

## Aplikacje

| Plik | Zawartość |
|---|---|
| `index.html` | hiragana / katakana |
| `kanji.html` | kanji, 5 zestawów (deck 5 = Kościół katolicki) |
| `kurrent.html` | pismo Kurrent: litery, umlauty, eszett, słowa niemieckie |

Wspólny kod: `common.js` (kolejka nawracania, normalizacja odpowiedzi,
helpery UI), `style.css`.

## Dane

| Plik | Zawartość |
|---|---|
| `kanji-data.js` | 446 kanji w 44 kategoriach |
| `kurrent-data.js` | 30 liter + 174 rzeczowniki w 16 zestawach |

## Narzędzia

    node tools/check-kurrent-data.js   # walidacja danych Kurrent
    node tools/check-decks.js          # walidacja kategorii i decków kanji
    node tools/list-cats.js            # lista kategorii kanji

Test przepływu nauki Kurrent (wymaga uruchomionego serwera):

    node "C:\Users\Dell\.codegpt\skills\browser-automation\browser.mjs" \
        http://localhost:8731/kurrent.html --script tools/qa-kurrent.mjs

## Czcionka

`fonts/WiegelKurrent.ttf` — Wiegel Kurrent by Peter Wiegel, licencja
SIL OFL 1.1 (`fonts/OFL-Wiegel-Kurrent.txt`).