'use strict';
import { SEHandler } from './SEHandler.js';
export const env = document.querySelector('html').dataset.env;
export const SE = new SEHandler();
export const socket = io();

export function devlog(msg) {
	if (env === 'development') {
		console.log(msg);
	}
}

/**
 * wait
 * @param {Number} ms 
 * @example 
 * 
 * wait(100).then(() => {hoge})
 * or
 * in async func,
 * await wait(100)
 * hoge
 */
export function wait(ms) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}


/**
 * Set Dom Function
 * ターゲットはDOMそのものでも、IDでもいい
 * @param {} target dom id or elm
 * @param {String} type ex. click
 * @param {Function} func callback
 */
export function SDF(target, type, func) {
	let elm = typeof target === 'string' ? document.getElementById(target) : target;
	if (elm === null) {
		console.error(`${target} not found`);
		return;
	}
	elm.addEventListener(type, func);
}

/**
 * Get Dom by id
 * @param {String} id dom id
 * @returns {DOMElement}
 */
export function getDOM(id) {
	let elm = document.getElementById(id);
	if (elm === null) {
		console.error(`${id} not found`);
		return;
	}
	return elm;
}

/**
 * add notice
 * @param {*} msg 
 * @param {boolean} important default: false
 */
let notice_id = 0;
export function createNotice(msg, important = false) {
	const tmp = getDOM('notice_tmp');
	const wrap = getDOM('notice_wrap');
	const clone = tmp.content.cloneNode(true);
	const body = clone.querySelector('.notice');
	body.setAttribute('id', `notice_${notice_id}`);
	if (important) body.classList.add('important');
	const msg_elm = clone.querySelector('.notice_msg');
	const close_btn = clone.querySelector('.notice_close');
	msg_elm.textContent = msg;
	close_btn.addEventListener('click', function() {
		wrap.removeChild(body);
	})
	setTimeout(() => {
		try {
			wrap.removeChild(body);
		} catch(e) {
			devlog('既に削除された通知を自動削除しようとした');
		}
	}, 6000);
	wrap.prepend(clone);
	notice_id++;
}

/**
 * create room card (not room)
 * @param {*} arg
 * arg.id
 * arg.owner
 * arg.width
 * arg.height
 * arg.bomb
 * arg.status (waiting/matched/ongame)
 */
export function createRoomCard(arg) {
	const tmp = getDOM('room_card_tmp');
	const rooms = getDOM('rooms');
	const clone = tmp.content.cloneNode(true);
	const card = clone.querySelector('.room_card');
	card.setAttribute('id', `room_card_${arg.id}`);
	const status = arg.status;
	card.dataset.status = status;
	clone.querySelector('.room_card_status').textContent = roomStatusToJP[status];
	clone.querySelector('.room_card_owner').textContent = arg.owner;
	clone.querySelector('.room_card_width').textContent += arg.width;
	clone.querySelector('.room_card_height').textContent += arg.height;
	clone.querySelector('.room_card_bomb').textContent += arg.bomb;
	const join_btn = clone.querySelector('.room_card_join');
	const observe_btn = clone.querySelector('.room_card_observe');
	join_btn.dataset.roomid = arg.id;
	join_btn.addEventListener('click', () => {socket.emit('join room', arg.id)});
	observe_btn.dataset.roomid = arg.id;
	if (status !== 'waiting') {
		join_btn.setAttribute('disabled', true);
	}
	if (status !== 'ongame') {
		observe_btn.setAttribute('disabled', true);
	}
	rooms.prepend(clone);
}
const roomStatusToJP = {
	waiting: '受付中',
	matched: 'マッチ完了',
	ongame: '対戦中',
	ended: '終了'
}

function setElms() {
	const elm_ids = [
		'screen', 'lobby', 'user_number', 'user_form', 'f_username', 'main_options', 
		'solo_btn', 'multi_btn', 'rooms_wrap', 'waiting_screen', 'matched_screen', 'g_config', 
		'f_width', 'f_height', 'f_bomb', 'g_wrap', 'g_field', 'board', 'b_wrap', 'b_status', 
		'menu', 'sel', 'sel_mask', 'sel_cancel', 'sel_dig', 'sel_flag', 'sel_unflag', 'h_flags', 'h_time',
		'clear_result_time', 'fail_result_time',
		'opp', 'opp_head', 'opp_field', 'opp_name', 'opp_status', 'opp_width', 'opp_height', 'opp_flags', 'opp_wrap', 'opp_board', 'opp_waiting',
		'chat_wrap', 'chat_form', 'chat_input', 'chat_tmp', 'chat_area'
	];
	let elms = {};
	for (let i = 0; i < elm_ids.length; i++) {
		elms[elm_ids[i]] = getDOM(elm_ids[i]);
	}
	return elms;
}
export const elms = setElms();

export function shuffle(arr) {
	for (let i = arr.length - 1; i >= 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}
export function flatten(data) {
	return data.reduce((acm, e) => Array.isArray(e) ? acm.concat(flatten(e)) : acm.concat(e), []);
}
export function getElmByCoord(x, y, opp = false) {
	if (!opp) {
		return document.querySelector(`.board [data-x='${x}'][data-y='${y}']`);
	} 
	return document.querySelector(`.opp_board [data-x='${x}'][data-y='${y}']`);
}

/**
 * c
 * @param {Number} size 
 * @param {Number} bomb 
 * @param {Number} digged 
 * @returns {Number} % (to one decimal place)
 */
export function calcProgress(size, bomb, digged) {
	return Math.round((digged / (size - bomb)) * 1000) / 10;
}

/**
 * make DOM's width and height same size
 * @param {DOMElement} elm 
 * @param {Number} size 
 */
export function setStyleSquare(elm, size) {
	elm.style.width = size + 'px';
	elm.style.height = size + 'px';
}

export function setTopLeft(elm, top, left) {
	elm.style.top = top + 'px';
	elm.style.left = left + 'px';
}

export const level_templates = {
	// W, H, Bomb
	low: [10, 8, 10],
	medium: [18, 14, 40],
	high: [24, 20, 99],
	duper: [36, 30, 270]
}

export function loadCompleted() {
	getDOM('loading_wrap').classList.add('slideout');
}
export function loadStart() {
	getDOM('loading_wrap').classList.remove('slideout');
}

export function isMultiByDOM() {
	return getDOM('board').classList.contains('multi');
}

export function openGameConfig(type) {
	const title = getDOM('g_config_title');
	const submit = getDOM('g_config_submit');
	const back = getDOM('g_config_back');
	back.addEventListener('click', function() { closeGameConfig(type) }, {
		once: true
	})
	if (type === 'solo') {
		elms.g_config.classList.add('solo');
		title.textContent = 'ソロプレイ';
		submit.textContent = 'Start';
		
	} else if (type === 'multi') {
		elms.g_config.classList.add('multi');
		title.textContent = 'マルチ設定';
		submit.textContent = 'ルーム作成';
	}
	elms.g_config.classList.add('active');
}
export function closeGameConfig(type) {
	if (type === 'solo') {
		elms.g_config.classList.remove('active');
		elms.g_config.classList.remove('solo');
		elms.rooms_wrap.classList.remove('active'); // for some reason
		elms.main_options.classList.add('active');
	} else if (type === 'multi') {
		elms.g_config.classList.remove('active');
		elms.g_config.classList.remove('multi');
		elms.rooms_wrap.classList.add('active')
	} else {
		console.error('不明なタイプで設定画面を閉じようとしました');
	}
}

class RandomTextGenerator {
	constructor() {
		this.strCodes = {
			ja : [
				{ //hiragana
					start: 0x3041,
					end: 0x3094
				},
				{ //katakana
					start: 0x30a1,
					end: 0x30f4
				}
			],
			en: {
				start: 0x021,
				end: 0x07E
			}
		};
	}
	checkType(type, obj) {
		let clas = Object.prototype.toString.call(obj).slice(8, -1);
		return obj !== undefined && obj !== null && clas === type;
	};
	getString(langCode) {
		langCode = langCode || 'ja';
		let lang = this.strCodes[langCode], result = [];
		if(this.checkType('Array', lang)){
			let i = 0, length = lang.length;
			for(; i < length; i += 1){
				result.push( String.fromCharCode( Math.floor( Math.random() * (lang[i].end - lang[i].start + 1 ) + lang[i].start ) ) );
			}
			result = result[ Math.floor(Math.random() * result.length)].replace(/\s/g, '');
		}else{
			result = String.fromCharCode( Math.floor( Math.random() * ( lang.end - lang.start + 1 ) ) );
		}
		return result.toString();
	};
	getStrings(langCode, length) {
		length = length || 1;
		let i = 0, result = [];
		for(; i < length; i += 1){
			result.push(this.getString(langCode));
		}
		return result.join('');
	};
};
export const randTextGenerator = new RandomTextGenerator();

export function formatDate(date, format) {
	if (!format) format = 'YYYY-MM-DD hh:mm:ss.SSS';
	format = format.replace(/YYYY/g, date.getFullYear());
	format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
	format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
	format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
	format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
	format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
	if (format.match(/S/g)) {
	  let milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
	  let length = format.match(/S/g).length;
	  for (let i = 0; i < length; i++) format = format.replace(/S/, milliSeconds.substring(i, i + 1));
	}
	return format;
  };