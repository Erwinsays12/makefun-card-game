// Emberfall engine: turns, mana, lanes, combat and win/loss. Pure rules —
// rendering lives in render.js, the rival's choices in ai.js.
import { CARDS, PLAYER_DECK, FOE_DECK, MAX_HAND, MAX_MANA, START_HP, LANE_COUNT, LANE_CAP } from './cards.js';
import { makeRng, shuffle } from './rng.js';

let uid = 1;
export function makeCardInstance(cardId) {
  const def = CARDS[cardId];
  return { uid: uid++, def, atk: def.atk ?? 0, hp: def.hp ?? 0, maxHp: def.hp ?? 0, canAttack: false, justPlayed: true };
}

export function makePlayer(name, deckIds, rng) {
  return {
    name, hp: START_HP, maxHp: START_HP,
    mana: 0, maxMana: 0,
    deck: shuffle(deckIds, rng).map(makeCardInstance),
    hand: [], fatigue: 0,
    lanes: Array.from({ length: LANE_COUNT }, () => []),
  };
}

export function createGame(seed) {
  const rng = makeRng(seed);
  const game = {
    seed, rng, turn: 1, phase: 'title', // title | play | over
    me: makePlayer('Embercaller', PLAYER_DECK, rng),
    foe: makePlayer('Ashen Warden', FOE_DECK, rng),
    active: 'me', log: [], winner: null, turnsPlayed: 0,
  };
  return game;
}

export function log(game, html) {
  game.log.unshift(html);
  if (game.log.length > 4) game.log.length = 4;
}

export function drawCards(game, who, n) {
  const p = game[who];
  for (let i = 0; i < n; i++) {
    if (p.deck.length === 0) {
      p.fatigue += 1;
      damageHero(game, who, p.fatigue);
      log(game, `<b>${p.name}</b> is out of cards and takes <b>${p.fatigue}</b> fatigue damage.`);
      if (game.phase === 'over') return;
      continue;
    }
    const card = p.deck.pop();
    if (p.hand.length >= MAX_HAND) {
      log(game, `<b>${p.name}</b>'s hand is full — a card burns away.`);
    } else {
      p.hand.push(card);
    }
  }
}

export function startDuel(game) {
  game.phase = 'play';
  game.active = 'me';
  drawCards(game, 'me', 3);
  drawCards(game, 'foe', 3);
  beginTurn(game, 'me');
  log(game, 'The duel begins. <b>Embercaller</b>, your move — spend mana, summon, strike.');
}

export function beginTurn(game, who) {
  const p = game[who];
  p.maxMana = Math.min(MAX_MANA, p.maxMana + 1);
  p.mana = p.maxMana;
  for (const lane of p.lanes) for (const c of lane) c.canAttack = true;
  drawCards(game, who, 1);
  if (game.phase === 'over') return;
  log(game, `<b>${p.name}</b>'s turn — ${p.maxMana} mana crystal${p.maxMana > 1 ? 's' : ''}.`);
}

export function damageHero(game, who, amount) {
  const p = game[who];
  p.hp = Math.max(0, p.hp - amount);
  if (p.hp <= 0) endDuel(game, who === 'me' ? 'foe' : 'me');
}

export function healHero(game, who, amount) {
  const p = game[who];
  p.hp = Math.min(p.maxHp, p.hp + amount);
}

export function endDuel(game, winner) {
  if (game.phase === 'over') return;
  game.phase = 'over';
  game.winner = winner;
}

export function canPlayCard(game, who, cardUid, lane) {
  const p = game[who];
  const idx = p.hand.findIndex((c) => c.uid === cardUid);
  if (idx === -1) return { ok: false, why: 'Card is not in hand.' };
  const card = p.hand[idx];
  if (card.def.cost > p.mana) return { ok: false, why: 'Not enough mana.' };
  if (card.def.type === 'creature') {
    if (lane == null || lane < 0 || lane >= LANE_COUNT) return { ok: false, why: 'Pick a lane first.' };
    if (p.lanes[lane].length >= LANE_CAP) return { ok: false, why: 'That lane is full.' };
  }
  return { ok: true, card, idx };
}

// Play a creature into a lane, or a spell (targetUid null = rival hero for burn).
export function playCard(game, who, cardUid, lane, target) {
  const check = canPlayCard(game, who, cardUid, lane);
  if (!check.ok) return check;
  const p = game[who];
  const foe = game[who === 'me' ? 'foe' : 'me'];
  const card = check.card;
  p.hand.splice(check.idx, 1);
  p.mana -= card.def.cost;

  if (card.def.type === 'creature') {
    card.canAttack = card.def.keywords.includes('Swift');
    p.lanes[lane].push(card);
    log(game, `<b>${p.name}</b> summons <b>${card.def.name}</b> to ${laneName(lane)}.`);
    if (card.def.keywords.includes('Ember')) applyEmber(game, who, card);
  } else {
    log(game, `<b>${p.name}</b> casts <b>${card.def.name}</b>.`);
    applySpell(game, who, card, target);
  }
  return { ok: true, card };
}

function laneName(lane) {
  return ['Ember Lane', 'Ash Lane', 'Cinder Lane'][lane];
}

function applyEmber(game, who, card) {
  const foe = game[who === 'me' ? 'foe' : 'me'];
  switch (card.def.id) {
    case 'flame_acolyte':
      damageHero(game, who === 'me' ? 'foe' : 'me', 1);
      log(game, `Ember: <b>${card.def.name}</b> scorches the rival for 1.`);
      break;
    case 'thorn_druid':
      drawCards(game, who, 1);
      log(game, `Ember: <b>${card.def.name}</b> draws a card.`);
      break;
    case 'tide_serpent':
      healHero(game, who, 3);
      log(game, `Ember: <b>${card.def.name}</b> restores 3 health.`);
      break;
    case 'phoenix': {
      let hit = 0;
      for (const lane of foe.lanes) for (const c of lane.slice()) { hurtCreature(game, foe, c, 2); hit++; }
      log(game, `Ember: <b>${card.def.name}</b> rains fire — ${hit} rival creature${hit === 1 ? '' : 's'} burn for 2.`);
      break;
    }
    default: break;
  }
}

function applySpell(game, who, card, target) {
  const foe = game[who === 'me' ? 'foe' : 'me'];
  switch (card.def.effect) {
    case 'burn': {
      if (target && target.kind === 'creature') {
        const owner = game[target.who];
        const lane = owner.lanes[target.lane];
        const c = lane.find((x) => x.uid === target.uid);
        if (c) { hurtCreature(game, owner, c, 4); log(game, `Fireball hits <b>${c.def.name}</b> for 4.`); }
      } else {
        damageHero(game, who === 'me' ? 'foe' : 'me', 4);
        log(game, `Fireball strikes <b>${foe.name}</b> for 4.`);
      }
      break;
    }
    case 'volley': {
      let hit = 0;
      for (const lane of foe.lanes) for (const c of lane.slice()) { hurtCreature(game, foe, c, 1); hit++; }
      log(game, `Ember Volley scorches ${hit} rival creature${hit === 1 ? '' : 's'} for 1.`);
      break;
    }
    case 'heal':
      healHero(game, who, 6);
      log(game, `<b>${game[who].name}</b> recovers 6 health.`);
      break;
    case 'draw':
      drawCards(game, who, 2);
      log(game, `<b>${game[who].name}</b> draws 2 cards.`);
      break;
    default: break;
  }
}

export function hurtCreature(game, owner, creature, amount) {
  creature.hp -= amount;
  if (creature.hp <= 0) {
    const lane = owner.lanes.find((l) => l.includes(creature));
    if (lane) lane.splice(lane.indexOf(creature), 1);
    log(game, `<b>${creature.def.name}</b> is destroyed.`);
  }
}

// End-of-turn combat: in each lane, each ready creature strikes. A creature
// facing a Guard must hit the Guard; otherwise it hits the creature opposite
// it, or the rival hero when the lane is empty. Attackers take return damage.
export function combatPhase(game, who) {
  const atk = game[who];
  const def = game[who === 'me' ? 'foe' : 'me'];
  const strikes = [];
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    const guards = def.lanes[lane].filter((c) => c.def.keywords.includes('Guard'));
    for (const c of atk.lanes[lane].slice()) {
      if (!c.canAttack) continue;
      c.canAttack = false;
      const target = guards[0] ?? def.lanes[lane][0] ?? null;
      strikes.push({ lane, attacker: c, target });
    }
  }
  for (const s of strikes) {
    if (game.phase === 'over') break;
    if (s.target) {
      hurtCreature(game, def, s.target, s.attacker.atk);
      // Return damage only if the defender survived the blow.
      const stillThere = def.lanes[s.lane].includes(s.target);
      if (stillThere) hurtCreature(game, atk, s.attacker, s.target.atk);
      log(game, `<b>${s.attacker.def.name}</b> strikes ${s.target.def.name} for ${s.attacker.atk}.`);
    } else {
      damageHero(game, who === 'me' ? 'foe' : 'me', s.attacker.atk);
      log(game, `<b>${s.attacker.def.name}</b> hits <b>${def.name}</b> for ${s.attacker.atk}.`);
    }
    if (game.phase === 'over') break;
  }
  return strikes;
}

export function endTurn(game) {
  if (game.phase !== 'play' || game.active !== 'me') return;
  combatPhase(game, 'me');
  if (game.phase === 'over') return;
  game.active = 'foe';
  game.turnsPlayed += 1;
  beginTurn(game, 'foe');
}
