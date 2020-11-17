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
	minesweeper.onBigdig(function() {
		console.log("BIGDIG STAETED");
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
		minesweeper.status = "ended";
		console.log("game ended");
	});
	minesweeper.onGameFail(function() {
		SE.play('bomb');
		SE.play('tin');
	});
	minesweeper.onGameClear(function() {
		SE.play('win');
	});
	minesweeper.onExit(function() {
		console.log("exited");
	});
}