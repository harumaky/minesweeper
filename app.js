document.addEventListener('DOMContentLoaded', () => {
	const grid = document.getElementById('grid');
	const sel = document.getElementById('selection');
	const sel_mask = document.getElementById('selection_mask');
	const sel_cancel = document.getElementById('sel_cancel');
	const sel_dig = document.getElementById('sel_dig');
	const sel_flag = document.getElementById('sel_flag');
	const sel_unflag = document.getElementById('sel_unflag');

	sel_mask.addEventListener('click', close_select)
	sel_cancel.addEventListener('click', close_select)

	let width = 10;
	let height = 10;
	let bombAmout = 25;

	// 爆弾かそうでないかのboradArrayとフラッグや掘ったといったデータを別に管理し、
	// 描画するときにそれらを合成してhtml elmに落とす
	let boardArray = [] // true -> bomb false -> valid
	let flagArray = [] // true -> flagged
	let diggedArray = [] // true -> digged
	let numsArray = [] // shows the amount of bombs around it

	let isFirst = true; // はじめの一回終わったらfalseに
	let selecting_x = -1;
	let selecting_y = -1;

	function createFirstHTML() {
		if (Math.round(width*height*0.8) < bombAmout) {
			console.error("too many bombs");
			return false;
		}

		let id = 0;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const square = document.createElement('div');
				square.dataset.y = y;
				square.dataset.x = x;
				const className = 'valid';
				square.classList.add(className);
				square.classList.add('square');
				square.setAttribute('id', id);

				square.addEventListener('click', function(e) { click(e) });
				grid.appendChild(square);
				id++;
			}
		}
	}
	createFirstHTML();

	/**
	 * createJSBoard and apply it to HTML
	 * @param {int} x initial x-coordinate
	 * @param {int} y initial y-coordinate
	 */
	function createBoard(init_x, init_y) {
		// 1D array -> shuffle -> 2D array (boardArray)
		// true -> bomb! false -> valid
		const bombsArray = Array(bombAmout).fill(true);
		const emptyArray = Array(width*height - bombAmout).fill(false);

		let oneD_init_idx = width * init_y + init_x;
		let oneD_Array = emptyArray.concat(bombsArray);
		// until the init point is not bomb
		do {
			oneD_Array = oneD_Array.sort(() => Math.random() - 0.5);
		} while (oneD_Array[oneD_init_idx])
		
		// init boradArray and statusArrays, then apply them into HTML
		// init boradArray and statusArrays
		for (let y = 0; y < height; y++) {
			let oneD_startIdx = y * width;
			boardArray[y] = oneD_Array.slice(oneD_startIdx, oneD_startIdx+width);
			flagArray[y] = Array(width).fill(false);
			diggedArray[y] = Array(width).fill(false);
			numsArray[y] = Array(width).fill(9);
		}
		// if around the init point is bomb, flip it
		// !!!!!

		let id = 0
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {			
				
				const square = document.getElementById(id);
				if (boardArray[y][x]) {
					square.classList.remove('valid');
					square.classList.add('bomb');
				}
				id++;
			
			}
		}


		selecting_x = init_x, selecting_y = init_y;
		setNums();
		dig(init_x, init_y);
		showJSArrays();
	}

	function setNums() {
		let id = 0;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (!boardArray[y][x]) {
					let total = 0;
					// out-of-range doesn't increment
					if (y > 0) {
						let line = boardArray[y-1];
						if (line[x-1]) total++;
						if (line[x]) total++;
						if (line[x+1]) total++;
					}
					let line = boardArray[y]
					if (line[x-1]) total++;
					if (line[x+1]) total++;
					if (y < height - 1) {
						let line = boardArray[y+1];
						if (line[x-1]) total++;
						if (line[x]) total++;
						if (line[x+1]) total++;
					}

					numsArray[y][x] = total;
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
	

	function getElmByCoord(x, y) {
		return document.querySelector(`[data-x='${x}'][data-y='${y}']`);
	}

	function updateHTML() {
		let id = 0;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let square = document.getElementById(id);

				if (flagArray[y][x]) square.classList.add('flag');
				else square.classList.remove('flag');

				if (diggedArray[y][x]) square.classList.add('digged');
				// cannot undig
				id++;
			}
		}
	}
	
	function click(e) {
		const x = parseInt(e.target.dataset.x);
		const y = parseInt(e.target.dataset.y);
		if (isFirst) {
			createBoard(x, y);
			isFirst = false;
			return;
		}
		// 掘れる場所が確定して、一気にやる機能はスキップ
		if (diggedArray[y][x]) return;

		selecting(e, x, y);
	}

	function selecting(e, x, y) {
		selecting_x = x;
		selecting_y = y;
		getElmByCoord(x, y).classList.add('selected');

		sel_mask.style.display = 'block';
		sel.style.display = 'block';
		
		// show all options and set all listeners first
		sel_unflag.style.display = 'block';
		sel_flag.style.display = 'block';
		sel_dig.style.display = 'block';
		sel_unflag.addEventListener('click', unflag);
		sel_flag.addEventListener('click', flag);
		sel_dig.addEventListener('click', dig);

		if (flagArray[y][x]) {
			// if flaged, hide flag and dig btn
			sel_flag.style.display = 'none';
			sel_dig.style.display = 'none';
		} else {
			// if not flagged, hide unflag btn
			sel_unflag.style.display = 'none';
		}
	}

	function close_select() {
		getElmByCoord(selecting_x, selecting_y).classList.remove('selected');
		selecting_x = -1;
		selecting_y = -1;
		remove_select_listeners();
		sel.style.display = 'none';
		sel_mask.style.display = 'none'

	}

	function remove_select_listeners() {
		sel_unflag.removeEventListener('click', unflag);
		sel_flag.removeEventListener('click', flag);
		sel_dig.removeEventListener('click', dig);
	}

	function dig() {
		if (boardArray[selecting_y][selecting_x]) {
			gameover();
			return;
		}
		diggedArray[selecting_y][selecting_x] = true;
		updateHTML();

		// digAroundIfPossible
		if (!numsArray[selecting_y][selecting_x]) {
			// only possible when there's no flag around it
			let x = selecting_x
			let y = selecting_y;
			let possible = true;
			if (y > 0) {
				if (flagArray[y-1][x-1] || flagArray[y-1][x] || flagArray[y-1][x]) possible = false;
			}
			if (flagArray[y][x-1] || flagArray[y][x+1]) possible = false;
			if (y < height-1) {
				if (flagArray[y+1][x-1] || flagArray[y+1][x] || flagArray[y+1][x+1]) possible = false;
			}
			if (possible) digAround(x, y);
		}
		close_select();
	}

	function flag() {
		flagArray[selecting_y][selecting_x] = true;
		updateHTML();
		close_select();
	}
	function unflag() {
		flagArray[selecting_y][selecting_x] = false;
		updateHTML();
		close_select();
	}

	function digAround(x, y) {	
		setTimeout(() => {
			loopIfPossible(x-1, y-1);
			loopIfPossible(x, y-1);
			loopIfPossible(x+1, y-1);
			loopIfPossible(x-1, y);
			loopIfPossible(x+1, y);
			loopIfPossible(x-1, y+1);
			loopIfPossible(x, y+1);
			loopIfPossible(x+1, y+1);
			
			if (y > 0) {
				diggedArray[y-1][x-1] = true;
				diggedArray[y-1][x] = true;
				diggedArray[y-1][x+1] = true;
			}
			diggedArray[y][x-1] = true;
			diggedArray[y][x+1] = true;
			if (y < height-1) {
				diggedArray[y+1][x-1] = true;
				diggedArray[y+1][x] = true;
				diggedArray[y+1][x+1] = true;
			}
			updateHTML();
		}, 50);
	}
	function loopIfPossible(x, y) {
		if (x >= 0 && x <= width-1 && y >= 0 && y <= height-1) {
			if (numsArray[y][x] === 0 && !diggedArray[y][x] && !flagArray[y][x]) digAround(x, y);
		}
		return false;
	}

	function gameover() {
		alert('Bomb!');
		restart()
	}

	function restart() {
		boardArray = [];
		flagArray = [];
		diggedArray = [];
		isFirst = true;
		while(grid.firstChild) grid.removeChild(grid.firstChild);
		createFirstHTML()
	}


	function showJSArrays() {
		console.log("board");
		console.log(boardArray);
		console.log("digged");
		console.log(diggedArray);
		console.log("flagged");
		console.log(flagArray);
		console.log("nums");
		console.log(numsArray);
	}

})