'use strict';
import { SDF, getDOM, wait, flatten, elms, SE, loadStart, loadCompleted } from './utils.js';
import { myroom } from './myroom.js';
import { MS } from './MS.js';

const game = new MS();

export async function initiate(type, width, height, bomb) {
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
	elms.menu.classList.add(`type_${style}`);

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
		gamehandler(this, type);
	});
	
	game.init(width, height, bomb, squareSize, style, type);

}

function gamehandler(game, type) {
	game.onGameStart(function() {
		
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
	game.onBigdig(function() {
		SE.play('bigdig');
	});
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
		console.log(this);
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
	});
}



SDF('exit_btn', 'click', exit)
function exit() {
	game.exit();
	elms.g_wrap.classList.remove('active');
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
