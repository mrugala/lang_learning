global.window = {};
require("../kanji-data.js");
window.kanjiCategories.forEach((c, i) => console.log(i, c.key, c.label, c.items.length));