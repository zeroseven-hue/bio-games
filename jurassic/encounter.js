/* Read-only presentation adapter: existing game classes remain the source of truth. */
(() => {
  'use strict';
  const frame = document.getElementById('boardFrame');
  const scene = frame?.closest('.board-container');
  if (!frame || !scene) return;
  const encounter = document.createElement('div');
  encounter.className = 'expedition-encounter';
  encounter.setAttribute('aria-hidden', 'true');
  const art = document.createElement('img');
  art.src = 'assets/tyrannosaur-v1.webp';
  art.alt = '';
  art.decoding = 'async';
  art.addEventListener('error', () => { encounter.hidden = true; });
  const caption = document.createElement('span');
  encounter.append(art, caption);
  scene.appendChild(encounter);
  const sync = () => {
    const attacking = !!frame.querySelector('.dino-bite');
    const sleeping = !attacking && !!frame.querySelector('.dino-sleep');
    encounter.classList.toggle('is-attacking', attacking);
    encounter.classList.toggle('is-sleeping', sleeping);
    caption.textContent = attacking ? '暴龍反擊！' : sleeping ? '危機解除 · 暴龍沉睡' : '';
  };
  const observer = new MutationObserver(records => {
    if (records.some(record => record.type === 'childList' ||
        (record.target instanceof Element && record.target.classList.contains('dino-container')))) sync();
  });
  observer.observe(frame, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  sync();
})();
