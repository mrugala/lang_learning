# lang_learning

Lokalny zestaw aplikacji do nauki japońskich alfabetów i kanji, niemieckiego
słownictwa oraz pisma Kurrent. Projekt składa się ze statycznych stron HTML,
CSS i JavaScript — nie wymaga procesu budowania ani instalowania zależności
pakietowych.

## Uruchomienie

Nie są wymagane Node.js, instalacja ani serwer. Otwórz `index.html` bezpośrednio
w przeglądarce. Pozostałe strony (`kanji.html`, `german.html` i `kurrent.html`)
można otworzyć z poziomu nawigacji aplikacji lub bezpośrednio z katalogu projektu.

Opcjonalnie, aby korzystać ze stron pod adresem `http://localhost:8731/`,
można uruchomić lokalny serwer za pomocą `node tools/serve.js`.

## Aplikacje

| Strona | Funkcje |
|---|---|
| [`index.html`](index.html) | Nauka hiragany lub katakany. Tabela zawiera podstawowe kana oraz osobne, zwijane tabele dakuon/handakuon i yōon. Znaki wybiera się komórkami, wierszami lub kolumnami. |
| [`kanji.html`](kanji.html) | Nauka kanji z kategorii podzielonych automatycznie na kolejne zestawy po maksymalnie 10 kategorii; zestaw „Kościół katolicki” jest zawsze ostatni. Można ustawić, co jest wyświetlane i o co pyta quiz. Przy odpowiedzi kanji dostępny jest quiz wyboru z dystraktorami. |
| [`german.html`](german.html) | Niemieckie słownictwo w kategoriach tematycznych. Kierunki nauki: niemiecki → polski, polski → niemiecki lub oba wymieszane. Wpisy mogą ćwiczyć osobno liczbę pojedynczą i mnogą; dostępne są przyciski dla ä, ö, ü i ß. |
| [`kurrent.html`](kurrent.html) | Nauka małych i wielkich liter pisma Kurrent albo odczytywanie losowych niemieckich słów. Tryb słów korzysta ze wspólnej bazy słownictwa niemieckiego. |

Wspólne elementy treningów to powtarzanie pytań, informacja zwrotna oraz wybór
czcionki. Wybrany styl czcionki jest zapamiętywany. Ustawienia zaznaczenia
i trybu są odtwarzane po odświeżeniu karty. Strona kana pozwala dodatkowo
zapisać i wczytać postęp z pliku JSON.

## Dane i kod

| Plik | Zawartość |
|---|---|
| [`kanji-data.js`](kanji-data.js) | Kategorie i wpisy kanji, znaczenia, odczyty oraz dystraktory używane przez quiz wyboru. |
| [`german-vocabulary-data.js`](german-vocabulary-data.js) | Niemieckie słowa, tłumaczenia, części mowy, liczby mnogie oraz opcjonalne zapisy Kurrent. |
| [`kurrent-data.js`](kurrent-data.js) | Zestawy liter Kurrent, w tym umlauty i ß. |
| [`app.js`](app.js) | Tabele i trening kana. |
| [`kanji.js`](kanji.js) | Wybór kategorii, generowanie zestawów i trening kanji. |
| [`german-vocabulary.js`](german-vocabulary.js) | Trening niemieckiego słownictwa. |
| [`kurrent.js`](kurrent.js) | Trening liter i słów Kurrent. |
| [`common.js`](common.js) | Pomocniki współdzielone przez aplikacje, m.in. kolejka nauki i obsługa interfejsu. |
| [`style.css`](style.css) | Wspólne style stron. |

Tryb Kurrent pobiera słownictwo i kategorie z `german-vocabulary-data.js`,
aby nie utrzymywać drugiej kopii listy słów. Dane zawierają obecnie około
890 wpisów kanji w 91 kategoriach, 472 niemieckie hasła w 27 kategoriach
oraz 30 pozycji liter Kurrent w 9 grupach. Liczby mogą się zmieniać wraz
z rozbudową zestawów.

## Narzędzia deweloperskie

Skrypty uruchamia się z katalogu projektu za pomocą Node.js:

```powershell
node tools/check-data-syntax.js
node tools/check-vocab.js
node tools/check-kurrent-field.js
node tools/test-kurrent-rules.js
node tools/check-hiragana.js
node tools/check-kanji-words.js
```

`list-cats.js` i `list-vocab-cats.js` wypisują kategorie danych. `gen-kurrent-field.js`
jest generatorem pola zapisu Kurrent w bazie słownictwa.

## Czcionka Kurrent

`fonts/WiegelKurrent.ttf` — Wiegel Kurrent autorstwa Petera Wiegela, na
licencji SIL Open Font License 1.1. Treść licencji znajduje się w
[`fonts/OFL-Wiegel-Kurrent.txt`](fonts/OFL-Wiegel-Kurrent.txt).
