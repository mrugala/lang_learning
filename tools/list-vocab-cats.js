global.window = {};
require("../german-vocabulary-data.js");
window.germanVocabularyCategories.forEach((c, i) =>
    console.log(i, c.key, "|", c.label, "|", c.items.length));