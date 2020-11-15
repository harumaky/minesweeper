'use strict';

export class Game {
	/**
	 * 
	 * @param {HTMLElement} elms
	 * @param {Number} width 
	 * @param {Number} height 
	 * @param {Number} bombAmount 
	 */
	constructor(elms, width, height, bombAmount, squareSize) {
		this.elm = elms;
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
		this.elm.sel_mask.addEventListener('click', this.cancel_select.bind(this));
		this.elm.sel_cancel.addEventListener('click', this.cancel_select.bind(this));
		this.elm.sel_unflag.addEventListener('click', this.unflag.bind(this));
		this.elm.sel_flag.addEventListener('click', this.flag.bind(this));
		this.elm.sel_dig.addEventListener('click', this.dig.bind(this));

		this.createFirstHTML();
	}

	restart() {
		while(grid.firstChild) grid.removeChild(grid.firstChild);
		clearTimeout(this.timerId);
		this.init();
	}

	createFirstHTML() {
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
				this.elm.grid.appendChild(square);
				id++;
			}
		}
		this.elm.h_flags.textContent = this.bombAmount;
	}

	/**
	 * createJSBoard and apply it to HTML
	 * @param {int} x initial x-coordinate
	 * @param {int} y initial y-coordinate
	 */
	createBoard(init_x, init_y) {
		// 1D array -> shuffle -> 2D array (boardArray)
		// true -> bomb! false -> valid
		const bombsArray = Array(this.bombAmount).fill(true);
		const emptyArray = Array(this.width*this.height - this.bombAmount).fill(false);

		let oneD_init_idx = this.width * init_y + init_x;
		let oneD_Array = emptyArray.concat(bombsArray);
		// until the init point is not bomb
		do {
			oneD_Array = oneD_Array.sort(() => Math.random() - 0.5);
		} while (oneD_Array[oneD_init_idx])
		
		// init boradArray and statusArrays, then apply them into HTML
		for (let y = 0; y < this.height; y++) {
			let oneD_startIdx = y * this.width;
			this.boardArray[y] = oneD_Array.slice(oneD_startIdx, oneD_startIdx+this.width);
			this.flagArray[y] = Array(this.width).fill(false);
			this.diggedArray[y] = Array(this.width).fill(false);
			this.numsArray[y] = Array(this.width).fill(9);
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

	updateHTML() {
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
		const flag_reminder = this.bombAmount - this.flatten(this.flagArray).filter(e => e).length;
		this.elm.h_flags.textContent = flag_reminder;
		this.showJSArrays();
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
		this.getElmByCoord(x, y).classList.add('selected');
	
		this.elm.sel_mask.style.display = 'block';
		this.elm.sel.style.display = 'block';
	
		const m_open = new Audio('./sound/open.mp3');
		m_open.volume = 0.3;
		m_open.play();
		
		// show all options and set all listeners first
		this.elm.sel_unflag.style.display = 'block';
		this.elm.sel_flag.style.display = 'block';
		this.elm.sel_dig.style.display = 'block';
	
		if (this.flagArray[y][x]) {
			// if flaged, hide flag and dig btn
			this.elm.sel_flag.style.display = 'none';
			this.elm.sel_dig.style.display = 'none';
		} else {
			// if not flagged, hide unflag btn
			this.elm.sel_unflag.style.display = 'none';
		}
	}	
	
	dig() {
		if (this.boardArray[this.sel_y][this.sel_x]) {
			this.gameover();
			return;
		}
		this.diggedArray[this.sel_y][this.sel_x] = true;
		let m_dig = new Audio('./sound/dig.mp3');
		m_dig.play();
		this.updateHTML();
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
			if (possible) this.digAround(x, y);
		}
		this.close_select();
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
			this.updateHTML();
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
		const m_flag = new Audio('./sound/flag.mp3');
		m_flag.play();
		this.updateHTML();
		this.close_select();
	}
	unflag() {
		this.flagArray[this.sel_y][this.sel_x] = false;
		const m_unflag = new Audio('./sound/unflag.mp3');
		m_unflag.volume = 0.3
		m_unflag.play();
		this.updateHTML();
		this.close_select();
	}

	cancel_select() {
		const m_cancel = new Audio('./sound/cancel.mp3');
		m_cancel.volume = 0.4;
		m_cancel.play();
		this.close_select();
	}
	close_select() {
		// this.remove_select_listeners();
		this.getElmByCoord(this.sel_x, this.sel_y).classList.remove('selected');
		sel.style.display = 'none';
		sel_mask.style.display = 'none'
		this.sel_x = -1;
		this.sel_y = -1;
	}

	checkGame() {
		const digged_amount = this.flatten(this.diggedArray).filter(e => e).length;
		console.log(digged_amount);
		if (digged_amount === this.width*this.height - this.bombAmount) this.gameClear();
	}
	
	gameClear() {
		const m_clear = new Audio('./sound/win.mp3');
		m_clear.play();
		alert('wwww');
		this.restart();
	}
	
	gameover() {
		this.close_select();
		const m_bomb = new Audio('./sound/bomb.mp3');
		m_bomb.volume = 0.6;
		m_bomb.addEventListener('ended', function() {
			const m_tin = new Audio('./sound/tin.mp3');
			m_tin.play();
		})
		m_bomb.play();
	
		this.restart();
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
			
			self.elm.h_time.textContent = `${min}:${sec}`;

			self.timer_count();
		}, 1000);
	}

	/* utils */

	getElmByCoord(x, y) {
		return document.querySelector(`[data-x='${x}'][data-y='${y}']`);
	}

	flatten(data) {
		return data.reduce((acm, e) => Array.isArray(e) ? acm.concat(this.flatten(e)) : acm.concat(e), []);
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