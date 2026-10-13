const {
    BASE_REPS,
    createRepsTracker,
    readReloadState,
    storeSessionState,
    renderDeckCheckboxList,
    setAllDeckCheckboxes,
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
    handleEnterKey,
    normalizeStudyText,
    getAcceptedAnswers
} = window.LangCommon;

const DATA_KEY = "flashcardsUploadedData";
const UI_STATE_KEY = "flashcardsSelectionUiState";
const STUDY_STATE_KEY = "flashcardsStudyState";

// A two-letter ISO-style language code, e.g. "pl", "de", "en".
const LANGUAGE_CODE_RE = /^[a-z]{2}$/;

// Every flashcard in the file must use the same two language codes, so the
// direction picker only ever has to offer "A -> B", "B -> A" and "mixed".
function validateFlashcardsData(raw) {
    if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error("Plik musi być niepustą listą kategorii.");
    }

    let languageOrder = null;
    let languageSetKey = null;

    const categories = raw.map((category, categoryIndex) => {
        if (!category || typeof category !== "object" || Array.isArray(category)) {
            throw new Error(`Kategoria #${categoryIndex + 1} musi być obiektem.`);
        }
        const name = typeof category.name === "string" ? category.name.trim() : "";
        if (!name) {
            throw new Error(`Kategoria #${categoryIndex + 1} musi mieć niepuste pole "name".`);
        }
        if (!Array.isArray(category.flashcards) || category.flashcards.length === 0) {
            throw new Error(`Kategoria "${name}" musi mieć niepustą listę "flashcards".`);
        }

        const flashcards = category.flashcards.map((card, cardIndex) => {
            if (!card || typeof card !== "object" || Array.isArray(card)) {
                throw new Error(`Fiszka #${cardIndex + 1} w kategorii "${name}" musi być obiektem.`);
            }
            const keys = Object.keys(card);
            if (keys.length !== 2) {
                throw new Error(
                    `Fiszka #${cardIndex + 1} w kategorii "${name}" musi mieć dokładnie dwa pola (kody języków).`
                );
            }

            const normalized = {};
            keys.forEach(key => {
                const code = key.toLowerCase();
                if (!LANGUAGE_CODE_RE.test(code)) {
                    throw new Error(
                        `Pole "${key}" fiszki #${cardIndex + 1} w kategorii "${name}" musi być dwuliterowym kodem języka.`
                    );
                }
                const value = typeof card[key] === "string" ? card[key].trim() : "";
                if (!value) {
                    throw new Error(
                        `Pole "${key}" fiszki #${cardIndex + 1} w kategorii "${name}" musi mieć niepustą wartość.`
                    );
                }
                normalized[code] = value;
            });

            const setKey = Object.keys(normalized).sort().join("-");
            if (!languageSetKey) {
                languageSetKey = setKey;
                languageOrder = keys.map(key => key.toLowerCase());
            } else if (setKey !== languageSetKey) {
                throw new Error(
                    `Wszystkie fiszki muszą używać tej samej pary języków. ` +
                    `Fiszka #${cardIndex + 1} w kategorii "${name}" używa innej pary kodów.`
                );
            }

            return normalized;
        });

        return { name, flashcards };
    });

    return { categories, languages: languageOrder };
}

function toDeckModels(validatedCategories) {
    return validatedCategories.map((category, index) => ({
        key: String(index),
        label: category.name,
        items: category.flashcards
    }));
}

function isValidStoredData(data) {
    return Boolean(data) &&
        Array.isArray(data.languages) &&
        data.languages.length === 2 &&
        data.languages.every(code => LANGUAGE_CODE_RE.test(code)) &&
        Array.isArray(data.decks) &&
        data.decks.every(deck =>
            deck &&
            typeof deck.key === "string" &&
            typeof deck.label === "string" &&
            Array.isArray(deck.items) &&
            deck.items.every(card =>
                card &&
                typeof card === "object" &&
                data.languages.every(code => typeof card[code] === "string" && card[code])
            )
        );
}

const restoredData = readReloadState(DATA_KEY);
let decks = isValidStoredData(restoredData) ? restoredData.decks : [];
let languages = isValidStoredData(restoredData) ? restoredData.languages : null;

const restoredUiState = readReloadState(UI_STATE_KEY);
const restoredStudyState = readReloadState(STUDY_STATE_KEY);
const deckKeys = new Set(decks.map(deck => deck.key));
const selectedCategories = new Set(
    Array.isArray(restoredUiState?.selectedCategories)
        ? restoredUiState.selectedCategories.filter(key => deckKeys.has(key))
        : deckKeys
);

function directionOptions() {
    if (!languages) return [];
    const [first, second] = languages;
    return [
        { value: `${first}-${second}`, label: `${first} → ${second}` },
        { value: `${second}-${first}`, label: `${second} → ${first}` },
        { value: "mixed", label: "oba kierunki — wymieszane" }
    ];
}

function populateDirectionSelect() {
    const select = document.getElementById("translation-direction");
    const options = directionOptions();
    select.innerHTML = options.map(option => `<option value="${option.value}">${option.label}</option>`).join("");
    if (options.some(option => option.value === restoredUiState?.direction)) {
        select.value = restoredUiState.direction;
    }
}

function saveUiState() {
    storeSessionState(UI_STATE_KEY, {
        selectedCategories: [...selectedCategories],
        direction: document.getElementById("translation-direction").value
    });
}

let queue = {};
let studySet = {};
let currentKey = null;
const repsTracker = createRepsTracker();
let awaitingContinue = false;
const answerInput = document.getElementById("flashcard-answer");

function saveStudyState() {
    if (document.getElementById("app").style.display === "none") return;
    storeSessionState(STUDY_STATE_KEY, {
        active: true,
        queue,
        studySet,
        currentKey,
        ...repsTracker.getState(),
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
    renderDeckCheckboxList("flashcards-categories", decks, selectedCategories, saveUiState);
}

function setAllCategories(checked) {
    setAllDeckCheckboxes("flashcards-categories", decks, selectedCategories, checked, saveUiState);
}

function showLoadedDeck() {
    document.getElementById("selection-panel").hidden = false;
    populateDirectionSelect();
    renderCategories();
    saveUiState();
}

function applyLoadedData(validated, fileName) {
    decks = toDeckModels(validated.categories);
    languages = validated.languages;
    deckKeys.clear();
    decks.forEach(deck => deckKeys.add(deck.key));
    selectedCategories.clear();
    deckKeys.forEach(key => selectedCategories.add(key));

    storeSessionState(DATA_KEY, { decks, languages });
    storeSessionState(STUDY_STATE_KEY, null);
    storeSessionState(UI_STATE_KEY, null);

    const cardCount = decks.reduce((total, deck) => total + deck.items.length, 0);
    document.getElementById("flashcards-file-status").textContent =
        `Wczytano "${fileName}": ${decks.length} kategorii, ${cardCount} fiszek (${languages[0]}/${languages[1]}).`;

    endStudy();
    showLoadedDeck();
}

function startStudy() {
    queue = {};
    currentKey = null;
    const selectedDirection = document.getElementById("translation-direction").value;
    const [langA, langB] = languages;

    decks
        .filter(deck => selectedCategories.has(deck.key))
        .forEach(deck => {
            deck.items.forEach((card, index) => {
                const directionsToUse = selectedDirection === "mixed"
                    ? [`${langA}-${langB}`, `${langB}-${langA}`]
                    : [selectedDirection];

                directionsToUse.forEach(direction => {
                    const key = `${deck.key}:${index}:${direction}`;
                    queue[key] = {
                        card,
                        categoryLabel: deck.label,
                        direction,
                        reps: BASE_REPS
                    };
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
    repsTracker.reset();
    awaitingContinue = false;
    setText("feedback", "");
    answerInput.value = "";
    hideContinueButton();
    showStudyApp();
    pickCard();
}

function pickCard(key = pickRandomKey(queue)) {
    currentKey = key;
    if (currentKey === null) {
        saveStudyState();
        showQueueFinished();
        return;
    }

    const item = queue[currentKey];
    const [promptLang, answerLang] = item.direction.split("-");
    document.getElementById("char-box").innerHTML = "";

    const prompt = document.createElement("div");
    prompt.className = "prompt-main";
    // A field may list alternate spellings ("jajko / jajo") for matching the
    // answer; only the first one is shown when it is the prompt instead.
    prompt.textContent = getAcceptedAnswers(item.card[promptLang])[0] || item.card[promptLang];

    const detail = document.createElement("div");
    detail.className = "vocabulary-detail";
    detail.textContent = `${item.categoryLabel} · ${promptLang} → ${answerLang}`;

    document.getElementById("char-box").append(prompt, detail);
    answerInput.placeholder = `Podaj słowo (${answerLang})`;
    answerInput.value = "";
    answerInput.focus();
    saveStudyState();
}

function submitAnswer() {
    if (currentKey === null || !queue[currentKey]) return;

    const item = queue[currentKey];
    const [, answerLang] = item.direction.split("-");
    const entered = answerInput.value;
    const accepted = getAcceptedAnswers(item.card[answerLang]);
    const isCorrect = accepted.some(answer => normalizeStudyText(answer) === normalizeStudyText(entered));

    if (isCorrect) {
        const { reps, finished } = repsTracker.recordCorrect(currentKey, item.reps);
        item.reps = reps;
        setText("feedback", "Dobrze!");
        hideContinueButton();
        if (finished) delete queue[currentKey];
        pickCard();
        return;
    }

    item.reps = repsTracker.recordWrong(item.reps);
    recordMissedQuestion(currentKey);
    setText("feedback", `Niepoprawnie. Poprawna odpowiedź: ${accepted.join(" / ")}`);
    awaitingContinue = true;
    showContinueButton();
    saveStudyState();
}

function endStudy() {
    queue = {};
    currentKey = null;
    repsTracker.reset();
    awaitingContinue = false;
    storeSessionState(STUDY_STATE_KEY, null);
    answerInput.value = "";
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
    answerInput.value = "";
    pickCard();
};
answerInput.addEventListener("keydown", event => handleEnterKey(event, submitAnswer));
answerInput.addEventListener("input", saveStudyState);

document.getElementById("translation-direction").addEventListener("change", saveUiState);

const fileInput = document.getElementById("flashcards-file");
document.getElementById("load-flashcards-file").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const raw = JSON.parse(reader.result);
            const validated = validateFlashcardsData(raw);
            applyLoadedData(validated, file.name);
        } catch (error) {
            alert(`Nie udało się wczytać pliku: ${error.message}`);
        }
    };
    reader.onerror = () => alert("Nie udało się odczytać pliku.");
    reader.readAsText(file);
    fileInput.value = "";
});

if (decks.length > 0 && languages) {
    const cardCount = decks.reduce((total, deck) => total + deck.items.length, 0);
    document.getElementById("flashcards-file-status").textContent =
        `Wczytano wcześniejszy plik: ${decks.length} kategorii, ${cardCount} fiszek (${languages[0]}/${languages[1]}).`;
    showLoadedDeck();
}

if (restoredStudyState?.active && decks.length > 0) {
    const restoredQueue = restoredStudyState.queue;
    const restoredSet = restoredStudyState.studySet;
    const validItem = item =>
        item &&
        typeof item === "object" &&
        item.card &&
        typeof item.direction === "string" &&
        Number.isFinite(item.reps) &&
        item.reps > 0;
    const validQueue = restoredQueue &&
        !Array.isArray(restoredQueue) &&
        typeof restoredQueue === "object" &&
        Object.values(restoredQueue).every(validItem);
    const validStudySet = restoredSet &&
        !Array.isArray(restoredSet) &&
        typeof restoredSet === "object" &&
        Object.values(restoredSet).every(validItem);
    const validCurrentKey = restoredStudyState.currentKey === null ||
        Object.prototype.hasOwnProperty.call(restoredQueue || {}, restoredStudyState.currentKey);

    if (validQueue && validStudySet && validCurrentKey) {
        queue = cloneQueue(restoredQueue);
        studySet = cloneQueue(restoredSet);
        currentKey = restoredStudyState.currentKey;
        repsTracker.restoreState(restoredStudyState);
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
            pickCard(currentKey);
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
