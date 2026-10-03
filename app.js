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

const alphabetMap = { hiragana, katakana };
const colsDef = ["a", "i", "u", "e", "o"];
let currentAlphabet = "hiragana";
let rowsDef = rowsDefMap[currentAlphabet];
const selectedCells = new Set(Object.keys(alphabetMap[currentAlphabet]));

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
    updateTitle();
    renderTable();
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
    });
}

const alphabetTypeSelect = document.getElementById("alphabet-type");
if (alphabetTypeSelect) {
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

function isGroupFullySelected(groupType, groupKey) {
    return areAllSelected(getGroupCells(groupType, groupKey), selectedCells);
}

function syncGroupCheckboxes() {
    document.querySelectorAll("#table .row-header input").forEach(input => {
        input.checked = areAllSelected(getGroupCells("row", input.value), selectedCells);
    });

    document.querySelectorAll("#table .column-header input").forEach(input => {
        input.checked = areAllSelected(getGroupCells("col", input.value), selectedCells);
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

    syncGroupCheckboxes();
}

function setAllCheckboxes(checked) {
    selectedCells.clear();

    if (checked) {
        Object.keys(alphabetMap[currentAlphabet]).forEach(char => {
            selectedCells.add(char);
        });
    }

    syncSelectionHighlights();
}

function getSelectedRows() {
    return checkedValues(".row-header input");
}

function getSelectedCols() {
    return checkedValues(".column-header input");
}

function getSelectedCells() {
    return [...selectedCells];
}

document.addEventListener("change", event => {
    if (!event.target.matches("#table input[type='checkbox']")) {
        return;
    }

    const input = event.target;
    const rowHeader = input.closest(".row-header");
    const colHeader = input.closest(".column-header");

    if (rowHeader) {
        setGroupSelection(getGroupCells("row", input.value), selectedCells, input.checked);
        syncSelectionHighlights();
        return;
    }

    if (colHeader) {
        setGroupSelection(getGroupCells("col", input.value), selectedCells, input.checked);
        syncSelectionHighlights();
    }
});

document.getElementById("select-all").addEventListener("click", () => setAllCheckboxes(true));
document.getElementById("clear-all").addEventListener("click", () => setAllCheckboxes(false));

syncSelectionHighlights();

let queue = {};
let currentChar = null;
let consecutiveCorrectChar = null;
let consecutiveCorrectCount = 0;

document.getElementById("start").onclick = () => {
    queue = {};

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

    getSelectedCells().forEach(ch => chars.add(ch));

    if (chars.size === 0) {
        alert("Wybierz coś do nauki!");
        return;
    }

    chars.forEach(ch => queue[ch] = BASE_REPS);

    showStudyApp();
    pickChar();
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
