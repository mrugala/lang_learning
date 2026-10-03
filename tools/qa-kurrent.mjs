// Smoke test nauki Kurrent: poprawna odpowiedź, błędna odpowiedź,
// przejście na tryb słów. Uruchom przez browser.mjs --script.
export default async function run(page, ui) {
  const out = { steps: [] };

  // Dane wczytujemy po stronie Node - w przeglądarce globalne skrypty
  // nie są widoczne z evaluate().
  global.window = {};
  await import('../kurrent-data.js');
  const letters = global.window.kurrentLetters.flatMap(g => g.items);
  const words = global.window.kurrentDecks.flatMap(d => d.items);

  const lookup = glyph => {
    const letter = letters.find(item => item.char === glyph || item.upper === glyph);
    if (letter) return glyph; // odpowiedzią jest tożsamość litery
    const entry = words.find(item => item.word === glyph);
    return entry ? entry.plural : null;
  };

  // Sprawdzenie wariantów odpowiedzi dla konkretnej glify.
  const tryGlyphs = async (candidates, typedFor) => {
    for (let i = 0; i < 60; i++) {
      await ensureSession();
      const glyph = await page.locator('#char-box').innerText();
      if (!candidates.includes(glyph)) {
        await answerCurrent();
        continue;
      }
      const typed = typedFor(glyph);
      await page.locator('#kurrent-answer').fill(typed);
      await page.locator('#submit').click();
      await page.waitForTimeout(80);
      const feedback = await page.locator('#feedback').innerText();
      if (feedback.startsWith('Źle')) {
        await page.locator('#continue').click();
        await page.waitForTimeout(80);
      }
      return { glyph, typed, feedback };
    }
    return { error: `nie wylosowano ${candidates.join(',')}` };
  };

  // Kolejka się kończy w trakcie długiego testu - wtedy restartujemy naukę.
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

  // --- tryb liter ---
  await page.locator('#start').click();
  await page.waitForTimeout(200);

  const glyph1 = await page.locator('#char-box').innerText();
  const answer1 = await lookup(glyph1);
  out.steps.push({ phase: 'litery', glyph: glyph1, answer: answer1 });

  await page.locator('#kurrent-answer').fill('zlyOdpowiedz');
  await page.locator('#submit').click();
  await page.waitForTimeout(150);
  out.steps.push({
    phase: 'litery-blada',
    feedback: await page.locator('#feedback').innerText(),
    continueVisible: await page.locator('#continue').isVisible()
  });

  await page.locator('#continue').click();
  await page.waitForTimeout(150);

  const glyph2 = await page.locator('#char-box').innerText();
  const answer2 = await lookup(glyph2);
  await page.locator('#kurrent-answer').fill(answer2);
  await page.locator('#submit').click();
  await page.waitForTimeout(150);
  out.steps.push({
    phase: 'litery-poprawnie',
    feedback: await page.locator('#feedback').innerText()
  });

  // --- wielkość liter ma znaczenie ---
  // Losujemy aż trafimy glifę i odpowiadamy odwrotną wielkością literą.
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

  // Poprawna odpowiedź z właściwą wielkością musi przejść.
  out.steps.push({ phase: 'wielkosc-liter-poprawnie', ...(await answerCurrent()) });
  // --- tryb słów ---
  await page.locator('#end-study').click();
  await page.locator('#kurrent-mode').selectOption('words');
  await page.waitForTimeout(150);
  await page.locator('#start').click();
  await page.waitForTimeout(200);
  out.steps.push({ phase: 'slowa', ...(await answerCurrent()), font: await page.evaluate(() => getComputedStyle(document.querySelector('#char-box .prompt-main')).fontFamily) });

  // Podpisy pod literami to tożsamość glify, nie wymowa.
  out.steps.push({
    phase: 'podpisy',
    labels: await page.evaluate(() => Array.from(
      document.querySelectorAll('.letter-name')
    ).map(el => el.textContent))
  });

  // Zamiast losować w dużej kolejce, wybieramy tylko testowane glify -
  // inaczej szansa na trafienie konkretnej litery jest znikoma.
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

  // --- umlauty i eszett ---
  const cases = [
    { phase: 'ae-dla-a', glyphs: ['ä', 'Ä'], typed: g => (g === 'ä' ? 'ae' : 'AE') },
    { phase: 'umlaut-jako-litera', glyphs: ['ä', 'Ä'], typed: g => g },
    { phase: 'oe-dla-o', glyphs: ['ö', 'Ö'], typed: g => (g === 'ö' ? 'oe' : 'OE') },
    { phase: 'ue-dla-u', glyphs: ['ü', 'Ü'], typed: g => (g === 'ü' ? 'ue' : 'UE') },
    { phase: 'ss-dla-sz', glyphs: ['ß'], typed: () => 'ss' },
    { phase: 'sz-dla-sz', glyphs: ['ß'], typed: () => 'sz' },
    { phase: 'wielki-eszett-SS', glyphs: ['ẞ'], typed: () => 'SS' },
    { phase: 'wielki-eszett-nie-sz', glyphs: ['ẞ'], typed: () => 'sz' },
    { phase: 'v-odrzuca-wielkie', glyphs: ['v'], typed: () => 'V' },
    { phase: 'q-id', glyphs: ['q', 'Q'], typed: g => g },
    { phase: 'x-id-nie-ks', glyphs: ['x', 'X'], typed: () => 'ks' }
  ];

  for (const c of cases) {
    out.steps.push({ phase: c.phase, ...(await check(c.glyphs, c.typed)) });
  }

  return out;
}
