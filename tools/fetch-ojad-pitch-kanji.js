// Fetches pitch-accent data from OJAD's word dictionary for kanji-data.js
// (excluding the runtime-generated "reading-stories-*" categories, which are
// just references into reading-vocabulary-data.js and already have `pitch`).
// Read-only: writes a report, never edits kanji-data.js.
//
// Usage: node tools/fetch-ojad-pitch-kanji.js
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Reuse the exact romaji->hiragana converter from kanji.js (same technique as
// tools/check-hiragana.js) so our "expected reading" matches what the app
// itself would show.
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

const BATCH_SIZE = 4;
const REQUEST_DELAY_MS = 500;
const USER_AGENT = "Mozilla/5.0 (compatible; lang_learning-pitch-check/1.0)";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchOjadHtml(words) {
    // limit:100 and a small BATCH_SIZE matter a lot here: a single kanji query
    // also matches every compound word containing it (e.g. 酒 sake also pulls in
    // 酒屋, お酒, 日本酒, ...), so a batch of 10 bare kanji can easily produce 50+
    // rows and silently push some of the batch's own words off OJAD's default
    // 20-row page.
    const url = `https://www.gavo.t.u-tokyo.ac.jp/ojad/search/index/limit:100/word:${encodeURIComponent(words.join(","))}`;
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) throw new Error(`OJAD request failed (${response.status}) for ${url}`);
    return response.text();
}

// Same markup rules as tools/fetch-ojad-pitch.js: "accent_top" marks the mora
// after which pitch drops (1-based); none anywhere means heiban (0). A word
// can have several accepted accent patterns, each its own
// <div class="katsuyo_proc"> block; the first one is OJAD's prescriptive
// (規範型) pattern per its own documentation.
function parseRows(html) {
    const rows = [];
    const rowRe = /<tr id="word_\d+">([\s\S]*?)<\/tr>/g;
    let rowMatch;
    while ((rowMatch = rowRe.exec(html)) !== null) {
        const rowHtml = rowMatch[1];
        const wordMatch = /class="midashi_word">([^<]+)</.exec(rowHtml);
        const jishoMatch = /class="katsuyo katsuyo_jisho_js">([\s\S]*?)<\/td>/.exec(rowHtml);
        if (!wordMatch || !jishoMatch) continue;

        const word = wordMatch[1].split(/[・\[]/)[0];

        const procRe = /<div class="katsuyo_proc">([\s\S]*?)<div class="katsuyo_proc_button/g;
        let procMatch;
        let variantIndex = 0;
        while ((procMatch = procRe.exec(jishoMatch[1])) !== null) {
            const moraRe = /<span class="\s?(accent_top|accent_plain)?\s?mola_-?\d+"><span class="inner">((?:<span class="char">[^<]*<\/span>)+)<\/span>/g;
            const hiraganaParts = [];
            let topIndex = -1;
            let moraMatch;
            let moraIndex = 0;
            while ((moraMatch = moraRe.exec(procMatch[1])) !== null) {
                const charText = [...moraMatch[2].matchAll(/class="char">([^<]*)</g)].map(c => c[1]).join("");
                hiraganaParts.push(charText);
                if (moraMatch[1] === "accent_top") topIndex = moraIndex;
                moraIndex++;
            }
            if (hiraganaParts.length > 0) {
                const moraCount = hiraganaParts.length;
                const pitch = moraCount === 1
                    ? (topIndex === -1 ? 0 : 1)
                    : (topIndex === -1 ? 0 : topIndex + 1);
                rows.push({ word, hiragana: hiraganaParts.join(""), pitch, isPrimary: variantIndex === 0 });
            }
            variantIndex++;
        }
    }
    return rows;
}

function chunk(array, size) {
    const chunks = [];
    for (let index = 0; index < array.length; index += size) chunks.push(array.slice(index, index + size));
    return chunks;
}

async function main() {
    const categories = window.kanjiCategories.filter(category => !category.key.startsWith("reading-stories-"));
    const entries = [];
    categories.forEach(category => {
        category.items.forEach(item => {
            if (!item.kanji || !item.romaji) return;
            entries.push({
                kanji: item.kanji,
                romaji: item.romaji,
                hiragana: item.hiragana || toHiraganaFromRomaji(item.romaji)
            });
        });
    });

    const uniqueWords = [...new Set(entries.map(entry => entry.kanji))];
    const rowsByWord = new Map();

    for (const batch of chunk(uniqueWords, BATCH_SIZE)) {
        const html = await fetchOjadHtml(batch);
        for (const row of parseRows(html)) {
            if (!rowsByWord.has(row.word)) rowsByWord.set(row.word, []);
            rowsByWord.get(row.word).push(row);
        }
        await sleep(REQUEST_DELAY_MS);
    }

    function resolve(entry) {
        const candidates = rowsByWord.get(entry.kanji) || [];
        const exactMatches = candidates.filter(row => row.hiragana === entry.hiragana);
        if (exactMatches.length === 0) return null;
        const primary = exactMatches.find(row => row.isPrimary) || exactMatches[0];
        const alt = exactMatches.find(row => row.pitch !== primary.pitch);
        return { pitch: primary.pitch, alt: alt ? alt.pitch : null };
    }

    // The kanji spelling can resolve to a different headword than our stored
    // reading (see tools/fetch-ojad-pitch.js); retry those via the hiragana.
    const unresolved = entries.filter(entry => !resolve(entry) && entry.kanji !== entry.hiragana);
    const fallbackRows = [];
    for (const batch of chunk([...new Set(unresolved.map(entry => entry.hiragana))], BATCH_SIZE)) {
        const html = await fetchOjadHtml(batch);
        fallbackRows.push(...parseRows(html));
        await sleep(REQUEST_DELAY_MS);
    }
    function resolveWithFallback(entry) {
        const direct = resolve(entry);
        if (direct) return direct;
        const fallbackCandidates = fallbackRows.filter(row => row.hiragana === entry.hiragana);
        if (fallbackCandidates.length === 0) return null;
        const primary = fallbackCandidates.find(row => row.isPrimary) || fallbackCandidates[0];
        const alt = fallbackCandidates.find(row => row.pitch !== primary.pitch);
        return { pitch: primary.pitch, alt: alt ? alt.pitch : null, viaHiragana: true };
    }

    const lines = ["kanji\tromaji\thiragana\tojad_pitch\tojad_pitch_alt\tstatus"];
    let found = 0;
    let notFound = 0;
    let readingMismatch = 0;
    for (const entry of entries) {
        const result = resolveWithFallback(entry);
        let status;
        let pitch = "-";
        let pitchAlt = "-";
        if (!result) {
            status = (rowsByWord.get(entry.kanji) || []).length > 0 ? "reading-mismatch" : "not-found";
            if (status === "reading-mismatch") readingMismatch++; else notFound++;
        } else {
            pitch = result.pitch;
            if (result.alt !== null) pitchAlt = result.alt;
            status = result.viaHiragana ? "found-via-hiragana" : "found";
            found++;
        }
        lines.push(`${entry.kanji}\t${entry.romaji}\t${entry.hiragana}\t${pitch}\t${pitchAlt}\t${status}`);
    }

    const outputPath = path.join(__dirname, "..", "ojad-kanji-report.tsv");
    fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");
    console.log(`Wrote ${entries.length} rows to ${outputPath}`);
    console.log(`${found} found, ${readingMismatch} reading-mismatch, ${notFound} not-found.`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
