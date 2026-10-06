const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const jsFiles = [
    ...fs.readdirSync(root)
        .filter(file => file.endsWith(".js"))
        .map(file => path.join(root, file)),
    ...fs.readdirSync(__dirname)
        .filter(file => file.endsWith(".js"))
        .map(file => path.join(__dirname, file))
];
const errors = [];

jsFiles.forEach(file => {
    try {
        new vm.Script(fs.readFileSync(file, "utf8"), { filename: file });
    } catch (error) {
        errors.push(`${path.relative(root, file)}: ${error.message}`);
    }
});

global.window = {};
[
    ["kanji-data.js", "kanjiCategories"],
    ["german-vocabulary-data.js", "germanVocabularyCategories"],
    ["kurrent-data.js", "kurrentLetters"]
].forEach(([file, globalName]) => {
    try {
        require(path.join(root, file));
        if (!Array.isArray(window[globalName])) {
            errors.push(`${file} did not define window.${globalName} as an array`);
        }
    } catch (error) {
        errors.push(`${file}: ${error.message}`);
    }
});

console.log(`JavaScript files checked: ${jsFiles.length}`);
if (errors.length) {
    console.error(`Syntax/data errors (${errors.length}):`);
    errors.forEach(error => console.error(`  - ${error}`));
    process.exitCode = 1;
} else {
    console.log("OK: production scripts parse and all data files load.");
}
