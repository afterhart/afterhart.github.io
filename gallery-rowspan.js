// gallery-rowspan.js
// Minimal, safe: sets grid-row-end span based on item rendered height.
// Does NOT change grid-column, does NOT remove anything (lightbox stays intact).

(function () {
  'use strict';

  function parsePx(v) {
    if (!v) return 0;
    v = v.trim();
    if (v.endsWith('px')) return parseFloat(v);
    if (v.endsWith('vw')) return (parseFloat(v) / 100) * window.innerWidth;
    if (v.endsWith('vh')) return (parseFloat(v) / 100) * window.innerHeight;
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  function waitForImages(items, timeout = 1000) {
    const imgs = [];
    items.forEach(it => {
      it.querySelectorAll && imgs.push(...Array.from(it.querySelectorAll('img')));
    });
    if (!imgs.length) return Promise.resolve();
    const ps = imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(res => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
      });
    });
    return Promise.race([Promise.all(ps), new Promise(res => setTimeout(res, timeout))]);
  }

  function recompute() {
    try {
      const grid = document.querySelector('.gallery-grid');
      if (!grid) return;
      const items = Array.from(grid.querySelectorAll('.gallery-item'));
      if (!items.length) return;

      const cs = getComputedStyle(grid);
      const rowVal = cs.getPropertyValue('grid-auto-rows') || getComputedStyle(document.documentElement).getPropertyValue('--gallery-row') || '8vw';
      const gapVal = cs.getPropertyValue('gap') || getComputedStyle(document.documentElement).getPropertyValue('--gallery-gap') || '6px';
      const rowH = parsePx(rowVal);
      const gap = parsePx(gapVal);
      if (rowH <= 0) return;

      // Clear previous spans so we measure natural heights
      items.forEach(it => { it.style.gridRowEnd = ''; it.style.alignSelf = 'start'; });

      waitForImages(items, 1000).then(() => {
        items.forEach(it => {
          const rect = it.getBoundingClientRect();
          let h = rect.height;
          if (h < 2) {
            const img = it.querySelector('img');
            if (img && img.naturalWidth && img.naturalHeight) {
              const w = it.clientWidth || img.clientWidth || img.naturalWidth;
              h = (img.naturalHeight / img.naturalWidth) * w;
            } else {
              h = rowH;
            }
          }
          // use Math.ceil to avoid gaps — safe since we don't set grid-row-start
          const span = Math.max(1, Math.ceil((h + gap) / (rowH + gap)));
          it.style.gridRowEnd = 'span ' + span;
        });
      });
    } catch (e) {
      console.error('gallery-rowspan error', e);
    }
  }

  if (document.readyState === 'complete') recompute();
  else {
    window.addEventListener('load', recompute, { once: true });
    window.addEventListener('DOMContentLoaded', () => setTimeout(recompute, 80), { once: true });
  }

  let timer;
  window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(recompute, 220); });
  window.__galleryRecompute = recompute;
})();
