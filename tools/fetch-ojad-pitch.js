// Fetches pitch-accent data from OJAD (https://www.gavo.t.u-tokyo.ac.jp/ojad/)
// for every word in reading-vocabulary-data.js and reports how it compares to
// our stored `pitch` field. Read-only: it never edits the data file itself.
//
// Usage: node tools/fetch-ojad-pitch.js
//
// OJAD's search page is server-rendered, so a plain fetch of
// /ojad/search/index/word:<comma-separated-words> returns full HTML with one
// <tr id="word_NNN"> per result. Within the dictionary-form column, each mora
// is wrapped as e.g.:
//   <span class="mola_-2">...<span class="char">く</span></span>                (low)
//   <span class=" accent_plain mola_-1">...<span class="char">に</span></span>  (high, not the kernel)
//   <span class=" accent_top mola_-1">...<span class="char">ま</span></span>    (high, IS the kernel)
// "accent_top" marks the mora after which pitch drops (our accent-kernel
// number, 1-based). No "accent_top" anywhere in the word means heiban (0).
"use strict";

const fs = require("fs");
const path = require("path");

global.window = {};
require(path.join(__dirname, "..", "reading-vocabulary-data.js"));

const BATCH_SIZE = 10;
const REQUEST_DELAY_MS = 500;
const USER_AGENT = "Mozilla/5.0 (compatible; lang_learning-pitch-check/1.0)";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchOjadHtml(words) {
    // limit:100 avoids OJAD's default 20-row page silently dropping words when
    // a query matches many rows (e.g. a single kanji also matches dozens of
    // compound words containing it).
    const url = `https://www.gavo.t.u-tokyo.ac.jp/ojad/search/index/limit:100/word:${encodeURIComponent(words.join(","))}`;
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) throw new Error(`OJAD request failed (${response.status}) for ${url}`);
    return response.text();
}

// Parses every <tr id="word_NNN"> row into one or more { word, hiragana,
// pitch, isPrimary } entries (dictionary-form "辞書形" column only). A word
// can have several accepted accent patterns, each in its own
// <div class="katsuyo_proc"> block inside that column; per OJAD's own docs
// ("複数の型が表示される場合，一番上のアクセントが規範型です"), the first
// block is the prescriptive/standard one.
function parseRows(html) {
    const rows = [];
    const rowRe = /<tr id="word_\d+">([\s\S]*?)<\/tr>/g;
    let rowMatch;
    while ((rowMatch = rowRe.exec(html)) !== null) {
        const rowHtml = rowMatch[1];
        const wordMatch = /class="midashi_word">([^<]+)</.exec(rowHtml);
        const jishoMatch = /class="katsuyo katsuyo_jisho_js">([\s\S]*?)<\/td>/.exec(rowHtml);
        if (!wordMatch || !jishoMatch) continue;

        // OJAD sometimes shows a combined headword like "言う・言います" or
        // "平和[な]・平和です"; the word we searched for is always the prefix.
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
    const entries = window.readingVocabulary.map((item, index) => ({ index, ...item }));
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

    const unresolved = entries.filter(entry => !resolve(entry) && entry.kanji !== entry.hiragana);
    // The kanji spelling can resolve to a different headword than our stored
    // reading (e.g. 祖父's normal reading is そふ, but we use it for おじいさん
    // — a different word with its own pitch). Retry those by searching OJAD
    // for the hiragana reading itself instead of the kanji spelling. OJAD can
    // answer a kana query with a kanji headword (おばあさん -> "お婆さん"), so
    // these results are kept in a flat list and matched by reading, not word.
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

    const lines = ["kanji\thiragana\tnasz_pitch\tojad_pitch\tojad_pitch_alt\tstatus"];
    let mismatches = 0;
    let notFound = 0;
    for (const entry of entries) {
        const found = resolveWithFallback(entry);
        const ours = Number.isInteger(entry.pitch) ? entry.pitch : "-";

        let ojad = "-";
        let ojadAlt = "-";
        let status;
        if (!found) {
            status = (rowsByWord.get(entry.kanji) || []).length > 0 ? "reading-mismatch" : "not-found";
            notFound++;
        } else {
            ojad = found.pitch;
            if (found.alt !== null) ojadAlt = found.alt;
            status = ojad === entry.pitch ? "match" : "MISMATCH";
            if (found.viaHiragana) status += "-via-hiragana";
            if (ojad !== entry.pitch) mismatches++;
        }
        lines.push(`${entry.kanji}\t${entry.hiragana}\t${ours}\t${ojad}\t${ojadAlt}\t${status}`);
    }

    const outputPath = path.join(__dirname, "..", "ojad-report.tsv");
    fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");
    console.log(`Wrote ${entries.length} rows to ${outputPath}`);
    console.log(`${mismatches} mismatch(es), ${notFound} not found, out of ${entries.length} entries.`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});

