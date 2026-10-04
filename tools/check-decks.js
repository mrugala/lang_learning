global.window = {};
require("../kanji-data.js");
const categories = window.kanjiCategories;

// Deck 5 ma być zestawem kościelnym: bierzemy po jednej kategorii
// z każdego bloku i dokładamy cztery kategorie "church-*".
const churchKeys = categories
    .filter(c => c.key.startsWith("church-"))
    .map(c => c.key);

const decks = [
    { key: "deck-1", label: "Deck 1", categoryKeys: categories.slice(0, 10).map(c => c.key) },
    { key: "deck-2", label: "Deck 2", categoryKeys: categories.slice(10, 20).map(c => c.key) },
    { key: "deck-3", label: "Deck 3", categoryKeys: categories.slice(20, 30).map(c => c.key) },
    { key: "deck-4", label: "Deck 4", categoryKeys: categories.slice(30, 40).map(c => c.key) },
    {
        key: "deck-5",
        label: "Kościół katolicki",
        categoryKeys: [
            categories[0].key,
            categories[11].key,
            categories[22].key,
            categories[27].key,
            categories[30].key,
            ...churchKeys
        ]
    }
];

const allKeys = decks.flatMap(d => d.categoryKeys);
console.log("deck categories:", allKeys.length);
console.log("unique deck categories:", new Set(allKeys).size);
console.log("categories not in any deck:", categories.map(c => c.key).filter(k => !allKeys.includes(k)));

decks.forEach(d => {
    console.log(`\n${d.label} (${d.key}) - ${d.categoryKeys.length} kategorii:`);
    d.categoryKeys.forEach(key => {
        const category = categories.find(c => c.key === key);
        console.log(`  ${category.label.padEnd(22)} ${category.items.length} kanji`);
    });
    const kanji = d.categoryKeys.flatMap(key => categories.find(c => c.key === key).items.map(i => i.kanji));
    console.log(`  razem: ${kanji.length} kanji`);
});

const allKanji = categories.flatMap(c => c.items.map(i => i.kanji));
console.log("total kanji:", allKanji.length, "unique:", new Set(allKanji).size);

// Duplikaty kanji między kategoriami - przy kopiowaniu wpisów łatwo je
// przegubić, a w decku oznacza to ten sam znak dwa razy.
const owners = new Map();
categories.forEach(category => {
    category.items.forEach(item => {
        if (!owners.has(item.kanji)) {
            owners.set(item.kanji, []);
        }
        owners.get(item.kanji).push(category.key);
    });
});

const duplicates = [...owners.entries()].filter(([, keys]) => keys.length > 1);
if (duplicates.length === 0) {
    console.log("duplikaty kanji: brak");
} else {
    console.log("duplikaty kanji:");
    duplicates.forEach(([kanji, keys]) => console.log(`  ${kanji}: ${keys.join(", ")}`));
}

// Brakujące pola w kanji - deck pokazuje je w UI.
categories.forEach(category => {
    category.items.forEach(item => {
        ["kanji", "romaji", "meaning"].forEach(field => {
            if (!item[field]) console.log(`BŁĄD: ${category.key} "${item.kanji}" brak ${field}`);
        });
    });
});