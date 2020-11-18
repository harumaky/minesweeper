'use strict';
import { getDOM, wait } from './utils.js';

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
	minesweeper.onRedraw(function() {

	});
	minesweeper.onChange(function() {

	});
	minesweeper.onGameEnd(function() {
		console.log("game ended");
	});
	minesweeper.onGameFail(function() {
		SE.play('bomb');
		SE.play('tin');
		getDOM('fail_result_time').textContent = minesweeper.lastTime;
		wait(500).then(() => {
			getDOM('fail_modal').classList.add('active');
		})
	});
	minesweeper.onGameClear(function() {
		SE.play('win');
		getDOM('clear_result_time').textContent = minesweeper.lastTime;
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