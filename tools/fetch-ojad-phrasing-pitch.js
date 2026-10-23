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

// (Loaded only when run directly — see the same note in fetch-ojad-pitch.js.)
global.window = {};
if (require.main === module) require(path.join(__dirname, "..", "reading-vocabulary-data.js"));

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
//
// Mora classes: underlined spans (e.g. "accent_top unvoiced", "accent_plain")
// are high-pitched, and there is at least one accent_top per accent phrase, so
// a word with two accent_top spans has two kernels (しかとんどの → 2 + 4). For
// the pitch number we take the LAST kernel, i.e. the pitch of the whole word
// as one unit; getPitchKernels() exposes all of them for callers that want to
// decide themselves.
function parsePhraseMorae(textHtml) {
    const moraRe = /<span class="([^"]*mola_\d+)"><span class="inner">((?:<span class="char">[^<]*<\/span>)+)<\/span><\/span>/g;
    const hiraganaParts = [];
    const kernels = [];
    let moraMatch;
    let moraIndex = 0;
    while ((moraMatch = moraRe.exec(textHtml)) !== null) {
        const classes = moraMatch[1].split(/\s+/);
        const charText = [...moraMatch[2].matchAll(/class="char">([^<]*)</g)].map(c => c[1]).join("");
        hiraganaParts.push(charText);
        if (classes.includes("accent_top")) kernels.push(moraIndex + 1);
        moraIndex++;
    }
    return { hiragana: hiraganaParts.join(""), kernels };
}

function getPitchKernels(kernels) {
    return kernels.length === 0 ? [0] : kernels;
}

// Suzuki-kun renders loanwords in mixed katakana (せばすてぃあん → せバスティアン);
// the reading is returned as hiragana so it can be compared with ours.
function foldToHiragana(value) {
    return Array.from(value, character => {
        const codePoint = character.codePointAt(0);
        return codePoint >= 0x30a1 && codePoint <= 0x30f6
            ? String.fromCodePoint(codePoint - 0x60)
            : character;
    }).join("");
}

function pitchFromKernels(kernels) {
    const all = getPitchKernels(kernels);
    return all[all.length - 1];
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

        const { hiragana, kernels } = parsePhraseMorae(textMatch[1]);
        if (!hiragana) continue;

        phrases.push({
            sourceWord: subscriptMatch[1],
            hiragana: foldToHiragana(hiragana),
            pitch: pitchFromKernels(kernels),
            pitchKernels: getPitchKernels(kernels)
        });
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
        // Columns: kanji, hiragana, nasz_pitch, ojad_pitch, ojad_pitch_alt, status
        // (status is always the LAST column — don't hardcode its index, the
        // dictionary report gained the ojad_pitch_alt column after this parser
        // was written, which silently broke it until this fix).
        const columns = line.split("\t");
        const [kanji, hiragana] = columns;
        const status = columns[columns.length - 1];
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

    // Suzuki-kun silently drops input with no morae (e.g. a loanword that is
    // all katakana, or a kanji word it can't read), which would also shift the
    // ü、-joined batch and misalign the remaining words. Retry each missing word
    // on its own, still only trusting the answer when its reading matches.
    for (const entry of targets) {
        if (resultsByWord.has(entry.kanji)) continue;
        for (const query of new Set([entry.kanji, entry.hiragana])) {
            if (resultsByWord.has(entry.kanji)) break;
            if (!query) continue;
            const html = await fetchPhrasingHtml([query]);
            const answer = parsePhrases(html).find(phrase => phrase.hiragana === entry.hiragana);
            if (answer) resultsByWord.set(entry.kanji, [answer]);
            await sleep(REQUEST_DELAY_MS);
        }
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

// Reused by tools/fetch-ojad-pitch-names.js for the names in the reading
// stories, which aren't part of reading-vocabulary-data.js.
module.exports = { fetchPhrasingHtml, parsePhrases, chunk, BATCH_SIZE, REQUEST_DELAY_MS };

if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
