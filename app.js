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
	let bombAmout = 30;

	// 爆弾かそうでないかのboradArrayとフラッグや掘ったといったデータを別に管理し、
	// 描画するときにそれらを合成してhtml elmに落とす
	let boardArray = [] // true -> bomb false -> valid
	let flagArray = [] // true -> flagged
	let diggedArray = [] // true -> digged

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
				square.setAttribute('id', id);
				square.setAttribute('data-digged', 'false')
				square.setAttribute('data-flag', 'false')

				square.addEventListener('click', function(e) { click(e) });
				grid.appendChild(square);
				id++;
			}
		}
	}
	createFirstHTML()

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
		let id = 0
		for (let y = 0; y < height; y++) {
			let oneD_startIdx = y * width;
			boardArray[y] = oneD_Array.slice(oneD_startIdx, oneD_startIdx+width);

			flagArray[y] = Array(width).fill(false);
			diggedArray[y] = Array(width).fill(false);
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
		dig(init_x, init_y);
		calc_total();
	}
	

	function getElmByCoord(x, y) {
		return document.querySelector(`[data-x='${x}'][data-y='${y}']`);
	}

	function updateHTML() {
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let square = getElmByCoord(x, y);

				if (flagArray[y][x]) square.setAttribute('data-flag', 'true');
				else square.removeAttribute('data-flag', 'false');

				if (diggedArray[y][x]) square.setAttribute('data-digged', 'true');
				// cannot undig
				
			}
		}
		calc_total()
	}

	function calc_total() {
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (!boardArray[y][x]) {
					let total = 0;
					// out-of-range also doesn't increment
					if (boardArray[y-1] !== undefined) {
						let line = boardArray[y-1];
						if (line[x-1]) total++;
						if (line[x]) total++;
						if (line[x+1]) total++;
					}
					if (boardArray[y] !== undefined) {
						let line = boardArray[y];
						if (line[x-1]) total++;
						if (line[x+1]) total++;
					}
					if (boardArray[y+1] !== undefined) {
						let line = boardArray[y+1];
						if (line[x-1]) total++;
						if (line[x]) total++;
						if (line[x+1]) total++;
					}
					
					const square = getElmByCoord(x, y);
					square.textContent = total
				}
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
		diggedArray[selecting_y][selecting_x] = true;
		close_select()
		if (boardArray[selecting_y][selecting_x]) {
			gameover();
		} else {
			updateHTML();
		}
	}
	function flag() {
		flagArray[selecting_y][selecting_x] = true;
		close_select();
		updateHTML();
	}
	function unflag() {
		flagArray[selecting_y][selecting_x] = false;
		close_select();
		updateHTML();
	}

	function gameover() {
		console.log('Bomb!');
	}


	function showJSArrays() {
		console.log("board");
		console.log(boardArray);
		console.log("digged");
		console.log(diggedArray);
		console.log("flagged");
		console.log(flagArray);
	}

})