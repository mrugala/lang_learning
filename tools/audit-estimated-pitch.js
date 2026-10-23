// Audits pitch accents that were not taken from OJAD's word dictionary:
// `pitchSource` "estimated" (Suzuki-kun ML estimate), "guess" (nobody checked)
// and entries with no pitchSource at all. For each one it re-queries OJAD —
// the word dictionary first, then Suzuki-kun — and reports whether the stored
// `pitch` actually matches what OJAD says now.
//
// Read-only: writes ojad-pitch-audit.tsv, never edits the data files.
//
// Usage: node tools/audit-estimated-pitch.js
//        node tools/audit-estimated-pitch.js --vocab    (only reading-vocabulary-data.js)
//        node tools/audit-estimated-pitch.js --kanji    (only kanji-data.js)
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dictionary = require("./fetch-ojad-pitch.js");
const phrasing = require("./fetch-ojad-phrasing-pitch.js");

global.window = {};
require(path.join(__dirname, "..", "reading-vocabulary-data.js"));
require(path.join(__dirname, "..", "kanji-data.js"));

const onlyVocab = process.argv.includes("--vocab");
const onlyKanji = process.argv.includes("--kanji");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Same romaji->hiragana converter app.js/kanji.js show, so "our own reading"
// is what the app itself would display.
function loadToHiraganaFromRomaji() {
    const src = fs.readFileSync(path.join(__dirname, "..", "kanji.js"), "utf8");
    const start = src.indexOf("// Consonant + vowel");
    const end = src.indexOf("function getDisplayValue");
    if (start === -1 || end === -1 || end <= start) {
        throw new Error("Could not locate the romaji converter in kanji.js.");
    }
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(src.slice(start, end) + "\ntoHiraganaFromRomaji;", sandbox);
    return sandbox.toHiraganaFromRomaji;
}
const toHiraganaFromRomaji = loadToHiraganaFromRomaji();

function foldToHiragana(value) {
    return Array.from(String(value || ""), character => {
        const codePoint = character.codePointAt(0);
        return codePoint >= 0x30a1 && codePoint <= 0x30f6
            ? String.fromCodePoint(codePoint - 0x60)
            : character;
    }).join("");
}

function normalizeReading(value) {
    return foldToHiragana(value).toLowerCase().replace(/[\s、。,.!?！？・ー]/g, "");
}

// Everything that isn't a plain dictionary hit, from both data files.
function collectTargets() {
    const targets = [];
    if (!onlyKanji) {
        window.readingVocabulary.forEach((entry, index) => {
            if (entry.pitchSource === "ojad" || entry.pitchSource === "kanjium") return;
            targets.push({
                file: "reading-vocabulary-data.js",
                index,
                id: `vocab[${index}]`,
                kanji: entry.kanji,
                hiragana: entry.hiragana,
                romaji: entry.romaji,
                meaning: entry.meaning,
                pitch: entry.pitch,
                pitchAlt: entry.pitchAlt,
                pitchSource: entry.pitchSource || "(none)",
                aliases: entry.aliases || []
            });
        });
    }
    if (!onlyVocab) {
        window.kanjiCategories.forEach(category => {
            if (category.key.startsWith("reading-stories-")) return;
            category.items.forEach(item => {
                if (!item.kanji) return;
                if (item.pitchSource === "ojad" || item.pitchSource === "kanjium") return;
                targets.push({
                    file: "kanji-data.js",
                    id: `${category.key}/${item.kanji}`,
                    kanji: item.kanji,
                    hiragana: item.hiragana || toHiraganaFromRomaji(item.romaji || ""),
                    romaji: item.romaji,
                    meaning: item.meaning,
                    pitch: item.pitch,
                    pitchAlt: item.pitchAlt,
                    pitchSource: item.pitchSource || "(none)"
                });
            });
        });
    }
    return targets;
}

async function main() {
    const targets = collectTargets();
    console.log(`Checking ${targets.length} non-dictionary entries…`);

    // --- Pass 1: OJAD word dictionary, by kanji spelling and by reading. ---
    const dictionaryRows = [];
    const queries = [...new Set(targets.flatMap(t => [t.kanji, t.hiragana]).filter(Boolean))];
    for (const batch of dictionary.chunk(queries, dictionary.BATCH_SIZE)) {
        const html = await dictionary.fetchOjadHtml(batch);
        dictionaryRows.push(...dictionary.parseRows(html));
        await sleep(dictionary.REQUEST_DELAY_MS);
    }

    function fromDictionary(target) {
        const byReading = dictionaryRows.filter(row =>
            normalizeReading(row.hiragana) === normalizeReading(target.hiragana)
        );
        // Prefer a row whose headword is our own kanji spelling.
        const sameWord = byReading.filter(row => row.word === target.kanji);
        const candidates = sameWord.length > 0 ? sameWord : [];
        if (candidates.length === 0) return null;
        const primary = candidates.find(row => row.isPrimary) || candidates[0];
        const alt = candidates.find(row => row.pitch !== primary.pitch);
        return { pitch: primary.pitch, alt: alt ? alt.pitch : null, word: primary.word };
    }

    // --- Pass 2: Suzuki-kun for whatever the dictionary doesn't have. ---
    const phrasingResults = [];
    const unanswered = targets.filter(target => !fromDictionary(target));
    const phrasingQueries = [...new Set(unanswered.map(target => target.hiragana).filter(Boolean))];
    for (const batch of phrasing.chunk(phrasingQueries, phrasing.BATCH_SIZE)) {
        const html = await phrasing.fetchPhrasingHtml(batch);
        phrasingResults.push(...phrasing.parsePhrases(html));
        await sleep(phrasing.REQUEST_DELAY_MS);
    }

    function fromPhrasing(target) {
        const match = phrasingResults.find(phrase =>
            normalizeReading(phrase.hiragana) === normalizeReading(target.hiragana)
        );
        return match ? { pitch: match.pitch, alt: null, word: match.sourceWord } : null;
    }

    // --- Compare. ---
    const lines = ["file\tentry\tkanji\thiragana\tstored_pitch\tstored_source\tfound_by\tojad_pitch\tojad_alt\tojad_word\tstatus"];
    const problems = [];
    const summary = { match: 0, mismatch: 0, missing: 0, unverified: 0 };

    for (const target of targets) {
        const found = fromDictionary(target) || fromPhrasing(target);
        const foundBy = fromDictionary(target) ? "dictionary" : (found ? "suzuki-kun" : "-");
        const stored = Number.isInteger(target.pitch) ? target.pitch : "-";
        let status;
        if (!found) {
            // Nothing to compare against — the stored value stays unverified,
            // which for a "guess" is expected, not a proven error.
            status = "no-ojad-data";
            summary.unverified++;
        } else if (found.pitch === target.pitch) {
            status = "match";
            summary.match++;
        } else {
            status = "MISMATCH";
            summary.mismatch++;
            problems.push({ target, found, foundBy });
        }
        lines.push([
            target.file, target.id, target.kanji, target.hiragana, stored, target.pitchSource,
            foundBy, found ? found.pitch : "-", found && found.alt !== null ? found.alt : "-",
            found ? found.word : "-", status
        ].join("\t"));
    }

    const outputPath = path.join(__dirname, "..", "ojad-pitch-audit.tsv");
    fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");

    console.log(`Wrote ${targets.length} rows to ${outputPath}`);
    console.log(`match ${summary.match}, MISMATCH ${summary.mismatch}, no-ojad-data ${summary.unverified}`);
    if (problems.length > 0) {
        console.log("\nMismatches (stored vs OJAD):");
        problems.forEach(({ target, found, foundBy }) => {
            console.log(`  ${target.id}  ${target.kanji} (${target.hiragana})  stored=${target.pitch} [${target.pitchSource}]  ojad=${found.pitch} via ${foundBy}${found.alt !== null ? ` (alt ${found.alt})` : ""}  — ${target.meaning || ""}`);
        });
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
