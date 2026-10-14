// One-off generator: dumps window.readingVocabulary kanji forms into a CSV,
// 10 words per row, for pasting into OJAD's batch lookup (Suzuki-kun).
global.window = {};
require("../reading-vocabulary-data.js");

const words = window.readingVocabulary.map(item => item.kanji);
const rows = [];
for (let index = 0; index < words.length; index += 10) {
    rows.push(words.slice(index, index + 10).join(","));
}

require("fs").writeFileSync("ojad-lookup.csv", rows.join("\r\n") + "\r\n", "utf8");
console.log(`Wrote ${words.length} words in ${rows.length} rows to ojad-lookup.csv`);
