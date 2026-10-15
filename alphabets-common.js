(function (global) {
    "use strict";

    const {
        BASE_REPS,
        createRepsTracker,
        readReloadState,
        storeSessionState,
        pickRandomKey,
        setText,
        setupRepeatButton,
        setupRepeatMistakesButton,
        recordMissedQuestion,
        getMissedQuestionKeys,
        resetMissedQuestions,
        updateQueueCounter,
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
        const repsTracker = createRepsTracker();
        let awaitingContinue = false;
        let activeStudy = false;
        const studyStateKey = `alphabetStudyState:${downloadName}`;
        const answerInput = document.getElementById("answer");

        function saveStudyState() {
            if (!activeStudy) return;
            storeSessionState(studyStateKey, {
                active: true,
                queue,
                studySet,
                currentCharacter,
                ...repsTracker.getState(),
                awaitingContinue,
                missedQuestionKeys: getMissedQuestionKeys(),
                answer: answerInput.value,
                feedback: document.getElementById("feedback").textContent
            });
        }

        function pickCharacter() {
            updateQueueCounter(queue);
            const key = pickRandomKey(queue);
            if (key === null) {
                currentCharacter = null;
                awaitingContinue = false;
                saveStudyState();
                showQueueFinished();
                return;
            }
            currentCharacter = key;
            setText("char-box", currentCharacter);
            saveStudyState();
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
            activeStudy = true;
            awaitingContinue = false;
            queue = {};
            characters.forEach(character => {
                queue[character] = BASE_REPS;
            });
            if (rememberStudySet) studySet = [...characters];
            currentCharacter = null;
            repsTracker.reset();
            answerInput.value = "";
            setText("feedback", "");
            hideContinueButton();
            showStudyApp();
            saveStudyState();
            pickCharacter();
        }

        function submitAnswer() {
            const answer = normalizeAnswer(answerInput.value);
            const correctAnswer = getAnswer(currentCharacter);
            const acceptedAnswers = getAcceptedAnswers(correctAnswer, currentCharacter)
                .map(normalizeAnswer);

            if (acceptedAnswers.includes(answer)) {
                const { reps, finished } = repsTracker.recordCorrect(currentCharacter, queue[currentCharacter]);
                queue[currentCharacter] = reps;
                setText("feedback", "Dobrze!");
                if (finished) {
                    delete queue[currentCharacter];
                }

                answerInput.value = "";
                awaitingContinue = false;
                pickCharacter();
                return;
            }

            recordMissedQuestion(currentCharacter);
            queue[currentCharacter] = repsTracker.recordWrong(queue[currentCharacter]);
            setText("feedback", `Źle! Poprawna odpowiedź: ${correctAnswer}`);
            awaitingContinue = true;
            showContinueButton();
            saveStudyState();
        }
        document.getElementById("end-study").addEventListener("click", () => {
            activeStudy = false;
            storeSessionState(studyStateKey, null);
            queue = {};
            currentCharacter = null;
            awaitingContinue = false;
            setText("feedback", "");
            setText("queue-counter", "");
            answerInput.value = "";
            hideContinueButton();
            showSelectionPanel();
        });
        document.getElementById("submit").addEventListener("click", submitAnswer);
        document.getElementById("continue").addEventListener("click", () => {
            hideContinueButton();
            setText("feedback", "");
            answerInput.value = "";
            awaitingContinue = false;
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
            saveStudyState();
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
                        activeStudy = true;
                        awaitingContinue = false;
                        repsTracker.reset();
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

        const restoredStudyState = readReloadState(studyStateKey);
        if (restoredStudyState?.active) {
            const restoredQueue = restoredStudyState.queue;
            const isValidQueue = restoredQueue &&
                !Array.isArray(restoredQueue) &&
                typeof restoredQueue === "object" &&
                Object.entries(restoredQueue).every(([character, reps]) =>
                    typeof getAnswer(character) === "string" &&
                    Number.isFinite(reps) &&
                    reps > 0
                );
            const restoredCurrentCharacter = restoredStudyState.currentCharacter;
            if (isValidQueue && (
                restoredCurrentCharacter === null ||
                Object.prototype.hasOwnProperty.call(restoredQueue, restoredCurrentCharacter)
            )) {
                queue = restoredQueue;
                studySet = Array.isArray(restoredStudyState.studySet)
                    ? restoredStudyState.studySet.filter(character =>
                        typeof getAnswer(character) === "string"
                    )
                    : Object.keys(restoredQueue);
                currentCharacter = restoredCurrentCharacter;
                repsTracker.restoreState(restoredStudyState);
                awaitingContinue = restoredStudyState.awaitingContinue === true;
                activeStudy = true;
                resetMissedQuestions();
                if (Array.isArray(restoredStudyState.missedQuestionKeys)) {
                    restoredStudyState.missedQuestionKeys
                        .filter(character => typeof getAnswer(character) === "string")
                        .forEach(recordMissedQuestion);
                }
                answerInput.value = typeof restoredStudyState.answer === "string"
                    ? restoredStudyState.answer
                    : "";
                setText("feedback", restoredStudyState.feedback || "");
                showStudyApp();
                if (currentCharacter === null) {
                    showQueueFinished();
                } else {
                    setText("char-box", currentCharacter);
                    if (awaitingContinue) {
                        setText("feedback", `Źle! Poprawna odpowiedź: ${getAnswer(currentCharacter)}`);
                        showContinueButton();
                    } else {
                        hideContinueButton();
                    }
                }
            }
        }

        return { startStudy };
    }

    global.AlphabetsCommon = { createAlphabetStudy };
})(window);
