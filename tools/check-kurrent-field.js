// Kontrola spójności pola "kurrent": glif ma być zapisem kurrentowym tej
// formy, a odpowiedź (transkrypcja) - zapisem współczesnym.
global.window = {};
require("../german-vocabulary-data.js");

const items = window.germanVocabularyCategories.flatMap(c => c.items);
let checked = 0;
const bad = [];

items.forEach(i => {
  if (!i.kurrent) return;
  if (typeof i.kurrent !== "object" || Array.isArray(i.kurrent)) {
    bad.push(`${i.de}: pole kurrent musi być obiektem`);
    return;
  }
  if (i.kurrent.de) {
    checked++;
    // Zmiana może dotyczyć s/ſ oraz ss -> ß (reguła Das ß na końcu wyrazu).
    const back = i.kurrent.de.replace(/ſ/g, "s").replace(/ß/g, "ss");
    if (back !== i.de) {
      bad.push(`de: ${i.de} -> ${i.kurrent.de} (zmiana nie odpowiada regułom)`);
    }
  }
  if (i.kurrent.plural) {
    checked++;
    if (!i.plural) {
      bad.push(`plural Kurrent bez współczesnej liczby mnogiej: ${i.de}`);
    } else if (i.kurrent.plural !== i.plural) {
      // różnica musi dotyczyć wyłącznie s/ſ oraz ß
      const back = i.kurrent.plural.replace(/ſ/g, "s").replace(/ß/g, "ss");
      if (back !== i.plural) {
        bad.push(`plural: ${i.plural} -> ${i.kurrent.plural} (zmiana nie dotyczy s)`);
      }
    }
  }
});

console.log("pozycji z polem kurrent:", items.filter(i => i.kurrent).length);
console.log("sprawdzonych form:", checked);
console.log("niespójności:", bad.length);
bad.forEach(b => console.log("  " + b));

// Zmiana ma dotyczyć wyłącznie znaków s/ſ oraz ß
const mismatch = [];
items.forEach(i => {
  if (!i.kurrent || !i.kurrent.de) return;
  const back = i.kurrent.de.replace(/ſ/g, "s").replace(/ß/g, "ss");
  if (back !== i.de) mismatch.push(i.de);
});
console.log("formy, w których zmieniło się coś poza s/ſ/ß:", mismatch.length, mismatch);
if (bad.length || mismatch.length) process.exitCode = 1;