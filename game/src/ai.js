// The Ashen Warden: a readable, counterable rival. It plays its cheapest
// useful cards first, prefers lanes where it can answer a threat, saves
// Fireball for a big creature or a lethal push, and heals when hurt.
// choosePlays is pure: it only plans moves. runFoeTurn applies them through
// the engine, so the rival obeys exactly the same rules as the player.
import { LANE_COUNT, LANE_CAP } from './cards.js';
import { playCard, combatPhase, beginTurn } from './engine.js';

function laneThreat(game, lane) {
  return game.me.lanes[lane].reduce((sum, c) => sum + c.atk, 0);
}

function pickLane(game, simLanes) {
  // Answer the most dangerous lane first, if there is room.
  let best = -1; let bestThreat = -1;
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    if (simLanes[lane] >= LANE_CAP) continue;
    const t = laneThreat(game, lane);
    if (t > bestThreat) { bestThreat = t; best = lane; }
  }
  if (bestThreat > 0) return best;
  // Otherwise spread out: the emptiest lane.
  let emptiest = 0;
  for (let lane = 1; lane < LANE_COUNT; lane++) {
    if (simLanes[lane] < simLanes[emptiest]) emptiest = lane;
  }
  return simLanes[emptiest] >= LANE_CAP ? -1 : emptiest;
}

export function choosePlays(game) {
  const foe = game.foe;
  const moves = [];
  let mana = foe.mana;
  const simLanes = foe.lanes.map((l) => l.length);
  const hand = foe.hand.slice();

  const take = (card) => {
    hand.splice(hand.indexOf(card), 1);
    mana -= card.def.cost;
  };

  // Heal when badly hurt and a Healing Rain is in hand.
  const heal = hand.find((c) => c.def.effect === 'heal');
  if (heal && foe.hp <= 14 && mana >= heal.def.cost) {
    moves.push({ uid: heal.uid, lane: null, target: null });
    take(heal);
  }
  // Play creatures, cheapest first, into the best lane.
  const creatures = hand.filter((c) => c.def.type === 'creature')
    .sort((a, b) => a.def.cost - b.def.cost);
  for (const card of creatures) {
    if (card.def.cost > mana) continue;
    const lane = pickLane(game, simLanes);
    if (lane === -1) continue;
    moves.push({ uid: card.uid, lane, target: null });
    take(card);
    simLanes[lane] += 1;
  }
  // Ember Volley: clear a wide player board.
  const volley = hand.find((c) => c.def.effect === 'volley');
  if (volley && mana >= volley.def.cost && game.me.lanes.flat().length >= 2) {
    moves.push({ uid: volley.uid, lane: null, target: null });
    take(volley);
  }
  // Fireball: kill the biggest player creature it can, or go face when lethal is near.
  const burn = hand.find((c) => c.def.effect === 'burn');
  if (burn && mana >= burn.def.cost) {
    let target = null; let biggest = 0;
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      for (const c of game.me.lanes[lane]) {
        if (c.hp <= 4 && c.atk > biggest) { biggest = c.atk; target = { kind: 'creature', who: 'me', lane, uid: c.uid }; }
      }
    }
    if (!target && game.me.hp <= 4) target = { kind: 'hero' };
    if (target) { moves.push({ uid: burn.uid, lane: null, target }); take(burn); }
  }
  // Draw when the hand is running dry.
  const study = hand.find((c) => c.def.effect === 'draw');
  if (study && mana >= study.def.cost && hand.length <= 3) {
    moves.push({ uid: study.uid, lane: null, target: null });
    take(study);
  }
  return moves;
}

// Run the rival's whole turn through the real engine. `onStep` fires after
// each visible action so the renderer can animate it.
export async function runFoeTurn(game, onStep, sleep) {
  const moves = choosePlays(game);
  for (const m of moves) {
    if (game.phase === 'over') return;
    const res = playCard(game, 'foe', m.uid, m.lane, m.target);
    if (res.ok) await onStep('play', res.card, m.lane);
    await sleep(420);
    if (game.phase === 'over') return;
  }
  combatPhase(game, 'foe');
  await onStep('combat');
  if (game.phase === 'over') return;
  game.active = 'me';
  game.turn += 1;
  beginTurn(game, 'me');
  await onStep('turn');
}
