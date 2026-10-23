// Fetches pitch-accent data from OJAD (https://www.gavo.t.u-tokyo.ac.jp/ojad/)
// for the proper names used in the reading stories (kana-data.js). Ordinary
// story words are covered by reading-vocabulary-data.js, but the names aren't
// in it on purpose (that list feeds the kanji decks), so their pitch is stored
// on `readingCharacterNames` in kana-data.js instead. This script looks them up
// and compares the result with the stored value so it can be reviewed/filled in.
// Read-only: it writes a report, never edits kana-data.js.
//
// It is a wrapper around the existing tools, so it reuses the exact same
// OJAD parsing logic: tools/fetch-ojad-pitch.js for OJAD's word dictionary and
// tools/fetch-ojad-phrasing-pitch.js for the Suzuki-kun ML estimator that
// covers words missing from the dictionary. Those two only run their main()
// when started directly (require.main === module), so requiring them here just
// gives access to their helpers.
//
// Usage: node tools/fetch-ojad-pitch-names.js
"use strict";

const fs = require("fs");
const path = require("path");

const dictionary = require("./fetch-ojad-pitch.js");
const phrasing = require("./fetch-ojad-phrasing-pitch.js");

global.window = {};
require(path.join(__dirname, "..", "reading-vocabulary-data.js"));
require(path.join(__dirname, "..", "kana-data.js"));

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Suzuki-kun answers loanwords in katakana (せばすてぃあん → せバスティアン), so
// readings are compared after folding katakana onto hiragana.
function foldKatakana(value) {
    return Array.from(String(value || ""), character => {
        const codePoint = character.codePointAt(0);
        return codePoint >= 0x30a1 && codePoint <= 0x30f6
            ? String.fromCodePoint(codePoint - 0x60)
            : character;
    }).join("");
}

// Same normalisation the reading practice uses: readings are compared without
// whitespace or punctuation.
function normalizeReading(value) {
    return foldKatakana(value).toLowerCase().replace(/[\s、。,.!?！？・]/g, "");
}

// A name plus the kana actually shown for it: foreign names stored in katakana
// are converted the same way app.js does it when the hiragana script is chosen.
function collectNames() {
    const { readingStories, readingCharacterNames } = window.KanaData;
    const names = new Map();
    readingStories.forEach(story => {
        story.chapters.forEach(chapter => {
            chapter.verses.forEach(verse => {
                verse.forEach(part => {
                    if (part.particle) return;
                    const reading = normalizeReading(part.reading);
                    if (!readingCharacterNames[reading] || names.has(reading)) return;
                    const hiragana = foldKatakana(part.text.trim()).replace(/[、。,.!?！？・]+$/, "");
                    if (!hiragana) return;
                    const current = readingCharacterNames[reading];
                    names.set(reading, {
                        reading,
                        hiragana,
                        displayName: typeof current === "string" ? current : current.name,
                        currentPitch: typeof current === "object" ? current.pitch : undefined,
                        currentSource: typeof current === "object" ? current.pitchSource : undefined,
                        story: story.title,
                        isForeignName: !!part.foreignName
                    });
                });
            });
        });
    });
    return [...names.values()];
}

async function main() {
    const entries = collectNames();

    const rowsByWord = new Map();
    for (const batch of dictionary.chunk(entries.map(entry => entry.hiragana), dictionary.BATCH_SIZE)) {
        const html = await dictionary.fetchOjadHtml(batch);
        for (const row of dictionary.parseRows(html)) {
            if (!rowsByWord.has(row.word)) rowsByWord.set(row.word, []);
            rowsByWord.get(row.word).push(row);
        }
        await sleep(dictionary.REQUEST_DELAY_MS);
    }

    // OJAD's dictionary can answer a kana query with a kanji headword, so the
    // dictionary rows are matched by reading instead of by headword.
    function resolveFromDictionary(entry) {
        const candidates = [...rowsByWord.values()].flat().filter(row =>
            normalizeReading(row.hiragana) === entry.hiragana
        );
        if (candidates.length === 0) return null;
        const primary = candidates.find(row => row.isPrimary) || candidates[0];
        const alt = candidates.find(row => row.pitch !== primary.pitch);
        return { pitch: primary.pitch, alt: alt ? alt.pitch : null };
    }

    const estimatedByWord = new Map();
    const unresolved = entries.filter(entry => !resolveFromDictionary(entry));
    for (const batch of phrasing.chunk(unresolved.map(entry => entry.hiragana), phrasing.BATCH_SIZE)) {
        const html = await phrasing.fetchPhrasingHtml(batch);
        for (const phrase of phrasing.parsePhrases(html)) {
            if (!estimatedByWord.has(phrase.sourceWord)) estimatedByWord.set(phrase.sourceWord, []);
            estimatedByWord.get(phrase.sourceWord).push(phrase);
        }
        await sleep(phrasing.REQUEST_DELAY_MS);
    }

    // The estimator can misread an isolated word (see fetch-ojad-phrasing-pitch.js),
    // so an estimate is only trusted when its reading matches ours exactly.
    // A reading that spans several words (いえずす・きりすと) has no single pitch
    // of its own anyway — each part gets its own entry instead.
    const composed = new Map();
    for (const entry of entries) {
        const parts = splitNameParts(entry.hiragana);
        if (parts.length < 2) continue;
        const pitches = [];
        for (const part of parts) {
            const html = await phrasing.fetchPhrasingHtml([part]);
            const answer = phrasing.parsePhrases(html).find(phrase =>
                normalizeReading(phrase.hiragana) === normalizeReading(part)
            );
            pitches.push(answer || null);
            await sleep(phrasing.REQUEST_DELAY_MS);
        }
        if (pitches.some(pitch => !pitch)) continue;
        const sorted = [...pitches].sort((a, b) => b.hiragana.length - a.hiragana.length);
        composed.set(entry.reading, {
            pitch: sorted[0].pitch,
            wordPart: sorted[0].hiragana,
            parts: pitches.map(pitch => pitch.hiragana)
        });
    }
    function resolveFromPhrasing(entry) {
        const candidates = estimatedByWord.get(entry.hiragana) || [];
        return candidates.find(candidate =>
            normalizeReading(candidate.hiragana) === normalizeReading(entry.hiragana)
        ) || null;
    }

    // A verse can spell a name with a middle dot (いえずす・きりすと,
    // ぽんしお・ぴらと). Suzuki-kun drops such a whole entry when queried
    // alone, but answers the same text without the dot, so retry that spelling.
    for (const entry of entries) {
        if (resolveFromDictionary(entry) || resolveFromPhrasing(entry)) continue;
        const joined = entry.hiragana.replace(/・/g, "");
        if (joined === entry.hiragana) continue;
        const html = await phrasing.fetchPhrasingHtml([joined]);
        for (const phrase of phrasing.parsePhrases(html)) {
            if (!estimatedByWord.has(phrase.sourceWord)) estimatedByWord.set(phrase.sourceWord, []);
            estimatedByWord.get(phrase.sourceWord).push(phrase);
        }
        const answer = phrasing.parsePhrases(html).find(phrase => phrase.hiragana === joined);
        if (answer) estimatedByWord.set(entry.hiragana, [answer]);
        await sleep(phrasing.REQUEST_DELAY_MS);
    }

    const lines = ["reading\tname\thiragana\tstory\tlookup\tpitch\tpitch_alt\tpitch_source\tcurrent_value\tstatus\tnote"];
    const found = [];
    let notFound = 0;
    for (const entry of entries) {
        const direct = resolveFromDictionary(entry);
        const estimate = direct ? null : resolveFromPhrasing(entry);
        const composedEntry = direct || estimate ? null : composed.get(entry.reading);
        let pitch = "-";
        let pitchAlt = "-";
        let lookup;
        let source = "-";
        let note = "";
        if (direct) {
            pitch = direct.pitch;
            if (direct.alt !== null) pitchAlt = direct.alt;
            lookup = "dictionary";
            source = "ojad";
        } else if (estimate) {
            pitch = estimate.pitch;
            lookup = "suzuki-kun";
            source = "estimated";
        } else if (composedEntry) {
            pitch = composedEntry.pitch;
            lookup = "suzuki-kun-parts";
            source = "estimated";
            note = `pitch of ${composedEntry.wordPart} (name = ${composedEntry.parts.join(" + ")})`;
        } else {
            lookup = "not-found";
            notFound++;
        }
        const current = entry.currentPitch === undefined ? "-" : `${entry.currentPitch} (${entry.currentSource})`;
        const status = source === "-" ? "not-found"
            : entry.currentPitch === undefined ? "missing-in-kana-data"
            : Number(pitch) === entry.currentPitch ? "match"
            : "DIFFERENT";
        lines.push(`${entry.reading}\t${entry.displayName}\t${entry.hiragana}\t${entry.story}\t${lookup}\t${pitch}\t${pitchAlt}\t${source}\t${current}\t${status}\t${note}`);
        if (source !== "-") {
            found.push({ reading: entry.reading, pitch: Number(pitch) });
        }
    }

    const outputPath = path.join(__dirname, "..", "ojad-names-report.tsv");
    fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");

    console.log(`Wrote ${entries.length} names to ${outputPath}`);
    console.log(`${found.length} looked up, ${notFound} not found.`);
    const pending = lines.slice(1).filter(line => !line.endsWith("\tmatch"));
    if (pending.length > 0) {
        console.log(`${pending.length} name(s) differ from kana-data.js or are missing there — review the report and update readingCharacterNames:`);
        pending.forEach(line => console.log(`  ${line.split("\t").slice(0, 2).join(" — ")}`));
    }
    console.log("Suzuki-kun values are ML estimates, not dictionary data — review before trusting.");
}

// A verse can spell a name with a middle dot (いえずす・きりすと,
// ぽんしお・ぴらと). OJAD has no pitch for such a multi-word spelling, so each
// part is looked up on its own; the word part of the reading gets the pitch,
// and the report notes that the name is pronounced as several words.
function splitNameParts(hiragana) {
    return hiragana.split("・").map(part => part.trim()).filter(Boolean);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
