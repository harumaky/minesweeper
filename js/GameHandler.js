'use strict';
import { getDOM, wait, flatten } from './utils.js';

const elm_ids = ['g_wrap', 'g_field', 'board', 'b_wrap', 'menu', 'sel', 'sel_mask', 'sel_cancel', 'sel_dig', 'sel_flag', 'sel_unflag', 'h_flags', 'h_time'];
let elms = {};
for (let i = 0; i < elm_ids.length; i++) {
	elms[elm_ids[i]] = getDOM(elm_ids[i]);
}

export function gamehandler(minesweeper, SE) {
	minesweeper.onGameStart(function() {
		
	});
	minesweeper.onSelect(function() {
		SE.play('select');
	});
	minesweeper.onCancelSelect(function() {
		SE.play('cancel');
	});
	minesweeper.onUnselect(function() {

	});
	minesweeper.onDig(function() {
		SE.play('dig');
	});
	minesweeper.onBigdig(function() {
		SE.play('bigdig');
	});
	minesweeper.onFlag(function() {
		SE.play('flag');
	});
	minesweeper.onUnflag(function() {
		SE.play('unflag');
	});
	minesweeper.onChange(function() {
		let id = 0;
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const square = getDOM(id)
				if (this.flagArray[y][x]) square.classList.add('flag');
				else square.classList.remove('flag');
	
				if (this.diggedArray[y][x]) square.classList.add('digged');
				// cannot undig
				id++;
			}
		}
		const flag_reminder = this.bombAmount - flatten(this.flagArray).filter(e => e).length;
		elms.h_flags.textContent = flag_reminder;
		console.log(this);
	});
	minesweeper.onGameEnd(function() {
		console.log("game ended");
	});
	minesweeper.onGameFail(function() {
		SE.play('bomb');
		SE.play('tin');
		elms.board.classList.add('failed');
		getDOM('fail_result_time').textContent = minesweeper.lastTime;
		wait(500).then(() => {
			getDOM('fail_modal').classList.add('active');
		})
	});
	minesweeper.onGameClear(function() {
		SE.play('win');
		getDOM('clear_result_time').textContent = this.lastTime;
		wait(500).then(() => {
			getDOM('clear_modal').classList.add('active');
		})
	});
	minesweeper.onExit(function() {
		console.log("exited");
	});
	minesweeper.onDestroy(function() {
		console.log("destroyed");
	});
}