const {
    BASE_REPS,
    WRONG_ANSWER_PENALTY,
    readReloadState,
    storeSessionState,
    pickRandomKey,
    setText,
    setupRepeatButton,
    setupRepeatMistakesButton,
    recordMissedQuestion,
    getMissedQuestionKeys,
    resetMissedQuestions,
    showQueueFinished,
    hideContinueButton,
    showContinueButton,
    showSelectionPanel,
    showStudyApp,
    handleEnterKey
} = window.LangCommon;

const categories = window.germanVocabularyCategories;
const UI_STATE_KEY = "germanVocabularySelectionUiState";
const STUDY_STATE_KEY = "germanVocabularyStudyState";
const restoredUiState = readReloadState(UI_STATE_KEY);
const restoredStudyState = readReloadState(STUDY_STATE_KEY);
const categoryKeys = new Set(categories.map(category => category.key));
const selectedCategories = new Set(
    Array.isArray(restoredUiState?.selectedCategories)
        ? restoredUiState.selectedCategories.filter(key => categoryKeys.has(key))
        : categoryKeys
);
const directions = ["de-pl", "pl-de", "mixed"];

function saveUiState() {
    storeSessionState(UI_STATE_KEY, {
        selectedCategories: [...selectedCategories],
        direction: document.getElementById("translation-direction").value
    });
}

let queue = {};
let studySet = {};
let currentKey = null;
let awaitingContinue = false;
const answerInput = document.getElementById("vocabulary-answer");

function saveStudyState() {
    if (document.getElementById("app").style.display === "none") return;
    storeSessionState(STUDY_STATE_KEY, {
        active: true,
        queue,
        studySet,
        currentKey,
        awaitingContinue,
        missedQuestionKeys: getMissedQuestionKeys(),
        answer: answerInput.value,
        feedback: document.getElementById("feedback").textContent
    });
}

function cloneQueue(sourceQueue) {
    return Object.fromEntries(
        Object.entries(sourceQueue).map(([key, item]) => [key, { ...item }])
    );
}

function renderCategories() {
    const host = document.getElementById("vocabulary-categories");
    host.innerHTML = "";

    categories.forEach(category => {
        const label = document.createElement("label");
        label.className = "deck-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = category.key;
        checkbox.checked = selectedCategories.has(category.key);
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                selectedCategories.add(category.key);
            } else {
                selectedCategories.delete(category.key);
            }
            label.classList.toggle("deck-selected", checkbox.checked);
            saveUiState();
        });

        const name = document.createElement("span");
        name.className = "deck-name";
        name.textContent = category.label;

        const count = document.createElement("span");
        count.className = "deck-count";
        count.textContent = `(${category.items.length})`;

        label.append(checkbox, name, count);
        label.classList.toggle("deck-selected", checkbox.checked);
        host.appendChild(label);
    });
}

function setAllCategories(checked) {
    if (checked) {
        categories.forEach(category => selectedCategories.add(category.key));
    } else {
        categories.forEach(category => selectedCategories.delete(category.key));
    }

    document.querySelectorAll("#vocabulary-categories input").forEach(input => {
        input.checked = checked;
        input.closest(".deck-label").classList.toggle("deck-selected", checked);
    });
    saveUiState();
}

function startStudy() {
    queue = {};
    currentKey = null;
    const selectedDirection = document.getElementById("translation-direction").value;

    categories
        .filter(category => selectedCategories.has(category.key))
        .forEach(category => {
            category.items.forEach((entry, index) => {
                const directions = selectedDirection === "mixed"
                    ? ["de-pl", "pl-de"]
                    : [selectedDirection];

                // Każdy wpis daje osobne pozycje dla liczby pojedynczej i mnogiej, więc
                // obie formy są niezależnie testowane. "Die Kirche" i "die Kirchen"
                // to dwa różne pytania.
                //
                // Czasowniki i przymiotniki odmieniają się przez liczbę tylko
                // w przymiotniku (klein/kleine), więc dla nich druga pozycja
                // oznacza formę mnogą w rodzaju żeńskim/męskim - w praktyce
                // to samo słowo. Mimo to traktujemy je tak samo, żeby każda
                // pozycja w bazie była ćwiczona dwa razy.
                let forms = ["singular"];
                if (Boolean(entry.plural_pl))
                {
                    forms = ["singular", "plural"];
                }

                directions.forEach(direction => {
                    forms.forEach(form => {
                        const key = `${category.key}:${index}:${direction}:${form}`;
                        queue[key] = {
                            ...entry,
                            category: category.label,
                            direction,
                            form,
                            reps: BASE_REPS
                        };
                    });
                });
            });
        });

    if (Object.keys(queue).length === 0) {
        alert("Wybierz przynajmniej jedną kategorię!");
        return;
    }

    studySet = cloneQueue(queue);
    resetMissedQuestions();
    beginStudy(studySet);
}

function beginStudy(items) {
    queue = cloneQueue(items);
    currentKey = null;
    awaitingContinue = false;
    setText("feedback", "");
    document.getElementById("vocabulary-answer").value = "";
    hideContinueButton();
    showStudyApp();
    pickWord();
}

function pickWord(key = pickRandomKey(queue)) {
    currentKey = key;
    if (currentKey === null) {
        saveStudyState();
        showQueueFinished();
        return;
    }

    const item = queue[currentKey];
    const germanToPolish = item.direction === "de-pl";
    document.getElementById("char-box").innerHTML = "";

    // Przy pytaniu po niemiecku losujemy formę: czasem pojedynczą,
    // czasem mnogą. Przy tłumaczeniu na polski zawsze widzimy wyraz
    // w liczbie pojedynczej, bo tylko tak jest w danych.
    const usePlural = item.form === "plural";
    const shown = usePlural && item.plural ? item.plural : item.de;

    const prompt = document.createElement("div");
    prompt.className = "prompt-main";
    prompt.textContent = germanToPolish ? shown : item.pl[0];

    const detail = document.createElement("div");
    detail.className = "vocabulary-detail";
    // Czasowniki i rzeczowniki rodzaju żeńskiego nie mają odrębnej formy
    // mnogiej, więc nazywanie tego "liczbą mnogą" byłoby mylące.
    const formLabel = usePlural && item.plural
        ? " · liczba mnoga"
        : item.pos == "rzeczownik"
            ? " · liczba pojedyncza"
            : "";
    detail.textContent = `${item.category} · ${item.pos}${formLabel}`;

    document.getElementById("char-box").append(prompt, detail);
    const input = document.getElementById("vocabulary-answer");
    input.placeholder = germanToPolish ? "Podaj tłumaczenie po polsku" : "Podaj słowo po niemiecku";
    input.value = "";
    input.focus();

    // Przyciski znaków niemieckich są potrzebne tylko tam, gdzie pisze się
    // po niemiecku. Przy tłumaczeniu na polski tylko przeszkadzają.
    document.getElementById("german-characters").style.display = germanToPolish ? "none" : "flex";
    saveStudyState();
}

// Porównanie luźne - dla tłumaczenia na polski, gdzie wielkość liter
// i ogonki nie mają znaczenia ("Mokka" = "mokka").
// Czasowniki i rzeczowniki rodzaju żeńskiego nie mają odrębnej formy
// mnogiej, więc nazywanie tego "liczbą mnogą" byłoby mylące.
function hasDistinctPlural(item) {
    return Boolean(item.plural_pl) && Boolean(item.plural) && item.form === "plural";
}

function normalizeAnswer(value) {
    return String(value || "")
        .normalize("NFC")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("pl-PL");
}

// Porównanie ścisłe - dla odpowiedzi po niemiecku. Wyraz ma być dokładnie
// taki, jak w danych: z umlautami, eszettem i wielkimi literami. "die Kirchen"
// nie przechodzi więc jako "kirchen" ani "DIE KIRCHEN". Normalizujemy
// wyłącznie zapisy oczekiwane, żeby porównanie było sprawiedliwe.
function normalizeStrictGerman(value) {
    return String(value || "")
        .normalize("NFC")
        .trim()
        .replace(/\s+/g, " ");
}

function submitAnswer() {
    if (currentKey === null || !queue[currentKey]) return;

    const item = queue[currentKey];
    const germanToPolish = item.direction === "de-pl";
    const entered = document.getElementById("vocabulary-answer").value;

    // Tłumaczenie na polski: odpowiedzią jest znaczenie, a liczba mnoga
    // niemieckiego wyrazu jest dodatkową, równorzędną odpowiedzią
    // ("kościół" albo "die Kirchen"). Wielkość liter i ogonki nie mają
    // tu znaczenia.
    //
    // Odpowiedź po niemiecku: oczekujemy dokładnie TEJ formy, o którą
    // pytano - jeśli wypadła liczba mnoga, to tylko mnoga, i tylko
    // ścisły zapis (z umlautami, eszettem, wielkimi literami).
    const usePlural = hasDistinctPlural(item);
    const expectedGerman = usePlural && item.plural ? item.plural : item.de;

    const accepted = germanToPolish
        ? usePlural ? item.plural_pl : item.pl
        : [expectedGerman];
    const normalize = germanToPolish ? normalizeAnswer : normalizeStrictGerman;

    const isCorrect = accepted.some(answer => normalize(answer) === normalize(entered));

    if (isCorrect) {
        item.reps--;
        setText("feedback", "Dobrze!");
        hideContinueButton();
        if (item.reps <= 0) delete queue[currentKey];
        pickWord();
        return;
    }

    item.reps += WRONG_ANSWER_PENALTY;
    recordMissedQuestion(currentKey);
    setText("feedback", `Niepoprawnie. Poprawna odpowiedź: ${accepted.join(" / ")}`);
    awaitingContinue = true;
    showContinueButton();
    saveStudyState();
}

function endStudy() {
    queue = {};
    currentKey = null;
    awaitingContinue = false;
    storeSessionState(STUDY_STATE_KEY, null);
    document.getElementById("vocabulary-answer").value = "";
    setText("feedback", "");
    hideContinueButton();
    showSelectionPanel();
}

document.getElementById("select-all-categories").onclick = () => setAllCategories(true);
document.getElementById("clear-all-categories").onclick = () => setAllCategories(false);
document.getElementById("start").onclick = startStudy;
setupRepeatButton(() => beginStudy(studySet));
setupRepeatMistakesButton(() => {
    const missedItems = Object.fromEntries(
        getMissedQuestionKeys()
            .filter(key => studySet[key])
            .map(key => [key, studySet[key]])
    );
    beginStudy(missedItems);
});
document.getElementById("submit").onclick = submitAnswer;
document.getElementById("end-study").onclick = endStudy;
document.getElementById("continue").onclick = () => {
    hideContinueButton();
    awaitingContinue = false;
    setText("feedback", "");
    document.getElementById("vocabulary-answer").value = "";
    pickWord();
};
document.getElementById("vocabulary-answer").addEventListener("keydown", event => {
    handleEnterKey(event, submitAnswer);
});
answerInput.addEventListener("input", saveStudyState);

const directionSelect = document.getElementById("translation-direction");
if (directions.includes(restoredUiState?.direction)) {
    directionSelect.value = restoredUiState.direction;
}
directionSelect.addEventListener("change", saveUiState);

document.querySelectorAll("[data-character]").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById("vocabulary-answer");
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.setRangeText(button.dataset.character, start, end, "end");
        input.focus();
    });
});

renderCategories();
saveUiState();

if (restoredStudyState?.active) {
    const restoredQueue = restoredStudyState.queue;
    const restoredSet = restoredStudyState.studySet;
    const validQueue = restoredQueue &&
        !Array.isArray(restoredQueue) &&
        typeof restoredQueue === "object" &&
        Object.values(restoredQueue).every(item =>
            item &&
            typeof item === "object" &&
            directions.includes(item.direction) &&
            (item.form === "singular" || item.form === "plural") &&
            Number.isFinite(item.reps) &&
            item.reps > 0
        );
    const validStudySet = restoredSet &&
        !Array.isArray(restoredSet) &&
        typeof restoredSet === "object" &&
        Object.values(restoredSet).every(item =>
            item &&
            typeof item === "object" &&
            directions.includes(item.direction) &&
            (item.form === "singular" || item.form === "plural")
        );
    const validCurrentKey = restoredStudyState.currentKey === null ||
        Object.prototype.hasOwnProperty.call(restoredQueue || {}, restoredStudyState.currentKey);

    if (validQueue && validStudySet && validCurrentKey) {
        queue = cloneQueue(restoredQueue);
        studySet = cloneQueue(restoredSet);
        currentKey = restoredStudyState.currentKey;
        awaitingContinue = restoredStudyState.awaitingContinue === true;
        resetMissedQuestions();
        if (Array.isArray(restoredStudyState.missedQuestionKeys)) {
            restoredStudyState.missedQuestionKeys
                .filter(key => Object.prototype.hasOwnProperty.call(studySet, key))
                .forEach(recordMissedQuestion);
        }

        showStudyApp();
        if (currentKey === null) {
            showQueueFinished();
        } else {
            pickWord(currentKey);
            answerInput.value = typeof restoredStudyState.answer === "string"
                ? restoredStudyState.answer
                : "";
            setText("feedback", restoredStudyState.feedback || "");
            if (awaitingContinue) showContinueButton();
            else hideContinueButton();
            saveStudyState();
        }
    }
}
