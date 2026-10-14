// Supplements fetch-ojad-pitch-kanji.js for kanji-data.js entries OJAD's
// dictionary doesn't have, using the Suzuki-kun prosody estimator. See
// tools/fetch-ojad-phrasing-pitch.js for the approach/caveats (ML estimates,
// can misread isolated words — only trusted when the reading matches).
//
// Usage: node tools/fetch-ojad-phrasing-pitch-kanji.js
// (requires ojad-kanji-report.tsv from fetch-ojad-pitch-kanji.js to exist)
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
    const dictionaryReportPath = path.join(__dirname, "..", "ojad-kanji-report.tsv");
    if (!fs.existsSync(dictionaryReportPath)) {
        console.error("Run tools/fetch-ojad-pitch-kanji.js first.");
        process.exitCode = 1;
        return;
    }
    const dictionaryStatus = new Map();
    fs.readFileSync(dictionaryReportPath, "utf8").split("\n").slice(1).forEach(line => {
        const [kanji, romaji, hiragana, , , status] = line.split("\t");
        if (kanji) dictionaryStatus.set(`${kanji}\u0000${romaji}`, status);
    });

    const categories = window.kanjiCategories.filter(category => !category.key.startsWith("reading-stories-"));
    const entries = [];
    const seen = new Set();
    categories.forEach(category => {
        category.items.forEach(item => {
            if (!item.kanji || !item.romaji) return;
            const key = `${item.kanji}\u0000${item.romaji}`;
            if (seen.has(key)) return;
            seen.add(key);
            const status = dictionaryStatus.get(key);
            if (status === "not-found" || status === "reading-mismatch") {
                entries.push({ kanji: item.kanji, romaji: item.romaji, hiragana: item.hiragana || toHiraganaFromRomaji(item.romaji) });
            }
        });
    });

    const resultsByWord = new Map();
    for (const batch of chunk(entries.map(entry => entry.kanji), BATCH_SIZE)) {
        const html = await fetchPhrasingHtml(batch);
        for (const phrase of parsePhrases(html)) {
            if (!resultsByWord.has(phrase.sourceWord)) resultsByWord.set(phrase.sourceWord, []);
            resultsByWord.get(phrase.sourceWord).push(phrase);
        }
        await sleep(REQUEST_DELAY_MS);
    }

    const lines = ["kanji\tromaji\thiragana\testymowany_pitch\tstatus"];
    let usable = 0;
    for (const entry of entries) {
        const candidates = resultsByWord.get(entry.kanji) || [];
        const match = candidates.find(c => c.hiragana === entry.hiragana);
        let status;
        let estimated = "-";
        if (!match) {
            status = candidates.length > 0 ? "reading-guessed-wrong" : "no-estimate";
        } else {
            estimated = match.pitch;
            status = "estimated";
            usable++;
        }
        lines.push(`${entry.kanji}\t${entry.romaji}\t${entry.hiragana}\t${estimated}\t${status}`);
    }

    const outputPath = path.join(__dirname, "..", "ojad-kanji-phrasing-report.tsv");
    fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");
    console.log(`Wrote ${entries.length} rows to ${outputPath} (${usable} with a reading-confirmed estimate).`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
