(function (global) {
    "use strict";

    function createKanjiDecks(categories) {
        const isStoryCategory = category => category.key.startsWith("reading-stories-");
        const isChurchCategory = category => category.key.startsWith("church-");
        const regularCategories = categories.filter(
            category => !isChurchCategory(category) && !isStoryCategory(category)
        );
        const storyCategories = categories.filter(isStoryCategory);
        const decks = [];

        for (let index = 0; index < regularCategories.length; index += 10) {
            const deckNumber = decks.length + 1;
            decks.push({
                key: `deck-${deckNumber}`,
                label: `Zestaw ${deckNumber}`,
                categoryKeys: regularCategories
                    .slice(index, index + 10)
                    .map(category => category.key)
            });
        }

        for (let index = 0; index < storyCategories.length; index += 10) {
            const deckNumber = decks.length + 1;
            decks.push({
                key: `deck-reading-stories-${deckNumber}`,
                label: `Zestaw ${deckNumber} — Opowiadania`,
                categoryKeys: storyCategories
                    .slice(index, index + 10)
                    .map(category => category.key)
            });
        }

        const churchCategories = categories.filter(category =>
            isChurchCategory(category)
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
