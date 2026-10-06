// Verifies toHiraganaFromRomaji as it exists in kanji.js.
const fs = require("fs");
const vm = require("vm");

const src = fs.readFileSync(__dirname + "/../kanji.js", "utf8");
const start = src.indexOf("// Consonant + vowel");
const end = src.indexOf("function getDisplayValue");
if (start === -1 || end === -1 || end <= start) {
    console.error("Nie znaleziono konwertera romaji w kanji.js.");
    process.exit(1);
}
const snippet = src.slice(start, end);

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(snippet + "\ntoHiraganaFromRomaji;", sandbox);
const convert = sandbox.toHiraganaFromRomaji;
if (typeof convert !== "function") {
    console.error("Nie udało się załadować toHiraganaFromRomaji.");
    process.exit(1);
}

global.window = {};
require("../kanji-data.js");
const items = window.kanjiCategories.flatMap(c => c.items);

const readings = items.map(item => ({
    item,
    hiragana: item.hiragana || convert(item.romaji)
}));
const bad = readings.filter(({ hiragana }) => !hiragana || /[a-z]/i.test(hiragana));
console.log("total items:", items.length);
console.log("readings that do not fully convert:", bad.length);
bad.forEach(({ item, hiragana }) => console.log("  ", item.kanji, item.romaji, "->", hiragana));

const cases = [
    // Sokuon and basic regressions (kept so the long-vowel work cannot regress them).
    ["tte", "って"], ["tta", "った"], ["kka", "っか"], ["ssa", "っさ"],
    ["zzy", "っじ"], ["itchi", "いっち"], ["honna", "ほんな"],
    ["zannen", "ざんねん"], ["ippai", "いっぱい"], ["kitte", "きって"],
    ["sakka", "さっか"], ["motto", "もっと"], ["shinbun", "しんぶん"],
    ["inu", "いぬ"], ["neko", "ねこ"], ["sakana", "さかな"], ["hon", "ほん"],
    ["n", "ん"], ["nihon", "にほん"], ["tsuki", "つき"], ["fuyu", "ふゆ"],
    ["sensei", "せんせい"], ["ippun", "いっぷん"], ["zasshi", "ざっし"],
    ["kettei", "けってい"], ["mizuumi", "みずうみ"], ["otouto", "おとうと"],
    ["suzushii", "すずしい"],

    // Long vowels: every spelling must land on the same kana.
    ["koo", "こう"], ["kō", "こう"], ["kou", "こう"],
    ["suu", "すう"], ["sū", "すう"], ["suu", "すう"],
    ["too", "とう"], ["tō", "とう"], ["tou", "とう"],
    ["ryuu", "りゅう"], ["ryū", "りゅう"], ["ryu", "りゅ"],
    ["shuu", "しゅう"], ["shū", "しゅう"],
    ["tsuu", "つう"], ["tsū", "つう"],
    ["nyuu", "にゅう"], ["nyū", "にゅう"],
    ["kyuu", "きゅう"], ["kyū", "きゅう"],
    ["zukkō", "ずっこう"], ["zukkou", "ずっこう"],
    ["gakkou", "がっこう"], ["gakkō", "がっこう"], ["gakkuu", "がっくう"],
    ["byou", "びょう"], ["byō", "びょう"], ["byoo", "びょう"],
    ["shou", "しょう"], ["shoo", "しょう"],
    ["chou", "ちょう"], ["choo", "ちょう"],
    ["jyou", "じょう"], ["jou", "じょう"],
    ["teishuu", "ていしゅう"], ["teishō", "ていしょう"],
    ["mizuumi", "みずうみ"], ["otouto", "おとうと"],
    ["suzushii", "すずしい"], ["kettei", "けってい"],
    ["juu", "じゅう"], ["jū", "じゅう"],
    ["hyou", "ひょう"], ["etō", "えとう"], ["bee", "べえ"], ["kyuu", "きゅう"],
    ["tee", "てえ"], ["nii", "にい"], ["mii", "みい"], ["rii", "りい"],
    ["hee", "へえ"], ["kii", "きい"], ["kyou", "きょう"],
    ["you", "よう"], ["yō", "よう"],
    ["ippo", "いっぽ"], ["nippon", "にっぽん"], ["gakkou", "がっこう"]
];

let failed = bad.length;
cases.forEach(([inp, want]) => {
    const got = convert(inp);
    if (got !== want) {
        failed++;
        console.log(`FAIL ${inp} -> ${got} (want ${want})`);
    }
});
console.log("long vowel cases:", cases.length, "failed:", failed);
if (failed) process.exitCode = 1;