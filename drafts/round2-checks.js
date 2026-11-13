// Acceptance checks for the round-2 review items (run inside the page, like mobile-tests.js):
//   const { runRound2 } = await import('/drafts/round2-checks.js'); await runRound2();
export async function runRound2() {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const R = el => el.getBoundingClientRect();
  const out = { viewport: `${innerWidth}x${innerHeight}` };
  scrollTo(0, 0); await wait(100);
  const phone = narrow.matches;

  if (phone) {
    // 1: intro sits right under the shelf; first project peeks above the fold
    const h1 = R(document.querySelector('#about h1')), links = R(document.querySelector('#about .links'));
    const peek = R(document.querySelector('#financial-calculator .eyebrow'));
    const panel = R(document.querySelector('.scene')).bottom;
    // measured from the shelf panel so it holds on every phone size (the reviewer's 400/620px assumed 375x812)
    out.R1_introUp = { pass: h1.top <= panel + 48 && links.bottom <= innerHeight && peek.bottom <= innerHeight, detail: `h1 top ${h1.top | 0} (<=${(panel + 48) | 0}), links bottom ${links.bottom | 0}, next eyebrow bottom ${peek.bottom | 0} (<=${innerHeight})` };
    // 2: after going to a project (as tapping its object does), its first link is on screen
    const r2 = [];
    for (const o of OBJECTS) {
      o.sectionEl.scrollIntoView({ block: 'start' }); await wait(150);
      const a = R(o.sectionEl.querySelector('.links a'));
      r2.push({ id: o.id, ok: a.bottom <= innerHeight - 16 && a.top >= R(document.querySelector('.scene')).bottom, bottom: a.bottom | 0 });
    }
    out.R2_linkVisibleAfterTap = { pass: r2.every(x => x.ok), detail: r2.map(x => `${x.id}:${x.ok ? 'ok' : 'FAIL'}(${x.bottom})`).join(' ') };
    // 3: panel height uses svh (equals 44% of the visible height here)
    const sh = R(document.querySelector('.scene')).height;
    out.R3_svhPanel = { pass: Math.abs(sh - innerHeight * 0.44) <= 2, detail: `${sh.toFixed(1)} vs ${(innerHeight * 0.44).toFixed(1)}` };
  }
  // 4: every text link is at least 44px tall
  const small = [...document.querySelectorAll('.links a')].filter(a => R(a).height < 44);
  out.R4_linkTargets = { pass: !small.length, detail: small.length ? `${small.length} links under 44px` : 'all links >= 44px' };
  // 6: first Tab stop is the résumé link (text comes before the shelf in page order)
  const focusables = [...document.querySelectorAll('a[href], [tabindex="0"]')];
  out.R6_firstTab = { pass: /R.sum/.test(focusables[0]?.textContent || ''), detail: `first focusable: "${(focusables[0]?.textContent || focusables[0]?.getAttribute('aria-label') || '').trim()}"` };
  // 7: hovering a shelf shows that project's name in the shelf panel
  const o = OBJECTS[1];
  o.hitEl.dispatchEvent(new PointerEvent('pointerenter')); await wait(80); updateCounter();
  const shown = document.querySelector('.counter');
  out.R7_hoverLabel = { pass: shown.classList.contains('on') && shown.textContent.includes(o.label), detail: `counter: "${shown.textContent}"` };
  o.hitEl.dispatchEvent(new PointerEvent('pointerleave'));

  scrollTo(0, 0); kick();
  out.allPass = Object.values(out).filter(v => typeof v === 'object').every(v => v.pass);
  return out;
}
