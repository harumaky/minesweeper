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
export function createNotice(msg) {
	const tmp = getDOM('notice_tmp');
	const wrap = getDOM('notice_wrap');
	const clone = tmp.content.cloneNode(true);
	const msg_elm = clone.querySelector('.notice_msg');
	const close_btn = clone.querySelector('.notice_close');
	msg_elm.textContent = msg;
	close_btn.addEventListener('click', function() {
		wrap.removeChild(this.parentNode);
	})
	wrap.appendChild(clone);
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