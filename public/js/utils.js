'use strict';

export const socket = io();

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
 */
let notice_id = 0;
export function createNotice(msg) {
	const tmp = getDOM('notice_tmp');
	const wrap = getDOM('notice_wrap');
	const clone = tmp.content.cloneNode(true);
	const body = clone.querySelector('.notice');
	body.setAttribute('id', `notice_${notice_id}`);
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
			console.log('既に削除された通知を自動削除しようとした');
		}
	}, 6000);
	wrap.appendChild(clone);
	notice_id++;
}


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
export function getElmByCoord(x, y) {
	return document.querySelector(`[data-x='${x}'][data-y='${y}']`);
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
	getDOM('loading_wrap').classList.add('slideout')
}
export function loadStart() {
	getDOM('loading_wrap').classList.remove('slideout')
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