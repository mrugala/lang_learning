// Dane do treningu pisma Kurrent (Deutsche Kurrent).
// Litery: klucz -> grupa liter, "reading" to wymowa kurrentowa, a uwagi
// ("note") tylko tam, gdzie coś trzeba realnie wyjaśnić.
// Słów nie ma w tym pliku - tryb wyrazów bierze je z bazy słów
// german-vocabulary-data.js (germanVocabularyCategories), żeby nie
// trzymano dwóch niezależnych list wyrazów do ręcznego utrzymywania.
window.kurrentLetters = [
    {
        key: "a",
        label: "a",
        items: [
            { char: "a", upper: "A", reading: "a" },
            { char: "b", upper: "B", reading: "b" },
            { char: "c", upper: "C", reading: "c" },
            { char: "d", upper: "D", reading: "d" }
        ]
    },
    {
        key: "e",
        label: "e",
        items: [
            { char: "e", upper: "E", reading: "e" },
            { char: "f", upper: "F", reading: "f" },
            { char: "g", upper: "G", reading: "g" },
            { char: "h", upper: "H", reading: "h" }
        ]
    },
    {
        key: "i",
        label: "i",
        items: [
            { char: "i", upper: "I", reading: "i" },
            { char: "j", upper: "J", reading: "j" },
            { char: "k", upper: "K", reading: "k" },
            { char: "l", upper: "L", reading: "l" }
        ]
    },
    {
        key: "m",
        label: "m",
        items: [
            { char: "m", upper: "M", reading: "m" },
            { char: "n", upper: "N", reading: "n" },
            { char: "o", upper: "O", reading: "o" },
            { char: "p", upper: "P", reading: "p" }
        ]
    },
    {
        key: "q",
        label: "q",
        items: [
            { char: "q", upper: "Q", reading: "kv" },
            { char: "r", upper: "R", reading: "r" },
            { char: "s", upper: "S", reading: "z" },
            { char: "t", upper: "T", reading: "t" }
        ]
    },
    {
        key: "u",
        label: "u",
        items: [
            { char: "u", upper: "U", reading: "u" },
            { char: "v", upper: "V", reading: "f" },
            { char: "w", upper: "W", reading: "w" },
            { char: "x", upper: "X", reading: "ks" }
        ]
    },
    {
        key: "y",
        label: "y",
        items: [
            { char: "y", upper: "Y", reading: "y" },
            { char: "z", upper: "Z", reading: "c", note: "z z ogonkiem (ʒ)" }
        ]
    },
    {
        key: "umlaut",
        label: "ä ö ü",
        items: [
            { char: "ä", upper: "Ä", reading: "ae", variants: ["ae", "ä"] },
            { char: "ö", upper: "Ö", reading: "oe", variants: ["oe", "ö"] },
            { char: "ü", upper: "Ü", reading: "ue", variants: ["ue", "ü"] }
        ]
    },
    {
        key: "eszett",
        label: "ß",
        items: [
            { char: "ß", reading: "ss", variants: ["ss", "sz"], note: "ligatura długiego s (ſ) i z z ogonkiem (ʒ)" }
        ]
    }
];
