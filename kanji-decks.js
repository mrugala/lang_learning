(function (global) {
    "use strict";

    function createKanjiDecks(categories) {
        const nonChurchCategories = categories.filter(
            category => !category.key.startsWith("church-")
        );
        const decks = [];

        for (let index = 0; index < nonChurchCategories.length; index += 10) {
            const deckNumber = decks.length + 1;
            decks.push({
                key: `deck-${deckNumber}`,
                label: `Zestaw ${deckNumber}`,
                categoryKeys: nonChurchCategories
                    .slice(index, index + 10)
                    .map(category => category.key)
            });
        }

        const churchCategories = categories.filter(category =>
            category.key.startsWith("church-")
        );

        return [
            ...decks,
            {
                key: "deck-church",
                label: `Zestaw ${decks.length + 1} — Kościół katolicki`,
                categoryKeys: churchCategories.map(category => category.key)
            }
        ];
    }

    global.createKanjiDecks = createKanjiDecks;

    if (typeof module === "object" && module.exports) {
        module.exports = createKanjiDecks;
    }
})(typeof window === "undefined" ? globalThis : window);
