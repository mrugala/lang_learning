const {
    applyFontStyle: applyCommonFontStyle,
    readStoredFontStyle,
    storeFontStyle,
    createToggleLabel,
    isGroupFullySelected: areAllSelected,
    checkedValues,
    setGroupSelection
} = window.LangCommon;

const { hiragana, katakana, rowsDefMap, supplementalRows, dakuonAlternativeSpellings, readingStories } = window.KanaData;

let activeReadingStory = null;
let activeReadingChapter = null;
const nextChapterIndexByStory = new Map();
let readingLineIndex = 0;
let readingAnswers = [];

function appendReadingLine(container, parts) {
    container.replaceChildren();
    parts.forEach(part => {
        const node = part.particle ? document.createElement("strong") : document.createTextNode(part.text);
        if (part.particle) node.textContent = part.text;
        container.appendChild(node);
    });
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
    document.getElementById("reading-answer").value = "";
    document.getElementById("reading-feedback").textContent = "";
    document.getElementById("reading-submit").textContent =
        readingLineIndex === activeReadingChapter.verses.length - 1 ? "Pokaż cały tekst" : "Dalej";
    document.getElementById("reading-answer").focus();
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
        const hiraganaLine = document.createElement("div");
        hiraganaLine.className = "reading-result-hiragana";
        const partResults = readingAnswers[index].parts;
        parts.forEach((part, partIndex) => {
            const content = document.createElement(part.particle ? "strong" : "span");
            content.textContent = part.text;
            const vocabulary = findReadingVocabulary(part.reading);
            if (vocabulary) {
                content.title = `${vocabulary.kanji} — ${vocabulary.meaning}`;
                content.setAttribute("aria-label", `${part.text.trim()}: ${vocabulary.kanji}, ${vocabulary.meaning}`);
                content.classList.add("has-reading-meaning");
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
                .map(part => `${part.text.trim()} — ${part.reading.trim()}`)
                .join("; ")}`;
            resultLine.append(verseNumber, hiraganaLine, answerLine, correction);
        } else {
            resultLine.append(verseNumber, hiraganaLine, answerLine);
        }
        linesHost.appendChild(resultLine);
    });

    document.getElementById("reading-source").textContent = activeReadingStory.source;
    document.getElementById("reading-translation").textContent =
        activeReadingChapter.translation;
    results.hidden = false;
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

function isPageReload() {
    const navigationEntry = performance.getEntriesByType("navigation")[0];
    return navigationEntry ? navigationEntry.type === "reload" : performance.navigation?.type === 1;
}

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
let rowsDef = rowsDefMap[currentAlphabet];
const supplementalExpanded = {
    dakuon: restoredUiState?.expanded?.dakuon === true,
    youon: restoredUiState?.expanded?.youon === true
};
const kanaForCurrentAlphabet = new Set(Object.keys(alphabetMap[currentAlphabet]));
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
            expanded: { ...supplementalExpanded }
        }));
    } catch (error) {
        // Session storage may be unavailable in restricted browser contexts.
    }
}

function getVisibleKana() {
    const visibleKana = new Set(Object.keys(alphabetMap[currentAlphabet]));
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
    const [romanized, label] = titles[currentAlphabet];

    document.title = romanized;
    document.getElementById("answer").placeholder = "Podaj rōmaji";

    if (titleEl) {
        titleEl.innerHTML = `${label} <span>(${romanized})</span>`;
    }
}

function switchAlphabet(alphabetName) {
    if (!alphabetMap[alphabetName]) return;

    currentAlphabet = alphabetName;
    rowsDef = rowsDefMap[alphabetName];
    selectedCells.clear();
    Object.keys(alphabetMap[alphabetName]).forEach(char => selectedCells.add(char));
    saveUiState();
    updateTitle();
    document.getElementById("start-reading-practice").hidden = alphabetName !== "hiragana";
    document.getElementById("reading-story-picker").hidden = alphabetName !== "hiragana";
    renderTable();
    renderSupplementalTables();
    syncSelectionHighlights();
}

function renderTable() {
    const tableHost = document.getElementById("table");
    tableHost.innerHTML = "";

    const table = document.createElement("table");
    table.className = "hiragana-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const cornerCell = document.createElement("th");
    cornerCell.className = "corner-cell";
    headRow.appendChild(cornerCell);

    rowsDef.forEach(row => {
        const th = document.createElement("th");
        th.className = "column-header";
        th.dataset.col = row.key;

        const hasLabel = Boolean(row.label && row.label.trim());
        const { label } = createToggleLabel(row.key, row.label, { placeholder: !hasLabel });

        th.appendChild(label);
        headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    colsDef.forEach(vowel => {
        const rowEl = document.createElement("tr");
        rowEl.dataset.rowKey = vowel;

        const rowHeader = document.createElement("th");
        rowHeader.className = "row-header";
        rowHeader.dataset.row = vowel;

        const { label } = createToggleLabel(vowel, vowel);
        rowHeader.appendChild(label);
        rowEl.appendChild(rowHeader);

        rowsDef.forEach(row => {
            const cell = document.createElement("td");
            cell.className = "hiragana-cell";
            cell.dataset.col = row.key;
            cell.dataset.row = vowel;

            const index = colsDef.indexOf(vowel);
            const kana = row.chars[index] || "";
            const translit = row.translit[index] || "";
            cell.dataset.kana = kana;

            if (!kana) {
                cell.textContent = "";
            } else {
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
                    if (!kana) return;
                    if (selectedCells.has(kana)) {
                        selectedCells.delete(kana);
                        cell.classList.remove("cell-selected");
                    } else {
                        selectedCells.add(kana);
                        cell.classList.add("cell-selected");
                    }
                    syncSelectionHighlights();
                });
            }

            rowEl.appendChild(cell);
        });

        tbody.appendChild(rowEl);
    });

    table.appendChild(tbody);
    tableHost.appendChild(table);
}

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

function isGroupFullySelected(groupType, groupKey) {
    return areAllSelected(getGroupCells(groupType, groupKey), selectedCells);
}

function renderSupplementalTable(tableType, title, titleJapanese) {
    const section = document.createElement("section");
    section.className = "supplemental-section";
    const primaryHost = document.getElementById("table");
    const primaryTable = primaryHost.querySelector(".hiragana-table");
    const primaryHeaderCells = primaryTable.querySelector("thead tr").children;
    const rows = getSupplementalRows(tableType);
    const primaryColumnKeys = rowsDef.map(row => row.key);
    const lastColumnIndex = Math.max(...rows.map(row => primaryColumnKeys.indexOf(row.baseKey)));
    const tableWidth = primaryHeaderCells[lastColumnIndex + 1].getBoundingClientRect().right -
        primaryTable.getBoundingClientRect().left;
    section.style.width = `${Math.ceil(tableWidth) + 6}px`;

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
        const rowHeader = document.createElement("th");
        rowHeader.className = "row-header";
        rowHeader.dataset.row = key;
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
                kanaEl.className = "kana-symbol";
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

function renderSupplementalTables() {
    const host = document.getElementById("supplemental-tables");
    host.style.display = "";
    host.replaceChildren(
        renderSupplementalTable("dakuon", "Dakuon・Handakuon", "濁音・半濁音"),
        renderSupplementalTable("youon", "Yō-on", "拗音")
    );
    const leftOffset = document.getElementById("table").getBoundingClientRect().left -
        host.getBoundingClientRect().left;
    host.querySelectorAll(".supplemental-section").forEach(section => {
        section.style.marginLeft = `${leftOffset}px`;
    });
}

renderSupplementalTables();
window.addEventListener("resize", () => {
    renderSupplementalTables();
    syncSelectionHighlights();
});

function syncGroupCheckboxes() {
    document.querySelectorAll("#table .row-header input").forEach(input => {
        input.checked = areAllSelected(getGroupCells("row", input.value), selectedCells);
    });

    document.querySelectorAll("#table .column-header input").forEach(input => {
        input.checked = areAllSelected(getGroupCells("col", input.value), selectedCells);
    });

    document.querySelectorAll(".supplemental-table").forEach(table => {
        const tableType = table.dataset.tableType;
        table.querySelectorAll(".row-header input").forEach(input => {
            input.checked = areAllSelected(getSupplementalGroupCells(tableType, "row", input.value), selectedCells);
        });
        table.querySelectorAll(".column-header input").forEach(input => {
            input.checked = areAllSelected(getSupplementalGroupCells(tableType, "col", input.value), selectedCells);
        });
    });
}

function syncSelectionHighlights() {
    document.querySelectorAll("#table tbody tr").forEach(row => {
        const rowKey = row.dataset.rowKey;
        const isRowChecked = isGroupFullySelected("row", rowKey);
        row.classList.toggle("row-selected", isRowChecked);
        row.querySelector(".row-header").classList.toggle("row-selected", isRowChecked);

        row.querySelectorAll("td").forEach(cell => {
            const isColChecked = isGroupFullySelected("col", cell.dataset.col);
            const isCellSelected = selectedCells.has(cell.dataset.kana || "");
            cell.classList.toggle("row-selected", isRowChecked);
            cell.classList.toggle("col-selected", isColChecked);
            cell.classList.toggle("cell-selected", isCellSelected);
        });
    });

    document.querySelectorAll("#table .column-header").forEach(th => {
        const col = th.dataset.col;
        th.classList.toggle("col-selected", isGroupFullySelected("col", col));
    });

    document.querySelectorAll(".supplemental-table").forEach(table => {
        const tableType = table.dataset.tableType;
        table.querySelectorAll("tbody tr[data-row-key]").forEach(row => {
            const isRowChecked = areAllSelected(
                getSupplementalGroupCells(tableType, "row", row.dataset.rowKey),
                selectedCells
            );
            row.classList.toggle("row-selected", isRowChecked);
            row.querySelector(".row-header").classList.toggle("row-selected", isRowChecked);
            row.querySelectorAll(".supplemental-cell").forEach(cell => {
                const isColChecked = areAllSelected(
                    getSupplementalGroupCells(tableType, "col", cell.dataset.col),
                    selectedCells
                );
                cell.classList.toggle("row-selected", isRowChecked);
                cell.classList.toggle("col-selected", isColChecked);
                cell.querySelectorAll(".supplemental-kana").forEach(kana => {
                    kana.classList.toggle("cell-selected", selectedCells.has(kana.dataset.kana));
                });
            });
        });
        table.querySelectorAll(".column-header").forEach(th => {
            th.classList.toggle(
                "col-selected",
                areAllSelected(getSupplementalGroupCells(tableType, "col", th.dataset.col), selectedCells)
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
    return checkedValues("#table .row-header input");
}

function getSelectedCols() {
    return checkedValues("#table .column-header input");
}

function getSelectedCells() {
    return [...selectedCells];
}

document.addEventListener("change", event => {
    if (!event.target.matches("#table input[type='checkbox'], .supplemental-table input[type='checkbox']")) {
        return;
    }

    const input = event.target;
    const rowHeader = input.closest(".row-header");
    const colHeader = input.closest(".column-header");
    const supplementalTable = input.closest(".supplemental-table");

    if (rowHeader) {
        const cells = supplementalTable
            ? getSupplementalGroupCells(supplementalTable.dataset.tableType, "row", input.value)
            : getGroupCells("row", input.value);
        setGroupSelection(cells, selectedCells, input.checked);
        saveUiState();
        syncSelectionHighlights();
        return;
    }

    if (colHeader) {
        const cells = supplementalTable
            ? getSupplementalGroupCells(supplementalTable.dataset.tableType, "col", input.value)
            : getGroupCells("col", input.value);
        setGroupSelection(cells, selectedCells, input.checked);
        saveUiState();
        syncSelectionHighlights();
    }
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
readingStories.forEach(story => {
    const option = document.createElement("option");
    option.value = story.key;
    option.textContent = story.title;
    readingStorySelect.appendChild(option);
});

readingStorySelect.addEventListener("change", () => {
    nextChapterIndexByStory.set(readingStorySelect.value, 0);
});

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
