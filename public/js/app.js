'use strict';
import { Minesweeper } from './minesweeper.js';
import { SEHandler } from './SEHandler.js';
import { gamehandler } from './GameHandler.js';
import { SDF, getDOM, wait, createNotice, createRoomCard, socket, level_templates, loadCompleted, loadStart, randTextGenerator } from './utils.js';

const minesweeper = new Minesweeper;

const screen = getDOM('screen');
const lobby = getDOM('lobby');
const e_user_number = getDOM('user_number');
const user_form = getDOM('user_form')
const f_username = getDOM('conf_user_name');
const main_options = getDOM('main_options');
const f_solo = getDOM('main_options_solo');
const f_multi = getDOM('main_options_multi');
const room_wrap = getDOM('rooms_wrap');
const waiting = getDOM('waiting_screen');
const ready = getDOM('ready_screen');
const g_config = getDOM('g_config');
const f_width = getDOM('conf_width');
const f_height = getDOM('conf_height');
const f_bomb = getDOM('conf_bomb');

const g_wrap = getDOM('g_wrap');
const g_field = getDOM('g_field');
const b_wrap = getDOM('b_wrap');
const board = getDOM('board');
const menu = getDOM('menu');

socket.on('initial info', (data) => {
	console.log(data);
	updateUserNumber(data.users)
	data.rooms.forEach((room) => {
		createRoomCard(room);
	});
	loadCompleted();
});
socket.on('disconnect', () => {
	userid = undefined;
	createNotice('通信が切断されました');
})
socket.on('reconnect', () => {
	createNotice('通信が再開しました');
});

SDF('main-title', 'click', function() {
	socket.emit('debug');
})


const SE = new SEHandler();
SE.load();
SE.triedLoad(function() {
	if (SE.status === 'loaded') {
		console.log(`All sound effects loaded in ${new Date() - SE.initTime}ms`);
	} else {
		createNotice('音源の読み込みに失敗しました')
	}
});
SDF('allow_sound', 'click', function() { 
	SE.allowed = true;
	this.classList.remove('active');
	getDOM('forbit_sound').classList.add('active');
});
SDF('forbit_sound', 'click', function() {
	SE.allowed = false;
	this.classList.remove('active');
	getDOM('allow_sound').classList.add('active');
});
SDF('fail_img', 'click', () => SE.play('bomb'));
SDF('victory_img', 'click', () => SE.play('win'));

// user form
let username = localStorage.getItem('username');
if (username !== null) {
	user_form.classList.remove('active');
	main_options.classList.add('active');
	login(username);
} else {
	// set random name in conf_use_name
	f_username.value = randTextGenerator.getStrings('ja', 5);
	SDF(f_username, 'click', function() {this.value = ''});
}
SDF(user_form, 'submit', function(e) {
	e.preventDefault();
	e.stopPropagation();
	const name = f_username.value;
	if (name.length < 2 || name.length > 10) {
		createNotice('名前は2文字以上10文字以内にしてください');
		f_username.classList.add('warn')
	} else {
		username = name;
		localStorage.setItem('username', name);
		login(username);
		f_username.classList.remove('warn')
		user_form.classList.remove('active');
		main_options.classList.add('active');
	}
});
function login(name) {
	socket.emit('login', name)
	getDOM('bottom_username').textContent = name;
}

// main options (solo or multi)
SDF(f_solo, 'click', function() {
	main_options.classList.remove('active');
	openGameConfig('solo');
});
SDF(f_multi, 'click', function() {
	main_options.classList.remove('active');
	room_wrap.classList.add('active');
});

function openGameConfig(type) {
	const title = getDOM('g_config_title');
	const submit = getDOM('g_config_submit');
	const back = getDOM('g_config_back');
	back.addEventListener('click', function() { closeGameConfig(type) }, {
		once: true
	})
	if (type === 'solo') {
		g_config.classList.add('solo');
		title.textContent = 'ソロプレイ';
		submit.textContent = 'Start';
		
	} else if (type === 'multi') {
		g_config.classList.add('multi');
		title.textContent = 'マルチ設定';
		submit.textContent = 'ルーム作成';
	} else {
		console.error('不明なタイプで設定画面を開こうとしました');
		return;
	}
	g_config.classList.add('active')
}
function closeGameConfig(type) {
	if (type === 'solo') {
		g_config.classList.remove('active');
		g_config.classList.remove('solo');
		main_options.classList.add('active');
	} else if (type === 'multi') {
		g_config.classList.remove('active');
		g_config.classList.remove('multi');
		room_wrap.classList.add('active')
	} else {
		console.error('不明なタイプで設定画面を閉じようとしました');
	}
}

// rooms
SDF('create_room', 'click', function() {
	room_wrap.classList.remove('active');
	openGameConfig('multi')
})
SDF('room_back', 'click', function() {
	room_wrap.classList.remove('active');
	main_options.classList.add('active');
});

// create/destroy room
let myroom = undefined;
function createRoom(owner, width, height, bomb) {
	if (myroom !== undefined) {
		console.error("既にルームが作成されていて、消されていません");
		return;
	}

	const data = {owner: owner, width: width, height: height, bomb: bomb}
	socket.emit('create room', data);

	closeGameConfig('multi');
	room_wrap.classList.remove('active');
	waiting.classList.add('active');
}

socket.on('created your room', (room) => {
	myroom = room;
	getDOM('waiting_roomname').textContent = room.owner;
});

SDF('waiting_back', 'click', () => {
	socket.emit('destroy room', myroom.id);
	waiting.classList.remove('active');
	room_wrap.classList.add('active');
});

socket.on('destroyed your room', (id) => {
	myroom = undefined;
	createNotice(`あなたのルームは削除されました`);
})

socket.on('room added', (data) => {createRoomCard(data);});
socket.on('room removed', (id) => {
	getDOM(`room_card_${id}`).remove();
});
socket.on('your room removed', () => {
	createNotice('あなたの相手が切断しました', true);
})

// join the room
// emit-join is defined in createRoomCard()
socket.on('room matched', (id) => {
	const card = getDOM(`room_card_${id}`);
	const status = card.querySelector('.room_card_status');
	status.textContent = 'マッチ完了';
	card.dataset.status = 'ready';
	card.querySelector('.room_card_join').setAttribute('disabled', true);
})

socket.on('you got matched', (room) => {
	createNotice('マッチ成立！');
	const isOwner = room.id === socket.id;
	const opponent = isOwner ? room.player : room.owner;
	getDOM('ready_screen_opponent').textContent = opponent;
	if (isOwner) {
		waiting.classList.remove('active');
	} else {
		room_wrap.classList.remove('active');
	}
	ready.classList.add('active');

	const time = getDOM('game_start_in');
	time.textContent = 5;
	let count = 4;
	const countdownID = setInterval(() => {
		time.textContent = count;
		count--;
		if (count < 0) {
			clearInterval(countdownID);
			startMulti();
		}
	}, 1000);
	
});

function startMulti() {
	createNotice('GameStart!')
}

// game form
setDefValue();
function setDefValue() {
	f_width.value = localStorage.getItem('last_game_width') || 8;
	f_height.value = localStorage.getItem('last_game_height') || 10;
	f_bomb.value = localStorage.getItem('last_game_bomb_amount') || 20;
}
SDF(g_config, 'change', configValidation);
SDF(g_config, 'submit', function(e) {
	e.preventDefault();
	e.stopPropagation();
	const validation = configValidation();
	if (!validation.isOK) {
		validation.messages.forEach(msg => {
			createNotice(msg);
		});
		return;
	} 
	const j_width = parseInt(f_width.value);
	const j_height = parseInt(f_height.value);
	const j_bomb = parseInt(f_bomb.value);

	// solo or multi
	const gametype = g_config.classList.contains('solo') ? 'solo' : 'multi';
	if (gametype === 'solo') {
		initiate(j_width, j_height, j_bomb);
	} else if (gametype === 'multi') {
		createRoom(username, j_width, j_height, j_bomb);
	}
	
});

['low', 'medium', 'high', 'duper'].forEach(level => {
	SDF(`temp_${level}`, 'click', function() {
		setTemplate(level_templates[level])
	})
})
function setTemplate(array) {
	f_width.value = array[0];
	f_height.value = array[1];
	f_bomb.value = array[2];
}

async function initiate(width, height, bomb) {
	// decide #g_field size
	// client window size (c_) = #screen 's height, not window.height
	lobby.classList.remove('active');
	loadStart();
	await wait(1000);
	g_wrap.classList.add('active');

	const c_width = screen.clientWidth;
	const c_height = screen.clientHeight;

	console.log(`screen width: ${c_width}, height: ${c_height}`);

	let type; // layouttype
	if (c_width < c_height && c_width < 1024) {
		type = "A";
		if (c_width < 1024 && width > height) {
			createNotice('レイアウト調整のため指定した幅と高さが反転しました');
			[width, height] = [height, width];
		}
	} else if (width > height) {
		type = "B";
	} else if (width <= height) {
		type = "C";
	} else {
		type = undefined;
	}

	if (!type) {
		createNotice('画面の条件が満たされていないため開始できませんでした');
		return;
	}

	g_wrap.classList.add(`type_${type}`);
	g_field.classList.add(`type_${type}`);
	b_wrap.classList.add(`type_${type}`);
	board.classList.add(`type_${type}`);
	menu.classList.add(`type_${type}`);

	const field_w = g_field.clientWidth;
	const field_h = g_field.clientHeight;
	const squareSize = Math.min(Math.floor(field_w/width), Math.floor((field_h-50)/height));

	board.style.width = squareSize * width + 'px';
	board.style.height = squareSize * height + 'px';
	b_wrap.style.height = squareSize * height + 50 + 'px';

	// store data in localstorage
	localStorage.setItem('last_game_width', width);
	localStorage.setItem('last_game_height', height);
	localStorage.setItem('last_game_bomb_amount', bomb);

	minesweeper.onInit(function() {
		console.log(`playcount: ${this.playcount}`);
		loadCompleted()
		gamehandler(this, SE);
	})
	minesweeper.init(width, height, bomb, squareSize, type);

}

/**
 * validate 3 values (width, height, bombamount)
 * @returns {Object} .isOK (boolean)
 * @returns {Object} .messages (array)
 */
function configValidation() {
	let result = {
		isOK: true,
		messages: []
	};

	const inputs = [f_width, f_height, f_bomb];
	const names = ['幅','高さ','爆弾の数'];
	for (let i = 0; i < inputs.length; i++) {
		const input = inputs[i];
		const val = parseInt(input.value);
		if (isNaN(val)) {
			result.isOK = false;
			result.messages.push('入力は全て半角数字にしてください');
			return result;
		}
	}
	// now they are all numbers
	const W = f_width.value;
	const H = f_height.value;

	[f_width, f_height].forEach((input, i) => {
		const val = input.value;
		if (val < 6 || val > 50) {
			input.classList.add('warn');
			result.isOK = false;
			result.messages.push(`${names[i]}の大きさは6~50以内にしてください`);
		} else {
			input.classList.remove('warn');
		}
	});

	const bomb_validation = validateBomb();
	if(!bomb_validation.isOK) {
		f_bomb.classList.add('warn');
		result.isOK = false;
		result.messages.push(bomb_validation.msg)
	} else {
		f_bomb.classList.remove('warn');
	}

	const ratio = Math.max(W, H) / Math.min(W, H);
	if (ratio >= 2) {
		result.isOK = false;
		result.messages.push('幅と高さの差が大きすぎます');
	}

	return result;
}

function validateBomb() {
	let result = {
		isOK: true,
		msg: ''
	}
	const size = parseInt(f_width.value) * parseInt(f_height.value);
	const bomb_amout = parseInt(f_bomb.value);
	const max = Math.round(size*0.8);
	const min = Math.round(size*0.1);
	if (!bomb_amout || max < bomb_amout || min > bomb_amout) {
		result.isOK = false;
		result.msg = `爆弾は${min}以上${max}以下にしてください`
		return result;
	}
	return result;
}

SDF('open_menu_btn', 'click', function() {
	menu.classList.add('active')
})
SDF('close_menu_btn', 'click', function() {
	menu.classList.remove('active')
})

SDF('exit_btn', 'click', exit)
function exit() {
	minesweeper.exit();
	g_wrap.classList.remove('active');
	menu.classList.remove('active');
	lobby.classList.add('active');
}

document.querySelectorAll('.close_result_modal').forEach(elm => {
	elm.addEventListener('click', () => {
		getDOM('clear_modal').classList.remove('active');
		getDOM('fail_modal').classList.remove('active');
	})
})

document.querySelectorAll('.restart_btn').forEach(elm => {
	elm.addEventListener('click', function() {
		getDOM('clear_modal').classList.remove('active');
		getDOM('fail_modal').classList.remove('active');
		getDOM('loading_wrap').classList.remove('slideout');
		const width = minesweeper.width;
		const height = minesweeper.height;
		const bombAmount = minesweeper.bombAmount;
		minesweeper.onDestroy(() => {
			initiate(width, height, bombAmount)
		});
		minesweeper.exit();
	})
});


socket.on('users change', (num) => {
	updateUserNumber(num)
});
function updateUserNumber(num) {
	e_user_number.textContent = num
}
