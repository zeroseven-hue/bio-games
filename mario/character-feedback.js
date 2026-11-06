/* Presentation only: observe the result classes already set by game.js. */
(() => {
  const character = document.getElementById('marioChar');
  const options = document.getElementById('quizOptions');
  const scene = document.getElementById('stageScene');
  if (!character || !options || !scene) return;
  const reaction = character.querySelector('.explorer-reaction');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#f5ce6b', '#89bda3', '#e99d8d', '#aabde0'];
  const burst = () => {
    if (reducedMotion.matches) return;
    const group = document.createElement('span');
    group.className = 'cute-burst'; group.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 7; i++) {
      const spark = document.createElement('i'); spark.className = 'cute-spark';
      const angle = Math.PI + i * Math.PI / 6;
      spark.style.setProperty('--dx', Math.cos(angle) * 43 + 'px');
      spark.style.setProperty('--dy', Math.sin(angle) * 40 - 8 + 'px');
      spark.style.setProperty('--spark-color', colors[i % colors.length]); group.appendChild(spark);
    }
    character.appendChild(group); setTimeout(() => group.remove(), 750);
  };
  const syncFeedback = () => {
    const state = options.querySelector('.incorrect') ? 'incorrect'
      : options.querySelector('.correct') ? 'correct' : '';
    if (state) {
      if (state === 'correct' && character.dataset.feedback !== state) burst();
      character.dataset.feedback = state;
      if (reaction) reaction.textContent = state === 'correct' ? '太棒了！' : '再試試！';
    } else {
      delete character.dataset.feedback;
      if (reaction) reaction.textContent = '';
    }
  };
  new MutationObserver(syncFeedback).observe(options, {
    subtree: true, childList: true, attributes: true, attributeFilter: ['class']
  });
  // Swap only existing decorative emoji, keeping their surrounding DOM and hooks.
  const icons = new Map([['🪙', 'coin.svg'], ['🍄', 'mushroom.svg'], ['🏰', 'goal.svg']]);
  const decorate = node => {
    if (!(node instanceof Element)) return;
    const candidates = node.matches('.q-block, .pop-item-anim')
      ? [node] : [...node.querySelectorAll('.q-block, .pop-item-anim')];
    for (const item of candidates) {
      const filename = icons.get(item.textContent.trim());
      if (!filename || item.querySelector('img')) continue;
      const img = document.createElement('img');
      img.className = 'quest-item';
      img.src = `assets/${filename}`;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      item.replaceChildren(img);
    }
  };
  const celebrate = modal => {
    const box = modal.querySelector('.modal-box');
    if (!box || reducedMotion.matches || modal.classList.contains('hidden')) return;
    box.querySelector('.cute-confetti')?.remove();
    const layer = document.createElement('span'); layer.className = 'cute-confetti';
    layer.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 18; i++) {
      const piece = document.createElement('i');
      piece.style.setProperty('--x', (4 + i * 5.2) + '%');
      piece.style.setProperty('--delay', (i % 4 * .07) + 's');
      piece.style.setProperty('--spark-color', colors[i % colors.length]); layer.appendChild(piece);
    }
    box.appendChild(layer); setTimeout(() => layer.remove(), 1900);
  };
  for (const id of ['stageClearModal', 'certModal']) {
    const modal = document.getElementById(id);
    if (modal) new MutationObserver(() => celebrate(modal)).observe(modal, {attributes: true, attributeFilter: ['class']});
  }
  decorate(scene);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) decorate(node);
  }).observe(scene, {childList: true, subtree: true});
})();
