const {
    BASE_REPS,
    WRONG_ANSWER_PENALTY,
    pickRandomKey,
    setText,
    showQueueFinished,
    hideContinueButton,
    showContinueButton,
    showSelectionPanel,
    showStudyApp,
    handleEnterKey
} = window.LangCommon;

const categories = window.germanVocabularyCategories;
const selectedCategories = new Set(categories.map(category => category.key));

let queue = {};
let currentKey = null;

function renderCategories() {
    const host = document.getElementById("vocabulary-categories");
    host.innerHTML = "";

    categories.forEach(category => {
        const label = document.createElement("label");
        label.className = "deck-label deck-selected";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = category.key;
        checkbox.checked = true;
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                selectedCategories.add(category.key);
            } else {
                selectedCategories.delete(category.key);
            }
            label.classList.toggle("deck-selected", checkbox.checked);
        });

        const name = document.createElement("span");
        name.className = "deck-name";
        name.textContent = category.label;

        const count = document.createElement("span");
        count.className = "deck-count";
        count.textContent = `(${category.items.length})`;

        label.append(checkbox, name, count);
        host.appendChild(label);
    });
}

function setAllCategories(checked) {
    selectedCategories.clear();
    if (checked) categories.forEach(category => selectedCategories.add(category.key));

    document.querySelectorAll("#vocabulary-categories input").forEach(input => {
        input.checked = checked;
        input.closest(".deck-label").classList.toggle("deck-selected", checked);
    });
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
                directions.forEach(direction => {
                    const key = `${category.key}:${index}:${direction}`;
                    queue[key] = {
                        ...entry,
                        category: category.label,
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

    setText("feedback", "");
    showStudyApp();
    pickWord();
}

function pickWord() {
    currentKey = pickRandomKey(queue);
    if (currentKey === null) {
        showQueueFinished();
        return;
    }

    const item = queue[currentKey];
    const germanToPolish = item.direction === "de-pl";
    document.getElementById("char-box").innerHTML = "";

    const prompt = document.createElement("div");
    prompt.className = "prompt-main";
    prompt.textContent = germanToPolish ? item.de : item.pl[0];

    const detail = document.createElement("div");
    detail.className = "vocabulary-detail";
    detail.textContent = `${item.category} · ${item.pos}`;

    document.getElementById("char-box").append(prompt, detail);
    const input = document.getElementById("vocabulary-answer");
    input.placeholder = germanToPolish ? "Podaj tłumaczenie po polsku" : "Podaj słowo po niemiecku";
    input.value = "";
    input.focus();
}

function normalizeAnswer(value) {
    return String(value || "").normalize("NFC").trim().toLocaleLowerCase("pl-PL");
}

function submitAnswer() {
    if (currentKey === null || !queue[currentKey]) return;

    const item = queue[currentKey];
    const germanToPolish = item.direction === "de-pl";
    const accepted = germanToPolish ? item.pl : [item.de];
    const isCorrect = accepted.some(answer =>
        normalizeAnswer(answer) ===
        normalizeAnswer(document.getElementById("vocabulary-answer").value)
    );

    if (isCorrect) {
        item.reps--;
        setText("feedback", "Dobrze!");
        hideContinueButton();
        if (item.reps <= 0) delete queue[currentKey];
        pickWord();
        return;
    }

    item.reps += WRONG_ANSWER_PENALTY;
    setText("feedback", `Niepoprawnie. Poprawna odpowiedź: ${accepted.join(" / ")}`);
    showContinueButton();
}

function endStudy() {
    queue = {};
    currentKey = null;
    document.getElementById("vocabulary-answer").value = "";
    setText("feedback", "");
    hideContinueButton();
    showSelectionPanel();
}

document.getElementById("select-all-categories").onclick = () => setAllCategories(true);
document.getElementById("clear-all-categories").onclick = () => setAllCategories(false);
document.getElementById("start").onclick = startStudy;
document.getElementById("submit").onclick = submitAnswer;
document.getElementById("end-study").onclick = endStudy;
document.getElementById("continue").onclick = () => {
    hideContinueButton();
    setText("feedback", "");
    document.getElementById("vocabulary-answer").value = "";
    pickWord();
};
document.getElementById("vocabulary-answer").addEventListener("keydown", event => {
    handleEnterKey(event, submitAnswer);
});

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
