global.window = {};
require("../kanji-data.js");
const categories = window.kanjiCategories;

const isKanji = ch => /[\u4e00-\u9faf\u3400-\u4dbf]/.test(ch);

const singles = new Set();
categories.forEach(c => c.items.forEach(i => {
    if ([...i.kanji].filter(isKanji).length === 1) singles.add(i.kanji);
}));

const multi = [];
categories.forEach(c => c.items.forEach(i => {
    const chars = [...i.kanji].filter(isKanji);
    if (chars.length > 1) multi.push({ cat: c.key, ...i, chars });
}));

console.log(`Słowa wieloznakowe: ${multi.length}`);
multi.forEach(m => {
    const missing = m.chars.filter(ch => !singles.has(ch));
    console.log(`  ${m.kanji} (${m.cat})` + (missing.length ? ` -> BRAKUJĄCE: ${missing.join(" ")}` : " -> ok"));
});

const allMissing = new Set();
multi.forEach(m => m.chars.forEach(ch => { if (!singles.has(ch)) allMissing.add(ch); }));
console.log(`\nUnikalne brakujące kanji: ${allMissing.size}`);
console.log([...allMissing].join(" "));
if (allMissing.size) process.exitCode = 1;