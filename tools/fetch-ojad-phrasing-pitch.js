// Supplements fetch-ojad-pitch.js for words OJAD's curated word dictionary
// doesn't have, using the "Suzuki-kun" prosody tutor instead
// (https://www.gavo.t.u-tokyo.ac.jp/ojad/phrasing/index). That tool runs
// morphological analysis + ML accent-kernel estimation on arbitrary text, so
// it covers words missing from the ~9,000-word dictionary, but — unlike the
// dictionary — it can also mis-read an isolated word out of context (e.g. it
// once read "言う" as "ゆう" instead of "いう"). We only trust a result when
// its estimated reading matches our stored hiragana exactly.
//
// Usage: node tools/fetch-ojad-phrasing-pitch.js
"use strict";

const fs = require("fs");
const path = require("path");

global.window = {};
require(path.join(__dirname, "..", "reading-vocabulary-data.js"));

const BATCH_SIZE = 20;
const REQUEST_DELAY_MS = 800;
const USER_AGENT = "Mozilla/5.0 (compatible; lang_learning-pitch-check/1.0)";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPhrasingHtml(words) {
    const body = new URLSearchParams({
        "_method": "POST",
        "data[Phrasing][text]": words.join("、"),
        "data[Phrasing][curve]": "advanced",
        "data[Phrasing][accent]": "advanced",
        "data[Phrasing][accent_mark]": "all",
        "data[Phrasing][estimation]": "crf",
        "data[Phrasing][analyze]": "true",
        "data[Phrasing][phrase_component]": "invisible",
        "data[Phrasing][param]": "invisible",
        "data[Phrasing][subscript]": "visible",
        "data[Phrasing][jeita]": "invisible"
    });
    const response = await fetch("https://www.gavo.t.u-tokyo.ac.jp/ojad/phrasing/index", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
        body: body.toString()
    });
    if (!response.ok) throw new Error(`Phrasing request failed (${response.status})`);
    return response.text();
}

// Parses every "phrasing_phrase_wrapper" block into { sourceWord, hiragana, pitch }.
// sourceWord comes from "phrasing_subscript" (the original input word, before
// reading/accent estimation), so it reliably maps back to our data even when
// the estimated reading is wrong.
function parsePhrases(html) {
    const phrases = [];
    const blockRe = /<div class="phrasing_phrase_wrapper">([\s\S]*?)<\/div>\s*<\/div>/g;
    let blockMatch;
    while ((blockMatch = blockRe.exec(html)) !== null) {
        const block = blockMatch[1];
        const textMatch = /<div class="phrasing_text">([\s\S]*?)<\/div>/.exec(block);
        const subscriptMatch = /<div class="phrasing_subscript">\s*<span>([^<]+)</.exec(block);
        if (!textMatch || !subscriptMatch) continue;

        const moraRe = /<span class="\s?(accent_top|accent_plain)?\s?mola_\d+"><span class="inner">((?:<span class="char">[^<]*<\/span>)+)<\/span>/g;
        const hiraganaParts = [];
        let topIndex = -1;
        let moraMatch;
        let moraIndex = 0;
        while ((moraMatch = moraRe.exec(textMatch[1])) !== null) {
            const charText = [...moraMatch[2].matchAll(/class="char">([^<]*)</g)].map(c => c[1]).join("");
            hiraganaParts.push(charText);
            if (moraMatch[1] === "accent_top") topIndex = moraIndex;
            moraIndex++;
        }
        if (hiraganaParts.length === 0) continue;

        const moraCount = hiraganaParts.length;
        const pitch = moraCount === 1
            ? (topIndex === -1 ? 0 : 1)
            : (topIndex === -1 ? 0 : topIndex + 1);

        phrases.push({ sourceWord: subscriptMatch[1], hiragana: hiraganaParts.join(""), pitch });
    }
    return phrases;
}

function chunk(array, size) {
    const chunks = [];
    for (let index = 0; index < array.length; index += size) chunks.push(array.slice(index, index + size));
    return chunks;
}

async function main() {
    const dictionaryReportPath = path.join(__dirname, "..", "ojad-report.tsv");
    if (!fs.existsSync(dictionaryReportPath)) {
        console.error("Run tools/fetch-ojad-pitch.js first to produce ojad-report.tsv.");
        process.exitCode = 1;
        return;
    }
    const dictionaryStatus = new Map();
    fs.readFileSync(dictionaryReportPath, "utf8").split("\n").slice(1).forEach(line => {
        const [kanji, hiragana, , , status] = line.split("\t");
        if (kanji) dictionaryStatus.set(`${kanji}\u0000${hiragana}`, status);
    });

    const entries = window.readingVocabulary.map((item, index) => ({ index, ...item }));
    const targets = entries.filter(entry => {
        const status = dictionaryStatus.get(`${entry.kanji}\u0000${entry.hiragana}`);
        return status === "not-found" || status === "reading-mismatch" || status === undefined;
    });

    const resultsByWord = new Map();
    for (const batch of chunk(targets.map(entry => entry.kanji), BATCH_SIZE)) {
        const html = await fetchPhrasingHtml(batch);
        for (const phrase of parsePhrases(html)) {
            if (!resultsByWord.has(phrase.sourceWord)) resultsByWord.set(phrase.sourceWord, []);
            resultsByWord.get(phrase.sourceWord).push(phrase);
        }
        await sleep(REQUEST_DELAY_MS);
    }

    const lines = ["kanji\thiragana\tnasz_pitch\testymowany_pitch\tstatus"];
    let usable = 0;
    for (const entry of targets) {
        const candidates = resultsByWord.get(entry.kanji) || [];
        const match = candidates.find(c => c.hiragana === entry.hiragana);
        const ours = Number.isInteger(entry.pitch) ? entry.pitch : "-";
        let status;
        let estimated = "-";
        if (!match) {
            status = candidates.length > 0 ? "reading-guessed-wrong" : "no-estimate";
        } else {
            estimated = match.pitch;
            status = estimated === entry.pitch ? "match" : "DIFFERENT";
            usable++;
        }
        lines.push(`${entry.kanji}\t${entry.hiragana}\t${ours}\t${estimated}\t${status}`);
    }

    const outputPath = path.join(__dirname, "..", "ojad-phrasing-report.tsv");
    fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");
    console.log(`Wrote ${targets.length} rows to ${outputPath} (${usable} with a reading-confirmed estimate).`);
    console.log("These are ML estimates, not dictionary data — review before trusting.");
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
