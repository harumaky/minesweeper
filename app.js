document.addEventListener('DOMContentLoaded', () => {
	const grid = document.getElementById('grid');
	const sel = document.getElementById('selection');
	const sel_mask = document.getElementById('selection_mask');
	const sel_cancel = document.getElementById('sel_cancel');
	const sel_dig = document.getElementById('sel_dig');
	const sel_flag = document.getElementById('sel_flag');
	const sel_unflag = document.getElementById('sel_unflag');

	let width = 10;
	let height = 10;
	let bombAmout = 20;

	// 爆弾かそうでないかのboradArrayとフラッグや掘ったといったデータを別に管理し、
	// 描画するときにそれらを合成してhtml elmに落とす
	let boardArray = [] // true -> bomb false -> valid
	let flagArray = [] // true -> flagged
	let diggedArray = [] // true -> digged

	let isFirst = true; // はじめの一回終わったらfalseに

	// create board
	function createBoard() {
		// 1D array -> shuffle -> 2D array (boardArray)
		// true -> bomb! false -> valid
		const bombsArray = Array(bombAmout).fill(true);
		const emptyArray = Array(width*height - bombAmout).fill(false);
		let oneD_Array = emptyArray.concat(bombsArray);
		oneD_Array = oneD_Array.sort(() => Math.random() - 0.5);

		// create boardArray
		for (let h = 0; h < height; h++) {
			let oneD_startIdx = h * width;
			boardArray[h] = oneD_Array.slice(oneD_startIdx, oneD_startIdx+width);
		}
		
		// init statusArrays and create html elms
		let id = 0;
		for (let y = 0; y < height; y++) {
			flagArray[y] = Array(width).fill(false);
			diggedArray[y] = Array(width).fill(false);
			for (let x = 0; x < width; x++) {
				const square = document.createElement('div');
				square.dataset.y = y;
				square.dataset.x = x;
				const className = boardArray[y][x] ? 'bomb' : 'valid';
				square.classList.add(className);
				square.setAttribute('id', id);
				square.setAttribute('digged', false)
				square.setAttribute('flag', false)

				square.addEventListener('click', function(e) { click(e) });
				grid.appendChild(square);
				id++;

			}
		}

	}
	createBoard();

	function getElmByCoord(x, y) {
		return document.querySelector(`[data-x='${x}'][data-y='${y}']`);
	}

	function update() {
		// add numbers
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				// display on valid grids
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
	update()

	
	function click(e) {
		const x = e.target.dataset.x;
		const y = e.target.dataset.y;
		if (diggedArray[y][x] || flagArray[y][x]) return;
		selecting(e, x, y);
	}

	function selecting(e, x, y) {
		sel_mask.style.display = 'block';
		sel.style.display = 'block';
		sel_mask.addEventListener('click', cancel_select)
		sel_cancel.addEventListener('click', cancel_select)

		// if flaged, hide flag btn
		if (flagArray[y][x]) sel_flag.style.display = 'none';
		// if digged, hide flag and unflag btn
		if (diggedArray[y][x]) {
			sel_flag.style.display = 'none';
			sel_unflag.style.display = 'none';
		}


	}

	function cancel_select() {
		sel.style.display = 'none';
		sel_mask.style.display = 'none'
	}
})