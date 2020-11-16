'use strict';

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
	minesweeper.onBigDig(function() {
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
	minesweeper.onGameFail(function() {
		SE.play('bomb');
		SE.play('tin');
	});
	minesweeper.onGameClear(function() {
		SE.play('win');
	});
	minesweeper.onGameEnd(function() {

	});
}