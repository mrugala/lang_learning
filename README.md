# lang_learning

Lokalny zestaw aplikacji do nauki japońskich alfabetów i kanji, cyrylicy
cerkiewnosłowiańskiej, głagolicy, niemieckiego słownictwa oraz pisma Kurrent.
Projekt składa się ze statycznych stron HTML, CSS i JavaScript — nie wymaga
procesu budowania ani instalowania zależności pakietowych.

## Uruchomienie

Nie są wymagane Node.js, instalacja ani serwer. Otwórz `index.html` bezpośrednio
w przeglądarce. Pozostałe strony (`other-alphabets.html`, `kanji.html`,
`german.html` i `kurrent.html`) można otworzyć z poziomu nawigacji aplikacji
lub bezpośrednio z katalogu projektu.

Opcjonalnie, aby korzystać ze stron pod adresem `http://localhost:8731/`,
można uruchomić lokalny serwer za pomocą `node tools/serve.js`.

## Aplikacje

| Strona | Funkcje |
|---|---|
| [`index.html`](index.html) | Nauka hiragany lub katakany. Opcja „Kana rozszerzone” dodaje ゐ (wi) i ゑ (we) albo ich katakanowe odpowiedniki ヰ i ヱ do głównej tabeli i quizu. Tabele kana zawierają też osobne, zwijane tabele dakuon/handakuon i yōon. Quiz dakuon akceptuje warianty `zi`, `di` i `du` tam, gdzie pasują do znaku. Znaki wybiera się komórkami, grupami albo całościowo. Po odświeżeniu strony aktywne ćwiczenie kana lub czytania jest przywracane. Tryb czytania pozwala wybrać Momotarō albo czterorozdziałowe, autorskie streszczenie *Siostrzeńca królowej* (*The Queen's Nephew*) ks. Josepha Spillmanna. Przy historiach zawierających imiona obcego pochodzenia można włączyć ich zapis katakaną. Po każdym rozdziale można przejść do następnego, a po ostatnim wrócić do pierwszego. W wynikach można najechać na słowa hiragany, by zobaczyć ich zapis kanji i polskie znaczenie, a na partykuły — by wyświetlić ich funkcję; błędnie odczytane fragmenty są wyróżnione, a rozdział można powtórzyć. |
| [`other-alphabets.html`](other-alphabets.html) | Nauka cyrylicy cerkiewnosłowiańskiej i głagolicy (małe i wielkie litery wyświetlane parami, wybierane do quizu osobno). Głagolica obła i kanciasta używają tych samych znaków, ale różnych wariantów fontu. Podczas quizu dostępne są przyciski znaków specjalnych transliteracji z przełącznikiem wielkości liter. |
| [`kanji.html`](kanji.html) | Nauka kanji z kategorii podzielonych automatycznie na kolejne zestawy po maksymalnie 10 kategorii; słownictwo z opowiadań ma osobny zestaw (kolejne zestawy po maksymalnie 100 wpisów, w kategoriach po maksymalnie 10 słów), a zestaw „Kościół katolicki” pozostaje ostatni. Można ustawić, co jest wyświetlane i o co pyta quiz. Przy odpowiedzi kanji dostępny jest quiz wyboru z dystraktorami. Aktywna sesja jest przywracana po odświeżeniu strony. |
| [`german.html`](german.html) | Niemieckie słownictwo w kategoriach tematycznych. Kierunki nauki: niemiecki → polski, polski → niemiecki lub oba wymieszane. Wpisy mogą ćwiczyć osobno liczbę pojedynczą i mnogą; dostępne są przyciski dla ä, ö, ü i ß. Aktywna sesja jest przywracana po odświeżeniu strony. |
| [`kurrent.html`](kurrent.html) | Nauka małych i wielkich liter pisma Kurrent albo odczytywanie losowych niemieckich słów. Tryb słów korzysta ze wspólnej bazy słownictwa niemieckiego. Aktywna sesja jest przywracana po odświeżeniu strony. |

Wspólne elementy treningów to powtarzanie pytań, informacja zwrotna oraz wybór
czcionki. Wybrany styl czcionki jest zapamiętywany. Ustawienia zaznaczenia
i trybu oraz aktywne ćwiczenia we wszystkich podstronach są odtwarzane po
odświeżeniu karty. Strona kana pozwala dodatkowo
zapisać i wczytać postęp z pliku JSON. Po zakończeniu treningu można powtórzyć
tylko znaki lub słowa, przy których podczas bieżącej sesji popełniono błąd.

## Dane i kod

| Plik | Zawartość |
|---|---|
| [`kanji-data.js`](kanji-data.js) | Kategorie i wpisy kanji, znaczenia, odczyty oraz dystraktory używane przez quiz wyboru. |
| [`reading-vocabulary-data.js`](reading-vocabulary-data.js) | Słownictwo z opowiadań do czytania, używane w podpowiedziach po najechaniu i dodawane do zestawów kanji. |
| [`kana-data.js`](kana-data.js) | Znaki i transliteracje hiragany oraz katakany, układy tabel, warianty zapisu, znaczenia partykuł, zapisy imion oraz rozdziały do ćwiczeń czytania. |
| [`german-vocabulary-data.js`](german-vocabulary-data.js) | Niemieckie słowa, tłumaczenia, części mowy, liczby mnogie oraz opcjonalne zapisy Kurrent. |
| [`kurrent-data.js`](kurrent-data.js) | Zestawy liter Kurrent, w tym umlauty i ß. |
| [`app.js`](app.js) | Tabele i trening kana. |
| [`other-alphabets.js`](other-alphabets.js) | Dane, wybór i tabela alfabetów na stronie „Inne alfabety”. |
| [`alphabets-common.js`](alphabets-common.js) | Wspólny mechanizm treningu transliteracji używany przez strony alfabetów. |
| [`kanji-decks.js`](kanji-decks.js) | Wspólna funkcja automatycznie grupująca kategorie kanji w zestawy; używana przez aplikację i `check-decks.js`. |
| [`kanji.js`](kanji.js) | Wybór kategorii i trening kanji. |
| [`german-vocabulary.js`](german-vocabulary.js) | Trening niemieckiego słownictwa. |
| [`kurrent.js`](kurrent.js) | Trening liter i słów Kurrent. |
| [`common.js`](common.js) | Pomocniki współdzielone przez aplikacje, m.in. kolejka nauki i obsługa interfejsu. |
| [`style.css`](style.css) | Wspólne style stron. |

Font Shafarik jest używany lokalnie na stronie „Inne alfabety”: wariant
obły korzysta z domyślnych kształtów, a kanciasty z zestawu OpenType `ss03`.
Jest udostępniony na licencji SIL Open Font License 1.1; licencja znajduje
się w [`fonts/OFL-Shafarik.txt`](fonts/OFL-Shafarik.txt).

Tryb Kurrent pobiera słownictwo i kategorie z `german-vocabulary-data.js`,
aby nie utrzymywać drugiej kopii listy słów. Dane zawierają obecnie około
892 wpisy kanji w 91 kategoriach, 472 niemieckie hasła w 27 kategoriach
oraz 30 pozycji liter Kurrent w 9 grupach. Liczby mogą się zmieniać wraz
z rozbudową zestawów.

## Narzędzia deweloperskie

Skrypty kontrolne uruchamia się z katalogu projektu za pomocą Node.js:

```powershell
node tools/check-data-syntax.js
node tools/check-decks.js
node tools/check-vocab.js
node tools/check-kurrent-field.js
node tools/test-kurrent-rules.js
node tools/check-hiragana.js
node tools/check-kanji-words.js
node tools/check-romaji-answer.js
```

Kontrole kończą się kodem błędu, gdy wykryją nieprawidłowe dane lub nieudany
test. `check-decks.js` korzysta z tej samej funkcji generującej zestawy co
aplikacja Kanji. `check-data-syntax.js` sprawdza składnię skryptów JavaScript
i ładowanie plików danych.

`list-cats.js` i `list-vocab-cats.js` wypisują bieżące kategorie kanji
i słownictwa. `qa-kurrent.mjs` zawiera test przepływu przeglądarkowego
Kurrent i wymaga zgodnego runnera automatyzacji przeglądarki.
`gen-kurrent-field.js` generuje pole `kurrent` w bazie słownictwa i zapisuje
zmiany do `german-vocabulary-data.js`; uruchamiaj go tylko wtedy, gdy chcesz
ponownie wygenerować te dane.

## Czcionka Kurrent

`fonts/WiegelKurrent.ttf` — Wiegel Kurrent autorstwa Petera Wiegela, na
licencji SIL Open Font License 1.1. Treść licencji znajduje się w
[`fonts/OFL-Wiegel-Kurrent.txt`](fonts/OFL-Wiegel-Kurrent.txt).
