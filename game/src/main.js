// Emberfall bootstrap: input (mouse + keyboard), turn flow, and the
// screenshot demo modes (?shot=start|play|win|loss) that set the game up
// in a fixed state so its maker can photograph it.
import { createGame, startDuel, playCard, endTurn, damageHero } from './engine.js';
import { runFoeTurn } from './ai.js';
import { render, toast } from './render.js';
import { sfx, toggleMute } from './sound.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot');
const SEED = Number(params.get('seed') || '7');

const game = createGame(SEED);
let selectedUid = null;      // hand card selected, awaiting a lane / target
let targeting = null;        // { kind: 'burn' } while a Fireball picks a target
let foeBusy = false;
let wins = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function hintText(g) {
  if (g.phase === 'over') return g.winner === 'me' ? 'Victory! Press R to play again.' : 'Defeat. Press R for a rematch.';
  if (g.phase === 'title') return 'Press Enter or click Play the Duel.';
  if (g.active === 'foe') return 'The Ashen Warden is thinking…';
  if (targeting) return 'Fireball ready — click a rival creature, or the Warden’s portrait, to burn it.';
  if (selectedUid) {
    const card = g.me.hand.find((c) => c.uid === selectedUid);
    if (card?.def.type === 'creature') return `Playing ${card.def.name} — click a lane (or press 1–3). Esc to cancel.`;
    return `Casting ${card?.def.name} — click a target. Esc to cancel.`;
  }
  return 'Click a card, then a lane — or press 1–7 to pick a card, 1–3 for a lane, Space to end turn.';
}

const ui = {
  get selectedUid() { return selectedUid; },
  get targetLane() { return selectedUid != null && game.me.hand.find((c) => c.uid === selectedUid)?.def.type === 'creature'; },
  hintText,
  onHandCard(card) {
    if (game.phase !== 'play' || game.active !== 'me' || foeBusy) return;
    if (selectedUid === card.uid) { selectedUid = null; targeting = null; sfx.click(); render(game, ui); return; }
    if (card.def.cost > game.me.mana) { toast('Not enough mana for ' + card.def.name + '.'); return; }
    // Spells that need no target cast at once; creatures wait for a lane,
    // and Fireball waits for a target.
    if (card.def.type === 'spell' && card.def.effect !== 'burn') {
      selectedUid = card.uid;
      castSelected(null);
      return;
    }
    selectedUid = card.uid;
    targeting = card.def.effect === 'burn' ? { kind: 'burn' } : null;
    sfx.select();
    render(game, ui);
  },
  onBoardCard(who, lane, card) {
    if (game.phase !== 'play' || game.active !== 'me' || foeBusy) return;
    // Fireball targeting: a rival creature, or the rival hero via portrait.
    if (targeting && who === 'foe') { castSelected({ kind: 'creature', who, lane, uid: card.uid }); return; }
    if (targeting) { toast('Fireball needs a rival target.'); return; }
  },
};

function castSelected(target) {
  const res = playCard(game, 'me', selectedUid, null, target);
  if (!res.ok) { toast(res.why); return; }
  selectedUid = null; targeting = null;
  sfx.play();
  afterMyAction();
}

function playSelectedToLane(lane) {
  const res = playCard(game, 'me', selectedUid, lane, null);
  if (!res.ok) { toast(res.why); return; }
  selectedUid = null; targeting = null;
  sfx.play();
  afterMyAction();
}

function afterMyAction() {
  render(game, ui);
  if (game.phase === 'over') return finishDuel();
}

async function onEndTurn() {
  if (game.phase !== 'play' || game.active !== 'me' || foeBusy) return;
  selectedUid = null; targeting = null;
  foeBusy = true;
  sfx.turn();
  endTurn(game);
  render(game, ui);
  if (game.phase === 'over') { foeBusy = false; return finishDuel(); }
  await sleep(650);
  await runFoeTurn(game, async () => { sfx.play(); render(game, ui); }, sleep);
  foeBusy = false;
  render(game, ui);
  if (game.phase === 'over') return finishDuel();
}

function finishDuel() {
  render(game, ui);
  if (game.winner === 'me') { wins += 1; document.getElementById('wins-num').textContent = String(wins); sfx.win(); }
  else sfx.lose();
}

function startNewDuel() {
  const fresh = createGame((SEED + Date.now()) % 2147483647);
  game.me = fresh.me; game.foe = fresh.foe; game.log = fresh.log;
  game.turn = 1; game.turnsPlayed = 0; game.winner = null; game.active = 'me';
  selectedUid = null; targeting = null; foeBusy = false;
  startDuel(game);
  sfx.turn();
  render(game, ui);
}

// ----- input -----
document.getElementById('end-turn').addEventListener('click', onEndTurn);
document.getElementById('play-button').addEventListener('click', startNewDuel);
document.getElementById('again-button').addEventListener('click', startNewDuel);
document.getElementById('foe-portrait').addEventListener('click', () => {
  if (targeting) castSelected({ kind: 'hero' });
});
for (const laneEl of document.querySelectorAll('.lane')) {
  laneEl.addEventListener('click', () => {
    if (selectedUid == null || game.active !== 'me' || foeBusy) return;
    const card = game.me.hand.find((c) => c.uid === selectedUid);
    if (card?.def.type === 'creature') playSelectedToLane(Number(laneEl.dataset.lane));
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') { toast(toggleMute() ? 'Sound off.' : 'Sound on.'); return; }
  if (e.key === 'r' || e.key === 'R') { if (game.phase !== 'title') startNewDuel(); return; }
  if (game.phase === 'title' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); startNewDuel(); return; }
  if (game.phase !== 'play' || game.active !== 'me' || foeBusy) return;
  if (e.key === 'Escape') { selectedUid = null; targeting = null; render(game, ui); return; }
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onEndTurn(); return; }
  const n = Number(e.key);
  if (Number.isInteger(n) && n >= 1 && n <= 9) {
    if (selectedUid != null) {
      const card = game.me.hand.find((c) => c.uid === selectedUid);
      if (card?.def.type === 'creature' && n >= 1 && n <= 3) { playSelectedToLane(n - 1); return; }
      if (targeting && n === 9) { castSelected({ kind: 'hero' }); return; }
    }
    const card = game.me.hand[n - 1];
    if (card) ui.onHandCard(card);
  }
});

// ----- screenshot demo modes: real game states, fixed seed -----
// demoPlay: play four full rounds with a simple scripted policy for the
// player (cheapest creatures first, spread across lanes; draw when the
// hand runs dry) and the real AI for the rival, then freeze mid-duel.
function demoPolicy(game) {
  let acted = true;
  while (acted) {
    acted = false;
    const study = game.me.hand.find((c) => c.def.effect === 'draw' && c.def.cost <= game.me.mana);
    if (study && game.me.hand.length <= 3) { playCard(game, 'me', study.uid, null, null); acted = true; continue; }
    const heal = game.me.hand.find((c) => c.def.effect === 'heal' && c.def.cost <= game.me.mana);
    if (heal && game.me.hp <= 20) { playCard(game, 'me', heal.uid, null, null); acted = true; continue; }
    const creatures = game.me.hand.filter((c) => c.def.type === 'creature' && c.def.cost <= game.me.mana)
      .sort((a, b) => a.def.cost - b.def.cost);
    for (const card of creatures) {
      let lane = -1;
      for (let l = 0; l < 3; l++) if (game.me.lanes[l].length < 2) { lane = l; break; }
      if (lane === -1) break;
      const res = playCard(game, 'me', card.uid, lane, null);
      if (res.ok) { acted = true; break; }
    }
  }
}

async function demoPlay() {
  startDuel(game);
  for (let round = 0; round < 4 && game.phase === 'play'; round++) {
    demoPolicy(game);
    render(game, ui);
    endTurn(game);
    if (game.phase !== 'play') break;
    await runFoeTurn(game, async () => {}, sleep);
  }
  demoPolicy(game);
  // Highlight one playable card so the shot shows the hand's afford state.
  selectedUid = game.me.hand.find((c) => c.def.cost <= game.me.mana)?.uid ?? null;
  render(game, ui);
}
async function demoEnd(win) {
  startDuel(game);
  playCard(game, 'me', game.me.hand.find((c) => c.def.id === 'ember_imp')?.uid, 0);
  endTurn(game);
  await runFoeTurn(game, async () => {}, sleep);
  damageHero(game, win ? 'foe' : 'me', 30);
  finishDuel();
}

if (SHOT === 'play') { demoPlay(); }
else if (SHOT === 'win') { demoEnd(true); }
else if (SHOT === 'loss') { demoEnd(false); }
else { render(game, ui); }
