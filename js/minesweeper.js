'use strict';
import { EventEmitter } from './EventEmitter.js';
import { shuffle, flatten, getElmByCoord } from './utils.js';

const elm_ids = ['grid', 'sel', 'sel_mask', 'sel_cancel', 'sel_dig', 'sel_flag', 'sel_unflag', 'h_flags', 'h_time'];
let elms = {};
for (let i = 0; i < elm_ids.length; i++) {
	elms[elm_ids[i]] = document.getElementById(elm_ids[i]);
}

export class Minesweeper extends EventEmitter {
	/**
	 * @param {DOMElement} elms
	 * @param {Number} width 
	 * @param {Number} height 
	 * @param {Number} bombAmount 
	 */
	constructor(width, height, bombAmount, squareSize) {
		super();
		elms = elms;
		this.width = width;
		this.height = height;
		this.bombAmount = bombAmount;
		this.squareSize = squareSize;
	}

	init() {
		/* 爆弾かそうでないかのboradArrayとフラッグや掘ったといったデータを別に管理し、描画するときにそれらを合成してhtml elmに落とす */
		this.boardArray = []; // true -> bomb false -> valid
		this.flagArray = []; // true -> flagged
		this.diggedArray = []; // true -> digged
		this.numsArray = []; // shows the amount of bombs around it

		this.isFirst = true; // はじめの一回終わったらfalseに
		this.sel_x = -1;
		this.sel_y = -1;
		elms.sel_mask.addEventListener('click', this.cancelSelect.bind(this));
		elms.sel_cancel.addEventListener('click', this.cancelSelect.bind(this));
		elms.sel_unflag.addEventListener('click', this.unflag.bind(this));
		elms.sel_flag.addEventListener('click', this.flag.bind(this));
		elms.sel_dig.addEventListener('click', this.dig.bind(this));

		// Create first HTML
		let id = 0;
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const square = document.createElement('div');
				square.dataset.y = y;
				square.dataset.x = x;

				square.style.width = this.squareSize + 'px';
				square.style.height = this.squareSize + 'px';
				square.style.lineHeight = this.squareSize + 'px';
				square.style.fontSize = this.squareSize / 2 + 10 + 'px';


				const className = 'valid';
				square.classList.add(className);
				square.classList.add('square');
				square.setAttribute('id', id);
	
				square.addEventListener('click', this.click.bind(this));
				elms.grid.appendChild(square);
				id++;
			}
		}
		elms.h_flags.textContent = this.bombAmount;
		this.emit('initialized');
	}


	/**
	 * createJSBoard and apply it to HTML
	 * @param {int} x initial x-coordinate
	 * @param {int} y initial y-coordinate
	 */
	createBoard(init_x, init_y) {
		// 1D array -> shuffle -> 2D array (boardArray)
		// true -> bomb! false -> valid
		const init_idx = this.width * init_y + init_x;
		const noLeft = init_idx % this.width === 0;
		const noRight = (init_idx + 1) % this.width === 0;
		const xEdge = noLeft || noRight;
		const noAbove = init_idx < this.width;
		const noBelow = this.height*this.width - init_idx <= this.width;
		const yEdge = noAbove || noBelow; 
		let safe_amount = 9;
		if (xEdge) safe_amount-= 3;
		if (yEdge) safe_amount-= 3;
		if (xEdge && yEdge) safe_amount++;

		const bombsArray = Array(this.bombAmount).fill(true);
		const emptyArray = Array(this.width*this.height - this.bombAmount - safe_amount).fill(false);
		
		let oneD_Array = emptyArray.concat(bombsArray);
		oneD_Array = shuffle(oneD_Array);
		
		// init boradArray and statusArrays, then apply them into HTML
		for (let y = 0; y < this.height; y++) {
			this.boardArray[y] = Array(this.width).fill(false);
			this.flagArray[y] = Array(this.width).fill(false);
			this.diggedArray[y] = Array(this.width).fill(false);
			this.numsArray[y] = Array(this.width).fill(9);
			for (let x = 0; x < this.width; x++) {
				let oneD_idx = this.width * y + x;
				if (
					oneD_idx === init_idx ||
					(!noLeft && oneD_idx === init_idx - 1) ||
					(!noRight && oneD_idx === init_idx + 1) ||
					(!noAbove && oneD_idx === init_idx - this.width) ||
					(!noBelow && oneD_idx === init_idx + this.width) ||
					(!noLeft && !noAbove && oneD_idx === init_idx - this.width - 1) ||
					(!noRight && !noAbove && oneD_idx === init_idx - this.width + 1) ||
					(!noLeft && !noBelow && oneD_idx === init_idx + this.width - 1) ||
					(!noRight && !noBelow && oneD_idx === init_idx + this.width + 1)
					) 
				{
					this.boardArray[y][x] = false;
					continue;
				}
				this.boardArray[y][x] = oneD_Array[oneD_idx];
			}

		}
		// if around the init point is bomb, flip it
		// !!!!!

		let id = 0
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {			
				const square = document.getElementById(id);
				if (this.boardArray[y][x]) {
					square.classList.remove('valid');
					square.classList.add('bomb');
				}
				id++;
			}
		}
		this.sel_x = init_x, this.sel_y = init_y;
		this.setNums();
		this.dig();

		this.startTime = Date.now();
		this.elapsed = 0;
		this.timer_count();
		this.emit('started');
	}

 	setNums() {
		let id = 0;
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (!this.boardArray[y][x]) {
					let total = 0;
					// out-of-range doesn't increment
					if (y > 0) {
						let line = this.boardArray[y-1];
						if (line[x-1]) total++;
						if (line[x]) total++;
						if (line[x+1]) total++;
					}
					let line = this.boardArray[y]
					if (line[x-1]) total++;
					if (line[x+1]) total++;
					if (y < this.height - 1) {
						let line = this.boardArray[y+1];
						if (line[x-1]) total++;
						if (line[x]) total++;
						if (line[x+1]) total++;
					}
	
					this.numsArray[y][x] = total;
					const square = document.getElementById(id);
					if (total === 0) {
						square.classList.add('zero');
					}
					square.setAttribute('data-num', total);
				}
				id++;
			}
		}
	}

	redraw() {
		this.emit('changed');
		let id = 0;
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const square = document.getElementById(id);
	
				if (this.flagArray[y][x]) square.classList.add('flag');
				else square.classList.remove('flag');
	
				if (this.diggedArray[y][x]) square.classList.add('digged');
				// cannot undig
				id++;
			}
		}
		const flag_reminder = this.bombAmount - flatten(this.flagArray).filter(e => e).length;
		elms.h_flags.textContent = flag_reminder;
		this.emit('redrew');
	}

	click(e) {
		const x = parseInt(e.target.dataset.x);
		const y = parseInt(e.target.dataset.y);
		if (this.isFirst) {
			this.isFirst = false;
			this.createBoard(x, y);
			return;
		}
		// 掘れる場所が確定して、一気にやる機能はスキップ
		if (this.diggedArray[y][x]) return;

		this.select(e, x, y);
	}

	select(e, x, y) {
		this.sel_x = x;
		this.sel_y = y;
		getElmByCoord(x, y).classList.add('selected');
	
		elms.sel_mask.style.display = 'block';
		elms.sel.style.display = 'block';
		
		// show all options and set all listeners first
		elms.sel_unflag.style.display = 'block';
		elms.sel_flag.style.display = 'block';
		elms.sel_dig.style.display = 'block';
	
		if (this.flagArray[y][x]) {
			// if flaged, hide flag and dig btn
			elms.sel_flag.style.display = 'none';
			elms.sel_dig.style.display = 'none';
		} else {
			// if not flagged, hide unflag btn
			elms.sel_unflag.style.display = 'none';
		}

		this.emit('selected');
	}	
	
	dig() {
		if (this.boardArray[this.sel_y][this.sel_x]) {
			this.gameFail();
			return;
		}

		this.diggedArray[this.sel_y][this.sel_x] = true;
		this.emit('digged');
		this.redraw();
		this.checkGame();
	
		// digAroundIfPossible
		if (this.numsArray[this.sel_y][this.sel_x] === 0) {
			// only possible when there's no flag around it
			let x = this.sel_x;
			let y = this.sel_y;
			let possible = true;
			if (y > 0) {
				if (this.flagArray[y-1][x-1] || this.flagArray[y-1][x] || this.flagArray[y-1][x]) possible = false;
			}
			if (this.flagArray[y][x-1] || this.flagArray[y][x+1]) possible = false;
			if (y < this.height-1) {
				if (this.flagArray[y+1][x-1] || this.flagArray[y+1][x] || this.flagArray[y+1][x+1]) possible = false;
			}
			if (possible) {
				this.digAround(x, y);
				this.emit('bigdigged');
			}
		}
		this.unselect();
	}

	digAround(x, y) {	
		setTimeout(() => {
			this.loopIfPossible(x-1, y-1);
			this.loopIfPossible(x, y-1);
			this.loopIfPossible(x+1, y-1);
			this.loopIfPossible(x-1, y);
			this.loopIfPossible(x+1, y);
			this.loopIfPossible(x-1, y+1);
			this.loopIfPossible(x, y+1);
			this.loopIfPossible(x+1, y+1);
			
			if (y > 0) {
				if (x > 0) this.diggedArray[y-1][x-1] = true;
				this.diggedArray[y-1][x] = true;
				if (x < this.width-1) this.diggedArray[y-1][x+1] = true;
			}
			if (x > 0) this.diggedArray[y][x-1] = true;
			if (x < this.width-1) this.diggedArray[y][x+1] = true;
			if (y < this.height-1) {
				if (x < 0) this.diggedArray[y+1][x-1] = true;
				this.diggedArray[y+1][x] = true;
				if (x < this.width-1) this.diggedArray[y+1][x+1] = true;
			}
			this.redraw();
			this.checkGame();
		}, 50);
	}

	loopIfPossible(x, y) {
		if (x >= 0 && x <= this.width-1 && y >= 0 && y <= this.height-1) {
			if (this.numsArray[y][x] === 0 && !this.diggedArray[y][x] && !this.flagArray[y][x]) this.digAround(x, y);
		}
		return false;
	}

	flag() {
		this.flagArray[this.sel_y][this.sel_x] = true;
		this.emit('flagged');
		this.redraw();
		this.unselect();
	}
	unflag() {
		this.flagArray[this.sel_y][this.sel_x] = false;
		this.emit('unflagged');
		this.redraw();
		this.unselect();
	}

	cancelSelect() {
		this.emit('selectCaneled');
		this.unselect();
	}
	unselect() {
		getElmByCoord(this.sel_x, this.sel_y).classList.remove('selected');
		sel.style.display = 'none';
		sel_mask.style.display = 'none'
		this.sel_x = -1;
		this.sel_y = -1;
		this.emit('unselected');
	}

	checkGame() {
		const digged_amount = flatten(this.diggedArray).filter(e => e).length;
		console.log(digged_amount);
		if (digged_amount === this.width*this.height - this.bombAmount) this.gameClear();
	}
	
	gameClear() {
		this.emit('cleared');
		console.log('clear!');
	}
	
	gameFail() {
		this.unselect();
		this.emit('failed');
	}

	/* timer */
	timer_count() {
		const self = this;
		this.timerId = setTimeout(function() {
			self.elapsed = Date.now() - self.startTime;
			let min = Math.floor(self.elapsed / 60000);
			let sec = Math.floor(self.elapsed % 60000 / 1000);
			min = ('0' + min).slice(-2);
			sec = ('0' + sec).slice(-2);
			
			elm.h_time.textContent = `${min}:${sec}`;

			self.timer_count();
		}, 1000);
	}


	/* Events */
	onInit(listener) {
		this.addEventListener('initialized', listener);
	}
	onGameStart(listener) {
		this.addEventListener('started', listener);
	}
	onSelect(listener) {
		this.addEventListener('selected', listener);
	}
	onCancelSelect(listener) {
		this.addEventListener('selectCanceled', listener);
	}
	onUnselect(listener) {
		this.addEventListener('unselected', listener);
	}
	onDig(listener) {
		this.addEventListener('digged', listener);
	}
	onBigDig(listener) {
		this.addEventListener('bigdigged', listener);
	}
	onFlag(listener) {
		this.addEventListener('flagged', listener);
	}
	onUnflag(listener) {
		this.addEventListener('unflagged', listener);
	}
	onRedraw(listener) {
		this.addEventListener('redrew', listener);
	}
	onChange(listener) {
		this.addEventListener('changed', listener);
	}
	onGameFail(listener) { // === bombed
		this.addEventListener('failed', listener);
	}
	onGameClear(listener) {
		this.addEventListener('cleared', listener);
	}
	onGameEnd(listener) {
		this.addEventListener('ended', listener);
	}


	showJSArrays() {
		console.log("board");
		console.log(this.boardArray);
		console.log("digged");
		console.log(this.diggedArray);
		console.log("flagged");
		console.log(this.flagArray);
		console.log("nums");
		console.log(this.numsArray);
	}
	
}