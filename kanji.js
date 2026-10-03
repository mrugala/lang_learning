const categories = window.kanjiCategories || [];

const MAX_ROWS = 10;
const selectedCells = new Set();
const kanjiDecks = [
    {
        key: "deck-1",
        label: "Zestaw 1",
        categoryKeys: categories.slice(0, 10).map(category => category.key)
    },
    {
        key: "deck-2",
        label: "Zestaw 2",
        categoryKeys: categories.slice(10, 20).map(category => category.key)
    },
    {
        key: "deck-3",
        label: "Zestaw 3",
        categoryKeys: categories.slice(20, 30).map(category => category.key)
    }
];
let activeKanjiDeck = kanjiDecks[0].key;
const studyModes = {
    "kanji-hiragana": { prompt: "kanji", answer: "hiragana" },
    "kanji-romaji": { prompt: "kanji", answer: "romaji" },
    "kanji-polski": { prompt: "kanji", answer: "polski" },
    "meaning-kanji": { prompt: "polski", answer: "kanji" },
    "meaning-romaji": { prompt: "polski", answer: "romaji" },
    "meaning-hiragana": { prompt: "polski", answer: "hiragana" },
    "hiragana-kanji": { prompt: "hiragana", answer: "kanji" },
    "hiragana-polski": { prompt: "hiragana", answer: "polski" },
    "romaji-polski": { prompt: "romaji", answer: "polski" },
    "romaji-kanji": { prompt: "romaji", answer: "kanji" },
    "polski-kanji": { prompt: "polski", answer: "kanji" },
    "polski-romaji": { prompt: "polski", answer: "romaji" },
    "polski-hiragana": { prompt: "polski", answer: "hiragana" },
    "hiragana-romaji": { prompt: "hiragana", answer: "romaji" },
    "hiragana-kanji": { prompt: "hiragana", answer: "kanji" },
    "romaji-hiragana": { prompt: "romaji", answer: "hiragana" },
    "romaji-kanji": { prompt: "romaji", answer: "kanji" },
    "kanji-polski": { prompt: "kanji", answer: "polski" },
    "kanji-hiragana": { prompt: "kanji", answer: "hiragana" },
    "kanji-romaji": { prompt: "kanji", answer: "romaji" }
};

function normalizeModeKey(modeKey) {
    const normalized = String(modeKey || "romaji-polski").trim();
    if (!normalized.includes("-")) return normalized;
    const [prompt, answer] = normalized.split("-");
    const normalizedPrompt = prompt === "meaning" ? "polski" : prompt;
    const normalizedAnswer = answer === "meaning" ? "polski" : answer;
    return `${normalizedPrompt}-${normalizedAnswer}`;
}

function getSelectedStudyModeKey() {
    const displayMode = document.getElementById("display-mode")?.value || "romaji";
    const questionMode = document.getElementById("question-mode")?.value || "polski";
    return normalizeModeKey(`${displayMode}-${questionMode}`);
}

function populateQuestionOptions() {
    const displayMode = document.getElementById("display-mode")?.value || "romaji";
    const questionModeSelect = document.getElementById("question-mode");
    if (!questionModeSelect) return;

    const allowed = {
        kanji: ["hiragana", "romaji", "polski"],
        polski: ["kanji", "romaji", "hiragana"],
        hiragana: ["kanji", "polski"],
        romaji: ["polski", "kanji"]
    };

    const labels = {
        kanji: "kanji",
        polski: "tłumaczenie",
        hiragana: "hiragana",
        romaji: "rōmaji"
    };

    const values = allowed[displayMode] || ["polski", "kanji"];
    const currentValue = questionModeSelect.value;

    questionModeSelect.innerHTML = values
        .map(value => `<option value="${value}">${labels[value]}</option>`)
        .join("");

    questionModeSelect.value = values.includes(currentValue) ? currentValue : values[0];
}

let currentStudyMode = "romaji-polski";

categories.forEach(category => {
    category.items.forEach((item, rowIndex) => {
        if (item) selectedCells.add(getCellKey(category.key, rowIndex));
    });
});
let currentKey = null;
let queue = {};
const BASE_REPS = 5;

function getCellKey(categoryKey, rowIndex) {
    return `${categoryKey}:${rowIndex}`;
}

function getCellData(categoryKey, rowIndex) {
    const category = categories.find(item => item.key === categoryKey);
    if (!category) return null;
    return category.items[rowIndex] || null;
}

function normalizeStudyText(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .replace(/[-_]/g, "");
}

function getAcceptedAnswers(value) {
    const raw = String(value || "");
    if (!raw.trim()) return [];

    const options = raw
        .split(/[\/]/)
        .map(part => part.trim())
        .filter(Boolean);

    return options.length > 0 ? options : [raw.trim()];
}

function toHiraganaFromRomaji(value) {
    const text = String(value || "");
    if (!text) return "";
    if (!/^[a-zA-Zぁ-ゖ 　]+$/.test(text)) return text;

    const kanaMatch = text.match(/[ぁ-ゖァ-ヶー]+$/);
    const romanMatch = text.match(/[a-zA-Z ]+$/);

    if (kanaMatch && !romanMatch) return text;

    const canonicalText = text.toLowerCase();
    const tail = (romanMatch ? romanMatch[0] : canonicalText).replace(/\s+/g, " ");
    const hadTrailingSpace = /\s$/.test(tail);
    const normalized = hadTrailingSpace ? tail.trimEnd() : tail;
    const prefix = romanMatch ? text.slice(0, text.length - tail.length) : "";

    if (!normalized) return prefix;

    const map = {
        "shya": "しゃ", "shyu": "しゅ", "shyo": "しょ",
        "chya": "ちゃ", "chyu": "ちゅ", "chyo": "ちょ",
        "nya": "にゃ", "nyu": "にゅ", "nyo": "にょ",
        "hya": "ひゃ", "hyu": "ひゅ", "hyo": "ひょ",
        "mya": "みゃ", "myu": "みゅ", "myo": "みょ",
        "rya": "りゃ", "ryu": "りゅ", "ryo": "りょ",
        "gya": "ぎゃ", "gyu": "ぎゅ", "gyo": "ぎょ",
        "kya": "きゃ", "kyu": "きゅ", "kyo": "きょ",
        "sha": "しゃ", "shu": "しゅ", "sho": "しょ",
        "cha": "ちゃ", "chu": "ちゅ", "cho": "ちょ",
        "ja": "じゃ", "ju": "じゅ", "jo": "じょ",
        "shi": "し", "chi": "ち", "tsu": "つ", "fu": "ふ",
        "sa": "さ", "si": "し", "su": "す", "se": "せ", "so": "そ",
        "ta": "た", "ti": "ち", "tu": "つ", "te": "て", "to": "と",
        "ka": "か", "ki": "き", "ku": "く", "ke": "け", "ko": "こ",
        "na": "な", "ni": "に", "nu": "ぬ", "ne": "ね", "no": "の",
        "ha": "は", "hi": "ひ", "hu": "ふ", "he": "へ", "ho": "ほ",
        "ma": "ま", "mi": "み", "mu": "む", "me": "め", "mo": "も",
        "ya": "や", "yu": "ゆ", "yo": "よ",
        "ra": "ら", "ri": "り", "ru": "る", "re": "れ", "ro": "ろ",
        "wa": "わ", "wo": "を",
        "ga": "が", "gi": "ぎ", "gu": "ぐ", "ge": "げ", "go": "ご",
        "za": "ざ", "zi": "じ", "zu": "ず", "ze": "ぜ", "zo": "ぞ",
        "da": "だ", "di": "ぢ", "du": "づ", "de": "で", "do": "ど",
        "ba": "ば", "bi": "び", "bu": "ぶ", "be": "べ", "bo": "ぼ",
        "pa": "ぱ", "pi": "ぴ", "pu": "ぷ", "pe": "ぺ", "po": "ぽ",
        "a": "あ", "i": "い", "u": "う", "e": "え", "o": "お",
        "n": "ん"
    };

    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    let result = "";
    let index = 0;

    while (index < normalized.length) {
        const current = normalized.slice(index);
        const token = keys.find(key => current.startsWith(key));

        if (!token) {
            return prefix + result + current;
        }

        const next = normalized.slice(index + token.length, index + token.length + 1);
        const prev = index > 0 ? normalized[index - 1] : "";
        const isPendingN = token === 'n' && index === 0 && !hadTrailingSpace && !/[bcdfghjklmnpqrstvwxyz]/.test(next) && !/[aeiou]/.test(prev);
        const shouldConvertN = token === 'n' && (hadTrailingSpace || /[bcdfghjklmnpqrstvwxyz]/.test(next) || (index > 0 && /[aeiou]/.test(prev)));

        if (isPendingN) {
            result += 'n';
            index += token.length;
            continue;
        }

        if (shouldConvertN) {
            result += map.n;
            index += token.length;
            continue;
        }

        result += map[token];
        index += token.length;
    }

    return prefix + result;
}

function getDisplayValue(item, promptType) {
    if (promptType === "kanji") return item.kanji;
    if (promptType === "polski") return item.meaning;
    if (promptType === "hiragana") return item.hiragana || toHiraganaFromRomaji(item.romaji);
    return item.romaji;
}

function getExpectedAnswer(item, targetType) {
    if (targetType === "polski") return item.meaning;
    if (targetType === "hiragana") return item.hiragana || toHiraganaFromRomaji(item.romaji);
    if (targetType === "kanji") return item.kanji;
    return item.romaji;
}

function playPronunciationForCurrentItem() {
    if (!currentKey || !queue[currentKey]) return;
    if (!("speechSynthesis" in window)) {
        const feedback = document.getElementById("feedback");
        if (feedback) feedback.innerText = "Web Speech API nie jest dostępne w tej przeglądarce.";
        return;
    }

    const item = queue[currentKey];
    const pronunciation = item.kanji || item.hiragana || toHiraganaFromRomaji(item.romaji) || item.meaning;
    if (!pronunciation) return;

    const utterance = new SpeechSynthesisUtterance(pronunciation);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

function syncStudyInputs() {
    const mode = studyModes[normalizeModeKey(currentStudyMode)] || studyModes["romaji-polski"];
    const target = mode.answer;
    const inputs = [
        { id: "romaji-answer", active: target === "romaji" },
        { id: "hiragana-answer", active: target === "hiragana" },
        { id: "meaning-answer", active: target === "polski" }
    ];

    inputs.forEach(({ id, active }) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.style.display = active ? "block" : "none";
        input.disabled = !active;
        if (!active) input.value = "";
    });

    const speechButton = document.getElementById("play-pronunciation");
    if (speechButton) {
        speechButton.style.display = target === "polski" ? "inline-block" : "none";
    }
}

function getVisibleCategories() {
    const deck = kanjiDecks.find(item => item.key === activeKanjiDeck) || kanjiDecks[0];
    return deck.categoryKeys
        .map(key => categories.find(category => category.key === key))
        .filter(Boolean);
}

function populateDeckOptions() {
    const deckSelect = document.getElementById("kanji-deck");
    if (!deckSelect) return;

    deckSelect.innerHTML = kanjiDecks
        .map(deck => `<option value="${deck.key}">${deck.label}</option>`)
        .join("");
    deckSelect.value = activeKanjiDeck;
}

function renderTable() {
    const host = document.getElementById("kanji-table");
    if (!host) return;

    host.innerHTML = "";

    const visibleCategories = getVisibleCategories();
    const seenKanji = new Set();
    const table = document.createElement("table");
    table.className = "hiragana-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    visibleCategories.forEach(category => {
        const headerCell = document.createElement("th");
        headerCell.className = "column-header";
        headerCell.dataset.col = category.key;

        const label = document.createElement("label");
        label.className = "toggle";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = category.key;

        const span = document.createElement("span");
        span.textContent = category.label;

        label.appendChild(input);
        label.appendChild(span);
        headerCell.appendChild(label);
        headRow.appendChild(headerCell);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (let rowIndex = 0; rowIndex < MAX_ROWS; rowIndex++) {
        const rowEl = document.createElement("tr");
        rowEl.dataset.rowKey = String(rowIndex);

        visibleCategories.forEach(category => {
            let item = category.items[rowIndex];
            if (item && seenKanji.has(item.kanji)) {
                item = null;
            }
            if (item) {
                seenKanji.add(item.kanji);
            }

            const cell = document.createElement("td");
            cell.className = "hiragana-cell kanji-cell";
            cell.dataset.col = category.key;
            cell.dataset.row = String(rowIndex);
            cell.dataset.key = getCellKey(category.key, rowIndex);

            if (!item) {
                cell.textContent = "";
            } else {
                const stack = document.createElement("div");
                stack.className = "kana-stack";

                const char = document.createElement("div");
                char.className = "kanji-symbol";
                char.textContent = item.kanji;

                const meta = document.createElement("div");
                meta.className = "kana-translit";
                meta.textContent = item.romaji;

                const meaning = document.createElement("div");
                meaning.className = "kanji-meaning";
                meaning.textContent = item.meaning;

                stack.appendChild(char);
                stack.appendChild(meta);
                stack.appendChild(meaning);
                cell.appendChild(stack);

                cell.addEventListener("click", () => {
                    const key = getCellKey(category.key, rowIndex);
                    if (selectedCells.has(key)) {
                        selectedCells.delete(key);
                    } else {
                        selectedCells.add(key);
                    }
                    syncSelectionHighlights();
                });
            }

            rowEl.appendChild(cell);
        });

        tbody.appendChild(rowEl);
    }

    table.appendChild(tbody);
    host.appendChild(table);
    syncSelectionHighlights();
}

function getGroupCells(groupType, groupKey) {
    const cells = [];

    if (groupType === "col") {
        const category = categories.find(item => item.key === groupKey);
        if (!category) return [];
        category.items.forEach((item, rowIndex) => {
            if (item) cells.push(getCellKey(category.key, rowIndex));
        });
        return cells;
    }

    return cells;
}

function isGroupFullySelected(groupType, groupKey) {
    const cells = getGroupCells(groupType, groupKey);
    return cells.length > 0 && cells.every(cell => selectedCells.has(cell));
}

function syncGroupCheckboxes() {
    document.querySelectorAll("#kanji-table .column-header input").forEach(input => {
        const groupCells = getGroupCells("col", input.value);
        input.checked = groupCells.length > 0 && groupCells.every(cell => selectedCells.has(cell));
    });
}

function syncSelectionHighlights() {
    document.querySelectorAll("#kanji-table tbody tr").forEach(row => {
        row.querySelectorAll("td").forEach(cell => {
            const isColChecked = isGroupFullySelected("col", cell.dataset.col);
            const isCellSelected = selectedCells.has(cell.dataset.key || "");
            cell.classList.toggle("col-selected", isColChecked);
            cell.classList.toggle("cell-selected", isCellSelected);
        });
    });

    document.querySelectorAll("#kanji-table .column-header").forEach(th => {
        const col = th.dataset.col;
        th.classList.toggle("col-selected", isGroupFullySelected("col", col));
    });

    syncGroupCheckboxes();
}

function setAllCheckboxes(checked) {
    selectedCells.clear();
    if (checked) {
        getVisibleCategories().forEach(category => {
            category.items.forEach((item, rowIndex) => {
                if (item) selectedCells.add(getCellKey(category.key, rowIndex));
            });
        });
    }
    syncSelectionHighlights();
}

function getSelectedRows() {
    return [];
}

function getSelectedCols() {
    const values = [];
    document.querySelectorAll("#kanji-table .column-header input").forEach(input => {
        if (input.checked) values.push(input.value);
    });
    return values;
}

function getSelectedCells() {
    return [...selectedCells];
}

document.addEventListener("change", event => {
    if (!event.target.matches("#kanji-table input[type='checkbox']")) return;

    const input = event.target;
    const colHeader = input.closest(".column-header");

    if (!colHeader) return;

    const colCells = getGroupCells("col", input.value);
    const isChecked = input.checked;
    colCells.forEach(cell => {
        if (isChecked) selectedCells.add(cell);
        else selectedCells.delete(cell);
    });
    syncSelectionHighlights();
});

document.getElementById("select-all").addEventListener("click", () => setAllCheckboxes(true));
document.getElementById("clear-all").addEventListener("click", () => setAllCheckboxes(false));

function pickChar() {
    const remaining = Object.keys(queue);
    if (remaining.length === 0) {
        document.getElementById("char-box").innerText = "Koniec! 🎉";
        return;
    }

    const key = remaining[Math.floor(Math.random() * remaining.length)];
    currentKey = key;
    const item = queue[key];
    const mode = studyModes[normalizeModeKey(currentStudyMode)] || studyModes["romaji-polski"];
    const promptValue = getDisplayValue(item, mode.prompt);
    const showKanjiHint = (mode.prompt === "romaji" || mode.prompt === "hiragana") && mode.answer === "polski";
    const charBox = document.getElementById("char-box");

    if (showKanjiHint) {
        charBox.innerHTML = `<div class="prompt-main">${promptValue}</div><div class="prompt-kanji">${item.kanji}</div>`;
    } else {
        charBox.innerHTML = `<div class="prompt-main">${promptValue}</div>`;
    }

    document.getElementById("romaji-answer").value = "";
    document.getElementById("hiragana-answer").value = "";
    document.getElementById("meaning-answer").value = "";
    document.getElementById("feedback").innerText = "";
}

function endStudySession() {
    queue = {};
    currentKey = null;
    document.getElementById("feedback").innerText = "";
    document.getElementById("romaji-answer").value = "";
    document.getElementById("hiragana-answer").value = "";
    document.getElementById("meaning-answer").value = "";
    document.getElementById("continue").style.display = "none";
    document.getElementById("app").style.display = "none";
    document.getElementById("selection-panel").style.display = "block";
}

document.getElementById("start").onclick = () => {
    queue = {};
    currentStudyMode = getSelectedStudyModeKey();
    syncStudyInputs();

    const selectedCols = getSelectedCols();
    const chars = new Set();

    selectedCols.forEach(categoryKey => {
        const category = categories.find(item => item.key === categoryKey);
        if (!category) return;
        category.items.forEach((item, rowIndex) => {
            if (item) chars.add(getCellKey(category.key, rowIndex));
        });
    });

    getSelectedCells().forEach(cell => chars.add(cell));

    if (chars.size === 0) {
        alert("Wybierz coś do nauki!");
        return;
    }

    chars.forEach(key => {
        const [categoryKey, rowValue] = key.split(":");
        const item = getCellData(categoryKey, Number(rowValue));
        if (item) queue[key] = { ...item, reps: BASE_REPS };
    });

    document.getElementById("selection-panel").style.display = "none";
    document.getElementById("app").style.display = "block";
    pickChar();
};

function submitAnswer() {
    if (!currentKey || !queue[currentKey]) return;

    const item = queue[currentKey];
    const mode = studyModes[normalizeModeKey(currentStudyMode)] || studyModes["romaji-polski"];
    const expected = getExpectedAnswer(item, mode.answer);
    const entered = mode.answer === "romaji"
        ? document.getElementById("romaji-answer").value
        : mode.answer === "hiragana"
            ? document.getElementById("hiragana-answer").value
            : document.getElementById("meaning-answer").value;

    const acceptedAnswers = mode.answer === "polski"
        ? getAcceptedAnswers(expected)
        : [expected];
    const isCorrect = acceptedAnswers.some(option => normalizeStudyText(entered) === normalizeStudyText(option));

    if (isCorrect) {
        queue[currentKey].reps--;
        document.getElementById("feedback").innerText = "Dobrze!";

        if (queue[currentKey].reps <= 0) {
            delete queue[currentKey];
        }

        document.getElementById("romaji-answer").value = "";
        document.getElementById("hiragana-answer").value = "";
        document.getElementById("meaning-answer").value = "";
        pickChar();
    } else {
        queue[currentKey].reps += 2;
        document.getElementById("feedback").innerText = `Źle! Poprawne: ${expected}`;
        document.getElementById("continue").style.display = "inline-block";
    }
}

document.getElementById("submit").onclick = submitAnswer;
document.getElementById("end-study").onclick = endStudySession;

document.getElementById("continue").onclick = () => {
    document.getElementById("continue").style.display = "none";
    document.getElementById("feedback").innerText = "";
    document.getElementById("romaji-answer").value = "";
    document.getElementById("hiragana-answer").value = "";
    document.getElementById("meaning-answer").value = "";
    pickChar();
};

const displayModeSelect = document.getElementById("display-mode");
const questionModeSelect = document.getElementById("question-mode");

function updateStudyModeFromControls() {
    populateQuestionOptions();
    currentStudyMode = getSelectedStudyModeKey();
    syncStudyInputs();
    if (document.getElementById("app").style.display !== "none" && currentKey) {
        pickChar();
    }
}

displayModeSelect.addEventListener("change", updateStudyModeFromControls);
questionModeSelect.addEventListener("change", updateStudyModeFromControls);

const kanjiDeckSelect = document.getElementById("kanji-deck");
kanjiDeckSelect.addEventListener("change", () => {
    activeKanjiDeck = kanjiDeckSelect.value;
    renderTable();
    syncSelectionHighlights();
});

const fontStyleSelect = document.getElementById("font-style");
function applyFontStyle(styleName) {
    const normalized = ["default", "brush", "elegant", "modern"].includes(styleName) ? styleName : "default";
    document.body.classList.remove("font-style-default", "font-style-brush", "font-style-elegant", "font-style-modern");
    document.body.classList.add(`font-style-${normalized}`);
    if (fontStyleSelect) fontStyleSelect.value = normalized;
}

fontStyleSelect.addEventListener("change", event => applyFontStyle(event.target.value));
applyFontStyle("default");
populateDeckOptions();
renderTable();
populateQuestionOptions();
syncStudyInputs();

const app = document.getElementById("app");
const speechButton = document.createElement("button");
speechButton.id = "play-pronunciation";
speechButton.type = "button";
speechButton.textContent = "🔊 Odtwórz wymowę";
speechButton.style.display = "none";
speechButton.addEventListener("click", playPronunciationForCurrentItem);
app.insertBefore(speechButton, app.querySelector(".study-inputs"));

const answerRomaji = document.getElementById("romaji-answer");
const answerHiragana = document.getElementById("hiragana-answer");
const answerMeaning = document.getElementById("meaning-answer");

answerHiragana.addEventListener("input", event => {
    const rawValue = event.target.value;
    const converted = toHiraganaFromRomaji(rawValue);
    if (converted !== null && converted !== rawValue) {
        event.target.value = converted;
    }
});

answerRomaji.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        if (document.getElementById("continue").style.display !== "none") {
            document.getElementById("continue").click();
        } else {
            submitAnswer();
        }
    }
});

answerHiragana.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        if (document.getElementById("continue").style.display !== "none") {
            document.getElementById("continue").click();
        } else {
            submitAnswer();
        }
    }
});

answerMeaning.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        if (document.getElementById("continue").style.display !== "none") {
            document.getElementById("continue").click();
        } else {
            submitAnswer();
        }
    }
});
