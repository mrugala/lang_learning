global.window = {};
require("../kanji-data.js");
const categories = window.kanjiCategories;

const decks = [
    { key: "deck-1", categoryKeys: categories.slice(0, 10).map(c => c.key) },
    { key: "deck-2", categoryKeys: categories.slice(10, 20).map(c => c.key) },
    { key: "deck-3", categoryKeys: categories.slice(20, 30).map(c => c.key) },
    { key: "deck-4", categoryKeys: categories.slice(30, 40).map(c => c.key) }
];

const allKeys = decks.flatMap(d => d.categoryKeys);
console.log("deck categories:", allKeys.length);
console.log("unique deck categories:", new Set(allKeys).size);
console.log("categories not in any deck:", categories.map(c => c.key).filter(k => !allKeys.includes(k)));

const allKanji = categories.flatMap(c => c.items.map(i => i.kanji));
console.log("total kanji:", allKanji.length, "unique:", new Set(allKanji).size);