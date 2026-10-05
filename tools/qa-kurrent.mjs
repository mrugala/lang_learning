// Smoke test nauki Kurrent: podpisy, rozróżnianie wielkości liter,
// warianty umlautów i eszetta oraz transkrypcja wyrazów.
export default async function run(page) {
  const out = { steps: [] };

  global.window = {};
  await import('../german-vocabulary-data.js');
  await import('../kurrent-data.js');
  const letters = global.window.kurrentLetters.flatMap(g => g.items);
  const words = global.window.germanVocabularyCategories.flatMap(c => c.items);
  const deckKeys = global.window.germanVocabularyCategories.map(c => c.key);

  // Czcionka renderuje długie s jako "ſ", a końcowe "ss" jako ß (reguła Das ß),
  // więc normalizujemy oba zapisy, żeby znaleźć wyraz w bazie.
  const norm = value => String(value || '')
    .replace(/\u017F/g, 's')
    .replace(/ß/g, 'ss')
    .trim();

  // Tryb liter: odpowiedzią jest tożsamość litery.
  // Tryb słów: transkrypcja zapisu kurrentowego, więc odpowiedzią jest sam
  // wyraz we współczesnej ortografii, w tej samej liczbie co glifa.
  // Kurrent pokazuje formy zapisane polem "kurrent" (długie ſ), a odpowiedzią
  // jest transkrypcja we współczesnym zapisie.
  const lookup = glyph => {
    const letter = letters.find(item => item.char === glyph || item.upper === glyph);
    if (letter) return glyph;

    const key = norm(glyph);
    const entry = words.find(item => {
      const kDe = item.kurrent && item.kurrent.de;
      const kPl = item.kurrent && item.kurrent.plural;
      return norm(kDe || item.de) === key || norm(kPl || item.plural) === key;
    });
    if (!entry) return null;

    const kPl = entry.kurrent && entry.kurrent.plural;
    return norm(kPl || entry.plural) === key ? entry.plural : entry.de;
  };

  const item_plural = item => item.plural;

  // Kolejka kończy się w trakcie długiego testu - wtedy restartujemy naukę.
  const ensureSession = async () => {
    const glyph = await page.locator('#char-box').innerText();
    if (glyph.includes('Koniec')) {
      await page.locator('#end-study').click();
      await page.locator('#start').click();
      await page.waitForTimeout(150);
    }
  };

  const answerCurrent = async () => {
    await ensureSession();
    const glyph = await page.locator('#char-box').innerText();
    const answer = lookup(glyph);
    await page.locator('#kurrent-answer').fill(String(answer));
    await page.locator('#submit').click();
    await page.waitForTimeout(60);
    return { glyph, answer, feedback: await page.locator('#feedback').innerText() };
  };

  // Wybiera tylko testowane glify - losowanie z dużej kolejki
  // daje znikomą szansę trafienia konkretnej litery.
  const studyOnly = async glyphs => {
    await ensureSession();
    if (!(await page.locator('#selection-panel').isVisible())) {
      await page.locator('#end-study').click();
    }
    await page.locator('#kurrent-mode').selectOption('letters');
    await page.locator('#clear-all').click();
    for (const g of glyphs) {
      await page.locator(`.letter-glyph[data-glyph="${g}"]`).click();
    }
    await page.locator('#start').click();
    await page.waitForTimeout(150);
  };

  const check = async (glyphs, typedFor) => {
    await studyOnly(glyphs);
    for (let i = 0; i < 12; i++) {
      await ensureSession();
      const glyph = await page.locator('#char-box').innerText();
      const typed = typedFor(glyph);
      await page.locator('#kurrent-answer').fill(typed);
      await page.locator('#submit').click();
      await page.waitForTimeout(60);
      const feedback = await page.locator('#feedback').innerText();
      if (feedback.startsWith('Źle')) {
        await page.locator('#continue').click();
        await page.waitForTimeout(60);
      }
      return { glyph, typed, feedback };
    }
    return { error: `nie wylosowano ${glyphs.join(',')}` };
  };

  // --- start ---
  await page.locator('#start').click();
  await page.waitForTimeout(200);
  out.steps.push({ phase: 'start', prompt: await page.locator('#char-box').innerText() });

  // --- błędna odpowiedź ---
  await page.locator('#kurrent-answer').fill('zlyOdpowiedz');
  await page.locator('#submit').click();
  await page.waitForTimeout(150);
  out.steps.push({
    phase: 'bledna-odpowiedz',
    feedback: await page.locator('#feedback').innerText(),
    continueVisible: await page.locator('#continue').isVisible()
  });
  await page.locator('#continue').click();
  await page.waitForTimeout(150);

  out.steps.push({ phase: 'poprawna-odpowiedz', ...(await answerCurrent()) });

  // --- wielkość liter ma znaczenie ---
  let caseTest = null;
  for (let i = 0; i < 40; i++) {
    const glyph = await page.locator('#char-box').innerText();
    const wrongCase = glyph === glyph.toUpperCase() ? glyph.toLowerCase() : glyph.toUpperCase();

    await page.locator('#kurrent-answer').fill(wrongCase);
    await page.locator('#submit').click();
    await page.waitForTimeout(80);

    const feedback = await page.locator('#feedback').innerText();
    if (feedback.startsWith('Źle')) {
      caseTest = { glyph, typed: wrongCase, accepted: false, feedback };
      await page.locator('#continue').click();
      await page.waitForTimeout(80);
      break;
    }
    caseTest = { glyph, typed: wrongCase, accepted: true, feedback };
  }
  out.steps.push({ phase: 'wielkosc-liter', ...caseTest });
  out.steps.push({ phase: 'wielkosc-liter-poprawnie', ...(await answerCurrent()) });

  // --- podpisy to tożsamość glify, nie wymowa ---
  out.steps.push({
    phase: 'podpisy',
    labels: await page.evaluate(() =>
      Array.from(document.querySelectorAll('.letter-name')).map(el => el.textContent))
  });

  // --- umlauty i eszett ---
  const cases = [
    { phase: 'ae-dla-a', glyphs: ['ä', 'Ä'], typed: g => (g === 'ä' ? 'ae' : 'AE') },
    { phase: 'umlaut-jako-litera', glyphs: ['ä', 'Ä'], typed: g => g },
    { phase: 'oe-dla-o', glyphs: ['ö', 'Ö'], typed: g => (g === 'ö' ? 'oe' : 'OE') },
    { phase: 'ue-dla-u', glyphs: ['ü', 'Ü'], typed: g => (g === 'ü' ? 'ue' : 'UE') },
    { phase: 'ss-dla-sz', glyphs: ['ß'], typed: () => 'ss' },
    { phase: 'sz-dla-sz', glyphs: ['ß'], typed: () => 'sz' },
    { phase: 'brak-majuskuły-sz', glyphs: ['ß'], typed: () => 'ẞ' },
    { phase: 'v-odrzuca-wielkie', glyphs: ['v'], typed: () => 'V' },
    { phase: 'q-id', glyphs: ['q', 'Q'], typed: g => g },
    { phase: 'x-id-nie-ks', glyphs: ['x', 'X'], typed: () => 'ks' }
  ];

  for (const c of cases) {
    out.steps.push({ phase: c.phase, ...(await check(c.glyphs, c.typed)) });
  }

  // --- transkrypcja słów ---
  await page.locator('#end-study').click();
  await page.locator('#kurrent-mode').selectOption('words');
  await page.locator('#clear-all-decks').click();
  await page.locator('#kurrent-decks input').first().check();
  await page.locator('#start').click();
  await page.waitForTimeout(150);
  out.steps.push({ phase: 'slowa-transkrypcja', ...(await answerCurrent()) });

  // --- długie s w glifie, zwykłe s w odpowiedzi ---
  // "die Gänſe" (z długim s w Kurrentcie) ma być przepisane "die Gänse".
  await page.locator('#end-study').click();
  await page.locator('#clear-all-decks').click();
  await page.locator('#kurrent-decks input[value="' + deckKeys[0] + '"]').check();
  await page.locator('#start').click();
  await page.waitForTimeout(150);

  let longS = null;
  for (let i = 0; i < 200; i++) {
    await ensureSession();
    const glyph = await page.locator('#char-box').innerText();
    if (glyph.includes('\u017F')) {
      const answer = lookup(glyph);
      const ok = await (async () => {
        await page.locator('#kurrent-answer').fill(answer);
        await page.locator('#submit').click();
        await page.waitForTimeout(70);
        const feedback = await page.locator('#feedback').innerText();
        if (feedback.startsWith('Źle')) {
          await page.locator('#continue').click();
          await page.waitForTimeout(70);
        }
        return !feedback.startsWith('Źle');
      })();
      longS = {
        glifa: glyph,
        wpisane: answer,
        uznaneZaPoprawne: ok,
        uzytoDlugiegoS: answer.includes('\u017F')
      };
      break;
    }
    await answerCurrent();
  }
  out.steps.push({ phase: 'dlugie-s', ...(longS || { error: 'nie wylosowano glify z długim s' }) });

  return out;
}