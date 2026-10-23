# lang_learning

Lokalny zestaw aplikacji do nauki japońskich alfabetów i kanji, cyrylicy
cerkiewnosłowiańskiej, głagolicy, niemieckiego słownictwa oraz pisma Kurrent.
Projekt składa się ze statycznych stron HTML, CSS i JavaScript — nie wymaga
procesu budowania ani instalowania zależności pakietowych.

## Uruchomienie

Nie są wymagane Node.js, instalacja ani serwer. Otwórz `index.html` bezpośrednio
w przeglądarce. Pozostałe strony (`other-alphabets.html`, `kanji.html`,
`german.html`, `kurrent.html` i `flashcards.html`) można otworzyć z poziomu
nawigacji aplikacji lub bezpośrednio z katalogu projektu.

Opcjonalnie, aby korzystać ze stron pod adresem `http://localhost:8731/`,
można uruchomić lokalny serwer za pomocą `node tools/serve.js`.

## Aplikacje

| Strona | Funkcje |
| --- | --- |
| [`index.html`](index.html) | Nauka hiragany lub katakany. Opcja „Kana rozszerzone” dodaje ゐ (wi) i ゑ (we) albo ich katakanowe odpowiedniki ヰ i ヱ do głównej tabeli i quizu. Tabele kana zawierają też osobne, zwijane tabele dakuon/handakuon i yōon. Quiz dakuon akceptuje warianty `zi`, `di` i `du` tam, gdzie pasują do znaku. Znaki wybiera się komórkami, grupami albo całościowo. Po odświeżeniu strony aktywne ćwiczenie kana lub czytania jest przywracane. Po zakończeniu quizu pole odpowiedzi zostaje ukryte; ponowienie nauki przywraca je. Tryb czytania pozwala wybrać Momotarō, oryginalną opowieść dla początkujących „Mika uczy się japońskiego” albo czterorozdziałowe, autorskie streszczenie *Siostrzeńca królowej* (*The Queen's Nephew*) ks. Josepha Spillmanna. Przy historiach zawierających imiona obcego pochodzenia można wybrać ich zapis hiraganą lub katakaną. Nad słowami i imionami w wynikach rysowany jest diagram akcentu wysokościowego (dla imion z `readingCharacterNames` — o ile mają zapisany `pitch`). Każdy werset ma własne tłumaczenie; po każdym rozdziale można przejść do następnego, a po ostatnim wrócić do pierwszego. W wynikach można najechać na słowa kana, by zobaczyć ich zapis kanji i polskie znaczenie (imiona z opowiadań mają zamiast tego swoją polską pisownię), a na partykuły — by wyświetlić ich funkcję; nad słowami i imionami ze znanym akcentem rysowany jest schemat akcentu wysokościowego, błędnie odczytane fragmenty są wyróżnione, a rozdział można powtórzyć. |
| [`other-alphabets.html`](other-alphabets.html) | Nauka cyrylicy cerkiewnosłowiańskiej i głagolicy (małe i wielkie litery wyświetlane parami, wybierane do quizu osobno). Głagolica obła i kanciasta używają tych samych znaków, ale różnych wariantów fontu. Podczas quizu dostępne są przyciski znaków specjalnych transliteracji z przełącznikiem wielkości liter. |
| [`kanji.html`](kanji.html) | Nauka kanji z kategorii podzielonych automatycznie na kolejne zestawy po maksymalnie 10 kategorii; słownictwo z opowiadań ma osobny zestaw (kolejne zestawy po maksymalnie 100 wpisów, w kategoriach po maksymalnie 10 słów), a zestaw „Kościół katolicki” pozostaje ostatni. Można ustawić, co jest wyświetlane i o co pyta quiz. Przy odpowiedzi kanji dostępny jest quiz wyboru z dystraktorami. Aktywna sesja jest przywracana po odświeżeniu strony. |
| [`german.html`](german.html) | Niemieckie słownictwo w kategoriach tematycznych. Kierunki nauki: niemiecki → polski, polski → niemiecki lub oba wymieszane. Wpisy mogą ćwiczyć osobno liczbę pojedynczą i mnogą; dostępne są przyciski dla ä, ö, ü i ß. Aktywna sesja jest przywracana po odświeżeniu strony. |
| [`kurrent.html`](kurrent.html) | Nauka małych i wielkich liter pisma Kurrent albo odczytywanie losowych niemieckich słów. Tryb słów korzysta ze wspólnej bazy słownictwa niemieckiego. Aktywna sesja jest przywracana po odświeżeniu strony. |
| [`flashcards.html`](flashcards.html) | Własne fiszki wczytywane z pliku `.json` wybranego przez użytkownika. Plik to lista kategorii (`name` + `flashcards`), a każda fiszka to obiekt z dokładnie dwoma polami nazwanymi dwuliterowym kodem języka (np. `pl`, `de`, `en`) i słowem jako wartością; wszystkie fiszki w pliku muszą używać tej samej pary kodów. Kierunek nauki (A→B, B→A albo oba wymieszane) jest wykrywany automatycznie z wczytanych danych. Wartość pola może zawierać kilka zaakceptowanych zapisów rozdzielonych „ / ” (np. `"jajko / jajo"`). Wczytany plik, wybór kategorii i aktywna sesja są przywracane po odświeżeniu strony. Przykładowy plik: [`flashcards-sample.json`](flashcards-sample.json). |

Wspólne elementy treningów to powtarzanie pytań, informacja zwrotna oraz wybór
czcionki. Wybrany styl czcionki jest zapamiętywany. Ustawienia zaznaczenia
i trybu oraz aktywne ćwiczenia we wszystkich podstronach są odtwarzane po
odświeżeniu karty. Strona kana pozwala dodatkowo
zapisać i wczytać postęp z pliku JSON. Po zakończeniu treningu można powtórzyć
tylko znaki lub słowa, przy których podczas bieżącej sesji popełniono błąd.

## Dane i kod

| Plik | Zawartość |
| --- | --- |
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
| [`flashcards.js`](flashcards.js) | Wczytywanie, walidacja i trening własnych fiszek z pliku `.json`. |
| [`flashcards-sample.json`](flashcards-sample.json) | Przykładowy plik fiszek (pl/de) do wczytania na stronie „Fiszki”. |
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
node tools/check-hiragana.js
node tools/check-kanji-words.js
node tools/check-romaji-answer.js
```

Kontrole kończą się kodem błędu, gdy wykryją nieprawidłowe dane lub nieudany
test. `check-decks.js` korzysta z tej samej funkcji generującej zestawy co
aplikacja Kanji. `check-data-syntax.js` sprawdza składnię skryptów JavaScript
i ładowanie plików danych.

Testy jednostkowe znajdują się w katalogu `test/` i korzystają z wbudowanego
w Node.js runnera testów (bez instalowania zależności):

```powershell
node --test
```

`test/common-helpers.test.js` sprawdza czyste funkcje pomocnicze z `common.js`
(kolejka powtórek z bonusem za serię, akceptowane odpowiedzi, normalizacja
tekstu i rōmaji). `test/kurrent-rules.test.js` sprawdza reguły zapisu
kurrentowego z `tools/gen-kurrent-field.js`.

`list-cats.js` i `list-vocab-cats.js` wypisują bieżące kategorie kanji
i słownictwa.
`gen-kurrent-field.js` generuje pole `kurrent` w bazie słownictwa i zapisuje
zmiany do `german-vocabulary-data.js`; uruchamiaj go tylko wtedy, gdy chcesz
ponownie wygenerować te dane.
`gen-ojad-csv.js` eksportuje słówka z `reading-vocabulary-data.js` do
`ojad-lookup.csv` (10 słów w wierszu) do wklejenia w wyszukiwarkę OJAD.
`fetch-ojad-pitch.js` i `fetch-ojad-phrasing-pitch.js` pobierają akcent
wysokościowy bezpośrednio z OJAD (słownik oraz, dla słów spoza słownika,
estymator ML „Suzuki-kun") i tylko raportują różnice względem pola `pitch`
w `reading-vocabulary-data.js` — nie nadpisują danych automatycznie.
`fetch-ojad-pitch-kanji.js` i `fetch-ojad-phrasing-pitch-kanji.js` robią to
samo dla `kanji-data.js`. `fetch-ojad-pitch-names.js` pobiera akcent imion
występujących w opowiadaniach (`readingCharacterNames` w `kana-data.js`),
których celowo nie ma w `reading-vocabulary-data.js` — ten plik zasila zestawy
kanji — i porównuje wynik z wartością zapisaną przy imieniu.
`check-against-kanjium.js` dodatkowo porównuje
wpisy o niższej pewności (`pitchSource` `estimated`/`guess`) z otwartą bazą
Kanjium (zob. licencja niżej) i tylko raportuje różnice.

## Źródła danych o akcencie wysokościowym

Pole `pitch` w `reading-vocabulary-data.js` i `kanji-data.js` oraz przy imionach
w `readingCharacterNames` (`kana-data.js`) pochodzi z:
[OJAD](https://www.gavo.t.u-tokyo.ac.jp/ojad/) (University of Tokyo;
`pitchSource: "ojad"` dla słownika, `"estimated"` dla estymatora ML
Suzuki-kun) oraz z bazy [Kanjium](https://github.com/mifunetoshiro/kanjium)
autorstwa Uros O. (`pitchSource: "kanjium"`), udostępnionej na licencji
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Wpisy bez
żadnego z tych źródeł mają `pitchSource: "guess"` (nie zweryfikowane).

## Źródła tekstów do czytania

Japoński tekst modlitw różańcowych (historia "Modlitwy różańcowe" w
ćwiczeniu czytania hiragany) pochodzi ze strony
[seibo-archive.com — "Prayers of the Rosary in Japanese"](https://seibo-archive.com/english-pages-by-a-japanese-catholic/prayers-of-the-rosary-in-japanese/).
Dodane tam słówka zostały zweryfikowane narzędziami opisanymi wyżej
(`fetch-ojad-pitch.js`, `fetch-ojad-phrasing-pitch.js`,
`check-against-kanjium.js`); kilkanaście archaicznych/rzadkich wyrazów,
których nie znaleziono w żadnym źródle, zostało z `pitchSource: "guess"`.

## Czcionka Kurrent

`fonts/WiegelKurrent.ttf` — Wiegel Kurrent autorstwa Petera Wiegela, na
licencji SIL Open Font License 1.1. Treść licencji znajduje się w
[`fonts/OFL-Wiegel-Kurrent.txt`](fonts/OFL-Wiegel-Kurrent.txt).
