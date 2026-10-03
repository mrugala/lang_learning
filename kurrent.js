// Trening pisma Kurrent: najpierw pojedyncze litery (małe i wielkie),
// potem odczytywanie losowych słów. Korzysta z pomocników z common.js.
const {
    BASE_REPS,
    STREAK_BONUS_THRESHOLD,
    WRONG_ANSWER_PENALTY,
    createToggleLabel,
    isGroupFullySelected: areAllSelected,
    setGroupSelection,
    pickRandomKey,
    setText,
    showQueueFinished,
    hideContinueButton,
    showContinueButton,
    showSelectionPanel,
    showStudyApp,
    handleEnterKey,
    normalizeStudyText
} = window.LangCommon;

const letterGroups = window.kurrentLetters;
const decks = window.kurrentDecks;

let currentMode = "letters";

// Spłaszczona lista liter: każda ma wariant mały i wielki.
const letters = letterGroups.flatMap(group =>
    group.items.map(item => ({
        char: item.char,
        upper: item.upper,
        reading: item.reading,
        // Dodatkowe, równorzędne zapisy odpowiedzi (np. dla umlautów i
        // eszetta). Gdy brak - przyjmujemy sam "reading".
        variants: item.variants || [],
        groupKey: group.key
    }))
);

const selectedLetters = new Set();
letters.forEach(letter => {
    selectedLetters.add(letter.char);
    if (letter.upper) selectedLetters.add(letter.upper);
});

const selectedDecks = new Set(decks.map(deck => deck.key));

// ------------------------------------------------------------------- UI ----

function glyphFor(letter, rowKey) {
    return rowKey === "upper" ? letter.upper : letter.char;
}

function cellIdsForRow(rowKey) {
    return letters
        .map(letter => glyphFor(letter, rowKey))
        .filter(Boolean);
}
// Siatka liter: jedna litera = jedna kafelka z małą i wielką formą.
// Podpis tożsamości glify (litera łacińska), nie wymowa.
function renderLetterTable() {
    const host = document.getElementById("kurrent-table");
    host.innerHTML = "";

    const grid = document.createElement("div");
    grid.className = "letter-grid";

    letterGroups.forEach(group => {
        group.items.forEach(item => {
            const cell = document.createElement("div");
            cell.className = "letter-pair";
            cell.dataset.group = group.key;

            const forms = [
                {
                    glyph: item.char,
                    caseKey: "lower",
                    label: item.char,
                    selectionGlyph: item.char
                }
            ];
            if (item.char === "s") {
                forms.push({
                    glyph: "ſ",
                    caseKey: "lower",
                    label: "s",
                    selectionGlyph: item.char
                });
            }
            if (item.upper) {
                forms.push({
                    glyph: item.upper,
                    caseKey: "upper",
                    label: item.upper,
                    selectionGlyph: item.upper
                });
            }

            forms.forEach(({ glyph, caseKey, label, selectionGlyph }) => {
                const glyphEl = document.createElement("span");
                glyphEl.className = `letter-glyph kurrent-text letter-${caseKey}`;
                glyphEl.dataset.glyph = selectionGlyph;
                glyphEl.textContent = glyph;

                glyphEl.addEventListener("click", () => {
                    if (selectedLetters.has(selectionGlyph)) {
                        selectedLetters.delete(selectionGlyph);
                    } else {
                        selectedLetters.add(selectionGlyph);
                    }
                    syncLetterHighlights();
                });

                // Podpis tożsamości glify, czyli odpowiadającej jej litery
                // łacińskiej. Wymowa kurrentowa trafia do podpowiedzi, nie
                // do odpowiedzi: glifa v odpowiada v, nie f.
                const name = document.createElement("div");
                name.className = "letter-name";
                name.textContent = label;
                name.title = glyph === "ſ"
                    ? "Długie s"
                    : item.reading
                    ? `Wymowa: ${caseKey === "lower" ? item.reading : item.reading.toUpperCase()}`
                    : "";

                // Glifa wraz z podpisem tworzą jedną jednostkę - inaczej
                // flex ustawiłby je w kolumnie: mała, podpis, wielka, podpis.
                const form = document.createElement("div");
                form.className = "letter-form";
                form.appendChild(glyphEl);
                form.appendChild(name);

                cell.appendChild(form);
            });

            // Kafelka leży bezpośrednio w siatce, więc każda litera zajmuje
            // jeden równy slot - bez dziur po grupach.
            grid.appendChild(cell);
        });
    });

    host.appendChild(grid);

    // Nagłówek: przełącznik dla wszystkich małych / wszystkich wielkich liter.
    const bar = document.createElement("div");
    bar.className = "letter-case-bar";

    [
        { key: "lower", label: "małe" },
        { key: "upper", label: "wielkie" }
    ].forEach(def => {
        const { label } = createToggleLabel(def.key, def.label);
        bar.appendChild(label);
    });

    host.appendChild(bar);
}

function syncLetterHighlights() {
    document.querySelectorAll("#kurrent-table .letter-glyph").forEach(el => {
        el.classList.toggle("cell-selected", selectedLetters.has(el.dataset.glyph));
    });

    syncLetterCheckboxes();
}

function syncLetterCheckboxes() {
    document.querySelectorAll("#kurrent-table .letter-case-bar input").forEach(input => {
        input.checked = areAllSelected(cellIdsForRow(input.value), selectedLetters);
    });
}

function renderDecks() {
    const host = document.getElementById("kurrent-decks");
    host.innerHTML = "";

    decks.forEach(deck => {
        const label = document.createElement("label");
        label.className = "deck-label";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = deck.key;
        input.checked = true;

        const name = document.createElement("span");
        name.className = "deck-name";
        name.textContent = deck.label;

        const count = document.createElement("span");
        count.className = "deck-count";
        count.textContent = `(${deck.items.length})`;

        label.appendChild(input);
        label.appendChild(name);
        label.appendChild(count);
        label.classList.add("deck-selected");
        host.appendChild(label);

        input.addEventListener("change", () => {
            if (input.checked) {
                selectedDecks.add(deck.key);
            } else {
                selectedDecks.delete(deck.key);
            }
            label.classList.toggle("deck-selected", input.checked);
        });
    });
}

function setAllDecks(checked) {
    selectedDecks.clear();
    if (checked) decks.forEach(deck => selectedDecks.add(deck.key));

    document.querySelectorAll("#kurrent-decks input").forEach(input => {
        input.checked = checked;
        input.closest(".deck-label").classList.toggle("deck-selected", checked);
    });
}

function switchMode(mode) {
    currentMode = mode;
    document.getElementById("letters-panel").style.display = mode === "letters" ? "block" : "none";
    document.getElementById("words-panel").style.display = mode === "words" ? "block" : "none";
}

// ---------------------------------------------------------------- nauka ----

let queue = {};
let currentItem = null;
let consecutiveCorrectKey = null;
let consecutiveCorrectCount = 0;

// Wszystkie zapisy uznawane za poprawną odpowiedź na glifę.
// Dla zwykłych liter odpowiedzią jest wyłącznie tożsamość litery - jej
// wymowa kurrentowa (q = "kv", x = "ks") celowo NIE jest akceptowana.
// Umlauty i eszett mają własne warianty zapisu, które dochodzą.
function acceptedAnswersFor(letter, uppercase) {
    // "reading" powtarza się w "variants", stąd bezpośredni zapis glify
    // dokładamy tylko wtedy, gdy wariantów nie ma (zwykłe litery).
    const spellings = letter.variants.length > 0
        ? [letter.reading, ...letter.variants]
        : [letter.char];

    // Wielki zapis bierzemy z "upper" (eszett: ß -> ẞ, a nie "ss".toUpperCase()).
    const cased = uppercase
        ? spellings.map(s => s.toUpperCase()).concat(letter.upper)
        : spellings;

    return [...new Set(cased)];
}

function buildLettersItems() {
    const items = [];
    letters.forEach(letter => {
        if (selectedLetters.has(letter.char)) {
            items.push({
                glyph: letter.char,
                answers: acceptedAnswersFor(letter, false),
                answer: letter.char,
                uppercase: false
            });
            if (letter.char === "s") {
                items.push({
                    glyph: "ſ",
                    answers: ["s"],
                    answer: "s",
                    uppercase: false
                });
            }
        }
        if (letter.upper && selectedLetters.has(letter.upper)) {
            items.push({
                glyph: letter.upper,
                answers: acceptedAnswersFor(letter, true),
                answer: letter.upper,
                uppercase: true
            });
        }
    });
    return items;
}

function buildWordsItems() {
    const items = [];
    decks
        .filter(deck => selectedDecks.has(deck.key))
        .forEach(deck => {
            deck.items.forEach(entry => {
                // Pole "word" zawiera rodzajnik, więc wyraz zawsze zaczyna się
                // wielką literą - o to w tym etapie chodzi.
                items.push({
                    glyph: entry.word,
                    answers: [entry.word],
                    answer: entry.word,
                    uppercase: false
                });
                items.push({
                    glyph: entry.plural,
                    answers: [entry.plural],
                    answer: entry.plural,
                    uppercase: false
                });
            });
        });
    return items;
}

function currentItems() {
    return currentMode === "letters" ? buildLettersItems() : buildWordsItems();
}

function itemKey(item) {
    return `${currentMode}|${item.glyph}`;
}

function startStudy() {
    queue = {};
    currentItem = null;
    consecutiveCorrectKey = null;
    consecutiveCorrectCount = 0;

    const items = currentItems();
    if (items.length === 0) {
        alert("Wybierz coś do nauki!");
        return;
    }

    items.forEach(item => {
        queue[itemKey(item)] = BASE_REPS;
    });

    showStudyApp();
    pickItem();
}

function pickItem() {
    const key = pickRandomKey(queue);
    if (key === null) {
        showQueueFinished();
        return;
    }

    const item = currentItems().find(i => itemKey(i) === key);
    if (!item) {
        delete queue[key];
        pickItem();
        return;
    }

    currentItem = item;
    renderPrompt(item);
}

function renderPrompt(item) {
    const box = document.getElementById("char-box");
    box.innerHTML = "";

    const main = document.createElement("div");
    main.className = currentMode === "words"
        ? "prompt-main kurrent-text kurrent-word"
        : "prompt-main kurrent-text";
    main.textContent = currentMode === "words"
        ? item.glyph.replace(/s(?=[a-zäöüß])/g, "ſ")
        : item.glyph;
    box.appendChild(main);

    document.getElementById("kurrent-answer").placeholder = "Jak się to czyta?";
}

function normalizeKurrentWordAnswer(value) {
    return normalizeStudyText(
        String(value || "")
            .toLowerCase()
            .replace(/ä/g, "ae")
            .replace(/ö/g, "oe")
            .replace(/ü/g, "ue")
            .replace(/ß/g, "ss")
    );
}

// normalizeStudyText z common.js zmniejsza wielkość liter, więc dla liter
// Kurrentu byłoby zgubić informację o wielkości. Tu zachowujemy wielkość,
// zostawiając tylko porządkowanie (odstępy, myślniki, kropki nad literami).
// Dzięki temu wielka litera przyjmuje tylko wielkie odpowiedzi, a mała -
// tylko małe.
function normalizeLetterAnswer(value) {
    return String(value || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .replace(/[-_]/g, "");
}

function submitAnswer() {
    const input = document.getElementById("kurrent-answer");
    const entered = input.value;
    if (entered.trim() === "" || currentItem === null) return;

    // Dla liter porównujemy z zachowaniem wielkości (wielka glifa przyjmuje
    // tylko wielkie zapisy) i z pełną listą wariantów; dla słów korzystamy
    // z normalizacji z common.js, która ignoruje wielkość.
    const isCorrect = currentMode === "letters"
        ? currentItem.answers.some(spelling => normalizeLetterAnswer(entered) === normalizeLetterAnswer(spelling))
        : normalizeKurrentWordAnswer(entered) === normalizeKurrentWordAnswer(currentItem.answer);

    const key = itemKey(currentItem);

    if (isCorrect) {
        if (key === consecutiveCorrectKey) {
            consecutiveCorrectCount++;
        } else {
            consecutiveCorrectKey = key;
            consecutiveCorrectCount = 1;
        }

        queue[key] = queue[key] - 1;

        if (queue[key] <= 0 || consecutiveCorrectCount >= STREAK_BONUS_THRESHOLD) {
            delete queue[key];
            consecutiveCorrectKey = null;
            consecutiveCorrectCount = 0;
        }

        setText("feedback", "Dobrze!");
        input.value = "";
        pickItem();
    } else {
        consecutiveCorrectKey = null;
        consecutiveCorrectCount = 0;
        queue[key] = queue[key] + WRONG_ANSWER_PENALTY;
        setText("feedback", `Źle! Poprawna odpowiedź: ${currentItem.answers.join(" / ")}`);
        showContinueButton();
    }
}

function endStudy() {
    queue = {};
    currentItem = null;
    consecutiveCorrectKey = null;
    consecutiveCorrectCount = 0;
    setText("feedback", "");
    document.getElementById("kurrent-answer").value = "";
    hideContinueButton();
    showSelectionPanel();
}

// ---------------------------------------------------------------- start ----

document.addEventListener("change", event => {
    if (!event.target.matches("#kurrent-table input[type='checkbox']")) return;

    const input = event.target;

    if (input.closest(".letter-case-bar")) {
        setGroupSelection(cellIdsForRow(input.value), selectedLetters, input.checked);
        syncLetterHighlights();
    }
});

document.getElementById("select-all").onclick = () => {
    selectedLetters.clear();
    letters.forEach(letter => {
        selectedLetters.add(letter.char);
        if (letter.upper) selectedLetters.add(letter.upper);
    });
    syncLetterHighlights();
};

document.getElementById("clear-all").onclick = () => {
    selectedLetters.clear();
    syncLetterHighlights();
};

document.getElementById("select-all-decks").onclick = () => setAllDecks(true);
document.getElementById("clear-all-decks").onclick = () => setAllDecks(false);
document.getElementById("start").onclick = startStudy;
document.getElementById("submit").onclick = submitAnswer;
document.getElementById("end-study").onclick = endStudy;

document.getElementById("continue").onclick = () => {
    hideContinueButton();
    setText("feedback", "");
    document.getElementById("kurrent-answer").value = "";
    pickItem();
};

document.getElementById("kurrent-mode").addEventListener("change", event => switchMode(event.target.value));

document.getElementById("kurrent-answer").addEventListener("keydown", event => {
    handleEnterKey(event, submitAnswer);
});

renderLetterTable();
renderDecks();
syncLetterHighlights();
