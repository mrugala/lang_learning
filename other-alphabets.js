const { createToggleLabel } = window.LangCommon;

const churchSlavonicCharacters = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d",
    "е": "e", "ж": "zh", "ѕ": "dz", "з": "z", "и": "i",
    "і": "i", "ї": "ji", "є": "je", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s",
    "т": "t", "оу": "u", "ѹ": "u", "ф": "f", "х": "h",
    "ѡ": "ō", "ц": "c", "ч": "cz", "ш": "sz", "щ": "szcz",
    "ъ": "ъ", "ы": "y", "ь": "ь", "ѣ": "ě", "ю": "yu",
    "ꙗ": "ya", "ѥ": "je", "ѧ": "ę", "ѫ": "ǫ", "ѩ": "ję",
    "ѭ": "jǫ", "ꙑ": "y", "ѯ": "ks", "ѱ": "ps", "ѳ": "th", "ѵ": "i",
    "ѿ": "ot", "ѻ": "o", "ꙋ": "u"
};

const glagoliticCharacters = {
    "ⰰ": "a", "ⰱ": "b", "ⰲ": "v", "ⰳ": "g", "ⰴ": "d",
    "ⰵ": "e", "ⰶ": "zh", "ⰷ": "dz", "ⰸ": "z", "ⰹ": "i",
    "ⰺ": "i", "ⰻ": "y", "ⰼ": "j", "ⰽ": "k", "ⰾ": "l",
    "ⰿ": "m", "ⱀ": "n", "ⱁ": "o", "ⱂ": "p", "ⱃ": "r",
    "ⱄ": "s", "ⱅ": "t", "ⱆ": "u", "ⱇ": "f", "ⱈ": "h",
    "ⱉ": "ot", "ⱊ": "p", "ⱋ": "sht", "ⱌ": "ts", "ⱍ": "cz",
    "ⱎ": "sz", "ⱏ": "ъ", "ⱐ": "ь", "ⱑ": "ě", "ⱒ": "x",
    "ⱓ": "yu", "ⱔ": "ę", "ⱕ": "ję", "ⱖ": "yo", "ⱗ": "ja",
    "ⱘ": "ǫ", "ⱙ": "jǫ", "ⱚ": "th", "ⱛ": "i"
};

function addUppercaseForms(characters) {
    const uppercaseForms = {};
    Object.entries(characters).forEach(([character, transliteration]) => {
        const uppercase = character.toUpperCase();
        if (uppercase === character) return;
        uppercaseForms[character] = uppercase;
        characters[uppercase] = transliteration.toUpperCase();
    });
    return uppercaseForms;
}

const alphabets = {
    churchSlavonicCyrillic: {
        title: "Cyrylica cerkiewnosłowiańska",
        label: "Азъ",
        className: "alphabet-church-slavonic",
        characters: churchSlavonicCharacters
    },
    glagoliticRound: {
        title: "Głagolica obła",
        label: "Ⰰⰸ",
        className: "alphabet-glagolitic-round",
        characters: { ...glagoliticCharacters }
    },
    glagoliticAngular: {
        title: "Głagolica kanciasta",
        label: "ⰀⰈ",
        className: "alphabet-glagolitic-angular",
        characters: { ...glagoliticCharacters }
    }
};
Object.values(alphabets).forEach(alphabet => {
    alphabet.uppercaseForms = addUppercaseForms(alphabet.characters);
});

const alphabetSelect = document.getElementById("alphabet-type");
const tableHost = document.getElementById("table");
const groupSize = 6;
const stateKey = "otherAlphabetSelectionUiState";

function readSavedState() {
    const saved = window.LangCommon.readReloadState(stateKey);
    if (!saved || !alphabets[saved.alphabet]) return null;
    return saved;
}

const restoredState = readSavedState();
let currentAlphabet = restoredState?.alphabet || "churchSlavonicCyrillic";
let selectedCharacters = new Set();

function alphabetCharacters() {
    return alphabets[currentAlphabet].characters;
}

function saveState() {
    window.LangCommon.storeSessionState(stateKey, {
        alphabet: currentAlphabet,
        selected: [...selectedCharacters],
        characterSetVersion: 4
    });
}

function updateTitle() {
    const alphabet = alphabets[currentAlphabet];
    document.title = `${alphabet.title} — Inne alfabety`;
    document.querySelector("h1").innerHTML = `${alphabet.label} <span>(${alphabet.title})</span>`;
    document.getElementById("answer").placeholder = "Podaj transliterację";
    document.body.classList.remove(
        "alphabet-church-slavonic",
        "alphabet-glagolitic-round",
        "alphabet-glagolitic-angular"
    );
    document.body.classList.add(alphabet.className);
}

function toggleCharacter(character) {
    if (selectedCharacters.has(character)) selectedCharacters.delete(character);
    else selectedCharacters.add(character);
    saveState();
    syncSelection();
}

function renderTable() {
    const entries = Object.entries(alphabetCharacters());
    const displayedEntries = entries
        .filter(([character]) => character === character.toLowerCase())
        .map(([character, transliteration]) => ({
            characters: [character],
            transliterations: [transliteration]
        }));
    displayedEntries.forEach(entry => {
        const uppercase = alphabets[currentAlphabet].uppercaseForms[entry.characters[0]];
        if (!uppercase) return;
        entry.characters.push(uppercase);
        entry.transliterations.push(alphabetCharacters()[uppercase]);
    });
    const table = document.createElement("table");
    table.className = "hiragana-table linear-alphabet-table";

    const thead = document.createElement("thead");
    const header = document.createElement("tr");
    const groupHeading = document.createElement("th");
    groupHeading.className = "corner-cell";
    groupHeading.textContent = "Grupa";
    header.appendChild(groupHeading);
    for (let index = 0; index < groupSize; index++) {
        const heading = document.createElement("th");
        heading.className = "linear-position-header";
        heading.textContent = String(index + 1);
        header.appendChild(heading);
    }
    thead.appendChild(header);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (let offset = 0; offset < displayedEntries.length; offset += groupSize) {
        const group = displayedEntries.slice(offset, offset + groupSize);
        const row = document.createElement("tr");
        const rowKey = String(offset);
        row.dataset.rowKey = rowKey;
        const rowHeader = document.createElement("th");
        rowHeader.className = "row-header";
        rowHeader.dataset.row = rowKey;
        const { label } = createToggleLabel(
            rowKey,
            `${group[0].transliterations[0]}–${group[group.length - 1].transliterations[0]}`
        );
        rowHeader.appendChild(label);
        row.appendChild(rowHeader);

        for (let index = 0; index < groupSize; index++) {
            const cell = document.createElement("td");
            cell.className = "hiragana-cell";
            const entry = group[index];
            if (entry) {
                cell.classList.add("alphabet-character-cell");
                const pair = document.createElement("div");
                pair.className = "alphabet-character-pair";
                entry.characters.forEach((character, characterIndex) => {
                    const letter = document.createElement("button");
                    letter.type = "button";
                    letter.className = "alphabet-character";
                    letter.dataset.character = character;
                    letter.setAttribute("aria-label", `${character} — ${entry.transliterations[characterIndex]}`);
                    const symbol = document.createElement("span");
                    symbol.className = "kana-symbol";
                    symbol.textContent = character;
                    const reading = document.createElement("span");
                    reading.className = "kana-translit";
                    reading.textContent = entry.transliterations[characterIndex];
                    letter.append(symbol, reading);
                    letter.addEventListener("click", event => {
                        event.stopPropagation();
                        toggleCharacter(character);
                    });
                    pair.appendChild(letter);
                });
                cell.appendChild(pair);
            }
            row.appendChild(cell);
        }
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    tableHost.replaceChildren(table);
    syncSelection();
}

function syncSelection() {
    tableHost.querySelectorAll("tbody tr").forEach(row => {
        const rowCharacters = [...row.querySelectorAll(".alphabet-character")]
            .map(letter => letter.dataset.character);
        const isSelected = rowCharacters.length > 0 &&
            rowCharacters.every(character => selectedCharacters.has(character));
        const checkbox = row.querySelector(".row-header input");
        checkbox.checked = isSelected;
        row.classList.toggle("row-selected", isSelected);
        row.querySelector(".row-header").classList.toggle("row-selected", isSelected);
        row.querySelectorAll(".alphabet-character").forEach(letter => {
            const selected = selectedCharacters.has(letter.dataset.character);
            letter.classList.toggle("character-selected", selected);
            letter.setAttribute("aria-pressed", String(selected));
        });
    });
}

function switchAlphabet(alphabetName) {
    if (!alphabets[alphabetName]) return;
    currentAlphabet = alphabetName;
    selectedCharacters = new Set(
        Object.keys(alphabetCharacters())
    );
    alphabetSelect.value = currentAlphabet;
    saveState();
    updateTitle();
    renderTable();
    renderTransliterationButtons();
}

const initialCharacters = Array.isArray(restoredState?.selected)
    ? restoredState.selected.filter(character => Object.hasOwn(alphabetCharacters(), character))
    : Object.keys(alphabetCharacters());
const savedCharacterSetVersion = restoredState?.characterSetVersion || 0;
const shouldAddMissingCasePairs =
    (currentAlphabet === "churchSlavonicCyrillic" && savedCharacterSetVersion < 3) ||
    (currentAlphabet !== "churchSlavonicCyrillic" && savedCharacterSetVersion < 4);
if (shouldAddMissingCasePairs) {
    initialCharacters.forEach(character => {
        const alphabet = alphabets[currentAlphabet];
        const lowercase = Object.keys(alphabet.uppercaseForms).find(
            lower => alphabet.uppercaseForms[lower] === character
        );
        const counterpart = alphabet.uppercaseForms[character] || lowercase;
        if (counterpart && !initialCharacters.includes(counterpart)) {
            initialCharacters.push(counterpart);
        }
    });
}
selectedCharacters = new Set(initialCharacters);
alphabetSelect.value = currentAlphabet;
alphabetSelect.addEventListener("change", event => switchAlphabet(event.target.value));
tableHost.addEventListener("change", event => {
    if (!event.target.matches(".row-header input[type='checkbox']")) return;
    const offset = Number(event.target.value);
    const rowCharacters = [...event.target.closest("tr").querySelectorAll(".alphabet-character")]
        .map(letter => letter.dataset.character);
    rowCharacters
        .forEach(character => {
            if (event.target.checked) selectedCharacters.add(character);
            else selectedCharacters.delete(character);
        });
    saveState();
    syncSelection();
});

document.getElementById("select-all").addEventListener("click", () => {
    selectedCharacters = new Set(Object.keys(alphabetCharacters()));
    saveState();
    syncSelection();
});
document.getElementById("clear-all").addEventListener("click", () => {
    selectedCharacters.clear();
    saveState();
    syncSelection();
});

const alphabetStudy = window.AlphabetsCommon.createAlphabetStudy(
    character => alphabetCharacters()[character],
    "postep_inne_alfabety.json",
    {
        normalizeAnswer: value => value.trim().replace(/[ąĄ]/g, character =>
            character === "ą" ? "ǫ" : "Ǫ"
        )
    }
);

const transliterationTools = document.getElementById("transliteration-tools");
const transliterationCharacters = document.getElementById("transliteration-characters");
const transliterationCaseButton = document.getElementById("transliteration-case");
let uppercaseTransliteration = false;

function renderTransliterationButtons() {
    const specialCharacters = [...new Set(
        Object.values(alphabetCharacters()).flatMap(value =>
            [...value]
                .filter(character => !/[a-zA-Z]/.test(character))
                .map(character => character.toLowerCase())
        )
    )];
    if (specialCharacters.includes("ǫ")) specialCharacters.push("ą");
    transliterationTools.style.display = specialCharacters.length ? "flex" : "none";
    transliterationCharacters.replaceChildren();
    specialCharacters.forEach(character => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = uppercaseTransliteration ? character.toUpperCase() : character;
        button.dataset.character = uppercaseTransliteration
            ? character.toUpperCase()
            : character;
        button.addEventListener("click", () => {
            const input = document.getElementById("answer");
            const start = input.selectionStart;
            const end = input.selectionEnd;
            input.setRangeText(button.dataset.character, start, end, "end");
            input.focus();
        });
        transliterationCharacters.appendChild(button);
    });
}

transliterationCaseButton.addEventListener("click", () => {
    uppercaseTransliteration = !uppercaseTransliteration;
    transliterationCaseButton.textContent = uppercaseTransliteration
        ? "Wielkie litery"
        : "Małe litery";
    transliterationCaseButton.setAttribute("aria-pressed", String(uppercaseTransliteration));
    renderTransliterationButtons();
});

document.getElementById("start").addEventListener("click", () => {
    if (selectedCharacters.size === 0) {
        alert("Wybierz coś do nauki!");
        return;
    }
    alphabetStudy.startStudy([...selectedCharacters], {
        resetMistakes: true,
        rememberStudySet: true
    });
});

updateTitle();
renderTable();
renderTransliterationButtons();
saveState();
