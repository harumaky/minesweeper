'use strict';
import { Game } from './minesweeper.js';

const gameForm = document.getElementById('gameForm');
const width = document.getElementById('conf_width');
const height = document.getElementById('conf_height');
const bomb = document.getElementById('conf_bomb');

gameForm.addEventListener('change', gameFormValidation);
gameForm.addEventListener('submit', function(e) {
	e.preventDefault();
	e.stopPropagation();
	if (!isBombAmoutOk()) {
		alert('爆弾の数が多すぎます');
	} else {
		const j_width = parseInt(width.value);
		const j_height = parseInt(height.value);
		const j_bomb = parseInt(bomb.value);
		initiate(j_width, j_height, j_bomb);
	}
});

function isBombAmoutOk() {
	const size = parseInt(width.value) * parseInt(height.value);
	const bomb_amout = parseInt(bomb.value);
	if (Math.round(size*0.8) < bomb_amout) return false;
	return true;
}

function gameFormValidation() {
	if(!isBombAmoutOk()) {
		bomb.classList.add('warn');
	} else {
		bomb.classList.remove('warn');
	}
}

function initiate(width, height, bomb) {
	// decide #gamefield size
	// client window size (c_)
	const c_width = window.innerWidth;
	const c_height = window.innerHeight - 50; // 30px for header
	const field = document.getElementById('gamefield');

	let squareSize = Math.min(Math.floor(c_width/width), Math.floor(c_height/height));

	field.style.width = squareSize * width + 'px';
	field.style.height = squareSize * height + 50 + 'px';

	const init_elm_ids = ['grid', 'sel', 'sel_mask', 'sel_cancel', 'sel_dig', 'sel_flag', 'sel_unflag', 'h_flags', 'h_time', 'h_sound', 'h_back'];
	// const const_elms = const_elm_ids.map(e => document.getElementById(e));
	let init_elms = {};
	for (let i = 0; i < init_elm_ids.length; i++) {
		init_elms[init_elm_ids[i]] = document.getElementById(init_elm_ids[i]);
	}

	const game = new Game(init_elms, width, height, bomb, squareSize);
	game.init();

	const gameWrap = document.getElementById('gamewrap');
	gameWrap.style.display = 'flex';
}