// Dane do treningu pisma Kurrent (Deutsche Kurrent).
// Litery: klucz -> grupa rodzinna liter, czytanie i uwagi.
// Słowa: niemieckie rzeczowniki (substantive) z rodzajnikiem, więc zawsze
// zaczynają się wielką literą.
window.kurrentLetters = [
    {
        key: "a",
        label: "a",
        items: [
            { char: "a", upper: "A", reading: "a", note: "" },
            { char: "b", upper: "B", reading: "b", note: "" },
            { char: "c", upper: "C", reading: "c", note: "" },
            { char: "d", upper: "D", reading: "d", note: "przed nią krótki znaczek = 'd' przyłączone" }
        ]
    },
    {
        key: "e",
        label: "e",
        items: [
            { char: "e", upper: "E", reading: "e", note: "jak włoska litera 'c' z kreską" },
            { char: "f", upper: "F", reading: "f", note: "brak samodzielnej formy, tylko w ligaturach" },
            { char: "g", upper: "G", reading: "g", note: "" },
            { char: "h", upper: "H", reading: "h", note: "w środku wyrazu ma znaczek (petite)" }
        ]
    },
    {
        key: "i",
        label: "i",
        items: [
            { char: "i", upper: "I", reading: "i", note: "kropka nad literą" },
            { char: "j", upper: "J", reading: "j", note: "" },
            { char: "k", upper: "K", reading: "k", note: "" },
            { char: "l", upper: "L", reading: "l", note: "w środku wyrazu ma znaczek (petite)" }
        ]
    },
    {
        key: "m",
        label: "m",
        items: [
            { char: "m", upper: "M", reading: "m", note: "" },
            { char: "n", upper: "N", reading: "n", note: "na końcu wyrazu znaczek tnący (Strich)" },
            { char: "o", upper: "O", reading: "o", note: "" },
            { char: "p", upper: "P", reading: "p", note: "" }
        ]
    },
    {
        key: "q",
        label: "q",
        items: [
            { char: "q", upper: "Q", reading: "kv", note: "z ogonkiem" },
            { char: "r", upper: "R", reading: "r", note: "zawsze ze znaczkiem (Strich)" },
            { char: "s", upper: "S", reading: "s", note: "forma długa; krótka tylko w 'Sonne'" },
            { char: "t", upper: "T", reading: "t", note: "" }
        ]
    },
    {
        key: "u",
        label: "u",
        items: [
            { char: "u", upper: "U", reading: "u", note: "nad nim łuk (Bogen)" },
            { char: "v", upper: "V", reading: "f", note: "czytana jak f" },
            { char: "w", upper: "W", reading: "w", note: "w środku wyrazu znaczek (petite)" },
            { char: "x", upper: "X", reading: "ks", note: "" }
        ]
    },
    {
        key: "y",
        label: "y",
        items: [
            { char: "y", upper: "Y", reading: "y", note: "w środku wyrazu znaczek (petite)" },
            { char: "z", upper: "Z", reading: "z", note: "3-pętlowa, z descenderem" }
        ]
    },
    {
        key: "umlaut",
        label: "ä ö ü",
        items: [
            { char: "ä", upper: "Ä", reading: "ae", variants: ["ae", "ä"], note: "umlaut a" },
            { char: "ö", upper: "Ö", reading: "oe", variants: ["oe", "ö"], note: "umlaut o" },
            { char: "ü", upper: "Ü", reading: "ue", variants: ["ue", "ü"], note: "umlaut u" }
        ]
    },
    {
        key: "eszett",
        label: "ß",
        items: [
            { char: "ß", reading: "ss", variants: ["sz"], note: "eszett" }
        ]
    }
];

window.kurrentDecks = [
    {
        key: "haustiere",
        label: "Zwierzęta",
        items: [
            { word: "der Hund", plural: "die Hunde", meaning: "pies" },
            { word: "die Katze", plural: "die Katzen", meaning: "kot" },
            { word: "das Pferd", plural: "die Pferde", meaning: "koń" },
            { word: "die Kuh", plural: "die Kühe", meaning: "krowa" },
            { word: "das Schaf", plural: "die Schafe", meaning: "owca" },
            { word: "die Gans", plural: "die Gänse", meaning: "gęś" },
            { word: "der Vogel", plural: "die Vögel", meaning: "ptak" },
            { word: "der Bär", plural: "die Bären", meaning: "niedźwiedź" }
        ]
    },
    {
        key: "essen",
        label: "Jedzenie",
        items: [
            { word: "der Apfel", plural: "die Äpfel", meaning: "jabłko" },
            { word: "das Brot", plural: "die Brote", meaning: "chleb" },
            { word: "die Butter", plural: "die Butter", meaning: "masło" },
            { word: "der Käse", plural: "die Käse", meaning: "ser" },
            { word: "das Obst", plural: "die Obstsorten", meaning: "owoce" },
            { word: "der Salat", plural: "die Salate", meaning: "sałatka" },
            { word: "die Suppe", plural: "die Suppen", meaning: "zupa" },
            { word: "der Zucker", plural: "die Zucker", meaning: "cukier" }
        ]
    },
    {
        key: "haus",
        label: "Dom",
        items: [
            { word: "das Haus", plural: "die Häuser", meaning: "dom" },
            { word: "die Tür", plural: "die Türen", meaning: "drzwi" },
            { word: "das Fenster", plural: "die Fenster", meaning: "okno" },
            { word: "der Tisch", plural: "die Tische", meaning: "stół" },
            { word: "der Stuhl", plural: "die Stühle", meaning: "krzesło" },
            { word: "das Bett", plural: "die Betten", meaning: "łóżko" },
            { word: "die Lampe", plural: "die Lampen", meaning: "lampa" },
            { word: "der Schlüssel", plural: "die Schlüssel", meaning: "klucz" }
        ]
    },
    {
        key: "natur",
        label: "Natura",
        items: [
            { word: "der Baum", plural: "die Bäume", meaning: "drzewo" },
            { word: "die Blume", plural: "die Blumen", meaning: "kwiat" },
            { word: "das Blatt", plural: "die Blätter", meaning: "liść" },
            { word: "der Wald", plural: "die Wälder", meaning: "las" },
            { word: "der Berg", plural: "die Berge", meaning: "góra" },
            { word: "das Wasser", plural: "die Gewässer", meaning: "woda" },
            { word: "der Mond", plural: "die Monde", meaning: "księżyc" },
            { word: "die Sonne", plural: "die Sonnen", meaning: "słońce" }
        ]
    },
    {
        key: "stadt",
        label: "Miasto",
        items: [
            { word: "die Stadt", plural: "die Städte", meaning: "miasto" },
            { word: "die Straße", plural: "die Straßen", meaning: "ulica" },
            { word: "der Markt", plural: "die Märkte", meaning: "rynek" },
            { word: "die Kirche", plural: "die Kirchen", meaning: "kościół" },
            { word: "die Brücke", plural: "die Brücken", meaning: "most" },
            { word: "der Bahnhof", plural: "die Bahnhöfe", meaning: "dworzec" },
            { word: "das Museum", plural: "die Museen", meaning: "muzeum" },
            { word: "die Schule", plural: "die Schulen", meaning: "szkoła" }
        ]
    },
    {
        key: "schule",
        label: "Szkoła",
        items: [
            { word: "das Buch", plural: "die Bücher", meaning: "książka" },
            { word: "das Heft", plural: "die Hefte", meaning: "zeszyt" },
            { word: "der Feder", plural: "die Federn", meaning: "pióro" },
            { word: "die Tafel", plural: "die Tafeln", meaning: "tablica" },
            { word: "der Bleistift", plural: "die Bleistifte", meaning: "ołówek" },
            { word: "das Lineal", plural: "die Lineale", meaning: "linijka" },
            { word: "der Rucksack", plural: "die Rucksäcke", meaning: "plecak" },
            { word: "die Mappe", plural: "die Mappen", meaning: "teczka" }
        ]
    },
    {
        key: "koerper",
        label: "Ciało",
        items: [
            { word: "der Kopf", plural: "die Köpfe", meaning: "głowa" },
            { word: "das Auge", plural: "die Augen", meaning: "oko" },
            { word: "die Nase", plural: "die Nasen", meaning: "nos" },
            { word: "der Mund", plural: "die Münder", meaning: "usta" },
            { word: "das Ohr", plural: "die Ohren", meaning: "ucho" },
            { word: "die Hand", plural: "die Hände", meaning: "ręka" },
            { word: "der Fuß", plural: "die Füße", meaning: "stopa" },
            { word: "das Haar", plural: "die Haare", meaning: "włosy" }
        ]
    },
    {
        key: "werkzeug",
        label: "Narzędzia",
        items: [
            { word: "der Hammer", plural: "die Hämmer", meaning: "młotek" },
            { word: "die Säge", plural: "die Sägen", meaning: "piła" },
            { word: "der Schraubenzieher", plural: "die Schraubenzieher", meaning: "śrubokręt" },
            { word: "die Zange", plural: "die Zangen", meaning: "kleszcze" },
            { word: "der Nagel", plural: "die Nägel", meaning: "gwóźdź" },
            { word: "das Sägeblatt", plural: "die Sägeblätter", meaning: "brzesnica" },
            { word: "der Kessel", plural: "die Kessel", meaning: "kotel" },
            { word: "der Korb", plural: "die Körbe", meaning: "kosz" }
        ]
    },
    {
        key: "kleidung",
        label: "Ubrania",
        items: [
            { word: "das Kleid", plural: "die Kleider", meaning: "sukienka" },
            { word: "die Hose", plural: "die Hosen", meaning: "spodnie" },
            { word: "der Rock", plural: "die Röcke", meaning: "spódnica / marynarka" },
            { word: "das Hemd", plural: "die Hemden", meaning: "koszula" },
            { word: "der Schuh", plural: "die Schuhe", meaning: "but" },
            { word: "der Hut", plural: "die Hüte", meaning: "kapelusz" },
            { word: "der Mantel", plural: "die Mäntel", meaning: "płaszcz" },
            { word: "der Handschuh", plural: "die Handschuhe", meaning: "rękawica" }
        ]
    }
];
