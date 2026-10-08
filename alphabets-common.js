(function (global) {
    "use strict";

    const {
        BASE_REPS,
        STREAK_BONUS_THRESHOLD,
        WRONG_ANSWER_PENALTY,
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
    } = global.LangCommon;

    function createAlphabetStudy(
        getAnswer,
        downloadName,
        {
            normalizeAnswer = value => String(value ?? "").trim().toLowerCase(),
            getAcceptedAnswers = answer => global.LangCommon.getAcceptedAnswers(answer)
        } = {}
    ) {
        let queue = {};
        let studySet = [];
        let currentCharacter = null;
        let consecutiveCorrectCharacter = null;
        let consecutiveCorrectCount = 0;
        const answerInput = document.getElementById("answer");

        function pickCharacter() {
            const key = pickRandomKey(queue);
            if (key === null) {
                showQueueFinished();
                return;
            }
            currentCharacter = key;
            setText("char-box", currentCharacter);
        }

        function startStudy(
            characters,
            { resetMistakes = false, rememberStudySet = false } = {}
        ) {
            const invalidCharacters = characters.filter(character =>
                typeof character !== "string" ||
                character.length === 0 ||
                typeof getAnswer(character) !== "string"
            );
            if (invalidCharacters.length > 0) {
                throw new TypeError(
                    `Study set contains characters without answers: ${invalidCharacters.join(", ")}`
                );
            }

            if (resetMistakes) resetMissedQuestions();
            queue = {};
            characters.forEach(character => {
                queue[character] = BASE_REPS;
            });
            if (rememberStudySet) studySet = [...characters];
            currentCharacter = null;
            consecutiveCorrectCharacter = null;
            consecutiveCorrectCount = 0;
            answerInput.value = "";
            setText("feedback", "");
            hideContinueButton();
            showStudyApp();
            pickCharacter();
        }

        function submitAnswer() {
            const answer = normalizeAnswer(answerInput.value);
            const correctAnswer = getAnswer(currentCharacter);
            const acceptedAnswers = getAcceptedAnswers(correctAnswer, currentCharacter)
                .map(normalizeAnswer);

            if (acceptedAnswers.includes(answer)) {
                if (currentCharacter === consecutiveCorrectCharacter) {
                    consecutiveCorrectCount++;
                } else {
                    consecutiveCorrectCharacter = currentCharacter;
                    consecutiveCorrectCount = 1;
                }

                queue[currentCharacter]--;
                setText("feedback", "Dobrze!");
                if (queue[currentCharacter] <= 0 ||
                    consecutiveCorrectCount >= STREAK_BONUS_THRESHOLD) {
                    delete queue[currentCharacter];
                }
                if (consecutiveCorrectCount >= STREAK_BONUS_THRESHOLD) {
                    consecutiveCorrectCharacter = null;
                    consecutiveCorrectCount = 0;
                }

                answerInput.value = "";
                pickCharacter();
                return;
            }

            recordMissedQuestion(currentCharacter);
            consecutiveCorrectCharacter = null;
            consecutiveCorrectCount = 0;
            queue[currentCharacter] += WRONG_ANSWER_PENALTY;
            setText("feedback", `Źle! Poprawna odpowiedź: ${correctAnswer}`);
            showContinueButton();
        }

        document.getElementById("end-study").addEventListener("click", () => {
            queue = {};
            currentCharacter = null;
            setText("feedback", "");
            answerInput.value = "";
            hideContinueButton();
            showSelectionPanel();
        });
        document.getElementById("submit").addEventListener("click", submitAnswer);
        document.getElementById("continue").addEventListener("click", () => {
            hideContinueButton();
            setText("feedback", "");
            answerInput.value = "";
            pickCharacter();
        });

        answerInput.addEventListener("keydown", event => {
            if (event.key === " ") {
                event.preventDefault();
                return;
            }
            handleEnterKey(event, submitAnswer);
        });
        answerInput.addEventListener("input", () => {
            answerInput.value = answerInput.value.replace(/\s/g, "");
        });

        setupRepeatButton(() => startStudy(studySet));
        setupRepeatMistakesButton(() => startStudy(getMissedQuestionKeys()));

        const saveButton = document.getElementById("save");
        const loadButton = document.getElementById("load");
        const fileInput = document.getElementById("fileInput");
        if (saveButton && loadButton && fileInput) {
            saveButton.addEventListener("click", () => {
                const blob = new Blob([JSON.stringify(queue)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = downloadName;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            });
            loadButton.addEventListener("click", () => fileInput.click());
            fileInput.addEventListener("change", () => {
                const file = fileInput.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const restoredQueue = JSON.parse(reader.result);
                        if (!restoredQueue || Array.isArray(restoredQueue) ||
                            typeof restoredQueue !== "object" ||
                            Object.entries(restoredQueue).some(([character, reps]) =>
                                typeof getAnswer(character) !== "string" ||
                                !Number.isFinite(reps) ||
                                reps <= 0
                            )) {
                            throw new Error("Nieprawidłowy format postępu.");
                        }
                        queue = restoredQueue;
                        studySet = Object.keys(queue);
                        consecutiveCorrectCharacter = null;
                        consecutiveCorrectCount = 0;
                        answerInput.value = "";
                        setText("feedback", "");
                        hideContinueButton();
                        showStudyApp();
                        pickCharacter();
                    } catch (error) {
                        alert(`Nie udało się wczytać postępu: ${error.message}`);
                    }
                };
                reader.onerror = () => alert("Nie udało się odczytać pliku postępu.");
                reader.readAsText(file);
                fileInput.value = "";
            });
        }

        return { startStudy };
    }

    global.AlphabetsCommon = { createAlphabetStudy };
})(window);
