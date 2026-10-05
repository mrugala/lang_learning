global.window = {};
try {
    require("../german-vocabulary-data.js");
    console.log("OK - plik parsuje się poprawnie");
} catch (e) {
    console.log("BŁĄD:", e.message);
}