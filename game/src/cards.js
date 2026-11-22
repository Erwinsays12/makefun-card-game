// Emberfall card catalogue. Every card is original: ember, ash, storm and tide
// creatures of the Ember Court, plus the court's own spells. A card has a mana
// cost, and creatures carry attack / health while spells carry an effect.
// Keywords: Swift (strikes the turn it is played), Guard (must be hit first in
// its lane), Ember (a burst when it enters play).
export const CARDS = {
  ember_imp:     { id: 'ember_imp',     name: 'Ember Imp',     cost: 1, type: 'creature', atk: 2, hp: 1, keywords: ['Swift'],  text: 'Swift: strikes the turn it is played.',        color: '#e07b1f', icon: 'flame' },
  cinder_hound:  { id: 'cinder_hound',  name: 'Cinder Hound',  cost: 2, type: 'creature', atk: 3, hp: 2, keywords: [],         text: 'A loyal hound of hot coals.',                    color: '#c0392b', icon: 'hound' },
  ash_guard:     { id: 'ash_guard',     name: 'Ash Guard',     cost: 2, type: 'creature', atk: 1, hp: 4, keywords: ['Guard'],  text: 'Guard: foes in this lane must hit it first.',    color: '#7d8aa5', icon: 'shield' },
  flame_acolyte: { id: 'flame_acolyte', name: 'Flame Acolyte', cost: 3, type: 'creature', atk: 3, hp: 3, keywords: ['Ember'],  text: 'Ember: deal 1 damage to the rival.',            color: '#e67e22', icon: 'acolyte' },
  storm_crow:    { id: 'storm_crow',    name: 'Storm Crow',    cost: 3, type: 'creature', atk: 4, hp: 2, keywords: ['Swift'],  text: 'Swift: strikes the turn it is played.',        color: '#5b7fa6', icon: 'crow' },
  thorn_druid:   { id: 'thorn_druid',   name: 'Thorn Druid',   cost: 3, type: 'creature', atk: 2, hp: 4, keywords: ['Ember'],  text: 'Ember: draw a card.',                          color: '#5c8a3c', icon: 'leaf' },
  ember_knight:  { id: 'ember_knight',  name: 'Ember Knight',  cost: 4, type: 'creature', atk: 4, hp: 4, keywords: [],         text: 'Sworn to the Ember Court, blade of cinders.',  color: '#d4a017', icon: 'sword' },
  tide_serpent:  { id: 'tide_serpent',  name: 'Tide Serpent',  cost: 4, type: 'creature', atk: 3, hp: 5, keywords: ['Ember'],  text: 'Ember: restore 3 health to yourself.',         color: '#2e86ab', icon: 'wave' },
  molten_golem:  { id: 'molten_golem',  name: 'Molten Golem',  cost: 5, type: 'creature', atk: 5, hp: 6, keywords: ['Guard'],  text: 'Guard: foes in this lane must hit it first.',    color: '#8a3b12', icon: 'golem' },
  phoenix:       { id: 'phoenix',       name: 'Phoenix',       cost: 6, type: 'creature', atk: 6, hp: 5, keywords: ['Ember'],  text: 'Ember: deal 2 damage to every rival creature.', color: '#e74c3c', icon: 'phoenix' },
  fireball:      { id: 'fireball',      name: 'Fireball',      cost: 3, type: 'spell',  effect: 'burn',   text: 'Deal 4 damage to a creature or the rival.',    color: '#e74c3c', icon: 'flame' },
  ember_volley:  { id: 'ember_volley',  name: 'Ember Volley',  cost: 2, type: 'spell',  effect: 'volley', text: 'Deal 1 damage to every rival creature.',       color: '#e67e22', icon: 'volley' },
  healing_rain:  { id: 'healing_rain',  name: 'Healing Rain',  cost: 2, type: 'spell',  effect: 'heal',   text: 'Restore 6 health to yourself.',                color: '#2e86ab', icon: 'rain' },
  quick_study:   { id: 'quick_study',   name: 'Quick Study',   cost: 1, type: 'spell',  effect: 'draw',   text: 'Draw 2 cards.',                                color: '#8e6bbf', icon: 'book' },
};

// The two 24-card decks. The player's deck leans on tempo (cheap Swift
// creatures and burn); the rival's leans on Guards and big finishers.
export const PLAYER_DECK = [
  'ember_imp', 'ember_imp', 'cinder_hound', 'cinder_hound', 'ash_guard', 'ash_guard',
  'flame_acolyte', 'flame_acolyte', 'storm_crow', 'storm_crow', 'thorn_druid', 'thorn_druid',
  'ember_knight', 'ember_knight', 'tide_serpent', 'fireball', 'fireball', 'ember_volley',
  'ember_volley', 'healing_rain', 'healing_rain', 'quick_study', 'quick_study', 'phoenix',
];
export const FOE_DECK = [
  'ember_imp', 'ember_imp', 'cinder_hound', 'cinder_hound', 'ash_guard', 'ash_guard',
  'flame_acolyte', 'flame_acolyte', 'storm_crow', 'thorn_druid', 'ember_knight', 'ember_knight',
  'tide_serpent', 'molten_golem', 'molten_golem', 'phoenix', 'fireball', 'fireball',
  'ember_volley', 'ember_volley', 'healing_rain', 'quick_study', 'quick_study', 'ash_guard',
];

export const MAX_HAND = 7;
export const MAX_MANA = 10;
export const START_HP = 30;
export const LANE_COUNT = 3;
export const LANE_CAP = 2; // creatures per side in one lane
