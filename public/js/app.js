'use strict';
import { initiate } from './GameHandler.js';
import { myroom } from './myroom.js';
import { SDF, getDOM, elms, wait, createNotice, createRoomCard, SE, socket, level_templates, loadCompleted, loadStart, randTextGenerator, openGameConfig, closeGameConfig } from './utils.js';

SE.load();
socket.on('initial info', (data) => {
	console.log(data);
	updateUserNumber(data.users)
	data.rooms.forEach((room) => {
		createRoomCard(room);
	});
	loadCompleted();
});
socket.on('disconnect', () => {
	createNotice('通信が切断されました', true);
})
socket.on('reconnect', () => {
	createNotice('通信が再開しました');
});
socket.on('log', (msg) => {
	createNotice(msg);
});

SDF('main-title', 'click', function() {
	socket.emit('debug');
});

setTimeout(() => {
	if (!socket.connected) {
		createNotice('error');
	}
}, 1000);


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
	elms.user_form.classList.remove('active');
	elms.main_options.classList.add('active');
	login(username);
} else {
	// set random name in conf_use_name
	elms.f_username.value = randTextGenerator.getStrings('ja', 5);
	SDF(elms.f_username, 'click', function() {this.value = ''});
}
SDF(user_form, 'submit', function(e) {
	e.preventDefault();
	e.stopPropagation();
	const name = elms.f_username.value;
	if (name.length < 2 || name.length > 10) {
		createNotice('名前は2文字以上10文字以内にしてください');
		elms.f_username.classList.add('warn')
	} else {
		username = name;
		localStorage.setItem('username', name);
		login(username);
		elms.f_username.classList.remove('warn')
		elms.user_form.classList.remove('active');
		elms.main_options.classList.add('active');
	}
});
function login(name) {
	socket.emit('login', name)
	getDOM('bottom_username').textContent = name;
}

// main options (solo or multi)
SDF(solo_btn, 'click', function() {
	elms.main_options.classList.remove('active');
	openGameConfig('solo');
});
SDF(multi_btn, 'click', function() {
	elms.main_options.classList.remove('active');
	elms.rooms_wrap.classList.add('active');
});


// rooms
SDF('create_room', 'click', function() {
	elms.rooms_wrap.classList.remove('active');
	openGameConfig('multi');
})
SDF('room_back', 'click', function() {
	elms.rooms_wrap.classList.remove('active');
	elms.main_options.classList.add('active');
});

// create/destroy room
function createRoom(owner, width, height, bomb) {
	if (myroom.valid) {
		console.error("既にルームが作成されていて、消されていません");
		return;
	}

	const data = {owner: owner, width: width, height: height, bomb: bomb}
	myroom.make();
	socket.emit('create room', data);

	closeGameConfig('multi');
	elms.rooms_wrap.classList.remove('active');
	elms.waiting_screen.classList.add('active');
}

socket.on('created your room', (room) => {
	myroom.server = room;
	getDOM('waiting_roomname').textContent = room.owner;
});

SDF('waiting_back', 'click', () => {
	socket.emit('destroy room', myroom.server.id);
	elms.waiting_screen.classList.remove('active');
	elms.rooms_wrap.classList.add('active');
});

socket.on('destroyed your room', (id) => {
	myroom.break();
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
	card.dataset.status = 'matched';
	card.querySelector('.room_card_join').setAttribute('disabled', true);
})

socket.on('you got matched', (room) => {
	createNotice('マッチ成立！');
	myroom.server = room;
	const isOwner = room.id === socket.id;
	const opponent = isOwner ? room.player : room.owner;
	getDOM('matched_screen_opponent').textContent = opponent;
	if (isOwner) {
		elms.waiting_screen.classList.remove('active');
	} else {
		elms.rooms_wrap.classList.remove('active');
	}
	elms.matched_screen.classList.add('active');

	const time = getDOM('game_start_in');
	time.textContent = 5;
	let count = 4;
	const countdownID = setInterval(() => {
		time.textContent = count;
		count--;
		if (count < 0) {
			clearInterval(countdownID);
			readyMulti(room.id);
			elms.matched_screen.classList.remove('active');
		}
	}, 1000);
	
});

// room start (ongame)
socket.on('room started', (id) => {
	const card = getDOM(`room_card_${id}`);
	const status = card.querySelector('.room_card_status');
	status.textContent = '対戦中';
	card.dataset.status = 'ongame';
	// card.querySelector('.room_card_observe').setAttribute('disabled', false);
});

function readyMulti(id) {
	socket.emit('game ready', id);
}
socket.on('start your game', (room) => {
	myroom.server = room;
	initiate('multi', room.width, room.height, room.bomb, room);
})


// game form
setDefValue();
function setDefValue() {
	elms.f_width.value = localStorage.getItem('last_game_width') || 8;
	elms.f_height.value = localStorage.getItem('last_game_height') || 10;
	elms.f_bomb.value = localStorage.getItem('last_game_bomb_amount') || 20;
}
SDF(elms.g_config, 'change', configValidation);
SDF(elms.g_config, 'submit', function(e) {
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
	localStorage.setItem('last_game_width', j_width);
	localStorage.setItem('last_game_height', j_height);
	localStorage.setItem('last_game_bomb_amount', j_bomb);

	// solo or multi
	const type = elms.g_config.classList.contains('solo') ? 'solo' : 'multi';
	if (type === 'solo') {
		initiate('solo' ,j_width, j_height, j_bomb);
	} else if (type === 'multi') {
		createRoom(username, j_width, j_height, j_bomb);
	}
	
});

['low', 'medium', 'high', 'duper'].forEach(level => {
	SDF(`temp_${level}`, 'click', function() {
		setTemplate(level_templates[level])
	})
})
function setTemplate(array) {
	elms.f_width.value = array[0];
	elms.f_height.value = array[1];
	elms.f_bomb.value = array[2];
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
	const W = elms.f_width.value;
	const H = elms.f_height.value;

	[elms.f_width, elms.f_height].forEach((input, i) => {
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
		elms.f_bomb.classList.add('warn');
		result.isOK = false;
		result.messages.push(bomb_validation.msg)
	} else {
		elms.f_bomb.classList.remove('warn');
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
	const size = parseInt(elms.f_width.value) * parseInt(elms.f_height.value);
	const bomb_amout = parseInt(elms.f_bomb.value);
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
	elms.menu.classList.add('active');
});
SDF('close_menu_btn', 'click', function() {
	elms.menu.classList.remove('active');
});


socket.on('users change', (num) => {
	updateUserNumber(num)
});
function updateUserNumber(num) {
	elms.user_number.textContent = num
}
