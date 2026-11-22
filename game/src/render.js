// Emberfall rendering: cards, lanes, hero bars, log and overlays. Cards are
// DOM elements so they stay legible at thumbnail size; colour and shape
// (not text alone) tell the elements apart.
import { LANE_COUNT } from './cards.js';

// Small inline SVG icons, one shape per element: flame, hound, shield,
// acolyte, crow, leaf, sword, wave, golem, phoenix, volley, rain, book.
const ICONS = {
  flame: '<svg viewBox="0 0 32 32"><path d="M16 3 C20 9 26 12 26 20 A10 10 0 0 1 6 20 C6 15 9 12 11 9 C12 12 14 13 14 13 C13 8 14 5 16 3 Z" fill="#ff7b1f" stroke="#7a2d05" stroke-width="1"/></svg>',
  hound: '<svg viewBox="0 0 32 32"><path d="M5 22 L9 10 L14 14 L18 6 L22 14 L27 11 L26 22 Q16 28 5 22 Z" fill="#c0392b" stroke="#5c130c" stroke-width="1"/><circle cx="12" cy="17" r="1.6" fill="#fff"/><circle cx="20" cy="17" r="1.6" fill="#fff"/></svg>',
  shield: '<svg viewBox="0 0 32 32"><path d="M16 3 L27 8 V16 C27 23 22 27 16 29 C10 27 5 23 5 16 V8 Z" fill="#7d8aa5" stroke="#2c3550" stroke-width="1.5"/><path d="M16 7 L23 10 V16 C23 20 20 23 16 24.5 C12 23 9 20 9 16 V10 Z" fill="#d7deea"/></svg>',
  acolyte: '<svg viewBox="0 0 32 32"><circle cx="16" cy="11" r="6" fill="#f7ead0" stroke="#7a4d12" stroke-width="1.5"/><path d="M6 28 Q16 17 26 28 Z" fill="#e67e22" stroke="#7a4d12" stroke-width="1.5"/><path d="M16 3 C18 7 20 8 20 11 A4 4 0 0 1 12 11 C12 8 14 7 16 3 Z" fill="#ff7b1f"/></svg>',
  crow: '<svg viewBox="0 0 32 32"><path d="M4 20 Q12 6 26 8 L20 14 L28 16 L18 19 L22 26 L14 21 Q8 24 4 20 Z" fill="#3d5a80" stroke="#1d2f4d" stroke-width="1"/><circle cx="21" cy="11" r="1.6" fill="#fff"/></svg>',
  leaf: '<svg viewBox="0 0 32 32"><path d="M26 4 C12 6 5 14 6 26 C18 27 26 18 26 4 Z" fill="#5c8a3c" stroke="#2f4d1c" stroke-width="1.5"/><path d="M8 24 Q16 16 24 8" stroke="#2f4d1c" stroke-width="1.5" fill="none"/></svg>',
  sword: '<svg viewBox="0 0 32 32"><path d="M24 4 L28 8 L14 22 L10 18 Z" fill="#d4d4d4" stroke="#555" stroke-width="1"/><path d="M10 18 L6 22 L4 26 L8 28 L12 24 L16 20 Z" fill="#8a6420"/><rect x="7" y="20" width="10" height="3" rx="1" transform="rotate(-45 12 21)" fill="#c98a2e"/></svg>',
  wave: '<svg viewBox="0 0 32 32"><path d="M3 20 Q8 12 13 18 T23 18 T29 16 L29 26 L3 26 Z" fill="#2e86ab" stroke="#123a5c" stroke-width="1"/><path d="M3 14 Q8 8 13 12 T23 12" fill="none" stroke="#7fb8d4" stroke-width="2"/></svg>',
  golem: '<svg viewBox="0 0 32 32"><rect x="9" y="6" width="14" height="12" rx="2" fill="#8a3b12" stroke="#3d1503" stroke-width="1.5"/><rect x="6" y="18" width="20" height="9" rx="2" fill="#a04a1a" stroke="#3d1503" stroke-width="1.5"/><circle cx="13" cy="11" r="1.8" fill="#ffd27d"/><circle cx="19" cy="11" r="1.8" fill="#ffd27d"/></svg>',
  phoenix: '<svg viewBox="0 0 32 32"><path d="M16 4 C20 8 24 9 27 9 C24 12 23 14 23 16 C26 15 28 15 29 15 C26 20 22 24 18 26 L16 29 L14 26 C10 24 6 20 3 15 C4 15 6 15 9 16 C9 14 8 12 5 9 C8 9 12 8 16 4 Z" fill="#e74c3c" stroke="#7a1508" stroke-width="1"/><circle cx="13" cy="14" r="1.5" fill="#fff"/><circle cx="19" cy="14" r="1.5" fill="#fff"/></svg>',
  volley: '<svg viewBox="0 0 32 32"><path d="M6 6 L12 20 L16 13 L20 20 L26 6" fill="none" stroke="#e67e22" stroke-width="2.5" stroke-linecap="round"/><circle cx="6" cy="6" r="2.4" fill="#ff7b1f"/><circle cx="16" cy="6" r="2.4" fill="#ff7b1f"/><circle cx="26" cy="6" r="2.4" fill="#ff7b1f"/></svg>',
  rain: '<svg viewBox="0 0 32 32"><path d="M8 14 A8 8 0 0 1 24 14 A5 5 0 0 1 23 19 L9 19 A5 5 0 0 1 8 14 Z" fill="#7fb8d4" stroke="#123a5c" stroke-width="1"/><path d="M10 23 L9 27 M16 23 L15 27 M22 23 L21 27" stroke="#2e86ab" stroke-width="2" stroke-linecap="round"/></svg>',
  book: '<svg viewBox="0 0 32 32"><path d="M16 6 C12 3 7 3 4 5 V27 C7 25 12 25 16 28 C20 25 25 25 28 27 V5 C25 3 20 3 16 6 Z" fill="#8e6bbf" stroke="#3d2a5c" stroke-width="1.5"/><path d="M16 6 V28" stroke="#3d2a5c" stroke-width="1.5"/></svg>',
};

export function iconSvg(name) { return ICONS[name] ?? ICONS.flame; }

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

export function cardElement(card, opts = {}) {
  const def = card.def;
  const c = el('div', 'card' + (def.type === 'spell' ? ' spell' : '') + (opts.foe ? ' foe-card' : ''));
  if (def.keywords?.includes('Guard')) c.classList.add('guard');
  const artColor = def.color;
  c.innerHTML =
    `<div class="cost">${def.cost}</div>` +
    `<div class="art" style="background:linear-gradient(160deg, ${artColor}33, ${artColor}11)">${iconSvg(def.icon)}</div>` +
    `<div class="cname">${def.name}</div>` +
    (def.type === 'creature'
      ? `<div class="ckey">${def.keywords.join(' · ') || ' '}</div><div class="ctext">${def.text}</div>
         <div class="stats"><span class="atk">⚔ ${card.atk}</span><span class="hp">♥ ${card.hp}</span></div>`
      : `<div class="ctext">${def.text}</div>`);
  if (opts.onClick) c.addEventListener('click', (e) => { e.stopPropagation(); opts.onClick(card, c); });
  return c;
}

function manaDots(track, mana, maxMana) {
  track.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const d = el('div', 'mana-dot' + (i < mana ? ' full' : i < maxMana ? ' spent' : ''));
    track.appendChild(d);
  }
}

export function render(game, ui) {
  const { me, foe } = game;
  document.getElementById('foe-hp-fill').style.width = `${(foe.hp / foe.maxHp) * 100}%`;
  document.getElementById('foe-hp-text').textContent = `${foe.hp} / ${foe.maxHp} ♥`;
  document.getElementById('me-hp-fill').style.width = `${(me.hp / me.maxHp) * 100}%`;
  document.getElementById('me-hp-text').textContent = `${me.hp} / ${me.maxHp} ♥`;
  manaDots(document.getElementById('foe-mana'), foe.mana, foe.maxMana);
  manaDots(document.getElementById('me-mana'), me.mana, me.maxMana);
  document.getElementById('foe-deck').dataset.count = String(foe.deck.length);
  document.getElementById('me-deck').dataset.count = String(me.deck.length);

  // Lanes: foe row on top, player row below, with empty slots.
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    const foeRow = document.querySelector(`.foe-row[data-lane="${lane}"]`);
    const myRow = document.querySelector(`.my-row[data-lane="${lane}"]`);
    foeRow.innerHTML = ''; myRow.innerHTML = '';
    for (const c of foe.lanes[lane]) {
      foeRow.appendChild(cardElement(c, { foe: true, onClick: (card) => ui.onBoardCard('foe', lane, card) }));
    }
    for (let i = foe.lanes[lane].length; i < 2; i++) foeRow.appendChild(el('div', 'slot', '·'));
    for (const c of me.lanes[lane]) {
      myRow.appendChild(cardElement(c, { onClick: (card) => ui.onBoardCard('me', lane, card) }));
    }
    for (let i = me.lanes[lane].length; i < 2; i++) myRow.appendChild(el('div', 'slot', '·'));
  }

  // Hand.
  const hand = document.getElementById('hand');
  hand.innerHTML = '';
  for (const card of me.hand) {
    const afford = card.def.cost <= me.mana;
    const node = cardElement(card, { onClick: (c) => ui.onHandCard(c) });
    if (ui.selectedUid === card.uid) node.classList.add('selected');
    if (game.active === 'me' && game.phase === 'play' && afford) node.classList.add('can-play');
    if (!afford) node.classList.add('cant-afford');
    hand.appendChild(node);
  }

  // Log.
  const logEl = document.getElementById('log');
  logEl.innerHTML = '';
  for (const line of game.log) logEl.appendChild(el('div', '', line));

  // End turn button + hint + lane targeting.
  const endBtn = document.getElementById('end-turn');
  endBtn.disabled = !(game.phase === 'play' && game.active === 'me');
  endBtn.textContent = game.active === 'foe' ? 'Rival thinking…' : 'End Turn';
  document.getElementById('hint').textContent = ui.hintText(game);
  for (const laneEl of document.querySelectorAll('.lane')) {
    laneEl.classList.toggle('targetable', !!ui.targetLane);
  }

  // Overlays.
  document.getElementById('title-screen').classList.toggle('hidden', game.phase !== 'title');
  const endScreen = document.getElementById('end-screen');
  if (game.phase === 'over') {
    endScreen.classList.remove('hidden');
    const win = game.winner === 'me';
    endScreen.classList.toggle('victory', win);
    endScreen.classList.toggle('defeat', !win);
    document.getElementById('end-ember').textContent = win ? '👑' : '🥀';
    document.getElementById('end-title').textContent = win ? 'Victory!' : 'Defeat';
    document.getElementById('end-sub').textContent = win
      ? 'The Ember Court is yours'
      : 'The Ashen Warden prevails… this time';
    document.getElementById('end-blurb').textContent = win
      ? 'The Warden’s health burns to zero. Your ember burns brightest — play again and defend the Court.'
      : 'Your health falls to zero. Study the Warden’s Guards, spend your mana well, and take the rematch.';
    document.getElementById('end-stats').textContent =
      `Final health — You ${me.hp} · Warden ${foe.hp} · Turns played: ${game.turnsPlayed}`;
  } else {
    endScreen.classList.add('hidden');
  }
}

let toastTimer = null;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}
