const {
    BASE_REPS,
    WRONG_ANSWER_PENALTY,
    applyFontStyle: applyCommonFontStyle,
    readReloadState,
    storeSessionState,
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
    handleEnterKey,
    normalizeStudyText,
    romajiAnswerVariants,
    normalizeRomaji,
    getAcceptedAnswers
} = window.LangCommon;

const categories = window.kanjiCategories || [];
const UI_STATE_KEY = "kanjiSelectionUiState";
const restoredUiState = readReloadState(UI_STATE_KEY);

const MIN_ROWS = 10;
const selectedCells = new Set();
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

const kanjiDecks = [
    ...decks,
    {
        key: "deck-church",
        label: `Zestaw ${decks.length + 1} — Kościół katolicki`,
        categoryKeys: categories.filter(c => c.key.startsWith("church-")).map(c => c.key)
    }
];
let activeKanjiDeck = kanjiDecks.some(deck => deck.key === restoredUiState?.deck)
    ? restoredUiState.deck
    : kanjiDecks[0].key;
let restoreDeckSelection = activeKanjiDeck === restoredUiState?.deck;
const kanjiByCharacter = new Map(
    categories
        .flatMap(category => category.items)
        .filter(item => item.distractors?.length)
        .map(item => [item.kanji, item])
);
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

let currentStudyMode = restoredUiState?.studyMode || "romaji-polski";

function selectVisibleDeckItems() {
    selectedCells.clear();
    const visibleCellKeys = new Set();
    getVisibleCategories().forEach(category => {
        category.items.forEach((item, rowIndex) => {
            if (item) visibleCellKeys.add(getCellKey(category.key, rowIndex));
        });
    });

    if (restoreDeckSelection && Array.isArray(restoredUiState.selected)) {
        restoreDeckSelection = false;
        restoredUiState.selected
            .filter(key => visibleCellKeys.has(key))
            .forEach(key => selectedCells.add(key));
        return;
    }
    restoreDeckSelection = false;

    visibleCellKeys.forEach(key => selectedCells.add(key));
}

function saveUiState() {
    storeSessionState(UI_STATE_KEY, {
        deck: activeKanjiDeck,
        selected: [...selectedCells],
        displayMode: document.getElementById("display-mode")?.value || "romaji",
        questionMode: document.getElementById("question-mode")?.value || "polski",
        studyMode: getSelectedStudyModeKey()
    });
}

selectVisibleDeckItems();
let currentKey = null;
let queue = {};
let studySet = [];

function getCellKey(categoryKey, rowIndex) {
    return `${categoryKey}:${rowIndex}`;
}

function getCellData(categoryKey, rowIndex) {
    const category = categories.find(item => item.key === categoryKey);
    if (!category) return null;
    return category.items[rowIndex] || null;
}

function getAcceptedAnswersLocal(value) {
    return getAcceptedAnswers(value);
}

// Consonant + vowel. Longer digraphs (sh, ch, ts) are listed explicitly so
// they win over the single-consonant readings (s, t).
const SYLLABLES = {
    kya: "きゃ", kyu: "きゅ", kyo: "きょ",
    sha: "しゃ", shu: "しゅ", sho: "しょ",
    cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
    tsu: "つ", tsa: "つぁ", tse: "つぇ", tso: "つぉ",
    nya: "にゃ", nyu: "にゅ", nyo: "にょ",
    hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
    mya: "みゃ", myu: "みゅ", myo: "みょ",
    rya: "りゃ", ryu: "りゅ", ryo: "りょ",
            bya: "びゃ", byu: "びゅ", byo: "びょ",
    gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
    ja: "じゃ", ju: "じゅ", jo: "じょ",
    jya: "じゃ", jyu: "じゅ", jyo: "じょ",
    zya: "じゃ", zyu: "じゅ", zyo: "じょ", zyi: "じぃ", zy: "じ",
    dzu: "づ", dji: "ぢ", dy: "ぢ",
    fu: "ふ", ji: "じ",
    ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
    ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
    sa: "さ", si: "し", shi: "し", su: "す", se: "せ", so: "そ",
    za: "ざ", zi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
    ta: "た", ti: "ち", chi: "ち", tu: "つ", te: "て", to: "と",
    da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
    na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
    ha: "は", hi: "ひ", he: "へ", ho: "ほ",
    ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
    pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
    ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
    ya: "や", yu: "ゆ", yo: "よ", ye: "いぇ",
    ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
    wa: "わ", wi: "うぃ", we: "うぇ", wo: "を",
    va: "ゔぁ", vi: "ゔぃ", vu: "ゔ", ve: "ゔぇ", vo: "ゔぉ",
    a: "あ", i: "い", u: "う", e: "え", o: "お"
};

// Consonants that can be doubled to form sokuon (っ): "tte" -> "って".
const GEMINATE = "kgzsjtdnhbpmrfv";

// Long vowel marks are expanded before parsing, so ぞう becomes "zou"
// and parses as ko + u below.
const MACRONS = { ā: "aa", ī: "ii", ū: "uu", ē: "ee", ō: "ou" };

const VOWELS = "aiueo";

// Small (digraph) kana. A long vowel after one of these is always う,
// so "shou" is しょう rather than しょお.
const SMALL_KANA = "ゃゅょゎぁぃぅぇぉ";

function toHiraganaFromRomaji(value) {
    const text = String(value || "");
    if (!text) return "";
    // Only the trailing latin run is converted; any leading kana is kept as-is.
    const romanMatch = text.match(/[a-zA-Zāīūēō]+$/);
    if (!romanMatch) return text;

    const tail = romanMatch[0];
    const prefix = text.slice(0, text.length - tail.length);

    let normalized = tail.toLowerCase();
    Object.keys(MACRONS).forEach(mark => {
        normalized = normalized.split(mark).join(MACRONS[mark]);
    });

    if (!normalized) return prefix;

    let result = "";
    let index = 0;

    while (index < normalized.length) {
        const current = normalized.slice(index);
        const nextChar = current[1] || "";

        // --- "tch": the geminate is just "t", leaving "chi" (itchi) ---
        if (current.startsWith("tch")) {
            const syllable = "ch" + current[3];
            if (VOWELS.includes(current[3]) && SYLLABLES[syllable]) {
                result += "っ" + SYLLABLES[syllable];
                index += 4;
                continue;
            }
        }

        // --- n: ん, or onset of the next syllable? ---
        if (current[0] === "n") {
            // A trailing n always syllabifies. Otherwise it syllabifies only
            // before a vowel or "y" (na, ni, nya...), never before a consonant.
            const startsSyllable = nextChar !== "" &&
                (VOWELS.includes(nextChar) || nextChar === "y");
            if (!startsSyllable) {
                result += "ん";
                index += 1;
                continue;
            }
        }

        // --- geminate consonant (sokuon): "tte" -> "って" ---
        if (nextChar && nextChar === current[0] && GEMINATE.includes(current[0])) {
            result += "っ";
            index += 1;
            continue;
        }

        // --- longest matching syllable wins ---
        let matched = null;
        for (let length = Math.min(3, current.length); length >= 1; length--) {
            const candidate = current.slice(0, length);
            if (SYLLABLES[candidate]) {
                matched = candidate;
                break;
            }
        }

        if (!matched) {
            // Unknown character: keep it verbatim so nothing is silently lost.
            result += current[0];
            index += 1;
            continue;
        }

        let syllable = SYLLABLES[matched];
        let consumed = matched.length;

        // Long vowels. The romanized vowel does not match the kana that is
        // actually written, so every spelling of one long vowel collapses:
        //   "koo" / "kou" / "kō" -> こう, "shuu" / "shū" -> しゅう.
        // After an "o" the kana is always う, after a small kana (ょ, ゅ) it is
        // also う; otherwise the vowel repeats (aa -> ああ, ee -> ええ).
        const after = current.slice(consumed);
        const lastKana = syllable.charAt(syllable.length - 1);
        const lastVowel = matched.charAt(matched.length - 1);
        const nextVowel = after[0];
        const afterSmall = SMALL_KANA.includes(lastKana);

        // "you" / "yō" is a long よ, not よ + う written as separate kana.
        const isLongYo = (matched === "yo" || lastKana === "ょ") && nextVowel === "u";
        const isLongO = lastVowel === "o" && nextVowel === "u";

        if (nextVowel && (isLongYo || isLongO || (VOWELS.includes(lastVowel) && nextVowel === lastVowel))) {
            if (isLongYo) {
                // "you" -> よう, "kyou" -> きょう
                syllable = syllable.replace(/ょ$/, "ょう");
                if (matched === "yo") syllable = "よう";
            } else {
                // "shou" -> しょう, "koo" -> こう, "suu" -> すう
                syllable += afterSmall || lastVowel === "o" ? SYLLABLES.u : SYLLABLES[nextVowel];
            }
            consumed += 1;
        } else if (!afterSmall && matched === "yo" && nextVowel === "u") {
            // "you" -> よう
            syllable += SYLLABLES.u;
            consumed += 1;
        }

        result += syllable;
        index += consumed;
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
    const choiceButtons = document.getElementById("kanji-choice-buttons");
    const studyInputs = document.querySelector(".study-inputs");
    if (choiceButtons) choiceButtons.style.display = target === "kanji" ? "flex" : "none";
    if (studyInputs) studyInputs.style.display = target === "kanji" ? "none" : "flex";

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

        headerCell.appendChild(createToggleLabel(category.key, category.label).label);
        headRow.appendChild(headerCell);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    const rowCount = Math.max(
        MIN_ROWS,
        ...visibleCategories.map(category => category.items.length)
    );
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
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
                    saveUiState();
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
    return areAllSelected(getGroupCells(groupType, groupKey), selectedCells);
}

function syncGroupCheckboxes() {
    document.querySelectorAll("#kanji-table .column-header input").forEach(input => {
        input.checked = areAllSelected(getGroupCells("col", input.value), selectedCells);
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
    saveUiState();
    syncSelectionHighlights();
}

function getSelectedRows() {
    return [];
}

function getSelectedCols() {
    return checkedValues("#kanji-table .column-header input");
}

function getSelectedCells() {
    return [...selectedCells];
}

document.addEventListener("change", event => {
    if (!event.target.matches("#kanji-table input[type='checkbox']")) return;

    const input = event.target;
    const colHeader = input.closest(".column-header");

    if (!colHeader) return;

    setGroupSelection(getGroupCells("col", input.value), selectedCells, input.checked);
    saveUiState();
    syncSelectionHighlights();
});

document.getElementById("select-all").addEventListener("click", () => setAllCheckboxes(true));
document.getElementById("clear-all").addEventListener("click", () => setAllCheckboxes(false));

function pickChar() {
    const key = pickRandomKey(queue);
    if (key === null) {
        showQueueFinished();
        return;
    }

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
    if (mode.answer === "kanji") renderKanjiChoiceButtons(item);

    // The feedback ("Dobrze!" / "Źle! ...") is deliberately kept, so the result of
    // the previous answer stays visible while the next question is shown. It is
    // cleared by endStudySession and by the continue button instead.
    clearAnswerInputs();
}

function getKanjiChoiceOptions(item) {
    const correct = item.kanji;
    const mappedDistractors = [...correct].map(character =>
        [...new Set(kanjiByCharacter.get(character)?.distractors || [])]
            .filter(distractor => distractor && distractor !== character)
    );

    if (mappedDistractors.length > 0 && mappedDistractors.every(options => options?.length >= 2)) {
        for (let attempt = 0; attempt < 20; attempt++) {
            const firstDistractor = mappedDistractors
                .map(options => options[Math.floor(Math.random() * options.length)])
                .join("");
            const secondDistractor = mappedDistractors
                .map(options => options[Math.floor(Math.random() * options.length)])
                .join("");
            if (
                firstDistractor !== correct &&
                secondDistractor !== correct &&
                firstDistractor !== secondDistractor
            ) {
                return [firstDistractor, secondDistractor, correct];
            }
        }
    }

    const visibleKanji = [...new Set(getVisibleCategories()
        .flatMap(category => category.items.map(candidate => candidate.kanji))
        .filter(candidate => candidate && candidate !== correct))];
    const sameLength = visibleKanji.filter(candidate => [...candidate].length === [...correct].length);
    const candidates = sameLength.length >= 2 ? sameLength : visibleKanji;

    for (let index = candidates.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
    }

    return [candidates[0] || "", candidates[1] || "", correct];
}

function renderKanjiChoiceButtons(item) {
    const host = document.getElementById("kanji-choice-buttons");
    host.replaceChildren();

    const options = getKanjiChoiceOptions(item);
    for (let index = options.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
    }

    options.forEach(value => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "kanji-choice-button";
        button.textContent = value;
        button.disabled = !value;
        button.addEventListener("click", () => submitKanjiChoice(value, button));
        host.appendChild(button);
    });
}

function submitKanjiChoice(answer, selectedButton) {
    if (!currentKey || !queue[currentKey]) return;

    const expected = queue[currentKey].kanji;
    const isCorrect = answer === expected;
    if (isCorrect) {
        queue[currentKey].reps--;
        setText("feedback", "Dobrze!");

        if (queue[currentKey].reps <= 0) {
            delete queue[currentKey];
        }

        pickChar();
        return;
    }

    queue[currentKey].reps += WRONG_ANSWER_PENALTY;
    setText("feedback", `Źle! Poprawna odpowiedź: ${expected}`);
    document.querySelectorAll(".kanji-choice-button").forEach(button => {
        button.disabled = true;
        if (button.textContent === expected) button.classList.add("choice-correct");
    });
    selectedButton.classList.add("choice-wrong");
    showContinueButton();
}

function clearAnswerInputs() {
    document.getElementById("romaji-answer").value = "";
    document.getElementById("hiragana-answer").value = "";
    document.getElementById("meaning-answer").value = "";
}

function endStudySession() {
    queue = {};
    currentKey = null;
    clearAnswerInputs();
    setText("feedback", "");
    hideContinueButton();
    showSelectionPanel();
}

function startStudy(keys) {
    queue = {};
    currentKey = null;
    setText("feedback", "");
    hideContinueButton();
    clearAnswerInputs();

    keys.forEach(key => {
        const [categoryKey, rowValue] = key.split(":");
        const category = categories.find(item => item.key === categoryKey);
        const item = category && category.items[Number(rowValue)];
        if (item) queue[key] = { ...item, reps: BASE_REPS };
    });

    if (Object.keys(queue).length === 0) {
        alert("Wybierz coś do nauki!");
        return false;
    }

    showStudyApp();
    pickChar();
    return true;
}

document.getElementById("start").onclick = () => {
    currentStudyMode = getSelectedStudyModeKey();
    syncStudyInputs();
    const chars = new Set();
    getSelectedCols().forEach(categoryKey => {
        const category = categories.find(item => item.key === categoryKey);
        if (!category) return;
        category.items.forEach((item, rowIndex) => {
            if (item) chars.add(getCellKey(category.key, rowIndex));
        });
    });
    getSelectedCells().forEach(cell => chars.add(cell));

    const keys = [...chars];
    if (startStudy(keys)) {
        studySet = keys;
    }
};

setupRepeatButton(() => startStudy(studySet));

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
        ? getAcceptedAnswersLocal(expected)
        : [expected];

    // A romaji answer is checked against every spelling of the expected value:
    // "kō", "kou" and "koo" are the same syllable, but "ko" is not. The
    // comparison must therefore keep the long-vowel marks, which
    // normalizeStudyText would strip.
    const enteredNormalized = mode.answer === "romaji"
        ? normalizeRomaji(entered)
        : normalizeStudyText(entered);
    const isCorrect = mode.answer === "romaji"
        ? romajiAnswerVariants(expected).some(option => option === enteredNormalized)
        : acceptedAnswers.some(option => normalizeStudyText(option) === enteredNormalized);

    if (isCorrect) {
        queue[currentKey].reps--;
        setText("feedback", "Dobrze!");

        if (queue[currentKey].reps <= 0) {
            delete queue[currentKey];
        }

        clearAnswerInputs();
        pickChar();
    } else {
        queue[currentKey].reps += WRONG_ANSWER_PENALTY;
        setText("feedback", `Źle! Poprawne: ${expected}`);
        showContinueButton();
    }
}

document.getElementById("submit").onclick = submitAnswer;
document.getElementById("end-study").onclick = endStudySession;

document.getElementById("continue").onclick = () => {
    hideContinueButton();
    setText("feedback", "");
    clearAnswerInputs();
    pickChar();
};

const displayModeSelect = document.getElementById("display-mode");
const questionModeSelect = document.getElementById("question-mode");

function updateStudyModeFromControls() {
    populateQuestionOptions();
    currentStudyMode = getSelectedStudyModeKey();
    saveUiState();
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
    selectVisibleDeckItems();
    renderTable();
    saveUiState();
});

const fontStyleSelect = document.getElementById("font-style");
function applyFontStyle(styleName) {
    applyCommonFontStyle(styleName, fontStyleSelect);
}

fontStyleSelect.addEventListener("change", event => applyFontStyle(event.target.value));
applyFontStyle("default");
populateDeckOptions();
renderTable();
displayModeSelect.value = restoredUiState?.displayMode || displayModeSelect.value;
populateQuestionOptions();
if (restoredUiState?.questionMode) {
    questionModeSelect.value = restoredUiState.questionMode;
}
currentStudyMode = getSelectedStudyModeKey();
syncStudyInputs();
saveUiState();

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

answerRomaji.addEventListener("keydown", event => handleEnterKey(event, submitAnswer));

answerHiragana.addEventListener("keydown", event => handleEnterKey(event, submitAnswer));

answerMeaning.addEventListener("keydown", event => handleEnterKey(event, submitAnswer));
