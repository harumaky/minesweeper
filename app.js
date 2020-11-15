'use strict';
import { Game } from './minesweeper.js';

const init_elm_ids = ['grid', 'sel', 'sel_mask', 'sel_cancel', 'sel_dig', 'sel_flag', 'sel_unflag'];
// const const_elms = const_elm_ids.map(e => document.getElementById(e));
let init_elms = {};
for (let i = 0; i < init_elm_ids.length; i++) {
	init_elms[init_elm_ids[i]] = document.getElementById(init_elm_ids[i]);
}

const game = new Game(init_elms, 10, 10, 25);
game.init();