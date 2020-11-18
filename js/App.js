'use strict';
import { Minesweeper } from './minesweeper.js';
import { SEHandler } from './SEHandler.js';
import { gamehandler } from './GameHandler.js';
import { SDF, getDOM, wait } from './utils.js';

const minesweeper = new Minesweeper;

const screen = getDOM('screen');
const lobby = getDOM('lobby');
const g_form = getDOM('g_form');
const f_width = getDOM('conf_width');
const f_height = getDOM('conf_height');
const f_bomb = getDOM('conf_bomb');
const f_size_inputs = [f_width, f_height];

const g_wrap = getDOM('g_wrap');
const g_field = getDOM('g_field');
const b_wrap = getDOM('b_wrap');
const board = getDOM('board');
const menu = getDOM('menu');

setDefValue();

function setDefValue() {
	f_width.value = localStorage.getItem('last_game_width') || 8;
	f_height.value = localStorage.getItem('last_game_height') || 10;
	f_bomb.value = localStorage.getItem('last_game_bomb_amount') || 20;
}


SDF(g_form, 'change', g_formValidation);
SDF(g_form, 'submit', function(e) {
	e.preventDefault();
	e.stopPropagation();
	if (!g_formValidation()) {
		alert('設定エラーがあります');
	} else {
		const j_width = parseInt(f_width.value);
		const j_height = parseInt(f_height.value);
		const j_bomb = parseInt(f_bomb.value);
		initiate(j_width, j_height, j_bomb);
	}
});

function loadCompleted() {
	getDOM('loading_wrap').classList.add('slideout')
}
const SE = new SEHandler();
SE.load();
SE.onLoadCompleted(function() {
	console.log(`All sound effects loaded in ${new Date() - SE.initTime}ms`);
	loadCompleted();
})
SDF('allow_sound', 'click', function() { 
	console.log('allow');
	SE.allowed = true;
	this.classList.remove('active');
	getDOM('forbit_sound').classList.add('active');
})
SDF('forbit_sound', 'click', function() {
	SE.allowed = false;
	this.classList.remove('active');
	getDOM('allow_sound').classList.add('active');
});


async function initiate(width, height, bomb) {
	// decide #g_field size
	// client window size (c_) = #screen's height, not window.height
	lobby.classList.remove('active');
	await wait(1000);
	g_wrap.classList.add('active');

	const c_width = screen.clientWidth;
	const c_height = screen.clientHeight;

	console.log(`screen width: ${c_width}, height: ${c_height}`);

	let type; // layouttype
	if (c_width < c_height && c_width < 1024) {
		type = "A";
		if (c_width < 1024 && width > height) {
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

	const field_w = g_field.clientWidth;
	const field_h = g_field.clientHeight;
	const squareSize = Math.min(Math.floor(field_w/width), Math.floor((field_h-50)/height));

	board.style.width = squareSize * width + 'px';
	board.style.height = squareSize * height + 'px';
	b_wrap.style.height = squareSize * height + 50 + 'px';

	// store data in localstorage
	localStorage.setItem('last_game_width', width);
	localStorage.setItem('last_game_height', height);
	localStorage.setItem('last_game_bomb_amount', bomb);

	minesweeper.onInit(function() {
		console.log(`playcount: ${this.playcount}`);
		gamehandler(this, SE);
	})
	minesweeper.init(width, height, bomb, squareSize, type);

}

function g_formValidation() {
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
	const max = Math.round(size*0.8);
	const min = 1;
	if (!bomb_amout || max < bomb_amout || min > bomb_amout) return false;
	return true;
}

SDF('open_menu_btn', 'click', function() {
	menu.classList.add('active')
})
SDF('close_menu_btn', 'click', function() {
	menu.classList.remove('active')
})

SDF('exit_btn', 'click', reset)
function reset() {
	minesweeper.exit();

	g_wrap.classList.remove('active');
	menu.classList.remove('active');

	lobby.classList.add('active');

}


document.querySelectorAll('.close_result_modal').forEach(elm => {
	elm.addEventListener('click', () => {
		getDOM('clear_modal').classList.remove('active');
		getDOM('fail_modal').classList.remove('active');
	})
})

document.querySelectorAll('.restart_btn').forEach(elm => {
	elm.addEventListener('click', function() {
		getDOM('clear_modal').classList.remove('active');
		getDOM('fail_modal').classList.remove('active');
		const width = minesweeper.width;
		const height = minesweeper.height;
		const bombAmount = minesweeper.bombAmount;
		minesweeper.onDestroy(() => {
			initiate(width, height, bombAmount)
		});
		minesweeper.exit();
	})
})