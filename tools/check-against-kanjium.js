// Cross-checks our lower-confidence pitch values ("estimated"/"guess") against
// the Kanjium accents.txt dataset (124k words, CC BY-SA 4.0, see
// https://github.com/mifunetoshiro/kanjium). Each line is
// "word<TAB>reading<TAB>pattern[,pattern...]", using the exact same
// accent-kernel numbering we already use (0=heiban, N=drop position), so no
// conversion is needed. Read-only: writes a report, never edits data files.
//
// Usage: node tools/check-against-kanjium.js
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

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

global.window = {};
require(path.join(__dirname, "..", "reading-vocabulary-data.js"));
require(path.join(__dirname, "..", "kanji-data.js"));

async function loadKanjiumMap() {
    const url = "https://raw.githubusercontent.com/mifunetoshiro/kanjium/master/data/source_files/raw/accents.txt";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch Kanjium data (${response.status})`);
    const text = await response.text();

    const byWordAndReading = new Map();
    // Kanjium indexes words by their kanji orthography (然し/併し for しかし), so a
    // kana-only entry in our data (kanji field === hiragana field, e.g. しかし)
    // needs a second index keyed by reading alone to find those variants.
    const byReading = new Map();
    text.split("\n").forEach(line => {
        const [word, reading, patterns] = line.split("\t");
        if (!word || !reading || !patterns) return;
        const pitches = patterns.trim().split(",").map(Number).filter(Number.isInteger);

        const key = `${word}\u0000${reading}`;
        if (!byWordAndReading.has(key)) byWordAndReading.set(key, []);
        byWordAndReading.get(key).push(...pitches);

        if (!byReading.has(reading)) byReading.set(reading, []);
        byReading.get(reading).push(...pitches);
    });
    return { byWordAndReading, byReading };
}

function collectTargets() {
    const targets = [];
    window.readingVocabulary.forEach(item => {
        if (item.pitchSource === "estimated" || item.pitchSource === "guess") {
            targets.push({ file: "reading-vocabulary-data.js", kanji: item.kanji, hiragana: item.hiragana, pitch: item.pitch, source: item.pitchSource });
        }
    });
    window.kanjiCategories
        .filter(category => !category.key.startsWith("reading-stories-"))
        .forEach(category => {
            category.items.forEach(item => {
                if (item.pitchSource === "estimated" || !item.pitchSource) {
                    targets.push({ file: "kanji-data.js", kanji: item.kanji, hiragana: item.hiragana || toHiraganaFromRomaji(item.romaji), pitch: item.pitch, source: item.pitchSource || "missing", romaji: item.romaji });
                }
            });
        });
    return targets;
}

async function main() {
    const { byWordAndReading, byReading } = await loadKanjiumMap();
    const targets = collectTargets();

    const lines = ["file\tkanji\thiragana\tnasz_pitch\tnasz_source\tkanjium_pitch\tstatus"];
    let matches = 0;
    let mismatches = 0;
    let notFound = 0;
    for (const target of targets) {
        let pitches = byWordAndReading.get(`${target.kanji}\u0000${target.hiragana}`);
        let viaReading = false;
        if (!pitches && target.kanji === target.hiragana) {
            pitches = byReading.get(target.hiragana);
            viaReading = true;
        }
        let status;
        let kanjiumPitch = "-";
        if (!pitches) {
            status = "not-found";
            notFound++;
        } else {
            const distinct = [...new Set(pitches)];
            kanjiumPitch = distinct.join("/");
            if (target.source === "missing") {
                status = viaReading ? "NEW-via-reading" : "NEW";
                matches++;
            } else if (distinct.includes(target.pitch)) {
                status = viaReading ? "match-via-reading" : "match";
                matches++;
            } else {
                status = viaReading ? "MISMATCH-via-reading" : "MISMATCH";
                mismatches++;
            }
        }
        lines.push(`${target.file}\t${target.kanji}\t${target.hiragana}\t${target.pitch}\t${target.source}\t${kanjiumPitch}\t${status}`);
    }

    const outputPath = path.join(__dirname, "..", "kanjium-crosscheck.tsv");
    fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");
    console.log(`Checked ${targets.length} low-confidence entries against Kanjium.`);
    console.log(`${matches} match, ${mismatches} MISMATCH, ${notFound} not found in Kanjium.`);
    console.log(`Report: ${outputPath}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
