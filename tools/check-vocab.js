global.window = {};
try {
    require("../german-vocabulary-data.js");
} catch (e) {
    console.log("BŁĄD SKŁADNI:", e.message);
    process.exit(1);
}
const cats = window.germanVocabularyCategories;

// 1. duplikaty kluczy kategorii
const keys = cats.map(c => c.key);
const dupKeys = keys.filter((k, i) => keys.indexOf(k) !== i);
console.log("duplikaty kluczy kategorii:", dupKeys.length ? dupKeys : "brak");

// 2. duplikaty form (de)
const seen = new Map();
const dupes = [];
cats.forEach(c => c.items.forEach(i => {
    const k = i.de.toLowerCase();
    if (seen.has(k)) dupes.push(`${i.de} (${seen.get(k)} i ${c.key})`);
    else seen.set(k, c.key);
}));
console.log("duplikaty wyrazów:", dupes.length ? dupes : "brak");

// 3. walidacja pól
const bad = [];
cats.forEach(c => c.items.forEach(i => {
    if (!i.de) bad.push(`${c.key}: brak de`);
    if (!Array.isArray(i.pl) || !i.pl.length) bad.push(`${c.key}/${i.de}: brak pl`);
    if (!i.pos) bad.push(`${c.key}/${i.de}: brak pos`);
    if (i.plural && !i.plural_pl) bad.push(`${c.key}/${i.de}: plural bez plural_pl`);
}));
console.log("błędne wpisy:", bad.length);
bad.forEach(b => console.log("  " + b));

// 4. podsumowanie
console.log("\nkategorii:", cats.length,
    "| pozycji:", cats.reduce((a, c) => a + c.items.length, 0));