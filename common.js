// Shared helpers used by both app.js (kana) and kanji.js (kanji).
// Loaded before those scripts and exposed on window.LangCommon.
(function (global) {
    "use strict";

    const FONT_STYLES = ["default", "brush", "elegant", "modern"];
    const FONT_STYLE_CLASSES = FONT_STYLES.map(name => `font-style-${name}`);
    const STORAGE_KEY_FONT_STYLE = "hiraganaFontStyle";

    function readStoredFontStyle() {
        try {
            return localStorage.getItem(STORAGE_KEY_FONT_STYLE);
        } catch (error) {
            // localStorage may be unavailable in some contexts.
            return null;
        }
    }

    function storeFontStyle(styleName) {
        try {
            localStorage.setItem(STORAGE_KEY_FONT_STYLE, styleName);
        } catch (error) {
            // localStorage may be unavailable in some contexts.
        }
    }

    function readReloadState(key) {
        const navigationEntry = performance.getEntriesByType("navigation")[0];
        const isReload = navigationEntry
            ? navigationEntry.type === "reload"
            : performance.navigation && performance.navigation.type === 1;
        if (!isReload) return null;

        try {
            const serialized = sessionStorage.getItem(key);
            return serialized ? JSON.parse(serialized) : null;
        } catch (error) {
            return null;
        }
    }

    function storeSessionState(key, state) {
        try {
            sessionStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            // Session storage may be unavailable in restricted browser contexts.
        }
    }

    function applyFontStyle(styleName, selectEl) {
        const normalized = FONT_STYLES.includes(styleName) ? styleName : "default";

        document.body.classList.remove(...FONT_STYLE_CLASSES);
        document.body.classList.add(`font-style-${normalized}`);

        if (selectEl) {
            selectEl.value = normalized;
        }

        return normalized;
    }

    // Labeled checkbox used in every table header (rows and columns).
    function createToggleLabel(value, labelText, { checked = true, placeholder = false } = {}) {
        const label = document.createElement("label");
        label.className = "toggle";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = checked;
        input.value = value;

        const span = document.createElement("span");
        if (placeholder) {
            span.textContent = " ";
            span.setAttribute("aria-hidden", "true");
            span.classList.add("placeholder-label");
        } else {
            span.textContent = labelText;
            span.removeAttribute("aria-hidden");
            span.classList.remove("placeholder-label");
        }

        label.appendChild(input);
        label.appendChild(span);

        return { label, input };
    }

    // A group (row or column) counts as selected only when it has cells
    // and every one of them is selected.
    function isGroupFullySelected(cells, selectedCells) {
        return cells.length > 0 && cells.every(cell => selectedCells.has(cell));
    }

    function checkedValues(selector) {
        const values = [];
        document.querySelectorAll(selector).forEach(input => {
            if (input.checked) values.push(input.value);
        });
        return values;
    }

    function setGroupSelection(cells, selectedCells, isChecked) {
        cells.forEach(cell => {
            if (isChecked) {
                selectedCells.add(cell);
            } else {
                selectedCells.delete(cell);
            }
        });
    }

    // Shared queue behaviour: reps, streak bonus and the "wrong answer" penalty.
    const BASE_REPS = 5;
    const STREAK_BONUS_THRESHOLD = 3;
    const WRONG_ANSWER_PENALTY = 2;
    let repeatAction = null;

    function setupRepeatButton(onRepeat) {
        const button = document.getElementById("repeat-study");
        if (!button) {
            throw new Error('Missing required "repeat-study" button.');
        }
        if (typeof onRepeat !== "function") {
            throw new TypeError("The repeat action must be a function.");
        }

        repeatAction = onRepeat;
        button.style.display = "none";
        button.onclick = () => repeatAction();
    }

    function pickRandomKey(queue) {
        const remaining = Object.keys(queue);
        if (remaining.length === 0) return null;
        return remaining[Math.floor(Math.random() * remaining.length)];
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }

    function showQueueFinished() {
        setText("char-box", "Koniec! 🎉");
        const repeatButton = document.getElementById("repeat-study");
        if (repeatButton && repeatAction) repeatButton.style.display = "inline-block";
    }

    function hideContinueButton() {
        const button = document.getElementById("continue");
        if (button) button.style.display = "none";
    }

    function showContinueButton() {
        const button = document.getElementById("continue");
        if (button) button.style.display = "inline-block";
    }

    function showSelectionPanel() {
        const panel = document.getElementById("selection-panel");
        const app = document.getElementById("app");
        const repeatButton = document.getElementById("repeat-study");
        if (panel) panel.style.display = "block";
        if (app) app.style.display = "none";
        if (repeatButton) repeatButton.style.display = "none";
    }

    function showStudyApp() {
        const panel = document.getElementById("selection-panel");
        const app = document.getElementById("app");
        const repeatButton = document.getElementById("repeat-study");
        if (panel) panel.style.display = "none";
        if (app) app.style.display = "block";
        if (repeatButton) repeatButton.style.display = "none";
    }

    function handleEnterKey(event, submitAnswer) {
        if (event.key !== "Enter") return;

        event.preventDefault();
        const continueButton = document.getElementById("continue");
        if (continueButton && continueButton.style.display !== "none") {
            continueButton.click();
        } else {
            submitAnswer();
        }
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

    // Romaji writes one long vowel in several ways: "kō", "kou" and "koo" all
    // mean the same thing, but "ko" is a different syllable and must stay
    // rejected. Only spellings that are unambiguously long are listed.
    const LONG_VOWEL_SPELLINGS = {
        ō: ["ō", "ou", "oo"],
        ū: ["ū", "uu"],
        ē: ["ē", "ee", "ei"],
        ā: ["ā", "aa"],
        ī: ["ī", "ii"]
    };

    // Like normalizeStudyText, but the long-vowel marks are kept: they are the
    // only thing that tells "ko" from "kō", so stripping them here would make
    // the two indistinguishable.
    function normalizeRomaji(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[-_]/g, "");
    }

    // Every accepted spelling of a romaji answer. The expected value is never
    // shortened: "kō" accepts "kō", "kou" and "koo", but not "ko".
    function romajiAnswerVariants(value) {
        const raw = String(value || "");

        // Each part is either fixed text or a set of spellings for one long
        // vowel, in reading order. Rebuilding the value from these gives every
        // accepted spelling: "imōto" -> parts ["i", [ō...], "to"].
        const parts = [];
        let last = 0;
        const markRe = /[ōūēāī]/g;
        let match;
        while ((match = markRe.exec(raw)) !== null) {
            parts.push(raw.slice(last, match.index));
            parts.push(LONG_VOWEL_SPELLINGS[match[0]]);
            last = match.index + match[0].length;
        }
        parts.push(raw.slice(last));

        const results = parts.reduce(
            (partial, part) =>
                partial.flatMap(text =>
                    Array.isArray(part)
                        ? part.map(spelling => text + spelling)
                        : [text + part]
                ),
            [""]
        );

        return results.map(normalizeRomaji).filter(Boolean);
    }

    global.LangCommon = {
        BASE_REPS,
        STREAK_BONUS_THRESHOLD,
        WRONG_ANSWER_PENALTY,
        applyFontStyle,
        readStoredFontStyle,
        storeFontStyle,
        readReloadState,
        storeSessionState,
        createToggleLabel,
        isGroupFullySelected,
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
        getAcceptedAnswers,
        normalizeRomaji,
        romajiAnswerVariants
    };
})(window);