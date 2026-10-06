// Verifies romajiAnswerVariants in common.js: a long vowel must accept every
// spelling of itself, while a short vowel must NOT accept the long one.
const vm = require("vm");
const fs = require("fs");

const src = fs.readFileSync(__dirname + "/../common.js", "utf8");
const sandbox = { localStorage: null, document: undefined, console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const { normalizeRomaji, romajiAnswerVariants } = sandbox.LangCommon;
if (typeof normalizeRomaji !== "function" || typeof romajiAnswerVariants !== "function") {
    console.error("Nie znaleziono funkcji romaji w common.js.");
    process.exit(1);
}

const accepts = (expected, typed) =>
    romajiAnswerVariants(expected).includes(normalizeRomaji(typed));

console.log("=== every spelling of a long vowel must be accepted ===");
const longVowelCases = [
    ["kō", ["kō", "kou", "koo"]],
    ["shō", ["shō", "shou", "shoo"]],
    ["shū", ["shū", "shuu"]],
    ["chō", ["chō", "chou", "choo"]],
    ["ryō", ["ryō", "ryou", "ryoo"]],
    ["byō", ["byō", "byou", "byoo"]],
    ["jō", ["jō", "jou", "joo"]],
    ["tō", ["tō", "tou", "too"]],
    ["zō", ["zō", "zou", "zoo"]],
    ["yō", ["yō", "you", "yoo"]],
    ["n", ["n"]],
    // multi-syllable, from the real dataset
    ["imōto", ["imōto", "imouto", "imooto"]],
    ["suzushii", ["suzushii"]],
    ["kōshin", ["kōshin", "koushin", "kooshin"]],
    ["shūryō", ["shūryō", "shuuryou", "shuuryoo"]],
    ["tōroku", ["tōroku", "tooroku"]],
    ["henshū", ["henshū", "henshuu"]],
    ["hyōji", ["hyōji", "hyouji", "hyooji"]]
];
let fail = 0;
longVowelCases.forEach(([exp, variants]) => {
    variants.forEach(v => {
        if (!accepts(exp, v)) {
            fail++;
            console.log(`  FAIL ${exp} should accept ${v}`);
        }
    });
});
console.log(`  checked ${longVowelCases.reduce((a, [, v]) => a + v.length, 0)} spellings, ${fail} failed`);

console.log("\n=== case and spacing are still forgiving ===");
// Note: bare "KO" is deliberately not accepted for "kō", because without the
// macron there is no way to tell it from the short vowel. The macron must stay.
let formatFailures = 0;
[["kō", "KŌ"], ["kō", " kō "], ["Shū", "shuu"], ["kōshin", "  Koushin  "]].forEach(([exp, typed]) => {
    const ok = accepts(exp, typed);
    if (!ok) console.log(`  FAIL ${exp} should accept ${JSON.stringify(typed)}`);
    if (!ok) formatFailures++;
    console.log(`  ${ok ? "OK  " : "FAIL"} ${exp} accepts ${JSON.stringify(typed)}`);
});

console.log("\n=== a SHORT vowel must NOT be accepted for a long one ===");
const shortVowelCases = [
    ["ko", "kou"], ["ko", "koo"], ["ko", "kō"],
    ["sho", "shou"], ["sho", "shoo"], ["sho", "shō"],
    ["to", "tou"], ["to", "too"], ["to", "tō"],
    ["yu", "yuu"], ["yu", "yū"],
    ["ki", "kī"], ["ho", "hō"], ["te", "tē"]
];
let over = 0;
shortVowelCases.forEach(([exp, typed]) => {
    if (accepts(exp, typed)) {
        over++;
        console.log(`  FAIL ${exp} wrongly accepts ${typed}`);
    }
});
console.log(`  checked ${shortVowelCases.length} pairs, ${over} wrongly accepted`);

console.log("\n=== unrelated answers stay rejected ===");
const wrong = [
    ["kō", "ki"], ["kō", "ko2"], ["shū", "shi"], ["shū", "su"],
    ["ryō", "ryu"], ["ryō", "rio"], ["zō", "zu"], ["tō", "ta"], ["n", "na"]
];
let wrongOk = 0;
let wrongFailures = 0;
wrong.forEach(([exp, typed]) => {
    const accepted = accepts(exp, typed);
    if (!accepted) wrongOk++;
    else wrongFailures++;
    console.log(`  ${accepted ? "FAIL" : "OK  "} ${exp} rejects ${typed}`);
});

// "toroku" is deliberately NOT accepted for "tōroku": it is the ordinary
// reading of 録 (record), a different word. The macron, "oo" and "ou" are
// the spellings that are unambiguously long.
console.log("\n=== ambiguous spellings are intentionally rejected ===");
let ambiguousFailures = 0;
[["tōroku", "toroku"], ["kō", "ko"], ["shō", "sho"]].forEach(([exp, typed]) => {
    const ok = accepts(exp, typed);
    if (ok) ambiguousFailures++;
    console.log(`  ${ok ? "FAIL" : "OK  "} ${exp} rejects ${typed}`);
});

console.log(`\nsummary: long-vowel failures=${fail}, format failures=${formatFailures}, short-vowel over-acceptance=${over}, wrong answers correctly rejected=${wrongOk}/${wrong.length}`);
if (fail || formatFailures || over || wrongFailures || ambiguousFailures) process.exitCode = 1;