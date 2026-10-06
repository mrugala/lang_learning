const {
    BASE_REPS,
    STREAK_BONUS_THRESHOLD,
    WRONG_ANSWER_PENALTY,
    applyFontStyle: applyCommonFontStyle,
    readStoredFontStyle,
    storeFontStyle,
    createToggleLabel,
    isGroupFullySelected: areAllSelected,
    checkedValues,
    setGroupSelection,
    pickRandomKey,
    setText,
    setupRepeatButton,
    showQueueFinished,
    hideContinueButton,
    showContinueButton,
    showSelectionPanel,
    showStudyApp,
    handleEnterKey
} = window.LangCommon;

const hiragana = {
    "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
    "か": "ka", "き": "ki", "く": "ku", "け": "ke", "こ": "ko",
    "さ": "sa", "し": "shi", "す": "su", "せ": "se", "そ": "so",
    "た": "ta", "ち": "chi", "つ": "tsu", "て": "te", "と": "to",
    "な": "na", "に": "ni", "ぬ": "nu", "ね": "ne", "の": "no",
    "は": "ha", "ひ": "hi", "ふ": "fu", "へ": "he", "ほ": "ho",
    "ま": "ma", "み": "mi", "む": "mu", "め": "me", "も": "mo",
    "や": "ya", "ゆ": "yu", "よ": "yo",
    "ら": "ra", "り": "ri", "る": "ru", "れ": "re", "ろ": "ro",
    "わ": "wa", "を": "wo",
    "ん": "n"
};

const katakana = {
    "ア": "a", "イ": "i", "ウ": "u", "エ": "e", "オ": "o",
    "カ": "ka", "キ": "ki", "ク": "ku", "ケ": "ke", "コ": "ko",
    "サ": "sa", "シ": "shi", "ス": "su", "セ": "se", "ソ": "so",
    "タ": "ta", "チ": "chi", "ツ": "tsu", "テ": "te", "ト": "to",
    "ナ": "na", "ニ": "ni", "ヌ": "nu", "ネ": "ne", "ノ": "no",
    "ハ": "ha", "ヒ": "hi", "フ": "fu", "ヘ": "he", "ホ": "ho",
    "マ": "ma", "ミ": "mi", "ム": "mu", "メ": "me", "モ": "mo",
    "ヤ": "ya", "ユ": "yu", "ヨ": "yo",
    "ラ": "ra", "リ": "ri", "ル": "ru", "レ": "re", "ロ": "ro",
    "ワ": "wa", "ヲ": "wo",
    "ン": "n"
};

const rowsDefMap = {
    hiragana: [
        { key: "a", label: "", chars: ["あ", "い", "う", "え", "お"], translit: ["a", "i", "u", "e", "o"] },
        { key: "k", label: "k", chars: ["か", "き", "く", "け", "こ"], translit: ["ka", "ki", "ku", "ke", "ko"] },
        { key: "s", label: "s", chars: ["さ", "し", "す", "せ", "そ"], translit: ["sa", "shi", "su", "se", "so"] },
        { key: "t", label: "t", chars: ["た", "ち", "つ", "て", "と"], translit: ["ta", "chi", "tsu", "te", "to"] },
        { key: "n", label: "n", chars: ["な", "に", "ぬ", "ね", "の"], translit: ["na", "ni", "nu", "ne", "no"] },
        { key: "h", label: "h", chars: ["は", "ひ", "ふ", "へ", "ほ"], translit: ["ha", "hi", "fu", "he", "ho"] },
        { key: "m", label: "m", chars: ["ま", "み", "む", "め", "も"], translit: ["ma", "mi", "mu", "me", "mo"] },
        { key: "y", label: "y", chars: ["や", "", "ゆ", "", "よ"], translit: ["ya", "", "yu", "", "yo"] },
        { key: "r", label: "r", chars: ["ら", "り", "る", "れ", "ろ"], translit: ["ra", "ri", "ru", "re", "ro"] },
        { key: "w", label: "w", chars: ["わ", "", "", "", "を"], translit: ["wa", "", "", "", "wo"] },
        { key: "n2", label: "", chars: ["ん"], translit: ["n"] }
    ],
    katakana: [
        { key: "a", label: "", chars: ["ア", "イ", "ウ", "エ", "オ"], translit: ["a", "i", "u", "e", "o"] },
        { key: "k", label: "k", chars: ["カ", "キ", "ク", "ケ", "コ"], translit: ["ka", "ki", "ku", "ke", "ko"] },
        { key: "s", label: "s", chars: ["サ", "シ", "ス", "セ", "ソ"], translit: ["sa", "shi", "su", "se", "so"] },
        { key: "t", label: "t", chars: ["タ", "チ", "ツ", "テ", "ト"], translit: ["ta", "chi", "tsu", "te", "to"] },
        { key: "n", label: "n", chars: ["ナ", "ニ", "ヌ", "ネ", "ノ"], translit: ["na", "ni", "nu", "ne", "no"] },
        { key: "h", label: "h", chars: ["ハ", "ヒ", "フ", "ヘ", "ホ"], translit: ["ha", "hi", "fu", "he", "ho"] },
        { key: "m", label: "m", chars: ["マ", "ミ", "ム", "メ", "モ"], translit: ["ma", "mi", "mu", "me", "mo"] },
        { key: "y", label: "y", chars: ["ヤ", "", "ユ", "", "ヨ"], translit: ["ya", "", "yu", "", "yo"] },
        { key: "r", label: "r", chars: ["ラ", "リ", "ル", "レ", "ロ"], translit: ["ra", "ri", "ru", "re", "ro"] },
        { key: "w", label: "w", chars: ["ワ", "", "", "", "ヲ"], translit: ["wa", "", "", "", "wo"] },
        { key: "n2", label: "", chars: ["ン"], translit: ["n"] }
    ]
};

const supplementalRows = {
    dakuon: [
        { key: "g", label: "g", baseKey: "k", chars: ["が", "ぎ", "ぐ", "げ", "ご"], translit: ["ga", "gi", "gu", "ge", "go"] },
        { key: "z", label: "z", baseKey: "s", chars: ["ざ", "じ", "ず", "ぜ", "ぞ"], translit: ["za", "ji", "zu", "ze", "zo"] },
        { key: "d", label: "d", baseKey: "t", chars: ["だ", "ぢ", "づ", "で", "ど"], translit: ["da", "ji", "zu", "de", "do"] },
        { key: "b", label: "b", baseKey: "h", chars: ["ば", "び", "ぶ", "べ", "ぼ"], translit: ["ba", "bi", "bu", "be", "bo"] },
        { key: "p", label: "p", baseKey: "y", chars: ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"], translit: ["pa", "pi", "pu", "pe", "po"], group: "handakuon" }
    ],
    youon: [
        { key: "ky", label: "ky", baseKey: "k", chars: ["きゃ", "きゅ", "きょ"], translit: ["kya", "kyu", "kyo"] },
        { key: "gy", label: "gy", baseKey: "k", voicing: "dakuten", chars: ["ぎゃ", "ぎゅ", "ぎょ"], translit: ["gya", "gyu", "gyo"] },
        { key: "sh", label: "sh", baseKey: "s", chars: ["しゃ", "しゅ", "しょ"], translit: ["sha", "shu", "sho"] },
        { key: "j", label: "j", baseKey: "s", voicing: "dakuten", chars: ["じゃ", "じゅ", "じょ"], translit: ["ja", "ju", "jo"] },
        { key: "ch", label: "ch", baseKey: "t", chars: ["ちゃ", "ちゅ", "ちょ"], translit: ["cha", "chu", "cho"] },
        { key: "j2", label: "j", baseKey: "t", voicing: "dakuten", chars: ["ぢゃ", "ぢゅ", "ぢょ"], translit: ["ja", "ju", "jo"] },
        { key: "ny", label: "ny", baseKey: "n", chars: ["にゃ", "にゅ", "にょ"], translit: ["nya", "nyu", "nyo"] },
        { key: "hy", label: "hy", baseKey: "h", chars: ["ひゃ", "ひゅ", "ひょ"], translit: ["hya", "hyu", "hyo"] },
        { key: "by", label: "by", baseKey: "h", voicing: "dakuten", chars: ["びゃ", "びゅ", "びょ"], translit: ["bya", "byu", "byo"] },
        { key: "py", label: "py", baseKey: "y", voicing: "handakuten", chars: ["ぴゃ", "ぴゅ", "ぴょ"], translit: ["pya", "pyu", "pyo"] },
        { key: "my", label: "my", baseKey: "m", chars: ["みゃ", "みゅ", "みょ"], translit: ["mya", "myu", "myo"] },
        { key: "ry", label: "ry", baseKey: "y", chars: ["りゃ", "りゅ", "りょ"], translit: ["rya", "ryu", "ryo"] }
    ]
};

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

const alphabetMap = { hiragana, katakana };
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
    const romanized = currentAlphabet === "hiragana" ? "Hiragana" : "Katakana";
    const label = currentAlphabet === "hiragana" ? "ひらがな" : "カタカナ";

    document.title = romanized;

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
                translitEl.textContent = group.translit[rowIndex];
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

let queue = {};
let studySet = [];
let currentChar = null;
let consecutiveCorrectChar = null;
let consecutiveCorrectCount = 0;

function startStudy(chars) {
    queue = {};
    chars.forEach(ch => queue[ch] = BASE_REPS);
    currentChar = null;
    consecutiveCorrectChar = null;
    consecutiveCorrectCount = 0;
    document.getElementById("answer").value = "";
    setText("feedback", "");
    hideContinueButton();
    showStudyApp();
    pickChar();
}

document.getElementById("start").onclick = () => {
    const selectedRows = getSelectedRows();
    const selectedCols = getSelectedCols();

    let chars = new Set();

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
        row.chars.forEach(ch => chars.add(ch));
    });

    const visibleKana = new Set(getVisibleKana());
    getSelectedCells().forEach(ch => {
        if (visibleKana.has(ch)) chars.add(ch);
    });

    if (chars.size === 0) {
        alert("Wybierz coś do nauki!");
        return;
    }

    studySet = [...chars];
    startStudy(studySet);
};

function endStudySession() {
    queue = {};
    currentChar = null;
    setText("feedback", "");
    document.getElementById("answer").value = "";
    hideContinueButton();
    showSelectionPanel();
}

document.getElementById("end-study").onclick = endStudySession;
setupRepeatButton(() => startStudy(studySet));

function pickChar() {
    const key = pickRandomKey(queue);
    if (key === null) {
        showQueueFinished();
        return;
    }
    currentChar = key;
    setText("char-box", currentChar);
}

function submitAnswer() {
    const ans = document.getElementById("answer").value.trim().toLowerCase();
    const correct = alphabetMap[currentAlphabet][currentChar];

    if (ans === correct) {
        if (currentChar === consecutiveCorrectChar) {
            consecutiveCorrectCount++;
        } else {
            consecutiveCorrectChar = currentChar;
            consecutiveCorrectCount = 1;
        }

        queue[currentChar]--;
        setText("feedback", "Dobrze!");

        if (queue[currentChar] <= 0) {
            delete queue[currentChar];
        }

        if (consecutiveCorrectCount >= STREAK_BONUS_THRESHOLD) {
            delete queue[currentChar];
            consecutiveCorrectChar = null;
            consecutiveCorrectCount = 0;
        }

        document.getElementById("answer").value = "";
        pickChar();
    } else {
        consecutiveCorrectChar = null;
        consecutiveCorrectCount = 0;
        queue[currentChar] += WRONG_ANSWER_PENALTY;
        setText("feedback", `Źle! Poprawna odpowiedź: ${correct}`);
        showContinueButton();
    }
}

document.getElementById("submit").onclick = submitAnswer;

document.getElementById("continue").onclick = () => {
    hideContinueButton();
    setText("feedback", "");
    document.getElementById("answer").value = "";
    pickChar();
};

const answerInput = document.getElementById("answer");
answerInput.addEventListener("keydown", (event) => {
    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    handleEnterKey(event, submitAnswer);
});

answerInput.addEventListener("input", () => {
    answerInput.value = answerInput.value.replace(/\s/g, "");
});

// ZAPIS DO PLIKU
document.getElementById("save").onclick = () => {
    const blob = new Blob([JSON.stringify(queue)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "postep_hiragana.json";
    a.click();
};

// WCZYTANIE PLIKU
document.getElementById("load").onclick = () => {
    document.getElementById("fileInput").click();
};

document.getElementById("fileInput").onchange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
        queue = JSON.parse(reader.result);
        pickChar();
    };

    reader.readAsText(file);
};
