// Testy jednostkowe czystych funkcji pomocniczych z common.js (bez DOM).
// Używa wbudowanego w Node.js runnera testów - bez instalowania zależności.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

global.window = {};
require(path.join(__dirname, "..", "common.js"));

const {
    createRepsTracker,
    isGroupFullySelected,
    getAcceptedAnswers,
    normalizeStudyText,
    normalizeRomaji,
    romajiAnswerVariants,
    pickRandomKey,
    BASE_REPS,
    STREAK_BONUS_THRESHOLD,
    WRONG_ANSWER_PENALTY
} = window.LangCommon;

test("createRepsTracker: zerowe reps kończy element", () => {
    const tracker = createRepsTracker();
    assert.deepEqual(tracker.recordCorrect("a", 1), { reps: 0, finished: true });
});

test(`createRepsTracker: seria ${STREAK_BONUS_THRESHOLD} z rzędu kończy element wcześniej`, () => {
    const tracker = createRepsTracker();
    let result = tracker.recordCorrect("a", BASE_REPS);
    assert.equal(result.finished, false);
    result = tracker.recordCorrect("a", result.reps);
    assert.equal(result.finished, false);
    result = tracker.recordCorrect("a", result.reps);
    assert.equal(result.finished, true);
    assert.ok(result.reps > 0, "bonus za serię kończy element mimo pozostałych reps");
});

test("createRepsTracker: zmiana klucza przerywa serię", () => {
    const tracker = createRepsTracker();
    tracker.recordCorrect("a", BASE_REPS);
    const result = tracker.recordCorrect("b", BASE_REPS);
    assert.equal(result.finished, false);
});

test("createRepsTracker: recordWrong dolicza karę i zeruje serię", () => {
    const tracker = createRepsTracker();
    tracker.recordCorrect("a", BASE_REPS);
    const reps = tracker.recordWrong(BASE_REPS - 1);
    assert.equal(reps, BASE_REPS - 1 + WRONG_ANSWER_PENALTY);
    const result = tracker.recordCorrect("a", reps);
    assert.equal(result.finished, false);
});

test("createRepsTracker: restoreState odtwarza getState", () => {
    const tracker = createRepsTracker();
    tracker.recordCorrect("a", BASE_REPS);
    const state = tracker.getState();
    const restored = createRepsTracker();
    restored.restoreState(state);
    assert.deepEqual(restored.getState(), state);
});

test("createRepsTracker: reset czyści stan serii", () => {
    const tracker = createRepsTracker();
    tracker.recordCorrect("a", BASE_REPS);
    tracker.reset();
    assert.deepEqual(tracker.getState(), { streakKey: null, streakCount: 0 });
});

test("isGroupFullySelected: wymaga zaznaczenia każdej komórki grupy", () => {
    const selected = new Set(["a", "b"]);
    assert.equal(isGroupFullySelected(["a", "b"], selected), true);
    assert.equal(isGroupFullySelected(["a", "c"], selected), false);
    assert.equal(isGroupFullySelected([], selected), false);
});

test("getAcceptedAnswers: dzieli po ukośniku", () => {
    assert.deepEqual(getAcceptedAnswers("kot / kotek"), ["kot", "kotek"]);
    assert.deepEqual(getAcceptedAnswers("pies"), ["pies"]);
    assert.deepEqual(getAcceptedAnswers(""), []);
});

test("normalizeStudyText: usuwa diakrytyki, wielkość liter, spacje i separatory", () => {
    assert.equal(normalizeStudyText("Kraków "), "krakow");
    assert.equal(normalizeStudyText("co-kolwiek"), "cokolwiek");
});

test("romajiAnswerVariants: akceptuje każdy zapis długiej samogłoski", () => {
    assert.deepEqual(romajiAnswerVariants("kō"), ["kō", "kou", "koo"]);
    assert.equal(normalizeRomaji("Kou "), "kou");
});

test("pickRandomKey: null dla pustej kolejki, jedyny klucz zawsze wybrany", () => {
    assert.equal(pickRandomKey({}), null);
    assert.equal(pickRandomKey({ only: 1 }), "only");
    const picked = pickRandomKey({ a: 1, b: 1, c: 1 });
    assert.ok(["a", "b", "c"].includes(picked));
});
