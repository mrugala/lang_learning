// Generator pola "kurrent" dla german-vocabulary-data.js.
//
// Reguły s wg kurrentschrift.net (Das Lang-s / Das Rund-s):
//
// Długie s (ſ) stoi:
//   - na początku wyrazu,
//   - na początku i w środku sylab,
//   - na końcu sylaby, o ile nie jest to zakończenie części składowej
//     złożenia z samodzielnych wyrazów (czyli Fugen-s),
//   - w sp, st, sch.
//
// Okrągłe s (s) stoi:
//   - jako s końcowe wyrazu,
//   - jako Fugen-s w złożeniach (także gdy następna część zaczyna się
//     od s, albo gdy po s jest sylaba zaczynająca się spółgłoską:
//     -lein, -chen, -mus, -bar),
//   - w obcych przedrożach dis/des oraz przed k, m, n, w, d.
//
// Świadomie nietknięte: "ss" (Doppel-s) i "ß". Font WiegelKurrent ma dla "ss"
// ligaturę podwójnego długiego s, ale nie zawiera tabeli GSUB, więc nie da się
// jej wywołać; "ß" ma własny glif i zapisujemy go jak jest.
const fs = require("fs");

// Das ß. Strona podaje pięć położeń (kurrentschrift.net, regeln~sz):
//   - am Ende des Wortes:      muß, naß, Biß, Haß
//   - am Ende der Silbe:        häßlich, unfaßbar, vergeßlich
//   - vor einem Konsonanten:    laßt, haßt, wißt, verpaßt, verläßlich
//   - nach langem Vokal:        grüßen, Straße, fließen, schließen
//   - nach Doppellaut:          heißen, außen, scheußlich
// U naszej bazy trafia się warunek pierwszy (ss na końcu wyrazu), bo pozostałe
// wyrazy są albo zapisane dziś z ß, albo mają "ss" w środku wyrazu, gdzie
// zgodnie z Das Doppel-s stoi "ſſ" (Waſſer, Taſſe, Kiſſen).

// Wyrazy, w których "ss" to NIE Doppel-s, tylko Fugen-s (okrągłe) + długie s.
// Nie da się tego rozpoznać mechanicznie: "Taſſe" (ss między samogłoskami)
// i "Ausſicht" (Aus + sicht) wyglądają identycznie, a różni je granica
// słowotwórcza. Takie wyrazy muszą być wypisane.
const SS_NOT_DOPPEL = new Set([
    "Aussicht",    // Aus + sicht
    "Bimsstein"    // Bims + stein
]);

// Das Doppel-s ("Waſſer", "Taſſe") to dwa DŁUGIE s, a nie dwa okrągłe.
// Strona podaje je dla krótki samogłoska + samogłoska (Waſſer, Taſſe),
// dla wypadniętego e (laſſ), dla odmiany na -as, -is, -nis, -us (Buſſes)
// oraz w obcach z Lautangleichung (Aſſiſtent).
// Uwaga: "ss" na końcu wyrazu obsługuje osobna reguła Das ß (patrz wyżej).
function isDoppelS(chars, i, word) {
    if (SS_NOT_DOPPEL.has(word)) return false;
    const vowel = c => c !== undefined && "aeiouyäöüAEIOUYÄÖÜ".includes(c);
    if (!vowel(chars[i - 1])) return false;

    // po ss może być samogłoska albo wypadnięte e ("laſſ").
    const next = chars[i + 2];
    return vowel(next) || next === "e";
}

// Fugen-s siedzi w konkretnym miejscu wyrazu, a nie przy każdym s. Podajemy
// indeksy znaków s, które są okrągłe mimo że nie zamykają wyrazu. Wartość
// może być liczbą albo tablicą, gdy okrągłych s jest kilka.
//
// UWAGA na rozróżnienie dwóch różnych s w złożeniach:
//
//  1. Fugen-s ("als Fugen-s in Zusammensetzungen vor dem anschließend
//     folgenden sonst selbständigen Teilwort") - wstawiane, gdy następny
//     człon zaczyna się spółgłoską (Tag, Stock, Blei) albo gdy zaczyna się
//     od s (sicht, stein). Jest OKRĄGŁE. Przykłady ze strony: Donnerstag,
//     Geburtstag, Königsberg, Ludwigshafen, Haustür, lostreten, deswegen,
//     Aussicht, Wirtsstube, Bimsstein. Do tego -lein/-chen/-mus/-bar, gdzie
//     Fugen-s stoi przed spółgłoskową nagłoską: Häuslein, Mäuschen,
//     Wachstum, nachweisbar, Realismus, Weisheit.
//
//  2. s należące do CZŁONU złożenia i stojące na początku sylaby lub w
//     sp/st/sch - wtedy DŁUGIE: Hand+Schuh = Handſchuh (s z "Schuh"),
//     Blei+Stift = Bleiſtift, Ruck+Sack = Ruckſack.
//
// Ta lista to wyłącznie Fugen-s z punktu 1. Wyrazy typu Handschuh czy
// Rucksack NIE należą tu - ich s pochodzi z członu zaczynającego się od s.
const FUGEN_S_INDEX = {
    "Dienstag": 4, "Dienstage": 4,               // Dienst + Tag
    "Samstag": 3, "Samstage": 3,                 // Sam + Tag
    "Donnerstag": 6, "Donnerstage": 6,           // Donner + Tag
    "Geburtstag": 6, "Geburtstage": 6,           // Geburt + Tag
    "Haustür": 3,                                 // Haus + Tür (wstawiane s)
    "Häuschen": 3,                                // Häus + chen
    "deswegen": 4,                                // des + wegen
    "Eispalast": [2, 7],                          // Eis + Palast
    "boshaft": 2,                                 // bos + haft
    "Kirche": 3,                                  // Kirche + ...
    "Kirchenlied": 6,                             // Kirche + Lied
    "Gottesdienst": 4, "Gottesdienste": 4,        // Gott + esdienst
    "Schultasche": 7, "Schultaschen": 7,         // Schul + Tasche
    "Schulranzen": 5,                             // Schul + ranzen
    "Osterkommunion": 5, "Osterkommunionen": 5,   // Oster + Kommunion
    "Ersthkommunion": 4, "Ersthkommunionen": 4,   // Erst + Kommunion
    "Krankensalbung": 7, "Krankensalbungen": 7,   // Kranken + Salbung
    "Papierschere": 6, "Papierscheren": 6,         // Papier + Schere
    "Bastelschere": 6, "Bastelscheren": 6,         // Bastel + Schere
    "Obstsorten": 4,                            // Obst + Sorten
    // Fugen-s + wyraz zaczynający się od s -> "sſ"
    "Aussicht": 2,                                // Aus + sicht
    "Bimsstein": 3,                               // Bims + stein
    "dasselbe": 2                                 // da + s + selbe
};

// Zbiór indeksów s będących Fugen-s w danym wyrazie (pusty, gdy takich nie ma).
const fugenSIndices = new Map();
Object.entries(FUGEN_S_INDEX).forEach(([word, idx]) => {
    fugenSIndices.set(word, new Set([].concat(idx)));
});

// Zapisuje pojedynczy wyraz (bez rodzajnika, bez spacji).
function kurrentWord(word) {
    const chars = [...word];
    const out = [];
    // Fugen-s występuje wtedy i tylko wtedy, gdy wyraz ma wpisany indeks
    // w FUGEN_S_INDEX - to jedno źródło prawdy dla listy i pozycji.
    const isFugen = fugenSIndices.has(word);

    // W obcych przedrożach dis i des stoi okrągłe s (Desinfektion, deshalb).
    const desPrefix = /^(dis|des)/.test(word) ? 3 : 0;

    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (ch !== "s") {
            out.push(ch);
            continue;
        }

        // Fugen-s -> okrągłe s. Dotyczy TYLKO wskazanego s na granicy złożenia, a
        // nie każdego s w wyrazie. Sprawdzamy PRZED regułą Doppel-s, bo w
        // "Ausſicht" okrągłe jest pierwsze s, a drugie już długie - inaczej
        // para "ss" została by pochłonięta jako Doppel-s.
        if (isFugen && fugenSIndices.get(word).has(i)) {
            out.push("s");
            // Przesuwamy się o 1, bo po Fugen-s może zaraz stać kolejne s
            // ("Aus" + "sicht"), które samo podlega dalszym regułom.
            continue;
        }

        // Doppel-s: dwa długie s obok siebie, przepisane za jednym zamachem.
        // Wyjątek: "ss" na końcu wyrazu to nie Doppel-s, lecz ß (Das ß:
        // "am Ende des Wortes", np. Fluß, Fluſſ -> Fluß).
        if (chars[i + 1] === "s" && i === chars.length - 2) {
            out.push("ß");
            i += 1;
            continue;
        }
        if (chars[i + 1] === "s" && isDoppelS(chars, i, word)) {
            out.push("ſ", "ſ");
            i += 1;
            continue;
        }

        const next = chars[i + 1];

        // s przed k, m, n, w, d -> okrągłe s
        if (next && "kmnwd".includes(next)) {
            out.push("s");
            continue;
        }
        // s w przedrożu dis/des -> okrągłe s
        if (i === 2 && desPrefix === 3) {
            out.push("s");
            continue;
        }
        // s końcowe wyrazu -> okrągłe s
        if (i === chars.length - 1) {
            out.push("s");
            continue;
        }
        // sp, st -> długie s
        if (next === "p" || next === "t") {
            out.push("ſ");
            continue;
        }
        // sch -> długie s
        if (next === "c" && chars[i + 2] === "h") {
            out.push("ſ");
            continue;
        }
        // pozostałe: początek wyrazu, środek sylaby, koniec sylaby bez
        // granicy złożenia -> długie s
        out.push("ſ");
    }

    return out.join("");
}

// Wyrazy są wielowyrazowe ("der Heilige Geist"), więc konwertujemy każdą
// część osobno - inaczej rodzajnik "das" dostałby długie s.
function toKurrent(form) {
    return form.split(" ").map(kurrentWord).join(" ");
}

const path = "german-vocabulary-data.js";
const text = fs.readFileSync(path, "utf8");

// Usuwamy wcześniej wygenerowane pole, żeby skrypt mógł działać wielokrotnie
// po zmianie reguł. Baza zawsze wraca do stanu wyjściowego + świeże pole.
const stripped = text.replace(/,?\s*kurrent: \{[^}]*\}\s*(?=,| \})/g, m => {
    // przed polem zostaje przecinek, po nim już nie - usuwamy oba warianty
    return m.trimStart().startsWith(",") ? " " : "";
});
if (stripped !== text) {
    console.log("usunąłem wcześniejsze pole kurrent przed ponownym wstrzyknięciem");
}

global.window = {};
require("../" + path);
const items = window.germanVocabularyCategories.flatMap(c => c.items);

const forms = [];
items.forEach(i => {
    forms.push(i.de);
    if (i.plural) forms.push(i.plural);
});
const unique = [...new Set(forms)].sort();

console.log("=== zapis kurrentowy (tylko formy zmienione) ===\n");
unique.forEach(f => {
    const k = toKurrent(f);
    if (k !== f) console.log(`  ${f.padEnd(24)} -> ${k}`);
});

console.log("\n=== bez zmian ===");
unique.filter(f => toKurrent(f) === f).forEach(f => console.log("  " + f));

// --- wstrzyknięcie pola do bazy ------------------------------------------
// Pole "kurrent" trzyma zapis kurrentowy formy: { de, plural? }. Trener
// Kurrent pokazuje glif i oczekuje transkrypcji, więc para (glif, odpowiedź)
// musi się zgadzać co do glifu - inaczej pytanie byłoby nie do odpowiedzenia.
// Wpisujemy tylko formy, które faktycznie się różnią od współczesnego zapisu
// (np. "der Fiſch"), żeby nie mnożyć szumu w danych. Obecność pola przy
// pozycji oznacza, że trener ma z niej korzystać; brak = zapis klasyczny.
const proposal = Object.fromEntries(unique.map(f => [f, toKurrent(f)]));
let written = 0;

const lines = stripped.split("\n").map(line => {
    // Dopasowujemy tylko wiersze z wpisami (mają "de:" na początku obiektu).
    const m = line.match(/^(\s*)\{ de: "([^"]+)"/);
    if (!m) return line;

    const indent = m[1];
    const de = m[2];
    // reszta wpisu, aż do zamykającego nawiasu. Ostatni element listy nie ma
    // przecinka za sobą, więc zapamiętujemy go osobno i dokładamy z powrotem.
    const tail = line.match(/(\},?)\s*$/);
    const afterDe = line.slice(m[0].length);
    const rest = afterDe.slice(0, afterDe.length - (tail ? tail[0].length : 0)).trimEnd();
    const suffix = tail ? tail[1] : "}";
    // po ostatnim polu (np. "plural_pl") trzeba dopisać przecinek
    const separator = rest.endsWith(",") ? " " : ", ";
    const plural = rest.match(/plural: "([^"]+)"/);
    const kDe = proposal[de];
    const kPlural = plural ? proposal[plural[1]] : null;

    const changedDe = kDe && kDe !== de;
    const changedPlural = kPlural && plural && kPlural !== plural[1];
    if (!changedDe && !changedPlural) return line;

    written++;
    const kurrentParts = [];
    if (changedDe) kurrentParts.push(`de: "${kDe}"`);
    if (changedPlural) kurrentParts.push(`plural: "${kPlural}"`);
    return `${indent}{ de: "${de}"${rest}${separator}kurrent: { ${kurrentParts.join(", ")} } ${suffix}`;
});

// Nagłówek pliku opisujący format pola "kurrent". Trzymamy go tutaj, żeby
// przetrwał ponowne wygenerowanie danych.
const HEADER = `// Baza słownictwa niemieckiego dla trenera słów.
//
// Opcjonalne pole "kurrent" trzyma zapis kurrentowy formy: { de, plural? }.
// Trener Kurrent pokazuje tę formę jako glif, a odpowiedzią jest transkrypcja
// we współczesnej ortografii ("der Fiſch" -> "der Fisch", "Waſſer" -> "Wasser").
// Zasady doboru długiego (ſ) i okrągłego (s) s opisuje tools/gen-kurrent-field.js,
// który wygenerował to pole na podstawie kurrentschrift.net. Brak pola oznacza,
// że forma zapisuje się tak samo jak współczesnie.
`;

const out = HEADER + lines.join("\n").replace(/^\/\/[^\n]*\n(\/\/[^\n]*\n)*/, "");
fs.writeFileSync(path, out);
console.log(`dopisano pole kurrent do ${written} pozycji`);
// Wartość to oczekiwany zapis (długie s = ſ), zweryfikowany wizualnie
// wobec obrazków na stronie. Wyrazy spoza bazy traktujemy tylko jako
// test funkcji kurrentWord, więc wołamy ją wprost.
// W "ss" zapisujemy oba znaki tak jak są (brak GSUB w foncie), więc
// oczekiwane wartości dla Doppel-s i dla dwóch osobnych s są takie same -
// różni je Fugen-s w danym wyrazie.
const CASES = {
    // Das Lang-s
    "so": "ſo",
    "sind": "ſind",
    "sieben": "ſieben",
    "sausen": "ſauſen",
    "wünschen": "wünſchen",
    "erstaunen": "erſtaunen",   // jedyne s zaczyna sylabę: er-ſtau-nen
    "Wunsch": "Wunſch",
    "einst": "einſt",
    "Wasser": "Waſſer",        // Doppel-s
    "müssen": "müſſen",        // Doppel-s
    "Knospe": "Knoſpe",
    "fast": "faſt",
    "löschen": "löſchen",
    "Desinfektion": "Deſinfektion",
    "Mesner": "Mesner",        // s przed n -> Rund-s
    "Dresden": "Dresden",
    "Oswald": "Oswald",

    // Das Rund-s
    "das": "das",
    "Haus": "Haus",
    "des": "des",
    "Landes": "Landes",
    "Preis": "Preis",
    "Glastür": "Glaſtür",
    "Häuschen": "Häuschen",
    "Eispalast": "Eispalast",
    "deshalb": "deshalb",
    "boshaft": "boshaft",
    "Geburtstag": "Geburtstag",
    "Haustür": "Haustür",
    "deswegen": "deswegen",

    // Das Doppel-s to dwa długie s: "Taſſe", "Waſſer", "Addreſſe".
    "Adresse": "Addreſſe",
    "Tasse": "Taſſe",
    "vergessen": "vergeſſen",
    "lass": "laſſ",
    "Zeugnisses": "Zeugniſſes",
    "Busses": "Buſſes",
    "Assistent": "Aſſiſtent",   // s przed i -> długie; dalsze "ss" to Doppel-s
    // Doppel-s, gdy po nim nie ma samogłoski: s kończy wyraz.
    "Fluss": "Fluſſ",
    "Essen": "Eſſen",
    "Weihrauchfass": "Weihrauchfaſſ",
    // Uwaga: to nie Doppel-s, tylko zwykłe długie s.
    "Gasse": "Gaſſe",
    "fassen": "faſſen",
    "Aussicht": "Ausſicht",
    "Bimsstein": "Bimsſtein",
    "dasselbe": "daſſelbe"
};

console.log("\n=== sprawdzenie na przykładach ze strony ===");
let failed = 0;
Object.entries(CASES).forEach(([word, want]) => {
    const got = kurrentWord(word);
    if (got !== want) {
        failed++;
        console.log(`  FAIL ${word}: otrzymano "${got}", oczekiwano "${want}"`);
    }
});
console.log(`  ${Object.keys(CASES).length} przypadków, ${failed} błędów`);