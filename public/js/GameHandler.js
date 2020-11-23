'use strict';
import { socket, SDF, getDOM, wait, flatten, elms, SE, loadStart, loadCompleted, createNotice, isMultiByDOM, openGameConfig, closeGameConfig } from './utils.js';
import { myroom } from './myroom.js';
import { MS } from './MS.js';

const game = new MS();

export async function initiate(type, width, height, bomb, room = {}) {
	// decide #g_field size
	// client window size (c_) = #screen 's height, not window.height
	elms.lobby.classList.remove('active');
	loadStart();
	await wait(1000);
	elms.g_wrap.classList.add('active');

	const c_width = elms.screen.clientWidth;
	const c_height = elms.screen.clientHeight;

	let style; // layoutstyle
	if (c_width < c_height && c_width < 1024) {
		style = "A";
		if (c_width < 1024 && width > height) {
			createNotice('レイアウト調整のため指定した幅と高さが反転しました');
			[width, height] = [height, width];
		}
	} else if (width > height) {
		style = "B";
	} else if (width <= height) {
		style = "C";
	} else {
		style = "A"; // とりあえず
	}
	// if (!style) {
	// 	createNotice('画面の条件が満たされていないため開始できませんでした');
	// 	return;
	// }

	elms.g_wrap.classList.add(`style_${style}`);
	elms.g_field.classList.add(`style_${style}`);
	elms.b_wrap.classList.add(`style_${style}`);
	elms.board.classList.add(`style_${style}`);
	elms.menu.classList.add(`style_${style}`);

	elms.g_wrap.classList.add(`type_${type}`);
	elms.g_field.classList.add(`type_${type}`);
	elms.b_wrap.classList.add(`type_${type}`);
	elms.board.classList.add(`type_${type}`);
	elms.menu.classList.add(`type_${type}`);

	const field_w = elms.g_field.clientWidth;
	const field_h = elms.g_field.clientHeight;
	const squareSize = Math.min(Math.floor(field_w/width), Math.floor((field_h-50)/height));

	elms.board.style.width = squareSize * width + 'px';
	elms.board.style.height = squareSize * height + 'px';
	elms.b_wrap.style.height = squareSize * height + 50 + 'px';

	game.onInit(function() {
		console.log(`playcount: ${this.playcount}`);
		loadCompleted();
		console.log(this);
		gamehandler(this);
	});
	
	game.init(width, height, bomb, squareSize, style, type, room);

}


function gamehandler(game) {
	const isMulti = game.type === 'multi';
	game.onGameStart(function() {
		if (isMulti) {
			const data = {
				id: game.room.id,
				board: game.boardArray,
				nums: game.numsArray,
				width: game.width, // デバイスによって相手は反転しているかも
				height: game.height
			}
			socket.emit('game firstdata', data);
		}
	});
	game.onSelect(function() {
		SE.play('select');
	});
	game.onCancelSelect(function() {
		SE.play('cancel');
	});
	game.onUnselect(function() {

	});
	game.onDig(function() {
		SE.play('dig');
	});
	game.onBigdigStart(function() {
		SE.play('bigdig');
	});
	// game.onBigdigEnd(function() {
	// 	console.log('end bigdig');
	// });
	game.onFlag(function() {
		SE.play('flag');
	});
	game.onUnflag(function() {
		SE.play('unflag');
	});
	game.onChange(function() {
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
		if (isMulti) {
			const data = {
				id: game.room.id,
				board: game.boardArray,
				digged: game.diggedArray,
				flag: game.flagArray,
				flag_reminder: flag_reminder
			}
			socket.emit('board change', data);
		}
	});
	game.onGameEnd(function() {
		console.log("game ended");
	});
	game.onGameFail(function() {
		SE.play('bomb');
		SE.play('tin');
		elms.board.classList.add('failed');
		getDOM('fail_result_time').textContent = game.lastTime;
		wait(500).then(() => {
			getDOM('fail_modal').classList.add('active');
		})
	});
	game.onGameClear(function() {
		SE.play('win');
		getDOM('clear_result_time').textContent = this.lastTime;
		wait(500).then(() => {
			getDOM('clear_modal').classList.add('active');
		})
	});
	game.onExit(function() {
		console.log("exited");
	});
	game.onDestroy(function() {
		console.log("destroyed");
		console.log(this);
	});
}

socket.on('opp firstdata', (data) => {
	const isOwner = game.room.id === socket.id;
	const oppname = isOwner ? game.room.player : game.room.owner;
	elms.opp_name.textContent = oppname;
	elms.opp_width.textContent = data.width;
	elms.opp_height.textContent = data.height;
	game.opp_width = data.width;
	game.opp_height = data.height

	createOppBoard(data);
	elms.opp_waiting.classList.remove('active');
	elms.opp.classList.add('active');
});
socket.on('opp change', (data) => {
	console.log('opponent changed board');
	console.log(data);
	updateOppBoard(data) 
});


function createOppBoard(data) {
	const W = data.width;
	const H = data.height;
	const field_w = elms.screen.clientWidth;
	const field_h = elms.screen.clientHeight;
	const squareSize = Math.min(Math.floor(field_w/W), Math.floor((field_h-50)/H));

	elms.opp_board.style.width = squareSize * W + 'px';
	elms.opp_board.style.height = squareSize * H + 'px';
	elms.opp_wrap.style.width = squareSize * W + 'px';
	elms.opp_wrap.style.height = squareSize * H + 50 + 'px';

	let id = 0;
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const square = document.createElement('div');
			square.dataset.y = y;
			square.dataset.x = x;

			square.style.width = squareSize + 'px';
			square.style.height = squareSize + 'px';
			square.style.lineHeight = squareSize + 'px';
			square.style.fontSize = squareSize / 2 + 10 + 'px';

			square.classList.add('square');
			const className = data.board[y][x] ? 'bomb' : 'valid';
			square.classList.add(className);
			square.setAttribute('id', `opp_${id}`);

			const total = data.nums[y][x]
			if (total === 0) {
				square.classList.add('zero');
			}
			square.setAttribute('data-num', total);
	
			elms.opp_board.appendChild(square);
			id++;
		}
	}
	elms.opp_flags.textContent = game.bombAmount;
}

function updateOppBoard(data) {
	let id = 0;
	for (let y = 0; y < game.opp_height; y++) {
		for (let x = 0; x < game.opp_width; x++) {
			const square = getDOM(`opp_${id}`);
			if (data.flag[y][x]) square.classList.add('flag');
			else square.classList.remove('flag');

			if (data.digged[y][x]) square.classList.add('digged');
			// cannot undig
			id++;
		}
	}
	elms.opp_flags.textContent =data.flag_reminder;
}


SDF('exit_btn', 'click', exit)
function exit() {
	game.exit();
	elms.g_wrap.classList.remove('active');
	if (game.type === 'multi') {
		closeGameConfig('multi');
	} else {
		closeGameConfig('solo');
	}

	elms.menu.classList.remove('active');
	elms.lobby.classList.add('active');
}

document.querySelectorAll('.close_result_modal').forEach(elm => {
	elm.addEventListener('click', () => {
		getDOM('clear_modal').classList.remove('active');
		getDOM('fail_modal').classList.remove('active');
	});
});

document.querySelectorAll('.restart_btn').forEach(elm => {
	elm.addEventListener('click', function() {
		getDOM('clear_modal').classList.remove('active');
		getDOM('fail_modal').classList.remove('active');
		getDOM('loading_wrap').classList.remove('slideout');
		const width = game.width;
		const height = game.height;
		const bombAmount = game.bombAmount;
		game.onDestroy(() => {
			initiate('solo', width, height, bombAmount)
		});
		game.exit();
	})
});
