# Emberfall — Duel of the Ember Court

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Erwinsays12/makefun-card-game/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Erwinsays12/makefun-card-game/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

An original lane-based card dueling game for the [make.fun best card game bounty](https://make.fun/c/best-card-game-20261122-1826). You are the **Embercaller**, dueling the **Ashen Warden** across three lanes — Ember, Ash and Cinder — for 30 health a side.

## How it plays

- **Mana crystals** grow by one each turn (up to 10). Spend them to summon creatures and cast spells.
- **Creatures** have attack / health and a mana cost. At the end of your turn they strike: a creature facing a rival creature trades blows with it (Guards must be hit first in their lane); a creature facing an empty lane hits the rival hero directly.
- **Keywords:** *Swift* creatures strike the turn they are played; *Guard* creatures must be hit first; *Ember* creatures burst an effect when they enter play (burn, draw, heal, or rain fire).
- **Spells:** Fireball (4 damage to any target), Ember Volley (1 to every rival creature), Healing Rain (restore 6), Quick Study (draw 2).
- **Fatigue:** an empty deck hurts — 1 damage, then 2, then 3…

## Controls

Mouse and keyboard: click a card, then a lane (or a target for Fireball). Keys `1–7` pick a card, `1–3` pick a lane, `Space` ends the turn, `Esc` cancels, `M` mutes, `R` restarts.

## Run it

```sh
node serve.ts        # serves game/ at http://localhost:8080
```

No build step, no network: `game/` is plain static files (HTML + CSS + ES modules) with WebAudio synth sounds. Screenshots in `screenshots/` are real renders of the game (title, mid-duel, victory, defeat).

## Layout

- `game/index.html` — the table, hero bars, lanes, hand and overlays
- `game/styles.css` — ember table theme, card faces, animations
- `game/src/cards.js` — the original card catalogue and both decks
- `game/src/rng.js` — seeded shuffle (mulberry32)
- `game/src/engine.js` — turns, mana, lanes, combat, win/loss
- `game/src/ai.js` — the Ashen Warden's heuristics
- `game/src/render.js` — DOM rendering and SVG card icons
- `game/src/sound.js` — WebAudio sound effects
- `game/src/main.js` — input, turn flow and screenshot demo modes
- `main.ts` — hands `game/` + `screenshots/` to `/output` with a dossier
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

MIT licensed.
