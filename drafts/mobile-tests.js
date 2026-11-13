// Five objective checks for the shelf page, run inside the page:
//   const { runTests } = await import('/drafts/mobile-tests.js'); await runTests();
// They use the page's own globals (OBJECTS, drawObject, updateShowcase, sectionProgress, narrow, kick).
export async function runTests() {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const R = el => el.getBoundingClientRect();
  const scene = R(document.querySelector('.scene'));
  const res = { viewport: `${innerWidth}x${innerHeight}` };

  // T1: nothing makes the page scroll sideways
  res.T1_noOverflow = { pass: document.documentElement.scrollWidth <= innerWidth, detail: `${document.documentElement.scrollWidth} <= ${innerWidth}` };

  const restMarkup = {};
  for (const o of OBJECTS) { drawObject(o, 0, 0, true); restMarkup[o.id] = o.g.innerHTML; }

  // T2: a pulled-out object is big enough to see (smallest side >= 90px)
  // T3: and it stays completely inside the shelf panel
  const sizes = [], contained = [];
  for (const o of OBJECTS) {
    for (const p of OBJECTS) { p.anim = p === o ? 1 : 0; drawObject(p, p.anim, 0.7, true); }
    updateShowcase();
    const b = R(o.g);
    sizes.push(`${o.id} ${b.width | 0}x${b.height | 0}`);
    contained.push({ id: o.id, inside: b.left >= scene.left - 1 && b.right <= scene.right + 1 && b.top >= scene.top - 1 && b.bottom <= scene.bottom + 1, box: [b.left | 0, b.top | 0, b.right | 0, b.bottom | 0] });
    o._min = Math.min(b.width, b.height);
  }
  res.T2_bigEnough = { pass: OBJECTS.every(o => o._min >= 90), detail: sizes.join(', ') + ` (panel ${scene.width | 0}x${scene.height | 0})` };
  res.T3_inPanel = { pass: contained.every(c => c.inside), detail: contained.filter(c => !c.inside).map(c => c.id + ' ' + c.box).join('; ') || 'all inside panel' };

  // T5: after coming out and going back, every object is in exactly its original resting state;
  //     and every tap target is at least 44px
  const notBack = [];
  for (const o of OBJECTS) { drawObject(o, 1, 3.3, true); drawObject(o, 0.4, 4.2, true); drawObject(o, 0, 5.1, true); if (o.g.innerHTML !== restMarkup[o.id]) notBack.push(o.id); }
  const hits = [...document.querySelectorAll('.hit')].map(h => { const b = R(h); return Math.min(b.width, b.height); });
  res.T5_restAndTargets = { pass: !notBack.length && hits.every(v => v >= 44), detail: `not back at rest: [${notBack}]; smallest tap target ${Math.min(...hits) | 0}px` };
  OBJECTS.forEach(o => { o.anim = 0; o.hoverTarget = 0; o.scrollOn = false; o.t = -1; });

  // T4: when you go to a project (the way tapping its object does), its object is the active one
  //     and its heading is readable (not hidden under the shelf panel)
  const heads = [];
  for (const o of OBJECTS) {
    o.sectionEl.scrollIntoView({ block: narrow.matches ? 'start' : 'center' }); await wait(150);
    const st = sectionProgress(o.sectionEl), h = R(o.sectionEl.querySelector('h2'));
    const covered = narrow.matches ? R(document.querySelector('.scene')).bottom : 0;
    heads.push({ id: o.id, progress: +st.toFixed(2), ok: st >= 0.6 && h.top >= covered - 1 && h.bottom <= innerHeight });
  }
  res.T4_headingVisibleWhenActive = { pass: heads.every(x => x.ok), detail: heads.map(x => `${x.id}:${x.ok ? 'ok' : 'FAIL'}(${x.progress})`).join(' ') };

  scrollTo(0, 0); kick();
  res.allPass = ['T1_noOverflow', 'T2_bigEnough', 'T3_inPanel', 'T4_headingVisibleWhenActive', 'T5_restAndTargets'].every(k => res[k].pass);
  return res;
}
