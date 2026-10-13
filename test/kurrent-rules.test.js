// Testy jednostkowe reguł zapisu kurrentowego, bez dotykania bazy.
// Wycinamy same reguły z generatora i wołamy kurrentWord bezpośrednio.
// Używa wbudowanego w Node.js runnera testów - bez instalowania zależności.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "tools", "gen-kurrent-field.js"), "utf8");

const start = src.indexOf("const SS_NOT_DOPPEL");
const end = src.indexOf("// Wyrazy są wielowyrazowe");
if (start < 0 || end < 0) {
    throw new Error("nie znaleziono sekcji reguł w gen-kurrent-field.js");
}

const kurrentWord = new Function(src.slice(start, end) + "\nreturn kurrentWord;")();

const CASES = {
    // Das Lang-s
    "so": "ſo",
    "sind": "ſind",
    "sieben": "ſieben",
    "sausen": "ſauſen",
    "wünschen": "wünſchen",
    "erstaunen": "erſtaunen",
    "Wunsch": "Wunſch",
    "einst": "einſt",
    "Knospe": "Knoſpe",
    "fast": "faſt",
    "löschen": "löſchen",
    "Mesner": "Mesner",
    "Oswald": "Oswald",

    // Das Rund-s
    "das": "das",
    "Haus": "Haus",
    "des": "des",
    "Landes": "Landes",
    "Preis": "Preis",
    "deshalb": "deshalb",
    "deswegen": "deswegen",
    "Geburtstag": "Geburtstag",
    "Haustür": "Haustür",
    "Dresden": "Dresden",
    "Häuschen": "Häuschen",
    "Eispalast": "Eispalast",

    // Fugen-s: OKRĄGŁE s wstawiane przed członem zaczynającym się spółgłoską
    // albo od s. Przykłady wprost ze strony: Donnerstag, Geburtstag,
    // Haustür, deswegen, Aussicht, Bimsstein, Häuschen, Eispalast (te
    // ostatnie pięć zdefiniowane już wyżej, w "Das Rund-s").
    "Dienstag": "Dienstag",
    "Samstag": "Samstag",
    "Donnerstag": "Donnerstag",
    "boshaft": "boshaft",
    "Schultasche": "Schultasche",

    // Fugen-s + wyraz od s -> "sſ"
    "Aussicht": "Ausſicht",
    "Bimsstein": "Bimsſtein",

    // UWAGA: tu s NIE jest Fugen-s, tylko początek członu złożenia, więc
    // jest DŁUGIE (reguła sp/st/sch dla "Schuh") albo zamyka sylabę.
    "Obstsorten": "Obſtsorten",   // Obst + Sorten: wstawiane s okrągłe na pozycji 4
    "Handschuh": "Handſchuh",
    "Rucksack": "Ruckſack",
    "Kugelschreiber": "Kugelſchreiber",
    "Kirchenlied": "Kirchenlied",   // brak wstawianego s: Kirche + Lied

    // Das Doppel-s - dwa długie s
    "Wasser": "Waſſer",
    "Tasse": "Taſſe",
    "Adresse": "Adreſſe",
    "vergessen": "vergeſſen",
    "müssen": "müſſen",
    "Zeugnisses": "Zeugniſſes",
    "Busses": "Buſſes",
    // Fugen-s + długie s = "sſ" (Aus + sicht, Bims + stein; zdefiniowane
    // już wyżej, oczekiwany wynik jest tu ten sam).
    "Assistent": "Aſſiſtent",
    "Essen": "Eſſen",

    // Das ß - "am Ende des Wortes": ss na końcu wyrazu, nie Doppel-s
    "Fluss": "Fluß",
    "Weihrauchfass": "Weihrauchfaß",
    "Flüsse": "Flüſſe",

    // "ss", które NIE jest Doppel-s, tylko Fugen-s + długie s
    "dasselbe": "dasſelbe",      // da + s + selbe: Fugen-s okrągłe + długie s z "selbe"
    "Gasse": "Gaſſe",
    "fassen": "faſſen"
};

Object.entries(CASES).forEach(([word, want]) => {
    test(`kurrentWord("${word}") === "${want}"`, () => {
        assert.equal(kurrentWord(word), want);
    });
});
