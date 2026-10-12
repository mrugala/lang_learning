const {
    applyFontStyle: applyCommonFontStyle,
    readStoredFontStyle,
    storeFontStyle,
    isPageReload,
    createToggleLabel,
    isGroupFullySelected: areAllSelected,
    checkedValues,
    setGroupSelection
} = window.LangCommon;

const {
    hiragana,
    katakana,
    rowsDefMap,
    supplementalRows,
    dakuonAlternativeSpellings,
    readingParticleMeanings,
    readingCharacterNames,
    readingStories
} = window.KanaData;

let activeReadingStory = null;
let activeReadingChapter = null;
const nextChapterIndexByStory = new Map();
let readingLineIndex = 0;
let readingAnswers = [];
const READING_STATE_KEY = "kanaReadingPracticeState";

function saveReadingState() {
    if (!activeReadingStory || !activeReadingChapter) {
        window.LangCommon.storeSessionState(READING_STATE_KEY, null);
        return;
    }
    window.LangCommon.storeSessionState(READING_STATE_KEY, {
        active: true,
        storyKey: activeReadingStory.key,
        chapterIndex: activeReadingStory.chapters.indexOf(activeReadingChapter),
        readingLineIndex,
        readingAnswers,
        nextChapterIndex: nextChapterIndexByStory.get(activeReadingStory.key) || 0,
        foreignNameScript: document.getElementById("reading-foreign-name-script").value,
        view: document.getElementById("reading-results").hidden ? "active" : "results",
        answer: document.getElementById("reading-answer").value
    });
}

function appendReadingLine(container, parts) {
    container.replaceChildren();
    parts.forEach(part => {
        const text = getReadingPartText(part);
        const node = part.particle ? document.createElement("strong") : document.createTextNode(text);
        if (part.particle) node.textContent = text;
        container.appendChild(node);
    });
}

function getReadingPartText(part) {
    const foreignNameScript = document.getElementById("reading-foreign-name-script").value;
    if (!part.foreignName && !part.foreignWord) return part.text;
    if (foreignNameScript === "hiragana") {
        return Array.from(part.text, character => {
            const codePoint = character.codePointAt(0);
            return codePoint >= 0x30a1 && codePoint <= 0x30f6
                ? String.fromCodePoint(codePoint - 0x60)
                : character;
        }).join("");
    }
    return Array.from(part.text, character => {
        const codePoint = character.codePointAt(0);
        return codePoint >= 0x3041 && codePoint <= 0x3096
            ? String.fromCodePoint(codePoint + 0x60)
            : character;
    }).join("");
}

function normalizeReadingAnswer(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[\s、。,.!?！？]/g, "");
}

function readingEditDistance(left, right) {
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
        const current = [leftIndex];
        for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
            current[rightIndex] = Math.min(
                current[rightIndex - 1] + 1,
                previous[rightIndex] + 1,
                previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
            );
        }
        previous.splice(0, previous.length, ...current);
    }
    return previous[right.length];
}

function alignReadingAnswer(parts, entered) {
    const answer = normalizeReadingAnswer(entered);
    const expected = parts.map(part => normalizeReadingAnswer(part.reading));
    const costs = Array.from({ length: expected.length + 1 }, () =>
        Array(answer.length + 1).fill(Infinity)
    );
    const previousPositions = Array.from({ length: expected.length + 1 }, () =>
        Array(answer.length + 1).fill(null)
    );
    costs[0][0] = 0;

    expected.forEach((word, wordIndex) => {
        for (let start = 0; start <= answer.length; start++) {
            if (!Number.isFinite(costs[wordIndex][start])) continue;
            for (let end = start; end <= answer.length; end++) {
                const typed = answer.slice(start, end);
                const lengthPenalty = Math.abs(typed.length - word.length) * 0.01;
                const cost = costs[wordIndex][start] + readingEditDistance(typed, word) + lengthPenalty;
                if (cost < costs[wordIndex + 1][end]) {
                    costs[wordIndex + 1][end] = cost;
                    previousPositions[wordIndex + 1][end] = start;
                }
            }
        }
    });

    const aligned = Array(expected.length);
    let end = answer.length;
    for (let wordIndex = expected.length; wordIndex > 0; wordIndex--) {
        const start = previousPositions[wordIndex][end];
        if (start === null) {
            throw new Error("Unable to align a reading answer with its kana fragments.");
        }
        aligned[wordIndex - 1] = {
            entered: answer.slice(start, end),
            correct: answer.slice(start, end) === expected[wordIndex - 1]
        };
        end = start;
    }
    return aligned;
}

function renderReadingPrompt() {
    const parts = activeReadingChapter.verses[readingLineIndex];
    document.getElementById("reading-title").textContent =
        `Czytanie: ${activeReadingChapter.title}`;
    document.getElementById("reading-progress").textContent =
        `Rozdział ${activeReadingChapter.chapterNumber}, werset ${readingLineIndex + 1} z ${activeReadingChapter.verses.length}`;
    appendReadingLine(document.getElementById("reading-line"), parts);
    updateReadingLongVowelNote(parts);
    document.getElementById("reading-answer").value = "";
    document.getElementById("reading-feedback").textContent = "";
    document.getElementById("reading-submit").textContent =
        readingLineIndex === activeReadingChapter.verses.length - 1 ? "Pokaż cały tekst" : "Dalej";
    document.getElementById("reading-answer").focus();
    saveReadingState();
}

function updateReadingLongVowelNote(parts) {
    document.getElementById("reading-long-vowel-note").hidden =
        !parts.some(part => getReadingPartText(part).includes("ー"));
}

function showReadingResults() {
    document.getElementById("reading-active").hidden = true;
    const results = document.getElementById("reading-results");
    const linesHost = document.getElementById("reading-result-lines");
    const correctCount = readingAnswers.filter(answer => answer.correct).length;
    document.getElementById("reading-score").textContent =
        `Poprawnie: ${correctCount} z ${activeReadingChapter.verses.length} wersetów.`;
    document.getElementById("reading-results-title").textContent =
        `Rozdział ${activeReadingChapter.chapterNumber}: ${activeReadingChapter.title}`;
    linesHost.replaceChildren();

    activeReadingChapter.verses.forEach((parts, index) => {
        const resultLine = document.createElement("section");
        resultLine.className = `reading-result-line${readingAnswers[index].correct ? "" : " has-error"}`;
        const verseNumber = document.createElement("span");
        verseNumber.className = "reading-verse-number";
        verseNumber.textContent = `${activeReadingChapter.chapterNumber}:${index + 1}`;
        const translation = activeReadingChapter.verseTranslations[index];
        if (typeof translation !== "string" || !translation.trim()) {
            throw new Error(
                `Missing translation for chapter ${activeReadingChapter.chapterNumber}, verse ${index + 1}.`
            );
        }
        const translationLine = document.createElement("p");
        translationLine.className = "reading-verse-translation";
        translationLine.lang = "pl";
        translationLine.textContent = translation;
        const hiraganaLine = document.createElement("div");
        hiraganaLine.className = "reading-result-hiragana";
        const partResults = readingAnswers[index].parts;
        parts.forEach((part, partIndex) => {
            const content = document.createElement(part.particle ? "strong" : "span");
            content.textContent = getReadingPartText(part);
            if (part.particle) {
                const particle = part.text.trim().replace(/[、。,.!?！？]/g, "");
                const particleMeaning = readingParticleMeanings[particle];
                if (!particleMeaning) {
                    throw new Error(`Missing reading-practice particle meaning for: ${particle}`);
                }
                content.title = `${part.text.trim()} — partykuła: ${particleMeaning}`;
                content.setAttribute("aria-label", `${part.text.trim()}: partykuła — ${particleMeaning}`);
                content.classList.add("has-reading-meaning");
            } else {
                const characterName = readingCharacterNames[normalizeReadingAnswer(part.reading)];
                if (characterName) {
                    content.title = characterName;
                    content.setAttribute("aria-label", `${part.text.trim()}: ${characterName}`);
                    content.classList.add("has-reading-meaning");
                } else {
                    const vocabulary = findReadingVocabulary(part.reading);
                    if (vocabulary) {
                        content.title = `${vocabulary.kanji} — ${vocabulary.meaning}`;
                        content.setAttribute("aria-label", `${part.text.trim()}: ${vocabulary.kanji}, ${vocabulary.meaning}`);
                        content.classList.add("has-reading-meaning");
                    }
                }
            }
            if (!partResults[partIndex].correct) {
                content.classList.add("is-incorrect");
                content.title = `${content.title ? `${content.title}. ` : ""}Niepoprawny odczyt`;
            }
            hiraganaLine.appendChild(content);
        });

        const answerLine = document.createElement("p");
        answerLine.className = "reading-result-answer";
        answerLine.textContent = readingAnswers[index].entered;
        if (!readingAnswers[index].correct) {
            const correction = document.createElement("p");
            correction.className = "reading-correction";
            correction.textContent = `Poprawnie: ${parts
                .filter((part, partIndex) => !partResults[partIndex].correct)
                .map(part => `${getReadingPartText(part).trim()} — ${part.reading.trim()}`)
                .join("; ")}`;
            resultLine.append(verseNumber, hiraganaLine, answerLine, correction, translationLine);
        } else {
            resultLine.append(verseNumber, hiraganaLine, answerLine, translationLine);
        }
        linesHost.appendChild(resultLine);
    });

    document.getElementById("reading-source").textContent = activeReadingStory.source;
    results.hidden = false;
    saveReadingState();
}

const readingVocabularyByAlias = new Map(
    (window.readingVocabulary || []).flatMap(entry =>
        entry.aliases.map(alias => [normalizeReadingAnswer(alias), entry])
    )
);

function findReadingVocabulary(reading) {
    return readingVocabularyByAlias.get(normalizeReadingAnswer(reading)) || null;
}

function closeReadingPractice() {
    activeReadingStory = null;
    activeReadingChapter = null;
    window.LangCommon.storeSessionState(READING_STATE_KEY, null);
    document.getElementById("reading-practice").hidden = true;
    document.getElementById("reading-divider").hidden = true;
    document.getElementById("selection-panel").hidden = false;
    document.getElementById("reading-active").hidden = false;
    document.getElementById("reading-results").hidden = true;
}

function getKanaDisplayTransliteration(kana, transliteration) {
    const alternatives = dakuonAlternativeSpellings[kana];
    return alternatives ? `${transliteration}/${alternatives.join("/")}` : transliteration;
}

function getSupplementalDisplayRows(tableType) {
    if (tableType === "dakuon") {
        return colsDef.map((key, index) => ({ key, label: key, index }));
    }

    return [
        { key: "ya", label: "ゃ", index: 0, voicing: "plain" },
        { key: "yu", label: "ゅ", index: 1, voicing: "plain" },
        { key: "yo", label: "ょ", index: 2, voicing: "plain" },
        { key: "dakuten-ya", label: "ゃ", index: 0, voicing: "marked" },
        { key: "dakuten-yu", label: "ゅ", index: 1, voicing: "marked" },
        { key: "dakuten-yo", label: "ょ", index: 2, voicing: "marked" }
    ];
}

function kanaForAlphabet(kana, alphabetName = currentAlphabet) {
    return alphabetName === "katakana"
        ? [...kana].map(char => String.fromCodePoint(char.codePointAt(0) + 0x60)).join("")
        : kana;
}

function getSupplementalRows(tableType, alphabetName = currentAlphabet) {
    return supplementalRows[tableType].map(row => ({
        ...row,
        chars: row.chars.map(char => kanaForAlphabet(char, alphabetName))
    }));
}

const alphabetMap = {
    hiragana,
    katakana
};
const extendedKanaByAlphabet = {
    hiragana: ["ゐ", "ゑ"],
    katakana: ["ヰ", "ヱ"]
};
Object.keys(alphabetMap).forEach(alphabetName => {
    ["dakuon", "youon"].forEach(tableType => {
        getSupplementalRows(tableType, alphabetName).forEach(row => {
            row.chars.forEach((char, index) => {
                alphabetMap[alphabetName][char] = row.translit[index];
            });
        });
    });
});
const colsDef = ["a", "i", "u", "e", "o"];
const UI_STATE_KEY = "kanaSelectionUiState";

function readSavedUiState() {
    if (!isPageReload()) return null;

    try {
        const saved = JSON.parse(sessionStorage.getItem(UI_STATE_KEY));
        if (!saved || !alphabetMap[saved.alphabet]) return null;
        return saved;
    } catch (error) {
        return null;
    }
}

const restoredUiState = readSavedUiState();
let currentAlphabet = restoredUiState?.alphabet || "hiragana";
let extendedKanaEnabled = restoredUiState?.extendedKanaEnabled === true;
function getRowsForAlphabet(alphabetName) {
    if (!extendedKanaEnabled) return rowsDefMap[alphabetName];
    return rowsDefMap[alphabetName].map(row => {
        if (row.key !== "w") return row;
        const extendedKana = extendedKanaByAlphabet[alphabetName];
        const extendedTransliterations = ["wi", "we"];
        const chars = [...row.chars];
        const translit = [...row.translit];
        [1, 3].forEach((index, extendedIndex) => {
            chars[index] = extendedKana[extendedIndex];
            translit[index] = extendedTransliterations[extendedIndex];
        });
        return { ...row, chars, translit };
    });
}

let rowsDef = getRowsForAlphabet(currentAlphabet);
const supplementalExpanded = {
    dakuon: restoredUiState?.expanded?.dakuon === true,
    youon: restoredUiState?.expanded?.youon === true
};
function getAvailableKana(alphabetName = currentAlphabet) {
    return Object.keys(alphabetMap[alphabetName]).filter(char =>
        extendedKanaEnabled || !extendedKanaByAlphabet[alphabetName].includes(char)
    );
}

const kanaForCurrentAlphabet = new Set(getAvailableKana());
const selectedCells = new Set(
    Array.isArray(restoredUiState?.selected)
        ? restoredUiState.selected.filter(char => kanaForCurrentAlphabet.has(char))
        : kanaForCurrentAlphabet
);

function saveUiState() {
    try {
        sessionStorage.setItem(UI_STATE_KEY, JSON.stringify({
            alphabet: currentAlphabet,
            selected: [...selectedCells],
            extendedKanaEnabled,
            expanded: { ...supplementalExpanded }
        }));
    } catch (error) {
        // Session storage may be unavailable in restricted browser contexts.
    }
}

function getVisibleKana() {
    const visibleKana = new Set(getAvailableKana());
    ["dakuon", "youon"].forEach(tableType => {
        if (!supplementalExpanded[tableType]) {
            getSupplementalRows(tableType).forEach(row => {
                row.chars.forEach(char => visibleKana.delete(char));
            });
        }
    });
    return [...visibleKana];
}

function updateTitle() {
    const titleEl = document.querySelector("h1");
    const titles = {
        hiragana: ["Hiragana", "ひらがな"],
        katakana: ["Katakana", "カタカナ"]
    };
    const extendedKanaLabels = {
        hiragana: "Kana rozszerzone (ゐ wi, ゑ we)",
        katakana: "Kana rozszerzone (ヰ wi, ヱ we)"
    };
    const [romanized, label] = titles[currentAlphabet];

    document.title = romanized;
    document.getElementById("answer").placeholder = "Podaj rōmaji";
    document.getElementById("extended-kana-label").textContent = extendedKanaLabels[currentAlphabet];

    if (titleEl) {
        titleEl.innerHTML = `${label} <span>(${romanized})</span>`;
    }
}

function switchAlphabet(alphabetName) {
    if (!alphabetMap[alphabetName]) return;

    currentAlphabet = alphabetName;
    rowsDef = getRowsForAlphabet(alphabetName);
    selectedCells.clear();
    getAvailableKana(alphabetName).forEach(char => selectedCells.add(char));
    saveUiState();
    updateTitle();
    document.getElementById("start-reading-practice").hidden = alphabetName !== "hiragana";
    document.getElementById("reading-story-picker").hidden = alphabetName !== "hiragana";
    renderTable();
    renderSupplementalTables();
    syncSelectionHighlights();
}

function isMobileLayout() {
    return window.matchMedia("(max-width: 720px)").matches || window.innerWidth <= 720;
}

function buildKanaCell(colKey, rowKey, kana, translit) {
    const cell = document.createElement("td");
    cell.className = "hiragana-cell";
    cell.dataset.col = colKey;
    cell.dataset.row = rowKey;
    cell.dataset.kana = kana;

    if (!kana) {
        cell.textContent = "";
        return cell;
    }

    const stack = document.createElement("div");
    stack.className = "kana-stack";

    const kanaEl = document.createElement("div");
    kanaEl.className = "kana-symbol";
    kanaEl.textContent = kana;

    const translitEl = document.createElement("div");
    translitEl.className = "kana-translit";
    translitEl.textContent = translit;

    stack.appendChild(kanaEl);
    stack.appendChild(translitEl);
    cell.appendChild(stack);

    cell.addEventListener("click", () => {
        if (selectedCells.has(kana)) {
            selectedCells.delete(kana);
            cell.classList.remove("cell-selected");
        } else {
            selectedCells.add(kana);
            cell.classList.add("cell-selected");
        }
        syncSelectionHighlights();
    });

    return cell;
}

function setMobileTableCellSize(table, availableWidth) {
    if (!isMobileLayout()) return;

    const columnCount = table.querySelector("thead tr")?.children.length;
    if (!columnCount) return;

    table.style.setProperty("--mobile-column-count", columnCount);
    const cellSize = Math.floor(availableWidth / columnCount);
    table.style.setProperty("--mobile-cell-size", `${cellSize}px`);
    table.style.setProperty("--mobile-kana-size", `${(cellSize * 0.75).toFixed(2)}px`);
}

function renderTable() {
    const tableHost = document.getElementById("table");
    tableHost.innerHTML = "";

    const table = document.createElement("table");
    table.className = "hiragana-table";
    const isMobile = isMobileLayout();

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const cornerCell = document.createElement("th");
    cornerCell.className = "corner-cell";
    headRow.appendChild(cornerCell);

    const columnDefs = isMobile ? colsDef : rowsDef.map(row => row.key);
    const rowDefs = isMobile ? rowsDef.map(row => row.key) : colsDef;
    table.dataset.rowGroupType = isMobile ? "col" : "row";
    table.dataset.columnGroupType = isMobile ? "row" : "col";

    columnDefs.forEach((key, index) => {
        const th = document.createElement("th");
        th.className = "column-header";
        th.dataset.col = key;
        th.dataset.groupType = isMobile ? "row" : "col";

        const columnKey = isMobile ? key : rowsDef[index].key;
        // An empty label (e.g. the vowel row and the "n" row) stays empty so the
        // column header renders as a hidden placeholder rather than the raw key.
        const labelText = isMobile ? key : rowsDef[index].label ?? "";
        const hasLabel = Boolean(labelText && labelText.trim());
        const { label } = createToggleLabel(columnKey, labelText, { placeholder: !hasLabel });

        th.appendChild(label);
        headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    rowDefs.forEach((rowKeyOrVowel) => {
        const rowEl = document.createElement("tr");
        const rowHeader = document.createElement("th");
        rowHeader.className = "row-header";

        if (isMobile) {
            const rowDef = rowsDef.find(row => row.key === rowKeyOrVowel) || {
                key: rowKeyOrVowel,
                label: rowKeyOrVowel
            };
            rowEl.dataset.rowKey = rowDef.key;
            rowEl.dataset.groupType = "col";
            rowHeader.dataset.row = rowDef.key;
            rowHeader.dataset.groupType = "col";
            const hasLabel = Boolean(rowDef.label && rowDef.label.trim());
            const { label } = createToggleLabel(rowDef.key, rowDef.label || rowDef.key, { placeholder: !hasLabel });
            rowHeader.appendChild(label);
            rowEl.appendChild(rowHeader);

            colsDef.forEach(vowel => {
                const index = colsDef.indexOf(vowel);
                const kana = rowDef.chars[index] || "";
                const translit = rowDef.translit[index] || "";
                rowEl.appendChild(buildKanaCell(vowel, rowDef.key, kana, translit));
            });
        } else {
            rowEl.dataset.rowKey = rowKeyOrVowel;
            rowEl.dataset.groupType = "row";
            rowHeader.dataset.row = rowKeyOrVowel;
            rowHeader.dataset.groupType = "row";
            const { label } = createToggleLabel(rowKeyOrVowel, rowKeyOrVowel);
            rowHeader.appendChild(label);
            rowEl.appendChild(rowHeader);

            rowsDef.forEach(row => {
                const index = colsDef.indexOf(rowKeyOrVowel);
                const kana = row.chars[index] || "";
                const translit = row.translit[index] || "";
                rowEl.appendChild(buildKanaCell(row.key, rowKeyOrVowel, kana, translit));
            });
        }

        tbody.appendChild(rowEl);
    });

    table.appendChild(tbody);
    tableHost.appendChild(table);
    setMobileTableCellSize(table, tableHost.clientWidth);
}

window.addEventListener("resize", () => {
    renderTable();
    renderSupplementalTables();
    syncSelectionHighlights();
});

renderTable();

const fontStyleSelect = document.getElementById("font-style");

function applyFontStyle(styleName) {
    const normalized = applyCommonFontStyle(styleName, fontStyleSelect);
    storeFontStyle(normalized);
}

const savedFontStyle = readStoredFontStyle();

if (fontStyleSelect) {
    fontStyleSelect.addEventListener("change", (event) => {
        applyFontStyle(event.target.value);
        renderSupplementalTables();
        syncSelectionHighlights();
    });
}

document.fonts?.addEventListener("loadingdone", () => {
    renderSupplementalTables();
    syncSelectionHighlights();
});

const alphabetTypeSelect = document.getElementById("alphabet-type");
if (alphabetTypeSelect) {
    alphabetTypeSelect.value = currentAlphabet;
    alphabetTypeSelect.addEventListener("change", (event) => {
        switchAlphabet(event.target.value);
    });
}

const extendedKanaCheckbox = document.getElementById("extended-kana");
extendedKanaCheckbox.checked = extendedKanaEnabled;
extendedKanaCheckbox.addEventListener("change", () => {
    extendedKanaEnabled = extendedKanaCheckbox.checked;
    rowsDef = getRowsForAlphabet(currentAlphabet);
    extendedKanaByAlphabet[currentAlphabet].forEach(char => {
        if (extendedKanaEnabled) {
            selectedCells.add(char);
        } else {
            selectedCells.delete(char);
        }
    });
    saveUiState();
    renderTable();
    renderSupplementalTables();
    syncSelectionHighlights();
});

applyFontStyle(savedFontStyle || "default");
updateTitle();

function getGroupCells(groupType, groupKey) {
    const cells = [];
    if (groupType === "row") {
        const index = colsDef.indexOf(groupKey);
        rowsDef.forEach(row => {
            const char = row.chars[index];
            if (char) cells.push(char);
        });
        return cells;
    }

    if (groupType === "col") {
        const target = rowsDef.find(row => row.key === groupKey);
        if (!target) return [];
        target.chars.forEach(char => {
            if (char) cells.push(char);
        });
        return cells;
    }

    return [];
}

function getSupplementalGroupCells(tableType, groupType, groupKey) {
    const rows = getSupplementalRows(tableType);

    if (groupType === "row") {
        const displayRow = getSupplementalDisplayRows(tableType).find(row => row.key === groupKey);
        if (!displayRow) return [];
        return rows
            .filter(row => tableType === "dakuon" ||
                (displayRow.voicing === "plain" ? !row.voicing : Boolean(row.voicing)))
            .map(row => row.chars[displayRow.index])
            .filter(Boolean);
    }

    if (groupType === "col") {
        return rows
            .filter(row => row.baseKey === groupKey)
            .flatMap(row => row.chars);
    }

    return [];
}

function getSelectionGroupCells(table, groupType, groupKey) {
    return table?.dataset.tableType
        ? getSupplementalGroupCells(table.dataset.tableType, groupType, groupKey)
        : getGroupCells(groupType, groupKey);
}

function isSelectionGroupFullySelected(table, groupType, groupKey) {
    return areAllSelected(getSelectionGroupCells(table, groupType, groupKey), selectedCells);
}

function renderSupplementalTable(tableType, title, titleJapanese) {
    const section = document.createElement("section");
    section.className = "supplemental-section";
    const primaryHost = document.getElementById("table");
    const primaryTable = primaryHost.querySelector(".hiragana-table");
    const primaryHeaderCells = primaryTable?.querySelector("thead tr")?.children || [];
    const rows = getSupplementalRows(tableType);
    const primaryColumnKeys = rowsDef.map(row => row.key);
    const lastColumnIndex = Math.max(...rows.map(row => primaryColumnKeys.indexOf(row.baseKey)));
    const isMobileLayoutState = isMobileLayout();
    const fallbackTableWidth = primaryTable ? primaryTable.getBoundingClientRect().width : 0;
    const widthTarget = primaryHeaderCells[Math.min(lastColumnIndex + 1, primaryHeaderCells.length - 1)];
    const tableWidth = widthTarget && primaryTable
        ? widthTarget.getBoundingClientRect().right - primaryTable.getBoundingClientRect().left
        : fallbackTableWidth;
    section.style.width = isMobileLayoutState ? "100%" : `${Math.ceil(tableWidth) + 6}px`;

    const titleButton = document.createElement("button");
    titleButton.type = "button";
    titleButton.className = "supplemental-title";
    titleButton.setAttribute("aria-expanded", String(supplementalExpanded[tableType]));
    titleButton.textContent = `${titleJapanese} (${title})`;
    titleButton.addEventListener("click", () => {
        supplementalExpanded[tableType] = !supplementalExpanded[tableType];
        saveUiState();
        renderSupplementalTables();
        syncSelectionHighlights();
    });
    section.appendChild(titleButton);

    if (!supplementalExpanded[tableType]) {
        return section;
    }

    const table = document.createElement("table");
    table.className = "hiragana-table supplemental-table";
    table.dataset.tableType = tableType;
    const isMobile = isMobileLayout();
    table.dataset.rowGroupType = isMobile ? "col" : "row";
    table.dataset.columnGroupType = isMobile ? "row" : "col";

    if (isMobile) {
        const tbody = document.createElement("tbody");
        const displayRows = getSupplementalDisplayRows(tableType);
        const visibleColumnKeys = primaryColumnKeys.filter(columnKey =>
            (tableType === "dakuon" && columnKey === "m") ||
            displayRows.some(({ index, voicing }) =>
                rows.some(row =>
                    row.baseKey === columnKey &&
                    row.chars[index] &&
                    (tableType === "dakuon" ||
                        (voicing === "plain" ? !row.voicing : Boolean(row.voicing)))
                )
            )
        );
        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        const cornerCell = document.createElement("th");
        cornerCell.className = "corner-cell";
        headRow.appendChild(cornerCell);

        displayRows.forEach(({ label, key, voicing }) => {
            const th = document.createElement("th");
            th.className = "column-header";
            th.dataset.col = key;
            th.dataset.groupType = "row";
            const { label: headerLabel } = createToggleLabel(key, label);
            if (tableType === "youon") {
                const headerLabelText = headerLabel.querySelector("span");
                headerLabelText.replaceChildren();
                if (voicing === "marked") {
                    const dakuten = document.createElement("span");
                    dakuten.className = "youon-mark youon-dakuten";
                    dakuten.textContent = "゛";
                    const handakuten = document.createElement("span");
                    handakuten.className = "youon-mark youon-handakuten";
                    handakuten.textContent = "゜";
                    headerLabelText.append(dakuten, handakuten);
                }
                const smallKana = document.createElement("span");
                smallKana.className = "youon-small-kana";
                smallKana.textContent = label;
                headerLabelText.appendChild(smallKana);
                headerLabelText.classList.add("youon-row-label");
                if (voicing === "marked") {
                    smallKana.style.marginLeft = "-0.45em";
                }
            }
            th.appendChild(headerLabel);
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        visibleColumnKeys.forEach(columnKey => {
            const rowEl = document.createElement("tr");
            if (tableType === "dakuon" && columnKey === "m") {
                rowEl.className = "supplemental-group-heading";
                const groupLabel = document.createElement("td");
                groupLabel.className = "supplemental-group-label";
                groupLabel.colSpan = displayRows.length + 1;
                groupLabel.setAttribute("aria-label", "Handakuon");
                groupLabel.textContent = "Handakuon";
                rowEl.appendChild(groupLabel);
                tbody.appendChild(rowEl);
                return;
            }

            rowEl.dataset.rowKey = columnKey;
            rowEl.dataset.groupType = "col";

            const rowGroups = rows.filter(row => row.baseKey === columnKey);
            const rowHeader = document.createElement("th");
            rowHeader.className = "row-header";
            rowHeader.dataset.row = columnKey;
            rowHeader.dataset.groupType = "col";
            const { label: headerLabel } = createToggleLabel(
                columnKey,
                rowGroups.map(row => row.label).join(" / ")
            );
            rowHeader.appendChild(headerLabel);
            rowEl.appendChild(rowHeader);

            const groupsForDisplayRow = ({ index: rowIndex, voicing }) => rows.filter(row =>
                row.baseKey === columnKey &&
                row.chars[rowIndex] &&
                (tableType === "dakuon" ||
                    (voicing === "plain" ? !row.voicing : Boolean(row.voicing)))
            );

            for (let displayIndex = 0; displayIndex < displayRows.length; displayIndex++) {
                const { key: displayKey, index: rowIndex } = displayRows[displayIndex];
                const groups = groupsForDisplayRow(displayRows[displayIndex]);

                if (groups.length === 0) {
                    let span = 1;
                    while (displayIndex + span < displayRows.length &&
                        groupsForDisplayRow(displayRows[displayIndex + span]).length === 0) {
                        span++;
                    }
                    const emptyCell = document.createElement("td");
                    emptyCell.className = "supplemental-empty";
                    emptyCell.colSpan = span;
                    rowEl.appendChild(emptyCell);
                    displayIndex += span - 1;
                    continue;
                }

                const cell = document.createElement("td");
                cell.className = `hiragana-cell supplemental-cell${groups.length > 1 ? " supplemental-cell-multiple" : ""}`;
                cell.dataset.col = displayKey;
                cell.dataset.row = columnKey;
                groups.forEach(group => {
                    const kana = group.chars[rowIndex];
                    const stack = document.createElement("div");
                    stack.className = "kana-stack supplemental-kana";
                    stack.dataset.kana = kana;
                    stack.dataset.col = displayKey;
                    stack.dataset.group = group.key;
                    stack.setAttribute("role", "button");
                    stack.tabIndex = 0;
                    const kanaEl = document.createElement("div");
                    kanaEl.className = kana.length > 1 ? "small-kana-symbol" : "kana-symbol";
                    kanaEl.textContent = kana;
                    const translitEl = document.createElement("div");
                    translitEl.className = "kana-translit";
                    translitEl.textContent = getKanaDisplayTransliteration(
                        kana,
                        group.translit[rowIndex]
                    );
                    stack.append(kanaEl, translitEl);
                    cell.appendChild(stack);
                });
                rowEl.appendChild(cell);
            }

            tbody.appendChild(rowEl);
        });

        table.appendChild(tbody);
        section.appendChild(table);
        return section;
    }

    const tableColumns = document.createElement("colgroup");
    table.style.width = `${tableWidth}px`;
    [...primaryHeaderCells].slice(0, lastColumnIndex + 2).forEach(headerCell => {
        const column = document.createElement("col");
        column.style.width = `${headerCell.getBoundingClientRect().width}px`;
        tableColumns.appendChild(column);
    });
    table.appendChild(tableColumns);

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const cornerCell = document.createElement("th");
    cornerCell.className = "corner-cell";
    headRow.appendChild(cornerCell);

    const visibleColumnKeys = primaryColumnKeys.slice(0, lastColumnIndex + 1);
    for (let index = 0; index < visibleColumnKeys.length; index++) {
        const key = primaryColumnKeys[index];
        const groups = rows.filter(row => row.baseKey === key);
        if (groups.length === 0) {
            let span = 1;
            while (index + span < visibleColumnKeys.length &&
                !rows.some(row => row.baseKey === visibleColumnKeys[index + span])) {
                span++;
            }
            const emptyHeader = document.createElement("th");
            emptyHeader.className = "supplemental-empty";
            emptyHeader.colSpan = span;
            headRow.appendChild(emptyHeader);
            index += span - 1;
            continue;
        }

        const th = document.createElement("th");
        th.className = "column-header";
        th.dataset.col = key;
        th.dataset.groupType = "col";
        const { label } = createToggleLabel(key, groups.map(row => row.label).join(" / "));
        th.appendChild(label);
        headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const vowelRows = getSupplementalDisplayRows(tableType);
    const verticallyMergedEmptyColumns = new Set();
    const primaryRowHeight = primaryTable.querySelector("tbody tr")?.getBoundingClientRect().height || 58;
    const handakuonColumnWidth = primaryHeaderCells[primaryColumnKeys.indexOf("m") + 1]?.getBoundingClientRect().width || 55;
    vowelRows.forEach(({ key, label: rowLabel, index: rowIndex, voicing }, displayRowIndex) => {
        const rowEl = document.createElement("tr");
        rowEl.dataset.rowKey = key;
        rowEl.dataset.groupType = "row";
        const rowHeader = document.createElement("th");
        rowHeader.className = "row-header";
        rowHeader.dataset.row = key;
        rowHeader.dataset.groupType = "row";
        const { label } = createToggleLabel(key, rowLabel);
        if (tableType === "youon") {
            const rowLabelText = label.querySelector("span");
            rowLabelText.replaceChildren();
            if (voicing === "marked") {
                const dakuten = document.createElement("span");
                dakuten.className = "youon-mark youon-dakuten";
                dakuten.textContent = "゛";
                const handakuten = document.createElement("span");
                handakuten.className = "youon-mark youon-handakuten";
                handakuten.textContent = "゜";
                rowLabelText.append(dakuten, handakuten);
            }
            const smallKana = document.createElement("span");
            smallKana.className = "youon-small-kana";
            smallKana.textContent = rowLabel;
            rowLabelText.appendChild(smallKana);
            rowLabelText.classList.add("youon-row-label");
            if (voicing === "marked") {
                smallKana.style.marginLeft = "-0.45em";
            }
        }
        rowHeader.appendChild(label);
        rowEl.appendChild(rowHeader);

        for (let columnIndex = 0; columnIndex < visibleColumnKeys.length; columnIndex++) {
            const columnKey = visibleColumnKeys[columnIndex];
            if (verticallyMergedEmptyColumns.has(columnKey)) {
                continue;
            }
            if (tableType === "dakuon" && columnKey === "m") {
                if (displayRowIndex === 0) {
                    const groupLabel = document.createElement("td");
                    groupLabel.className = "supplemental-group-label";
                    groupLabel.rowSpan = vowelRows.length;
                    groupLabel.setAttribute("aria-label", "Handakuon");
                    const labelText = document.createElement("span");
                    labelText.className = "supplemental-group-label-text";
                    labelText.setAttribute("aria-hidden", "true");
                    labelText.style.width = `${primaryRowHeight * vowelRows.length}px`;
                    labelText.style.height = `${handakuonColumnWidth}px`;
                    [..."Handakuon"].forEach(character => {
                        const letter = document.createElement("span");
                        letter.textContent = character;
                        labelText.appendChild(letter);
                    });
                    groupLabel.appendChild(labelText);
                    rowEl.appendChild(groupLabel);
                }
                continue;
            }
            const groups = rows.filter(row =>
                row.baseKey === columnKey &&
                row.chars[rowIndex] &&
                (tableType === "dakuon" ||
                    (voicing === "plain" ? !row.voicing : Boolean(row.voicing)))
            );
            if (groups.length === 0) {
                let span = 1;
                while (columnIndex + span < visibleColumnKeys.length &&
                    !verticallyMergedEmptyColumns.has(visibleColumnKeys[columnIndex + span]) &&
                    !(tableType === "dakuon" && visibleColumnKeys[columnIndex + span] === "m") &&
                    !rows.some(row =>
                        row.baseKey === visibleColumnKeys[columnIndex + span] &&
                        row.chars[rowIndex] &&
                        (tableType === "dakuon" ||
                            (voicing === "plain" ? !row.voicing : Boolean(row.voicing)))
                    )) {
                    span++;
                }
                const emptyCell = document.createElement("td");
                emptyCell.className = "supplemental-empty";
                emptyCell.colSpan = span;
                emptyCell.rowSpan = vowelRows.length - displayRowIndex;
                visibleColumnKeys
                    .slice(columnIndex, columnIndex + span)
                    .forEach(emptyColumn => verticallyMergedEmptyColumns.add(emptyColumn));
                rowEl.appendChild(emptyCell);
                columnIndex += span - 1;
                continue;
            }

            const cell = document.createElement("td");
            cell.className = `hiragana-cell supplemental-cell${groups.length > 1 ? " supplemental-cell-multiple" : ""}`;
            cell.dataset.col = columnKey;
            groups.forEach(group => {
                const kana = group.chars[rowIndex];
                const stack = document.createElement("div");
                stack.className = "kana-stack supplemental-kana";
                stack.dataset.kana = kana;
                stack.dataset.col = columnKey;
                stack.dataset.group = group.key;
                stack.setAttribute("role", "button");
                stack.tabIndex = 0;
                const kanaEl = document.createElement("div");
                kanaEl.textContent = kana;
                if (kanaEl.textContent.length > 1) {
                    kanaEl.className = "small-kana-symbol";
                } else {
                    kanaEl.className = "kana-symbol";
                }
                const translitEl = document.createElement("div");
                translitEl.className = "kana-translit";
                translitEl.textContent = getKanaDisplayTransliteration(
                    kana,
                    group.translit[rowIndex]
                );
                stack.append(kanaEl, translitEl);
                cell.appendChild(stack);
            });
            rowEl.appendChild(cell);
        }
        tbody.appendChild(rowEl);
    });
    table.appendChild(tbody);
    section.appendChild(table);
    return section;
}

function renderSupplementalTables() {
    const host = document.getElementById("supplemental-tables");
    host.style.display = "";
    host.replaceChildren(
        renderSupplementalTable("dakuon", "Dakuon・Handakuon", "濁音・半濁音"),
        renderSupplementalTable("youon", "Yō-on", "拗音")
    );
    host.querySelectorAll(".supplemental-table").forEach(table => {
        setMobileTableCellSize(table, table.parentElement.clientWidth);
    });
    const leftOffset = document.getElementById("table").getBoundingClientRect().left -
        host.getBoundingClientRect().left;
    host.querySelectorAll(".supplemental-section").forEach(section => {
        section.style.marginLeft = `${leftOffset}px`;
    });
}

renderSupplementalTables();

function syncGroupCheckboxes() {
    document.querySelectorAll("#table th[data-group-type] input, .supplemental-table th[data-group-type] input").forEach(input => {
        const header = input.closest("th");
        const table = input.closest("table");
        input.checked = isSelectionGroupFullySelected(table, header.dataset.groupType, input.value);
    });
}

function syncSelectionHighlights() {
    document.querySelectorAll(".hiragana-table").forEach(table => {
        const rowGroupType = table.dataset.rowGroupType;
        const columnGroupType = table.dataset.columnGroupType;

        table.querySelectorAll("tbody tr[data-row-key]").forEach(row => {
            const isRowChecked = isSelectionGroupFullySelected(
                table,
                rowGroupType,
                row.dataset.rowKey
            );
            row.classList.toggle("row-selected", isRowChecked);
            row.querySelector(".row-header").classList.toggle("row-selected", isRowChecked);

            row.querySelectorAll("td.hiragana-cell").forEach(cell => {
                const isColumnChecked = isSelectionGroupFullySelected(
                    table,
                    columnGroupType,
                    cell.dataset.col
                );
                const isCellSelected = selectedCells.has(cell.dataset.kana || "");
                cell.classList.toggle("row-selected", isRowChecked);
                cell.classList.toggle("col-selected", isColumnChecked);
                cell.classList.toggle("cell-selected", isCellSelected);
                cell.querySelectorAll(".supplemental-kana").forEach(kana => {
                    kana.classList.toggle("cell-selected", selectedCells.has(kana.dataset.kana));
                });
            });
        });

        table.querySelectorAll("th.column-header[data-group-type]").forEach(header => {
            header.classList.toggle(
                "col-selected",
                isSelectionGroupFullySelected(table, header.dataset.groupType, header.dataset.col)
            );
        });
    });

    syncGroupCheckboxes();
}

function setAllCheckboxes(checked) {
    if (checked) {
        getVisibleKana().forEach(char => selectedCells.add(char));
    } else {
        getVisibleKana().forEach(char => selectedCells.delete(char));
    }

    saveUiState();
    syncSelectionHighlights();
}

function getSelectedRows() {
    return checkedValues("#table th[data-group-type='row'] input");
}

function getSelectedCols() {
    return checkedValues("#table th[data-group-type='col'] input");
}

function getSelectedCells() {
    return [...selectedCells];
}

document.addEventListener("change", event => {
    if (!event.target.matches("#table input[type='checkbox'], .supplemental-table input[type='checkbox']")) {
        return;
    }

    const input = event.target;
    const header = input.closest("th[data-group-type]");
    const supplementalTable = input.closest(".supplemental-table");

    if (!header) return;
    setGroupSelection(
        getSelectionGroupCells(supplementalTable || input.closest("#table table"), header.dataset.groupType, input.value),
        selectedCells,
        input.checked
    );
    saveUiState();
    syncSelectionHighlights();
});

document.addEventListener("click", event => {
    const cell = event.target.closest(".supplemental-kana");
    if (!cell || !cell.dataset.kana) return;
    if (selectedCells.has(cell.dataset.kana)) {
        selectedCells.delete(cell.dataset.kana);
    } else {
        selectedCells.add(cell.dataset.kana);
    }
    saveUiState();
    syncSelectionHighlights();
});

document.addEventListener("keydown", event => {
    if (!event.target.matches(".supplemental-kana") || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    event.target.click();
});

document.getElementById("select-all").addEventListener("click", () => setAllCheckboxes(true));
document.getElementById("clear-all").addEventListener("click", () => setAllCheckboxes(false));

syncSelectionHighlights();
saveUiState();

const alphabetStudy = window.AlphabetsCommon.createAlphabetStudy(
    character => alphabetMap[currentAlphabet][character],
    "postep_hiragana.json",
    {
        getAcceptedAnswers: (answer, character) =>
            [answer, ...(dakuonAlternativeSpellings[character] || [])]
    }
);

document.getElementById("start").onclick = () => {
    const chars = new Set();
    const selectedRows = getSelectedRows();
    const selectedCols = getSelectedCols();

    selectedRows.forEach(vowel => {
        rowsDef.forEach(row => {
            const index = colsDef.indexOf(vowel);
            const char = row.chars[index];
            if (char) chars.add(char);
        });
    });

    selectedCols.forEach(group => {
        const row = rowsDef.find(item => item.key === group);
        if (!row) return;
        row.chars.forEach(ch => {
            if (ch) chars.add(ch);
        });
    });

    const visibleKana = new Set(getVisibleKana());
    getSelectedCells().forEach(ch => {
        if (visibleKana.has(ch)) chars.add(ch);
    });

    if (chars.size === 0) {
        alert("Wybierz coś do nauki!");
        return;
    }

    alphabetStudy.startStudy([...chars], { resetMistakes: true, rememberStudySet: true });
};

function startNextReadingChapter() {
    const nextChapterIndex = nextChapterIndexByStory.get(activeReadingStory.key) || 0;
    activeReadingChapter = activeReadingStory.chapters[nextChapterIndex];
    nextChapterIndexByStory.set(
        activeReadingStory.key,
        (nextChapterIndex + 1) % activeReadingStory.chapters.length
    );
    startCurrentReadingChapter();
}

function startCurrentReadingChapter() {
    readingLineIndex = 0;
    readingAnswers = [];
    document.getElementById("reading-active").hidden = false;
    document.getElementById("reading-results").hidden = true;
    renderReadingPrompt();
}

const readingStorySelect = document.getElementById("reading-story");
const foreignNamesPicker = document.getElementById("reading-foreign-names-picker");
const foreignNameScriptSelect = document.getElementById("reading-foreign-name-script");

function setForeignNameScript(script) {
    if (!Array.from(foreignNameScriptSelect.options).some(option => option.value === script)) {
        throw new Error(`Unknown foreign-name script: ${script}`);
    }
    foreignNameScriptSelect.value = script;
}

function storyHasForeignWords(story) {
    return story.chapters.some(chapter =>
        chapter.verses.some(verse =>
            verse.some(part => part.foreignName || part.foreignWord)
        )
    );
}

function updateForeignNamesPicker(story) {
    foreignNamesPicker.hidden = !storyHasForeignWords(story);
    if (foreignNamesPicker.hidden) {
        setForeignNameScript("hiragana");
    }
}

readingStories.forEach(story => {
    const option = document.createElement("option");
    option.value = story.key;
    option.textContent = story.title;
    readingStorySelect.appendChild(option);
});

readingStorySelect.addEventListener("change", () => {
    nextChapterIndexByStory.set(readingStorySelect.value, 0);
    const selectedStory = readingStories.find(story => story.key === readingStorySelect.value);
    if (!selectedStory) {
        throw new Error(`Unknown reading story: ${readingStorySelect.value}`);
    }
    setForeignNameScript("hiragana");
    updateForeignNamesPicker(selectedStory);
});
foreignNameScriptSelect.addEventListener("change", () => {
    if (!activeReadingStory || !activeReadingChapter) return;
    const readingActive = document.getElementById("reading-active");
    if (!readingActive.hidden) {
        appendReadingLine(
            document.getElementById("reading-line"),
            activeReadingChapter.verses[readingLineIndex]
        );
        updateReadingLongVowelNote(activeReadingChapter.verses[readingLineIndex]);
    } else if (!document.getElementById("reading-results").hidden) {
        showReadingResults();
    }
    saveReadingState();
});
updateForeignNamesPicker(readingStories[0]);

const readingPracticeButton = document.getElementById("start-reading-practice");
readingPracticeButton.addEventListener("click", () => {
    activeReadingStory = readingStories.find(story => story.key === readingStorySelect.value);
    if (!activeReadingStory) {
        throw new Error(`Unknown reading story: ${readingStorySelect.value}`);
    }
    document.getElementById("selection-panel").hidden = true;
    document.getElementById("reading-practice").hidden = false;
    document.getElementById("reading-divider").hidden = false;
    startNextReadingChapter();
});

document.getElementById("reading-next-chapter").addEventListener("click", startNextReadingChapter);
document.getElementById("reading-repeat-chapter").addEventListener("click", startCurrentReadingChapter);

document.getElementById("reading-submit").addEventListener("click", () => {
    const input = document.getElementById("reading-answer");
    const entered = input.value.trim();
    if (!entered) {
        document.getElementById("reading-feedback").textContent = "Wpisz rōmaji, zanim przejdziesz dalej.";
        input.focus();
        return;
    }

    const parts = activeReadingChapter.verses[readingLineIndex];
    const expected = parts.map(part => part.reading).join("");
    const partResults = alignReadingAnswer(parts, entered);
    readingAnswers.push({
        entered,
        parts: partResults,
        correct: normalizeReadingAnswer(entered) === normalizeReadingAnswer(expected)
    });

    readingLineIndex++;
    if (readingLineIndex === activeReadingChapter.verses.length) {
        showReadingResults();
    } else {
        renderReadingPrompt();
    }
});

document.getElementById("reading-answer").addEventListener("input", saveReadingState);
document.getElementById("reading-cancel").addEventListener("click", closeReadingPractice);
document.getElementById("reading-back").addEventListener("click", closeReadingPractice);
document.getElementById("reading-answer").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("reading-submit").click();
    }
});

readingPracticeButton.hidden = currentAlphabet !== "hiragana";
document.getElementById("reading-story-picker").hidden = currentAlphabet !== "hiragana";

const restoredReadingState = window.LangCommon.readReloadState(READING_STATE_KEY);
if (restoredReadingState?.active) {
    const wasLegacyKatakanaStory = restoredReadingState.storyKey === "queens-nephew-katakana";
    const restoredStory = readingStories.find(story =>
        story.key === (wasLegacyKatakanaStory ? "queens-nephew" : restoredReadingState.storyKey)
    );
    const restoredChapter = restoredStory?.chapters[restoredReadingState.chapterIndex];
    const hasValidProgress = Number.isInteger(restoredReadingState.readingLineIndex) &&
        restoredReadingState.readingLineIndex >= 0 &&
        restoredReadingState.readingLineIndex <= (restoredChapter?.verses.length || 0) &&
        Array.isArray(restoredReadingState.readingAnswers) &&
        restoredReadingState.readingAnswers.length === restoredReadingState.readingLineIndex;
    if (restoredStory && restoredChapter && hasValidProgress) {
        activeReadingStory = restoredStory;
        activeReadingChapter = restoredChapter;
        readingStorySelect.value = restoredStory.key;
        updateForeignNamesPicker(restoredStory);
        const restoredForeignNameScript = wasLegacyKatakanaStory ||
            restoredReadingState.foreignNameScript === "katakana"
            ? "katakana"
            : "hiragana";
        setForeignNameScript(
            storyHasForeignWords(restoredStory) ? restoredForeignNameScript : "hiragana"
        );
        nextChapterIndexByStory.set(
            restoredStory.key,
            Number.isInteger(restoredReadingState.nextChapterIndex)
                ? restoredReadingState.nextChapterIndex
                : 0
        );
        readingLineIndex = restoredReadingState.readingLineIndex;
        readingAnswers = restoredReadingState.readingAnswers;
        document.getElementById("selection-panel").hidden = true;
        document.getElementById("reading-practice").hidden = false;
        document.getElementById("reading-divider").hidden = false;

        if (restoredReadingState.view === "results" &&
            readingLineIndex === activeReadingChapter.verses.length) {
            showReadingResults();
        } else if (readingLineIndex < activeReadingChapter.verses.length) {
            document.getElementById("reading-active").hidden = false;
            document.getElementById("reading-results").hidden = true;
            renderReadingPrompt();
            document.getElementById("reading-answer").value =
                typeof restoredReadingState.answer === "string"
                    ? restoredReadingState.answer
                    : "";
        } else {
            activeReadingStory = null;
            activeReadingChapter = null;
            window.LangCommon.storeSessionState(READING_STATE_KEY, null);
            document.getElementById("selection-panel").hidden = false;
            document.getElementById("reading-practice").hidden = true;
            document.getElementById("reading-divider").hidden = true;
        }
    }
}
