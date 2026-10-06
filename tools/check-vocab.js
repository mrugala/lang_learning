global.window = {};
try {
    require("../german-vocabulary-data.js");
} catch (e) {
    console.log("BŁĄD SKŁADNI:", e.message);
    process.exit(1);
}
const cats = window.germanVocabularyCategories;

// 1. duplikaty kluczy kategorii
const errors = [];
const keys = cats.map(c => c.key);
const dupKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
dupKeys.forEach(key => errors.push(`duplikat klucza kategorii: ${key}`));

// 2. duplikaty form (de), ignorując wielkość liter i białe znaki brzegowe
const seen = new Map();
cats.forEach(c => c.items.forEach(i => {
    const k = String(i.de || "").trim().toLocaleLowerCase("de");
    if (seen.has(k)) errors.push(`duplikat wyrazu: ${i.de} (${seen.get(k)} i ${c.key})`);
    else seen.set(k, c.key);
}));

// 3. walidacja pól
cats.forEach(c => c.items.forEach(i => {
    const entry = `${c.key}/${i.de || "(bez hasła)"}`;
    if (!i.de) errors.push(`${entry}: brak de`);
    if (!Array.isArray(i.pl) || !i.pl.length) errors.push(`${entry}: brak polskiego tłumaczenia pl`);
    if (!i.pos) errors.push(`${entry}: brak części mowy pos`);
    if (i.plural && (!Array.isArray(i.plural_pl) || !i.plural_pl.length)) {
        errors.push(`${entry}: plural bez tablicy plural_pl`);
    }
    if (i.plural_pl && !i.plural) errors.push(`${entry}: plural_pl bez plural`);
    if (i.kurrent && typeof i.kurrent !== "object") {
        errors.push(`${entry}: pole kurrent nie jest obiektem`);
    }
}));

// 4. podsumowanie
console.log(`Kategorie: ${cats.length}`);
console.log(`Hasła: ${cats.reduce((total, category) => total + category.items.length, 0)}`);
if (errors.length) {
    console.error(`Błędy (${errors.length}):`);
    errors.forEach(error => console.error(`  - ${error}`));
    process.exitCode = 1;
} else {
    console.log("OK: słownictwo jest spójne.");
}