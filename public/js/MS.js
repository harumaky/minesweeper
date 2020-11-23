'use strict';
import { EventEmitter } from './EventEmitter.js';
import { shuffle, flatten, getElmByCoord, setStyleSquare, setTopLeft, getDOM, elms} from './utils.js';

export class MS extends EventEmitter {
	constructor() {
		super();
		this.playcount = 0;
	}
	
	/**
	 * @param {Number} width 
	 * @param {Number} height 
	 * @param {Number} bombAmount 
	 * @param {Number} squareSize 
	 * @param {String} style screen style (A/B/C)
	 * @param {String} type solo or multi
	 */
	init(width, height, bombAmount, squareSize, style, type) {
		if (this.status === "ongame") return;
		this.playcount++;

		this.width = width;
		this.height = height;
		this.bombAmount = bombAmount;
		this.squareSize = squareSize;
		this.style = style;
		this.type = type;

		this.boardArray = []; // true -> bomb false -> valid
		this.flagArray = []; // true -> flagged
		this.diggedArray = []; // true -> digged
		this.numsArray = []; // shows the amount of bombs around it

		this.isFirst = true; // はじめの一回終わったらfalseに
		this.status = "ongame";
		this.sel_x = -1;
		this.sel_y = -1;

		// bf binded function
		this.bf_cancelSelect = this.cancelSelect.bind(this);
		this.bf_unflag = this.unflag.bind(this);
		this.bf_flag = this.flag.bind(this);
		this.bf_dig = this.dig.bind(this);
		this.bf_click = this.click.bind(this);
		elms.sel_mask.addEventListener('click', this.bf_cancelSelect);
		elms.sel_cancel.addEventListener('click', this.bf_cancelSelect);
		elms.sel_unflag.addEventListener('click', this.bf_unflag);
		elms.sel_flag.addEventListener('click', this.bf_flag);
		elms.sel_dig.addEventListener('click', this.bf_dig);

		// Create first HTML
		let id = 0;
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const square = document.createElement('div');
				square.dataset.y = y;
				square.dataset.x = x;
				square.dataset.playcount = this.playcount;

				square.style.width = this.squareSize + 'px';
				square.style.height = this.squareSize + 'px';
				square.style.lineHeight = this.squareSize + 'px';
				square.style.fontSize = this.squareSize / 2 + 10 + 'px';

				const className = 'valid';
				square.classList.add(className);
				square.classList.add('square');
				square.setAttribute('id', id);
	
				square.addEventListener('click', this.bf_click);
				elms.board.appendChild(square);
				id++;
			}
		}
		elms.h_flags.textContent = this.bombAmount;

		setStyleSquare(elms.sel_cancel, Math.round(this.squareSize * 0.8));
		setStyleSquare(elms.sel_dig, Math.round(this.squareSize * 1.2));
		setStyleSquare(elms.sel_flag, Math.round(this.squareSize * 1.2));
		setStyleSquare(elms.sel_unflag, Math.round(this.squareSize * 1.2));

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

		let oneD_idx = 0;
		for (let y = 0; y < this.height; y++) {
			this.boardArray[y] = Array(this.width).fill(false);
			this.flagArray[y] = Array(this.width).fill(false);
			this.diggedArray[y] = Array(this.width).fill(false);
			this.numsArray[y] = Array(this.width).fill(9);
			for (let x = 0; x < this.width; x++) {
				let oneD_pointer = this.width * y + x;
				if (
					oneD_pointer === init_idx ||
					(!noLeft && oneD_pointer === init_idx - 1) ||
					(!noRight && oneD_pointer === init_idx + 1) ||
					(!noAbove && oneD_pointer === init_idx - this.width) ||
					(!noBelow && oneD_pointer === init_idx + this.width) ||
					(!noLeft && !noAbove && oneD_pointer === init_idx - this.width - 1) ||
					(!noRight && !noAbove && oneD_pointer === init_idx - this.width + 1) ||
					(!noLeft && !noBelow && oneD_pointer === init_idx + this.width - 1) ||
					(!noRight && !noBelow && oneD_pointer === init_idx + this.width + 1)
					) 
				{
					// 初期周囲点の場合のboardArrayはデフォルトのfalse
					continue;
				}
				this.boardArray[y][x] = oneD_Array[oneD_idx];
				oneD_idx++;
			}
		}

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

	click(e) {
		if (this.status === "ended") return;
		const x = parseInt(e.target.dataset.x);
		const y = parseInt(e.target.dataset.y);

		if (this.isFirst) {
			this.isFirst = false;
			this.createBoard(x, y);
			return;
		}
		// 掘れる場所が確定して、一気にやる機能はスキップ
		if (this.diggedArray[y][x]) return;

		this.select(x, y);
	}

	select(x, y) {
		this.sel_x = x;
		this.sel_y = y;

		const square = getElmByCoord(x, y);
		square.classList.add('selected');
		const base = square.getBoundingClientRect();
		const size = this.squareSize;

		elms.sel_mask.style.display = 'block';
		elms.sel.style.display = 'block';
				
		// show all options and set all listeners first
		elms.sel_unflag.style.display = 'block';
		elms.sel_flag.style.display = 'block';
		elms.sel_dig.style.display = 'block';

		setTopLeft(elms.sel_cancel, base.top - size, base.left - size)
		setTopLeft(elms.sel_dig, base.top - size, base.left)
		setTopLeft(elms.sel_flag, base.top, base.left - size);
		setTopLeft(elms.sel_unflag, base.top, base.left - size);

		const isLeft = x === 0 || x === 1;
		const isTop = y === 0 || y === 1;

		if (isTop && isLeft) {
			setTopLeft(elms.sel_cancel, base.top + size*1.3, base.left + size*1.3)
			setTopLeft(elms.sel_dig, base.top + size*1.2, base.left)
			setTopLeft(elms.sel_flag, base.top, base.left + size*1.2);
			setTopLeft(elms.sel_unflag, base.top, base.left + size*1.2);
		} else if (isTop) {
			setTopLeft(elms.sel_cancel, base.top + size*1.3, base.left - size)
			setTopLeft(elms.sel_dig, base.top + size*1.2, base.left)
			setTopLeft(elms.sel_flag, base.top, base.left - size);
			setTopLeft(elms.sel_unflag, base.top, base.left- size);
		} else if (isLeft) {
			setTopLeft(elms.sel_cancel, base.top - size, base.left + size*1.3)
			setTopLeft(elms.sel_dig, base.top - size, base.left)
			setTopLeft(elms.sel_flag, base.top, base.left + size*1.2);
			setTopLeft(elms.sel_unflag, base.top, base.left + size*1.2);
		}

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
		let x = this.sel_x;
		let y = this.sel_y;
		if (this.boardArray[y][x]) {
			this.gameEnd('fail')
			return;
		}

		// check whether bigdig is possible
		// if not, just one dig

		// digAroundIfPossible
		let bigdigPossible = this.numsArray[y][x] === 0;
		if (bigdigPossible) {
			// only possible when there's no flag around it
			if (y > 0) {
				if (this.flagArray[y-1][x-1] || this.flagArray[y-1][x] || this.flagArray[y-1][x]) bigdigPossible = false;
			}
			if (this.flagArray[y][x-1] || this.flagArray[y][x+1]) bigdigPossible = false;
			if (y < this.height-1) {
				if (this.flagArray[y+1][x-1] || this.flagArray[y+1][x] || this.flagArray[y+1][x+1]) bigdigPossible = false;
			}
		}
		
		if (bigdigPossible) {
			this.digAround(x, y);
			this.emit('bigdiged');
		} else {
			this.diggedArray[y][x] = true;
			this.emit('digged');
			this.emit('changed');
			this.checkGame();
		}

		this.unselect();
	}

	digAround(x, y) {
		if (this.status === "ended") return;
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
			this.emit('changed');
			this.checkGame();
		}, 10);
		
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
		this.emit('changed');
		this.checkGame()
		this.unselect();
	}
	unflag() {
		this.flagArray[this.sel_y][this.sel_x] = false;
		this.emit('unflagged');
		this.emit('changed');
		this.checkGame();
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
		if (this.status === 'ended') return;
		const digged_amount = flatten(this.diggedArray).filter(e => e).length;
		const flag_amount = flatten(this.flagArray).filter(e => e).length;
		if (digged_amount === this.width*this.height - this.bombAmount) {
			this.gameEnd('clear');
		}
	}

	gameEnd(result) {
		this.status = "ended";
		this.lastTime = elms.h_time.textContent;
		this.emit('ended');
		clearTimeout(this.timerId);

		if (result === 'clear') {
			this.gameClear();
		} else if (result === 'fail') {
			this.gameFail();
		} else {
			return;
		}
	}
	
	gameClear() {
		this.emit('cleared');
	}
	
	gameFail() {
		this.unselect();
		this.emit('failed');
	}

	exit() {
		this.emit('exited');
		this.destroy();
	}

	destroy() {
		elms.sel_mask.removeEventListener('click', this.bf_cancelSelect);
		elms.sel_cancel.removeEventListener('click', this.bf_cancelSelect);
		elms.sel_unflag.removeEventListener('click', this.bf_unflag);
		elms.sel_flag.removeEventListener('click', this.bf_flag);
		elms.sel_dig.removeEventListener('click', this.bf_dig);

		while(elms.board.firstChild) {
			const child = elms.board.firstChild;
			child.removeEventListener('click', this.bf_click);
			elms.board.removeChild(child);
		}
		
		elms.board.classList.remove(`failed`);

		elms.g_wrap.classList.remove(`style_${this.style}`);
		elms.g_field.classList.remove(`style_${this.style}`);
		elms.b_wrap.classList.remove(`style_${this.style}`);
		elms.board.classList.remove(`style_${this.style}`);
		elms.menu.classList.remove(`style_${this.style}`);

		elms.g_wrap.classList.remove(`type_${this.type}`);
		elms.g_field.classList.remove(`type_${this.type}`);
		elms.b_wrap.classList.remove(`type_${this.type}`);
		elms.board.classList.remove(`type_${this.type}`);
		elms.menu.classList.remove(`type_${this.type}`);



		elms.h_flags.textContent = 0
		elms.h_time.textContent = `00:00`;



		this.emit('destroyed');
		this.clearAllListeners();
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
			
			elms.h_time.textContent = `${min}:${sec}`;

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
	onBigdig(listener) {
		this.addEventListener('bigdiged', listener);
	}
	onFlag(listener) {
		this.addEventListener('flagged', listener);
	}
	onUnflag(listener) {
		this.addEventListener('unflagged', listener);
	}
	onChange(listener) {
		this.addEventListener('changed', listener);
	}
	onGameEnd(listener) {
		this.addEventListener('ended', listener);
	}
	onGameFail(listener) { // === bombed
		this.addEventListener('failed', listener);
	}
	onGameClear(listener) {
		this.addEventListener('cleared', listener);
	}
	onExit(listener) {
		this.addEventListener('exited', listener);
	}
	onDestroy(listener) {
		this.addEventListener('destroyed', listener);
	}
	
}