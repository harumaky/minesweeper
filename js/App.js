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
	// client window size (c_)
	const c_width = window.innerWidth;
	const c_height = window.innerHeight - 50; // 30px for header
	const field = document.getElementById('gamefield');

	let squareSize = Math.min(Math.floor(c_width/width), Math.floor(c_height/height));

	field.style.width = squareSize * width + 'px';
	field.style.height = squareSize * height + 50 + 'px';

	minesweeper = new Minesweeper(width, height, bomb, squareSize);
	minesweeper.onInit(function() {
		gamehandler(this, SE);
	})
	minesweeper.init();

	const gameWrap = document.getElementById('gamewrap');
	gameWrap.style.display = 'flex';
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