const createKanjiDecks = require("../kanji-decks.js");

global.window = {};
require("../reading-vocabulary-data.js");
require("../kanji-data.js");
const categories = window.kanjiCategories;
const errors = [];

if (!Array.isArray(categories)) {
    console.error("BŁĄD: kanji-data.js nie eksportuje listy kategorii.");
    process.exit(1);
}

const decks = createKanjiDecks(categories);
const categoryByKey = new Map();
categories.forEach(category => {
    if (categoryByKey.has(category.key)) {
        errors.push(`powtórzony klucz kategorii: ${category.key}`);
    } else {
        categoryByKey.set(category.key, category);
    }
});

const nonChurchCategories = categories.filter(
    category => !category.key.startsWith("church-") &&
        !category.key.startsWith("reading-stories-")
);
const readingStoryCategories = categories.filter(
    category => category.key.startsWith("reading-stories-")
);
const churchCategories = categories.filter(
    category => category.key.startsWith("church-")
);
const expectedDecks = [];

for (let index = 0; index < nonChurchCategories.length; index += 10) {
    expectedDecks.push(
        nonChurchCategories.slice(index, index + 10).map(category => category.key)
    );
}
for (let index = 0; index < readingStoryCategories.length; index += 10) {
    expectedDecks.push(
        readingStoryCategories.slice(index, index + 10).map(category => category.key)
    );
}

if (decks.length !== expectedDecks.length + 1) {
    errors.push(
        `oczekiwano ${expectedDecks.length + 1} zestawów, otrzymano ${decks.length}`
    );
}
if (churchCategories.length === 0) {
    errors.push('brak kategorii z prefiksem "church-"');
}

expectedDecks.forEach((categoryKeys, index) => {
    const deck = decks[index];
    if (!deck) return;
    const isReadingStoryDeck = categoryKeys.some(key => key.startsWith("reading-stories-"));
    const expectedKey = isReadingStoryDeck
        ? `deck-reading-stories-${index + 1}`
        : `deck-${index + 1}`;
    const expectedLabel = isReadingStoryDeck
        ? `Zestaw ${index + 1} — Opowiadania`
        : `Zestaw ${index + 1}`;
    if (deck.key !== expectedKey || deck.label !== expectedLabel) {
        errors.push(`nieprawidłowy klucz lub nazwa zestawu ${index + 1}`);
    }
    if (JSON.stringify(deck.categoryKeys) !== JSON.stringify(categoryKeys)) {
        errors.push(`zestaw ${index + 1} nie odpowiada kolejnym 10 kategoriom`);
    }
});

const churchDeck = decks[decks.length - 1];
if (churchDeck) {
    if (churchDeck.key !== "deck-church") {
        errors.push("ostatni zestaw nie ma klucza deck-church");
    }
    if (churchDeck.label !== `Zestaw ${expectedDecks.length + 1} — Kościół katolicki`) {
        errors.push("nieprawidłowa nazwa lub numer zestawu kościelnego");
    }
    if (JSON.stringify(churchDeck.categoryKeys) !== JSON.stringify(
        churchCategories.map(category => category.key)
    )) {
        errors.push("zestaw kościelny nie zawiera wszystkich kategorii church- w ich kolejności");
    }
}

const assignedKeys = decks.flatMap(deck => deck.categoryKeys);
const assignedCounts = new Map();
assignedKeys.forEach(key => assignedCounts.set(key, (assignedCounts.get(key) || 0) + 1));
categories.forEach(category => {
    const count = assignedCounts.get(category.key) || 0;
    if (count !== 1) {
        errors.push(`${category.key} występuje w zestawach ${count} razy`);
    }
});
assignedKeys.forEach(key => {
    if (!categoryByKey.has(key)) errors.push(`zestaw zawiera nieznaną kategorię: ${key}`);
});

decks.forEach(deck => {
    if (!deck.key.startsWith("deck-church") && deck.categoryKeys.length > 10) {
        errors.push(`${deck.label} zawiera więcej niż 10 kategorii`);
    }
    if (deck.key.startsWith("deck-reading-stories")) {
        const itemCount = deck.categoryKeys.reduce(
            (total, key) => total + (categoryByKey.get(key)?.items.length || 0),
            0
        );
        if (itemCount > 100) errors.push(`${deck.label} zawiera więcej niż 100 wpisów`);
    }
});

const owners = new Map();
const distractors = new Set();
categories.forEach(category => {
    if (!Array.isArray(category.items)) {
        errors.push(`${category.key} nie ma tablicy items`);
        return;
    }

    if (category.key.startsWith("reading-stories-") && category.items.length > 10) {
        errors.push(`${category.key} zawiera więcej niż 10 wpisów`);
    }

    category.items.forEach(item => {
        ["kanji", "romaji", "meaning"].forEach(field => {
            if (!item[field]) errors.push(`${category.key}/${item.kanji || "(bez kanji)"}: brak ${field}`);
        });
        if (!owners.has(item.kanji)) owners.set(item.kanji, []);
        owners.get(item.kanji).push({ categoryKey: category.key, item });
        (item.distractors || []).forEach(distractor => distractors.add(distractor));
    });
});

owners.forEach((entries, kanji) => {
    const sharedWithStoryDeck = entries.length > 1 &&
        entries.every(entry => entry.item === entries[0].item) &&
        entries.some(entry => entry.categoryKey.startsWith("reading-stories-"));
    if (entries.length > 1 && !sharedWithStoryDeck) {
        errors.push(`kanji ${kanji} występuje w wielu kategoriach: ${entries.map(entry => entry.categoryKey).join(", ")}`);
    }
});

const storyItems = categories
    .filter(category => category.key.startsWith("reading-stories-"))
    .flatMap(category => category.items);
const storyKanji = new Set(storyItems.map(item => item.kanji));
const existingItems = categories
    .filter(category => !category.key.startsWith("reading-stories-"))
    .flatMap(category => category.items);
window.readingVocabulary.forEach(item => {
    const existingKanji = item.existingKanji || item.kanji;
    const duplicate = existingItems.some(existing => existing.kanji === existingKanji);
    const includedInStoryDeck = storyKanji.has(item.kanji);
    if (duplicate === includedInStoryDeck) {
        errors.push(
            `${duplicate ? "powielony" : "pominięty"} wpis słownictwa opowiadań: ${item.kanji} (${item.hiragana})`
        );
    }
});
distractors.forEach(kanji => {
    if (!owners.has(kanji)) errors.push(`dystraktor ${kanji} nie ma własnego wpisu kanji`);
});

console.log(`Kategorie: ${categories.length}`);
console.log(`Zestawy: ${decks.length} (${expectedDecks.length} zwykłych + Kościół katolicki)`);
decks.forEach(deck => {
    const itemCount = deck.categoryKeys.reduce(
        (total, key) => total + (categoryByKey.get(key)?.items.length || 0),
        0
    );
    console.log(`  ${deck.label}: ${deck.categoryKeys.length} kategorii, ${itemCount} wpisów`);
});
console.log(`Unikalne wpisy kanji: ${owners.size}`);
console.log(`Dystraktory bez wpisu: ${[...distractors].filter(kanji => !owners.has(kanji)).length}`);

if (errors.length) {
    console.error(`\nBłędy (${errors.length}):`);
    errors.forEach(error => console.error(`  - ${error}`));
    process.exitCode = 1;
} else {
    console.log("\nOK: kategorie i zestawy są spójne.");
}
