/* SVG presentation only. Route geometry and the original vine IDs stay intact. */
(() => {
  'use strict';
  const canvas = document.getElementById('svgCanvas');
  if (!canvas) return;
  const ns = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs = {}) => {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };
  function ensurePaint() {
    if (canvas.querySelector('#expedition-vine-paint')) return;
    const defs = make('defs', { id: 'expedition-vine-paint' });
    const leaf = make('linearGradient', { id: 'expedition-leaf-fill', x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
    [['0%', '#c5d594'], ['40%', '#739b52'], ['100%', '#315b38']].forEach(([offset, color]) => leaf.appendChild(make('stop', { offset, 'stop-color': color })));
    const stem = make('linearGradient', { id: 'expedition-stem-fill', x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
    [['0%', '#35613d'], ['48%', '#89aa57'], ['100%', '#3e7145']].forEach(([offset, color]) => stem.appendChild(make('stop', { offset, 'stop-color': color })));
    defs.append(leaf, stem);
    canvas.prepend(defs);
  }
  function decorate(route) {
    if (route.dataset.expeditionVine) return;
    const length = route.getTotalLength();
    if (!Number.isFinite(length) || length < 1) return;
    const geometry = route.getAttribute('d');
    if (!geometry) return;
    // Keep original leaves in the DOM, but replace their visible treatment locally.
    let sibling = route.nextElementSibling;
    for (let i = 0; i < 2 && sibling; i++) {
      const next = sibling.nextElementSibling;
      if (sibling.tagName.toLowerCase() === 'path' && !sibling.id &&
          ['#aed581', '#7cb342'].includes(sibling.getAttribute('fill'))) {
        sibling.classList.add('expedition-original-leaf');
      }
      sibling = next;
    }
    route.dataset.expeditionVine = 'true';
    const group = make('g', { class: 'expedition-vine', 'aria-hidden': 'true' });
    canvas.insertBefore(group, route);
    group.append(
      make('path', { d: geometry, class: 'vine-outline' }),
      make('path', { d: geometry, class: 'vine-stem' }),
      make('path', { d: geometry, class: 'vine-fibre', pathLength: 100 }),
      route
    );
    route.classList.add('vine-original-route');
    const count = Math.max(3, Math.min(8, Math.round(length / 5)));
    for (let index = 0; index < count; index++) {
      const distance = length * (.12 + .76 * index / Math.max(1, count - 1));
      const p = route.getPointAtLength(distance);
      const before = route.getPointAtLength(Math.max(0, distance - .3));
      const after = route.getPointAtLength(Math.min(length, distance + .3));
      const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
      const side = index % 2 === 0 ? 1 : -1;
      const size = .78 + .18 * Math.sin((index + 1) * 1.7);
      const leaf = make('g', {
        class: 'vine-leaf',
        transform: `translate(${p.x} ${p.y}) rotate(${angle}) scale(${size} ${side * size})`
      });
      leaf.append(
        make('path', { class: 'vine-leaf-blade', d: 'M0 0C.8-1.8 2.5-3.4 4-3.2C3.7-1.1 2.1.5 0 0Z' }),
        make('path', { class: 'vine-leaf-vein', d: 'M.2-.1Q2-1.2 3.65-2.9M1.5-1L1.45-2M2.2-1.6L3.05-1.55' })
      );
      group.appendChild(leaf);
      if (index === 1 || index === count - 2) {
        group.appendChild(make('path', {
          class: 'vine-tendril', transform: `translate(${p.x} ${p.y}) rotate(${angle}) scale(1 ${-side})`,
          d: 'M0 0C1.6-1.1.2-3.1 1.7-3.8C3.6-4.7 4-2.1 2.5-2.2C1.9-2.3 2-2.9 2.4-3'
        }));
      }
      const glint = make('g', { class: 'vine-glint', transform: `translate(${p.x} ${p.y})` });
      glint.style.setProperty('--vine-delay', `${(index / count * .7).toFixed(3)}s`);
      glint.appendChild(make('path', { d: 'M0-1.1.23-.23 1.1 0 .23.23 0 1.1-.23.23-1.1 0-.23-.23Z' }));
      group.appendChild(glint);
    }
    group.appendChild(make('path', { d: geometry, class: 'vine-light-trail', pathLength: 100 }));
    const update = () => group.classList.toggle('is-climbing', route.getAttribute('stroke')?.toLowerCase() === '#76ff03');
    new MutationObserver(update).observe(route, { attributes: true, attributeFilter: ['stroke'] });
    update();
  }
  const refresh = () => {
    const routes = canvas.querySelectorAll('path[id^="vine-"][id$="-fg"]');
    if (!routes.length) return;
    ensurePaint();
    routes.forEach(decorate);
  };
  // The game rebuilds SVG on initialization; decorate each new route just once.
  new MutationObserver(refresh).observe(canvas, { childList: true });
  refresh();
})();
