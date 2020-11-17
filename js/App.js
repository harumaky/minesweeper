'use strict';
import { Minesweeper } from './minesweeper.js';
import { SEHandler } from './SEHandler.js';
import { gamehandler } from './GameHandler.js';
import { SDF, getDOM } from './utils.js';

let minesweeper;

function loadCompleted() {
	document.getElementById('loading_wrap').classList.add('slideout')
}


const SE = new SEHandler();
SE.load();
SE.onLoadCompleted(function() {
	console.log(`All sound effects loaded in ${new Date() - SE.initTime}ms`);
	loadCompleted();
})

SDF('allow_sound', 'click', function() { 
	SE.allowed = true;
	this.classList.add('d-none');
	getDOM('forbit_sound').classList.remove('d-none');
})
SDF('forbit_sound', 'click', function() {
	SE.allowed = false;
	this.classList.add('d-none');
	getDOM('allow_sound').classList.remove('d-none');
})

const gameForm = getDOM('gameForm');
const f_width = getDOM('conf_width');
const f_height = getDOM('conf_height');
const f_bomb = getDOM('conf_bomb');
const f_size_inputs = [f_width, f_height];

f_width.value = localStorage.getItem('last_game_width') || 8
f_height.value = localStorage.getItem('last_game_height') || 10
f_bomb.value = localStorage.getItem('last_game_bomb_amount') || 20

SDF(gameForm, 'change', gameFormValidation);
SDF(gameForm, 'submit', function(e) {
	e.preventDefault();
	e.stopPropagation();
	if (!gameFormValidation()) {
		alert('設定エラーがあります');
	} else {
		const j_width = parseInt(f_width.value);
		const j_height = parseInt(f_height.value);
		const j_bomb = parseInt(f_bomb.value);
		initiate(j_width, j_height, j_bomb);
	}
});

function initiate(width, height, bomb) {
	// decide #gamefield size
	// client window size (c_) = #screen's height, not window.height
	const screen = getDOM('screen');

	const c_width = screen.clientWidth;
	const c_height = screen.clientHeight;

	console.log(`screen width: ${c_width}, height: ${c_height}`);

	const g_wrap = getDOM('gamewrap');
	const g_field = getDOM('gamefield');
	const b_wrap = getDOM('boardwrap');
	const board = getDOM('board');
	const menu = getDOM('menu');

	let type;
	if (c_width < c_height && c_width < 1024) {
		type = "A";
		if (width > height) {
			alert('レイアウト調整のため指定した幅と高さが反転します');
			[width, height] = [height, width];
		}
	} else if (width > height) {
		type = "B";
	} else if (width <= height) {
		type = "C";
	} else {
		type = undefined;
	}

	if (!type) {
		alert('画面の条件が満たされていないため開始できませんでした');
		return;
	}

	g_wrap.classList.add(`type_${type}`);
	g_field.classList.add(`type_${type}`);
	b_wrap.classList.add(`type_${type}`);
	board.classList.add(`type_${type}`);
	menu.classList.add(`type_${type}`);

	g_wrap.style.display = 'flex';

	const f_width = g_field.clientWidth;
	const f_height = g_field.clientHeight;

	const squareSize = Math.min(Math.floor(f_width/width), Math.floor((f_height-50)/height));

	board.style.width = squareSize * width + 'px';
	board.style.height = squareSize * height + 'px';
	b_wrap.style.height = squareSize * height + 50 + 'px';

	// store data in localstorage
	localStorage.setItem('last_game_width', width);
	localStorage.setItem('last_game_height', height);
	localStorage.setItem('last_game_bomb_amount', bomb);

	minesweeper = new Minesweeper(width, height, bomb, squareSize);
	minesweeper.onInit(function() {
		gamehandler(this, SE);
	})
	minesweeper.init();
}

function gameFormValidation() {
	let ok = true;
	f_size_inputs.forEach(input => {
		let val = parseInt(input.value);
		if (!val || val < 6 || val > 50) {
			input.classList.add('warn');
			ok = false;
		} else {
			input.classList.remove('warn');
		}
	});
	if(!isBombAmoutOk()) {
		f_bomb.classList.add('warn');
		ok = false;
	} else {
		f_bomb.classList.remove('warn');
	}
	return ok;
}

function isBombAmoutOk() {
	const size = parseInt(f_width.value) * parseInt(f_height.value);
	const bomb_amout = parseInt(f_bomb.value);
	if (!bomb_amout) return false;
	if (Math.round(size*0.8) < bomb_amout) return false;
	return true;
}
